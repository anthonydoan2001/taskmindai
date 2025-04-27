import { log } from 'next-axiom';

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  info(message: string, metadata?: LogMetadata) {
    console.info(message, metadata);
    log.info(message, metadata);
  }

  error(message: string, error: any, metadata?: LogMetadata) {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;

    console.error(message, { error: errorDetails, ...metadata });
    log.error(message, { error: errorDetails, ...metadata });
  }

  metric(name: string, value: number, metadata?: LogMetadata) {
    console.log(`Metric: ${name}`, { value, ...metadata });
    log.debug('Metric', { name, value, ...metadata });
  }
}

export const logger = new Logger(); 