import path from 'path';
import { stat, move, copy, remove, readFile } from 'fs-extra';
import logger from 'jet-logger';
import filesize from 'filesize';
import { exec as syncExec } from 'child_process';
import util from "util";

const exec = util.promisify(syncExec);


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

  try {
    const { size } = await stat(basePath);
    logger.info(`Creating work copy for ${basePath} (${filesize(size)})`);
    // Copy all the contents of the provided directory into work copy directory
    // Ensuring node_modules folder contents are not copied
    await copy(basePath, path.resolve(basePath, '../.expresso-runtime'), {
      recursive: true,
      filter: (src) => !src.includes('node_modules'),
      overwrite: true,
    });
    // Move it within the original folder
    await move(path.resolve(basePath, '../.expresso-runtime'), path.resolve(basePath, '.expresso-runtime'));
    logger.info(`Created folder '.expresso-runtime' work copy`);

    const { stdout } = await exec("npm list -g | head -1")
    const npmLibFolder = stdout.trim()

    // Install the global 'expresso-api' as local 'express' within the work copy
    await copy(
      path.resolve(npmLibFolder, 'node_modules/expresso-api'),
      path.resolve(basePath, '.expresso-runtime/node_modules/express'),
      {
        recursive: true,
        overwrite: true
      }
    )

    try {
      // Install the 'express' types within as types for 'expresso-api'
      await copy(
        path.resolve(basePath, 'node_modules/@types/express/index.d.ts'),
        path.resolve(basePath, '.expresso-runtime/node_modules/express/dist/lib/index.d.ts'),
        {
          overwrite: true,
        },
      );
    } catch (e) {
      logger.warn("Could not find any 'express' types installed")
    }

    // Install the real 'express' within the work copy with a different name to avoid conflicts
    await copy(
      path.resolve(basePath, 'node_modules/express'),
      path.resolve(basePath, '.expresso-runtime/node_modules/express-original'),
      {
        recursive: true,
        overwrite: true
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
