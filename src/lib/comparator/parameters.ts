import logger from 'jet-logger';

import path from 'path';
import { CoverageReport, HTTPMethod } from "./types";
import _ from "lodash";
import { OpenAPIV3 } from 'openapi-types';
import { HTTP_METHOD } from "../proxy/model";
import { Endpoint } from "./endpoints";
import { getBasepath, pathParamRegex, reinsertParams } from "./comparator";

class Parameter extends Endpoint {
  public parameter: string
  public where: string
  public position: number | undefined

  constructor(p: string, method: HTTP_METHOD, parameter: string, where: string) {
    super(p, method)
    this.parameter = parameter.toLowerCase()
    this.where = where.toLowerCase()
    if (this.where === 'path') {
      this.position = this.pathParams.indexOf(this.parameter)
    }
  }

  private selfMatch = (other: Parameter) => {
    if (this.where === 'path' && other.where === 'path') return this.position === other.position
    return this.parameter === other.parameter && this.where === other.where
  }
  matchParameter = (other: Parameter): boolean => this.match(other) && this.selfMatch(other)
  normalMatchParameter = (other: Parameter): boolean => this.normalMatch(other) && this.selfMatch(other)

  toString = (): string => `${this.path}#${this.method}#${this.parameter}`
}

const getParameters = (x: OpenAPIV3.Document, basePath = '/'): Parameter[] =>
  Object.keys(x.paths).flatMap((pattern) => {
    const patternObj = x.paths[pattern] || {};
    const patternParameters = (patternObj['parameters'] || []) as OpenAPIV3.ParameterObject[]
    return (Object.keys(patternObj) as HTTP_METHOD[])
      .filter(x => x.toUpperCase() in HTTP_METHOD)
      .flatMap((method) => {
        const methodObj = Reflect.get(patternObj, method) as OpenAPIV3.OperationObject;
        const parameters = (methodObj.parameters || []) as OpenAPIV3.ParameterObject[];
        return ([] as OpenAPIV3.ParameterObject[]).concat(patternParameters, parameters).map(
          (parameter) => {
            return new Parameter(path.normalize(basePath + pattern), method, parameter.name, parameter.in)
          },
        );
      })
  });

export const compareParameters = (customSpec: OpenAPIV3.Document, generatedSpec: OpenAPIV3.Document): CoverageReport => {
  const [custom, generated] = [customSpec, generatedSpec]
    .map((x) => [x, getBasepath(x)] as [OpenAPIV3.Document, string])
    .map(([x, basePath]) => getParameters(x, basePath));
  // eslint-disable-next-line prefer-const
  let [missing, matched] = _.partition(custom, (x) =>
    !_.find(generated, (y) => x.matchParameter(y)));
  let additional = generated
    .filter((x) => !_.find(custom, (y) => x.matchParameter(y)));
  const strictMissingCount = missing.length

  const partiallyMatched = missing
    .filter(x => _.find(additional, (y) => x.normalMatchParameter(y)))
    .map(x => {
      const other = _.find(additional, (y) => x.normalMatchParameter(y)) as Parameter
      missing = missing.filter(y => !_.isEqual(x,y))
      additional = additional.filter(y => !_.isEqual(other,y))
      const pathParams = Array.from(Array(x.pathParams.length).keys())
        .map(i => `${x.pathParams[i]}|${other.pathParams[i]}`)
      return new Parameter(reinsertParams(x.normalizedPath, pathParams), x.method, `${x.parameter}|${other.parameter}`, x.where)
    })

  return {
    coverage: (custom.length - missing.length) / custom.length || 0,
    strictCoverage: (custom.length - strictMissingCount) / custom.length || 0,
    originalCount: custom.length,
    additional: additional.map(x => x.toString()),
    missing: missing.map(x => x.toString()),
    matched: matched.map(x => x.toString()),
    partiallyMatched: partiallyMatched.map(x => x.toString())
  };
}
