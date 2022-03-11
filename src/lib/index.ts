import { expresso } from './expresso';

import { ExpressProxy as Express, RouterProxy as Router, models } from "./proxy";
import real_express from "express";

module.exports = Express

for (const k of Object.keys(real_express)) {
  Reflect.set(module.exports, k, Reflect.get(real_express, k))
}

module.exports.Router = Router
module.exports.models = models
module.exports.expresso = expresso