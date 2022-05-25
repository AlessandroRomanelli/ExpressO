import { CLIOptions, CLIOptionsCompare, CLIOptionsGenerate, CLIOptionsTest } from '../../cli/types';
import { expressoCompare } from './compare';
import { expressoVersion } from './version';
import { expressoHelp } from './help';
import { expressoGenerate } from './generate';
import { expressoTest } from './test';

export const expresso = async (options: CLIOptions): Promise<void> => {
  if (options.command === 'version') {
    return await expressoVersion();
  } else if (options.command === 'help') {
    return await expressoHelp();
  } else if (options.command === 'compare') {
    return await expressoCompare(options.subOptions as CLIOptionsCompare);
  } else if (options.command === 'generate') {
    return await expressoGenerate(options.subOptions as CLIOptionsGenerate);
  } else if (options.command === 'test') {
    return await expressoTest(options.subOptions as CLIOptionsTest);
  }
  await expressoHelp()
  process.exitCode = 1
};
