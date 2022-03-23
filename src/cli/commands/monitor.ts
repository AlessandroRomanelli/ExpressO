import { CLIOptionsMonitor } from '../types';
import commandLineArgs from 'command-line-args';
import { parseSpecCommandDefinition } from './specification';

export const parseMonitorCommandLineArgs = (argv: string[]): CLIOptionsMonitor => {
  const parseOptions = commandLineArgs(parseSpecCommandDefinition, { stopAtFirstUnknown: true, argv });

  return {
    help: parseOptions.help,
    root: parseOptions.root,
    output: parseOptions.output,
    extension: parseOptions.ext,
    startLine: parseOptions.start,
  };
};
