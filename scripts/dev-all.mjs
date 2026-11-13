// Runs BOTH apps together for local development:
//   - Learner app (server.ts)        -> http://localhost:3000  (SPA + AI endpoints)
//   - Admin app   (admin/server.ts)  -> http://localhost:5000  (console + /api/admin)
//
// No extra dependency needed (uses Node's child_process).
import { spawn } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const procs = [
  { name: 'learner', args: ['tsx', 'server.ts'], color: '\u001b[36m' }, // cyan
  { name: 'admin', args: ['tsx', 'admin/server.ts'], color: '\u001b[35m' }, // magenta
];

const RESET = '\u001b[0m';
const children = [];

function prefixStream(stream, name, color) {
  stream.on('data', (chunk) => {
    const text = chunk.toString().trimEnd();
    for (const line of text.split(/\r?\n/)) {
      process.stdout.write(`${color}[${name}]${RESET} ${line}\n`);
    }
  });
}

for (const p of procs) {
  const child = spawn(npmCmd, p.args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true });
  prefixStream(child.stdout, p.name, p.color);
  prefixStream(child.stderr, p.name, p.color);
  child.on('exit', (code) => {
    process.stdout.write(`${p.color}[${p.name}]${RESET} exited with code ${code}\n`);
  });
  children.push(child);
}

function shutdown() {
  for (const c of children) {
    try {
      c.kill();
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
console.log('Starting SultiAI Learner app (:3030) and Admin app (:5000)...');
