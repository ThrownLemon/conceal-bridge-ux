import { ZardDebounceEventManagerPlugin } from './zard-debounce-event-manager-plugin';
import { ZardEventManagerPlugin } from './zard-event-manager-plugin';

describe('Zard event manager plugins', () => {
  interface EventManagerLike {
    addEventListener: (
      element: HTMLElement,
      eventName: string,
      handler?: (event: Event) => void,
      options?: unknown,
    ) => () => void;
  }

  it('debounce plugin should preserve dotted event names', () => {
    const plugin = new ZardDebounceEventManagerPlugin(document);

    let registeredEvent: string | null = null;
    (plugin as unknown as { manager: EventManagerLike }).manager = {
      addEventListener: (_el: HTMLElement, eventName: string) => {
        registeredEvent = eventName;
        return () => void 0;
      },
    };

    const el = document.createElement('div');
    plugin.addEventListener(el, 'my.custom.event.debounce.150', () => void 0);

    expect(registeredEvent).toBe('my.custom.event');
  });

  it('event modifier plugin should treat key tokens as filters (keydown.enter.prevent)', () => {
    const plugin = new ZardEventManagerPlugin(document);

    let registeredEvent: string | null = null;
    let registeredCallback: ((event: Event) => void) | undefined;
    (plugin as unknown as { manager: EventManagerLike }).manager = {
      addEventListener: (_el: HTMLElement, eventName: string, cb?: (event: Event) => void) => {
        registeredEvent = eventName;
        registeredCallback = cb;
        return () => void 0;
      },
    };

    const el = document.createElement('button');
    const handler = vi.fn();
    plugin.addEventListener(el, 'keydown.enter.prevent', handler);

    expect(registeredEvent).toBe('keydown');

    // The modifier should apply on Enter and still call the handler.
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    registeredCallback?.(event);

    expect(preventSpy).toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
  });
});
