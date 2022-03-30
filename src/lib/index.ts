import { expresso } from './expresso';

import { ExpressProxy as Express, RouterProxy as Router } from './proxy';
import real_express from 'express-original';

// TODO: Different versions of express?
module.exports = Express;

for (const k of Object.keys(real_express || {})) {
  Reflect.set(module.exports, k, Reflect.get(real_express, k));
}

module.exports.Router = Router;
module.exports.expresso = expresso;

import type * as Types from 'express-original'
export { Types }
