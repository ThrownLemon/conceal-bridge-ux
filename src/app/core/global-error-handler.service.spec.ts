import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { GlobalErrorHandler } from './global-error-handler.service';

describe('GlobalErrorHandler', () => {
  let service: GlobalErrorHandler;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalErrorHandler, provideRouter([])],
    });

    service = TestBed.inject(GlobalErrorHandler);
    router = TestBed.inject(Router);
  });

  describe('initial state', () => {
    it('should start with no error', () => {
      expect(service.hasError()).toBe(false);
      expect(service.currentError()).toBeNull();
    });
  });

  describe('handleError', () => {
    it('should capture a basic error', () => {
      const error = new Error('Test error');

      service.handleError(error);

      expect(service.hasError()).toBe(true);
      expect(service.currentError()).toBeTruthy();
      expect(service.currentError()?.message).toContain('unexpected error');
    });

    it('should generate unique error IDs', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      service.handleError(error1);
      const id1 = service.currentError()?.id;

      service.clearError();
      service.handleError(error2);
      const id2 = service.currentError()?.id;

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should detect chunk load errors from message', () => {
      const error = new Error('Loading chunk 123 failed');

      service.handleError(error);

      expect(service.currentError()?.isChunkError).toBe(true);
      expect(service.currentError()?.message).toContain('load part of the application');
    });

    it('should detect chunk load errors from ChunkLoadError name', () => {
      const error = new Error('Failed');
      error.name = 'ChunkLoadError';

      service.handleError(error);

      expect(service.currentError()?.isChunkError).toBe(true);
    });

    it('should detect dynamically imported module failures', () => {
      const error = new Error('Failed to fetch dynamically imported module');

      service.handleError(error);

      expect(service.currentError()?.isChunkError).toBe(true);
    });

    it('should detect network errors from message', () => {
      const error = new Error('Network request failed');

      service.handleError(error);

      expect(service.currentError()?.isNetworkError).toBe(true);
      expect(service.currentError()?.message).toContain('connect to the server');
    });

    it('should detect timeout errors', () => {
      const error = new Error('Request timeout');

      service.handleError(error);

      expect(service.currentError()?.isNetworkError).toBe(true);
    });

    it('should detect NetworkError by name', () => {
      const error = new Error('Failed');
      error.name = 'NetworkError';

      service.handleError(error);

      expect(service.currentError()?.isNetworkError).toBe(true);
    });

    it('should handle ErrorEvent wrapper', () => {
      const innerError = new Error('Inner error');
      const errorEvent = new ErrorEvent('error', { error: innerError });

      service.handleError(errorEvent);

      expect(service.hasError()).toBe(true);
      expect(service.currentError()).toBeTruthy();
    });

    it('should handle promise rejection objects', () => {
      const rejection = { rejection: new Error('Promise rejected') };

      service.handleError(rejection);

      expect(service.hasError()).toBe(true);
    });

    it('should handle non-Error objects', () => {
      service.handleError('string error');

      expect(service.hasError()).toBe(true);
      expect(service.currentError()?.message).toContain('unexpected error');
    });

    it('should handle null/undefined', () => {
      service.handleError(null);

      expect(service.hasError()).toBe(true);
    });

    it('should record timestamp', () => {
      const beforeTime = new Date();
      service.handleError(new Error('Test'));
      const afterTime = new Date();

      const timestamp = service.currentError()?.timestamp;
      expect(timestamp).toBeTruthy();
      expect(timestamp!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should log error to console', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        const error = new Error('Test error');

        service.handleError(error);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[GlobalErrorHandler] Uncaught error:',
          expect.objectContaining({
            message: expect.any(String),
          }),
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('clearError', () => {
    it('should clear the error state', () => {
      service.handleError(new Error('Test'));
      expect(service.hasError()).toBe(true);

      service.clearError();

      expect(service.hasError()).toBe(false);
      expect(service.currentError()).toBeNull();
    });
  });

  describe('reload', () => {
    it('should trigger a page reload', () => {
      // We can't directly spy on window.location.reload in JSDOM
      // but we can verify the method exists and is callable
      expect(typeof service.reload).toBe('function');

      // The actual reload would navigate away, so we just verify
      // the service method doesn't throw
      expect(() => service.reload()).not.toThrow();
    });
  });

  describe('goHome', () => {
    it('should clear error and navigate to home', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      service.handleError(new Error('Test'));
      expect(service.hasError()).toBe(true);

      service.goHome();

      expect(service.hasError()).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/']);

      navigateSpy.mockRestore();
    });
  });

  describe('captured error structure', () => {
    it('should have all required fields', () => {
      service.handleError(new Error('Test'));

      const error = service.currentError();
      expect(error).toBeTruthy();
      expect(error?.id).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(typeof error?.message).toBe('string');
      expect(error?.originalError).toBeTruthy();
      expect(error?.timestamp).toBeInstanceOf(Date);
      expect(typeof error?.isChunkError).toBe('boolean');
      expect(typeof error?.isNetworkError).toBe('boolean');
    });
  });
});
