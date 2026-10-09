## 2026-10-09 - [CRITICAL] Remove unsafe debug authentication endpoint
**Vulnerability:** A diagnostic endpoint at `src/app/api/debug-auth/route.ts` exposed sensitive authentication data, including user emails, roles, and partial cookie values. It lacked proper authentication checks.
**Learning:** Debugging routes left in the codebase, even with warnings to delete them, pose a significant risk of information disclosure if accidentally deployed to production.
**Prevention:** Avoid committing diagnostic endpoints that expose sensitive data. If necessary for development, use feature flags, environment-specific configurations (e.g., `NODE_ENV !== 'production'`), or strong authentication to protect them, and ensure they are removed before deployment.
