import { CLIOptions, CLIOptionsCompare, CLIOptionsGenerate } from "../../cli/types";
import { expressoCompare } from './compare';
import { expressoVersion } from './version';
import { expressoHelp } from './help';
import { expressoGenerate } from "./generate";

// tslint:disable:no-empty
export const expresso = async (options: CLIOptions): Promise<void> => {
  if (options.command === 'version') {
    return await expressoVersion();
  } else if (options.command === 'help') {
    return await expressoHelp();
  } else if (options.command === 'compare') {
    return await expressoCompare(options.subOptions as CLIOptionsCompare);
  } else if (options.command === 'generate') {
    return await expressoGenerate(options.subOptions as CLIOptionsGenerate)
  } else if (options.command === 'monitor') {
  } else if (options.command === 'test') {
  }
};
