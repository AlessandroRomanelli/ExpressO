import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs';

import { OAPISpecification } from './types';
import logger from 'jet-logger';

type FilePath = string;
const readSpecificationYAML = (filePath: FilePath) => yaml.load(fs.readFileSync(filePath, 'utf8')) as OAPISpecification;
const readSpecificationJSON = (filePath: FilePath) =>
  JSON.parse(fs.readFileSync(filePath, 'utf8')) as OAPISpecification;

const isFilePath = (filePath: string): filePath is FilePath => {
  try {
    return fs.lstatSync(filePath).isFile();
  } catch (e) {
    logger.err(e);
  }
  return false;
};

export const readSpecification = (filePath: FilePath) => {
  if (!isFilePath(filePath)) {
    throw new Error(`Invalid path specified`);
  }
  switch (path.extname(filePath)) {
    case '.yaml':
      return readSpecificationYAML(filePath);
    case '.json':
      return readSpecificationJSON(filePath);
    default:
      throw new Error('Unsupported OpenAPI specification extension');
  }
};
