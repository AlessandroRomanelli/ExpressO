import path from "path"
import fs from "fs-extra"
import logger from "jet-logger";
import filesize from "filesize"
import {  replaceInFile } from "replace-in-file"

export const replaceExpress = async (basePath: string): Promise<boolean> => {
  logger.info(`Replacing 'express' with 'expresso-api' within '${basePath}'`)
  const ignoreRules: Set<string> = new Set(["**/node_modules/**"])
  try {
    const gitignore = await fs.readFile(path.resolve(basePath, ".gitignore"), 'utf-8')
    gitignore.split('\n').map(x => x.trim()).forEach(ignoreRules.add)
  } catch (e) {
    logger.warn("Could not find .gitignore file")
  }

  try {
    await fs.remove(path.resolve(basePath, "../.expresso-runtime"))
    logger.info("Removed previously existing working copy")
  } catch (e) {
    logger.err(e)
  }

  try {
    const { size, isDirectory } = await fs.stat(basePath)
    if (!isDirectory) {
      logger.err("Provided path pointed to a file and not a directory")
      return false
    }
    logger.info(`Creating work copy for ${basePath} (${filesize(size)})`)
    await fs.copy(basePath, path.resolve(basePath, "../.expresso-runtime"))
    logger.info(`Created folder '.expresso-runtime' work copy`)
  } catch (e) {
    logger.err(e)
    logger.err(`Failed to duplicate folder '${basePath}'`)
    return false
  }

  try {
    const baseFilePath = path.resolve(basePath, '../.expresso-runtime/**/')
    const replacerConfig = ((pattern: string) => ({
      files: path.resolve(baseFilePath, pattern),
      from: /("express"|'express')/g,
      to: '"expresso-api"',
      ignore: Array.from(ignoreRules)
    }));
    for (const pattern of ['*.js', '*.ts']) {
      try {
        await replaceInFile(replacerConfig(pattern))
      } catch (e) {
        logger.warn(e)
      }
    }
  } catch (e) {
    logger.err(e)
    return false
  }
  logger.info("Successfully replaced 'express' package with 'expresso-api'")
  return true
}