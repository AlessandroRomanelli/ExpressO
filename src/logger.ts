import { jetLogger, LoggerModes } from 'jet-logger';

const readLoggerMode = (verbose : boolean | undefined): LoggerModes => {
  const type = verbose ? LoggerModes.Console : LoggerModes.Off;
  const mode = (process.env['JET_LOGGER_MODE']?.trim().toUpperCase() || type) as LoggerModes;
  if (Object.values(LoggerModes).includes(mode)) {
    return mode;
  }
  return type;
};
const loggerfn = (verbose:boolean | undefined) => jetLogger(readLoggerMode(verbose), '', true)

export default loggerfn;
