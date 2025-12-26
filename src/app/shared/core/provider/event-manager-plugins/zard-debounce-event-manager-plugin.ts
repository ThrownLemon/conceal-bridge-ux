import type { ListenerOptions } from '@angular/core';
import { EventManagerPlugin } from '@angular/platform-browser';

export class ZardDebounceEventManagerPlugin extends EventManagerPlugin {
  override supports(eventName: string): boolean {
    return /\.debounce(?:\.|$)/.test(eventName);
  }

  override addEventListener(
    element: HTMLElement,
    eventName: string,
    handler: (event: Event) => void,
    options?: ListenerOptions,
  ): () => void {
    // Expected format: "event.debounce.delay" (e.g., "input.debounce.150")
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
