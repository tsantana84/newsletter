type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  event: string;
  [key: string]: unknown;
}

function log(entry: LogEntry) {
  const { level, ...rest } = entry;
  const payload = {
    ...rest,
    level,
    timestamp: new Date().toISOString(),
    service: "inference-newsletter",
  };

  // Structured JSON — Vercel captures this automatically
  switch (level) {
    case "error":
      console.error(JSON.stringify(payload));
      break;
    case "warn":
      console.warn(JSON.stringify(payload));
      break;
    default:
      console.log(JSON.stringify(payload));
  }
}

export const logger = {
  info(event: string, data?: Record<string, unknown>) {
    log({ level: "info", event, ...data });
  },
  warn(event: string, data?: Record<string, unknown>) {
    log({ level: "warn", event, ...data });
  },
  error(event: string, data?: Record<string, unknown>) {
    log({ level: "error", event, ...data });
  },
};
