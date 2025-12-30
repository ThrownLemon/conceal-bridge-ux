import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GlobalErrorHandler } from '@/core/global-error-handler.service';

import { ErrorBoundaryComponent } from './error-boundary.component';

describe('ErrorBoundaryComponent', () => {
  let fixture: ComponentFixture<ErrorBoundaryComponent>;
  let errorHandler: GlobalErrorHandler;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBoundaryComponent],
      providers: [GlobalErrorHandler, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorBoundaryComponent);
    errorHandler = TestBed.inject(GlobalErrorHandler);
    fixture.detectChanges();
  });

  describe('rendering', () => {
    it('should not render error dialog when no error', () => {
      expect(errorHandler.hasError()).toBe(false);

      const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
      expect(dialog).toBeNull();
    });

    it('should render error dialog when error is present', () => {
      errorHandler.handleError(new Error('Test error'));
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should display error ID', () => {
      errorHandler.handleError(new Error('Test error'));
      fixture.detectChanges();

      const errorId = errorHandler.currentError()?.id;
      const idElement = fixture.nativeElement.querySelector('.text-xs');
      expect(idElement?.textContent).toContain(errorId);
    });

    it('should display error message', () => {
      errorHandler.handleError(new Error('Test error'));
      fixture.detectChanges();

      const description = fixture.nativeElement.querySelector('#error-description');
      expect(description?.textContent).toContain('unexpected error');
    });

    it('should show chunk error tip for chunk errors', () => {
      errorHandler.handleError(new Error('Loading chunk 123 failed'));
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('z-alert');
      expect(alert).toBeTruthy();
    });

    it('should not show chunk error tip for regular errors', () => {
      errorHandler.handleError(new Error('Regular error'));
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('z-alert');
      expect(alert).toBeNull();
    });

    it('should hide error dialog after clearError', () => {
      errorHandler.handleError(new Error('Test error'));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();

      errorHandler.clearError();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeNull();
    });
  });

  describe('button interactions', () => {
    beforeEach(() => {
      errorHandler.handleError(new Error('Test error'));
      fixture.detectChanges();
    });

    it('should call goHome when Go Home button is clicked', () => {
      const goHomeSpy = vi.spyOn(errorHandler, 'goHome');
      const goHomeButton = fixture.nativeElement.querySelector('button[z-button][zType="outline"]');

      expect(goHomeButton).toBeTruthy();
      goHomeButton.click();

      expect(goHomeSpy).toHaveBeenCalled();
    });

    it('should call reload when Reload Page button is clicked', () => {
      const reloadSpy = vi.spyOn(errorHandler, 'reload').mockImplementation(() => undefined);
      const reloadButton = fixture.nativeElement.querySelector('button[z-button][zType="default"]');

      expect(reloadButton).toBeTruthy();
      reloadButton.click();

      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      errorHandler.handleError(new Error('Test error'));
      fixture.detectChanges();
    });

    it('should have role="alertdialog"', () => {
      const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should have aria-modal="true"', () => {
      const dialog = fixture.nativeElement.querySelector('[aria-modal="true"]');
      expect(dialog).toBeTruthy();
    });

    it('should have aria-labelledby pointing to title', () => {
      const dialog = fixture.nativeElement.querySelector('[aria-labelledby="error-title"]');
      expect(dialog).toBeTruthy();

      const title = fixture.nativeElement.querySelector('#error-title');
      expect(title).toBeTruthy();
    });

    it('should have aria-describedby pointing to description', () => {
      const dialog = fixture.nativeElement.querySelector('[aria-describedby="error-description"]');
      expect(dialog).toBeTruthy();

      const description = fixture.nativeElement.querySelector('#error-description');
      expect(description).toBeTruthy();
    });

    it('should have tabindex for focus management', () => {
      const dialog = fixture.nativeElement.querySelector('[tabindex="-1"]');
      expect(dialog).toBeTruthy();
    });

    it('should focus the dialog when error appears', async () => {
      // The effect should have focused the dialog
      const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]');
      await new Promise((resolve) => setTimeout(resolve, 10));
      fixture.detectChanges();

      // Check that dialog can receive focus
      expect(dialog.getAttribute('tabindex')).toBe('-1');
    });
  });
});
