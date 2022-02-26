import logger from 'jet-logger';

import path from 'path';
import { readSpecification } from './reader';
import { CoverageReport, HTTPMethod, OAPISpecification } from './types';

const compareEndpoints = (customSpec: OAPISpecification, generatedSpec: OAPISpecification): CoverageReport => {
  const [customPaths, generatedPaths] = [customSpec, generatedSpec].map((x) => Object.keys(x['paths']));

  const customEndpoints = customPaths.flatMap((path) =>
    Object.keys(customSpec['paths'][path]).map((endpoint) => `${path}#${endpoint}`),
  );
  const generatedEndpoints = generatedPaths.flatMap((path) =>
    Object.keys(generatedSpec['paths'][path]).map((endpoint) => `${path}#${endpoint}`),
  );

  const missing = customEndpoints.filter((endpoint) => !generatedEndpoints.includes(endpoint));
  const additional = generatedEndpoints.filter((endpoint) => !customEndpoints.includes(endpoint));

  return {
    coverage: (customEndpoints.length - missing.length) / customEndpoints.length,
    additional,
    missing,
  };
};
const compareResponses = (customSpec: OAPISpecification, generatedSpec: OAPISpecification): CoverageReport => {
  const [customPaths, generatedPaths] = [customSpec, generatedSpec].map((x) => Object.keys(x['paths']));

  const customResponses = customPaths.flatMap((path) =>
    (Object.keys(customSpec['paths'][path]) as HTTPMethod[]).flatMap((endpoint) =>
      Object.keys(customSpec['paths'][path][endpoint]['responses']).map(
        (response) => `${path}#${endpoint}#${response}`,
      ),
    ),
  );

  const generatedResponses = generatedPaths.flatMap((path) =>
    (Object.keys(generatedSpec['paths'][path]) as HTTPMethod[]).flatMap((endpoint) =>
      Object.keys(generatedSpec['paths'][path][endpoint]['responses']).map(
        (response) => `${path}#${endpoint}#${response}`,
      ),
    ),
  );

  const missing = customResponses.filter((response) => !generatedResponses.includes(response));
  const additional = generatedResponses.filter((response) => !customResponses.includes(response));

  return {
    coverage: (customResponses.length - missing.length) / customResponses.length,
    missing,
    additional,
  };
};
const compareParameters = (customSpec: OAPISpecification, generatedSpec: OAPISpecification): CoverageReport => {
  const [customPaths, generatedPaths] = [customSpec, generatedSpec].map((x) => Object.keys(x['paths']));
  const customParameters = customPaths.flatMap((path) =>
    (Object.keys(customSpec['paths'][path]) as HTTPMethod[]).flatMap((endpoint) =>
      'parameters' in customSpec['paths'][path][endpoint]
        ? Object.keys(customSpec['paths'][path][endpoint]['parameters']).map(
            (parameter) => `${path}#${endpoint}#${customSpec['paths'][path][endpoint]['parameters'][parameter].name}`,
          )
        : [],
    ),
  );

  const generatedParameters = generatedPaths.flatMap((path) =>
    (Object.keys(generatedSpec['paths'][path]) as HTTPMethod[]).flatMap((endpoint) =>
      'parameters' in generatedSpec['paths'][path][endpoint]
        ? Object.keys(generatedSpec['paths'][path][endpoint]['parameters']).map(
            (parameter) =>
              `${path}#${endpoint}#${generatedSpec['paths'][path][endpoint]['parameters'][parameter].name}`,
          )
        : [],
    ),
  );

  const missing = customParameters.filter((parameter) => !generatedParameters.includes(parameter));
  const additional = generatedParameters.filter((parameter) => !customParameters.includes(parameter));

  return {
    coverage: (customParameters.length - missing.length) / customParameters.length,
    missing,
    additional,
  };
};

export const compare = (custom: string, generated: string) => {
  logger.info(`Comparing OpenAPI specification: ${path.basename(custom)} with ${path.basename(generated)}`);
  const [customSpec, generatedSpec] = [custom, generated].map((x) => readSpecification(x));

  // Check that OpenAPI specification has 'paths' field
  [
    [custom, customSpec],
    [generated, generatedSpec],
  ]
    .filter(([_, spec]) => !('paths' in (spec as OAPISpecification)))
    .forEach(([specPath]) => {
      throw new Error(`The following specification did not have a 'paths' field: ${path.basename(specPath as string)}`);
    });

  const comparisons = [compareEndpoints, compareResponses, compareParameters];

  const [endpoints, responses, parameters] = comparisons.map((fn) => fn(customSpec, generatedSpec));

  return {
    endpoints,
    responses,
    parameters,
  };
};
