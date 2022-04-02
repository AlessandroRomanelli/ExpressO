import { CLIOptionsCompare } from '../types';
import commandLineArgs from 'command-line-args';

export const parseCompareCommandLineArgs = (argv: string[]): CLIOptionsCompare => {
  const parseCommandDefinitions = [
    { name: 'files', defaultOption: true },
    { name: 'json', alias: 'J', type: Boolean, defaultValue: false },
    { name: 'help', alias: 'H', type: Boolean, defaultValue: false },
  ];

  const parseOptions = commandLineArgs(parseCommandDefinitions, { stopAtFirstUnknown: true, argv });
  if (parseOptions.help)
    return {
      fileA: '',
      fileB: '',
      json: false,
      help: true,
    };

  if (!parseOptions.files || parseOptions.files.length < 2) {
    throw new Error('Must provide at least two file paths as arguments');
  }
  const [fileA, fileB] = parseOptions.files;

  return {
    fileA,
    fileB,
    json: parseOptions.json,
    help: parseOptions.help,
  };
};
