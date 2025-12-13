# Angular Project Build Guide for AI Agent

## Project Overview

**Project Name:** [Your Project Name]

**Purpose:** [Brief description of what this application does]

**Angular Version:** [e.g., 18.x, 19.x]

**Target Platform:** [Web, Mobile-responsive, PWA, etc.]

**Key Features:**
- [Feature 1]
- [Feature 2]
- [Feature 3]

## Project Structure

### Folder Organization
```
src/
├── app/
│   ├── core/              # Singleton services, guards, interceptors
│   ├── shared/            # Shared components, directives, pipes
│   ├── features/          # Feature modules
│   │   ├── feature-a/
│   │   └── feature-b/
│   ├── models/            # TypeScript interfaces and types
│   ├── services/          # Application services
│   └── guards/            # Route guards
├── assets/                # Static assets (images, fonts, etc.)
├── environments/          # Environment configuration files
└── styles/                # Global styles
```

### Naming Conventions
- **Components:** `kebab-case.component.ts` (e.g., `user-profile.component.ts`)
- **Services:** `kebab-case.service.ts` (e.g., `auth.service.ts`)
- **Models:** `PascalCase` (e.g., `User`, `ProductDetail`)
- **Guards:** `kebab-case.guard.ts` (e.g., `auth.guard.ts`)
- **Pipes:** `kebab-case.pipe.ts` (e.g., `currency-format.pipe.ts`)

## Architecture & Patterns

### Component Architecture
- [ ] Using **Standalone Components** (recommended for new projects)
- [ ] Using **NgModules** (legacy approach)

### State Management
- [ ] **Services with RxJS** (simple state)
- [ ] **Signals** (Angular 16+ reactive primitives)
- [ ] **NgRx** (complex state management)
- [ ] **Other:** [Specify if using Akita, NGXS, etc.]

**State Management Pattern:**
[Describe how state flows through the application]

### Routing Strategy
- **Route Configuration Location:** [e.g., `app.routes.ts` or `app-routing.module.ts`]
- **Lazy Loading:** [Yes/No - specify which modules/routes are lazy loaded]
- **Route Guards Used:** [List guards like AuthGuard, RoleGuard, etc.]

### Change Detection Strategy
- **Default Strategy:** [Default or OnPush]
- **When to use OnPush:** [Specify criteria]

## Code Standards & Best Practices

### TypeScript Configuration
- **Strict Mode:** [Enabled/Disabled]
- **Strict Templates:** [Enabled/Disabled]
- **No Implicit Any:** [Enabled/Disabled]

### RxJS Patterns
- **Subscription Management:** [takeUntil, async pipe, etc.]
- **Preferred Operators:** [List commonly used operators]
- **Avoid:** [Anti-patterns to avoid]

**Example:**
```typescript
// Preferred: Use async pipe in templates
data$ = this.service.getData();

// Or use takeUntil for manual subscriptions
private destroy$ = new Subject<void>();

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Form Handling
- [ ] **Reactive Forms** (preferred)
- [ ] **Template-Driven Forms**
- [ ] **Typed Forms** (Angular 14+)

### Error Handling
- **Global Error Handler:** [Yes/No - location if yes]
- **HTTP Interceptor:** [Yes/No - location if yes]
- **User-Facing Error Messages:** [Strategy for displaying errors]

### Accessibility Requirements
- **WCAG Level:** [A, AA, AAA]
- **ARIA Labels:** [Required for all interactive elements]
- **Keyboard Navigation:** [Required/Not Required]
- **Screen Reader Testing:** [Required/Not Required]

## Dependencies & Third-Party Libraries

### Core Dependencies
```json
{
  "@angular/core": "[version]",
  "@angular/common": "[version]",
  "@angular/router": "[version]",
  "@angular/forms": "[version]"
}
```

### UI Libraries
- [ ] **Angular Material** - [version]
- [ ] **PrimeNG** - [version]
- [ ] **Bootstrap** - [version]
- [ ] **Tailwind CSS** - [version]
- [ ] **Custom UI Library** - [details]

### Additional Libraries
- **HTTP Client:** [@angular/common/http]
- **Date Handling:** [date-fns, moment, dayjs, etc.]
- **State Management:** [NgRx, Akita, etc.]
- **Charts/Visualization:** [Chart.js, ng2-charts, etc.]
- **Other:** [List any other key dependencies]

### Internal/Custom Packages
[List any internal npm packages or libraries]

## Environment Configuration

### Environment Files
```
src/environments/
├── environment.ts          # Development
├── environment.prod.ts     # Production
├── environment.staging.ts  # Staging (if applicable)
```

### Environment Variables
```typescript
export const environment = {
  production: false,
  apiUrl: '[API_BASE_URL]',
  apiKey: '[API_KEY]',
  features: {
    featureA: true,
    featureB: false
  }
};
```

### Build Configurations
- **Development:** `ng serve` or `ng build`
- **Production:** `ng build --configuration production`
- **Staging:** `ng build --configuration staging`

## Build & Deployment

### Build Commands
```bash
# Development build
ng build

