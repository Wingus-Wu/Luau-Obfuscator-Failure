import { describe, it, expect } from "vitest";
import { ObfuscatorEngine } from "../src/obfuscator.js";
import { Parser } from "../src/parser/index.js";

const parser = new Parser();

const SRC = `
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local Player = Players.LocalPlayer
local playerGui = Player:WaitForChild("PlayerGui")
local camera = workspace.CurrentCamera

local function makeButton(text, callback)
  local btn = Instance.new("TextButton")
  btn.Size = UDim2.new(0, 100, 0, 50)
  btn.Position = UDim2.new(0, 10, 0, 10)
  btn.Text = text
  btn.Parent = playerGui
  btn.MouseButton1Click:Connect(callback)
  return btn
end

local function onClicked(input)
  if input.KeyCode == Enum.KeyCode.Space then
    print("pressed")
  end
end

local btn = makeButton("Click me", onClicked)
btn.InputBegan:Connect(function(input)
  -- empty for now
end)

local num = 42
local total = 12345
local ratio = 3.14
`;

function findBadTokens(out: string): string[] {
  const bad: string[] = [];
  // binary ~ (not ~=, not unary before digit/paren-id)
  for (const m of out.matchAll(/[0-9)\]\}](~)\(/g)) bad.push("binary-~(at:" + m.index + ")");
      if (out.match(/\b0x[0-9a-fA-F]+\b/)) bad.push("hex-literal");
  return bad;
}

describe("constant protection repro", () => {
  it("default config (all transforms) stays valid across seeds", () => {
    let parseFails = 0;
    let badTokenHits = 0;
    for (let i = 0; i < 300; i++) {
      const engine = new ObfuscatorEngine({ seed: "full-" + i });
      const out = engine.generate(SRC);
      try { parser.parse(out); } catch { parseFails++; if (parseFails <= 5) { console.log("PARSEFAIL full-"+i); console.log(out); } }
      const bad = findBadTokens(out);
      if (bad.length) { badTokenHits++; if (badTokenHits <= 5) console.log("BADTOKEN", bad, "on full-"+i); }
    }
    console.log(`full: parseFails=${parseFails} badTokenHits=${badTokenHits}`);
    expect(parseFails).toBe(0);
    expect(badTokenHits).toBe(0);
  });

  it("constantProtection only (expr off) stays valid across seeds", () => {
    let parseFails = 0;
    let badTokenHits = 0;
    for (let i = 0; i < 300; i++) {
      const engine = new ObfuscatorEngine({
        seed: "cp-" + i,
        constantProtection: true,
        expressionTransforms: false,
        stringProtection: false,
        virtualization: false,
        deadCode: false,
        controlFlow: false,
        propertyProtection: false,
        identifierRenaming: false,
      });
      const src2 = `local a = game:GetService("Players") local b = game:GetService("HttpService") local c = game:GetService("RunService") local d = 12345 local e = 67890`;
      const out = engine.generate(src2);
      try { parser.parse(out); } catch { parseFails++; if (parseFails <= 5) { console.log("PARSEFAIL cp-"+i); console.log(out); } }
      const bad = findBadTokens(out);
      if (bad.length) { badTokenHits++; if (badTokenHits <= 5) console.log("BADTOKEN", bad, "on cp-"+i); }
    }
    console.log(`cp: parseFails=${parseFails} badTokenHits=${badTokenHits}`);
    expect(parseFails).toBe(0);
    expect(badTokenHits).toBe(0);
  });
});
