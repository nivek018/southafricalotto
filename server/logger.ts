import * as fs from "fs";
import * as path from "path";

const LOG_DIR = path.join(process.cwd(), "debug.log");
const MAX_LOG_AGE_DAYS = 14;

export function initializeLogger() {
  const dir = path.dirname(LOG_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  cleanOldLogs();
}

function cleanOldLogs() {
  const dir = path.dirname(LOG_DIR);
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  const now = Date.now();
  const maxAge = MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000;

  files.forEach((file) => {
    if (file.startsWith("debug-")) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    }
  });
}

export function logToFile(message: string, level: "INFO" | "ERROR" | "WARN" = "INFO") {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    const fileName = `debug-${new Date().toISOString().split("T")[0]}.log`;
    const logFile = path.join(path.dirname(LOG_DIR), fileName);

    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const output = `${formattedTime} [${source}] ${message}`;
  console.log(output);
  logToFile(`[${source}] ${message}`);
}
