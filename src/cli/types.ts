export type CLIProgram = 'compare' | 'generate' | 'monitor' | 'test';
export type CLICommand = CLIProgram | 'version' | 'help';

export interface CLIOptions {
  command: CLICommand;
  subOptions?: CLISubOptions;
}

export interface CLISubOptions {
  help: boolean;
}

export interface CLIOptionsTest extends CLISubOptions {
  json: boolean;
  fileA: string;
}

export interface CLIOptionsCompare extends CLIOptionsTest {
  fileB: string;
}

// tslint:disable-next-line:no-empty-interface
export interface CLIOptionsMonitor extends CLISubOptions {}

// tslint:disable-next-line:no-empty-interface
export interface CLIOptionsGenerate extends CLISubOptions {}
