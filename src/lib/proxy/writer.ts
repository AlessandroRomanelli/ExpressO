import path from 'path';
import { Endpoint, Handler, Method } from "./model";
import { readFile, writeFile } from 'fs-extra';
import { OpenAPIV3 } from 'openapi-types';
import { StatusCodes } from 'http-status-codes';
import logger from 'jet-logger';

const endpointToSpecification = (endpoint: Endpoint): OpenAPIV3.OperationObject => {
  return {
    responses: endpoint.responses,
  }
}

const handlerToSpecification = (handler: Handler): OpenAPIV3.PathsObject => {
  const endpoints = handler.getEndpoints();
  return Object.keys(endpoints)
    .map((pattern) => {
      const methods: Method[] = Object.keys(endpoints[pattern]) as Method[];
      const patternMethods = methods
        .map(
          (method) =>
            [
              method,
              endpointToSpecification(endpoints[pattern][method]),
            ] as [Method, OpenAPIV3.OperationObject],
        )
        .reduce((prev, [key, value]) => Object.assign(prev, { [key]: value }), {});
      return [pattern, patternMethods] as [string, { [k: string]: { responses: StatusCodes[] } }];
    })
    .reduce((prev, [key, value]) => Object.assign(prev, { [key]: value }), {});
};

const modelsToSpecification = async (projectRoot: string, models: Set<Handler>): Promise<OpenAPIV3.Document> => {
  let pkg;
  try {
    pkg = JSON.parse(await readFile(path.resolve(projectRoot, 'package.json'), 'utf-8'));
  } catch (e) {
    logger.warn("Could not read from project's package.json");
  }

  const paths = (await Promise.all(Array.from(models).map(async (x) => await handlerToSpecification(x)))).reduce(
    (curr, prev) => Object.assign(curr, prev),
    {},
  );

  return {
    info: {
      title: pkg.name || '',
      version: pkg.version || '0.0.0',
    },
    paths,
    openapi: '3.0.0',
  };
};

export const writeSpecification = async (projectRoot = '.', models: Set<Handler>): Promise<void> => {
  const spec = await modelsToSpecification(projectRoot, models);
  const filePath = path.resolve(projectRoot, 'openapi.json');
  await writeFile(filePath, JSON.stringify(spec, null, 4));
  logger.info(`OpenAPI specification successfully generated at '${filePath}'`);
  logger.info('Aborting process...');
  process.exit();
};
