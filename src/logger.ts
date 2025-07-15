/**
 * Logger interface for the application
 */
export interface LoggerConfig {
  silent?: boolean;
  verbose?: boolean;
}

/**
 * Simple logger utility for the application
 */
class Logger {
  private silent: boolean = false;
  private isVerbose: boolean = false;

  /**
   * Configure the logger
   */
  configure(config: LoggerConfig) {
    this.silent = config.silent || false;
    this.isVerbose = config.verbose || false;
  }

  /**
   * Log an info message
   */
  info(message: string) {
    if (!this.silent) {
      console.info(`[INFO] ${message}`);
    }
  }

  /**
   * Log an error message
   */
  error(message: string) {
    if (!this.silent) {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Log a success message
   */
  success(message: string) {
    if (!this.silent) {
      console.log(`[SUCCESS] ${message}`);
    }
  }

  /**
   * Log a verbose message (only if verbose mode is enabled)
   */
  verbose(message: string) {
    if (!this.silent && this.isVerbose) {
      console.log(`[DEBUG] ${message}`);
    }
  }
}

export const logger = new Logger();
