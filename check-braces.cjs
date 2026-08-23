const fs = require("fs");
const content = fs.readFileSync("src/transforms/strings/protect.ts", "utf8");
const lines = content.split("\n");
let braceCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let inString = false;
  let stringChar = "";
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (inString) {
      if (ch === "\\") { j++; continue; }
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
    if (ch === "{") braceCount++;
    if (ch === "}") braceCount--;
  }
  if (i >= 300) {
    console.log((i + 1) + ": " + braceCount + " " + line.substring(0, 80));
  }
}
