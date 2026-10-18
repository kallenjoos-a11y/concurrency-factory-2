import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/** Follow the current instruction within the code pane without moving the page. */
export default function CodeViewport({ label, activeLine, step, children }: { label: string; activeLine?: number | null; step?: number; children: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  useLayoutEffect(() => {
    const pane = ref.current;
    const line = pane?.querySelector<HTMLElement>('.code-line.highlight');
    if (!pane || !line || activeLine == null) return;
    const follow = () => {
      const frame = pane.getBoundingClientRect();
      const current = line.getBoundingClientRect();
      if (current.top < frame.top + 8) pane.scrollTop += current.top - frame.top - 8;
      else if (current.bottom > frame.bottom - 8) pane.scrollTop += current.bottom - frame.bottom + 8;
    };
    follow();
    const observer = new ResizeObserver(follow);
    observer.observe(pane);
    return () => observer.disconnect();
  }, [activeLine, step]);
  return <pre ref={ref} tabIndex={0} aria-label={label}>{children}</pre>;
}
