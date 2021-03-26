import pino from 'pino';
import 'pino-pretty';

export default pino({
  level: process.env.LOG_LEVEL,
  timestamp: process.stdout.isTTY,
  prettyPrint: {
    translateTime: process.stdout.isTTY,
    ignore: [...(process.stdout.isTTY ? [] : ['time']), 'name', 'pid', 'hostname'].join(','),
  },
});
