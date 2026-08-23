import { ObfuscatorEngine } from "./src/obfuscator.ts";

const source = `
local players = game:GetService("Players")
local player = players.LocalPlayer
local camera = workspace.CurrentCamera
player.Character:FindFirstChild("Head")
local plrs = game:GetService("Players"):GetPlayers()
local uis = game:GetService("UserInputService")
uis.InputBegan:Connect(function(input)
  if input.KeyCode == Enum.UserInputType.MouseButton1 then
    print("clicked")
  end
end)
workspace.RenderStepped:Connect(function()
  local cf = camera.CFrame
  local lv = cf.LookVector
  local mag = (lv).Magnitude
end)
local t = {}
t.Position = Vector2.new(1,2).Unit
print(bit32.band(5,3))
print(string.len("hello"))
print(math.sqrt(16))
print(pairs(t))
error("oops")
`;

const engine = new ObfuscatorEngine({
  seed: "leak-test",
  virtualization: true,
  stringProtection: true,
  stringProtectionIntensity: "high",
  constantProtection: false,
  expressionTransforms: false,
  deadCode: false,
  controlFlow: false,
  identifierRenaming: true,
  propertyProtection: false,
});

const report = engine.getReport(source);
console.log("=== validationPassed:", report.validationPassed);
console.log("=== functionsVirtualized:", report.stats.functionsVirtualized);
console.log("=== OUTPUT ===");
console.log(report.output);
