#!/usr/bin/env node
// scripts/dev.cjs — the dev server controller, used by `npm run dev`.
//
// Why a custom controller instead of nodemon?
//   nodemon spawns the server as a child but does NOT reliably kill that child
//   when the terminal closes — the child gets reparented and keeps holding the
//   port, producing the orphan / EADDRINUSE loop you've seen. This controller:
//     - frees port 3000 before start (kills any stale server from a prior session)
//     - builds (tsc), then spawns the server as a tracked child with
//       DEV_WATCH_PARENT=1 (the server then self-terminates if THIS controller
//       dies — i.e. on terminal close — even if no signal reaches us in time)
//     - restarts on src/**/*.ts changes (debounced)
//     - tree-kills the server on Ctrl-C so the listening socket releases
//
// The combination of (controller tree-kill on signal) + (server self-exit on
// parent death) is what makes closing the terminal actually free the port.

const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SERVER = path.join(ROOT, "dist/src/server/server.js");
const SRC = path.join(ROOT, "src");
const PID_FILE = path.join(ROOT, ".dev-server.pid");
const HOST = readArg("--host") || process.env.HOST || "127.0.0.1";
const PORT = readArg("--port") || process.env.PORT || "3000";

let child = null;
let restarting = false;
let debounce = null;

function banner(msg) { console.log(`\n[dev] ${msg}`); }

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function freePort() {
  try {
    execSync("node scripts/free-port.cjs", {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, PORT },
    });
  }
  catch { /* best-effort */ }
}

function build() {
  banner("building (tsc)…");
  try { execSync("npx tsc", { cwd: ROOT, stdio: "inherit" }); return true; }
  catch (e) { console.error("[dev] build failed — fix the TS errors and save a file to retry."); return false; }
}

function treeKill(pid) {
  if (!pid) return;
  try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); }
  catch { try { process.kill(pid); } catch {} }
}

function clearPidFile(pid) {
  try {
    if (String(fs.readFileSync(PID_FILE, "utf8").trim()) === String(pid)) {
      fs.unlinkSync(PID_FILE);
    }
  } catch { /* The file may already have been cleaned by a new controller. */ }
}

function startServer() {
  if (child) { treeKill(child.pid); child = null; }
  banner("starting server…");
  const serverChild = spawn(process.execPath, [SERVER], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, DEV_WATCH_PARENT: "1", HOST, PORT },
  });
  child = serverChild;
  fs.writeFileSync(PID_FILE, String(serverChild.pid));
  serverChild.on("exit", (code, signal) => {
    clearPidFile(serverChild.pid);
    if (child !== serverChild) return;
    if (restarting) { child = null; return; }
    child = null;
    if (signal) banner(`server exited (signal ${signal}). waiting for a src change to restart…`);
    else if (code && code !== 0) banner(`server exited (code ${code}). waiting for a src change to restart…`);
    else banner("server exited.");
  });
  lastServerStart = Date.now();   // arm the settle gate
}

// Settle gate: ignore watch events for SETTLE_MS after each server start.
// On Windows, fs.watch(recursive) fires spurious events right after setup
// and after files settle post-build — without this gate those phantom events
// trigger an unwanted restart that kills the just-started server.
const SETTLE_MS = 3000;
let lastServerStart = 0;

function restart() {
  if (restarting) return;
  restarting = true;
  banner("change detected — restarting…");
  if (child) { treeKill(child.pid); child = null; }
  if (build()) startServer();
  restarting = false;
}

// Watch src recursively (works on Windows; Node supports recursive watch here).
// Gated by the settle window so phantom post-boot / post-build events don't
// trigger restarts.
let watcherReady = false;
try {
  fs.watch(SRC, { recursive: true }, (_evt, file) => {
    if (!watcherReady) return;
    if (!file || !/\.(ts|json)$/.test(file)) return;          // ignore non-source churn
    if (file.endsWith(".test.ts")) return;                    // tests don't affect the server
    if (Date.now() - lastServerStart < SETTLE_MS) return;     // settle gate
    if (debounce) return;
    debounce = setTimeout(() => { debounce = null; restart(); }, 400);
  });
} catch (e) {
  banner("fs.watch failed; live-reload disabled: " + e.message);
}

// Clean shutdown — turn Ctrl-C / close into a fast tree-kill so the server
// (and its listening socket) dies with the controller. As a backstop the
// server ALSO self-terminates when this parent disappears (via DEV_WATCH_PARENT).
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  banner("shutting down…");
  if (child) {
    treeKill(child.pid);
    clearPidFile(child.pid);
  }
  setTimeout(() => process.exit(0), 150);
}
process.on("SIGINT", shutdown);
process.on("SIGBREAK", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGHUP", shutdown);

// Boot
freePort();
banner(`using http://${HOST}:${PORT}`);
if (build()) startServer();
else banner("initial build failed — fix TS errors and save a src file to retry.");

// Enable the watcher after a grace window so phantom post-setup fs.watch
// events (common on Windows) don't trigger a spurious restart.
setTimeout(() => { watcherReady = true; banner("watching src/ for changes…"); }, SETTLE_MS);
