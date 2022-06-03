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

  if (!parseOptions.help && !parseOptions.files) {
    throw new Error('Must provide two files to compare separated by a colon (:), fileA:fileB');
  }
  const [fileA, fileB] = (parseOptions.files || ':').split(':');
  if (!parseOptions.help && (!fileA || !fileB)) {
    throw new Error('Must provide two file paths as argument <fileA>:<fileB>');
  }

  return {
    fileA,
    fileB,
    json: parseOptions.json,
    help: parseOptions.help,
  };
};
