import path from 'path';
import util from 'util';
import logger from 'jet-logger';
import { replaceExpress } from '../replacer';
import { exec as syncExec, ExecOptions } from 'child_process';
import { move, readFile, remove, writeFile } from "fs-extra";
import { CLIOptionsGenerate } from "../../cli/types";
import YAML from "json2yaml"

const exec = util.promisify(syncExec);

const cleanUp = async (basePath: string) => {
  try {
    await remove(path.resolve(basePath, '.expresso-runtime'));
    logger.info('Expresso work copy cleaned up');
  } catch (e) {
    logger.err(e);
  }
};

const convertSpecificationToYaml = async (specPath: string): Promise<void> => {
  const { dir, name, ext } = path.parse(specPath)
  if (ext !== '.json') {
    throw new Error(`'${specPath}' was not in the expected format (JSON)`)
  }
  const spec = JSON.parse(await readFile(specPath, 'utf-8'))
  await writeFile(path.resolve(dir, name+".yaml"), YAML.stringify(spec))
}

export const generateSpecification = async ({
    root,
    startLine,
    output,
    extension
  }: CLIOptionsGenerate) => {

  logger.info(`Generating OpenAPI specification for project with root at '${root}'`);
  if (!(await replaceExpress(root))) {
    logger.err('Failed to replace express module');
    return cleanUp(root);
  }
  const replacedProjectPath = path.resolve(root, '.expresso-runtime');

  const execOptions: ExecOptions = {
    cwd: replacedProjectPath,
    timeout: 5000,
  };

  try {
    const { stdout, stderr } = await exec(startLine, execOptions);
    logger.info(`Command '${startLine}' executed. Output:`)
    if (stdout) logger.info(stdout);
    if (stderr) logger.err(stderr);
  } catch (e) {
    logger.err(`Command '${startLine}' failed:`)
    logger.err(e);
  }

  try {
    if (extension === 'yaml') {
      await convertSpecificationToYaml(path.resolve(replacedProjectPath, output+extension))
    }
    await move(path.resolve(replacedProjectPath, output+extension), path.resolve(root, output+extension), {overwrite: true});
  } catch (e) {
    logger.err(e);
  }

  return cleanUp(root);
};
