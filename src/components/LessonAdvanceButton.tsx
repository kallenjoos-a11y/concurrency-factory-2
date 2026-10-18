import type { ButtonHTMLAttributes } from 'react';

/** Show the explanation from the top after React renders the next lesson step. */
export default function LessonAdvanceButton({ onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="primary" onClick={event => {
    onClick?.(event);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  }}/>;
}
