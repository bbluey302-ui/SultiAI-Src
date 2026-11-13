/**
 * SultiAI auth email templates
 * ----------------------------
 * Generates the Supabase Auth email templates used by the hosted project.
 * Run: node supabase/email-templates/build.mjs
 *
 * Design rules:
 *  - Table-based layout, inline CSS, no JavaScript or external stylesheets.
 *  - No remote images (Gmail and Outlook block them by default).
 *  - Every action URL comes from Supabase: {{ .ConfirmationURL }} / {{ .Token }}.
 *  - Palette: navy #0A121D, card #FFFFFF, teal #00B8A9, ink #0F172A.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = dirname(fileURLToPath(import.meta.url));

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

const BRAND = {
  navy: '#0A121D',
  card: '#FFFFFF',
  teal: '#00B8A9',
  tealDark: '#007A72',
  tealTint: '#EFFCFA',
  ink: '#0F172A',
  body: '#475569',
  muted: '#64748B',
  line: '#E2E8F0',
  footer: '#F8FAFC',
  footerText: '#94A3B8',
};

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function detailBox(html) {
  return `
              <tr>
                <td class="px" style="padding:20px 40px 0 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F8FAFC" style="background-color:#F8FAFC;border:1px solid ${BRAND.line};border-radius:10px;">
                    <tr>
                      <td style="padding:14px 16px;font-family:${FONT};font-size:13px;line-height:20px;color:${BRAND.ink};overflow-wrap:anywhere;word-break:break-word;">
                        ${html}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

function securityBox(html) {
  return `
              <tr>
                <td class="px" style="padding:24px 40px 0 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.tealTint}" style="background-color:${BRAND.tealTint};border-left:3px solid ${BRAND.teal};border-radius:8px;">
                    <tr>
                      <td style="padding:12px 14px;font-family:${FONT};font-size:12px;line-height:19px;color:${BRAND.ink};overflow-wrap:anywhere;word-break:break-word;">
                        ${html}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

function fallbackLink(url) {
  return `
              <tr>
                <td class="px" style="padding:22px 40px 0 40px;">
                  <p style="margin:0;font-family:${FONT};font-size:12px;line-height:19px;color:${BRAND.muted};">
                    Button not working? Copy and paste this link into your browser:
                  </p>
                  <p style="margin:6px 0 0 0;font-family:${FONT};font-size:11px;line-height:17px;color:${BRAND.tealDark};word-break:break-all;overflow-wrap:anywhere;">
                    <a href="${url}" target="_blank" rel="noopener" style="color:${BRAND.tealDark};text-decoration:underline;">${url}</a>
                  </p>
                </td>
              </tr>`;
}

function codeBox(code) {
  return `
              <tr>
                <td class="px" style="padding:24px 40px 0 40px;" align="center">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" bgcolor="#0A121D" style="background-color:${BRAND.navy};border-radius:12px;padding:20px 16px;">
                        <div style="font-family:${MONO};font-size:34px;line-height:40px;font-weight:700;letter-spacing:10px;color:${BRAND.teal};">${code}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

function renderEmail({
  preheader,
  eyebrow,
  title,
  intro,
  detail = '',
  code = '',
  ctaLabel = '',
  ctaUrl = '',
  security = '',
  closing = '',
}) {
  const cta = ctaLabel
    ? `
              <tr>
                <td class="px cta" style="padding:28px 40px 0 40px;" align="left">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" bgcolor="${BRAND.teal}" style="border-radius:12px;background-color:${BRAND.teal};">
                        <a href="${ctaUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:15px;line-height:20px;font-weight:700;color:#04211F;text-decoration:none;border-radius:12px;background-color:${BRAND.teal};">${ctaLabel} &nbsp;&rarr;</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
    : '';

  const fallback = ctaUrl ? fallbackLink(ctaUrl) : '';
  const detailRow = detail ? detailBox(detail) : '';
  const codeRow = code ? codeBox(code) : '';
  const securityRow = security ? securityBox(security) : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>SultiAI</title>
  <!--[if mso]>
  <style>table,td,a{font-family:Arial,Helvetica,sans-serif!important}</style>
  <![endif]-->
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0;mso-table-rspace:0}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    body{margin:0;padding:0;width:100%!important;height:100%!important;background-color:${BRAND.navy}}
    a{color:${BRAND.tealDark}}
    @media only screen and (max-width:620px){
      .wrap{width:100%!important;max-width:100%!important}
      .px{padding-left:22px!important;padding-right:22px!important}
      .h1{font-size:23px!important;line-height:31px!important}
      .cta a{display:block!important;text-align:center!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.navy};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:${BRAND.navy};">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.navy}" style="background-color:${BRAND.navy};">
    <tr>
      <td align="center" style="padding:32px 12px 28px 12px;">
        <table role="presentation" class="wrap" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:560px;">
          <tr>
            <td style="padding:0 0 16px 4px;" align="left">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="42" height="42" align="center" valign="middle" bgcolor="${BRAND.teal}" style="width:42px;height:42px;background-color:${BRAND.teal};border-radius:12px;font-family:${FONT};font-size:22px;line-height:42px;font-weight:800;color:#04211F;">S</td>
                  <td style="padding-left:12px;">
                    <div style="font-family:${FONT};font-size:20px;line-height:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.2px;">SultiAI</div>
                    <div style="font-family:${FONT};font-size:10px;line-height:16px;font-weight:600;color:#94A3B8;letter-spacing:1.1px;text-transform:uppercase;">Bisaya &amp; Filipino Language Hub</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="card" bgcolor="${BRAND.card}" style="background-color:${BRAND.card};border-radius:18px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="5" bgcolor="${BRAND.teal}" style="height:5px;line-height:5px;font-size:0;">&nbsp;</td></tr>
                <tr>
                  <td class="px" style="padding:34px 40px 0 40px;">
                    <div style="font-family:${FONT};font-size:11px;line-height:16px;font-weight:700;color:${BRAND.tealDark};letter-spacing:1.6px;text-transform:uppercase;">${eyebrow}</div>
                    <h1 class="h1" style="margin:10px 0 0 0;font-family:${FONT};font-size:26px;line-height:34px;font-weight:800;color:${BRAND.ink};letter-spacing:-0.4px;">${title}</h1>
                    <p style="margin:14px 0 0 0;font-family:${FONT};font-size:15px;line-height:24px;color:${BRAND.body};overflow-wrap:anywhere;word-break:break-word;">${intro}</p>
                  </td>
                </tr>${detailRow}${codeRow}${cta}${fallback}${securityRow}
                <tr>
                  <td class="px" style="padding:24px 40px 32px 40px;">
                    <p style="margin:0;font-family:${FONT};font-size:13px;line-height:21px;color:${BRAND.muted};overflow-wrap:anywhere;word-break:break-word;">${closing}</p>
                  </td>
                </tr>
                <tr>
                  <td bgcolor="${BRAND.footer}" style="background-color:${BRAND.footer};padding:18px 40px;border-top:1px solid ${BRAND.line};">
                    <p style="margin:0;font-family:${FONT};font-size:11px;line-height:18px;font-weight:600;color:${BRAND.body};">
                      SultiAI &mdash; Bisaya &amp; Filipino Language Hub
                    </p>
                    <p style="margin:4px 0 0 0;font-family:${FONT};font-size:10px;line-height:16px;color:${BRAND.footerText};">
                      This is an automated security email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 8px 0 8px;" align="center">
              <p style="margin:0;font-family:${FONT};font-size:10px;line-height:16px;color:${BRAND.muted};">
                &copy; 2026 SultiAI &middot; Built for real-world conversations
              </p>
              <p style="margin:6px 0 0 0;font-family:${FONT};font-size:10px;line-height:16px;color:${BRAND.footerText};">
                Learn &middot; Speak &middot; Understand &middot; Connect
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

const templates = {
  confirmation: {
    subject: 'Confirm your SultiAI email address',
    preheader: 'Confirm your email to finish creating your SultiAI account.',
    eyebrow: 'Email verification',
    title: 'Confirm your SultiAI email',
    intro:
      "You're one step away from your Bisaya and Filipino learning hub. Confirm this email address to activate your account.",
    detail:
      'This confirmation link is for <strong>{{ .Email }}</strong>. It can only be used once.',
    ctaLabel: 'Confirm my email',
    ctaUrl: '{{ .ConfirmationURL }}',
    security:
      "If you didn't create a SultiAI account, you can safely ignore this email. No account will be activated without confirmation.",
    closing:
      'Once confirmed, you can sign in and continue your lessons, speaking practice, and real-world conversations.',
  },
  recovery: {
    subject: 'Reset your SultiAI password',
    preheader: 'Reset your SultiAI password with the secure link inside.',
    eyebrow: 'Password recovery',
    title: 'Reset your SultiAI password',
    intro:
      'We received a request to reset the password for {{ .Email }}. Choose a new password to get back to learning.',
    ctaLabel: 'Choose a new password',
    ctaUrl: '{{ .ConfirmationURL }}',
    security:
      "If you didn't request this, you can safely ignore this email — your password will not change. This link expires shortly and can only be used once.",
    closing:
      'For your security, SultiAI will never ask for your password by email. If you need help, return to the sign-in screen and request a new link.',
  },
  invite: {
    subject: "You're invited to SultiAI",
    preheader: 'Accept your invitation to the SultiAI language hub.',
    eyebrow: 'Invitation',
    title: "You're invited to SultiAI",
    intro:
      'You have been invited to join SultiAI, the Bisaya and Filipino language hub built for real-world conversations.',
    ctaLabel: 'Accept my invitation',
    ctaUrl: '{{ .ConfirmationURL }}',
    security:
      "If you weren't expecting this invitation, you can safely ignore this email.",
    closing:
      'Accept the invitation to create your account, choose your language goal, and start learning.',
  },
  magic_link: {
    subject: 'Your SultiAI sign-in link',
    preheader: 'Use your secure, one-time SultiAI sign-in link.',
    eyebrow: 'Secure sign-in',
    title: 'Your SultiAI sign-in link',
    intro:
      'Use the button below to sign in to SultiAI. No password needed for this secure, one-time link.',
    ctaLabel: 'Sign in to SultiAI',
    ctaUrl: '{{ .ConfirmationURL }}',
    security:
      "This link expires shortly and can only be used once. If you didn't request it, you can safely ignore this email.",
    closing:
      'For your security, never forward this email or share the link with anyone.',
  },
  email_change: {
    subject: 'Confirm your new SultiAI email',
    preheader: 'Confirm your new email address for SultiAI.',
    eyebrow: 'Account security',
    title: 'Confirm your new email',
    intro:
      'Confirm <strong>{{ .NewEmail }}</strong> as the new email address for your SultiAI account.',
    ctaLabel: 'Confirm new email',
    ctaUrl: '{{ .ConfirmationURL }}',
    security:
      "If you didn't request this change, ignore this email and keep using your current address. Your account stays protected.",
    closing:
      'After confirmation, use your new email address the next time you sign in to SultiAI.',
  },
  reauthentication: {
    subject: '{{ .Token }} is your SultiAI verification code',
    preheader: 'Your one-time SultiAI verification code.',
    eyebrow: 'Identity check',
    title: 'Your verification code',
    intro:
      'Enter this code to verify your identity and continue securely in SultiAI. It expires shortly.',
    code: '{{ .Token }}',
    security:
      'Never share this code with anyone. SultiAI will never ask for it by email, message, or phone call.',
    closing:
      "If you didn't request this code, you can ignore this email. Your account remains secure.",
  },
  // Supabase calls this "password changed notification". The hosted project
  // keeps mailer_notifications_password_changed_enabled = false by default;
  // the branded content is ready for when an admin enables it.
  password_changed_notification: {
    subject: 'Your SultiAI password was changed',
    preheader: 'The password for your SultiAI account was changed.',
    eyebrow: 'Account security',
    title: 'Your password was changed',
    intro:
      'The password for <strong>{{ .Email }}</strong> was changed successfully. If this was you, no further action is needed.',
    security:
      "If you didn't make this change, reset your password immediately and review your account security. Your account may be at risk.",
    closing:
      'For your security, SultiAI will never ask for your password by email. This notification was sent automatically.',
  },
};

const SUBJECTS = {};
mkdirSync(OUT_DIR, { recursive: true });

for (const [name, tpl] of Object.entries(templates)) {
  SUBJECTS[name] = tpl.subject;
  const html = renderEmail(tpl);
  writeFileSync(join(OUT_DIR, `${name}.html`), html, 'utf8');
  console.log(`WROTE ${name}.html (${html.length} bytes)`);
}

writeFileSync(
  join(OUT_DIR, 'subjects.json'),
  JSON.stringify(SUBJECTS, null, 2) + '\n',
  'utf8'
);
console.log('WROTE subjects.json');
