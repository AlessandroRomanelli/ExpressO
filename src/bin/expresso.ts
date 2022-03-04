#!/usr/bin/env node

import { parseMainCommandLineArgs } from '../cli';
import { expresso } from '../lib';
import logger from 'jet-logger';

(async () => {
  logger.info('Starting up Expresso');
  const options = parseMainCommandLineArgs();
  await expresso(options);
  logger.info('Quitting Expresso');
})();
