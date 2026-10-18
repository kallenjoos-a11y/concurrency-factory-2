import { useState } from 'react';
import CoreLesson from './CoreLesson.tsx';
import CounterLesson from './CounterLesson.tsx';
import { coreLessons } from './lesson/core-curriculum.ts';
import type { LessonId } from './components/LessonHeader.tsx';
export default function App() {
  const [lesson,setLesson]=useState<LessonId>(()=>{const id=new URLSearchParams(window.location.search).get('lesson');return id==='counter'?'counter':coreLessons.find(item=>item.id===id)?.id??'threads';});
  function switchLesson(next:LessonId) {const url=new URL(window.location.href);url.searchParams.set('lesson',next);url.searchParams.delete('exercise');window.history.replaceState(null,'',url);setLesson(next);window.scrollTo(0,0);}
  return lesson==='counter'?<CounterLesson onSwitch={switchLesson}/>:<CoreLesson key={lesson} id={lesson} onSwitch={switchLesson}/>;
}
