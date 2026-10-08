## 2024-05-18 - Weak PRNG Replacement
**Vulnerability:** The application was using the cryptographically insecure `Math.random()` to generate potentially sensitive codes such as voucher codes, referral codes, and group join codes.
**Learning:** `Math.random()` is predictable and should not be used in any context where uniqueness or unpredictability is a security requirement (e.g. tokens, vouchers, invite codes).
**Prevention:** In Node.js environments, use the built-in `crypto` module (e.g. `crypto.randomInt` or `crypto.getRandomValues`) for cryptographically secure pseudo-random number generation (CSPRNG).
