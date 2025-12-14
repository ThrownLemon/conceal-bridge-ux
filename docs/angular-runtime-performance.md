# Runtime performance optimization

Fast rendering is critical for Angular and we've built the framework with a lot of optimizations in mind to help you develop performant apps.
Change detection is the process through which Angular checks to see whether your application state has changed, and if any DOM needs to be updated. Angular runs its change detection mechanism periodically so that changes to the data model are reflected in an application’s view.
Change detection is highly optimized and performant, but it can still cause slowdowns if the application runs it too frequently.
In this guide, you’ll learn how to control and optimize the change detection mechanism by skipping parts of your application and running change detection only when necessary.
To better understand the performance of your app we offer [Angular DevTools](https://angular.dev/tools/devtools).
