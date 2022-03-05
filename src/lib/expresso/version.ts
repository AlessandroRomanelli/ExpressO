import fs from 'fs';

// tslint:disable:no-console
export const expressoVersion = async (): Promise<void> => {
  const lookupString = "expresso-api"
  const filePath = __dirname.slice(0, __dirname.indexOf(lookupString) + lookupString.length) + '/package.json'
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`V${pkg.version || '0.0.0'}`);
};
