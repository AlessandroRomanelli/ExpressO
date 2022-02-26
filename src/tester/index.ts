import logger from 'jet-logger';

import path from 'path';
import { readSpecification } from './reader';
import { CoverageReport, HTTPMethod, OAPISpecification } from './types';

const compareEndpoints = (customSpec: OAPISpecification, generatedSpec: OAPISpecification): CoverageReport => {
  const [customPaths, generatedPaths] = [customSpec, generatedSpec].map((x) => Object.keys(x.paths));

  const customEndpoints = customPaths.flatMap((url) =>
    Object.keys(customSpec.paths[url]).map((endpoint) => `${url}#${endpoint}`),
  );
  const generatedEndpoints = generatedPaths.flatMap((url) =>
    Object.keys(generatedSpec.paths[url]).map((endpoint) => `${url}#${endpoint}`),
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
  const [customPaths, generatedPaths] = [customSpec, generatedSpec].map((x) => Object.keys(x.paths));

  const customResponses = customPaths.flatMap((url) =>
    (Object.keys(customSpec.paths[url]) as HTTPMethod[]).flatMap((endpoint) =>
      Object.keys(customSpec.paths[url][endpoint].responses).map(
        (response) => `${url}#${endpoint}#${response}`,
      ),
    ),
  );

  const generatedResponses = generatedPaths.flatMap((url) =>
    (Object.keys(generatedSpec.paths[url]) as HTTPMethod[]).flatMap((endpoint) =>
      Object.keys(generatedSpec.paths[url][endpoint].responses).map(
        (response) => `${url}#${endpoint}#${response}`,
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
  const [customPaths, generatedPaths] = [customSpec, generatedSpec].map((x) => Object.keys(x.paths));
  const customParameters = customPaths.flatMap((url) =>
    (Object.keys(customSpec.paths[url]) as HTTPMethod[]).flatMap((endpoint) =>
      'parameters' in customSpec.paths[url][endpoint]
        ? Object.keys(customSpec.paths[url][endpoint].parameters).map(
            (parameter) => `${url}#${endpoint}#${customSpec.paths[url][endpoint].parameters[parameter].name}`,
          )
        : [],
    ),
  );

  const generatedParameters = generatedPaths.flatMap((url) =>
    (Object.keys(generatedSpec.paths[url]) as HTTPMethod[]).flatMap((endpoint) =>
      'parameters' in generatedSpec.paths[url][endpoint]
        ? Object.keys(generatedSpec.paths[url][endpoint].parameters).map(
            (parameter) =>
              `${url}#${endpoint}#${generatedSpec.paths[url][endpoint].parameters[parameter].name}`,
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
