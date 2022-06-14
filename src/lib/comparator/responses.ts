import logger from '../../logger';

import path from 'path';
import { CoverageReport, HTTPMethod } from './types';
import _ from 'lodash';
import { OpenAPIV3 } from 'openapi-types';
import { HTTP_METHOD } from '../proxy/model';
import { Endpoint } from './endpoints';
import { getBasepath, reinsertParams } from './comparator';

class Response extends Endpoint {
  public response: string;

  constructor(p: string, method: HTTP_METHOD, response: string) {
    super(p, method);
    this.response = response.toUpperCase();
  }

  private selfMatch = (other: Response) => this.response === other.response;
  matchResponse = (other: Response): boolean => this.match(other) && this.selfMatch(other);
  normalMatchResponse = (other: Response): boolean => this.normalMatch(other) && this.selfMatch(other);

  toString = (): string => `${this.path}#${this.method}#${this.response}`;
}

const getResponses = (x: OpenAPIV3.Document, basePath = '/'): Response[] =>
  Object.keys(x.paths).flatMap((pattern) =>
    (Object.keys(x.paths[pattern] || {}) as HTTP_METHOD[])
      .filter((x) => x.toUpperCase() in HTTP_METHOD)
      .flatMap((method) => {
        const patternObj = x.paths[pattern] || {};
        if (!Object.keys(patternObj).includes(method)) return [];
        const methodObj = Reflect.get(patternObj, method) as OpenAPIV3.OperationObject;
        return Object.keys(methodObj.responses || {}).map(
          (response) => new Response(path.normalize(basePath + pattern), method, response),
        );
      }),
  );

export const compareResponses = (customSpec: OpenAPIV3.Document, generatedSpec: OpenAPIV3.Document): CoverageReport => {
  const [custom, generated] = [customSpec, generatedSpec]
    .map((x) => [x, getBasepath(x)] as [OpenAPIV3.Document, string])
    .map(([x, basePath]) => getResponses(x, basePath));
  // eslint-disable-next-line prefer-const
  let [missing, matched] = _.partition(custom, (x) => !_.find(generated, (y) => x.matchResponse(y)));
  let additional = generated.filter((x) => !_.find(custom, (y) => x.matchResponse(y)));
  const strictMissingCount = missing.length;

  const partiallyMatched = missing
    .filter((x) => _.find(additional, (y) => x.normalMatchResponse(y)))
    .map((x) => {
      const other = _.find(additional, (y) => x.normalMatchResponse(y)) as Response;
      missing = missing.filter((y) => !_.isEqual(x, y));
      additional = additional.filter((y) => !_.isEqual(other, y));
      const pathParams = Array.from(Array(x.pathParams.length).keys()).map(
        (i) => `${x.pathParams[i]}|${other.pathParams[i]}`,
      );
      return new Response(reinsertParams(x.normalizedPath, pathParams), x.method, x.response);
    });

  return {
    coverage: (custom.length - missing.length) / custom.length || 0,
    strictCoverage: (custom.length - strictMissingCount) / custom.length || 0,
    originalCount: custom.length,
    additional: additional.map((x) => x.toString()),
    missing: missing.map((x) => x.toString()),
    matched: matched.map((x) => x.toString()),
    partiallyMatched: partiallyMatched.map((x) => x.toString()),
  };
};
