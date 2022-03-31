import path from 'path';
import util from 'util';
import logger from 'jet-logger';
import { replaceExpress } from '../replacer';
import { exec as syncExec, ExecOptions } from 'child_process';
import { move, readFile, readJSON, remove, writeFile } from 'fs-extra';
import { CLIOptionsGenerate } from '../../cli/types';
import YAML from 'json2yaml';
import { Handler, HandlerJSON } from '../proxy/model';
import { writeSpecification } from '../proxy/writer';
import waitOn from 'wait-on';

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
  const spec = JSON.parse(await readFile(path.resolve(specPath, 'expresso-openapi.json'), 'utf-8'));
  await writeFile(path.resolve(specPath, 'expresso-openapi.yaml'), YAML.stringify(spec));
};

export const generateSpecification = async ({ root, startLine, output, extension }: CLIOptionsGenerate) => {
  logger.info(`Generating OpenAPI specification for project with root at '${root}'`);
  // Replace the 'express' module with our own proxy
  if (!(await replaceExpress(root))) {
    logger.err('Failed to replace express module');
    return cleanUp(root);
  }
  const replacedProjectPath = path.resolve(root, '.expresso-runtime');

  const execOptions: ExecOptions = {
    cwd: replacedProjectPath,
    timeout: 10000,
  };

  // Launch the work copy with the replaced modules
  logger.info('Starting work copy...');
  try {
    const { stdout, stderr } = await exec(startLine, execOptions);
    logger.info(`Command '${startLine}' executed. Output:`);
    if (stdout) logger.info(stdout);
    if (stderr) logger.warn(stderr);
  } catch (e) {
    logger.info(`Command '${startLine}' executed. Output:`);
    logger.warn(e);
  }

  try {
    await waitOn({
      resources: [path.resolve(root, 'expresso-models.json')],
      timeout: 10000,
    });
  } catch (e) {
    logger.err(e);
    return cleanUp(root);
  }

  // Read the models file and perform the analysis
  try {
    const models = new Set(
      ((await readJSON(path.resolve(root, 'expresso-models.json'), 'utf-8')) as HandlerJSON[]).map((x) =>
        Handler.fromJSON(x),
      ),
    );
    await remove(path.resolve(root, 'expresso-models.json'));
    await writeSpecification(replacedProjectPath, models);
  } catch (e) {
    logger.err('Unable to read the models extracted from the work copy. Aborting...');
    logger.err(e);
    logger.err(e.stack);
    return cleanUp(root);
  }

  // Convert to YAML if requested
  try {
    if (extension === 'yaml') {
      await convertSpecificationToYaml(replacedProjectPath);
    }
    const srcName = 'expresso-openapi.' + extension;
    const destName = output + '.' + extension;
    // Move the output file to the target directory
    await move(path.resolve(replacedProjectPath, srcName), path.resolve(root, destName), {
      overwrite: true,
    });
  } catch (e) {
    logger.err(e);
  }

  return cleanUp(root);
};
