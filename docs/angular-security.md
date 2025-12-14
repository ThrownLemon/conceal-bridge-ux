# Angular Security Best Practices

## Best practices

These are some best practices to ensure that your Angular application is secure.

1. Keep current with the latest Angular library releases - The Angular libraries get regular updates, and these updates might fix security defects discovered in previous versions. Check the Angular [change log](https://github.com/angular/angular/blob/main/CHANGELOG.md) for security-related updates.
2. Don't alter your copy of Angular - Private, customized versions of Angular tend to fall behind the current version and might not include important security fixes and enhancements.
3. Avoid Angular APIs marked in the documentation as "Security Risk".

## Preventing cross-site scripting (XSS)

[Cross-site scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting) enables attackers to inject malicious code into web pages.
To block XSS attacks, you must prevent malicious code from entering the Document Object Model (DOM).

### Angular's cross-site scripting security model

To systematically block XSS bugs, Angular treats all values as untrusted by default. When a value is inserted into the DOM from a template binding, or interpolation, Angular sanitizes and escapes untrusted values.
Angular templates are considered trusted by default, and should be treated as executable code. Never create templates by concatenating user input and template syntax.
To prevent these vulnerabilities, always use the default [Ahead-Of-Time (AOT) template compiler](https://angular.dev/best-practices/security#use-the-aot-template-compiler) in production deployments.
An extra layer of protection can be provided through the use of [Content security policy](https://angular.dev/best-practices/security#content-security-policy) and [Trusted Types](https://angular.dev/best-practices/security#enforcing-trusted-types).

### Sanitization and security contexts

Sanitization is the inspection of an untrusted value, turning it into a value that's safe to insert into the DOM.
Angular defines the following security contexts:

- `innerHtml`
- `style`
- `<a href>`
- `<script src>`

Angular sanitizes untrusted values for HTML and URLs. Sanitizing resource URLs isn't possible because they contain arbitrary code. In development mode, Angular prints a console warning when it has to change a value during sanitization.

### Direct use of the DOM APIs and explicit sanitization calls

Unless you enforce Trusted Types, the built-in browser DOM APIs don't automatically protect you from security vulnerabilities. Avoid directly interacting with the DOM and instead use Angular templates where possible.
For cases where this is unavoidable, use the built-in Angular sanitization functions. Sanitize untrusted values with the [DomSanitizer.sanitize](https://angular.dev/best-practices/api/platform-browser/DomSanitizer#sanitize) method.

### Trusting safe values

Sometimes applications genuinely need to include executable code, display an `<iframe>` from some URL, or construct potentially dangerous URLs. To prevent automatic sanitization in these situations, tell Angular that you inspected a value, checked how it was created, and made sure it is secure.
To mark a value as trusted, inject [DomSanitizer](https://angular.dev/api/platform-browser/DomSanitizer) and call one of the following methods:

- `bypassSecurityTrustHtml`
- `bypassSecurityTrustScript`
- `bypassSecurityTrustStyle`
- `bypassSecurityTrustUrl`
- `bypassSecurityTrustResourceUrl`

Remember, whether a value is safe depends on context, so choose the right context for your intended use of the value.

### Content security policy

Content Security Policy (CSP) is a defense-in-depth technique to prevent XSS. To enable CSP, configure your web server to return an appropriate `Content-Security-Policy` HTTP header.
The minimal policy required for a brand-new Angular application is:
`default-src 'self'; style-src 'self' 'nonce-randomNonceGoesHere'; script-src 'self' 'nonce-randomNonceGoesHere';`

### Enforcing Trusted Types

It is recommended that you use [Trusted Types](https://w3c.github.io/trusted-types/dist/spec/) as a way to help secure your applications from cross-site scripting attacks.

### Use the AOT template compiler

The AOT template compiler prevents a whole class of vulnerabilities called template injection, and greatly improves application performance. The AOT template compiler is the default compiler used by Angular CLI applications, and you should use it in all production deployments.

### Server-side XSS protection

HTML constructed on the server is vulnerable to injection attacks. Injecting template code into an Angular application is the same as injecting executable code into the application. To prevent this, use a templating language that automatically escapes values. Don't create Angular templates on the server side using a templating language.

## HTTP-level vulnerabilities

Angular has built-in support to help prevent two common HTTP vulnerabilities, cross-site request forgery (CSRF or XSRF) and cross-site script inclusion (XSSI).

### Cross-site request forgery

In a cross-site request forgery (CSRF or XSRF), an attacker tricks the user into visiting a different web page with malignant code.
To prevent this, the application must ensure that a user request originates from the real application, not from a different site.
In a common anti-XSRF technique, the application server sends a randomly created authentication token in a cookie. The client code reads the cookie and adds a custom request header with the token in all following requests.

### HttpClient XSRF/CSRF security

[HttpClient](https://angular.dev/api/common/http/HttpClient) supports a common mechanism used to prevent XSRF attacks. When performing HTTP requests, an interceptor reads a token from a cookie, by default `XSRF-TOKEN`, and sets it as an HTTP header, `X-XSRF-TOKEN`.

### Cross-site script inclusion (XSSI)

Cross-site script inclusion, also known as JSON vulnerability, can allow an attacker's website to read data from a JSON API.
Angular's [HttpClient](https://angular.dev/api/common/http/HttpClient) library recognizes this convention and automatically strips the string `")]}',\n"` from all responses before further parsing.
