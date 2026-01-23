import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { ZardToastService } from '@/shared/components/toast/toast.service';

describe('PwaUpdateService', () => {
  let service: PwaUpdateService;
  let mockSwUpdate: {
    isEnabled: boolean;
    versionUpdates: Subject<VersionEvent>;
    checkForUpdate: ReturnType<typeof vi.fn>;
    activateUpdate: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let reloadSpy: ReturnType<typeof vi.fn>;

  function createVersionReadyEvent(): VersionReadyEvent {
    return {
      type: 'VERSION_READY',
      currentVersion: { hash: 'abc123', appData: {} },
      latestVersion: { hash: 'def456', appData: {} },
    };
  }

  function setupService(swUpdateEnabled = true): void {
    mockSwUpdate.isEnabled = swUpdateEnabled;

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: ZardToastService, useValue: mockToast },
      ],
    });

    service = TestBed.inject(PwaUpdateService);
  }

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock SwUpdate
    mockSwUpdate = {
      isEnabled: true,
      versionUpdates: new Subject<VersionEvent>(),
      checkForUpdate: vi.fn(),
      activateUpdate: vi.fn(),
    };

    // Mock ZardToastService
    mockToast = {
      info: vi.fn(),
      error: vi.fn(),
    };

    // Mock document.location.reload
    reloadSpy = vi.fn();
    vi.stubGlobal('document', {
      ...document,
      location: {
        ...document.location,
        reload: reloadSpy,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('initialization', () => {
    it('should be created', () => {
      setupService();
      expect(service).toBeTruthy();
    });

    it('should initialize updateAvailable as false', () => {
      setupService();
      expect(service.updateAvailable()).toBe(false);
    });

    it('should set isEnabled based on SwUpdate.isEnabled', () => {
      setupService(true);
      expect(service.isEnabled()).toBe(true);
    });

    it('should set isEnabled to false when SwUpdate is disabled', () => {
      setupService(false);
      expect(service.isEnabled()).toBe(false);
    });

    it('should subscribe to updates when service worker is enabled', () => {
      setupService(true);

      const event = createVersionReadyEvent();
      mockSwUpdate.versionUpdates.next(event);

      expect(service.updateAvailable()).toBe(true);
      expect(mockToast.info).toHaveBeenCalledWith(
        'A new version is available! Reload to update.',
        { duration: 8000 }
      );
    });

    it('should not subscribe to updates when service worker is disabled', () => {
      setupService(false);

      const event = createVersionReadyEvent();
      mockSwUpdate.versionUpdates.next(event);

      expect(service.updateAvailable()).toBe(false);
      expect(mockToast.info).not.toHaveBeenCalled();
    });

    it('should schedule periodic update checks when service worker is enabled', () => {
      vi.useFakeTimers();
      mockSwUpdate.checkForUpdate.mockResolvedValue(false);
      setupService(true);

      // Fast-forward 6 hours (21,600,000 ms)
      vi.advanceTimersByTime(6 * 60 * 60 * 1000);

      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1);

      // Fast-forward another 6 hours
      vi.advanceTimersByTime(6 * 60 * 60 * 1000);

      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(2);
    });

    it('should not schedule periodic checks when service worker is disabled', () => {
      vi.useFakeTimers();
      mockSwUpdate.checkForUpdate.mockResolvedValue(false);
      setupService(false);

      // Fast-forward 6 hours
      vi.advanceTimersByTime(6 * 60 * 60 * 1000);

      expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();
    });
  });

  describe('versionUpdates subscription', () => {
    beforeEach(() => {
      setupService(true);
    });

    it('should only respond to VERSION_READY events', () => {
      // Send other event types
      mockSwUpdate.versionUpdates.next({
        type: 'VERSION_DETECTED',
        version: { hash: 'abc123', appData: {} },
      });

      expect(service.updateAvailable()).toBe(false);
      expect(mockToast.info).not.toHaveBeenCalled();

      // Send VERSION_READY event
      mockSwUpdate.versionUpdates.next(createVersionReadyEvent());

      expect(service.updateAvailable()).toBe(true);
      expect(mockToast.info).toHaveBeenCalledTimes(1);
    });

    it('should set updateAvailable to true when VERSION_READY event is received', () => {
      expect(service.updateAvailable()).toBe(false);

      mockSwUpdate.versionUpdates.next(createVersionReadyEvent());

      expect(service.updateAvailable()).toBe(true);
    });

    it('should show toast notification when update is available', () => {
      mockSwUpdate.versionUpdates.next(createVersionReadyEvent());

      expect(mockToast.info).toHaveBeenCalledWith(
        'A new version is available! Reload to update.',
        { duration: 8000 }
      );
    });

    it('should handle multiple VERSION_READY events', () => {
      mockSwUpdate.versionUpdates.next(createVersionReadyEvent());

      expect(service.updateAvailable()).toBe(true);
      expect(mockToast.info).toHaveBeenCalledTimes(1);

      mockSwUpdate.versionUpdates.next(createVersionReadyEvent());

      expect(service.updateAvailable()).toBe(true);
      expect(mockToast.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkForUpdate', () => {
    it('should return false when service worker is not enabled', async () => {
      setupService(false);

      const result = await service.checkForUpdate();

      expect(result).toBe(false);
      expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();
    });

    it('should call SwUpdate.checkForUpdate when enabled', async () => {
      setupService(true);
      mockSwUpdate.checkForUpdate.mockResolvedValue(true);

      await service.checkForUpdate();

      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1);
    });

    it('should return true when an update is found', async () => {
      setupService(true);
      mockSwUpdate.checkForUpdate.mockResolvedValue(true);

      const result = await service.checkForUpdate();

      expect(result).toBe(true);
    });

    it('should return false when no update is found', async () => {
      setupService(true);
      mockSwUpdate.checkForUpdate.mockResolvedValue(false);

      const result = await service.checkForUpdate();

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      setupService(true);
      const error = new Error('Network error');
      mockSwUpdate.checkForUpdate.mockRejectedValue(error);

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      const result = await service.checkForUpdate();

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Failed to check for updates', error);
    });

    it('should not throw when checkForUpdate fails', async () => {
      setupService(true);
      mockSwUpdate.checkForUpdate.mockRejectedValue(new Error('Test error'));

      await expect(service.checkForUpdate()).resolves.not.toThrow();
    });
  });

  describe('activateUpdate', () => {
    it('should return early when service worker is not enabled', async () => {
      setupService(false);

      await service.activateUpdate();

      expect(mockSwUpdate.activateUpdate).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('should call SwUpdate.activateUpdate when enabled', async () => {
      setupService(true);
      mockSwUpdate.activateUpdate.mockResolvedValue(true);

      await service.activateUpdate();

      expect(mockSwUpdate.activateUpdate).toHaveBeenCalledTimes(1);
    });

    it('should reload the page after successful activation', async () => {
      setupService(true);
      mockSwUpdate.activateUpdate.mockResolvedValue(true);

      await service.activateUpdate();

      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle activation errors and show error toast', async () => {
      setupService(true);
      const error = new Error('Activation failed');
      mockSwUpdate.activateUpdate.mockRejectedValue(error);

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      await service.activateUpdate();

      expect(warnSpy).toHaveBeenCalledWith('Failed to activate update', error);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update app. Please refresh manually.');
      expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('should not throw when activateUpdate fails', async () => {
      setupService(true);
      mockSwUpdate.activateUpdate.mockRejectedValue(new Error('Test error'));

      await expect(service.activateUpdate()).resolves.not.toThrow();
    });

    it('should not reload page when activation fails', async () => {
      setupService(true);
      mockSwUpdate.activateUpdate.mockRejectedValue(new Error('Test error'));

      await service.activateUpdate();

      expect(reloadSpy).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete update flow: detection -> activation -> reload', async () => {
      setupService(true);
      mockSwUpdate.activateUpdate.mockResolvedValue(true);

      // Step 1: Update detected
      expect(service.updateAvailable()).toBe(false);

      mockSwUpdate.versionUpdates.next(createVersionReadyEvent());

      expect(service.updateAvailable()).toBe(true);
      expect(mockToast.info).toHaveBeenCalledWith(
        'A new version is available! Reload to update.',
        { duration: 8000 }
      );

      // Step 2: User activates update
      await service.activateUpdate();

      expect(mockSwUpdate.activateUpdate).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('should not interfere with other services when service worker is disabled', () => {
      vi.useFakeTimers();
      setupService(false);

      // Try all methods
      service.checkForUpdate();
      service.activateUpdate();
      mockSwUpdate.versionUpdates.next(createVersionReadyEvent());
      vi.advanceTimersByTime(6 * 60 * 60 * 1000); // Fast-forward for periodic check

      // Nothing should have been called
      expect(mockSwUpdate.checkForUpdate).not.toHaveBeenCalled();
      expect(mockSwUpdate.activateUpdate).not.toHaveBeenCalled();
      expect(mockToast.info).not.toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();
      expect(reloadSpy).not.toHaveBeenCalled();
    });

    it('should handle periodic check finding an update', () => {
      vi.useFakeTimers();
      setupService(true);
      mockSwUpdate.checkForUpdate.mockResolvedValue(true);

      // Fast-forward 6 hours to trigger periodic check
      vi.advanceTimersByTime(6 * 60 * 60 * 1000);

      // Simulate the update being detected
      mockSwUpdate.versionUpdates.next(createVersionReadyEvent());

      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalled();
      expect(service.updateAvailable()).toBe(true);
      expect(mockToast.info).toHaveBeenCalled();
    });

    it('should continue periodic checks even if a check fails', () => {
      vi.useFakeTimers();
      setupService(true);
      mockSwUpdate.checkForUpdate
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(false);

      vi.spyOn(console, 'warn').mockReturnValue(undefined);

      // First check fails
      vi.advanceTimersByTime(6 * 60 * 60 * 1000);
      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(1);

      // Second check succeeds
      vi.advanceTimersByTime(6 * 60 * 60 * 1000);
      expect(mockSwUpdate.checkForUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
