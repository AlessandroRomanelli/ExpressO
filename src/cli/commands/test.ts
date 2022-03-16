import { CLIOptionsTest } from '../types';
import commandLineArgs from 'command-line-args';

export const parseTestCommandLineArgs = (argv: string[]): CLIOptionsTest => {
  const testCommandDefinitions = [
    { name: 'file', defaultOption: true },
    { name: 'json', alias: 'J', type: Boolean, defaultValue: false },
    { name: 'help', alias: 'H', type: Boolean, defaultValue: false },
  ];

  const testOptions = commandLineArgs(testCommandDefinitions, { stopAtFirstUnknown: true, argv });
  return {
    fileA: testOptions.file,
    json: testOptions.json,
    help: testOptions.help,
  };
};
