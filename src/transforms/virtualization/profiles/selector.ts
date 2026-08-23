import type { CompilationResult } from "../vm.js";
import type { TransformContext } from "../../transform.js";
import type { VMProfile } from "./base.js";
import { ProfileA, ProfileB, ProfileC, ProfileD, ProfileE } from "./index.js";
import { generateStringPool } from "./base.js";
import { dedupeEmptyLocalTables } from "../../strings/decoder.js";

export const VM_PROFILES: VMProfile[] = [
  new ProfileA(),
  new ProfileB(),
  new ProfileC(),
  new ProfileD(),
  new ProfileE(),
];

export function selectVMProfile(context: TransformContext): VMProfile {
  const profileName = (context.config as any).vmProfile;
  if (profileName && profileName !== "random") {
    for (const p of VM_PROFILES) {
      if (p.name === profileName) return p;
    }
  }
  return context.random.pick(VM_PROFILES);
}

export function generateVMRuntime(result: CompilationResult, context: TransformContext): string {
  const profile = selectVMProfile(context);
  const vmCode = profile.generateRuntime(result, context);

  const stringPoolCode = generateStringPool(context);
  if (stringPoolCode) {
    return dedupeEmptyLocalTables(stringPoolCode + "\n" + vmCode);
  }
  return vmCode;
}
