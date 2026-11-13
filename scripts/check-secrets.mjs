#!/usr/bin/env node
/**
 * Repository secret scanner.
 *
 * Usage:
 *   node scripts/check-secrets.mjs            # scan tracked + untracked, non-ignored files
 *   node scripts/check-secrets.mjs --staged   # scan only files staged for commit
 *
 * The scanner never prints a full secret. It reports the file, line, rule and a
 * redacted length so a leak can be found without copying the value into logs.
 *
 * It intentionally uses only Node built-ins and `git`, so it works in a
 * pre-commit hook and in CI before `npm ci` has run.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const SELF = path.resolve(fileURLToPath(import.meta.url));
const STAGED = process.argv.includes('--staged');
const MAX_FILE_BYTES = 1_000_000;
const MAX_FINDINGS = 200;
const CONCURRENCY = 16;

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.expo',
  '.gradle',
  'venv',
  '__pycache__',
]);

const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.bmp',
  '.svg',
  '.pdf',
  '.zip',
  '.gz',
  '.tar',
  '.7z',
  '.mp3',
  '.wav',
  '.ogg',
  '.m4a',
  '.mp4',
  '.mov',
  '.webm',
  '.onnx',
  '.bin',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.map',
]);

const SKIP_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
]);

// Public by design. These are safe in a browser bundle and must not be
// reported as leaks (Supabase RLS is what protects the data).
const PUBLIC_ENV_ALLOWLIST = new Set([
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
]);

const SECRET_NAME_RE =
  /(?:secret|token|password|passwd|api[_-]?key|private[_-]?key|access[_-]?key|client[_-]?secret|service[_-]?role|jwt|elevenlabs[_-](?:api[_-]?key|key))/i;

const PUBLIC_ENV_NAME_RE =
  /^(?:VITE|EXPO_PUBLIC|NEXT_PUBLIC)_[A-Z0-9_]+$/;

const TEST_OR_FIXTURE_LINE_RE =
  /(?:\b(?:test|tests|spec|fixture|fixtures|mock|mocks)\b|\.test\.|\.spec\.|__tests__|__mocks__)/i;

const PROVIDER_RULES = [
  { id: 'resend-api-key', re: /\bre_[A-Za-z0-9]{20,}\b/g },
  { id: 'openai-api-key', re: /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g },
  { id: 'groq-api-key', re: /\bgsk_[A-Za-z0-9]{20,}\b/g },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { id: 'xai-api-key', re: /\bxai-[A-Za-z0-9]{20,}\b/g },
  {
    id: 'github-token',
    re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  },
  { id: 'slack-token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { id: 'stripe-key', re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b/g },
  { id: 'aws-access-key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { id: 'supabase-secret-key', re: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g },
  {
    id: 'elevenlabs-api-key',
    re: /ELEVENLABS_(?:API_KEY|KEY_[A-Z0-9_]+)\s*[:=]\s*['"]?([a-f0-9]{32,})['"]?/gi,
    group: 1,
  },
  {
    id: 'private-key-header',
    re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    literal: true,
  },
];

const JWT_RE = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const GENERIC_ASSIGNMENT_RE =
  /(?<!\.)\b([A-Za-z_][A-Za-z0-9_]*)\s*[:=]\s*(['"`])([^'"`\r\n]{24,})\2/g;
const ENV_ASSIGNMENT_RE = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/;
const PUBLIC_ENV_REFERENCE_RE =
  /\b(?:import\.meta\.env|process\.env)\.((?:VITE|EXPO_PUBLIC|NEXT_PUBLIC)_[A-Z0-9_]+)\b/g;

const findings = [];
const seenFindings = new Set();
let truncated = false;

function addFinding(file, line, rule, preview) {
  if (findings.length >= MAX_FINDINGS) {
    truncated = true;
    return;
  }
  const key = `${file}:${line}:${rule}:${preview}`;
  if (seenFindings.has(key)) return;
  seenFindings.add(key);
  findings.push({ file, line, rule, preview });
}

function mask(value) {
  return `[redacted, ${value.length} chars]`;
}

function isPlaceholder(value) {
  const v = value.trim();
  if (!v) return true;
  if (v.length < 12) return true;
  if (/^(?:x+|0+|\*+|\.+|_+|-+|\?+|#+)$/i.test(v)) return true;
  if (/^(?:true|false|null|undefined|none|changeme|change_me|password|secret|token)$/i.test(v)) {
    return true;
  }
  if (
    /your[_-]|example|placeholder|dummy|sample|redacted|not[_-]?set|change[_-]?me|todo|fixme|xxx|\.\.\.|<[^>]*>/i.test(
      v,
    )
  ) {
    return true;
  }
  if (/\$\{|\$\(|\benv\(|process\.env|import\.meta\.env|os\.environ|getenv/i.test(v)) return true;
  return false;
}

function looksLikeHumanMessage(value) {
  const v = value.trim();
  if (/\s/.test(v) && /[.!?]$/.test(v)) return true;
  return /\b(?:must|required|invalid|please|enter|error|failed|characters?|at least|not valid)\b/i.test(
    v,
  );
}

function isPlaceholderLine(line) {
  return (
    /(?:your[_-]|changeme|change[_-]?me|example|placeholder|dummy|sample|redacted|not[_-]?set|todo|fixme|<[^>]+>|\bxxx+\b)/i.test(
      line,
    ) || /(?:process\.env|import\.meta\.env|os\.environ|getenv|\benv\()/i.test(line)
  );
}

function isEnvLike(relativePath) {
  const base = path.basename(relativePath);
  return base === '.env' || base === '.envrc' || base.startsWith('.env.');
}

function isForbiddenEnvFile(relativePath) {
  const base = path.basename(relativePath);
  if (base === '.env' || base === '.envrc') return true;
  return base.startsWith('.env.') && !base.endsWith('.example');
}

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
      'utf8',
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function gitOutput(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function listFiles() {
  const args = STAGED
    ? ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']
    : ['ls-files', '-z', '--cached', '--others', '--exclude-standard'];
  return gitOutput(args).split('\0').filter(Boolean);
}

function shouldSkip(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  if (parts.some((part) => SKIP_DIRS.has(part))) return true;
  if (parts.some((part) => part === 'node_modules')) return true;

  const base = parts[parts.length - 1] || '';
  if (SKIP_FILES.has(base)) return true;
  if (SKIP_EXTENSIONS.has(path.extname(base).toLowerCase())) return true;
  if (path.resolve(ROOT, relativePath) === SELF) return true;
  return false;
}

function scanText(relativePath, text) {
  if (isForbiddenEnvFile(relativePath)) {
    addFinding(
      relativePath,
      1,
      'tracked-env-file',
      'environment file must not be committed; commit .env.example instead',
    );
  }

  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    if (line.length > 20_000) continue;

    const placeholderLine = isPlaceholderLine(line);

    // Provider-specific key formats.
    for (const rule of PROVIDER_RULES) {
      rule.re.lastIndex = 0;
      for (const match of line.matchAll(rule.re)) {
        const value = rule.group ? match[rule.group] : match[0];
        if (!value) continue;
        if (!rule.literal && isPlaceholder(value)) continue;
        if (placeholderLine && !rule.literal) continue;
        addFinding(
          relativePath,
          lineNumber,
          rule.id,
          rule.literal ? 'PEM private-key header found' : mask(value),
        );
      }
    }

    // Supabase service-role JWTs (anon keys are public and intentionally skipped).
    for (const match of line.matchAll(JWT_RE)) {
      const token = match[0];
      if (isPlaceholder(token)) continue;
      const payload = decodeJwtPayload(token);
      if (payload && (payload.role === 'service_role' || payload.role === 'supabase_admin')) {
        addFinding(relativePath, lineNumber, 'supabase-service-role-jwt', mask(token));
      }
    }

    // .env-style assignments (quoted or unquoted).
    if (isEnvLike(relativePath)) {
      const envMatch = line.match(ENV_ASSIGNMENT_RE);
      if (envMatch && !line.trimStart().startsWith('#')) {
        const [, name, rawValue] = envMatch;
        const value = rawValue.replace(/^["']|["']$/g, '').trim();
        if (value && !isPlaceholder(value) && !PUBLIC_ENV_ALLOWLIST.has(name)) {
          if (PUBLIC_ENV_NAME_RE.test(name)) {
            if (SECRET_NAME_RE.test(name)) {
              addFinding(
                relativePath,
                lineNumber,
                'public-prefixed-secret',
                `${name} looks secret but is embedded in the browser bundle by Vite/Expo`,
              );
            }
          } else if (SECRET_NAME_RE.test(name)) {
            addFinding(relativePath, lineNumber, 'env-secret-value', `${name}=${mask(value)}`);
          }
        }
      }
      continue;
    }

    // Quoted assignments in source/config files.
    for (const match of line.matchAll(GENERIC_ASSIGNMENT_RE)) {
      const [, name, , value] = match;
      if (!SECRET_NAME_RE.test(name)) continue;
      if (PUBLIC_ENV_ALLOWLIST.has(name)) continue;
      if (isPlaceholder(value)) continue;
      if (placeholderLine) continue;
      if (looksLikeHumanMessage(value)) continue;
      if (TEST_OR_FIXTURE_LINE_RE.test(relativePath) || TEST_OR_FIXTURE_LINE_RE.test(line)) {
        if (/\b(?:test|mock|dummy|fake|sample|fixture)\b/i.test(value)) continue;
      }
      addFinding(relativePath, lineNumber, 'generic-secret-assignment', mask(value));
    }

    // References to public-prefixed variables that look like secrets.
    for (const match of line.matchAll(PUBLIC_ENV_REFERENCE_RE)) {
      const name = match[1];
      if (PUBLIC_ENV_ALLOWLIST.has(name)) continue;
      if (!SECRET_NAME_RE.test(name)) continue;
      addFinding(
        relativePath,
        lineNumber,
        'public-prefixed-secret-reference',
        `${name} would be exposed to the browser`,
      );
    }
  }
}

async function scanFile(relativePath) {
  let text;

  if (STAGED) {
    // Read the staged blob, not the working copy: a partially staged change
    // could otherwise hide a secret from the pre-commit hook.
    try {
      const buffer = execFileSync('git', ['show', `:${relativePath}`], {
        cwd: ROOT,
        maxBuffer: MAX_FILE_BYTES + 1,
      });
      if (buffer.length > MAX_FILE_BYTES || buffer.includes(0)) return null;
      text = buffer.toString('utf8');
    } catch {
      return null;
    }
  } else {
    const absolutePath = path.resolve(ROOT, relativePath);
    let info;
    try {
      info = await stat(absolutePath);
    } catch {
      return null;
    }
    if (!info.isFile() || info.size > MAX_FILE_BYTES) return null;

    try {
      text = await readFile(absolutePath, 'utf8');
    } catch {
      return null;
    }
    if (text.includes('\u0000')) return null;
  }

  scanText(relativePath, text);
  return relativePath;
}

function collectWarnings() {
  const warnings = [];
  if (/OneDrive/i.test(ROOT)) {
    const localEnvFiles = ['.env', 'server/.env', 'admin/.env.local', 'web/.env.local'].filter(
      (file) => existsSync(path.join(ROOT, file)),
    );
    if (localEnvFiles.length > 0) {
      warnings.push(
        `Local env files are inside a OneDrive-synced folder (${localEnvFiles.join(
          ', ',
        )}). Git ignores them, but OneDrive still uploads them to the cloud.`,
      );
    }
  }
  if (existsSync(path.join(ROOT, 'server', '.env'))) {
    warnings.push(
      'server/.env is loaded as a legacy fallback by server.ts. Merge unique keys into the root .env before removing it.',
    );
  }
  return warnings;
}

async function main() {
  let files;
  try {
    files = listFiles();
  } catch {
    console.error('Unable to list files. Run this script from a Git checkout with git installed.');
    process.exit(2);
  }

  const targets = files.filter((file) => !shouldSkip(file));
  if (targets.length === 0) {
    console.log(STAGED ? 'No staged files to scan.' : 'No files to scan.');
    process.exit(0);
  }

  let cursor = 0;
  let scanned = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
    while (cursor < targets.length) {
      const relativePath = targets[cursor];
      cursor += 1;
      const result = await scanFile(relativePath);
      if (result) scanned += 1;
    }
  });
  await Promise.all(workers);

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  const warnings = collectWarnings();
  if (warnings.length > 0) {
    console.log('Warnings:');
    for (const warning of warnings) console.log(`  ! ${warning}`);
    console.log('');
  }

  if (findings.length === 0) {
    console.log(
      `No secrets detected in ${scanned} file(s)${STAGED ? ' staged for commit' : ''}.`,
    );
    process.exit(0);
  }

  const uniqueFiles = new Set(findings.map((finding) => finding.file)).size;
  console.error(
    `Found ${findings.length} potential secret(s) in ${uniqueFiles} file(s):\n`,
  );
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line}  [${finding.rule}]  ${finding.preview}`);
  }
  if (truncated) {
    console.error(`\nOutput truncated at ${MAX_FINDINGS} findings.`);
  }
  console.error(
    '\nRemove the secret, rotate it at the provider, and keep real values only in .env.',
  );
  process.exit(1);
}

main().catch((error) => {
  console.error('Secret scan failed:', error instanceof Error ? error.message : error);
  process.exit(2);
});
