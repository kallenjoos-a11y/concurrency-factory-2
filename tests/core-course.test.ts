import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coreLessons} from '../src/lesson/core-curriculum.ts';
import {coreProgram,machineProgram,processingProgram} from '../src/simulation/core-programs.ts';
import {SimulationController} from '../src/simulation/controller.ts';
import {Simulation} from '../src/simulation/simulation.ts';
import type {SimulationSnapshot} from '../src/simulation/types.ts';
function run(controller:SimulationController) {
  const states:SimulationSnapshot[]=[];
  for(let i=0;i<100 && controller.snapshot().status!=='FINISHED';i++) {const state=controller.nextStep();assert.notEqual(state.status,'STALLED');states.push(state);}
  assert.equal(controller.snapshot().status,'FINISHED');return states;
}
test('all six lesson runs and comparisons complete, have valid source mapping, and replay after reset',()=>{
  assert.equal(coreLessons.length,6); assert.equal(new Set(coreLessons.map(item=>item.id)).size,6);
  for(const lesson of coreLessons) for(const second of lesson.compare?[false,true]:[false]) {
    const program=coreProgram(lesson.id,second); const controller=new SimulationController(program.scenario);
    for(const worker of program.scenario.workers) for(const instruction of worker.instructions) assert.ok(program.python[instruction.sourceLocation.line-1]?.trim());
    const states=run(controller);const result=states.at(-1)!;
    if(lesson.id==='race')assert.equal(result.sharedVariables[0].value,second?12:11);
    if(lesson.id==='lock')assert.equal(result.sharedVariables[0].value,second?11:12);
    if(lesson.id==='threads'||lesson.id==='semaphore')assert.ok(result.packages.every(item=>item.state==='COMPLETED'));
    controller.reset(); assert.deepEqual(run(controller),states);
  }
});
test('one and two workers show serial versus overlapping processing without duplicate package completion',()=>{
  for(const count of [1,3,6])for(const workers of [1,2]){
    const controller=new SimulationController(processingProgram(workers,count).scenario);const states=run(controller);
    assert.equal(Math.max(...states.map(state=>state.packages.filter(item=>item.state==='PROCESSING').length)),Math.min(workers,count));
    assert.equal(states.at(-1)!.events.filter(event=>event.type==='PROCESS_COMPLETED').length,count);
    assert.equal(new Set(states.at(-1)!.events.filter(event=>event.type==='PROCESS_COMPLETED').map(event=>event.packageId)).size,count);
  }
});
test('Semaphore limit is enforced at every step and all permits return',()=>{
  for(const permits of [1,2,3]){
    const controller=new SimulationController(machineProgram(permits).scenario);const states=run(controller);
    for(const state of states){const resource=state.semaphores[0];assert.equal(resource.availablePermits+resource.holders.length,permits);assert.ok(resource.availablePermits>=0&&resource.availablePermits<=permits);assert.equal(new Set(resource.holders).size,resource.holders.length);}
    assert.equal(Math.max(...states.map(state=>state.semaphores[0].holders.length)),permits);
    assert.equal(states.at(-1)!.semaphores[0].availablePermits,permits);
    assert.ok(states.some(state=>state.workers.some(worker=>worker.state==='BLOCKED')));
    assert.ok(states.at(-1)!.packages.every(item=>item.state==='COMPLETED'));
  }
});
test('fourth worker blocks at acquisition and wakes READY without receiving a permit',()=>{
  const controller=new SimulationController(machineProgram(3).scenario);let state=controller.snapshot();
  for(let i=0;i<4;i++)state=controller.nextStep();
  assert.equal(state.workers[3].state,'BLOCKED');assert.equal(state.workers[3].instructionPointer,0);
  while(!state.events.some(event=>event.type==='SEMAPHORE_RELEASED'))state=controller.nextStep();
  assert.equal(state.workers[3].state,'READY');assert.equal(state.workers[3].instructionPointer,0);assert.ok(!state.semaphores[0].holders.includes('d'));
  assert.equal(state.semaphores[0].availablePermits,1);
  state=controller.nextStep();assert.ok(state.semaphores[0].holders.includes('d'));
  const reset=controller.reset();assert.equal(reset.semaphores[0].availablePermits,3);assert.deepEqual(reset.semaphores[0].waitingWorkers,[]);assert.ok(reset.packages.every(item=>item.state==='CREATED'));
});
test('invalid releases and processing ownership fail before domain mutation',()=>{
  const definition=machineProgram(3).scenario;
  definition.workers[0].instructions=[{type:'RELEASE_SEMAPHORE',semaphore:'machines',sourceLocation:{file:'lesson.py',line:6}},{type:'FINISH',sourceLocation:{file:'lesson.py',line:5}}];
  const simulation=new Simulation(definition);assert.throws(()=>simulation.nextStep(),/hold a permit/);assert.equal(simulation.snapshot().semaphores[0].availablePermits,3);
  const processing=processingProgram().scenario;processing.workers[0].instructions=[{type:'END_PROCESS',packageId:processing.packages![0].id,sourceLocation:{file:'lesson.py',line:2}},{type:'FINISH',sourceLocation:{file:'lesson.py',line:1}}];
  const engine=new Simulation(processing);assert.throws(()=>engine.nextStep(),/processing/);assert.equal(engine.snapshot().packages[0].state,'CREATED');
  for(const permits of [0,4,1.5,NaN])assert.throws(()=>machineProgram(permits));
  for(const workers of [0,3,1.5])assert.throws(()=>processingProgram(workers));
});
test('Semaphore snapshots cannot mutate live holders, limits, or package state',()=>{
  const controller=new SimulationController(machineProgram(3).scenario);const state=controller.nextStep();state.semaphores[0].holders.push('fake');state.semaphores[0].availablePermits=99;state.packages[0].state='COMPLETED';
  const current=controller.snapshot();assert.deepEqual(current.semaphores[0].holders,['a']);assert.equal(current.semaphores[0].availablePermits,2);assert.equal(current.packages[0].state,'CREATED');
});
