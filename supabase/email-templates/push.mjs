/**
 * Pushes the generated SultiAI auth email templates to the hosted Supabase
 * project through the Management API.
 *
 * Required environment variables (never commit them):
 *   SUPABASE_ACCESS_TOKEN  Personal access token (sbp_...) or CLI session token
 *   SUPABASE_PROJECT_REF   e.g. pptanwtuybivlqeyntwh
 *
 * Usage:
 *   node supabase/email-templates/build.mjs
 *   node supabase/email-templates/push.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN.');
  process.exit(1);
}
if (!projectRef) {
  console.error('Missing SUPABASE_PROJECT_REF.');
  process.exit(1);
}

const subjects = JSON.parse(readFileSync(join(DIR, 'subjects.json'), 'utf8'));
const names = [
  'confirmation',
  'recovery',
  'invite',
  'magic_link',
  'email_change',
  'reauthentication',
  'password_changed_notification',
];

const payload = {};
for (const name of names) {
  const html = readFileSync(join(DIR, `${name}.html`), 'utf8');
  payload[`mailer_subjects_${name}`] = subjects[name];
  payload[`mailer_templates_${name}_content`] = html;
}

// Keep the security notification off while Resend is in test mode: it only
// delivers to the Resend account owner, so enabling it would silently fail
// for every other learner. Turn it on after the sending domain is verified.
payload.mailer_notifications_password_changed_enabled = false;

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }
);

const text = await res.text();
if (!res.ok) {
  console.error('PUSH_FAILED', res.status, text.slice(0, 1000));
  process.exit(1);
}

const cfg = JSON.parse(text);
const summary = {};
for (const name of names) {
  summary[name] = {
    subject: cfg[`mailer_subjects_${name}`],
    bytes: (cfg[`mailer_templates_${name}_content`] || '').length,
  };
}
console.log('PUSH_OK', JSON.stringify(summary, null, 2));
