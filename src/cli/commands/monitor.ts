import { CLIOptionsMonitor } from '../types';
import commandLineArgs from 'command-line-args';

export const parseMonitorCommandLineArgs = (argv: string[]): CLIOptionsMonitor => {
  const parseCommandDefinitions = [
    { name: 'help', alias: 'H', type: Boolean, defaultValue: false },
    { name: 'root', defaultOption: true, defaultValue: process.cwd() },
    { name: 'start', defaultValue: 'npm start'}
  ];

  const parseOptions = commandLineArgs(parseCommandDefinitions, { stopAtFirstUnknown: true, argv });

  return {
    help: parseOptions.help,
    root: parseOptions.root,
    startLine: parseOptions.start
  };
};
