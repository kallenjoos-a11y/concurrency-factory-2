import { coreLessons, type CoreLessonId } from '../lesson/core-curriculum.ts';
export type LessonId = CoreLessonId | 'counter';
export default function LessonHeader({ lesson, onSwitch, onRestart }: { lesson: LessonId; onSwitch: (lesson: LessonId) => void; onRestart: () => void }) {
  return <header className="site-header">
    <a href="#" onClick={event => { event.preventDefault(); onRestart(); }} className="brand"><span className="brand-mark" aria-hidden="true">▥</span><span>concurrency<span className="brand-light">factory</span></span></a>
    <span className="header-label">LEARN BY WATCHING</span>
    <nav className="lesson-switcher" aria-label="Choose a lesson">{coreLessons.map((item,i)=><button key={item.id} aria-pressed={lesson===item.id} onClick={()=>onSwitch(item.id)}>{String(i+1).padStart(2,'0')} <span>{item.short}</span></button>)}</nav>
  </header>;
}
