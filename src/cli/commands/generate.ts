import { CLIOptionsGenerate } from '../types';
import commandLineArgs from 'command-line-args';

export const parseGenerateCommandLineArgs = (argv: string[]): CLIOptionsGenerate => {
  const parseCommandDefinitions = [
    { name: 'help', alias: 'H', type: Boolean, defaultValue: false },
    { name: 'root', defaultOption: true },
  ];

  const parseOptions = commandLineArgs(parseCommandDefinitions, { stopAtFirstUnknown: true, argv });

  return {
    help: parseOptions.help,
    root: parseOptions.root || process.cwd(),
  };
};
