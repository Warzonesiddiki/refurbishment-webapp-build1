export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: number | null = null;
  return (...args: Parameters<T>) => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
}
