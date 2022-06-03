import logger from 'jet-logger';

import path from 'path';
import { CoverageReport } from './types';
import _ from 'lodash';
import { OpenAPIV3 } from 'openapi-types';
import { HTTP_METHOD } from '../proxy/model';
import { getBasepath, pathParamRegex, reinsertParams } from './comparator';

export class Endpoint {
  public path: string;
  public method: HTTP_METHOD;
  public normalizedPath: string;
  public pathParams: string[];

  constructor(p: string, method: HTTP_METHOD) {
    this.path = p.toLowerCase();
    this.method = method.toLowerCase() as HTTP_METHOD;
    this.normalizedPath = anonymizePath(this.path);
    this.pathParams = extractParams(this.path);
  }

  match = (other: Endpoint): boolean => this.path === other.path && this.method === other.method;
  normalMatch = (other: Endpoint): boolean =>
    this.normalizedPath === other.normalizedPath && this.method === other.method;
  toString = (): string => `${this.path}#${this.method}`;
}

const extractParams = (x: string): string[] => x.match(pathParamRegex) || [];
const anonymizePath = (x: string): string => x.replace(pathParamRegex, '');

const getEndpoints = (x: OpenAPIV3.Document, basePath = '/'): Endpoint[] =>
  Object.keys(x.paths).flatMap((pattern) =>
    (Object.keys(x.paths[pattern] || {}) as HTTP_METHOD[])
      .filter((x) => x.toUpperCase() in HTTP_METHOD)
      .map((method) => new Endpoint(path.normalize(basePath + pattern), method)),
  );

export const compareEndpoints = (customSpec: OpenAPIV3.Document, generatedSpec: OpenAPIV3.Document): CoverageReport => {
  const [custom, generated] = [customSpec, generatedSpec]
    .map((x) => [x, getBasepath(x)] as [OpenAPIV3.Document, string])
    .map(([x, basePath]) => getEndpoints(x, basePath));
  // eslint-disable-next-line prefer-const
  let [missing, matched] = _.partition(custom, (x) => !_.find(generated, (y) => x.match(y)));
  let additional = generated.filter((x) => !_.find(custom, (y) => x.match(y)));
  const strictMissingCount = missing.length;

  const partiallyMatched = missing
    .filter((x) => _.find(additional, (y) => x.normalMatch(y)))
    .map((x) => {
      const other = _.find(additional, (y) => x.normalMatch(y)) as Endpoint;
      missing = missing.filter((y) => !_.isEqual(x, y));
      additional = additional.filter((y) => !_.isEqual(other, y));
      const pathParams = Array.from(Array(x.pathParams.length).keys()).map(
        (i) => `${x.pathParams[i]}|${other.pathParams[i]}`,
      );
      return new Endpoint(reinsertParams(x.normalizedPath, pathParams), x.method);
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
