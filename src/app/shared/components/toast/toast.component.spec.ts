import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { ZardToastComponent } from './toast.component';
import { ZardIconComponent } from '../icon/icon.component';

describe('ZardToastComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardToastComponent, ZardIconComponent],
    }).compileComponents();
  });

  describe('isolated tests', () => {
    let component: ZardToastComponent;
    let fixture: ComponentFixture<ZardToastComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(ZardToastComponent);
      component = fixture.componentInstance;
      // Set required inputs before detecting changes
      fixture.componentRef.setInput('message', 'Test message');
      fixture.componentRef.setInput('id', 'test-id');
      fixture.detectChanges();
    });

    afterEach(() => {
      fixture.destroy();
    });

    describe('initialization', () => {
      it('should create the component', () => {
        expect(component).toBeTruthy();
      });

      it('should default to info type', () => {
        expect(component.type()).toBe('info');
      });

      it('should default to entering state', () => {
        expect(component.state()).toBe('entering');
      });
    });

    describe('required inputs', () => {
      it('should require message input', () => {
        expect(component['message']).toBeTruthy();
      });

      it('should require id input', () => {
        expect(component['id']).toBeTruthy();
      });

      it('should render message in template', () => {
        fixture.componentRef.setInput('message', 'Test message');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        const messageElement = fixture.nativeElement.querySelector('[data-slot="toast-message"]');
        expect(messageElement).toBeTruthy();
        expect(messageElement.textContent?.trim()).toBe('Test message');
      });

      it('should render id as data attribute', () => {
        fixture.componentRef.setInput('message', 'Test');
        fixture.componentRef.setInput('id', 'toast-123');
        fixture.detectChanges();

        const toastElement = fixture.nativeElement.querySelector('[data-toast-id]');
        expect(toastElement).toBeTruthy();
        expect(toastElement.getAttribute('data-toast-id')).toBe('toast-123');
      });
    });

    describe('toast types', () => {
      describe('success type', () => {
        beforeEach(() => {
          fixture.componentRef.setInput('message', 'Success message');
          fixture.componentRef.setInput('id', 'test-id');
          fixture.componentRef.setInput('type', 'success');
          fixture.detectChanges();
        });

        it('should render with success styling', () => {
          const toast = fixture.debugElement.nativeElement;
          expect(toast.classList.contains('border-green-500')).toBe(true);
          expect(toast.classList.contains('bg-green-50')).toBe(true);
          expect(toast.classList.contains('text-green-900')).toBe(true);
        });

        it('should render circle-check icon', () => {
          const icon = fixture.nativeElement.querySelector('[data-slot="toast-icon"]');
          expect(icon).toBeTruthy();

          const zIconDebug = fixture.debugElement.query(By.directive(ZardIconComponent));
          expect(zIconDebug).toBeTruthy();
          expect(zIconDebug.componentInstance.zType()).toBe('circle-check');
        });
      });

      describe('error type', () => {
        beforeEach(() => {
          fixture.componentRef.setInput('message', 'Error message');
          fixture.componentRef.setInput('id', 'test-id');
          fixture.componentRef.setInput('type', 'error');
          fixture.detectChanges();
        });

        it('should render with error styling', () => {
          const toast = fixture.debugElement.nativeElement;
          expect(toast.classList.contains('border-red-500')).toBe(true);
          expect(toast.classList.contains('bg-red-50')).toBe(true);
          expect(toast.classList.contains('text-red-900')).toBe(true);
        });

        it('should render circle-x icon', () => {
          const icon = fixture.nativeElement.querySelector('[data-slot="toast-icon"]');
          expect(icon).toBeTruthy();

          const zIconDebug = fixture.debugElement.query(By.directive(ZardIconComponent));
          expect(zIconDebug).toBeTruthy();
          expect(zIconDebug.componentInstance.zType()).toBe('circle-x');
        });
      });

      describe('info type', () => {
        beforeEach(() => {
          fixture.componentRef.setInput('message', 'Info message');
          fixture.componentRef.setInput('id', 'test-id');
          fixture.componentRef.setInput('type', 'info');
          fixture.detectChanges();
        });

        it('should render with info styling', () => {
          const toast = fixture.debugElement.nativeElement;
          expect(toast.classList.contains('border-blue-500')).toBe(true);
          expect(toast.classList.contains('bg-blue-50')).toBe(true);
          expect(toast.classList.contains('text-blue-900')).toBe(true);
        });

        it('should render info icon', () => {
          const icon = fixture.nativeElement.querySelector('[data-slot="toast-icon"]');
          expect(icon).toBeTruthy();

          const zIconDebug = fixture.debugElement.query(By.directive(ZardIconComponent));
          expect(zIconDebug).toBeTruthy();
          expect(zIconDebug.componentInstance.zType()).toBe('info');
        });
      });
    });

    describe('animation states', () => {
      it('should have entering state by default', () => {
        fixture.componentRef.setInput('message', 'Test');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        const toast = fixture.debugElement.nativeElement;
        expect(toast.getAttribute('data-state')).toBe('entering');
      });

      it('should apply entering animation classes', () => {
        fixture.componentRef.setInput('state', 'entering');
        fixture.detectChanges();

        const toast = fixture.debugElement.nativeElement;
        expect(toast.getAttribute('data-state')).toBe('entering');
        // Check that base classes are present
        expect(toast.classList.contains('transition-all')).toBe(true);
        expect(toast.classList.contains('duration-300')).toBe(true);
      });

      it('should apply visible state classes', () => {
        fixture.componentRef.setInput('state', 'visible');
        fixture.detectChanges();

        const toast = fixture.debugElement.nativeElement;
        expect(toast.getAttribute('data-state')).toBe('visible');
        expect(toast.classList.contains('transition-all')).toBe(true);
      });

      it('should apply exiting animation classes', () => {
        fixture.componentRef.setInput('state', 'exiting');
        fixture.detectChanges();

        const toast = fixture.debugElement.nativeElement;
        expect(toast.getAttribute('data-state')).toBe('exiting');
        // Check that base classes are present
        expect(toast.classList.contains('transition-all')).toBe(true);
        expect(toast.classList.contains('duration-300')).toBe(true);
      });
    });

    describe('close button', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('message', 'Test message');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();
      });

      it('should render close button', () => {
        const closeButton = fixture.nativeElement.querySelector('[data-slot="toast-close"]');
        expect(closeButton).toBeTruthy();
        expect(closeButton.tagName).toBe('BUTTON');
      });

      it('should render x icon in close button', () => {
        const closeButtonDebug = fixture.debugElement.query(By.css('[data-slot="toast-close"]'));
        const zIconDebug = closeButtonDebug.query(By.directive(ZardIconComponent));

        expect(zIconDebug).toBeTruthy();
        expect(zIconDebug.componentInstance.zType()).toBe('x');
      });

      it('should have proper ARIA label on close button', () => {
        const closeButton = fixture.nativeElement.querySelector('[data-slot="toast-close"]');
        expect(closeButton.getAttribute('aria-label')).toBe('Close notification');
      });

      it('should emit closeToast event when close button is clicked', () => {
        vi.spyOn(component.closeToast, 'emit');
        const closeButton = fixture.nativeElement.querySelector('[data-slot="toast-close"]');

        closeButton.click();
        fixture.detectChanges();

        expect(component.closeToast.emit).toHaveBeenCalled();
      });

      it('should apply close button styling classes', () => {
        const closeButton = fixture.nativeElement.querySelector('[data-slot="toast-close"]');
        expect(closeButton.classList.contains('opacity-70')).toBe(true);
        expect(closeButton.classList.contains('hover:opacity-100')).toBe(true);
        expect(closeButton.classList.contains('transition-opacity')).toBe(true);
      });
    });

    describe('accessibility', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('message', 'Test message');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();
      });

      it('should have role="status"', () => {
        const toast = fixture.nativeElement.querySelector('[role="status"]');
        expect(toast).toBeTruthy();
      });

      it('should have aria-live="polite"', () => {
        const toast = fixture.nativeElement.querySelector('[aria-live="polite"]');
        expect(toast).toBeTruthy();
      });
    });

    describe('layout', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('message', 'Test message');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();
      });

      it('should have flex container with proper spacing', () => {
        const toast = fixture.debugElement.nativeElement;
        expect(toast.classList.contains('flex')).toBe(true);
        expect(toast.classList.contains('items-center')).toBe(true);
        expect(toast.classList.contains('justify-between')).toBe(true);
      });

      it('should have border and shadow', () => {
        const toast = fixture.debugElement.nativeElement;
        expect(toast.classList.contains('border')).toBe(true);
        expect(toast.classList.contains('shadow-lg')).toBe(true);
      });

      it('should have rounded corners', () => {
        const toast = fixture.debugElement.nativeElement;
        expect(toast.classList.contains('rounded-md')).toBe(true);
      });

      it('should have transition classes', () => {
        const toast = fixture.debugElement.nativeElement;
        expect(toast.classList.contains('transition-all')).toBe(true);
        expect(toast.classList.contains('duration-300')).toBe(true);
      });
    });

    describe('custom classes', () => {
      it('should apply custom classes when class input is provided', () => {
        fixture.componentRef.setInput('message', 'Test');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.componentRef.setInput('class', 'custom-class another-class');
        fixture.detectChanges();

        const toast = fixture.debugElement.nativeElement;
        expect(toast.classList.contains('custom-class')).toBe(true);
        expect(toast.classList.contains('another-class')).toBe(true);
      });

      it('should merge custom classes with default classes', () => {
        fixture.componentRef.setInput('message', 'Test');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.componentRef.setInput('class', 'custom-class');
        fixture.componentRef.setInput('type', 'success');
        fixture.detectChanges();

        const toast = fixture.debugElement.nativeElement;
        expect(toast.classList.contains('custom-class')).toBe(true);
        expect(toast.classList.contains('border-green-500')).toBe(true);
        expect(toast.classList.contains('flex')).toBe(true);
      });
    });

    describe('message rendering', () => {
      it('should render short message correctly', () => {
        fixture.componentRef.setInput('message', 'Hi');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        const messageElement = fixture.nativeElement.querySelector('[data-slot="toast-message"]');
        expect(messageElement.textContent?.trim()).toBe('Hi');
      });

      it('should render long message correctly', () => {
        const longMessage = 'A'.repeat(500);
        fixture.componentRef.setInput('message', longMessage);
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        const messageElement = fixture.nativeElement.querySelector('[data-slot="toast-message"]');
        expect(messageElement.textContent?.trim()).toBe(longMessage);
      });

      it('should render message with special characters', () => {
        const specialMessage = 'Test with <special> & "characters"';
        fixture.componentRef.setInput('message', specialMessage);
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        const messageElement = fixture.nativeElement.querySelector('[data-slot="toast-message"]');
        expect(messageElement.textContent?.trim()).toBe(specialMessage);
      });

      it('should apply message classes', () => {
        fixture.componentRef.setInput('message', 'Test');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        const messageElement = fixture.nativeElement.querySelector('[data-slot="toast-message"]');
        expect(messageElement.classList.contains('text-sm')).toBe(true);
        expect(messageElement.classList.contains('font-medium')).toBe(true);
        expect(messageElement.classList.contains('flex-1')).toBe(true);
      });
    });

    describe('icon wrapper', () => {
      it('should apply icon wrapper classes', () => {
        fixture.componentRef.setInput('message', 'Test');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        const iconWrapper = fixture.nativeElement.querySelector('[data-slot="toast-icon"]');
        expect(iconWrapper.classList.contains('flex')).toBe(true);
        expect(iconWrapper.classList.contains('shrink-0')).toBe(true);
        expect(iconWrapper.classList.contains('items-center')).toBe(true);
        expect(iconWrapper.classList.contains('justify-center')).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should handle empty message', () => {
        fixture.componentRef.setInput('message', '');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        const messageElement = fixture.nativeElement.querySelector('[data-slot="toast-message"]');
        expect(messageElement.textContent?.trim()).toBe('');
      });

      it('should handle very long ID', () => {
        const longId = 'a'.repeat(100);
        fixture.componentRef.setInput('message', 'Test');
        fixture.componentRef.setInput('id', longId);
        fixture.detectChanges();

        const toast = fixture.nativeElement.querySelector('[data-toast-id]');
        expect(toast.getAttribute('data-toast-id')).toBe(longId);
      });

      it('should handle whitespace-only message', () => {
        fixture.componentRef.setInput('message', '   ');
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        // HTML collapses whitespace, so check the component input instead
        expect(component.message()).toBe('   ');
      });

      it('should handle newline characters in message', () => {
        const messageWithNewlines = 'Line 1\nLine 2\nLine 3';
        fixture.componentRef.setInput('message', messageWithNewlines);
        fixture.componentRef.setInput('id', 'test-id');
        fixture.detectChanges();

        const messageElement = fixture.nativeElement.querySelector('[data-slot="toast-message"]');
        expect(messageElement.textContent?.trim()).toBe(messageWithNewlines);
      });
    });

    describe('computed properties', () => {
      it('should compute correct icon name for success type', () => {
        fixture.componentRef.setInput('type', 'success');
        expect(component['iconName']()).toBe('circle-check');
      });

      it('should compute correct icon name for error type', () => {
        fixture.componentRef.setInput('type', 'error');
        expect(component['iconName']()).toBe('circle-x');
      });

      it('should compute correct icon name for info type', () => {
        fixture.componentRef.setInput('type', 'info');
        expect(component['iconName']()).toBe('info');
      });

      it('should compute data-state from state input', () => {
        fixture.componentRef.setInput('state', 'visible');
        expect(component['dataState']()).toBe('visible');
      });
    });

    describe('output events', () => {
      it('should have closeToast output', () => {
        expect(component.closeToast).toBeTruthy();
      });

      it('should emit closeToast without arguments', () => {
        vi.spyOn(component.closeToast, 'emit');
        component['onClose']();

        expect(component.closeToast.emit).toHaveBeenCalledWith();
      });
    });
  });
});
