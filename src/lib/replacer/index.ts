import path from 'path';
import { stat, move, copy, remove, readFile } from 'fs-extra';
import logger from 'jet-logger';
import filesize from 'filesize';

/**
 * Function to create a working copy of the project at basePath substituting express
 * with the express-api module. The folder is first duplicated and then placed within
 * the original folder, then expresso-api module is copied within the work copy as
 * 'express' to replace it.
 * @param basePath
 */
export const replaceExpress = async (basePath: string): Promise<boolean> => {
  logger.info(`Replacing 'express' with 'expresso-api' within '${basePath}'`);

  // Check that basePath points to a directory
  try {
    const { isDirectory } = await stat(basePath);
    if (!isDirectory) {
      logger.err('Provided path did not point to a directory');
      return false;
    }
  } catch (e) {
    return false;
  }

  // Remove a previously existing work copy within the provided folder
  try {
    await remove(path.resolve(basePath, '.expresso-runtime'));
    logger.info('Removed previously existing working copy');
  } catch (e) {
    logger.err(e);
  }

  // Ensure that expresso-api is installed locally
  try {
    const pkg = JSON.parse(await readFile(path.resolve(basePath, 'package.json'), 'utf-8'));
    if (!Object.keys(pkg.dependencies).includes('expresso-api')) {
      logger.err(
        "'expresso-api' is not present in the package.json, please install the package locally with:\n'npm install expresso-api'",
      );
      return false;
    }
  } catch (e) {
    logger.err(`Could not find package.json file within '${basePath}'`);
    return false;
  }

  try {
    const { size } = await stat(basePath);
    logger.info(`Creating work copy for ${basePath} (${filesize(size)})`);
    // Copy all the contents of the provided directory into work copy directory
    // Ensuring node_modules folder contents are not copied
    await copy(basePath, path.resolve(basePath, '../.expresso-runtime'), {
      recursive: true,
      filter: (src) => !src.includes('node_modules'),
    });
    // Move it within the original folder
    await move(path.resolve(basePath, '../.expresso-runtime'), path.resolve(basePath, '.expresso-runtime'));
    logger.info(`Created folder '.expresso-runtime' work copy`);
    // Install the 'expresso-api' as 'express' within the work copy
    await copy(
      path.resolve(basePath, 'node_modules/expresso-api'),
      path.resolve(basePath, '.expresso-runtime/node_modules/express'),
      {
        recursive: true,
      },
    );
    logger.info(`Created 'express' proxy within work copy`);
  } catch (e) {
    logger.err(e);
    logger.err(`Failed to replace 'express' in folder '${path.resolve(basePath, '.expresso-runtime')}'`);
    return false;
  }

  logger.info("Successfully replaced 'express' package with 'expresso-api'");
  return true;
};
