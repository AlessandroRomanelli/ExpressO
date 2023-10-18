#!/usr/bin/env node

import { parseMainCommandLineArgs } from '../cli';
import { expresso } from '../lib/expresso';
import logger from '../logger';

(async () => {
  const options = parseMainCommandLineArgs();
  logger(options.subOptions?.verbose).info(`Expresso main thread started`);
  await expresso(options);
  logger(options.subOptions?.verbose).info('Expresso terminated');
})();
