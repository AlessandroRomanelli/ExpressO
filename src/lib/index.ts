import { CLIOptions, CLIOptionsCompare } from '../cli/types';
import { compareSpecifications, generateReport } from './tester';

const expressoCompare = async (options: CLIOptionsCompare): Promise<void> => {
  const results = await compareSpecifications(options.fileA, options.fileB);
  if (options.json) {
    // tslint:disable-next-line:no-console
    return console.log(results);
  }
  // tslint:disable-next-line:no-console
  return console.log(generateReport(results));
};

export const expresso = async (options: CLIOptions): Promise<void> => {
  switch (options.command) {
    case 'compare':
      return expressoCompare(options.subOptions as CLIOptionsCompare);
    case 'generate':
      break;
    case 'monitor':
      break;
    case 'test':
      break;
  }
};
