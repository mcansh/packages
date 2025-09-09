import { bgRed, bgYellow, blue, green } from "ansis";

export type LogType = "error" | "warn" | "info";
export type LogLevel = LogType | "silent";

export interface LoggerOptions {
  console?: Console;
  failOnWarn?: boolean;
}

export const LogLevels: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
};

class Logger {
  public level: LogLevel;
  #console: Console;
  #failOnWarn: boolean;

  constructor(
    level: LogLevel = "info",
    { console = globalThis.console, failOnWarn = false }: LoggerOptions = {},
  ) {
    this.level = level;
    this.#console = console;
    this.#failOnWarn = failOnWarn;
  }

  #output(type: LogType, msg: string) {
    const thresh = LogLevels[this.level];
    if (thresh < LogLevels[type]) return;

    const method = type === "info" ? "log" : type;
    this.#console[method](msg);
  }

  #format(msgs: any[]) {
    return msgs.filter((arg) => arg !== undefined && arg !== false).join(" ");
  }

  #warnedMessages = new Set<string>();

  info(...msgs: any[]): void {
    this.#output("info", `${blue`ℹ`} ${this.#format(msgs)}`);
  }

  warn(...msgs: any[]): void {
    const message = this.#format(msgs);
    if (this.#failOnWarn) throw new Error(message);
    this.#warnedMessages.add(message);
    this.#output("warn", `\n${bgYellow` WARN `} ${message}\n`);
  }

  warnOnce(...msgs: any[]): void {
    const message = this.#format(msgs);
    if (this.#warnedMessages.has(message)) return;
    if (this.#failOnWarn) throw new Error(message);
    this.#warnedMessages.add(message);
    this.#output("warn", `\n${bgYellow` WARN `} ${message}\n`);
  }

  error(...msgs: any[]): void {
    this.#output("error", `\n${bgRed` ERROR `} ${this.#format(msgs)}\n`);
  }

  success(...msgs: any[]): void {
    this.#output("info", `${green`✔`} ${this.#format(msgs)}`);
  }
}

if (import.meta.vitest) {
  let { afterEach, expect, it, vi } = import.meta.vitest;

  afterEach(() => {
    vi.clearAllMocks();
  });

  let infoSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  let warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  let errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  it("creates a logger with default options", () => {
    let logger = new Logger();
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.level).toBe("info");
  });

  it("creates a logger with a custom level", () => {
    let logger = new Logger("warn");
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.level).toBe("warn");
  });

  it("logs info messages", () => {
    let logger = new Logger();
    logger.info("This is an info message");
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("logs success messages", () => {
    let logger = new Logger();
    logger.success("This is a success message");
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("logs warn messages", () => {
    const logger = new Logger();
    logger.warn("This is a warning message");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("logs error messages", () => {
    const logger = new Logger();
    logger.error("This is an error message");
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("logs warn messages only once", () => {
    const logger = new Logger();
    logger.warnOnce("This is a new warning message");
    logger.warnOnce("This is a new warning message");
    logger.warnOnce("This is a new warning message");
    logger.warnOnce("This is a new warning message");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("does not log messages below the current level", () => {
    const logger = new Logger("warn");
    logger.info("This is an info message");
    logger.warn("This is a warning message");
    logger.error("This is an error message");
    expect(infoSpy).toHaveBeenCalledTimes(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("does not log messages below the silent level", () => {
    const logger = new Logger("silent");
    logger.info("This is an info message");
    logger.warn("This is a warning message");
    logger.error("This is an error message");
    expect(infoSpy).toHaveBeenCalledTimes(0);
    expect(warnSpy).toHaveBeenCalledTimes(0);
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it("throws on warnings when failOnWarn is true", () => {
    const logger = new Logger("info", { failOnWarn: true });
    expect(() => logger.warn("This is a warning message")).toThrowError();
  });

  it("throws on warnOnce when failOnWarn is true ", () => {
    const logger = new Logger("info", { failOnWarn: true });
    expect(() => logger.warnOnce("This is a warning message!")).toThrowError();
  });
}
