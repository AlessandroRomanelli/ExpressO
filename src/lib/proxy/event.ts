// tslint:disable:no-console

import EventEmitter from "events";
import { models } from "./model";

class OAPIEmitter extends EventEmitter {}

export const emitter = new OAPIEmitter()
emitter.on('api-update', () => {
  console.log(models)
})

