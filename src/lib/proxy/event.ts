import EventEmitter from 'events';
import { models } from './model';
import { writeModels } from "./writer";

class OAPIEmitter extends EventEmitter {}

export const emitter = new OAPIEmitter();

const delayFn = (fn: () => void, delayMs: number) => {
  let timer: NodeJS.Timeout;
  return () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(fn, delayMs);
  };
};

const delayedWriteModels = delayFn(() => writeModels(process.cwd(), models), 500);

emitter.on('api-update', async () => {
  delayedWriteModels();
});
