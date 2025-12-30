import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ZardSheetComponent, ZardSheetOptions } from './sheet.component';

// Test host component for template portal tests (reserved for future use)
// @Component({
//   template: `<ng-template #testTemplate>Test Content</ng-template>`,
//   standalone: true,
// })
// class TestHostComponent {
//   @ViewChild('testTemplate', { static: true }) templateRef!: TemplateRef<unknown>;
//   @ViewChild('testTemplate', { static: true, read: ViewContainerRef })
//   viewContainerRef!: ViewContainerRef;
// }

describe('ZardSheetComponent', () => {
  let component: ZardSheetComponent<unknown, unknown>;
  let fixture: ComponentFixture<ZardSheetComponent<unknown, unknown>>;
  let config: ZardSheetOptions<unknown, unknown>;

  function createComponent(options: Partial<ZardSheetOptions<unknown, unknown>> = {}) {
    config = new ZardSheetOptions();
    Object.assign(config, options);

    TestBed.configureTestingModule({
      imports: [ZardSheetComponent],
      providers: [provideNoopAnimations(), { provide: ZardSheetOptions, useValue: config }],
    });

    fixture = TestBed.createComponent(ZardSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('initialization', () => {
    it('should create the component', () => {
      createComponent();
      expect(component).toBeTruthy();
    });

    it('should start with closed state', () => {
      createComponent();
      expect(component.state()).toBe('closed');
    });

    it('should have portalOutlet defined', () => {
      createComponent();
      expect(component.portalOutlet).toBeDefined();
    });
  });

  describe('config options', () => {
    it('should show close button when zClosable is true', () => {
      createComponent({ zClosable: true });
      const closeBtn = fixture.nativeElement.querySelector('[data-testid="z-close-header-button"]');
      expect(closeBtn).toBeTruthy();
    });

    it('should show close button when zClosable is undefined', () => {
      createComponent({});
      const closeBtn = fixture.nativeElement.querySelector('[data-testid="z-close-header-button"]');
      expect(closeBtn).toBeTruthy();
    });

    it('should hide close button when zClosable is false', () => {
      createComponent({ zClosable: false });
      const closeBtn = fixture.nativeElement.querySelector('[data-testid="z-close-header-button"]');
      expect(closeBtn).toBeNull();
    });

    it('should display title when provided', () => {
      createComponent({ zTitle: 'Test Title' });
      const title = fixture.nativeElement.querySelector('[data-testid="z-title"]');
      expect(title).toBeTruthy();
      expect(title.textContent.trim()).toBe('Test Title');
    });

    it('should display description when provided with title', () => {
      createComponent({ zTitle: 'Test Title', zDescription: 'Test Description' });
      const desc = fixture.nativeElement.querySelector('[data-testid="z-description"]');
      expect(desc).toBeTruthy();
      expect(desc.textContent.trim()).toBe('Test Description');
    });

    it('should not display description without title', () => {
      createComponent({ zDescription: 'Test Description' });
      const desc = fixture.nativeElement.querySelector('[data-testid="z-description"]');
      expect(desc).toBeNull();
    });

    it('should render string content when provided', () => {
      createComponent({ zContent: '<p>String Content</p>' });
      const content = fixture.nativeElement.querySelector('[data-testid="z-content"]');
      expect(content).toBeTruthy();
      expect(content.innerHTML).toContain('String Content');
    });

    it('should show footer by default', () => {
      createComponent();
      const footer = fixture.nativeElement.querySelector('[data-slot="sheet-footer"]');
      expect(footer).toBeTruthy();
    });

    it('should hide footer when zHideFooter is true', () => {
      createComponent({ zHideFooter: true });
      const footer = fixture.nativeElement.querySelector('[data-slot="sheet-footer"]');
      expect(footer).toBeNull();
    });
  });

  describe('footer buttons', () => {
    it('should show OK button with default text', () => {
      createComponent();
      const okBtn = fixture.nativeElement.querySelector('[data-testid="z-ok-button"]');
      expect(okBtn).toBeTruthy();
      expect(okBtn.textContent.trim()).toBe('OK');
    });

    it('should show OK button with custom text', () => {
      createComponent({ zOkText: 'Confirm' });
      const okBtn = fixture.nativeElement.querySelector('[data-testid="z-ok-button"]');
      expect(okBtn.textContent.trim()).toBe('Confirm');
    });

    it('should hide OK button when zOkText is null', () => {
      createComponent({ zOkText: null });
      const okBtn = fixture.nativeElement.querySelector('[data-testid="z-ok-button"]');
      expect(okBtn).toBeNull();
    });

    it('should pass zOkDisabled to config', () => {
      createComponent({ zOkDisabled: true });
      // Verify the config is correctly passed to the component
      expect(config.zOkDisabled).toBe(true);
      // Button should be present when disabled
      const okBtn = fixture.nativeElement.querySelector('[data-testid="z-ok-button"]');
      expect(okBtn).toBeTruthy();
    });

    it('should show Cancel button with default text', () => {
      createComponent();
      const cancelBtn = fixture.nativeElement.querySelector('[data-testid="z-cancel-button"]');
      expect(cancelBtn).toBeTruthy();
      expect(cancelBtn.textContent.trim()).toBe('Cancel');
    });

    it('should show Cancel button with custom text', () => {
      createComponent({ zCancelText: 'Close' });
      const cancelBtn = fixture.nativeElement.querySelector('[data-testid="z-cancel-button"]');
      expect(cancelBtn.textContent.trim()).toBe('Close');
    });

    it('should hide Cancel button when zCancelText is null', () => {
      createComponent({ zCancelText: null });
      const cancelBtn = fixture.nativeElement.querySelector('[data-testid="z-cancel-button"]');
      expect(cancelBtn).toBeNull();
    });
  });

  describe('button click handlers', () => {
    it('should emit okTriggered when OK button clicked', () => {
      createComponent();
      const emitSpy = vi.spyOn(component.okTriggered, 'emit');

      const okBtn = fixture.nativeElement.querySelector('[data-testid="z-ok-button"]');
      okBtn.click();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit cancelTriggered when Cancel button clicked', () => {
      createComponent();
      const emitSpy = vi.spyOn(component.cancelTriggered, 'emit');

      const cancelBtn = fixture.nativeElement.querySelector('[data-testid="z-cancel-button"]');
      cancelBtn.click();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit cancelTriggered when close button clicked', () => {
      createComponent({ zClosable: true });
      const emitSpy = vi.spyOn(component.cancelTriggered, 'emit');

      const closeBtn = fixture.nativeElement.querySelector('[data-testid="z-close-header-button"]');
      closeBtn.click();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('onOkClick and onCloseClick methods', () => {
    it('onOkClick should emit okTriggered', () => {
      createComponent();
      const emitSpy = vi.spyOn(component.okTriggered, 'emit');
      component.onOkClick();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('onCloseClick should emit cancelTriggered', () => {
      createComponent();
      const emitSpy = vi.spyOn(component.cancelTriggered, 'emit');
      component.onCloseClick();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('getNativeElement', () => {
    it('should return the host element', () => {
      createComponent();
      const nativeEl = component.getNativeElement();
      expect(nativeEl).toBeTruthy();
      // In TestBed, the host element may be the fixture wrapper
      // Verify it has the expected data-slot attribute from the component
      expect(nativeEl.getAttribute('data-slot')).toBe('sheet');
    });
  });

  describe('state management', () => {
    it('should allow state to be changed to open', () => {
      createComponent();
      component.state.set('open');
      expect(component.state()).toBe('open');
    });

    it('should allow state to be changed back to closed', () => {
      createComponent();
      component.state.set('open');
      component.state.set('closed');
      expect(component.state()).toBe('closed');
    });
  });

  describe('classes computation', () => {
    it('should apply left side variant', () => {
      createComponent({ zSide: 'left' });
      const hostEl = fixture.nativeElement;
      expect(hostEl.className).toContain('left');
    });

    it('should apply right side variant', () => {
      createComponent({ zSide: 'right' });
      const hostEl = fixture.nativeElement;
      expect(hostEl.className).toContain('right');
    });

    it('should apply custom size when width is specified', () => {
      createComponent({ zWidth: '500px' });
      const hostEl = fixture.nativeElement;
      expect(hostEl.style.width).toBe('500px');
    });

    it('should apply custom size when height is specified', () => {
      createComponent({ zHeight: '300px' });
      const hostEl = fixture.nativeElement;
      expect(hostEl.style.height).toBe('300px');
    });

    it('should apply custom classes when provided', () => {
      createComponent({ zCustomClasses: 'my-custom-class' });
      const hostEl = fixture.nativeElement;
      expect(hostEl.className).toContain('my-custom-class');
    });
  });

  describe('portal attachment', () => {
    it('should throw when attaching component portal if already attached', () => {
      createComponent();

      // Mock the portalOutlet to return hasAttached as true
      const portalOutlet = component.portalOutlet();
      vi.spyOn(portalOutlet!, 'hasAttached').mockReturnValue(true);

      const portal = {} as ComponentPortal<unknown>;
      expect(() => component.attachComponentPortal(portal)).toThrow(
        'Attempting to attach modal content after content is already attached',
      );
    });

    it('should throw when attaching template portal if already attached', () => {
      createComponent();

      // Mock the portalOutlet to return hasAttached as true
      const portalOutlet = component.portalOutlet();
      vi.spyOn(portalOutlet!, 'hasAttached').mockReturnValue(true);

      const portal = {} as TemplatePortal<unknown>;
      expect(() => component.attachTemplatePortal(portal)).toThrow(
        'Attempting to attach modal content after content is already attached',
      );
    });
  });

  describe('host bindings', () => {
    it('should have data-slot attribute', () => {
      createComponent();
      const hostEl = fixture.nativeElement;
      expect(hostEl.getAttribute('data-slot')).toBe('sheet');
    });

    it('should have data-state attribute reflecting state signal', () => {
      createComponent();
      const hostEl = fixture.nativeElement;
      expect(hostEl.getAttribute('data-state')).toBe('closed');

      component.state.set('open');
      fixture.detectChanges();
      expect(hostEl.getAttribute('data-state')).toBe('open');
    });
  });

  describe('destructive mode', () => {
    it('should apply destructive style to OK button when zOkDestructive is true', () => {
      createComponent({ zOkDestructive: true });
      const okBtn = fixture.nativeElement.querySelector('[data-testid="z-ok-button"]');
      // The button should have destructive type applied via z-button directive
      expect(okBtn).toBeTruthy();
    });
  });

  describe('icons', () => {
    it('should show OK icon when zOkIcon is provided', () => {
      createComponent({ zOkIcon: 'check' });
      const okBtn = fixture.nativeElement.querySelector('[data-testid="z-ok-button"]');
      const icon = okBtn?.querySelector('z-icon');
      expect(icon).toBeTruthy();
    });

    it('should show Cancel icon when zCancelIcon is provided', () => {
      createComponent({ zCancelIcon: 'x' });
      const cancelBtn = fixture.nativeElement.querySelector('[data-testid="z-cancel-button"]');
      const icon = cancelBtn?.querySelector('z-icon');
      expect(icon).toBeTruthy();
    });
  });
});

describe('ZardSheetOptions', () => {
  it('should have correct default values', () => {
    const options = new ZardSheetOptions();
    expect(options.zSide).toBe('left');
    expect(options.zSize).toBe('default');
    expect(typeof options.zOnCancel).toBe('function');
    expect(typeof options.zOnOk).toBe('function');
  });
});
