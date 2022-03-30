import express from 'express-original';
import { Endpoint } from './Endpoint';
import { Method } from './Method';

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
    for (const path of Object.keys(this._endpoints)) {
      const fullPath = `${basePath}${path}`;
      endpoints[fullPath] = this._endpoints[path];
    }
    for (const path of Object.keys(this._routers)) {
      const fullPath = `${basePath}${path}`;
      Object.assign(endpoints, this._routers[path].getEndpoints(fullPath));
    }

    return endpoints;
  }
}
