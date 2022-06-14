import { JetLogger, LoggerModes } from 'jet-logger';

const readLoggerMode = (): LoggerModes => {
  const mode = (process.env['JET_LOGGER_MODE']?.trim().toUpperCase() || LoggerModes.Off) as LoggerModes;
  if (Object.values(LoggerModes).includes(mode)) {
    return mode;
  }
  return LoggerModes.Off;
};
const logger = JetLogger(readLoggerMode(), '', true);

export default logger;
