import { afterEach, expect, it, vi } from "vitest";
import { createLogger, globalLogger, type Logger } from "./lib";

let spies = {
  info: vi.spyOn(console, "log").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
};

afterEach(() => {
  vi.clearAllMocks();
});

it("exports a globalLogger", () => {
  expect(globalLogger).toBeDefined();
  expect(globalLogger.level).toBe("info");
  expect(globalLogger.info).toBeInstanceOf(Function);
  expect(globalLogger.warn).toBeInstanceOf(Function);
  expect(globalLogger.error).toBeInstanceOf(Function);
  expect(globalLogger.success).toBeInstanceOf(Function);
  expect(globalLogger.warnOnce).toBeInstanceOf(Function);
});

it("creates a logger with default options", () => {
  const logger = createLogger();
  expect(logger.level).toBe("info");
});

it("creates a logger with custom level", () => {
  const logger = createLogger("error");
  expect(logger.level).toBe("error");
});

it("logs info messages", () => {
  const logger = createLogger();
  logger.info("This is an info message");
  expect(spies.info).toHaveBeenCalledTimes(1);
});

it("logs success messages", () => {
  const logger = createLogger();
  logger.success("This is a success message");
  expect(spies.info).toHaveBeenCalledTimes(1);
});

it("logs warn messages", () => {
  const logger = createLogger();
  logger.warn("This is a warning message");
  expect(spies.warn).toHaveBeenCalledTimes(1);
});

it("logs error messages", () => {
  const logger = createLogger();
  logger.error("This is an error message");
  expect(spies.error).toHaveBeenCalledTimes(1);
});

it("logs warn messages only once", () => {
  const logger = createLogger();
  logger.warnOnce("This is a new warning message");
  logger.warnOnce("This is a new warning message");
  logger.warnOnce("This is a new warning message");
  logger.warnOnce("This is a new warning message");
  expect(spies.warn).toHaveBeenCalledTimes(1);
});

it("does not log messages below the current level", () => {
  const logger = createLogger("warn");
  logger.info("This is an info message");
  logger.warn("This is a warning message");
  logger.error("This is an error message");
  expect(spies.info).toHaveBeenCalledTimes(0);
  expect(spies.warn).toHaveBeenCalledTimes(1);
  expect(spies.error).toHaveBeenCalledTimes(1);
});

it("does not log messages below the silent level", () => {
  const logger = createLogger("silent");
  logger.info("This is an info message");
  logger.warn("This is a warning message");
  logger.error("This is an error message");
  expect(spies.info).toHaveBeenCalledTimes(0);
  expect(spies.warn).toHaveBeenCalledTimes(0);
  expect(spies.error).toHaveBeenCalledTimes(0);
});

it("throws on warnings when failOnWarn is true", () => {
  const logger = createLogger("info", { failOnWarn: true });
  expect(() => logger.warn("This is a warning message")).toThrowError();
});

it("throws on warnOnce when failOnWarn is true ", () => {
  const logger = createLogger("info", { failOnWarn: true });
  expect(() => logger.warnOnce("This is a warning message!")).toThrowError();
});

it("allows custom logger", () => {
  const customLogger = {
    level: "info",
    info: vi.fn(),
    warn: vi.fn(),
    warnOnce: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  } satisfies Logger;

  const logger = createLogger("info", { customLogger });
  expect(logger).toBe(customLogger);
  logger.info("Test info");
  expect(customLogger.info).toHaveBeenCalledWith("Test info");
  logger.warn("Test warn");
  expect(customLogger.warn).toHaveBeenCalledWith("Test warn");
  logger.error("Test error");
  expect(customLogger.error).toHaveBeenCalledWith("Test error");
  logger.success("Test success");
  expect(customLogger.success).toHaveBeenCalledWith("Test success");
  logger.warnOnce("Test warnOnce");
  expect(customLogger.warnOnce).toHaveBeenCalledWith("Test warnOnce");
  expect(customLogger.warnOnce).toHaveBeenCalledTimes(1);
});
