/**
 * Debounce helper with leading + trailing behaviour.
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number
): T & { cancel: () => void; flush: () => void } {
  let timer: NodeJS.Timeout | undefined;
  let lastArgs: Parameters<T> | undefined;
  const wrapped = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = undefined;
      }
    }, waitMs);
  }) as T & { cancel: () => void; flush: () => void };

  wrapped.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    lastArgs = undefined;
  };

  wrapped.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = undefined;
    }
  };

  return wrapped;
}
