import * as fs from "fs";
import * as path from "path";

const LOG_DIR = path.join(process.cwd(), "debug");
const LOG_FILE = path.join(LOG_DIR, "debug.log");
const MAX_LOG_AGE_DAYS = 14;
const SAST_TZ = "Africa/Johannesburg";

function getSASTTime(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
  return `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}:${pick("second")} SAST`;
}

function cleanOldLogs(): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    if (!fs.existsSync(LOG_FILE)) return;

    const content = fs.readFileSync(LOG_FILE, "utf-8");
    const lines = content.split("\n").filter(line => line.trim());
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_LOG_AGE_DAYS);
    
    const filteredLines = lines.filter(line => {
      const match = line.match(/\[(\d{4}-\d{2}-\d{2})/);
      if (match) {
        const logDate = new Date(match[1]);
        return logDate >= cutoffDate;
      }
      return true;
    });

    if (filteredLines.length !== lines.length) {
      fs.writeFileSync(LOG_FILE, filteredLines.join("\n") + (filteredLines.length > 0 ? "\n" : ""));
    }
  } catch (error) {
    console.error("Failed to clean old logs:", error);
  }
}

export function initializeLogger(): void {
  cleanOldLogs();
  logToFile("Logger initialized - keeping logs for " + MAX_LOG_AGE_DAYS + " days", "INFO");
}

export function logToFile(message: string, level: "INFO" | "ERROR" | "WARN" | "DEBUG" | "SCRAPE" = "INFO"): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    const timestamp = getSASTTime();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}

export function log(message: string, source = "express"): void {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const output = `${formattedTime} [${source}] ${message}`;
  console.log(output);
  logToFile(`[${source}] ${message}`, "INFO");
}

export function info(message: string, data?: any): void {
  const msg = data ? `${message} | ${JSON.stringify(data)}` : message;
  console.log(`[INFO] ${msg}`);
  logToFile(msg, "INFO");
}

export function warn(message: string, data?: any): void {
  const msg = data ? `${message} | ${JSON.stringify(data)}` : message;
  console.warn(`[WARN] ${msg}`);
  logToFile(msg, "WARN");
}

export function error(message: string, data?: any): void {
  const msg = data ? `${message} | ${JSON.stringify(data)}` : message;
  console.error(`[ERROR] ${msg}`);
  logToFile(msg, "ERROR");
}

export function debug(message: string, data?: any): void {
  const msg = data ? `${message} | ${JSON.stringify(data)}` : message;
  console.log(`[DEBUG] ${msg}`);
  logToFile(msg, "DEBUG");
}

export function scrape(message: string, data?: any): void {
  const msg = data ? `${message} | ${JSON.stringify(data)}` : message;
  console.log(`[SCRAPE] ${msg}`);
  logToFile(msg, "SCRAPE");
}

setInterval(() => {
  cleanOldLogs();
}, 24 * 60 * 60 * 1000);

export default {
  log,
  info,
  warn,
  error,
  debug,
  scrape,
  initializeLogger,
  logToFile
};
