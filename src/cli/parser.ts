import commandLineArgs from 'command-line-args';

import {
  CLIOptions, CLIProgram,
  CLISubOptions
} from "./types";

import {
  parseCompareCommandLineArgs,
  parseGenerateCommandLineArgs,
  parseMonitorCommandLineArgs,
  parseTestCommandLineArgs
} from "./commands";

export const parseMainCommandLineArgs = (): CLIOptions => {
  const utilsCommandDefinitions = [
    { name: 'version', alias: 'V', type: Boolean},
    { name: 'help', alias: 'H', type: Boolean}
  ]

  const utilsOptions = commandLineArgs(utilsCommandDefinitions, { stopAtFirstUnknown: true })
  let argv = utilsOptions._unknown || []

  if (utilsOptions.version) return { command: 'version' }
  if (utilsOptions.help) return { command: 'help'}

  const mainCommandDefinitions = [
    { name: 'command', defaultOption: true }
  ];

  const mainOptions = commandLineArgs(mainCommandDefinitions, { stopAtFirstUnknown: true, argv });
  argv = mainOptions._unknown || [];

  const fnHandlers: { [key in CLIProgram]: (argv: string[]) => CLISubOptions } = {
    compare: parseCompareCommandLineArgs,
    test: parseTestCommandLineArgs,
    monitor: parseMonitorCommandLineArgs,
    generate: parseGenerateCommandLineArgs,
  };

  const { command } = mainOptions;
  if (!(command in fnHandlers)) {
    return { command: 'help' }
  }

  const subOptions = fnHandlers[mainOptions.command as CLIProgram](argv);

  return {
    command,
    subOptions,
  };
};
