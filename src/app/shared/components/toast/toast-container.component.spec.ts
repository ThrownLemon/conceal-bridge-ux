import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { ZardToastContainerComponent } from './toast-container.component';
import { ZardToastComponent } from './toast.component';
import { ZardToastService } from './toast.service';

describe('ZardToastContainerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZardToastContainerComponent, ZardToastComponent],
      providers: [ZardToastService],
    }).compileComponents();
  });

  describe('isolated tests', () => {
    let component: ZardToastContainerComponent;
    let fixture: ComponentFixture<ZardToastContainerComponent>;
    let toastService: ZardToastService;

    beforeEach(() => {
      fixture = TestBed.createComponent(ZardToastContainerComponent);
      component = fixture.componentInstance;
      toastService = TestBed.inject(ZardToastService);
      fixture.detectChanges();
    });

    afterEach(() => {
      fixture.destroy();
      toastService.clear();
    });

    describe('initialization', () => {
      it('should create the component', () => {
        expect(component).toBeTruthy();
      });

      it('should expose toasts signal from service', () => {
        expect(component.toasts).toBe(toastService.toasts);
      });
    });

    describe('layout and positioning', () => {
      it('should have fixed positioning classes', () => {
        const hostElement = fixture.debugElement.nativeElement;
        expect(hostElement.classList.contains('fixed')).toBe(true);
        expect(hostElement.classList.contains('bottom-0')).toBe(true);
        expect(hostElement.classList.contains('right-0')).toBe(true);
      });

      it('should have proper z-index', () => {
        const hostElement = fixture.debugElement.nativeElement;
        expect(hostElement.classList.contains('z-50')).toBe(true);
      });

      it('should have pointer-events-none on host', () => {
        const hostElement = fixture.debugElement.nativeElement;
        expect(hostElement.classList.contains('pointer-events-none')).toBe(true);
      });

      it('should have flex layout with gap', () => {
        const hostElement = fixture.debugElement.nativeElement;
        expect(hostElement.classList.contains('flex')).toBe(true);
        expect(hostElement.classList.contains('flex-col')).toBe(true);
        expect(hostElement.classList.contains('gap-2')).toBe(true);
      });

      it('should have proper padding', () => {
        const hostElement = fixture.debugElement.nativeElement;
        expect(hostElement.classList.contains('p-4')).toBe(true);
      });

      it('should have max-width constraint', () => {
        const hostElement = fixture.debugElement.nativeElement;
        expect(hostElement.classList.contains('max-w-screen-sm')).toBe(true);
        expect(hostElement.classList.contains('w-full')).toBe(true);
      });

      it('should enable pointer events on container', () => {
        const container = fixture.nativeElement.querySelector('[role="status"]');
        expect(container).toBeTruthy();
        expect(container.classList.contains('pointer-events-auto')).toBe(true);
      });

      it('should use flex-col-reverse for stacking', () => {
        const container = fixture.nativeElement.querySelector('[role="status"]');
        expect(container.classList.contains('flex-col-reverse')).toBe(true);
      });
    });

    describe('accessibility', () => {
      it('should have role="status"', () => {
        const container = fixture.nativeElement.querySelector('[role="status"]');
        expect(container).toBeTruthy();
        expect(container.getAttribute('role')).toBe('status');
      });

      it('should have aria-live="polite"', () => {
        const container = fixture.nativeElement.querySelector('[aria-live="polite"]');
        expect(container).toBeTruthy();
        expect(container.getAttribute('aria-live')).toBe('polite');
      });

      it('should have aria-atomic="true"', () => {
        const container = fixture.nativeElement.querySelector('[aria-atomic="true"]');
        expect(container).toBeTruthy();
        expect(container.getAttribute('aria-atomic')).toBe('true');
      });
    });

    describe('toast rendering', () => {
      it('should render no toasts initially', () => {
        const toasts = fixture.debugElement.queryAll(By.directive(ZardToastComponent));
        expect(toasts.length).toBe(0);
      });

      it('should render a single toast', () => {
        toastService.success('Test message');
        fixture.detectChanges();

        const toasts = fixture.debugElement.queryAll(By.directive(ZardToastComponent));
        expect(toasts.length).toBe(1);
      });

      it('should render multiple toasts', () => {
        toastService.success('Message 1');
        toastService.error('Message 2');
        toastService.info('Message 3');
        fixture.detectChanges();

        const toasts = fixture.debugElement.queryAll(By.directive(ZardToastComponent));
        expect(toasts.length).toBe(3);
      });

      it('should pass correct message to toast component', () => {
        toastService.success('Test message');
        fixture.detectChanges();

        const toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        expect(toastComponent.componentInstance.message()).toBe('Test message');
      });

      it('should pass correct type to toast component', () => {
        toastService.error('Error message');
        fixture.detectChanges();

        const toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        expect(toastComponent.componentInstance.type()).toBe('error');
      });

      it('should pass correct id to toast component', () => {
        const id = toastService.success('Test message');
        fixture.detectChanges();

        const toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        expect(toastComponent.componentInstance.id()).toBe(id);
      });

      it('should track toasts by id in @for loop', () => {
        const id1 = toastService.success('Message 1');
        const id2 = toastService.error('Message 2');
        fixture.detectChanges();

        const toasts = fixture.debugElement.queryAll(By.directive(ZardToastComponent));
        expect(toasts[0].componentInstance.id()).toBe(id1);
        expect(toasts[1].componentInstance.id()).toBe(id2);
      });

      it('should apply pointer-events-auto to toast items', () => {
        toastService.success('Test message');
        fixture.detectChanges();

        const toastElement = fixture.debugElement.query(
          By.directive(ZardToastComponent),
        ).nativeElement;
        expect(toastElement.classList.contains('pointer-events-auto')).toBe(true);
      });
    });

    describe('toast state', () => {
      it('should pass entering state to toast component initially', () => {
        toastService.success('Test message');
        fixture.detectChanges();

        const toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        expect(toastComponent.componentInstance.state()).toBe('entering');
      });

      it('should have entering state data attribute for CSS animations', () => {
        toastService.success('Test message');
        fixture.detectChanges();

        const toastElement = fixture.debugElement.query(By.directive(ZardToastComponent));
        expect(toastElement.nativeElement.getAttribute('data-state')).toBe('entering');
      });
    });

    describe('toast dismissal', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should remove toast after close button click and animation', () => {
        toastService.success('Test message');
        fixture.detectChanges();

        const toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        const closeBtn = toastComponent.nativeElement.querySelector('[data-slot="toast-close"]');

        // Toast exists before clicking
        expect(toastService.toasts().length).toBe(1);

        closeBtn.click();
        fixture.detectChanges();

        // Toast still exists immediately after click (in dismissing state)
        expect(toastService.toasts().length).toBe(1);

        // After animation duration, toast is removed
        vi.advanceTimersByTime(300);
        expect(toastService.toasts().length).toBe(0);
      });

      it('should handle multiple toasts dismissal independently', () => {
        const id1 = toastService.success('Message 1');
        const id2 = toastService.error('Message 2');
        const id3 = toastService.info('Message 3');

        fixture.detectChanges();

        expect(toastService.toasts().length).toBe(3);

        // Click close button on middle toast
        const toastComponents = fixture.debugElement.queryAll(By.directive(ZardToastComponent));
        const closeBtn2 = toastComponents[1].nativeElement.querySelector(
          '[data-slot="toast-close"]',
        );
        closeBtn2.click();

        vi.advanceTimersByTime(300);

        // Only middle toast should be removed
        expect(toastService.toasts().length).toBe(2);
        expect(toastService.toasts().find((t) => t.id === id1)).toBeTruthy();
        expect(toastService.toasts().find((t) => t.id === id2)).toBeFalsy();
        expect(toastService.toasts().find((t) => t.id === id3)).toBeTruthy();
      });

      it('should update toast state to exiting during dismissal', () => {
        toastService.success('Test message');
        fixture.detectChanges();

        const toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        const toastElement = toastComponent.nativeElement;

        // Toast starts in entering state
        expect(toastComponent.componentInstance.state()).toBe('entering');
        expect(toastElement.getAttribute('data-state')).toBe('entering');

        const closeBtn = toastElement.querySelector('[data-slot="toast-close"]');
        closeBtn.click();
        fixture.detectChanges();

        // State should change to exiting after click (entering -> exiting transition is valid)
        expect(toastComponent.componentInstance.state()).toBe('exiting');
        expect(toastElement.getAttribute('data-state')).toBe('exiting');
      });
    });

    describe('toast updates and reactivity', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should update when new toast is added', () => {
        expect(fixture.debugElement.queryAll(By.directive(ZardToastComponent)).length).toBe(0);

        toastService.success('New message');
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.directive(ZardToastComponent)).length).toBe(1);
      });

      it('should update when toast is removed', () => {
        const id = toastService.success('Message');
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.directive(ZardToastComponent)).length).toBe(1);

        toastService.dismiss(id);
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.directive(ZardToastComponent)).length).toBe(0);
      });

      it('should update when all toasts are cleared', () => {
        toastService.success('Message 1');
        toastService.error('Message 2');
        toastService.info('Message 3');
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.directive(ZardToastComponent)).length).toBe(3);

        toastService.clear();
        fixture.detectChanges();

        expect(fixture.debugElement.queryAll(By.directive(ZardToastComponent)).length).toBe(0);
      });

      it('should reactively update toast state and data attribute during dismissal', () => {
        toastService.success('Test message');
        fixture.detectChanges();

        let toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        let toastElement = toastComponent.nativeElement;

        // Initial state
        expect(toastComponent.componentInstance.state()).toBe('entering');
        expect(toastElement.getAttribute('data-state')).toBe('entering');

        const closeBtn = toastElement.querySelector('[data-slot="toast-close"]');
        closeBtn.click();
        fixture.detectChanges();

        // After dismissal
        toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        toastElement = toastComponent.nativeElement;
        expect(toastComponent.componentInstance.state()).toBe('exiting');
        expect(toastElement.getAttribute('data-state')).toBe('exiting');
      });
    });

    describe('edge cases', () => {
      it('should handle rapid toast additions', () => {
        for (let i = 0; i < 10; i++) {
          toastService.info(`Message ${i}`);
        }
        fixture.detectChanges();

        const toasts = fixture.debugElement.queryAll(By.directive(ZardToastComponent));
        expect(toasts.length).toBe(10);
      });

      it('should handle toast with custom duration', () => {
        toastService.show({ message: 'Long toast', duration: 10000 });
        fixture.detectChanges();

        const toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        expect(toastComponent).toBeTruthy();
        expect(toastComponent.componentInstance.message()).toBe('Long toast');
      });

      it('should handle toast with custom ID', () => {
        const customId = 'my-custom-toast-id';
        toastService.show({ message: 'Custom ID toast', id: customId });
        fixture.detectChanges();

        const toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        expect(toastComponent.componentInstance.id()).toBe(customId);
      });

      it('should handle empty toasts array after clear', () => {
        toastService.success('Message');
        toastService.clear();
        fixture.detectChanges();

        const toasts = fixture.debugElement.queryAll(By.directive(ZardToastComponent));
        expect(toasts.length).toBe(0);
      });

      it('should handle very long message in toast', () => {
        const longMessage = 'A'.repeat(1000);
        toastService.success(longMessage);
        fixture.detectChanges();

        const toastComponent = fixture.debugElement.query(By.directive(ZardToastComponent));
        expect(toastComponent.componentInstance.message()).toBe(longMessage);
      });
    });

    describe('integration with toast service', () => {
      it('should subscribe to toasts signal changes', () => {
        expect(component.toasts()).toEqual([]);

        toastService.success('Test');
        fixture.detectChanges();

        expect(component.toasts().length).toBe(1);
      });

      it('should share same toasts signal with service', () => {
        expect(component.toasts).toBe(toastService.toasts);
      });

      it('should reflect service changes immediately', () => {
        const id = toastService.success('First');

        expect(component.toasts().length).toBe(1);
        expect(component.toasts()[0].message).toBe('First');

        toastService.dismiss(id);

        expect(component.toasts().length).toBe(0);
      });
    });

    describe('toast ordering', () => {
      it('should maintain toast order from service', () => {
        toastService.success('First');
        toastService.error('Second');
        toastService.info('Third');
        fixture.detectChanges();

        const toasts = fixture.debugElement.queryAll(By.directive(ZardToastComponent));
        expect(toasts[0].componentInstance.message()).toBe('First');
        expect(toasts[1].componentInstance.message()).toBe('Second');
        expect(toasts[2].componentInstance.message()).toBe('Third');
      });

      it('should maintain order after removing middle toast', () => {
        toastService.success('First');
        const id2 = toastService.error('Second');
        toastService.info('Third');

        toastService.dismiss(id2);
        fixture.detectChanges();

        const toasts = fixture.debugElement.queryAll(By.directive(ZardToastComponent));
        expect(toasts.length).toBe(2);
        expect(toasts[0].componentInstance.message()).toBe('First');
        expect(toasts[1].componentInstance.message()).toBe('Third');
      });
    });
  });
});
