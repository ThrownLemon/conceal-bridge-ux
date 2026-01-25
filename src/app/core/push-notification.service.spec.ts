import { TestBed } from '@angular/core/testing';

import { PushNotificationService, NotificationOptions } from './push-notification.service';

const SUBSCRIPTION_KEY = 'conceal_bridge_push_subscription';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let mockLocalStorage: Record<string, string>;
  let mockRegistration: Partial<ServiceWorkerRegistration>;
  let mockPushManager: Partial<PushManager>;
  let mockNotification: typeof Notification;

  function setupLocalStorage(data: Record<string, string> = {}): void {
    mockLocalStorage = { ...data };
    const mockGetItem = vi.fn((key: string) => mockLocalStorage[key] ?? null);
    const mockSetItem = vi.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });
    const mockRemoveItem = vi.fn((key: string) => {
      delete mockLocalStorage[key];
    });
    const mockClear = vi.fn(() => {
      mockLocalStorage = {};
    });
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        clear: mockClear,
      },
      writable: true,
    });
  }

  function setupServiceWorkerSupport(permission: NotificationPermission = 'default'): void {
    mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(null),
      subscribe: vi.fn().mockResolvedValue({
        endpoint: 'https://push.example.com/subscription',
        toJSON: () => ({ endpoint: 'https://push.example.com/subscription' }),
      } as PushSubscription),
    };

    mockRegistration = {
      pushManager: mockPushManager as PushManager,
      showNotification: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      writable: true,
      configurable: true,
    });

    mockNotification = vi.fn() as unknown as typeof Notification;
    mockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

    Object.defineProperty(mockNotification, 'permission', {
      get: () => permission,
      configurable: true,
    });

    Object.defineProperty(window, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'PushManager', {
      value: class MockPushManager {},
      writable: true,
      configurable: true,
    });
  }

  function removeServiceWorkerSupport(): void {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }

  function setNotificationPermission(permission: NotificationPermission): void {
    Object.defineProperty(mockNotification, 'permission', {
      get: () => permission,
      configurable: true,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage = {};
    setupLocalStorage();
    setupServiceWorkerSupport();

    TestBed.configureTestingModule({
      providers: [PushNotificationService],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    beforeEach(() => {
      service = TestBed.inject(PushNotificationService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with default permission when supported', () => {
      expect(service.permission()).toBe('default');
    });

    it('should start with isSubscribed as false', () => {
      expect(service.isSubscribed()).toBe(false);
    });

    it('should start with null subscription', () => {
      expect(service.subscription()).toBeNull();
    });

    it('should load subscription state from localStorage on init', async () => {
      TestBed.resetTestingModule();
      setupLocalStorage({
        [SUBSCRIPTION_KEY]: JSON.stringify({ isSubscribed: true }),
      });
      // Set up service worker with existing subscription for verification
      setupServiceWorkerSupport();
      mockPushManager.getSubscription = vi.fn().mockResolvedValue({
        endpoint: 'https://push.example.com/existing',
        toJSON: () => ({ endpoint: 'https://push.example.com/existing' }),
      } as PushSubscription);
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      // Wait for async initialization to complete
      await vi.waitFor(() => expect(service.isSubscribed()).toBe(true));
    });

    it('should load granted permission from Notification API', () => {
      TestBed.resetTestingModule();
      setupLocalStorage();
      setupServiceWorkerSupport('granted');
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      expect(service.permission()).toBe('granted');
    });

    it('should not initialize if not supported', () => {
      TestBed.resetTestingModule();
      setupLocalStorage();
      removeServiceWorkerSupport();
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      expect(service.permission()).toBe('default');
      expect(service.isSubscribed()).toBe(false);
    });
  });

  describe('isSupported', () => {
    it('should return true when all APIs are available', () => {
      service = TestBed.inject(PushNotificationService);
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when serviceWorker is not available', () => {
      // Remove serviceWorker completely
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      // @ts-expect-error - Intentionally deleting readonly property for testing
      delete navigator.serviceWorker;

      TestBed.resetTestingModule();
      setupLocalStorage();
      setupNotificationSupport();
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      expect(service.isSupported()).toBe(false);

      // Restore
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      } else {
        setupServiceWorkerSupport();
      }
    });

    it('should return false when Notification API is not available', () => {
      TestBed.resetTestingModule();
      setupLocalStorage();

      // Setup only serviceWorker, not Notification
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve(mockRegistration),
        },
        writable: true,
        configurable: true,
      });

      // Remove Notification completely
      const originalNotification = Object.getOwnPropertyDescriptor(window, 'Notification');
      // @ts-expect-error - Intentionally deleting readonly property for testing
      delete window.Notification;

      // Keep PushManager
      Object.defineProperty(window, 'PushManager', {
        value: class MockPushManager {},
        writable: true,
        configurable: true,
      });

      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      expect(service.isSupported()).toBe(false);

      // Restore
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', originalNotification);
      } else {
        setupServiceWorkerSupport();
      }
    });

    it('should return false when PushManager is not available', () => {
      TestBed.resetTestingModule();
      setupLocalStorage();

      // Setup only serviceWorker and Notification, not PushManager
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve(mockRegistration),
        },
        writable: true,
        configurable: true,
      });

      setupNotificationSupport();

      // Remove PushManager completely
      const originalPushManager = Object.getOwnPropertyDescriptor(window, 'PushManager');
      // @ts-expect-error - Intentionally deleting readonly property for testing
      delete window.PushManager;

      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      expect(service.isSupported()).toBe(false);

      // Restore
      if (originalPushManager) {
        Object.defineProperty(window, 'PushManager', originalPushManager);
      } else {
        setupServiceWorkerSupport();
      }
    });
  });

  describe('localStorage error handling', () => {
    it('should handle malformed JSON in localStorage gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      TestBed.resetTestingModule();
      setupLocalStorage({ [SUBSCRIPTION_KEY]: 'not valid json{' });
      setupServiceWorkerSupport();
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      expect(service.isSubscribed()).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Failed to load push subscription state', expect.any(Error));
    });

    it('should handle localStorage.getItem throwing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      TestBed.resetTestingModule();
      setupLocalStorage();
      setupServiceWorkerSupport();
      vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: localStorage is not available');
      });
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      expect(service.isSubscribed()).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Failed to load push subscription state', expect.any(Error));
    });

    it('should handle localStorage.setItem throwing during subscribe', async () => {
      service = TestBed.inject(PushNotificationService);
      setNotificationPermission('granted');
      service.permission.set('granted');

      // Use existing subscription to test localStorage error handling
      const existingSubscription = {
        endpoint: 'https://push.example.com/existing',
        toJSON: () => ({ endpoint: 'https://push.example.com/existing' }),
      } as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(existingSubscription);

      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      const subscription = await service.subscribe();

      expect(subscription).toBeTruthy();
      expect(warnSpy).toHaveBeenCalledWith('Failed to save push subscription state', expect.any(Error));
    });

    it('should handle localStorage.removeItem throwing during unsubscribe', async () => {
      service = TestBed.inject(PushNotificationService);
      setNotificationPermission('granted');
      service.permission.set('granted');

      // First subscribe
      const mockSubscription = {
        endpoint: 'https://push.example.com/subscription',
        unsubscribe: vi.fn().mockResolvedValue(true),
        toJSON: () => ({ endpoint: 'https://push.example.com/subscription' }),
      } as unknown as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(mockSubscription);

      vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      const success = await service.unsubscribe();

      expect(success).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith('Failed to clear push subscription state', expect.any(Error));
    });
  });

  describe('requestPermission', () => {
    beforeEach(() => {
      service = TestBed.inject(PushNotificationService);
    });

    it('should request permission and return granted', async () => {
      mockNotification.requestPermission = vi.fn().mockResolvedValue('granted');

      const permission = await service.requestPermission();

      expect(permission).toBe('granted');
      expect(service.permission()).toBe('granted');
      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });

    it('should request permission and return denied', async () => {
      mockNotification.requestPermission = vi.fn().mockResolvedValue('denied');

      const permission = await service.requestPermission();

      expect(permission).toBe('denied');
      expect(service.permission()).toBe('denied');
    });

    it('should return denied when not supported', async () => {
      // Remove serviceWorker completely
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      // @ts-expect-error - Intentionally deleting readonly property for testing
      delete navigator.serviceWorker;

      TestBed.resetTestingModule();
      setupLocalStorage();
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);
      const permission = await service.requestPermission();

      expect(permission).toBe('denied');
      expect(warnSpy).toHaveBeenCalledWith('Push notifications are not supported');

      // Restore
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      } else {
        setupServiceWorkerSupport();
      }
    });

    it('should handle requestPermission throwing', async () => {
      mockNotification.requestPermission = vi.fn().mockRejectedValue(new Error('User cancelled'));
      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      const permission = await service.requestPermission();

      expect(permission).toBe('denied');
      expect(warnSpy).toHaveBeenCalledWith('Failed to request notification permission', expect.any(Error));
    });
  });

  describe('subscribe', () => {
    beforeEach(() => {
      service = TestBed.inject(PushNotificationService);
      setNotificationPermission('granted');
      service.permission.set('granted');
    });

    it('should successfully subscribe to push notifications', async () => {
      // When no VAPID key is configured, subscribe should return null for new subscriptions
      const infoSpy = vi.spyOn(console, 'info').mockReturnValue(undefined);
      const subscription = await service.subscribe();

      expect(subscription).toBeNull();
      expect(service.isSubscribed()).toBe(false);
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('No VAPID key configured'));
    });

    it('should successfully subscribe with existing subscription', async () => {
      // When there's already a subscription, we don't need VAPID key
      const existingSubscription = {
        endpoint: 'https://push.example.com/existing',
        toJSON: () => ({ endpoint: 'https://push.example.com/existing' }),
      } as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(existingSubscription);

      const subscription = await service.subscribe();

      expect(subscription).toBeTruthy();
      expect(subscription?.endpoint).toBe('https://push.example.com/existing');
      expect(service.isSubscribed()).toBe(true);
      expect(service.subscription()).toBe(subscription);
    });

    it('should return existing subscription if already subscribed', async () => {
      const existingSubscription = {
        endpoint: 'https://push.example.com/existing',
        toJSON: () => ({ endpoint: 'https://push.example.com/existing' }),
      } as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(existingSubscription);

      const subscription = await service.subscribe();

      expect(subscription).toBe(existingSubscription);
      expect(service.isSubscribed()).toBe(true);
      expect(mockPushManager.subscribe).not.toHaveBeenCalled();
    });

    it('should persist subscription state to localStorage', async () => {
      // Use existing subscription to test localStorage persistence
      const existingSubscription = {
        endpoint: 'https://push.example.com/existing',
        toJSON: () => ({ endpoint: 'https://push.example.com/existing' }),
      } as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(existingSubscription);

      await service.subscribe();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        SUBSCRIPTION_KEY,
        JSON.stringify({ isSubscribed: true })
      );
    });

    it('should return null when permission not granted', async () => {
      service.permission.set('denied');
      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      const subscription = await service.subscribe();

      expect(subscription).toBeNull();
      expect(service.isSubscribed()).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Notification permission not granted');
    });

    it('should return null when not supported', async () => {
      // Remove serviceWorker completely
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      // @ts-expect-error - Intentionally deleting readonly property for testing
      delete navigator.serviceWorker;

      TestBed.resetTestingModule();
      setupLocalStorage();
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);
      const subscription = await service.subscribe();

      expect(subscription).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('Push notifications are not supported');

      // Restore
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      } else {
        setupServiceWorkerSupport();
      }
    });

    it('should handle subscribe errors gracefully', async () => {
      // Test error handling during getSubscription
      mockPushManager.getSubscription = vi.fn().mockRejectedValue(new Error('Failed to get subscription'));
      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      const subscription = await service.subscribe();

      expect(subscription).toBeNull();
      expect(service.isSubscribed()).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Failed to subscribe to push notifications', expect.any(Error));
    });
  });

  describe('unsubscribe', () => {
    beforeEach(() => {
      service = TestBed.inject(PushNotificationService);
      setNotificationPermission('granted');
      service.permission.set('granted');
    });

    it('should successfully unsubscribe from push notifications', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/subscription',
        unsubscribe: vi.fn().mockResolvedValue(true),
        toJSON: () => ({ endpoint: 'https://push.example.com/subscription' }),
      } as unknown as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(mockSubscription);

      const success = await service.unsubscribe();

      expect(success).toBe(true);
      expect(service.isSubscribed()).toBe(false);
      expect(service.subscription()).toBeNull();
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should clear subscription state from localStorage', async () => {
      const mockSubscription = {
        unsubscribe: vi.fn().mockResolvedValue(true),
      } as unknown as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(mockSubscription);

      await service.unsubscribe();

      expect(localStorage.removeItem).toHaveBeenCalledWith(SUBSCRIPTION_KEY);
    });

    it('should return true when no subscription exists', async () => {
      mockPushManager.getSubscription = vi.fn().mockResolvedValue(null);

      const success = await service.unsubscribe();

      expect(success).toBe(true);
    });

    it('should return false when not supported', async () => {
      // Remove serviceWorker completely
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      // @ts-expect-error - Intentionally deleting readonly property for testing
      delete navigator.serviceWorker;

      TestBed.resetTestingModule();
      setupLocalStorage();
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);
      const success = await service.unsubscribe();

      expect(success).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Push notifications are not supported');

      // Restore
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      } else {
        setupServiceWorkerSupport();
      }
    });

    it('should handle unsubscribe errors gracefully', async () => {
      mockPushManager.getSubscription = vi.fn().mockRejectedValue(new Error('Failed to get subscription'));
      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      const success = await service.unsubscribe();

      expect(success).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Failed to unsubscribe from push notifications', expect.any(Error));
    });

    it('should handle subscription.unsubscribe returning false', async () => {
      const mockSubscription = {
        unsubscribe: vi.fn().mockResolvedValue(false),
      } as unknown as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(mockSubscription);

      const success = await service.unsubscribe();

      expect(success).toBe(false);
      expect(service.isSubscribed()).toBe(false);
      expect(service.subscription()).toBeNull();
    });
  });

  describe('showNotification', () => {
    beforeEach(() => {
      service = TestBed.inject(PushNotificationService);
      setNotificationPermission('granted');
      service.permission.set('granted');
    });

    it('should show notification via Service Worker', async () => {
      const options: NotificationOptions = {
        title: 'Test Notification',
        body: 'This is a test',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'test',
        data: { id: 123 },
      };

      await service.showNotification(options);

      expect(mockRegistration.showNotification).toHaveBeenCalledWith('Test Notification', {
        body: 'This is a test',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'test',
        data: { id: 123 },
      });
    });

    it('should show notification with minimal options', async () => {
      const options: NotificationOptions = {
        title: 'Simple Notification',
        body: 'Simple message',
      };

      await service.showNotification(options);

      expect(mockRegistration.showNotification).toHaveBeenCalledWith('Simple Notification', {
        body: 'Simple message',
        icon: undefined,
        badge: undefined,
        tag: undefined,
        data: undefined,
      });
    });

    it('should not show notification when permission not granted', async () => {
      service.permission.set('denied');
      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      await service.showNotification({
        title: 'Test',
        body: 'Test',
      });

      expect(mockRegistration.showNotification).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith('Notification permission not granted');
    });

    it('should not show notification when not supported', async () => {
      // Remove serviceWorker completely
      const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      // @ts-expect-error - Intentionally deleting readonly property for testing
      delete navigator.serviceWorker;

      TestBed.resetTestingModule();
      setupLocalStorage();
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      service = TestBed.inject(PushNotificationService);

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      await service.showNotification({
        title: 'Test',
        body: 'Test',
      });

      expect(warnSpy).toHaveBeenCalledWith('Notifications are not supported');

      // Restore
      if (originalServiceWorker) {
        Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
      } else {
        setupServiceWorkerSupport();
      }
    });

    it('should fallback to Notification API when Service Worker fails', async () => {
      mockRegistration.showNotification = vi.fn().mockRejectedValue(new Error('SW error'));

      const mockNotificationConstructor = vi.fn();
      Object.defineProperty(window, 'Notification', {
        value: mockNotificationConstructor,
        writable: true,
        configurable: true,
      });

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      await service.showNotification({
        title: 'Fallback Test',
        body: 'This should use fallback',
        icon: '/icon.png',
        tag: 'fallback',
        data: { test: true },
      });

      expect(warnSpy).toHaveBeenCalledWith('Failed to show notification via Service Worker, falling back', expect.any(Error));
      expect(mockNotificationConstructor).toHaveBeenCalledWith('Fallback Test', {
        body: 'This should use fallback',
        icon: '/icon.png',
        tag: 'fallback',
        data: { test: true },
      });
    });

    it('should handle both Service Worker and fallback failures', async () => {
      mockRegistration.showNotification = vi.fn().mockRejectedValue(new Error('SW error'));

      const mockNotificationConstructor = vi.fn(() => {
        throw new Error('Notification constructor failed');
      });
      Object.defineProperty(window, 'Notification', {
        value: mockNotificationConstructor,
        writable: true,
        configurable: true,
      });

      const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);

      await service.showNotification({
        title: 'Test',
        body: 'Test',
      });

      expect(warnSpy).toHaveBeenCalledWith('Failed to show notification via Service Worker, falling back', expect.any(Error));
      expect(warnSpy).toHaveBeenCalledWith('Failed to show notification', expect.any(Error));
    });
  });

  describe('signals', () => {
    beforeEach(() => {
      service = TestBed.inject(PushNotificationService);
    });

    it('should have readonly permission signal', () => {
      const permissionSignal = service.permission;
      expect(typeof permissionSignal).toBe('function');
      // Signals with .set() are writable, but this one should be exposed as readonly
      expect(permissionSignal()).toBe('default');
    });

    it('should have readonly isSubscribed signal', () => {
      const isSubscribedSignal = service.isSubscribed;
      expect(typeof isSubscribedSignal).toBe('function');
      expect(isSubscribedSignal()).toBe(false);
    });

    it('should have readonly subscription signal', () => {
      const subscriptionSignal = service.subscription;
      expect(typeof subscriptionSignal).toBe('function');
      expect((subscriptionSignal as unknown as Record<string, unknown>)['set']).toBeUndefined();
      expect(subscriptionSignal()).toBeNull();
    });

    it('should update signals when subscribing', async () => {
      setNotificationPermission('granted');
      service.permission.set('granted');

      // Use existing subscription to test signal updates
      const existingSubscription = {
        endpoint: 'https://push.example.com/existing',
        toJSON: () => ({ endpoint: 'https://push.example.com/existing' }),
      } as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(existingSubscription);

      await service.subscribe();

      expect(service.isSubscribed()).toBe(true);
      expect(service.subscription()).toBeTruthy();
    });

    it('should update signals when unsubscribing', async () => {
      setNotificationPermission('granted');
      service.permission.set('granted');

      const mockSubscription = {
        unsubscribe: vi.fn().mockResolvedValue(true),
      } as unknown as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(mockSubscription);

      await service.unsubscribe();

      expect(service.isSubscribed()).toBe(false);
      expect(service.subscription()).toBeNull();
    });
  });

  describe('data persistence across service instances', () => {
    it('should persist subscription state between service instances', async () => {
      service = TestBed.inject(PushNotificationService);
      setNotificationPermission('granted');
      service.permission.set('granted');

      // Use existing subscription to test persistence
      const existingSubscription = {
        endpoint: 'https://push.example.com/existing',
        toJSON: () => ({ endpoint: 'https://push.example.com/existing' }),
      } as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(existingSubscription);

      await service.subscribe();

      // Create new instance (simulating app reload)
      const savedData = { ...mockLocalStorage };
      TestBed.resetTestingModule();
      setupLocalStorage(savedData);
      setupServiceWorkerSupport();
      // Mock subscription still exists for verification
      mockPushManager.getSubscription = vi.fn().mockResolvedValue(existingSubscription);
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      const newService = TestBed.inject(PushNotificationService);

      // Wait for async initialization to complete
      await vi.waitFor(() => expect(newService.isSubscribed()).toBe(true));
    });

    it('should not persist subscription state after unsubscribe', async () => {
      service = TestBed.inject(PushNotificationService);
      setNotificationPermission('granted');
      service.permission.set('granted');

      await service.subscribe();

      const mockSubscription = {
        unsubscribe: vi.fn().mockResolvedValue(true),
      } as unknown as PushSubscription;

      mockPushManager.getSubscription = vi.fn().mockResolvedValue(mockSubscription);

      await service.unsubscribe();

      // Create new instance
      const savedData = { ...mockLocalStorage };
      TestBed.resetTestingModule();
      setupLocalStorage(savedData);
      setupServiceWorkerSupport();
      TestBed.configureTestingModule({ providers: [PushNotificationService] });
      const newService = TestBed.inject(PushNotificationService);

      expect(newService.isSubscribed()).toBe(false);
    });
  });
});

function setupNotificationSupport(permission: NotificationPermission = 'default'): void {
  const mockNotificationLocal = vi.fn() as unknown as typeof Notification;
  mockNotificationLocal.requestPermission = vi.fn().mockResolvedValue('granted');

  Object.defineProperty(mockNotificationLocal, 'permission', {
    get: () => permission,
    configurable: true,
  });

  Object.defineProperty(window, 'Notification', {
    value: mockNotificationLocal,
    writable: true,
    configurable: true,
  });
}