# Production build
ng build --configuration production

# Build with specific configuration
ng build --configuration [config-name]

# Build with base href
ng build --base-href /my-app/
```

### Build Output
- **Output Directory:** `dist/[project-name]`
- **Build Optimization:** [Enabled/Disabled for production]
- **Source Maps:** [Generated for development only]

### Deployment Target
- **Platform:** [Azure, AWS S3, Firebase Hosting, Netlify, etc.]
- **Deployment Command:** [Specify if using CLI tools]
- **Environment Variables:** [How are they injected?]

### CI/CD Pipeline
- **CI Tool:** [GitHub Actions, GitLab CI, Jenkins, etc.]
- **Pipeline Configuration:** [Location of config file]
- **Deployment Triggers:** [On merge to main, manual, etc.]

**Pipeline Steps:**
1. [Install dependencies]
2. [Run linting]
3. [Run tests]
4. [Build for production]
5. [Deploy to hosting]

## Testing Requirements

### Unit Testing
- **Framework:** [Jasmine/Karma or Jest]
- **Coverage Target:** [e.g., 80%]
- **Run Command:** `ng test`

**Testing Patterns:**
```typescript
// Example test structure
describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName]
    }).compileComponents();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### E2E Testing
- **Framework:** [Cypress, Playwright, Protractor (deprecated)]
- **Run Command:** [e.g., `npm run e2e`]
- **Test Location:** [e.g., `cypress/e2e/`]

### Testing Best Practices
- Mock HTTP calls using `HttpClientTestingModule`
- Use `ComponentFixture` for component testing
- Test user interactions, not implementation details
- [Add project-specific testing guidelines]

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start development server
ng serve

# Start with specific port
ng serve --port 4201

# Start with proxy configuration
ng serve --proxy-config proxy.conf.json

# Open in browser
ng serve --open
```

### Code Generation
```bash
# Generate component
ng generate component features/[feature-name]/[component-name]

# Generate service
ng generate service services/[service-name]

# Generate guard
ng generate guard guards/[guard-name]

# Generate pipe
ng generate pipe pipes/[pipe-name]

# Generate module (if using modules)
ng generate module features/[module-name] --routing
```

### Quality Assurance
```bash
# Run linting
ng lint

# Fix linting issues
ng lint --fix

# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage

# Run e2e tests
npm run e2e
```

### Build
```bash
# Development build
ng build

# Production build
ng build --configuration production

# Analyze bundle size
ng build --stats-json
npm run analyze  # if configured
```

## Development Workflow

### Branch Naming Conventions
- **Feature:** `feature/[feature-name]`
- **Bug Fix:** `fix/[bug-description]`
- **Hotfix:** `hotfix/[issue-description]`
- **Refactor:** `refactor/[description]`

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Example:**
```
feat(auth): add password reset functionality

Implemented password reset flow with email verification.
Added new reset-password component and service.

