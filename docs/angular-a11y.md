# Accessibility in Angular

## Accessibility attributes

Building accessible web experiences often involves setting [Accessible Rich Internet Applications (ARIA) attributes](https://web.dev/learn/accessibility/aria-html/) to provide semantic meaning where it might otherwise be missing. Use [attribute binding](https://angular.dev/best-practices/guide/templates/binding#binding-dynamic-properties-and-attributes) template syntax to control the values of accessibility-related attributes.

### ARIA attributes and properties

When binding to ARIA attributes in Angular, you can use them directly like any other HTML attribute.
`<button [aria-label]="myActionLabel">…</button>`
Static ARIA attributes work as regular HTML attributes.
`<button aria-label="Save document">…</button>`

## Angular UI components

The [Angular Material](https://material.angular.dev) library, which is maintained by the Angular team, is a suite of reusable UI components that aims to be fully accessible. The [Component Development Kit (CDK)](https://material.angular.dev/cdk/categories) includes the a11y package that provides tools to support various areas of accessibility.

### Augmenting native elements

Native HTML elements capture several standard interaction patterns that are important to accessibility. When authoring Angular components, you should re-use these native elements directly when possible, rather than re-implementing well-supported behaviors.
For example, instead of creating a custom element for a new variety of button, create a component that uses an attribute selector with a native `<button>` element.

### Using containers for native elements

Sometimes using the appropriate native element requires a container element. For example, the native `<input>` element cannot have children, so any custom text entry components need to wrap an `<input>` with extra elements. Instead, create a container component that uses content projection to include the native control in the component's API.

## Routing

### Focus management after navigation

Tracking and controlling [focus](https://web.dev/learn/accessibility/focus/) in a UI is an important consideration in designing for accessibility. When using Angular routing, you should decide where page focus goes upon navigation.
To avoid relying solely on visual cues, you need to make sure your routing code updates focus after page navigation. Use the `NavigationEnd` event from the `Router` service to know when to update focus.

### Active links identification

CSS classes applied to active `RouterLink` elements, such as `RouterLinkActive`, provide a visual cue to identify the active link. Unfortunately, a visual cue doesn't help blind or visually impaired users. Applying the `aria-current` attribute to the element can help identify the active link.

## Deferred Loading

When using Angular's `@defer` blocks for lazy loading content, consider the accessibility implications for users with assistive technologies. Screen readers may not automatically announce content changes when deferred components load, potentially leaving users unaware of new content.
To ensure deferred content changes are properly announced, wrap your `@defer` blocks in elements with appropriate ARIA live regions.
