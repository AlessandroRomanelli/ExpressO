import path from "path"
import util from "util"
import logger from "jet-logger";
import { replaceExpress } from "../replacer";
import { exec as syncExec, ExecOptions } from "child_process";
import fs from "fs-extra"

const exec = util.promisify(syncExec)

export const generateSpecification = async (rootDirPath: string)  => {
  logger.info(`Generating OpenAPI specification for project with root at '${rootDirPath}'`)
  if (!await replaceExpress(rootDirPath)) {
    return logger.err("Failed to replace express module")
  }
  const replacedProjectPath = path.resolve(rootDirPath, "../.expresso-runtime")

  const execOptions: ExecOptions = {
    cwd: rootDirPath,
    timeout: 5000
  }

  try {
    const pkg = JSON.parse(await fs.readFile(path.resolve(replacedProjectPath, "package.json"), 'utf-8'))
    if (pkg.scripts.build) {
      await exec(pkg.scripts.build, execOptions)
    }
    await exec(pkg.scripts.start, execOptions)
  } catch (e) {
    logger.err(e)
  }
}