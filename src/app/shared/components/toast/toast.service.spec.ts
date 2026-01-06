import { TestBed } from '@angular/core/testing';

import { ZardToastService, type ToastType } from './toast.service';

describe('ZardToastService', () => {
  let service: ZardToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ZardToastService],
    });
    service = TestBed.inject(ZardToastService);
  });

  afterEach(() => {
    // Clear any remaining toasts after each test
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty toasts array', () => {
    expect(service.toasts()).toEqual([]);
  });

  describe('show()', () => {
    it('should add a toast to the toasts signal', () => {
      const id = service.show({ message: 'Test message', type: 'info' });

      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0].message).toBe('Test message');
      expect(service.toasts()[0].type).toBe('info');
      expect(service.toasts()[0].id).toBe(id);
    });

    it('should generate unique ID if not provided', () => {
      const id1 = service.show({ message: 'Message 1' });
      const id2 = service.show({ message: 'Message 2' });

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^toast-\d+-\d+$/);
      expect(id2).toMatch(/^toast-\d+-\d+$/);
    });

    it('should use provided ID if given', () => {
      const customId = 'my-custom-id';
      const id = service.show({ message: 'Test', id: customId });

      expect(id).toBe(customId);
      expect(service.toasts()[0].id).toBe(customId);
    });

    it('should default to info type if not specified', () => {
      service.show({ message: 'Test message' });

      expect(service.toasts()[0].type).toBe('info');
    });

    it('should default to 3000ms duration if not specified', () => {
      service.show({ message: 'Test message' });

      expect(service.toasts()[0].duration).toBe(3000);
    });

    it('should use custom duration if provided', () => {
      service.show({ message: 'Test message', duration: 5000 });

      expect(service.toasts()[0].duration).toBe(5000);
    });

    it('should support all toast types', () => {
      const types: ToastType[] = ['success', 'error', 'info'];

      types.forEach((type) => {
        service.show({ message: `Test ${type}`, type });
      });

      expect(service.toasts()).toHaveLength(3);
      expect(service.toasts()[0].type).toBe('success');
      expect(service.toasts()[1].type).toBe('error');
      expect(service.toasts()[2].type).toBe('info');
    });

    it('should auto-dismiss toast after duration', () => {
      vi.useFakeTimers();

      service.show({ message: 'Test', duration: 1000 });
      expect(service.toasts()).toHaveLength(1);

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      expect(service.toasts()).toHaveLength(0);

      vi.useRealTimers();
    });
  });

  describe('success()', () => {
    it('should create a success toast', () => {
      service.success('Operation successful');

      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0].type).toBe('success');
      expect(service.toasts()[0].message).toBe('Operation successful');
      expect(service.toasts()[0].duration).toBe(3000);
    });

    it('should support custom duration', () => {
      service.success('Success', { duration: 5000 });

      expect(service.toasts()[0].duration).toBe(5000);
    });

    it('should support custom ID', () => {
      const customId = 'custom-success-id';
      const id = service.success('Success', { id: customId });

      expect(id).toBe(customId);
      expect(service.toasts()[0].id).toBe(customId);
    });
  });

  describe('error()', () => {
    it('should create an error toast', () => {
      service.error('Operation failed');

      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0].type).toBe('error');
      expect(service.toasts()[0].message).toBe('Operation failed');
      expect(service.toasts()[0].duration).toBe(3000);
    });

    it('should support custom duration', () => {
      service.error('Error', { duration: 5000 });

      expect(service.toasts()[0].duration).toBe(5000);
    });

    it('should support custom ID', () => {
      const customId = 'custom-error-id';
      const id = service.error('Error', { id: customId });

      expect(id).toBe(customId);
      expect(service.toasts()[0].id).toBe(customId);
    });
  });

  describe('info()', () => {
    it('should create an info toast', () => {
      service.info('Information message');

      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0].type).toBe('info');
      expect(service.toasts()[0].message).toBe('Information message');
      expect(service.toasts()[0].duration).toBe(3000);
    });

    it('should support custom duration', () => {
      service.info('Info', { duration: 5000 });

      expect(service.toasts()[0].duration).toBe(5000);
    });

    it('should support custom ID', () => {
      const customId = 'custom-info-id';
      const id = service.info('Info', { id: customId });

      expect(id).toBe(customId);
      expect(service.toasts()[0].id).toBe(customId);
    });
  });

  describe('dismiss()', () => {
    it('should remove toast by ID', () => {
      const id1 = service.show({ message: 'Toast 1' });
      const id2 = service.show({ message: 'Toast 2' });
      const id3 = service.show({ message: 'Toast 3' });

      expect(service.toasts()).toHaveLength(3);

      service.dismiss(id2);

      expect(service.toasts()).toHaveLength(2);
      expect(service.toasts().find((t) => t.id === id1)).toBeTruthy();
      expect(service.toasts().find((t) => t.id === id2)).toBeFalsy();
      expect(service.toasts().find((t) => t.id === id3)).toBeTruthy();
    });

    it('should do nothing if ID does not exist', () => {
      service.show({ message: 'Toast' });
      expect(service.toasts()).toHaveLength(1);

      service.dismiss('non-existent-id');

      expect(service.toasts()).toHaveLength(1);
    });

    it('should handle dismissing already dismissed toast', () => {
      const id = service.show({ message: 'Toast' });
      expect(service.toasts()).toHaveLength(1);

      service.dismiss(id);
      expect(service.toasts()).toHaveLength(0);

      // Dismiss again - should not error
      service.dismiss(id);
      expect(service.toasts()).toHaveLength(0);
    });
  });

  describe('clear()', () => {
    it('should remove all toasts', () => {
      service.show({ message: 'Toast 1' });
      service.show({ message: 'Toast 2' });
      service.show({ message: 'Toast 3' });

      expect(service.toasts()).toHaveLength(3);

      service.clear();

      expect(service.toasts()).toHaveLength(0);
    });

    it('should do nothing if no toasts exist', () => {
      expect(service.toasts()).toHaveLength(0);

      service.clear();

      expect(service.toasts()).toHaveLength(0);
    });
  });

  describe('multiple toasts', () => {
    it('should manage multiple concurrent toasts', () => {
      const id1 = service.success('Success 1');
      const id2 = service.error('Error 1');
      const id3 = service.info('Info 1');

      expect(service.toasts()).toHaveLength(3);

      service.dismiss(id2);

      expect(service.toasts()).toHaveLength(2);
      expect(service.toasts()[0].id).toBe(id1);
      expect(service.toasts()[1].id).toBe(id3);
    });

    it('should maintain toast order (FIFO)', () => {
      service.show({ message: 'First' });
      service.show({ message: 'Second' });
      service.show({ message: 'Third' });

      const toasts = service.toasts();
      expect(toasts[0].message).toBe('First');
      expect(toasts[1].message).toBe('Second');
      expect(toasts[2].message).toBe('Third');
    });
  });

  describe('edge cases', () => {
    it('should handle empty message gracefully', () => {
      service.show({ message: '' });

      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0].message).toBe('');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      service.show({ message: longMessage });

      expect(service.toasts()[0].message).toBe(longMessage);
    });

    it('should handle very long duration', () => {
      service.show({ message: 'Test', duration: 999999 });

      expect(service.toasts()[0].duration).toBe(999999);
    });
  });
});
