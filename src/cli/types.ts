export type CLICommands = 'compare' | 'generate' | 'monitor' | 'test';
export type CLISubOptions = CLIOptionsCompare | CLIOptionsMonitor | CLIOptionsGenerate | CLIOptionsTest;

export interface CLIOptions {
  command: CLICommands;
  subOptions: CLISubOptions;
}

export interface CLIOptionsTest {
  json: boolean;
  fileA: string;
}

export interface CLIOptionsCompare extends CLIOptionsTest {
  fileB: string;
}

// tslint:disable-next-line:no-empty-interface
export interface CLIOptionsMonitor {}

// tslint:disable-next-line:no-empty-interface
export interface CLIOptionsGenerate {}
