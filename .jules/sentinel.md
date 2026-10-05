## 2026-10-05 - [Sentinel] Fix Open Redirect in Auth Callback
**Vulnerability:** Open redirect in `src/app/auth/callback/route.ts` via protocol-relative URLs (e.g. `next=//evil.com`).
**Learning:** The previous check `next.startsWith('/')` was insufficient because `//evil.com` starts with a slash, but `new URL('//evil.com', origin)` resolves to an absolute URL pointing to `evil.com`. This pattern is common in Next.js applications handling dynamic redirects.
**Prevention:** Sanitize the path to ensure it starts with exactly one forward slash, using a regex like `.replace(/^\/+/, '/')`, before passing it to `new URL()`.
