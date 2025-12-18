## 2025-12-17 - Missing Input Length Limits
**Vulnerability:** User inputs for financial amounts and emails were unbounded, allowing massive strings (DoS risk).
**Learning:** Regex patterns (`Validators.pattern`) do not necessarily enforce string length limits, especially for `*` or `+` quantifiers.
**Prevention:** Always pair `Validators.pattern` with `Validators.maxLength` for user inputs.

## 2025-12-18 - Inconsistent Input Validation
**Vulnerability:** Address fields lacked `maxLength` despite strict regex patterns, leaving a gap for potential ReDoS or memory exhaustion.
**Learning:** Partial application of security patterns (fixing amount/email but missing addresses) leaves the app vulnerable. Consistency is key.
**Prevention:** Systematically audit all `FormControl` definitions when applying a security pattern, rather than fixing ad-hoc.
