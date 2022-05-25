import logger from 'jet-logger';

import path from 'path';
import { readSpecification } from './reader';
import { CoverageReport } from './types';
import { OpenAPIV3 } from 'openapi-types';
import { compareEndpoints } from "./endpoints";
import { compareResponses } from "./responses";
import { compareParameters } from "./parameters";

export const pathParamRegex = /(?<={)(\w+(\|\w+)*)+(?=})/g

export const reinsertParams = (p: string, params: string[]): string => {
  for (const param of params) {
    p = p.replace(/{}/, `{${param}}`)
  }
  return p
}

export const getBasepath = (x: OpenAPIV3.Document) => {
  try {
    return x.servers?.map((x) => new URL(x.url).pathname)[0] || '/';
  } catch (e) {
    logger.warn('Unable to parse the following server URL: ' + x.servers?.map((x) => x.url));
  }
  return x.servers?.map((x) => path.normalize(x.url))[0] || '/';
};

export const compareSpecifications = async (custom: string, generated: string) => {
  logger.info(`Comparing OpenAPI specifications: ${path.basename(custom)} with ${path.basename(generated)}`);
  const [customSpec, generatedSpec] = await Promise.all([custom, generated].map(readSpecification));

  [customSpec, generatedSpec].forEach((spec, i) => {
    if (!Object.keys(spec).includes('paths'))
      throw new Error(`The 'paths' property is missing from this specification: ${i ? generated : custom}`);
  });

  const comparisons = [compareEndpoints, compareResponses, compareParameters];
  const [endpoints, responses, parameters]: CoverageReport[] = comparisons.map((fn) => fn(customSpec, generatedSpec));

  return {
    custom,
    generated,
    endpoints,
    responses,
    parameters,
  };
};
