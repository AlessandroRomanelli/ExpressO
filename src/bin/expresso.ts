#!/usr/bin/env node

import { parseMainCommandLineArgs } from '../cli';
import { expresso } from '../lib/expresso';
import logger from 'jet-logger';

(async () => {
  const options = parseMainCommandLineArgs();
  try {
    await expresso(options);
  } catch (e) {
    console.error(e);
    process.exit(1)
  }
})();
