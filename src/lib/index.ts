import { expresso } from './expresso';

import { ExpressProxy as Express, RouterProxy as Router } from './proxy';
import * as real_express from 'express-original';

module.exports = Express;

for (const k of Object.keys(real_express)) {
  module.exports[k] = Reflect.get(real_express, k);
}

module.exports.Router = Router;
module.exports.expresso = expresso;

