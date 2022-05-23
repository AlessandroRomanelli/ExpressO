import { CLIOptionsCompare } from '../../cli/types';
import { compareSpecifications, generateReport } from '../comparator';
import { table } from 'table';

export const expressoCompare = async (options: CLIOptionsCompare): Promise<void> => {
  const tableOptions = {
    singleLine: true,
    drawHorizontalLine: () => false,
    drawVerticalLine: () => false,
  };

  if (options.help)
    return console.log(
      `Usage: expresso compare <fileA>:<fileB> [--json]

This command compare two user-provided specifications and generates a report of how much the OAPI specification of fileB covers what is specified in fileA.

Available options:
${table([['-J', '--json', 'Switches output from human-readable to JSON format']], tableOptions)}`,
    );
  const results = await compareSpecifications(options.fileA, options.fileB);
  if (options.json) {
    return console.log(JSON.stringify(results, null, 2));
  }
  return console.log(generateReport(results));
};
