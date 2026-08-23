#!/usr/bin/env node
// Frees the dev-server port by killing stale servers left over from previous
// `npm run dev` sessions. Runs before nodemon starts (via nodemon.json `exec`)
// so a second dev session self-heals instead of crashing with EADDRINUSE.
// Safe: only kills `node.exe` processes whose command line references
// `server.js` from THIS project and are listening on the port.
const { execFileSync, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const SERVER_MARKER = "server.js";
const PID_FILE = path.resolve(__dirname, "..", ".dev-server.pid");

function log(msg) { console.log(`[free-port] ${msg}`); }

function killPid(pid) {
  try { execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" }); return true; }
  catch { return false; }
}

function get(pid, prop) {
  try {
    const out = execSync(`wmic process where ProcessId=${pid} get ${prop} /format:list`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const m = out.match(new RegExp(prop + "=(.*)"));
    if (m) return m[1].trim();
  } catch { /* WMIC is removed from many current Windows installations. */ }

  try {
    return execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `(Get-CimInstance -ClassName Win32_Process -Filter 'ProcessId = ${pid}').${prop}`,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    return "";
  }
}

function getManagedPid() {
  try {
    const pid = Number(fs.readFileSync(PID_FILE, "utf8").trim());
    return Number.isSafeInteger(pid) && pid > 0 ? String(pid) : "";
  } catch {
    return "";
  }
}

function clearManagedPid(pid) {
  try {
    if (fs.readFileSync(PID_FILE, "utf8").trim() === String(pid)) fs.unlinkSync(PID_FILE);
  } catch { /* No stale record to clean. */ }
}

function main() {
  let out = "";
  try { out = execSync("netstat -ano -p TCP", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); }
  catch { return; } // netstat unavailable — nothing to do

  const candidates = new Set();
  for (const line of out.split(/\r?\n/)) {
    // TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    1234
    const m = line.match(/\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/);
    if (m && String(m[1]) === String(PORT)) candidates.add(m[2]);
  }
  if (candidates.size === 0) {
    clearManagedPid(getManagedPid());
    return;
  }

  const managedPid = getManagedPid();

  for (const pid of candidates) {
    const name = get(pid, "Name");
    const cmd = get(pid, "CommandLine");
    const isManagedServer = pid === managedPid && (!name || /node\.exe/i.test(name));
    if (isManagedServer || (/node\.exe/i.test(name) && cmd.includes(SERVER_MARKER))) {
      if (killPid(pid)) {
        clearManagedPid(pid);
        log(`killed stale dev server PID ${pid} (was holding port ${PORT})`);
      }
    } else {
      log(`port ${PORT} held by PID ${pid} (${name || "unknown"}); leaving it alone (not our server).`);
    }
  }
}

main();
