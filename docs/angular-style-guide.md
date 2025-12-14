# Angular Coding Style Guide

## Introduction

[Introduction](https://angular.dev/style-guide#introduction)
This guide covers a range of style conventions for Angular application code. These recommendations are not required for Angular to work, but instead establish a set of coding practices that promote consistency across the Angular ecosystem. A consistent set of practices makes it easier to share code and move between projects.
This guide does not cover TypeScript or general coding practices unrelated to Angular. For TypeScript, check out [Google's TypeScript style guide](https://google.github.io/styleguide/tsguide.html).

### When in doubt, prefer consistency

Whenever you encounter a situation in which these rules contradict the style of a particular file, prioritize maintaining consistency within a file. Mixing different style conventions in a single file creates more confusion than diverging from the recommendations in this guide.

## Naming

### Separate words in file names with hyphens

Separate words within a file name with hyphens (-). For example, a component named UserProfile has a file name user-profile.ts.

### Use the same name for a file's tests with .spec at the end

For unit tests, end file names with .spec.ts. For example, the unit test file for the UserProfile component has the file name user-profile.spec.ts.

### Match file names to the TypeScript identifier within

File names should generally describe the contents of the code in the file. When the file contains a TypeScript class, the file name should reflect that class name. For example, a file containing a component named UserProfile has the name user-profile.ts.
If the file contains more than one primary namable identifier, choose a name that describes the common theme to the code within. If the code in a file does not fit within a common theme or feature area, consider breaking the code up into different files. Avoid overly generic file names like helpers.ts, utils.ts, or common.ts.

### Use the same file name for a component's TypeScript, template, and styles

Components typically consist of one TypeScript file, one template file, and one style file. These files should share the same name with different file extensions. For example, a UserProfile component can have the files user-profile.ts, user-profile.html, and user-profile.css.
If a component has more than one style file, append the name with additional words that describe the styles specific to that file.

## Project structure

### All the application's code goes in a directory named src

All of your Angular UI code (TypeScript, HTML, and styles) should live inside a directory named src. Code that's not related to UI, such as configuration files or scripts, should live outside the src directory.
This keeps the root application directory consistent between different Angular projects and creates a clear separation between UI code and other code in your project.

### Bootstrap your application in a file named main.ts directly inside src

The code to start up, or bootstrap, an Angular application should always live in a file named main.ts. This represents the primary entry point to the application.

### Group closely related files together in the same directory

Angular components consist of a TypeScript file and, optionally, a template and one or more style files. You should group these together in the same directory.
Unit tests should live in the same directory as the code-under-test. Avoid collecting unrelated tests into a single tests directory.

### Organize your project by feature areas

Organize your project into subdirectories based on the features of your application or common themes to the code in those directories.
Avoid creating subdirectories based on the type of code that lives in those directories. For example, avoid creating directories like components, directives, and services.
Avoid putting so many files into one directory that it becomes hard to read or navigate. As the number of files in a directory grows, consider splitting further into additional sub-directories.

### One concept per file

Prefer focusing source files on a single concept. For Angular classes specifically, this usually means one component, directive, or service per file. However, it's okay if a file contains more than one component or directive if your classes are relatively small and they tie together as part of a single concept.
When in doubt, go with the approach that leads to smaller files.

## Dependency injection

### Prefer the inject function over constructor parameter injection

Prefer using the [`inject`](https://angular.dev/api/core/inject) function over injecting constructor parameters. The inject function works the same way as constructor parameter injection, but offers several style advantages:

- `inject` is generally more readable, especially when a class injects many dependencies.
- It's more syntactically straightforward to add comments to injected dependencies
- `inject` offers better type inference.
- When targeting ES2022+ with `useDefineForClassFields`, you can avoid separating field declaration and initialization when fields read on injected dependencies.

## Components and directives

### Choosing component selectors

See the [Components guide for details on choosing component selectors](https://angular.dev/guide/components/selectors#choosing-a-selector).

### Naming component and directive members

See the Components guide for details on [naming input properties](https://angular.dev/guide/components/inputs#choosing-input-names) and [naming output properties](https://angular.dev/guide/components/outputs#choosing-event-names).

### Choosing directive selectors

Directives should use the same [application-specific prefix](https://angular.dev/guide/components/selectors#selector-prefixes) as your components.
When using an attribute selector for a directive, use a camelCase attribute name.

### Group Angular-specific properties before methods

Components and directives should group Angular-specific properties together, typically near the top of the class declaration. This includes injected dependencies, inputs, outputs, and queries. Define these and other properties before the class's methods.
This practice makes it easier to find the class's template APIs and dependencies.

### Keep components and directives focused on presentation

Code inside your components and directives should generally relate to the UI shown on the page. For code that makes sense on its own, decoupled from the UI, prefer refactoring to other files. For example, you can factor form validation rules or data transformations into separate functions or classes.

### Avoid overly complex logic in templates

Angular templates are designed to accommodate [JavaScript-like expressions](https://angular.dev/guide/templates/expression-syntax). You should take advantage of these expressions to capture relatively straightforward logic directly in template expressions.
When the code in a template gets too complex, though, refactor logic into the TypeScript code (typically with a [computed](https://angular.dev/guide/signals#computed-signals)).
There's no one hard-and-fast rule that determines what constitutes "complex". Use your best judgement.

### Use protected on class members that are only used by a component's template

A component class's public members intrinsically define a public API that's accessible via dependency injection and [queries](https://angular.dev/guide/components/queries). Prefer protected access for any members that are meant to be read from the component's template.

### Use readonly for properties that shouldn't change

Mark component and directive properties initialized by Angular as readonly. This includes properties initialized by input, model, output, and queries. The readonly access modifier ensures that the value set by Angular is not overwritten.

### Prefer class and style over ngClass and ngStyle

Prefer class and style bindings over using the NgClass and NgStyle directives.
Both class and style bindings use a more straightforward syntax that aligns closely with standard HTML attributes. This makes your templates easier to read and understand.
Additionally, the NgClass and NgStyle directives incur an additional performance cost compared to the built-in class and style binding syntax.

### Name event handlers for what they do, not for the triggering event

Prefer naming event handlers for the action they perform rather than for the triggering event (e.g., `saveUserData()` instead of `handleClick()`).
Using meaningful names like this makes it easier to tell what an event does from reading the template.

### Keep lifecycle methods simple

Avoid putting long or complex logic inside lifecycle hooks like ngOnInit. Instead, prefer creating well-named methods to contain that logic and then call those methods in your lifecycle hooks.

### Use lifecycle hook interfaces

Angular provides a TypeScript interface for each lifecycle method. When adding a lifecycle hook to your class, import and implement these interfaces to ensure that the methods are named correctly.
