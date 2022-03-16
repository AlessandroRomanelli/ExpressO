#!/usr/local/bin ts-node

import { Method } from './Method';
import { Request, Response } from 'express-serve-static-core';
import http from 'http';
import { OpenAPIV3 } from "openapi-types";

export type ExpressHandlerFunction = (req: Request | http.IncomingMessage, res: Response | http.ServerResponse) => any;

export class Endpoint {
  readonly method: Method;
  readonly path: string;
  readonly handlers: ExpressHandlerFunction[];
  readonly responses: OpenAPIV3.ResponsesObject
  readonly params: OpenAPIV3.ParameterObject[]

  constructor(method: Method, path: string, handlers: ExpressHandlerFunction[]) {
    this.method = method
    this.path = path
    this.handlers = handlers
    const [ responses, params ] = this.analyzeHandlers(handlers)
    this.responses = responses
    this.params = params
  }

  getResponses(handler: ExpressHandlerFunction): OpenAPIV3.ResponsesObject {
    return {}
  }

  getParameters(handler: ExpressHandlerFunction): OpenAPIV3.ParameterObject[] {
    return []
  }

  analyzeHandler(handler: ExpressHandlerFunction): [OpenAPIV3.ResponsesObject, OpenAPIV3.ParameterObject[]] {
    return [
      this.getResponses(handler),
      this.getParameters(handler)
    ]
  }

  analyzeHandlers(handlers: ExpressHandlerFunction[]): [OpenAPIV3.ResponsesObject, OpenAPIV3.ParameterObject[]] {
    return handlers.map(this.analyzeHandler).reduce(([prevResponses, prevParams], [responses, params]) =>
      [Object.assign(prevResponses || {}, responses), (prevParams || []).concat(params)], [{},[]])
  }

}
