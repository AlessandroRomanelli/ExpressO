import express from "express";
import {
  ExpressHandler,
  ExpressHandlerFunction,
  Handler,
  HTTP_METHODS,
  Method,
  models
} from "./model";
import { emitter } from "./event";

const isHTTPMethod = (method: string): method is Method  => {
  return HTTP_METHODS.includes((method as Method))
}

const makeProxyHandler = (app: Handler): ProxyHandler<express.Express> => {
  const routeHandlerEndpoint = (method: Method): ProxyHandler<ExpressHandlerFunction> => ({
    apply: (target, thisArg, argArray) => {
      const [path, ...handlers] = argArray
      app.add({
        method,
        path,
        handlers,
        responses: []
      })
      emitter.emit('api-update')
    }
  })

  const routeHandlerMount: ProxyHandler<ExpressHandlerFunction> = {
    apply: (target, thisArg, argArray) => {
      if (argArray.length < 2) return;
      const [path, ...[handler]] = (argArray as [string, ...express.IRouter[]])
      app.mount(path, Reflect.get(handler, "model"))
      emitter.emit('api-update')
    }
  }

  return ({
    get: (target, p, receiver) => {
      const method = p.toString()
      if (isHTTPMethod(method)) {
        return new Proxy(Reflect.get(target, p), routeHandlerEndpoint(method))
      }
      if (p === "use") {
        return new Proxy(Reflect.get(target, p), routeHandlerMount)
      }
      return Reflect.get(target, p, receiver)
    }
  })
}

const makeProxy = (handler: ExpressHandler) => {
  const application = new Handler(handler)
  models.add(application)
  const proxy = new Proxy<ExpressHandler>(application.instance, makeProxyHandler(application))
  Reflect.set(proxy, "model", application)
  return proxy
}

export const ExpressProxy = () => makeProxy(express())
export const RouterProxy = (options?: express.RouterOptions) => makeProxy(express.Router(options))