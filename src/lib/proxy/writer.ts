import path from 'path';
import { Endpoint, Handler, HTTP_METHOD } from './model';
import { readFile, writeJSON } from 'fs-extra';
import { OpenAPIV3 } from 'openapi-types';
import { StatusCodes } from 'http-status-codes';
import logger from '../../logger';
import _ from 'lodash';
import fs from 'fs';

const endpointToSpecification = (endpoint: Endpoint): OpenAPIV3.OperationObject => {
  return {
    responses: endpoint.responses,
    parameters: endpoint.params,
  };
};

const patternToSpecification = (pattern: string): string => {
  return pattern.replace(/(?<=\/):(\w+)/g, '{$1}');
};

const handlerToSpecification = (handler: Handler): OpenAPIV3.PathsObject => {
  const endpoints = handler.getEndpoints();
  const methodToSpecification = (pattern: string, method: HTTP_METHOD): [string, OpenAPIV3.OperationObject][] => {
    const endpointSpec = endpointToSpecification(endpoints[pattern][method]);
    if (method === 'all') {
      return Object.values(HTTP_METHOD)
        .filter((x) => x !== 'all')
        .map((x) => [x, endpointSpec]);
    }
    return [[method, endpointSpec]];
  };

  return Object.keys(endpoints)
    .map((pattern) => {
      const methods = Object.keys(endpoints[pattern]) as HTTP_METHOD[];
      const patternMethods = _.chunk(
        _.flatMapDeep(methods, (method) => methodToSpecification(pattern, method)),
        2,
      );
      return [pattern, Object.fromEntries(patternMethods)] as [string, { [k: string]: { responses: StatusCodes[] } }];
    })
    .reduce((prev, [key, value]) => Object.assign(prev, { [key]: value }), {});
};

const modelsToSpecification = async (projectRoot: string, models: Set<Handler>): Promise<OpenAPIV3.Document> => {
  let pkg;
  try {
    pkg = JSON.parse(await readFile(path.resolve(projectRoot, 'package.json'), 'utf-8'));
  } catch (e) {
    logger(true).warn("Could not read from project's package.json");
  }

  const paths: OpenAPIV3.PathsObject = (await Promise.all(Array.from(models).map(handlerToSpecification))).reduce(
    (curr, prev) => Object.assign(curr, prev),
    {},
  );

  return {
    openapi: '3.0.3',
    info: {
      title: pkg.name || '',
      version: pkg.version || '0.0.0',
    },
    paths: Object.fromEntries(Object.entries(paths).map(([k, v]) => [patternToSpecification(k), v])),
  };
};

const correctSpec = (spec: OpenAPIV3.Document): OpenAPIV3.Document => {
  for (const path of Object.keys(spec.paths)) {
    const p_obj = spec['paths'][path] as OpenAPIV3.PathItemObject;
    for (const method of Object.keys(p_obj || {})) {
      const m_obj = Reflect.get(p_obj, method) as OpenAPIV3.OperationObject;
      if (Object.keys(m_obj.responses || {}).length === 0) {
        m_obj.responses['501'] = {
          description: 'Not Implemented',
        };
      }
    }
  }
  return spec;
};

export const writeSpecification = async (projectRoot = '.', models: Set<Handler>): Promise<void> => {
  const spec = correctSpec(await modelsToSpecification(projectRoot, models));
  const filePath = path.resolve(projectRoot, 'expresso-openapi.json');
  await writeJSON(filePath, spec, {
    spaces: 4,
  });
  logger(true).info(`OpenAPI specification successfully generated at '${filePath}'`);
};

export const writeModels = async (models: Set<Handler>): Promise<void> => {
  try {
    await writeJSON(path.resolve(process.cwd(), '..', 'expresso-models.json'), Array.from(models));
    process.exit(0);
  } catch (e) {
    console.error(e);
  }
};
