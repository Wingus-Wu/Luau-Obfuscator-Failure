import { ProfileA, ProfileB, ProfileC, ProfileD, ProfileE } from "./index.js";
import { generateStringPool } from "./base.js";
import { dedupeEmptyLocalTables } from "../../strings/decoder.js";
export const VM_PROFILES = [
    new ProfileA(),
    new ProfileB(),
    new ProfileC(),
    new ProfileD(),
    new ProfileE(),
];
export function selectVMProfile(context) {
    const profileName = context.config.vmProfile;
    if (profileName && profileName !== "random") {
        for (const p of VM_PROFILES) {
            if (p.name === profileName)
                return p;
        }
    }
    return context.random.pick(VM_PROFILES);
}
export function generateVMRuntime(result, context) {
    const profile = selectVMProfile(context);
    const vmCode = profile.generateRuntime(result, context);
    const stringPoolCode = generateStringPool(context);
    if (stringPoolCode) {
        return dedupeEmptyLocalTables(stringPoolCode + "\n" + vmCode);
    }
    return vmCode;
}
