import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import converter from 'swagger2openapi';

import logger from 'jet-logger';

export const readSpecification = async (filePath: string): Promise<OpenAPIV3.Document> => {
  logger.info('Reading specification: ' + filePath);
  await SwaggerParser.validate(filePath);
  const specification = await converter.convertFile(filePath, {
    patch: true,
    warnOnly: true,
  });
  return (await SwaggerParser.validate(specification.openapi)) as OpenAPIV3.Document;
};
