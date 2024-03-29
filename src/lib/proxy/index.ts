import express from 'express-original';
import { Endpoint, ExpressHandler, Handler, HTTP_METHOD, models } from './model';
import { emitter } from './event';
import { RequestHandler } from 'express';
import path from 'path';
import _ from 'lodash';

const isHTTPMethod = (method: string): method is HTTP_METHOD => {
  return Object.values(HTTP_METHOD).includes(method as HTTP_METHOD);
};

let opIndex = 0;
const makeProxyHandler = (app: Handler): ProxyHandler<express.Handler> => {
  const routeHandlerEndpoint = (method: HTTP_METHOD): ProxyHandler<RequestHandler> => ({
    apply: (target, thisArg, argArray) => {
      const [path, ...handlers] = argArray;
      const routeHandlers = handlers.flatMap((x) => x).map((x) => x.toString());
      app.add(new Endpoint(method, path, routeHandlers, opIndex++));
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
      const [p, ...handlers] = argArray as [string, ...any[]];
      const handler = _.last(handlers);
      if (!handler) return;
      if (isRouter(handler)) {
        app.mount(p, Reflect.get(handler, 'model'));
        models.delete(Reflect.get(handler, 'model'));
      } else if (isHandler(handler)) {
        app.add(
          new Endpoint(
            HTTP_METHOD.ALL,
            path.resolve(p, '*'),
            handlers.flatMap((x) => x).map((x) => x.toString()),
            opIndex++,
          ),
        );
      }
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
