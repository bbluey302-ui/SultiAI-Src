# Secrets & API Key Handling

This project talks to Supabase, AI providers, ElevenLabs, Resend SMTP, and
payment details. Treat every credential as production data, even during local
development.

## TL;DR

- Real values live only in `.env` files **outside Git**. `.env.example` is the
  only env file that belongs in the repository, and it must contain placeholders.
- Run `npm run check:secrets` before committing. The pre-commit hook and CI run
  the same scanner automatically.
- Rotate any key that was ever committed, pasted into chat, or shared in a
  screenshot. Removing it from the current file is not enough.
- Never use `VITE_` or `EXPO_PUBLIC_` for a secret. Those values are inlined
  into the browser bundle.

## Current audit (2026-10-24)

The scanner passes on the current working tree. During the audit it found
historical exposure that still requires action:

| Finding | Status | Required action |
| --- | --- | --- |
| `scripts/supabase-confirm-user.sh` contained a hardcoded Supabase **service-role JWT** | Removed from HEAD; the script now reads `SUPABASE_SERVICE_ROLE_KEY` from the environment | **Rotate the key.** Git history still contains it. Review auth/admin logs and RLS. |
| `admin/.env.example` contained a real `sb_secret_...` key | Replaced with a placeholder | **Rotate the key** in Supabase → Project Settings → API. |
| Resend API key was shared in chat | Not stored in this repo | Revoke it in Resend, create a new one, and update the Supabase SMTP password. |
| AI provider keys may have been shared earlier | Not stored in this repo | Rotate at each provider before production. |
| `.env` files live under `C:\Users\...\OneDrive\...` | Git-ignored, but still synced | Move the project out of OneDrive or exclude `.env*` from sync. |

`.env` is not tracked and has no Git history. `.env.example` was checked and
contains placeholders, not real keys. The scanner is the source of truth; re-run
it after any change.

## Where secrets live

| Location | Purpose | Git status |
| --- | --- | --- |
| `.env` (root) | Main server keys, Supabase, AI providers, ElevenLabs, public `VITE_`/`EXPO_PUBLIC_` values | Ignored |
| `server/.env` | Legacy fallback loaded by `server.ts` (`override: false`), contains Deepgram/xAI/JWT values | Ignored |
| `admin/.env.local` | Admin console server secret | Ignored |
| `web/.env.local` | Web workspace local values | Ignored |
| `.env.example`, `admin/.env.example`, `server/.env.example`, `web/.env.example` | Templates with placeholder values | Safe to commit |
| Supabase Edge Function secrets | `supabase secrets set ...` | Not in repo |
| Production hosting | Host environment variables / secret manager | Not in repo |

`server/.env` is loaded as a legacy fallback by `server.ts`:

```ts
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), 'server', '.env'), override: false });
```

Merge its unique keys into the root `.env` before removing it, then delete the
second `dotenv.config` call.

## Public vs. secret

Public by design (safe in the browser bundle):

- `SUPABASE_URL`, `VITE_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, and their `VITE_`/`EXPO_PUBLIC_` forms
- `VITE_GCASH_NUMBER` — it is a payment destination, meant to be shown to learners
- `VITE_API_URL` / `EXPO_PUBLIC_API_URL`

Must stay server-side:

- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`
- `JWT_SECRET`
- `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2`, `NVIDIA_API_KEY`,
  `GEMINI_API_KEY`, `DEEPGRAM_API_KEY`, `XAI_API_KEY`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_KEY_*`
- Resend API key and SMTP password
- Google OAuth client secret
- Private keys, keystores, and service-account JSON

A Supabase **anon/publishable** key is public by design; RLS protects the data.
The **service-role/secret** key bypasses RLS and must never reach the client.

## The prefix rule

Vite inlines every `VITE_*` value at build time. Expo inlines every
`EXPO_PUBLIC_*` value. Anyone who can load the app can read them.

```bash
# WRONG — the key is shipped to every visitor
VITE_OPENROUTER_API_KEY=sk-<redacted>

