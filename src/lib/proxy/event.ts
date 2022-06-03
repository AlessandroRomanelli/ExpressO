import EventEmitter from 'events';
import { models } from './model';
import { writeModels } from './writer';
import fs from "fs";
import path from "path";

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

const delayedWriteModels = delayFn(() => writeModels(models), 100);

emitter.on('api-update', delayedWriteModels);
