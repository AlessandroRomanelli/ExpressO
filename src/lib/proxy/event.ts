import EventEmitter from 'events';
import { models } from './model';
import { writeSpecification } from './writer';

class OAPIEmitter extends EventEmitter {}

export const emitter = new OAPIEmitter();

const delayFn = (fn: () => void, delayMs: number) => {
  let timer: NodeJS.Timeout;
  return () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(fn, delayMs)
  }
}

const delayedWriteSpecification = delayFn(() => writeSpecification(process.cwd(), models), 1000);

emitter.on('api-update', async () => {
  delayedWriteSpecification();
});
