#!/usr/local/bin ts-node

import { Method } from './Method';
import { NextFunction, Request, Response } from 'express-serve-static-core';
import http from 'http';
import { OpenAPIV3 } from 'openapi-types';
import { mineExpressResponses } from '../analyzer';

export type ExpressHandlerFunction = (req: Request, res: Response, next?: NextFunction) => any;

export class Endpoint {
  readonly method: Method;
  readonly path: string;
  readonly handlers: ExpressHandlerFunction[];
  readonly responses: OpenAPIV3.ResponsesObject = {};
  readonly params: OpenAPIV3.ParameterObject[] = [];
  readonly index: number;

  constructor(method: Method, path: string, handlers: ExpressHandlerFunction[], opIndex: number) {
    this.method = method;
    this.path = path;
    this.handlers = handlers;
    const [responses, params] = this.analyzeHandlers(handlers);
    this.responses = responses;
    this.params = params;
    this.index = opIndex;
  }

  getResponses(handler: ExpressHandlerFunction): OpenAPIV3.ResponsesObject {
    return mineExpressResponses(handler);
  }

  getParameters(handler: ExpressHandlerFunction): OpenAPIV3.ParameterObject[] {
    return [];
  }

  analyzeHandler(handler: ExpressHandlerFunction): [OpenAPIV3.ResponsesObject, OpenAPIV3.ParameterObject[]] {
    return [this.getResponses(handler), this.getParameters(handler)];
  }

  analyzeHandlers(handlers: ExpressHandlerFunction[]): [OpenAPIV3.ResponsesObject, OpenAPIV3.ParameterObject[]] {
    return handlers
      .map((x) => this.analyzeHandler(x))
      .reduce(
        ([prevResponses, prevParams], [responses, params]) => [
          Object.assign(prevResponses || {}, responses),
          (prevParams || []).concat(params),
        ],
        [{}, []],
      );
  }
}
