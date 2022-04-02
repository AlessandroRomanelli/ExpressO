import express from 'express-original';
import { Endpoint, ExpressHandler, Handler, HTTP_METHOD, models, OAPI_METHODS } from "./model";
import { emitter } from './event';
import { RequestHandler } from 'express';
import _ from 'lodash';


const isHTTPMethod = (method: string): method is HTTP_METHOD => {
  return ['all', ...OAPI_METHODS].includes(method);
};

let opIndex = 0;
const makeProxyHandler = (app: Handler): ProxyHandler<express.Express> => {
  const routeHandlerEndpoint = (method: HTTP_METHOD | 'all'): ProxyHandler<RequestHandler> => ({
    apply: (target, thisArg, argArray) => {
      const [path, ...handlers] = argArray;
      const routeHandlers = handlers.flatMap((x) => x).map((x) => x.toString());
      if (method === 'all') {
        OAPI_METHODS.forEach((m) => app.add(new Endpoint(m, path, routeHandlers, opIndex++)));
      } else {
        app.add(new Endpoint(method, path, routeHandlers, opIndex++));
      }
      emitter.emit('api-update');
    },
  });

  const isHandler = (handler: any): handler is RequestHandler => {
    return (handler as RequestHandler).apply !== undefined;
  };

  const isRouter = (handler: any): handler is express.IRouter => {
    return (handler as express.IRouter).use !== undefined;
  };

  const routeHandlerMount: ProxyHandler<RequestHandler> = {
    apply: (target, thisArg, argArray) => {
      if (argArray.length < 2) return;
      const [path, ...handlers] = argArray as [string, ...any[]];
      const handler = _.last(handlers);
      if (!handler) return;
      if (isRouter(handler)) {
        app.mount(path, Reflect.get(handler, 'model'));
        models.delete(Reflect.get(handler, 'model'));
      } else if (isHandler(handler)) {
        OAPI_METHODS.forEach((m) =>
          app.add(
            new Endpoint(
              m,
              path + '*',
              handlers.flatMap((x) => x).map((x) => x.toString()),
              opIndex++,
            ),
          ),
        );
      }
      emitter.emit('api-update');
    },
  };

  return {
    get: (target, p, receiver) => {
      const method = p.toString();
      if (isHTTPMethod(method)) {
        return new Proxy(Reflect.get(target, p), routeHandlerEndpoint(method));
      }
      if (p === 'use') {
        return new Proxy(Reflect.get(target, p), routeHandlerMount);
      }
      return Reflect.get(target, p, receiver);
    },
  };
};

const makeProxy = (handler: ExpressHandler) => {
  const application = new Handler(handler);
  models.add(application);
  const proxy = new Proxy<ExpressHandler>(application.instance, makeProxyHandler(application));
  Reflect.set(proxy, 'model', application);
  return proxy;
};

export const ExpressProxy = () => makeProxy(express());
export const RouterProxy = (options?: express.RouterOptions) => makeProxy(express.Router(options));
