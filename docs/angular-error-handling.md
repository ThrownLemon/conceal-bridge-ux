# Unhandled errors in Angular

## Unhandled errors are reported to the ErrorHandler

Angular reports unhandled errors to the application's root [`ErrorHandler`](https://angular.dev/api/core/ErrorHandler). When providing a custom ErrorHandler, provide it in your `ApplicationConfig`.
When building an Angular application, often you write code that is called automatically by the framework. In situations like this, Angular catches errors and sends them to the ErrorHandler.
Angular does not catch errors inside of APIs that are called directly by your code. For example, if you have a service with a method that throws an error and you call that method in your component, Angular will not automatically catch that error. You are responsible for handling it using mechanisms like `try...catch`.

### TestBed rethrows errors by default

In many cases, ErrorHandler may only log errors and otherwise allow the application to continue running. In tests, however, you almost always want to surface these errors. Angular's `TestBed` rethrows unexpected errors to ensure that errors caught by the framework cannot be unintentionally missed or ignored.

## Global error listeners

Errors that are caught neither by the application code nor by the framework's application instance may reach the global scope. Angular provides global listeners for both environments to account for these issues.

### Client-side rendering

Adding `provideBrowserGlobalErrorListeners()` to the `ApplicationConfig` adds the 'error' and 'unhandledrejection' listeners to the browser window and forwards those errors to ErrorHandler. The Angular CLI generates new applications with this provider by default.

### Server-side and hybrid rendering

When using Angular with SSR, Angular automatically adds the 'unhandledRejection' and 'uncaughtException' listeners to the server process. These handlers prevent the server from crashing and instead log captured errors to the console.
