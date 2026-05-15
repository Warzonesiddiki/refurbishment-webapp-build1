import { useEffect, useRef } from "react";

type FocusTrapProps = {
  active: boolean;
  children: React.ReactNode;
};

const FOCUS_SELECTOR = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export function FocusTrap({ active, children }: FocusTrapProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !rootRef.current) return;
    const node = rootRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUS_SELECTOR));
    focusable[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = Array.from(node.querySelectorAll<HTMLElement>(FOCUS_SELECTOR));
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [active]);

  return <div ref={rootRef}>{children}</div>;
}
