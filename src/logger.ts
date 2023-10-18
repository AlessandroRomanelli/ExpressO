import { jetLogger, LoggerModes } from 'jet-logger';

const readLoggerMode = (): LoggerModes => {
  const mode = (process.env['JET_LOGGER_MODE']?.trim().toUpperCase() || LoggerModes.Console) as LoggerModes;
  if (Object.values(LoggerModes).includes(mode)) {
    return mode;
  }
  return LoggerModes.Console;
};
const logger = jetLogger(readLoggerMode(), '', true);

export default logger;
