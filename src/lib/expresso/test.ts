import { CLIOptionsTest } from '../../cli/types';
import { compareSpecifications, generateReport } from '../comparator';
import { generateSpecification } from '../generator';
import { table } from 'table';
import { remove } from 'fs-extra';
import path from 'path';

export const expressoTest = async (options: CLIOptionsTest): Promise<void> => {
  const tableOptions = {
    singleLine: true,
    drawHorizontalLine: () => false,
    drawVerticalLine: () => false,
  };

  if (options.help)
    return console.log(
      `Usage: expresso test <test_spec> [--json]

This command compare a user-provided specification with the generated one, outputting a report of how much the generated OAPI specification covers what is specified in the user one.

Available options:
${table([['-J', '--json', 'Switches output from human-readable to JSON format']], tableOptions)}`,
    );

  await generateSpecification(options);

  const results = await compareSpecifications(options.fileA, `./${options.output}.${options.extension}`);
  await remove(path.resolve(options.root, `./${options.output}.${options.extension}`));
  if (options.json) {
    return console.log(results);
  }
  return console.log(generateReport(results));
};
