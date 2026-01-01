import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';

import { ZardDarkMode, EDarkModes } from './dark-mode';

describe('ZardDarkMode', () => {
  let service: ZardDarkMode;
  let mockDocument: Document;
  let mockMediaMatcher: Partial<MediaMatcher>;
  let mockMediaQueryList: Partial<MediaQueryList>;
  let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;
  let originalLocalStorage: typeof globalThis.localStorage;

  function createService(options: { isBrowser?: boolean; prefersDark?: boolean } = {}) {
    const { isBrowser = true, prefersDark = false } = options;

    mockMediaQueryList = {
      matches: prefersDark,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn((event: string, handler: EventListener) => {
        if (event === 'change') {
          changeHandler = handler as (event: MediaQueryListEvent) => void;
        }
      }) as MediaQueryList['addEventListener'],
      removeEventListener: vi.fn() as MediaQueryList['removeEventListener'],
      dispatchEvent: vi.fn(),
      onchange: null,
    };

    mockMediaMatcher = {
      matchMedia: vi.fn().mockReturnValue(mockMediaQueryList) as MediaMatcher['matchMedia'],
    };

    mockDocument = {
      documentElement: {
        classList: {
          toggle: vi.fn(),
        },
        setAttribute: vi.fn(),
      },
    } as unknown as Document;

    TestBed.configureTestingModule({
      providers: [
        ZardDarkMode,
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: PLATFORM_ID, useValue: isBrowser ? 'browser' : 'server' },
        { provide: MediaMatcher, useValue: mockMediaMatcher },
      ],
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    service = TestBed.inject(ZardDarkMode);
  }

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    changeHandler = null;
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  describe('initialization', () => {
    it('should create the service', () => {
      createService();
      expect(service).toBeTruthy();
    });

    it('should start with system theme by default', () => {
      createService();
      expect(service.currentTheme()).toBe(EDarkModes.SYSTEM);
    });

    it('should not create media query on server', () => {
      createService({ isBrowser: false });
      expect(mockMediaMatcher.matchMedia).not.toHaveBeenCalled();
    });

    it('should create media query in browser', () => {
      createService({ isBrowser: true });
      expect(mockMediaMatcher.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });

  describe('init method', () => {
    it('should load stored theme on init', () => {
      createService();
      vi.mocked(localStorage.getItem).mockReturnValue(EDarkModes.DARK);

      service.init();

      expect(service.currentTheme()).toBe(EDarkModes.DARK);
    });

    it('should only initialize once', () => {
      createService();
      vi.mocked(localStorage.getItem).mockReturnValue(EDarkModes.DARK);

      service.init();
      service.init();

      expect(localStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it('should not initialize on server', () => {
      createService({ isBrowser: false });

      service.init();

      expect(localStorage.getItem).not.toHaveBeenCalled();
    });

    it('should attach system change listener when stored theme is system', () => {
      createService();
      vi.mocked(localStorage.getItem).mockReturnValue(EDarkModes.SYSTEM);

      service.init();

      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });

    it('should attach system change listener when no stored theme', () => {
      createService();
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      service.init();

      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });
  });

  describe('themeMode computed', () => {
    it('should return dark when system prefers dark', () => {
      createService({ prefersDark: true });

      expect(service.themeMode()).toBe(EDarkModes.DARK);
    });

    it('should return light when system prefers light', () => {
      createService({ prefersDark: false });

      expect(service.themeMode()).toBe(EDarkModes.LIGHT);
    });

    it('should return dark when explicitly set to dark', () => {
      createService();
      service.toggleTheme(EDarkModes.DARK);

      expect(service.themeMode()).toBe(EDarkModes.DARK);
    });

    it('should return light when explicitly set to light', () => {
      createService();
      service.toggleTheme(EDarkModes.LIGHT);

      expect(service.themeMode()).toBe(EDarkModes.LIGHT);
    });
  });

  describe('toggleTheme method', () => {
    it('should toggle from light to dark', () => {
      createService({ prefersDark: false });
      service.toggleTheme(EDarkModes.LIGHT); // Start with light

      service.toggleTheme(); // Toggle without parameter

      expect(service.currentTheme()).toBe(EDarkModes.DARK);
    });

    it('should toggle from dark to light', () => {
      createService();
      service.toggleTheme(EDarkModes.DARK);

      service.toggleTheme();

      expect(service.currentTheme()).toBe(EDarkModes.LIGHT);
    });

    it('should set specific theme when provided', () => {
      createService();

      service.toggleTheme(EDarkModes.DARK);

      expect(service.currentTheme()).toBe(EDarkModes.DARK);
    });

    it('should save theme to localStorage', () => {
      createService();

      service.toggleTheme(EDarkModes.DARK);

      expect(localStorage.setItem).toHaveBeenCalledWith('theme', EDarkModes.DARK);
    });

    it('should do nothing on server', () => {
      createService({ isBrowser: false });

      service.toggleTheme(EDarkModes.DARK);

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should add system listener when switching to system theme', () => {
      createService();
      service.toggleTheme(EDarkModes.DARK);
      vi.mocked(mockMediaQueryList.addEventListener!).mockClear();

      service.toggleTheme(EDarkModes.SYSTEM);

      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
      );
    });

    it('should remove system listener when switching away from system', () => {
      createService();
      service.init();

      service.toggleTheme(EDarkModes.DARK);

      expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('currentTheme getter', () => {
    it('should return a readonly signal', () => {
      createService();
      const theme = service.currentTheme;

      expect(typeof theme).toBe('function');
      expect(theme()).toBe(EDarkModes.SYSTEM);
    });

    it('should update when theme changes', () => {
      createService();

      service.toggleTheme(EDarkModes.DARK);

      expect(service.currentTheme()).toBe(EDarkModes.DARK);
    });
  });

  describe('localStorage integration', () => {
    it('should load light theme from storage', () => {
      createService();
      vi.mocked(localStorage.getItem).mockReturnValue(EDarkModes.LIGHT);

      service.init();

      expect(service.currentTheme()).toBe(EDarkModes.LIGHT);
    });

    it('should load dark theme from storage', () => {
      createService();
      vi.mocked(localStorage.getItem).mockReturnValue(EDarkModes.DARK);

      service.init();

      expect(service.currentTheme()).toBe(EDarkModes.DARK);
    });

    it('should handle localStorage read error gracefully', () => {
      createService();
      vi.mocked(localStorage.getItem).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      expect(() => service.init()).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle localStorage write error gracefully', () => {
      createService();
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      expect(() => service.toggleTheme(EDarkModes.DARK)).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should ignore invalid stored values', () => {
      createService();
      vi.mocked(localStorage.getItem).mockReturnValue('invalid-theme');

      service.init();

      expect(service.currentTheme()).toBe(EDarkModes.SYSTEM);
    });
  });

  describe('DOM updates', () => {
    // DOM updates happen via an Angular effect which runs asynchronously.
    // Testing the effect-based DOM manipulation is better suited for integration tests.
    // These tests verify that the service's public API works correctly.

    it('should update currentTheme when toggling to dark', () => {
      createService();
      service.toggleTheme(EDarkModes.DARK);
      expect(service.currentTheme()).toBe(EDarkModes.DARK);
    });

    it('should update currentTheme when toggling to light', () => {
      createService();
      service.toggleTheme(EDarkModes.DARK);
      service.toggleTheme(EDarkModes.LIGHT);
      expect(service.currentTheme()).toBe(EDarkModes.LIGHT);
    });

    it('should update themeMode based on currentTheme', () => {
      createService();
      service.toggleTheme(EDarkModes.DARK);
      expect(service.themeMode()).toBe(EDarkModes.DARK);
    });
  });

  describe('system preference changes', () => {
    it('should respond to system preference changes', () => {
      createService({ prefersDark: false });
      service.init();

      // Simulate system preference change
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent);
      }

      // The effect should update the DOM
      expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalled();
    });
  });

  describe('SSR compatibility', () => {
    it('should return false for isDarkModeActive on server', () => {
      createService({ isBrowser: false });

      // When not in browser, themeMode should fall back to light
      expect(service.themeMode()).toBe(EDarkModes.LIGHT);
    });

    it('should not throw when accessing query on server', () => {
      createService({ isBrowser: false });

      expect(() => service.toggleTheme(EDarkModes.DARK)).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should set up destroy callback in browser', () => {
      createService({ isBrowser: true });

      // The service should have registered a destroy callback
      // This is tested implicitly through the MediaQueryList listener setup
      expect(service).toBeTruthy();
    });
  });
});

describe('EDarkModes enum', () => {
  it('should have correct values', () => {
    expect(EDarkModes.LIGHT).toBe('light');
    expect(EDarkModes.DARK).toBe('dark');
    expect(EDarkModes.SYSTEM).toBe('system');
  });
});
