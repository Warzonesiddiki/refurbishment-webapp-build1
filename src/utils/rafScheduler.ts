const queue = new Map<string, () => void>();
let rafId: number | null = null;

function flush() {
  queue.forEach((fn) => fn());
  queue.clear();
  rafId = null;
}

export const rafScheduler = {
  schedule(id: string, fn: () => void) {
    queue.set(id, fn);
    if (rafId === null) rafId = requestAnimationFrame(flush);
  },
  cancel(id: string) {
    queue.delete(id);
  },
};

export function measureElement(element: HTMLElement): Promise<DOMRect> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve(element.getBoundingClientRect()));
  });
}
