export const parseSpecCommandDefinition = [
  { name: 'help', alias: 'H', type: Boolean, defaultValue: false },
  { name: 'root', defaultValue: process.cwd() },
  { name: 'output', alias: 'O', defaultValue: 'expresso-openapi' },
  { name: 'ext', alias: 'E', defaultValue: 'json' },
  { name: 'start', defaultValue: 'npm start' },
];
