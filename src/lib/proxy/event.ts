import EventEmitter from 'events';
import { models } from './model';
import { writeSpecification } from "./writer";

class OAPIEmitter extends EventEmitter {}

export const emitter = new OAPIEmitter();

const delayFunction = (fn: (...a: any[]) => any, delayMs: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(fn, delayMs, ...args)
  }
}

const delayedWriteSpecification = delayFunction(writeSpecification, 1000)

emitter.on('api-update', async () => {
  delayedWriteSpecification(process.cwd(), models)
});
