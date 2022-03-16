import path from 'path';
import util from 'util';
import logger from 'jet-logger';
import { replaceExpress } from '../replacer';
import { exec as syncExec, ExecOptions } from 'child_process';
import { move, remove } from 'fs-extra';

const exec = util.promisify(syncExec);

const cleanUp = async (basePath: string) => {
  try {
    await remove(path.resolve(basePath, '.expresso-runtime'));
    logger.info('Expresso work copy cleaned up');
  } catch (e) {
    logger.err(e);
  }
}

export const generateSpecification = async (rootDirPath: string, startLine: string) => {
  logger.info(`Generating OpenAPI specification for project with root at '${rootDirPath}'`);
  if (!(await replaceExpress(rootDirPath))) {
    logger.err('Failed to replace express module');
    return cleanUp(rootDirPath)
  }
  const replacedProjectPath = path.resolve(rootDirPath, '.expresso-runtime');

  const execOptions: ExecOptions = {
    cwd: replacedProjectPath,
    timeout: 5000,
  };

  try {
    const { stdout, stderr } = await exec(startLine, execOptions);
    if (stdout) logger.info(stdout);
    if (stderr) logger.err(stderr);
  } catch (e) {
    logger.err(e);
  }

  try {
    await move(path.resolve(replacedProjectPath, 'openapi.json'), path.resolve(rootDirPath, 'openapi.json'));
  } catch (e) {
    logger.err(e);
  }

  return cleanUp(rootDirPath)
};
