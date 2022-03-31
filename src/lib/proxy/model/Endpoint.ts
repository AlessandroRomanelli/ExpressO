#!/usr/local/bin ts-node

import { Method } from './Method';
import { OpenAPIV3 } from 'openapi-types';
import { mineExpressResponses } from '../analyzer';

export interface EndpointJSON {
  method: Method;
  path: string;
  handlers: string[];
  index: number;
}

export class Endpoint {
  readonly method: Method;
  readonly path: string;
  readonly handlers: string[];
  responses: OpenAPIV3.ResponsesObject = {};
  params: OpenAPIV3.ParameterObject[] = [];
  readonly index: number;

  constructor(method: Method, path: string, handlers: string[], opIndex: number) {
    this.method = method;
    this.path = path;
    this.handlers = handlers;
    this.index = opIndex;
  }

  getResponses(handler: string): OpenAPIV3.ResponsesObject {
    return mineExpressResponses(handler);
  }

  getParameters(handler: string): OpenAPIV3.ParameterObject[] {
    return [];
  }

  analyzeHandler(handler: string): [OpenAPIV3.ResponsesObject, OpenAPIV3.ParameterObject[]] {
    console.log(handler, this.getResponses(handler))
    return [this.getResponses(handler), this.getParameters(handler)];
  }

  analyzeHandlers() {
    const [responses, params] =  this.handlers
      .map((x) => this.analyzeHandler(x))
      .reduce(
        ([prevResponses, prevParams], [responses, params]) => [
          Object.assign(prevResponses || {}, responses),
          (prevParams || []).concat(params),
        ],
        [{}, []],
      );
    this.responses = responses
    this.params = params
  }

  static fromJSON(obj: EndpointJSON): Endpoint {
    const endpoint =  new Endpoint(obj.method, obj.path, obj.handlers, obj.index)
    endpoint.analyzeHandlers()
    return endpoint
  }
}
