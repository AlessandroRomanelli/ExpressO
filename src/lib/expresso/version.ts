import fs from "fs"

// tslint:disable:no-console
export const expressoVersion = async (): Promise<void> => {
  const pkg = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf-8'));
  console.log(`V${pkg.version || "0.0.0"}`)
}