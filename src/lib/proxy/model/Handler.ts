import express from 'express-original';
import { Endpoint, EndpointJSON } from './Endpoint';
import { Method } from './Method';
import path from 'path';

export interface HandlerJSON {
  _instance: ExpressHandler;
  _endpoints: { [k1: string]: { [k2 in Method]: EndpointJSON } };
  _routers: { [key: string]: HandlerJSON };
}

export type ExpressHandler = express.Express | express.Application | express.Router;
export class Handler {
  private readonly _instance: ExpressHandler;
  private readonly _endpoints: { [k1: string]: { [k2 in Method]: Endpoint } } = {};
  private readonly _routers: { [key: string]: Handler } = {};

  constructor(app: ExpressHandler) {
    this._instance = app;
  }

  add(endpoint: Endpoint) {
    const obj = this._endpoints[endpoint.path] || {};
    obj[endpoint.method] = endpoint;
    this._endpoints[endpoint.path] = obj;
  }

  mount(path: string, router: Handler) {
    this._routers[path] = router;
  }

  get endpoints() {
    return this._endpoints;
  }
  get instance() {
    return this._instance;
  }
  get routers() {
    return this._routers;
  }

  // TODO: Add sorting depending on operation order
  getEndpoints(basePath = ''): { [k1: string]: { [k2 in Method]: Endpoint } } {
    const endpoints: { [k1: string]: { [k2 in Method]: Endpoint } } = {};
    for (const p of Object.keys(this._endpoints)) {
      const fullPath = path.normalize(`${basePath}${p}`);
      endpoints[fullPath] = this._endpoints[p];
    }
    for (const p of Object.keys(this._routers)) {
      const fullPath = path.normalize(`${basePath}${p}`);
      Object.assign(endpoints, this._routers[p].getEndpoints(fullPath));
    }
    return endpoints;
  }

  static fromJSON(obj: HandlerJSON): Handler {
    const handler = new Handler(obj._instance);
    const endpoints = Object.values(obj._endpoints).flatMap((x) => Object.values(x).map((x) => Endpoint.fromJSON(x)));
    endpoints.forEach((x) => handler.add(x));
    const handlers = Object.entries(obj._routers).map(([path, x]) => [path, Handler.fromJSON(x)] as [string, Handler]);
    handlers.forEach(([path, x]) => handler.mount(path, x));
    return handler;
  }
}
