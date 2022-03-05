import { CLIOptions, CLIOptionsCompare } from '../../cli/types';
import { expressoCompare } from "./compare";
import { expressoVersion } from "./version";
import { expressoHelp } from "./help";

// tslint:disable:no-empty
export const expresso = async (options: CLIOptions): Promise<void> => {
  if (options.command === "version") {
    return expressoVersion();
  } else if (options.command === "help") {
    return expressoHelp()
  } else if (options.command === "compare") {
    return expressoCompare(options.subOptions as CLIOptionsCompare);
  } else if (options.command === "generate") {
  } else if (options.command === "monitor") {
  } else if (options.command === "test") {
  }
};
