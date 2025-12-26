import type { ListenerOptions } from '@angular/core';
import { EventManagerPlugin } from '@angular/platform-browser';

export class ZardDebounceEventManagerPlugin extends EventManagerPlugin {
  override supports(eventName: string): boolean {
    // Supported formats:
    // - "event.debounce"
    // - "event.debounce.<delayMs>" (e.g. "input.debounce.150")
    // Where "event" may contain dots (custom events).
    // Intentionally only matches when ".debounce" is the suffix (optionally followed by a delay),
    // so it doesn't accidentally swallow other modifier syntaxes.
    return /\.debounce(?:\.\d+)?$/.test(eventName);
  }

  override addEventListener(
    element: HTMLElement,
    eventName: string,
    handler: (event: Event) => void,
    options?: ListenerOptions,
  ): () => void {
    // Expected formats:
    // - "event.debounce"
    // - "event.debounce.<delayMs>" (e.g. "input.debounce.150")
    // If delay is omitted or invalid, defaults to 300ms
    const [event, delayString] = eventName.split('.debounce');
    const parsedDelay = Number.parseInt(delayString?.substring(1) ?? '');
    const resolvedDelay = Number.isNaN(parsedDelay) ? 300 : parsedDelay;

    let timeoutId!: ReturnType<typeof setTimeout>;
    const listener = (event: Event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(event), resolvedDelay);
    };
    const unsubscribe = this.manager.addEventListener(element, event, listener, options);
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }
}
