import { useLayoutEffect, useState } from 'react';

/** Reading unlocks a section once, without gating the individual factory operations. */
export function usePageRead(section: string): boolean {
  const [read, setRead] = useState<{ section: string; reached: boolean }>({ section, reached: false });
  useLayoutEffect(() => {
    let ready = false;
    const check = () => {
      if (!ready) return;
      const bottom = document.documentElement.scrollHeight;
      if (window.scrollY + window.innerHeight >= bottom - 8) {
        setRead(previous => previous.section === section && previous.reached ? previous : { section, reached: true });
      }
    };
    setRead({ section, reached: false });
    // Section navigation scrolls to the top before this initial measurement.
    const frame = window.requestAnimationFrame(() => { ready = true; check(); });
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    const observer = new ResizeObserver(check);
    observer.observe(document.body);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      observer.disconnect();
    };
  }, [section]);
  return read.section === section && read.reached;
}
