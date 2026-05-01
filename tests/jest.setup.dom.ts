import '@testing-library/jest-dom';

// jsdom doesn't ship a PointerEvent constructor; framer-motion / motion-dom
// dispatch synthetic pointer events on keyboard activation, which crashes
// without this polyfill. See motion-dom/src/gestures/press/utils/keyboard.ts.
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId?: number;
    pointerType?: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId;
      this.pointerType = params.pointerType;
    }
  }
  // @ts-expect-error -- assigning a polyfill onto globalThis
  globalThis.PointerEvent = PointerEventPolyfill;
}
