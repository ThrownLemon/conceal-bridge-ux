## 2025-12-17 - Missing Input Length Limits
**Vulnerability:** User inputs for financial amounts and emails were unbounded, allowing massive strings (DoS risk).
**Learning:** Regex patterns (`Validators.pattern`) do not necessarily enforce string length limits, especially for `*` or `+` quantifiers.
**Prevention:** Always pair `Validators.pattern` with `Validators.maxLength` for user inputs.
