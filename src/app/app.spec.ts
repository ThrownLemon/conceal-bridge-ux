import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

const TESTNET_BANNER_DISMISSED_KEY = 'testnet_banner_dismissed';

describe('App', () => {
  let sessionStorageMock: {
    getItem: ReturnType<typeof vi.fn>;
    setItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // Create sessionStorage mock
    sessionStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render app chrome', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Conceal Bridge');
  });

  describe('testnet banner', () => {
    it('should have isTestnet as true in development environment', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      // In test environment, production is false so isTestnet should be true
      expect(app['isTestnet']).toBe(true);
    });

    it('should initialize testnetBannerDismissed to false when sessionStorage is empty', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [App],
        providers: [provideRouter([])],
      });

      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      expect(app['testnetBannerDismissed']()).toBe(false);
    });

    it('should initialize testnetBannerDismissed to true when sessionStorage has dismissed flag', () => {
      sessionStorageMock.getItem.mockReturnValue('true');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [App],
        providers: [provideRouter([])],
      });

      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      expect(app['testnetBannerDismissed']()).toBe(true);
    });

    it('should persist dismissal to sessionStorage when dismissTestnetBanner is called', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      app['dismissTestnetBanner']();

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(TESTNET_BANNER_DISMISSED_KEY, 'true');
    });

    it('should update testnetBannerDismissed signal when dismissTestnetBanner is called', () => {
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      expect(app['testnetBannerDismissed']()).toBe(false);
      app['dismissTestnetBanner']();
      expect(app['testnetBannerDismissed']()).toBe(true);
    });

    it('should handle sessionStorage.getItem throwing gracefully', () => {
      sessionStorageMock.getItem.mockImplementation(() => {
        throw new Error('sessionStorage unavailable');
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [App],
        providers: [provideRouter([])],
      });

      // Should not throw, and should default to false
      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;
      expect(app['testnetBannerDismissed']()).toBe(false);
    });

    it('should handle sessionStorage.setItem throwing gracefully', () => {
      sessionStorageMock.setItem.mockImplementation(() => {
        throw new Error('sessionStorage quota exceeded');
      });

      const fixture = TestBed.createComponent(App);
      const app = fixture.componentInstance;

      // Should not throw, and should still update the signal
      expect(() => app['dismissTestnetBanner']()).not.toThrow();
      expect(app['testnetBannerDismissed']()).toBe(true);
    });

    it('should read from sessionStorage with correct key', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [App],
        providers: [provideRouter([])],
      });

      TestBed.createComponent(App);

      expect(sessionStorageMock.getItem).toHaveBeenCalledWith(TESTNET_BANNER_DISMISSED_KEY);
    });
  });
});
