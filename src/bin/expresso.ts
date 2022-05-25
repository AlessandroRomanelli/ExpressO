#!/usr/bin/env node

import { parseMainCommandLineArgs } from '../cli';
import { expresso } from '../lib/expresso';
import logger from 'jet-logger';

(async () => {
  const options = parseMainCommandLineArgs();
  await expresso(options);
})();
