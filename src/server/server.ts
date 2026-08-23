import express from "express";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import { ObfuscatorEngine } from "../obfuscator.js";
import type { ObfuscationConfig } from "../config/config.js";
import type { LogEntry } from "./logger.js";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(process.cwd(), "web", "public")));

app.get("/", (_req, res) => {
  res.send(getHTML());
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.post("/api/obfuscate", async (req, res) => {
  const acceptHeader = req.headers.accept || "";
  const wantsStream = acceptHeader.includes("text/event-stream");

  if (wantsStream) {
    handleStream(req, res);
    return;
  }

  handleJson(req, res);
});

function handleJson(req: express.Request, res: express.Response) {
  const { source, config } = req.body;
  if (typeof source !== "string") {
    res.status(400).json({ error: "Missing source code" });
    return;
  }

  // Construct the engine OUTSIDE the try so the catch can still retrieve the
  // diagnostic logs the engine collected before any failure occurred.
  const engine = new ObfuscatorEngine(config as ObfuscationConfig);
  try {
    const report = engine.getReport(source);

    res.json({
      output: report.output || "",
      seed: report.seed,
      stats: report.stats,
      transforms: report.transforms,
      logs: report.logs,
      warnings: report.warnings,
      skippedTransforms: report.skippedTransforms,
      validationPassed: report.validationPassed,
      duration: report.duration,
      inputSize: report.inputSize,
      outputSize: report.outputSize,
    });
  } catch (e: any) {
    // Include the partial logs so clients (CLI / other JSON consumers) still
    // get diagnostics explaining where/why obfuscation failed.
    res.status(400).json({ error: e.message, logs: engine.getLogs() });
  }
}

async function handleStream(req: express.Request, res: express.Response) {
  const { source, config } = req.body;
  if (typeof source !== "string") {
    res.status(400).send("Missing source code");
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Construct the engine OUTSIDE the try so the catch can still retrieve the
  // diagnostic logs the engine collected before any failure occurred.
  const engine = new ObfuscatorEngine(config as ObfuscationConfig);
  try {
    const report = engine.getReport(source);

    for (const log of report.logs) {
      sendEvent("log", log);
    }

    sendEvent("done", {
      output: report.output || "",
      seed: report.seed,
      stats: report.stats,
      transforms: report.transforms,
      warnings: report.warnings,
      skippedTransforms: report.skippedTransforms,
      validationPassed: report.validationPassed,
      duration: report.duration,
      inputSize: report.inputSize,
      outputSize: report.outputSize,
    });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);

    // Send the partial logs that were collected BEFORE the crash (lexing,
    // parsing, semantic analysis, transform progress). Without this, the
    // debug console is completely empty on failure — which is what made
    // "long scripts show nothing" impossible to diagnose.
    for (const log of engine.getLogs()) {
      sendEvent("log", log);
    }

    // Send the error using BOTH `error` and `message` fields. The frontend's
    // SSE dispatcher keys off `data.error` (NOT `data.message`), so `error`
    // is required for the failure to become visible in the UI at all.
    sendEvent("error", { error: msg, message: msg });
  }

  res.end();
}

app.get("*", (req, res) => {
  const parsed = url.parse(req.url || "", true);
  if (parsed.pathname === "/" || parsed.pathname === "/index.html") {
    res.send(getHTML());
    return;
  }
  res.status(404).send("Not Found");
});

const server = http.createServer(app);

// Handle bind errors gracefully instead of an unhandled 'error' event that
// crashes the process with a scary stack trace (especially EADDRINUSE, which
// happens when a leftover server from a previous `npm run dev` still holds
// the port). Print a clear, actionable message and exit.
server.on("error", (err: NodeJS.ErrnoException & { code?: string }) => {
  if (err.code === "EADDRINUSE") {
    console.error("");
    console.error(`[server] Port ${PORT} is already in use.`);
    console.error("[server] A leftover server from a previous `npm run dev` is likely still running.");
    console.error("[server] Find and kill it with one of:");
    console.error(`[server]   netstat -ano | findstr :${PORT}  (then)  taskkill /PID <pid> /F`);
    console.error("[server]   -- or just run:  npm run free-port   (kills stale servers on this port)");
    console.error("[server] Then start the dev server again. Exiting.");
    process.exit(1);
  }
  console.error("[server] Error:", err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Luau Obfuscator web UI running at http://${HOST}:${PORT}`);
});

// Clean shutdown on Ctrl-C / kill so the listening socket releases promptly
// (prevents transient EADDRINUSE on the very next restart on Windows).
// Idempotent: multiple signals / stdin-close can fire close together during a
// terminal close.
let shuttingDown = false;
function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[server] ${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 500).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGBREAK", () => shutdown("SIGBREAK"));
process.on("SIGHUP", () => shutdown("SIGHUP"));

// --- Dev-session lifetime binding (opt-in via DEV_WATCH_PARENT=1, set by the
// dev controller `scripts/dev.cjs`). When the terminal closes, the controller
// is killed; without this block the server would be orphaned and keep holding
// port 3000, causing EADDRINUSE on the next `npm run dev`. Here the server
// (a) polls its parent PID and self-terminates when the parent is gone, and
// The parent-PID check survives terminal closure even if no signal is
// delivered in time. Do not use inherited stdin as a lifetime signal: npm and
// child-process launchers may close it while the controller is still alive.
// This remains gated so standalone `npm start` is unaffected.
if (process.env.DEV_WATCH_PARENT === "1") {
  const parentPid = process.ppid;
  if (parentPid) {
    const interval = setInterval(() => {
      try { process.kill(parentPid, 0); }
      catch { shutdown("parent-exit"); clearInterval(interval); }
    }, 1000);
    interval.unref();
  }
}

function getHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Luau Obfuscator</title>
  <style>
    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #111118;
      --bg-tertiary: #1a1a24;
      --bg-elevated: #22222e;
      --border: #2a2a3a;
      --border-focus: #6c5ce7;
      --text-primary: #e8e8f0;
      --text-secondary: #a0a0b8;
      --text-muted: #5a5a70;
      --accent: #6c5ce7;
      --accent-hover: #7f70ff;
      --error: #e74c3c;
      --warn: #f39c12;
      --info: #3498db;
      --debug: #95a5a6;
      --success: #2ecc71;
      --font-mono: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    .app {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      gap: 20px;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 4px;
    }

    .app-header h1 {
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent), #a29bfe);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }

    .app-header .status {
      font-size: 12px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    .panel {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .panel-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--text-secondary);
    }

    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    textarea {
      width: 100%;
      padding: 14px;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.6;
      resize: vertical;
      transition: border-color 0.2s;
    }

    textarea:focus {
      outline: none;
      border-color: var(--border-focus);
    }

    textarea::placeholder { color: var(--text-muted); }

    #input { min-height: 180px; }
    #output { min-height: 180px; }

    .controls {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    select {
      padding: 10px 14px;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 13px;
      cursor: pointer;
      min-width: 160px;
    }

    select:focus { outline: none; border-color: var(--border-focus); }

    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 20px;
      margin: 14px 0;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }

    .checkbox-group input[type="checkbox"] {
      accent-color: var(--accent);
      width: 15px;
      height: 15px;
    }

    .btn {
      padding: 10px 22px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: var(--accent);
      color: white;
    }

    .btn-primary:hover { background: var(--accent-hover); }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover {
      background: var(--bg-elevated);
      color: var(--text-primary);
    }

    .btn-secondary.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .output-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      margin-top: 14px;
      display: none;
    }

    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: var(--accent);
      font-family: var(--font-mono);
    }

    .stat-label {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .message {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      display: none;
    }

    .message.error {
      display: block;
      background: rgba(231, 76, 60, 0.1);
      color: var(--error);
      border: 1px solid rgba(231, 76, 60, 0.2);
    }

    .message.success {
      display: block;
      background: rgba(46, 204, 113, 0.1);
      color: var(--success);
      border: 1px solid rgba(46, 204, 113, 0.2);
    }

    /* Debug Console */
    .debug-console { padding: 16px; }

    .debug-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .debug-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--text-secondary);
    }

    .debug-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .debug-filter {
      padding: 5px 12px;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .debug-filter:hover {
      border-color: var(--accent);
      color: var(--text-primary);
    }

    .debug-filter.active {
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }

    .debug-search {
      padding: 6px 12px;
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 12px;
      font-family: var(--font-mono);
      width: 180px;
    }

    .debug-search:focus {
      outline: none;
      border-color: var(--accent);
    }

    .debug-search::placeholder { color: var(--text-muted); }

    .debug-status {
      display: flex;
      gap: 14px;
      margin-bottom: 10px;
      font-size: 11px;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    .debug-status span {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .debug-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    .debug-dot.error { background: var(--error); box-shadow: 0 0 6px var(--error); }
    .debug-dot.warn { background: var(--warn); box-shadow: 0 0 6px var(--warn); }
    .debug-dot.info { background: var(--info); }
    .debug-dot.debug { background: var(--debug); }
    .debug-dot.success { background: var(--success); box-shadow: 0 0 6px var(--success); }

    .debug-console-output {
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 8px;
      height: 340px;
      overflow-y: auto;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.6;
      scroll-behavior: smooth;
    }

    .debug-console-output::-webkit-scrollbar { width: 8px; }
    .debug-console-output::-webkit-scrollbar-track { background: var(--bg-primary); }
    .debug-console-output::-webkit-scrollbar-thumb { background: var(--bg-elevated); border-radius: 4px; }
    .debug-console-output::-webkit-scrollbar-thumb:hover { background: #333; }

    .debug-log-line {
      padding: 5px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      display: flex;
      gap: 10px;
      align-items: flex-start;
      transition: background 0.1s;
      cursor: default;
    }

    .debug-log-line:hover { background: rgba(255,255,255,0.02); }

    .debug-log-line.log-error { border-left: 2px solid var(--error); }
    .debug-log-line.log-warn { border-left: 2px solid var(--warn); }
    .debug-log-line.log-info { border-left: 2px solid var(--info); }
    .debug-log-line.log-debug { border-left: 2px solid var(--debug); }
    .debug-log-line.log-success { border-left: 2px solid var(--success); }

    .debug-log-time {
      color: var(--text-muted);
      font-size: 10px;
      white-space: nowrap;
      user-select: none;
      flex-shrink: 0;
      padding-top: 1px;
    }

    .debug-log-source {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1px 6px;
      border-radius: 3px;
      flex-shrink: 0;
      letter-spacing: 0.5px;
      line-height: 1.5;
      min-width: 56px;
      text-align: center;
    }

    .debug-log-source.Parser { background: rgba(52, 152, 219, 0.15); color: var(--info); }
    .debug-log-source.Obfuscator { background: rgba(108, 92, 231, 0.15); color: var(--accent); }
    .debug-log-source.Generator { background: rgba(155, 89, 182, 0.15); color: #bb8fce; }
    .debug-log-source.Server { background: rgba(149, 165, 166, 0.15); color: var(--debug); }

    .debug-log-level {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      width: 28px;
      text-align: center;
      border-radius: 3px;
      flex-shrink: 0;
      line-height: 1.5;
    }

    .debug-log-level.error { background: rgba(231, 76, 60, 0.15); color: var(--error); }
    .debug-log-level.warn { background: rgba(243, 156, 18, 0.15); color: var(--warn); }
    .debug-log-level.info { background: rgba(52, 152, 219, 0.15); color: var(--info); }
    .debug-log-level.debug { background: rgba(149, 165, 166, 0.15); color: var(--debug); }
    .debug-log-level.success { background: rgba(46, 204, 113, 0.15); color: var(--success); }

    .debug-log-content {
      flex: 1;
      min-width: 0;
      word-break: break-word;
    }

    .debug-log-msg {
      color: var(--text-primary);
    }

    .debug-log-line.log-error .debug-log-msg { color: var(--error); }
    .debug-log-line.log-warn .debug-log-msg { color: var(--warn); }
    .debug-log-line.log-success .debug-log-msg { color: var(--success); }

    .debug-log-data {
      margin-top: 4px;
      padding: 6px 10px;
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
      font-size: 11px;
      color: var(--text-muted);
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 120px;
      overflow-y: auto;
      display: none;
    }

    .debug-log-line.expanded .debug-log-data {
      display: block;
    }

    .debug-log-line.expanded {
      background: rgba(255,255,255,0.03);
    }

    .debug-empty {
      padding: 50px;
      text-align: center;
      color: var(--text-muted);
      font-style: italic;
      font-size: 13px;
    }

    .debug-console-output.paused::after {
      content: 'PAUSED';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      font-size: 36px;
      color: rgba(108, 92, 231, 0.08);
      font-weight: 800;
      pointer-events: none;
      letter-spacing: 4px;
    }

    .debug-console-output {
      position: relative;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .debug-log-line {
      animation: fadeIn 0.15s ease-out;
    }

    @media (max-width: 768px) {
      .app { padding: 16px; }
      .controls { flex-direction: column; }
      .debug-header { flex-direction: column; align-items: flex-start; }
      .debug-toolbar { width: 100%; }
      .debug-search { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="app-header">
      <h1>LUAU OBFUSCATOR</h1>
      <div class="status" id="status">Ready</div>
    </div>

    <div class="panel">
      <label>Input Code</label>
      <textarea id="input" placeholder="Paste your Luau code here..."></textarea>
    </div>

    <div class="panel">
      <label>Protection Level</label>
      <div class="controls">
        <div class="control-group">
          <select id="level">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>
        <button id="obfuscate" class="btn btn-primary">
          <span id="obfuscateLabel">Obfuscate</span>
        </button>
      </div>
      <div class="checkbox-group">
        <label><input type="checkbox" id="identifierRenaming" checked> Identifier Renaming</label>
        <label><input type="checkbox" id="stringProtection" checked> String Protection</label>
        <label><input type="checkbox" id="constantProtection" checked> Constant Protection</label>
        <label><input type="checkbox" id="expressionTransforms" checked> Expression Transforms</label>
        <label><input type="checkbox" id="virtualization"> Virtualization</label>
        <label><input type="checkbox" id="deadCode"> Dead Code</label>
        <label><input type="checkbox" id="controlFlow"> Control Flow</label>
      </div>
    </div>

    <div class="panel">
      <label>Output</label>
      <textarea id="output" readonly placeholder="Obfuscated code will appear here..."></textarea>
      <div class="output-actions">
        <button id="copy" class="btn btn-secondary">Copy</button>
        <button id="download" class="btn btn-secondary">Download</button>
      </div>
      <div id="stats" class="stats-grid"></div>
      <div id="message"></div>
    </div>

    <div class="panel debug-console">
      <div class="debug-header">
        <div class="debug-title">Debug Console</div>
        <div class="debug-toolbar">
          <button class="debug-filter active" data-filter="all">All</button>
          <button class="debug-filter" data-filter="error">Errors</button>
          <button class="debug-filter" data-filter="warn">Warnings</button>
          <button class="debug-filter" data-filter="info">Info</button>
          <button class="debug-filter" data-filter="success">Success</button>
          <input type="text" class="debug-search" id="consoleSearch" placeholder="Search logs...">
          <button class="btn btn-secondary" id="toggleScroll" style="padding:5px 10px;font-size:11px;">Auto-scroll: ON</button>
          <button class="btn btn-secondary" id="copyLogs" style="padding:5px 10px;font-size:11px;">Copy</button>
          <button class="btn btn-secondary" id="clearConsole" style="padding:5px 10px;font-size:11px;">Clear</button>
        </div>
      </div>
      <div class="debug-status" id="debugStatus"></div>
      <div id="console" class="debug-console-output"></div>
    </div>
  </div>

  <script>
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const level = document.getElementById('level');
    const messageEl = document.getElementById('message');
    const consoleEl = document.getElementById('console');
    const consoleSearch = document.getElementById('consoleSearch');
    const debugStatus = document.getElementById('debugStatus');
    const toggleScrollBtn = document.getElementById('toggleScroll');
    const copyLogsBtn = document.getElementById('copyLogs');
    const clearConsoleBtn = document.getElementById('clearConsole');
    const filterBtns = document.querySelectorAll('.debug-filter');
    const obfuscateBtn = document.getElementById('obfuscate');
    const obfuscateLabel = document.getElementById('obfuscateLabel');
    const statusEl = document.getElementById('status');

    let autoScroll = true;
    let currentFilter = 'all';
    let allLogs = [];
    let streaming = false;

    function formatTime(ts) {
      const d = new Date(ts);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      const s = String(d.getSeconds()).padStart(2, '0');
      const ms = String(d.getMilliseconds()).padStart(3, '0');
      return h + ':' + m + ':' + s + '.' + ms;
    }

    function getLevelClass(type) {
      const map = { 'error': 'error', 'warn': 'warn', 'warning': 'warn', 'info': 'info', 'debug': 'debug', 'success': 'success' };
      return map[type] || 'info';
    }

    function getLevelLabel(type) {
      const map = { 'error': 'ERR', 'warn': 'WRN', 'warning': 'WRN', 'info': 'INF', 'debug': 'DBG', 'success': 'OK' };
      return map[type] || 'INF';
    }

    function getSourceClass(source) {
      const map = { 'Parser': 'Parser', 'Obfuscator': 'Obfuscator', 'Generator': 'Generator', 'Server': 'Server' };
      return map[source] || 'Server';
    }

    function updateStatus() {
      const counts = { error: 0, warn: 0, info: 0, debug: 0, success: 0 };
      for (const log of allLogs) { counts[log.level] = (counts[log.level] || 0) + 1; }
      debugStatus.innerHTML =
        '<span><span class="debug-dot error"></span> ' + counts.error + '</span>' +
        '<span><span class="debug-dot warn"></span> ' + counts.warn + '</span>' +
        '<span><span class="debug-dot info"></span> ' + counts.info + '</span>' +
        '<span><span class="debug-dot debug"></span> ' + counts.debug + '</span>' +
        '<span><span class="debug-dot success"></span> ' + counts.success + '</span>' +
        '<span style="margin-left:auto;">' + allLogs.length + ' total</span>';
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function formatData(data) {
      if (data === undefined || data === null) return '';
      try {
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return String(data);
      }
    }

    function appendLogEntry(log) {
      const line = document.createElement('div');
      line.className = 'debug-log-line log-' + log.level;
      line.innerHTML =
        '<span class="debug-log-time">' + formatTime(log.timestamp) + '</span>' +
        '<span class="debug-log-source ' + escapeHtml(log.source) + '">' + escapeHtml(log.source) + '</span>' +
        '<span class="debug-log-level ' + log.level + '">' + getLevelLabel(log.level) + '</span>' +
        '<span class="debug-log-content"><span class="debug-log-msg">' + escapeHtml(log.message) + '</span>' +
        (log.data ? '<div class="debug-log-data">' + escapeHtml(formatData(log.data)) + '</div>' : '') +
        '</span>';
      line.addEventListener('click', function() {
        line.classList.toggle('expanded');
      });
      consoleEl.appendChild(line);
      if (autoScroll) {
        consoleEl.scrollTop = consoleEl.scrollHeight;
      }
    }

    function renderLogs() {
      consoleEl.innerHTML = '';
      const searchTerm = consoleSearch.value.toLowerCase().trim();
      const filtered = [];
      for (let i = 0; i < allLogs.length; i++) {
        const log = allLogs[i];
        if (currentFilter !== 'all' && log.level !== currentFilter) continue;
        if (searchTerm && log.message.toLowerCase().indexOf(searchTerm) === -1 && String(log.data || '').toLowerCase().indexOf(searchTerm) === -1) continue;
        filtered.push(log);
      }

      if (filtered.length === 0) {
        consoleEl.innerHTML = '<div class="debug-empty">No logs to display</div>';
      } else {
        for (let j = 0; j < filtered.length; j++) {
          appendLogEntry(filtered[j]);
        }
      }
      updateStatus();
    }

    function clearConsole() {
      allLogs = [];
      consoleEl.innerHTML = '<div class="debug-empty">Console cleared</div>';
      updateStatus();
    }

    function copyLogs() {
      let text = '';
      for (let i = 0; i < allLogs.length; i++) {
        const log = allLogs[i];
        if (text.length > 0) text += '\\n';
        text += '[' + formatTime(log.timestamp) + '] [' + log.source + '] [' + log.level.toUpperCase() + '] ' + log.message;
        if (log.data) text += ' | ' + formatData(log.data);
      }
      navigator.clipboard.writeText(text).then(function() {
        const originalText = copyLogsBtn.textContent;
        copyLogsBtn.textContent = 'Copied!';
        setTimeout(function() { copyLogsBtn.textContent = originalText; }, 1500);
      });
    }

    toggleScrollBtn.addEventListener('click', function() {
      autoScroll = !autoScroll;
      toggleScrollBtn.textContent = 'Auto-scroll: ' + (autoScroll ? 'ON' : 'OFF');
      toggleScrollBtn.classList.toggle('active', autoScroll);
      if (autoScroll) renderLogs();
    });

    copyLogsBtn.addEventListener('click', copyLogs);
    clearConsoleBtn.addEventListener('click', clearConsole);

    for (let i = 0; i < filterBtns.length; i++) {
      filterBtns[i].addEventListener('click', function() {
        for (let j = 0; j < filterBtns.length; j++) filterBtns[j].classList.remove('active');
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter') || 'all';
        renderLogs();
      });
    }

    consoleSearch.addEventListener('input', renderLogs);

    document.getElementById('obfuscate').addEventListener('click', async function() {
      clearConsole();
      streaming = true;
      obfuscateBtn.disabled = true;
      obfuscateLabel.textContent = 'Processing...';
      statusEl.textContent = 'Running...';
      messageEl.style.display = 'none';
      messageEl.className = 'message';

      const config = {
        intensity: level.value,
        identifierRenaming: document.getElementById('identifierRenaming').checked,
        stringProtection: document.getElementById('stringProtection').checked,
        constantProtection: document.getElementById('constantProtection').checked,
        expressionTransforms: document.getElementById('expressionTransforms').checked,
        virtualization: document.getElementById('virtualization').checked,
        deadCode: document.getElementById('deadCode').checked,
        controlFlow: document.getElementById('controlFlow').checked,
      };

      try {
        const res = await fetch('/api/obfuscate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({ source: input.value, config }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Request failed');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const eventLine = line.slice(6);
            try {
              const data = JSON.parse(eventLine);
              if (data.level) {
                allLogs.push(data);
                if (currentFilter === 'all' || data.level === currentFilter) {
                  if (!consoleSearch.value || data.message.toLowerCase().includes(consoleSearch.value.toLowerCase())) {
                    appendLogEntry(data);
                  }
                }
                updateStatus();
              } else if (data.error) {
                messageEl.textContent = 'Error: ' + data.error;
                messageEl.className = 'message error';
                messageEl.style.display = 'block';
                var errLog = { level: 'error', source: 'Server', message: data.error, timestamp: Date.now() };
                allLogs.push(errLog);
                appendLogEntry(errLog);
                updateStatus();
              } else if (data.seed) {
                output.value = data.output || '';
                const statsEl = document.getElementById('stats');
                statsEl.style.display = 'grid';
                statsEl.innerHTML =
                  '<div class="stat-card"><div class="stat-value">' + (data.stats?.identifiersRenamed ?? 0) + '</div><div class="stat-label">Renamed</div></div>' +
                  '<div class="stat-card"><div class="stat-value">' + (data.stats?.stringsProtected ?? 0) + '</div><div class="stat-label">Strings</div></div>' +
                  '<div class="stat-card"><div class="stat-value">' + (data.stats?.constantsTransformed ?? 0) + '</div><div class="stat-label">Constants</div></div>' +
                  '<div class="stat-card"><div class="stat-value">' + (data.stats?.functionsVirtualized ?? 0) + '</div><div class="stat-label">Virtualized</div></div>' +
                  '<div class="stat-card"><div class="stat-value">' + (data.stats?.deadCodeInjected ?? 0) + '</div><div class="stat-label">Dead Code</div></div>' +
                  '<div class="stat-card"><div class="stat-value">' + (data.stats?.controlFlowTransformed ?? 0) + '</div><div class="stat-label">Control Flow</div></div>' +
                  '<div class="stat-card"><div class="stat-value">' + (data.inputSize ?? 0) + '</div><div class="stat-label">Input B</div></div>' +
                  '<div class="stat-card"><div class="stat-value">' + (data.outputSize ?? 0) + '</div><div class="stat-label">Output B</div></div>';
                messageEl.textContent = 'Obfuscation complete! Seed: ' + data.seed + ' | Duration: ' + data.duration + 'ms';
                messageEl.className = 'message success';
                messageEl.style.display = 'block';
                allLogs.push({ level: 'success', source: 'Server', message: 'Obfuscation complete! Seed: ' + data.seed + ' | Duration: ' + data.duration + 'ms', timestamp: Date.now() });
                updateStatus();
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', eventLine, e);
            }
          }
        }
      } catch (e) {
        var errMsg = e instanceof Error ? e.message : String(e);
        messageEl.textContent = 'Error: ' + errMsg;
        messageEl.className = 'message error';
        messageEl.style.display = 'block';
        var errLog2 = { level: 'error', source: 'Server', message: errMsg, timestamp: Date.now() };
        allLogs.push(errLog2);
        appendLogEntry(errLog2);
        updateStatus();
      } finally {
        streaming = false;
        obfuscateBtn.disabled = false;
        obfuscateLabel.textContent = 'Obfuscate';
        statusEl.textContent = 'Ready';
      }
    });

    document.getElementById('copy').addEventListener('click', function() {
      navigator.clipboard.writeText(output.value);
    });

    document.getElementById('download').addEventListener('click', function() {
      const blob = new Blob([output.value], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'obfuscated.luau';
      a.click();
    });
  </script>
</body>
</html>`;
}