Closes #123
```

### Code Review Checklist
- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] No console.log statements in production code
- [ ] Components use OnPush change detection where appropriate
- [ ] Proper error handling implemented
- [ ] Accessibility requirements met
- [ ] No hardcoded values (use environment variables)
- [ ] Documentation updated if needed

### When to Create New Components
- **Create new component when:**
  - Logic/template is reused in multiple places
  - Component exceeds 200-300 lines
  - Component has distinct, separable responsibility
  - Component represents a logical UI section

- **Modify existing component when:**
  - Adding minor functionality to existing feature
  - Fixing bugs
  - Refactoring without changing interface

## API Integration

### API Configuration
- **Base URL:** [e.g., `environment.apiUrl`]
- **API Version:** [e.g., v1, v2]
- **Authentication:** [JWT, OAuth, API Key, etc.]

### HTTP Interceptor
**Location:** [e.g., `src/app/core/interceptors/auth.interceptor.ts`]

**Purpose:**
- Add authentication tokens
- Handle global errors
- Log requests/responses
- Transform requests/responses

### Authentication/Authorization
- **Auth Service Location:** [path to auth service]
- **Token Storage:** [localStorage, sessionStorage, cookies]
- **Token Refresh:** [Automatic/Manual strategy]
- **Protected Routes:** [How routes are protected]

### API Error Handling
```typescript
// Example error handling pattern
this.httpClient.get(url).pipe(
  catchError((error: HttpErrorResponse) => {
    // Handle different error types
    if (error.status === 401) {
      // Handle unauthorized
    } else if (error.status === 404) {
      // Handle not found
    }
    return throwError(() => error);
  })
);
```

### Data Models/Interfaces
**Location:** [e.g., `src/app/models/`]

**Example:**
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export enum UserRole {
  Admin = 'admin',
  User = 'user'
}
```

## Styling Guidelines

### CSS Methodology
- [ ] **BEM** (Block Element Modifier)
- [ ] **Utility-First** (Tailwind, etc.)
- [ ] **Component-Scoped** (Angular default)
- [ ] **Other:** [Specify]

### Styling Technology
- [ ] **SCSS/SASS**
- [ ] **CSS**
- [ ] **Less**
- [ ] **Styled Components**

### Theme Configuration
- **Theme Location:** [e.g., `src/styles/themes/`]
- **CSS Variables:** [Yes/No - location if yes]
- **Dark Mode:** [Supported/Not Supported]

### Responsive Breakpoints
```scss
// Example breakpoints
$breakpoint-mobile: 576px;
$breakpoint-tablet: 768px;
$breakpoint-desktop: 992px;
$breakpoint-wide: 1200px;
```

### Global Styles
**Location:** [e.g., `src/styles/styles.scss`]

**Structure:**
- Variables and mixins
- Reset/normalize styles
- Typography
- Utility classes
- Component overrides

### Component Styling Best Practices
- Use `:host` for component root styling
- Avoid deep selectors (`::ng-deep`) when possible
- Keep styles component-scoped
- Use CSS custom properties for theming
- [Add project-specific guidelines]

## Performance Considerations

### Lazy Loading
**Modules/Routes to Lazy Load:**
- [List feature modules that should be lazy loaded]

**Example:**
```typescript
{
  path: 'admin',
  loadChildren: () => import('./features/admin/admin.routes')
}
```

### Change Detection Optimization
- Use OnPush change detection for presentational components
- Avoid function calls in templates
- Use `trackBy` with `*ngFor`
- Detach change detector when not needed

### Bundle Optimization
- **Target Bundle Size:** [e.g., < 500KB initial bundle]
- **Code Splitting:** [Strategy for splitting bundles]
- **Tree Shaking:** [Enabled/Configuration]

### Image Optimization
- Use WebP format where supported
- Implement lazy loading for images
- Use `loading="lazy"` attribute
- Optimize image sizes before uploading

### TrackBy Functions
```typescript
// Always use trackBy with *ngFor
trackByFn(index: number, item: any): any {
  return item.id; // Use unique identifier
}
```

```html
<div *ngFor="let item of items; trackBy: trackByFn">
  {{ item.name }}
</div>
```

