import commandLineArgs from "command-line-args"
import {
  CLICommands, CLIOptions, CLIOptionsCompare, CLIOptionsGenerate,
  CLIOptionsMonitor, CLIOptionsTest, CLISubOptions
} from "./types";

const parseCompareCommandLineArgs = (argv: string[]): CLIOptionsCompare => {
  const parseCommandDefinitions = [
    { name: 'files', defaultOption: true },
    { name: 'json', alias: 'J', type: Boolean, defaultValue: false }
  ]

  const parseOptions = commandLineArgs(parseCommandDefinitions, { stopAtFirstUnknown: true, argv })
  const [fileA, fileB] = parseOptions.files

  return {
    fileA,
    fileB,
    json: parseOptions.json
  }
}

const parseTestCommandLineArgs = (argv: string[]): CLIOptionsTest => {
  const testCommandDefinitions = [
    { name: 'file', defaultOption: true },
    { name: 'json', alias: 'J', type: Boolean, defaultValue: false }
  ]

  const testOptions = commandLineArgs(testCommandDefinitions, { stopAtFirstUnknown: true, argv })
  return {
    fileA: testOptions.file,
    json: testOptions.json
  }

}

const parseMonitorCommandLineArgs = (argv: string[]): CLIOptionsMonitor => {
  return {

  }
}

const parseGenerateCommandLineArgs = (argv: string[]): CLIOptionsGenerate => {
  return {

  }
}

export const parseMainCommandLineArgs = (): CLIOptions => {
  const mainCommandDefinitions = [
    { name: 'command', defaultOption: true }
  ]

  const mainOptions = commandLineArgs(mainCommandDefinitions, { stopAtFirstUnknown: true })
  const argv = mainOptions._unknown || []

  const fnHandlers: { [key in CLICommands]: (argv: string[]) => CLISubOptions} = {
    "compare": parseCompareCommandLineArgs,
    "test": parseTestCommandLineArgs,
    "monitor": parseMonitorCommandLineArgs,
    "generate": parseGenerateCommandLineArgs
  }

  const { command } = mainOptions
  if (!(command in fnHandlers)) {
    throw new Error("Unsupported command. The following commands are available: " + Object.keys(fnHandlers).map(x => `'${x}'`).join(", ") + ".")
  }

  const subOptions = fnHandlers[mainOptions.command as CLICommands](argv);

  return {
    command,
    subOptions
  }
}
