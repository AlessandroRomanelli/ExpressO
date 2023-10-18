import { CLIOptionsGenerate } from '../types';
import commandLineArgs from 'command-line-args';
import { parseSpecCommandDefinition } from './specification';

export const parseGenerateCommandLineArgs = (argv: string[]): CLIOptionsGenerate => {
  const parseOptions = commandLineArgs(parseSpecCommandDefinition, { stopAtFirstUnknown: true, argv });

  if (!['json', 'yaml'].includes(parseOptions.ext)) {
    throw new Error(`'${parseOptions.ext}' not supported. Available options: yaml, json`);
  }

  return {
    help: parseOptions.help,
    root: parseOptions.root,
    output: parseOptions.output,
    extension: parseOptions.ext,
    startLine: parseOptions.start,
    verbose: parseOptions.verbose,
  };
};
