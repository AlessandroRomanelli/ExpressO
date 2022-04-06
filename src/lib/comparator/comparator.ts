import logger from 'jet-logger';

import path from 'path';
import { readSpecification } from './reader';
import { CoverageReport, HTTPMethod } from './types';
import _ from 'lodash';
import { OpenAPIV3 } from 'openapi-types';

const compare = (
  customSpec: OpenAPIV3.Document,
  generatedSpec: OpenAPIV3.Document,
  extractorFn: (x: OpenAPIV3.Document, basePath: string) => string[],
): CoverageReport => {
  const [custom, generated] = [customSpec, generatedSpec]
    .map(x => [x, getBasepaths(x)] as [OpenAPIV3.Document, string[]])
    .map(([x, basePath]) => extractorFn(x, basePath[0]));
  const [missing, matched] = _.partition(custom, (x) => !generated.includes(x));
  const additional = generated.filter((x) => !custom.includes(x));

  return {
    coverage: ((custom.length - missing.length) / custom.length) || 0,
    additional,
    missing,
    matched,
  };
};

const getBasepaths = (x: OpenAPIV3.Document): string[] | undefined => {
  try {
    return x.servers?.map(x => new URL(x.url).pathname) || ["/"]
  } catch (e) {
    logger.warn("Unable to parse the following server URL: " + x.servers?.map(x => x.url))
  }
  return x.servers?.map(x => path.normalize(x.url))
}

const getEndpoints = (x: OpenAPIV3.Document, basePath = "/"): string[] =>
  Object.keys(x.paths).flatMap((pattern) =>
    Object.keys(x.paths[pattern] || {}).map((method) => `${path.normalize(basePath+pattern)}#${method}`),
  );

const getResponses = (x: OpenAPIV3.Document, basePath = "/"): string[] =>
  Object.keys(x.paths).flatMap((pattern) =>
    (Object.keys(x.paths[pattern] || {}) as HTTPMethod[]).flatMap((method) => {
      const patternObj = x.paths[pattern] || {};
      if (!Object.keys(patternObj).includes(method)) return []
      const methodObj = patternObj[method] as OpenAPIV3.OperationObject;
      return Object.keys(methodObj.responses).map((response) => `${path.normalize(basePath+pattern)}#${method}#${response}`);
    }),
  );

const getParameters = (x: OpenAPIV3.Document, basePath = "/"): string[] =>
  Object.keys(x.paths).flatMap((pattern) =>
    (Object.keys(x.paths[pattern] || {}) as HTTPMethod[]).flatMap((method) => {
      const patternObj = x.paths[pattern] || {};
      if (!Object.keys(patternObj).includes(method)) return []
      const methodObj = patternObj[method] as OpenAPIV3.OperationObject;
      if (!Object.keys(methodObj).includes('parameters')) return []
      const { parameters } = methodObj;
      return (parameters as OpenAPIV3.ParameterObject[]).map((parameter) => `${path.normalize(basePath+pattern)}#${method}#${parameter.name}`);
    }),
  );

export const compareSpecifications = async (custom: string, generated: string) => {
  logger.info(`Comparing OpenAPI specifications: ${path.basename(custom)} with ${path.basename(generated)}`);
  const [customSpec, generatedSpec] = await Promise.all([custom, generated].map(readSpecification));

  [customSpec, generatedSpec].forEach((spec, i) => {
    if (!Object.keys(spec).includes('paths')) throw new Error(`The 'paths' property is missing from this specification: ${i ? generated : custom}`)
  })

  const comparisons = [getEndpoints, getResponses, getParameters];
  const [endpoints, responses, parameters] = comparisons.map((fn) => compare(customSpec, generatedSpec, fn));

  return {
    custom,
    generated,
    endpoints,
    responses,
    parameters,
  };
};
