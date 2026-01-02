import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZardAlertComponent } from './alert.component';

describe('ZardAlertComponent', () => {
  let component: ZardAlertComponent;
  let fixture: ComponentFixture<ZardAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardAlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZardAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should default to default variant', () => {
      expect(component.zType()).toBe('default');
    });
  });

  describe('variants', () => {
    describe('default variant', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('zType', 'default');
        fixture.componentRef.setInput('zTitle', 'Default Alert');
        fixture.detectChanges();
      });

      it('should render with default styling', () => {
        const alert = fixture.debugElement.nativeElement;
        expect(alert).toBeTruthy();
        expect(alert.classList.contains('bg-card')).toBe(true);
        expect(alert.classList.contains('text-card-foreground')).toBe(true);
      });

      it('should not render an icon by default', () => {
        const icon = fixture.nativeElement.querySelector('[data-slot="alert-icon"]');
        expect(icon).toBeNull();
      });
    });

    describe('destructive variant', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('zType', 'destructive');
        fixture.componentRef.setInput('zTitle', 'Error Alert');
        fixture.detectChanges();
      });

      it('should render with destructive styling', () => {
        const alert = fixture.debugElement.nativeElement;
        expect(alert).toBeTruthy();
        expect(alert.classList.contains('text-destructive')).toBe(true);
        expect(alert.classList.contains('bg-card')).toBe(true);
      });

      it('should render circle-alert icon by default', () => {
        const icon = fixture.nativeElement.querySelector('[data-slot="alert-icon"]');
        expect(icon).toBeTruthy();

        const zIcon = icon.querySelector('z-icon');
        expect(zIcon).toBeTruthy();
      });

      it('should render description with destructive text color', () => {
        fixture.componentRef.setInput('zDescription', 'An error occurred');
        fixture.detectChanges();

        const description = fixture.nativeElement.querySelector('[data-slot="alert-description"]');
        expect(description).toBeTruthy();
        expect(description.classList.contains('text-destructive/90')).toBe(true);
      });
    });

    describe('warning variant', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('zType', 'warning');
        fixture.componentRef.setInput('zTitle', 'Warning Alert');
        fixture.detectChanges();
      });

      it('should render with warning styling', () => {
        const alert = fixture.debugElement.nativeElement;
        expect(alert).toBeTruthy();
        expect(alert.classList.contains('text-warning')).toBe(true);
        expect(alert.classList.contains('bg-card')).toBe(true);
      });

      it('should render triangle-alert icon by default', () => {
        const icon = fixture.nativeElement.querySelector('[data-slot="alert-icon"]');
        expect(icon).toBeTruthy();

        const zIcon = icon.querySelector('z-icon');
        expect(zIcon).toBeTruthy();
      });

      it('should render description with warning text color', () => {
        fixture.componentRef.setInput('zDescription', 'Please be aware');
        fixture.detectChanges();

        const description = fixture.nativeElement.querySelector('[data-slot="alert-description"]');
        expect(description).toBeTruthy();
        expect(description.classList.contains('text-warning/90')).toBe(true);
      });
    });

    describe('info variant', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('zType', 'info');
        fixture.componentRef.setInput('zTitle', 'Info Alert');
        fixture.detectChanges();
      });

      it('should render with info styling', () => {
        const alert = fixture.debugElement.nativeElement;
        expect(alert).toBeTruthy();
        expect(alert.classList.contains('text-info')).toBe(true);
        expect(alert.classList.contains('bg-card')).toBe(true);
      });

      it('should render info icon by default', () => {
        const icon = fixture.nativeElement.querySelector('[data-slot="alert-icon"]');
        expect(icon).toBeTruthy();

        const zIcon = icon.querySelector('z-icon');
        expect(zIcon).toBeTruthy();
      });

      it('should render description with info text color', () => {
        fixture.componentRef.setInput('zDescription', 'For your information');
        fixture.detectChanges();

        const description = fixture.nativeElement.querySelector('[data-slot="alert-description"]');
        expect(description).toBeTruthy();
        expect(description.classList.contains('text-info/90')).toBe(true);
      });
    });
  });

  describe('content rendering', () => {
    it('should render title when provided', () => {
      fixture.componentRef.setInput('zTitle', 'Test Title');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('[data-slot="alert-title"]');
      expect(title).toBeTruthy();
      expect(title.textContent.trim()).toBe('Test Title');
    });

    it('should not render title when not provided', () => {
      const title = fixture.nativeElement.querySelector('[data-slot="alert-title"]');
      expect(title).toBeNull();
    });

    it('should render description when provided', () => {
      fixture.componentRef.setInput('zDescription', 'Test Description');
      fixture.detectChanges();

      const description = fixture.nativeElement.querySelector('[data-slot="alert-description"]');
      expect(description).toBeTruthy();
      expect(description.textContent.trim()).toBe('Test Description');
    });

    it('should not render description when not provided', () => {
      const description = fixture.nativeElement.querySelector('[data-slot="alert-description"]');
      expect(description).toBeNull();
    });

    it('should render both title and description when both provided', () => {
      fixture.componentRef.setInput('zTitle', 'Test Title');
      fixture.componentRef.setInput('zDescription', 'Test Description');
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('[data-slot="alert-title"]');
      const description = fixture.nativeElement.querySelector('[data-slot="alert-description"]');

      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
    });
  });

  describe('custom icon', () => {
    it('should accept custom icon input', () => {
      fixture.componentRef.setInput('zIcon', 'check-circle');
      expect(component.zIcon()).toBe('check-circle');
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', () => {
      const alert = fixture.debugElement.nativeElement;
      expect(alert.getAttribute('role')).toBe('alert');
    });

    it('should have data-slot="alert"', () => {
      const alert = fixture.debugElement.nativeElement;
      expect(alert.getAttribute('data-slot')).toBe('alert');
    });
  });

  describe('custom classes', () => {
    it('should apply custom classes when class input is provided', () => {
      fixture.componentRef.setInput('class', 'custom-class');
      fixture.detectChanges();

      const alert = fixture.debugElement.nativeElement;
      expect(alert.classList.contains('custom-class')).toBe(true);
    });

    it('should merge custom classes with variant classes', () => {
      fixture.componentRef.setInput('class', 'custom-class');
      fixture.componentRef.setInput('zType', 'destructive');
      fixture.detectChanges();

      const alert = fixture.debugElement.nativeElement;
      expect(alert.classList.contains('custom-class')).toBe(true);
      expect(alert.classList.contains('text-destructive')).toBe(true);
    });
  });
});