# RIGHT — the browser calls the backend, the backend reads the key
OPENROUTER_API_KEY=sk-<redacted>
```

The scanner fails when a `VITE_`/`EXPO_PUBLIC_`/`NEXT_PUBLIC_` variable that
looks like a secret has a real value, and when source code references such a
name at all.

## Rotation checklist

Rotate in the provider dashboard first, then update `.env` and deployment
secrets. Do not just delete the old value.

| Provider | Where to rotate | Variables to update |
| --- | --- | --- |
| Supabase service role / secret key | Supabase Dashboard → Project Settings → API | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`; update admin/server consumers |
| Supabase JWT secret | Supabase Dashboard → Project Settings → API → JWT Settings | `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`; invalidates existing sessions and legacy JWTs |
| App `JWT_SECRET` | Generate a new random value | `JWT_SECRET` in `.env` / `server/.env`; invalidates app-issued tokens |
| Resend | resend.com/api-keys | `RESEND_API_KEY` (if used) and the Supabase SMTP password |
| ElevenLabs (5 keys) | elevenlabs.io → Profile → API Keys | `ELEVENLABS_KEY_JEN`, `_ADAM`, `_GENTECH`, `_KEVIN`, `_MIKA`, `ELEVENLABS_API_KEY` |
| OpenRouter (2 keys) | openrouter.ai/keys | `OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2` |
| NVIDIA | build.nvidia.com → API Keys | `NVIDIA_API_KEY` |
| Google Gemini | aistudio.google.com/apikey | `GEMINI_API_KEY` |
| Groq | console.groq.com/keys | `GROQ_API_KEY` |
| xAI | console.x.ai | `XAI_API_KEY` |
| Deepgram | console.deepgram.com | `DEEPGRAM_API_KEY` |
| Google OAuth client | Google Cloud Console → APIs & Services → Credentials | Client secret in Supabase → Authentication → Providers → Google |

Generate a JWT secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

After rotating the Supabase service-role key, re-run the admin console and any
script that uses the service role. After rotating the Supabase JWT secret, all
users must sign in again. Rotating the app `JWT_SECRET` invalidates app-issued
tokens only.

## OneDrive is not a secret store

Git ignoring `.env` does **not** stop OneDrive from uploading it. The project
currently lives under a OneDrive-synced Desktop folder, so every `.env` file is
copied to Microsoft's cloud and to any other device signed into the same
account.

Options, in order of preference:

1. Move the project outside OneDrive (for example `C:\dev\SultiAI`).
2. Exclude the project or its `.env*` files from OneDrive sync.
3. Store secrets in a secret manager (1Password, Doppler, Infisical) and inject
   them at runtime instead of keeping a plaintext `.env` on disk.

Encrypting the file at rest is not a substitute for limiting where it is synced.

## Production deployment

- Set environment variables in the hosting platform (Render, Railway, Fly.io,
  Vercel server env, Docker secrets, etc.). Do not upload `.env`.
- Keep `.env*` in `.dockerignore` and never copy it into an image.
- `VITE_*` values are build-time public. Only put public values there.
- Use `supabase secrets set` for Edge Function secrets; never commit them.
- Use a separate Supabase project for production and rotate keys on a schedule.
- Update Supabase **Site URL** and **Redirect URLs** to the production origin
  before deploying; `localhost` URLs are development-only.

## Running the scanner

```bash
npm run check:secrets          # tracked + untracked, non-ignored files
npm run check:secrets:staged   # only files staged for commit
```

The scanner reports `file:line` plus a redacted length. It never prints the
full value. Rules include:

- Provider key formats (Resend, OpenAI, Groq, Google, xAI, GitHub, Slack,
  Stripe, AWS, ElevenLabs, Supabase `sb_secret_`)
- Supabase service-role JWTs (the JWT payload is decoded; anon JWTs are allowed)
- Tracked `.env` files
- `VITE_`/`EXPO_PUBLIC_`/`NEXT_PUBLIC_` names that look like secrets
- Generic assignments to names containing secret/token/key/password

The pre-commit hook runs the staged scan before `lint-staged`. The CI
`Security Scan` job runs the full scan before installing dependencies.

The scanner does **not** scan Git history. If `gitleaks` is available, run:

```bash
gitleaks detect --source . --redact
```

## If a key leaks

1. Revoke/rotate it at the provider immediately. Assume it is compromised.
2. Update `.env` and the production environment variables.
3. Check provider usage, billing, sent emails, and Supabase auth/admin logs.
4. Remove it from the current tree. Rewriting history is optional; rotation is
   mandatory.
5. If a Supabase service-role key leaked, review RLS policies and admin actions,
   then rotate the JWT secret if necessary.
6. If a Resend key leaked, check sent mail and domain settings.
7. Never paste a key into chat, an issue, or a screenshot again.

## Do not

- Commit `.env`, `server/.env`, `admin/.env.local`, or `web/.env.local`.
- Put a secret behind `VITE_` or `EXPO_PUBLIC_`.
- Use the service-role key in browser code.
- Disable RLS or auth protections to make a test pass.
- Add a real value to an `.env.example` file.
