#!/usr/bin/env node

import { parseMainCommandLineArgs } from '../cli';
import { expresso } from '../lib/expresso';
import logger from 'jet-logger';

(async () => {
  logger.info(`Parsing parameters`);
  const options = parseMainCommandLineArgs();
  logger.info(`Expresso main thread started`);
  await expresso(options);
  logger.info('Expresso terminated');
})();
