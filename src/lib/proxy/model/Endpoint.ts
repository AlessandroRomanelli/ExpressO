#!/usr/local/bin ts-node

import { Method } from './Method';
import { RequestHandler } from 'express';
import { OpenAPIV3 } from 'openapi-types';
import { mineExpressResponses } from '../analyzer';

export class Endpoint {
  readonly method: Method;
  readonly path: string;
  readonly handlers: RequestHandler[];
  readonly responses: OpenAPIV3.ResponsesObject = {};
  readonly params: OpenAPIV3.ParameterObject[] = [];
  readonly index: number;

  constructor(method: Method, path: string, handlers: RequestHandler[], opIndex: number) {
    this.method = method;
    this.path = path;
    this.handlers = handlers;
    const [responses, params] = this.analyzeHandlers(handlers);
    this.responses = responses;
    this.params = params;
    this.index = opIndex;
  }

  getResponses(handler: RequestHandler): OpenAPIV3.ResponsesObject {
    return mineExpressResponses(handler);
  }

  getParameters(handler: RequestHandler): OpenAPIV3.ParameterObject[] {
    return [];
  }

  analyzeHandler(handler: RequestHandler): [OpenAPIV3.ResponsesObject, OpenAPIV3.ParameterObject[]] {
    return [this.getResponses(handler), this.getParameters(handler)];
  }

  analyzeHandlers(handlers: RequestHandler[]): [OpenAPIV3.ResponsesObject, OpenAPIV3.ParameterObject[]] {
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
