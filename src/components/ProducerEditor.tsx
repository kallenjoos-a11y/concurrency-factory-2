import type { KeyboardEvent } from 'react';

/** Keep the teaching function body indented while the learner types. */
export function indentProducerKey(event: KeyboardEvent<HTMLTextAreaElement>, draft: string, setDraft: (value: string) => void) {
  if (event.shiftKey || event.nativeEvent.isComposing) return;
  if (event.key !== 'Enter' && event.key !== 'Tab') return;
  event.preventDefault();
  const input = event.currentTarget;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const currentLine = draft.slice(0, start).split('\n').at(-1) ?? '';
  const whitespace = /^\s*/.exec(currentLine)?.[0] || '    ';
  const insert = event.key === 'Enter' ? `\n${whitespace}` : '    ';
  setDraft(draft.slice(0, start) + insert + draft.slice(end));
  requestAnimationFrame(() => { input.selectionStart = input.selectionEnd = start + insert.length; });
}
