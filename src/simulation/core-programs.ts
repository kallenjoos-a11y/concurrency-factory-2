import type { Instruction, Scenario } from './types.ts';
import type { CoreLessonId } from '../lesson/core-curriculum.ts';
import { counterScenario, safePython, unsafePython } from './scenarios.ts';
import { queueScenario, queuePython } from './queue-scenario.ts';
import { emptyQueueScenario, emptyQueuePython } from './empty-queue-scenario.ts';
export interface CoreProgram { scenario: Scenario; python: string[]; label: string }
const location = (line: number) => ({ file: 'lesson.py', line });

export function processingProgram(workers = 1, count = 4): CoreProgram {
  if (!Number.isInteger(workers) || workers < 1 || workers > 2 || !Number.isInteger(count) || count < 1 || count > 6) throw new Error('Use 1–2 workers and 1–6 packages.');
  const python: string[] = ['import threading', '', '# process() represents independent package work', ''];
  const packages = Array.from({ length: count }, (_, i) => ({ id: `package-${i}`, label: `Package ${String.fromCharCode(65+i)}`, value: `Package ${String.fromCharCode(65+i)}` }));
  const definitions = Array.from({ length: Math.min(workers,count) }, (_, i) => {
    const id = String.fromCharCode(97+i); const definition = python.length + 1;
    python.push(`def worker_${id}():`);
    const instructions: Instruction[] = [];
    packages.filter((_, index) => index % workers === i).forEach(item => {
      const line = python.length + 1; python.push(`    process("${item.label}")`);
      instructions.push({type:'BEGIN_PROCESS',packageId:item.id,sourceLocation:location(line)}, {type:'END_PROCESS',packageId:item.id,sourceLocation:location(line)});
    });
    python.push(''); instructions.push({type:'FINISH',sourceLocation:location(definition)});
    return {id,name:`Thread ${id.toUpperCase()}`,instructions};
  });
  for (const worker of definitions) { python.push(`thread_${worker.id} = threading.Thread(target=worker_${worker.id})`, `thread_${worker.id}.start()`); }
  const rounds = Math.max(...definitions.map(worker => worker.instructions.length));
  const schedule = Array.from({length:rounds},(_,i)=>definitions.filter(worker=>worker.instructions[i]).map(worker=>worker.id)).flat();
  return {python,label:`${definitions.length} worker${definitions.length>1?'s':''}`,scenario:{id:`threads-${workers}-${count}`,workers:definitions,packages,sharedVariables:[],locks:[],schedule}};
}
export function machineProgram(permits = 3, lock = false): CoreProgram {
  if (!Number.isInteger(permits) || permits < 1 || permits > 3) throw new Error('Use 1–3 machine permits.');
  const python = ['import threading', '', lock ? 'machines = threading.Lock()' : `machines = threading.Semaphore(${permits})`, '', 'def worker(item):', '    with machines:', '        process(item)'];
  const packages = ['a','b','c','d'].map(id=>({id:`package-${id}`,label:`Package ${id.toUpperCase()}`,value:id}));
  const workers = ['a','b','c','d'].map((id,i)=>({id,name:`Thread ${id.toUpperCase()}`,instructions:[
    lock ? {type:'ACQUIRE_LOCK',lock:'machines',sourceLocation:location(6)} : {type:'ACQUIRE_SEMAPHORE',semaphore:'machines',sourceLocation:location(6)},
    {type:'BEGIN_PROCESS',packageId:packages[i].id,sourceLocation:location(7)},
    {type:'END_PROCESS',packageId:packages[i].id,sourceLocation:location(7)},
    lock ? {type:'RELEASE_LOCK',lock:'machines',sourceLocation:location(6)} : {type:'RELEASE_SEMAPHORE',semaphore:'machines',sourceLocation:location(6)},
    {type:'FINISH',sourceLocation:location(5)},
  ] as Instruction[]}));
  return {python,label:lock?'One shared Lock':`${permits} machine permit${permits>1?'s':''}`,scenario:{id:lock?'machines-lock':`machines-${permits}`,workers,packages,sharedVariables:[],locks:lock?[{id:'machines',name:'machines'}]:[],semaphores:lock?[]:[{id:'machines',name:'machines',permits}],schedule:['a','b','c','d','a','b','c','a','a','d','d','b','b','c','c','d','d','a','b','c','d']}};
}
export function coreProgram(id: CoreLessonId, second = false): CoreProgram {
  switch (id) {
    case 'threads': return processingProgram(second ? 2 : 1);
    case 'queue': return {scenario:queueScenario(),python:queuePython,label:'Producer then Consumer'};
    case 'empty-queue': return {scenario:emptyQueueScenario(),python:emptyQueuePython,label:'Consumer arrives first'};
    case 'race': {const scenario=counterScenario(false); if(second) scenario.schedule=['a','a','a','a','b','b','b','b']; return {scenario,python:unsafePython,label:second?'Same code, serial order':'Overlapping updates'};}
    case 'lock': return {scenario:counterScenario(!second),python:second?unsafePython:safePython,label:second?'Without Lock':'With Lock'};
    case 'semaphore': return machineProgram(3,!second);
  }
}
