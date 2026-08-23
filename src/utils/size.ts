/** Cheap structural size estimate for AST / nested values (not pretty-printed source). */
export function estimateNodeSize(node: unknown): number {
  if (node == null) return 0;
  const t = typeof node;
  if (t === "string") return (node as string).length;
  if (t === "number" || t === "boolean") return 8;
  if (Array.isArray(node)) {
    let n = 0;
    for (let i = 0; i < node.length; i++) n += estimateNodeSize(node[i]);
    return n;
  }
  if (t === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj.code === "string" && obj.kind === "RawStatement") {
      return obj.code.length;
    }
    let n = 0;
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      n += estimateNodeSize(obj[key]);
    }
    return n;
  }
  return 0;
}
