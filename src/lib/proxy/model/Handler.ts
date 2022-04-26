import express from 'express-original';
import { Endpoint, EndpointJSON } from './Endpoint';
import { HTTP_METHOD } from './Method';
import path from 'path';
import { emitter } from "../event"

export interface HandlerJSON {
  _instance: ExpressHandler;
  _endpoints: { [k1: string]: { [k2 in HTTP_METHOD]: EndpointJSON } };
  _routers: { [key: string]: HandlerJSON[] };
}

export type ExpressHandler = express.Express | express.Application | express.Router;
export class Handler {
  private readonly _instance: ExpressHandler;
  private readonly _endpoints: { [k1: string]: { [k2 in HTTP_METHOD]: Endpoint } } = {};
  private readonly _routers: { [key: string]: Handler[] } = {};

  constructor(app: ExpressHandler) {
    this._instance = app;
  }

  add(endpoint: Endpoint) {
    const obj = this._endpoints[endpoint.path] || {};
    obj[endpoint.method] = endpoint;
    this._endpoints[endpoint.path] = obj;
    emitter.emit('api-update');
  }

  mount(path: string, router: Handler) {
    this._routers[path] = (this._routers[path] || []).concat(router);
    emitter.emit('api-update');
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
  getEndpoints(basePath = ''): { [k1: string]: { [k2 in HTTP_METHOD]: Endpoint } } {
    const endpoints: { [k1: string]: { [k2 in HTTP_METHOD]: Endpoint } } = {};
    for (const p of Object.keys(this._endpoints)) {
      const fullPath = path.normalize(`${basePath}${p}`);
      endpoints[fullPath] = this._endpoints[p];
    }
    for (const p of Object.keys(this._routers)) {
      const fullPath = path.normalize(`${basePath}${p}`);
      this._routers[p].forEach((router) => Object.assign(endpoints, router.getEndpoints(fullPath)));
    }
    return endpoints;
  }

  static fromJSON(obj: HandlerJSON): Handler {
    const handler = new Handler(obj._instance);
    const endpoints = Object.values(obj._endpoints).flatMap((x) => Object.values(x).map((x) => Endpoint.fromJSON(x)));
    endpoints.forEach((x) => handler.add(x));
    const entries = Object.entries(obj._routers).map(
      ([path, handlers]) => [path, handlers.map((handler) => Handler.fromJSON(handler))] as [string, Handler[]],
    );
    entries.forEach(([path, handlers]) => handlers.forEach((x) => handler.mount(path, x)));
    return handler;
  }
}
