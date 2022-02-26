import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs';

import { OAPISpecification } from './types';
import logger from 'jet-logger';

type FilePath = string;
const readSpecificationYAML = (path: FilePath) => yaml.load(fs.readFileSync(path, 'utf8')) as OAPISpecification;
const readSpecificationJSON = (path: FilePath) => JSON.parse(fs.readFileSync(path, 'utf8')) as OAPISpecification;

const isFilePath = (path: string): path is FilePath => {
  try {
    return fs.lstatSync(path).isFile();
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
