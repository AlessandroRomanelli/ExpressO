import logger from 'jet-logger';

import path from 'path';
import { readSpecification } from './reader';
import { CoverageReport, HTTPMethod } from './types';
import _ from 'lodash'
import { OpenAPIV3 } from "openapi-types";

const compare = (customSpec: OpenAPIV3.Document, generatedSpec: OpenAPIV3.Document, extractorFn: (x: OpenAPIV3.Document) => string[]): CoverageReport => {
  const [custom, generated] = [customSpec, generatedSpec].map(extractorFn)
  const [missing, matched] = _.partition(custom, x => !generated.includes(x))
  const additional = generated.filter(x => !custom.includes(x))

  return {
    coverage: (custom.length - missing.length) / custom.length,
    additional,
    missing,
    matched
  }
}

const getEndpoints = (x: OpenAPIV3.Document): string[] =>
  Object.keys(x.paths).flatMap((pattern) =>
    Object.keys(x.paths[pattern] || {}).map((method) => `${pattern}#${method}`),
  );

const getResponses = (x: OpenAPIV3.Document): string[] => Object.keys(x.paths).flatMap((pattern) =>
  (Object.keys(x.paths[pattern] || {}) as HTTPMethod[]).flatMap((method) => {
    const patternObj = x.paths[pattern] || {}
    if (!(method in patternObj)) return []
    const methodObj = patternObj[method] as OpenAPIV3.OperationObject
    return Object.keys(methodObj.responses).map((response) => `${pattern}#${method}#${response}`)
  })
);

const getParameters = (x: OpenAPIV3.Document): string[] => Object.keys(x.paths).flatMap((url) =>
  (Object.keys(x.paths[url] || {}) as HTTPMethod[]).flatMap((endpoint) => {
    const patternObj = x.paths[url] || {}
    if (!(endpoint in patternObj)) return []
    const methodObj = patternObj[endpoint] as OpenAPIV3.OperationObject
    if (!('parameters' in methodObj)) return []
    const { parameters } = methodObj
    return (parameters as OpenAPIV3.ParameterObject[])
      .map((parameter) => `${url}#${endpoint}#${parameter.name}`)
  })
);

export const compareSpecifications = async (custom: string, generated: string) => {
  logger.info(`Comparing OpenAPI specifications: ${path.basename(custom)} with ${path.basename(generated)}`);
  const [customSpec, generatedSpec] = await Promise.all([custom, generated].map(readSpecification));

  if (!('paths' in customSpec && 'paths' in generatedSpec)) {
    throw new Error("The 'paths' property is missing from at least one of the two provided specification")
  }

  const comparisons = [getEndpoints, getResponses, getParameters];
  const [endpoints, responses, parameters] = comparisons.map((fn) => compare(customSpec, generatedSpec, fn));

  return {
    endpoints,
    responses,
    parameters,
  };
};