## Common Pitfalls & Gotchas

### Known Issues
1. **[Issue Description]**
   - **Cause:** [Why this happens]
   - **Solution:** [How to fix/avoid]

2. **[Issue Description]**
   - **Cause:** [Why this happens]
   - **Solution:** [How to fix/avoid]

### Browser Compatibility
- **Minimum Supported Browsers:**
  - Chrome: [version]
  - Firefox: [version]
  - Safari: [version]
  - Edge: [version]

### Memory Leak Prevention
```typescript
// Always unsubscribe from observables
private destroy$ = new Subject<void>();

ngOnInit() {
  this.dataService.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => {
      // Handle data
    });
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

**Or use async pipe in templates (preferred):**
```html
<div *ngIf="data$ | async as data">
  {{ data }}
</div>
```

### Common Bugs and Solutions
1. **ExpressionChangedAfterItHasBeenCheckedError**
   - Use `ChangeDetectorRef.detectChanges()` carefully
   - Move logic to `ngAfterViewInit` if needed

2. **Route Parameter Issues**
   - Use `ActivatedRoute` properly
   - Subscribe to params in `ngOnInit`

3. **Form Validation Not Working**
   - Ensure validators are properly applied
   - Check FormControl initialization

## Component Generation Guidelines

### When to Use Angular CLI
```bash
# Generate component with OnPush strategy
ng g c features/my-feature/my-component --change-detection OnPush

# Generate standalone component
ng g c features/my-feature/my-component --standalone

# Generate component without test file
ng g c features/my-feature/my-component --skip-tests
```

### Component Template Structure
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // If using OnPush
})
export class MyComponentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor() { }

  ngOnInit(): void {
    // Initialization logic
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Input/Output Patterns
```typescript
// Input with default value
@Input() title: string = 'Default Title';

// Required input (Angular 16+)
@Input({ required: true }) userId!: string;

// Output event
@Output() itemSelected = new EventEmitter<Item>();

// Emit event
onItemClick(item: Item): void {
  this.itemSelected.emit(item);
}
```

### Lifecycle Hook Usage
- **ngOnInit:** Component initialization, API calls, subscriptions
- **ngOnChanges:** React to input property changes
- **ngAfterViewInit:** Access view children, DOM manipulation
- **ngOnDestroy:** Cleanup, unsubscribe from observables
- **ngDoCheck:** Custom change detection (use sparingly)

## Angular CLI MCP Integration (If Available)

When the Angular CLI MCP server is available, use these tools to assist with development:

### Documentation Tools
- Use `search_documentation` for Angular API questions
- Use `get_best_practices` before generating new code
- Use `find_examples` for reference implementations

### Project Analysis
- Use `list_projects` to understand workspace structure
- Use `onpush_zoneless_migration` when optimizing change detection

### Code Modernization
- Use `modernize` (experimental) to update legacy code patterns
- Always commit code before using experimental tools

Refer to the Angular CLI MCP Integration Guide for detailed usage instructions.

## Additional Resources

### Documentation
- **Project Documentation:** [Link to project docs]
- **API Documentation:** [Link to API docs]
- **Design System:** [Link to design system/style guide]

### Team Contacts
- **Tech Lead:** [Name/Contact]
- **DevOps:** [Name/Contact]
- **QA Lead:** [Name/Contact]

### Useful Links
- **Repository:** [GitHub/GitLab URL]
- **CI/CD Dashboard:** [Link]
- **Staging Environment:** [URL]
- **Production Environment:** [URL]
- **Bug Tracker:** [Jira/GitHub Issues URL]

## Quick Reference

### Most Common Tasks
1. **Start development:** `ng serve`
2. **Create component:** `ng g c features/[name]`
3. **Run tests:** `ng test`
4. **Build for production:** `ng build --configuration production`
5. **Check code quality:** `ng lint`

### Emergency Contacts
- **Production Issues:** [Contact/Slack channel]
- **Deployment Issues:** [Contact/Slack channel]
- **Security Concerns:** [Contact/Email]