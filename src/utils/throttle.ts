export type ThrottledFunction<T extends (...args: never[]) => unknown> = T & { cancel: () => void };

export function throttle<T extends (...args: never[]) => unknown>(fn: T, wait: number, options: { leading?: boolean; trailing?: boolean } = {}) {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;

  const invoke = (args: Parameters<T>) => {
    lastCall = Date.now();
    fn(...args);
  };

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    if (!lastCall && !leading) lastCall = now;
    const remaining = wait - (now - lastCall);
    lastArgs = args;

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      invoke(args);
      return;
    }

    if (!timer && trailing) {
      timer = setTimeout(() => {
        timer = null;
        if (lastArgs) invoke(lastArgs);
      }, remaining);
    }
  }) as ThrottledFunction<T>;

  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };

  return throttled;
}
