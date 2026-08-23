#!/usr/bin/env node
// ATOMIC test (single process, no shell variable scoping issues):
// Simulates closing the terminal by force-killing ONLY the dev controller
// (scripts/dev.cjs) and verifies the server self-terminates + frees port 3000.
const { spawn, execSync } = require("child_process");

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function portOwner() {
  try {
    const out = execSync("netstat -ano -p TCP", { encoding: "utf8" });
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/[\d.:]+:3000\s+\S+\s+LISTENING\s+(\d+)/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

function parentOf(pid) {
  try {
    const out = execSync(`wmic process where ProcessId=${pid} get ParentProcessId /format:list`, { encoding: "utf8" });
    const m = out.match(/ParentProcessId=(\d+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

(async () => {
  console.log("[test] starting dev controller (npm run dev path)…");
  const dev = spawn(process.execPath, ["scripts/dev.cjs"], {
    cwd: __dirname.replace(/[\\/]scripts$/, ""),
    stdio: "inherit",
  });
  const controllerPid = dev.pid;
  console.log("[test] controller PID:", controllerPid);

  console.log("[test] waiting 7s for free-port + tsc build + server up…");
  await sleep(7000);

  const srvPid = portOwner();
  if (!srvPid) { console.log("[test] FAIL: server never started on 3000"); dev.kill(); process.exit(1); }
  const srvParent = parentOf(srvPid);
  console.log(`[test] server PID=${srvPid}, parent=${srvParent} (should equal controller ${controllerPid})`);

  console.log(`[test] SIMULATING terminal close: force-killing ONLY controller PID ${controllerPid}`);
  try { execSync(`taskkill /PID ${controllerPid} /F`, { stdio: "ignore" }); } catch (e) { console.log("[test] taskkill err:", e.message); }

  console.log("[test] waiting 3.5s for server to detect dead parent (polls every 1s)…");
  await sleep(3500);

  const still = portOwner();
  if (still) {
    console.log(`[test] FAIL: server orphaned as PID ${still} — port NOT freed`);
    try { execSync(`taskkill /PID ${still} /T /F`, { stdio: "ignore" }); } catch {}
    process.exit(1);
  } else {
    console.log("[test] PASS: server self-terminated on parent death — port 3000 freed.");
    process.exit(0);
  }
})();
