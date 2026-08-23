# Strong Luau Obfuscator — Design & Architecture

> Status: **design draft for review — no code changed.**
> Author: produced after a full audit of the current `src/transforms/*`.
> Scope: a redesign that aims for actual resistance against a capable Luau RE,
> not the current "rename + junk" baseline (currently ~1/10, partly because
> several transforms are *broken* on top of being weak).

This document is deliberately concrete: which opcodes a VM would model, how
string encryption actually works without a crypto lib, what the threat model
realistically can and cannot promise, and a phased plan that fixes the broken
foundation before building the strong layer.

---

## 0. Honest context: where the current codebase actually is

Before designing the target, the audit that motivates it (evidence lines from
the current sources):

- `strings/protect.ts:304-307` — the **base64** "decoder" returns
  `game.GetService(input)` and does not decode base64 at all. XOR/reverse
  decoders are logically correct but emit `..=`, which the lexer cannot
  tokenize. All four strategies are *encoding* (single-byte XOR = 256
  brute-force; reverse/base64 trivial), not encryption.
- `antiTamper/inject.ts:59,62` vs `66-67` — verify reads bare `_at_map`/
  `_exp_map`; the variables are declared as `_at_map_<rand>`/`_exp_map_<rand>`,
  so the compare is `nil ~= nil` → never trips. Even with names fixed,
  `:88` (`serializeFunction`) hashes only `JSON.stringify(body.map(s=>s.kind))`
  and the runtime recomputes the *same* stored constant → would always pass.
- `controlflow/flatten.ts` — correct *concept* (state-machine dispatcher) but
  bails on any nested function / return-in-loop and only fires at
  `nextBool(0.4)`; emits `+=` which breaks its own output. Rarely triggers.
- The **lexer has no `+= -=' *=' /= ..= ' ^=' %='` tokens** — one root cause
  that breaks three transforms' output and any source using `x += y`.
- No VM/no virtualization exists (`functionsVirtualized` is always 0); no
  function-transform subsystem; dead code is uniform obvious junk.
- Source files are minified to a single line; nothing runs under a real Luau
  runtime in CI — the only "validation" is the obfuscator re-parsing its own
  output, which is what lets the broken decoders & `+=` emissions ship unseen.

**Takeaway:** the redesign must ship a correctness oracle (Phase 0) or the same
class of "emits invalid Luau, ships anyway" failures will recur under us.

---

## 1. Goals & non-goals

### Goals
1. Produce obfuscated Luau that **actually runs** in Roblox (today it often does
   not — base64 decoder errors, `+=` etc.).
2. Raise manual reverse-engineering cost by an order of magnitude vs today,
   and defeat *automated* deobfuscators (string dumpers, control-flow
   recovery, known-VM signature matchers).
3. Keep per-build output structurally distinct (per-seed) so a signature from
   one build does not key any other build.
4. Deterministic given a seed (reproducibility for the user), while being
   useless to statically understand without that build's runtime state.

### Non-goals (said out loud)
- We do **not** promise un-recoverability vs a determined reverser with full
  dynamic access to an executor. If someone can run the code, they can
  ultimately observe every string/value the program touches and dump VM state.
  Obfuscation raises cost and time-to-recover; it is not DRM.
- We do **not** obfuscate code we cannot meaningfully parse/transform. Luau
  constructs the parser can't yet handle (`+=`, type annotations round-trip,
  some `export type` variants) must be parser-completed first (Phase 0) or
  skipped cleanly with a warning — never silently emitted broken.

---

## 2. Threat model

### Adversary capabilities (rough ordering of power)
- **L1 casual reader**: opens the file in an editor, reads source. *Current
  tool already defeats this.* This is not the bar.
- **L2 script-kiddie tooling**: runs a generic Lua string-extractor / constant
  dumper / "deobfuscator" script written for the *known* public obfuscators
  (MoonSec-style, IronBrew-Lua, PSU). These target **fixed** dispatch shapes
  and known handlers. Per-build structural variation + custom opset defeats them.
- **L3 competent reverser, static only**: reads the dumped VM and dispatch
  table by hand, recovers constants by symbolic reasoning through opaque
  predicates. Cost: hours-to-days per non-trivial function with a real VM.
- **L4 competent reverser, dynamic**: hooks `string.gsub`/`DebugId`, dumps
  every string the program decodes, dumps VM register state per op. This is
  where we **lose in the limit** — see non-goals. The goal is to make L4 *not*
  L2/L3EZ: per-op-handler inlining, runtime-rebuilt dispatch tables, and
  corruption-on-tamper (not detect-and-bail) keep L4 from being a 5-minute
  script.

### Adversary goals we break
- "Open the file and read the original logic" — broken by virtualization (#7).
- "Grep for `print(\"…\")` and recover strings" — broken by real encryption
  + lazy/VM-resident decode (#2).
- "Spot the junk" — broken by type-valid, reachable-via-opaque-predicate junk
  (#5).
- "Recognize the obfuscator and run a published deobfuscator" — broken by
  per-build opcode mapping + dispatch-rotation (#7).
- "Patch out the anti-tamper `if … return`" — broken by making tamper-yield =
  *silent corruption later* rather than an obvious bail (#8).

### Adversary goals we accept losing
- "Observe the running program and dump values at use time." — only randomized
  + delayed (dumps still possible, just now you must trace), never eliminated.
- "Recover perfect original source." — we never had it; we only ship bytecode.



---

## 3. Overall architecture

```
        Luau source
            │
            ▼
   Parser (L0-completed: +=, type ann roundtrip)
            │  AST
            ▼
   Semantic analyzer (scopes, free globals, externals set)
            │
            ▼
   ┌──────────── Selection pass ────────────┐
   │ for each function decide:              │
   │   - traditional transforms (cheap path)│
   │   - virtualize (VM path; hot/lootable) │
   └────────────────────────────────────────┘
            │
   ┌────────┴─────────┐
   ▼                  ▼
Trad pipeline     Compiler (AST→IR→bytecode)
- string crypto   ▼
- encrypt consts  Encoder (encrypt bytecode, emit opset)
- flatten shells  ▼
- MBA/func xform   Emit VM interpreter + runtime tables
- smart junk
- anti-tamper
   ▼                         ▼
            └──► Generator (single source of truth for valid Luau emission)
                  ▼
                 Obfuscated output
                  ▼
            Validation oracle (luau CLI) — Phase 0
```

Key structural change vs today: today we do `AST → mutate → emit`. The VM path
must do `AST → IR → bytecode → emit(interpreter + blob)` — i.e. the generated
output for virtualized functions contains **no AST-level equivalent at all**,
only a bytecode payload and a Luau interpreter that executes it. This is exactly
the "change the representation" point: there is no `if … then` in the shipped
code for a virtualized function; the original `if` is now two opcodes and a
data transition.

---

## 4. Layer 7 — Virtualization (the keystone)

This is the layer the current project is missing entirely and the one that
delivers the biggest jump.

### 4.1 Register-based VM, not stack-based
Follow real Luau (register-based): `a = b op c` encodes in a single
instruction rather than push/pop/getfield sequences. Fewer ops = smaller blob =
faster = less surface. Each function gets a register file sized to max locals +
temporaries (SSA→linear-scan during compile, reduced to slots).

### 4.2 Opcode set (canonical, before per-build permutation)

Modeled on what we actually need to execute Luau, not contrived. ~40 opcodes:

| Group | Opcodes |
|---|---|
| Move/load | `MOVE rdst rsrc` · `LOADK rdst kidx` · `LOADNIL r` · `LOADBOOL r bool` · `GETUPV r uidx` · `SETUPV uidx r` |
| Globals/env | `GETGLOBAL r kidx` · `SETGLOBAL kidx r` · `GETFIELD r obj kidx` (obj.name) · `SETFIELD kidx obj r` · `GETTABLE r obj rk rk` · `SETTABLE obj rk rk r` · `SELF rk obj kidx` (rebind `self` for `a:b()`) |
| Table | `NEWTABLE r narr nrec` · `NEWTABLEK r kidx` (table literal) |
| Arithmetic | `ADD/SUB/MUL/DIV/MOD/POW/IDIV r lhs rhs` · `UNM/UNNOT/ULEN r v` · `CONCAT r lhs rhs` (`..`) |
| Compare | `EQ/LT/LE skip lhs rhs` (skip=label if false) · `TEST r trueskip bool` (`if x then`) |
| Control | `JMP kidx` (label in transition table) · `CALL rdst rk nargs nrets` · `TAILCALL r rk nargs` · `RETURN rbase n` · `VARARG r n` |
| Loops | Numeric & generic for lower to `counter + compare + JMP` (no dedicated FORPREP; keeps opset smaller, hashes vary less) |
| Closures | `CLOSURE r pidx` · `BINDCAP uidx rsrc` |
| Assertion | `ASSERT r kmsg` (anti-tamper trip folds here; §8) |

Notes:
- "kidx" indexes the function's **constant pool**; constants are strings,
  numbers, booleans, nil, *and* field names like `"GetService"`,
  `"UserInputType"`.
- That dedup lets #2/#3 encrypt the *whole pool* at once — `"game"`,
  `"GetService"`, `"MouseButton1"` never appear as literals; they live only
  inside the encrypted pool, decoded lazily and transiently.
- `JMP kidx` jumps to a **label index in a per-function transition table**, not
  an absolute offset — this is what flattening + randomization manipulate.

### 4.3 Per-build opcode permutation (de-anonymization resistance)
At build time generate a bijection `perm: canonical → uint16` (seed-derived).
Bytecode stores permuted ids; nothing called `ADD` exists in the blob. The
dispatch table maps `permuted_id → handler`. So a grep/signature for `ADD`
matches nothing. Without this build's `perm` + dispatch table, the blob is
opaque even byte-for-byte, and a signature from one build keys no other.

### 4.4 Dispatch
- **Layer A (function entry):** `optable[perm]` is rebuilt at runtime from
  scrambled fragments (§4.5), not present as a tidy literal array.
- **Layer B (per-op):** for a rotating subset of opcodes, dispatch via a small
  unrolled/inlined block rather than the table, and every `N` ops apply a
  bijection to `optable` ("opcode rotation"). A deobfuscator that snapshots the
  table once gets a stale view.

Avoid a giant `if op == 0x12 then …` chain (trivially patched). Emit table
dispatch: `local h = optable[op]; regs = h(regs, proto, kpool)`. Each `h` is a
closure whose body is itself individually transformed (constants folded into
the VM, identifiers hashed), so extracting one handler yields one opaque fn.

### 4.5 Bytecode encoding & transport
- Serialized as a **byte string** (one `local _bc = "…escaped bytes…"`), read via
  `string.byte`. Compact + lets §8 hash raw bytes for anti-tamper.
- **Encrypted** with a runtime-reconstructed key: `key = K(seed, env)` where the
  seed is split into ~6 fragments, XOR-folded with the CRC of the VM source
  (so editing handlers changes decryption → tamper). Decrypt-once into a
  module-local; the cleartext blob never exists as a literal.
- Prototypes stored inline; `CLOSURE r pidx` materializes nested functions.

### 4.6 Selection pass (which functions to virtualize)
Virtualize hot/lootable / high-statement-count / functions with secret logic.
Cheap leaf functions can stay traditional to keep output size sane. Pure
transform glue already inserted by other layers should not be double-virtualized.

### 4.7 What virtualization kills that flattening (#4) cannot
Real flattening rewrites control flow but leaves the *operations* visible
(`game:GetService`, `print`, arithmetic). Virtualization turns operations into
data too — `GetService` is `kidx 5`, recovered only by running the pool decoder.
So #7 subsumes much of #2/#3/#4 *inside* virtualized functions; the traditional
layers then focus on functions we didn't virtualize + the VM shell.

---

## 5. Traditional layers (non-virtualized functions + VM shell)

These run on the AST for everything we don't send through the compiler.

### Layer 2 — Real string **encryption** (not encoding)
- Roblox has no crypto builtin, so ship a compact pure-Luau stream cipher in
  the VM shell: implement the **ChaCha8 quarter-round** (4 rounds, ~40 lines)
  with a 256-bit key and 64-bit nonce. That is a real cipher — not single-byte
  XOR / reverse / base64. Cost: ~µs per string; fine because decode is *lazy*.
- Key is **reconstructed at runtime** from split fragments XOR-folded with the
  CRC of the decoder body (see §4.5 motif) so editing the decoder changes the
  key → decryption yields garbage → tamper signal.
- Strings are decoded **lazily** at first use (memoized in a module-local),
  transient-window-minimized. No literal `"…"` appears anywhere; only the
  encrypted blob does.
- For virtualized functions, strings live in the encrypted constant pool → no
  separate decoder path needed; the opcode `LOADK` decrypts the entry it reads.

### Layer 3 — Constant **encryption**
- Numeric literals → opaque runtime expression: `n → ((seed * A) ^ p) ... )`,
  or stored in the encrypted constant pool. No `123` literal ships plaintext;
  it's reconstructed at runtime and asserted.
- Same memoized-lazy decode shape as Layer 2.

### Layer 4 — Control-flow flattening (real, always triggers)
- Each non-virtualized function → `while true do s = TRANS[s]() end` dispatcher
  with state IDs randomized per build and a transition table. Compare to the
  current `flatten.ts`, which bails on nested funcs / return-in-loop and only
  fires at 40% — here we **handle** returns/break (via state-tagged returns)
  so it triggers on essentially every function, not 0.4×eligible.
- **Opaque predicates** drive bogus transitions: `I(x,y) = (x²·7 ≡ y²·A)`
  algebraic always-false embedded via a runtime CRC, so they look
  data-dependent but are never taken.
- Inside virtualized functions this layer is largely redundant (the VM is the
  dispatcher); it's the right tool for the VM shell + traditional functions.

### Layer 5 — Smart dead code
Replace the current `_abc = <number>` obvious junk with:
- **Type-valid embedded junk**: real unused functions computing plausible
  results via actual library calls (never called).
- **Reachable-but-dead**: `if opaque_false then <real-looking body> end`.
- **Clone-and-mutate**: duplicate a real function with perturbed constants,
  never referenced. Indistinguishable at a glance from real logic.

### Layer 6 — Function transformation
- **MBA (mixed boolean arithmetic)**: `a + b → (a ~ b) + 2*(a & b)` — equivalent,
  hard to fold back. Same for `*`, `-`, comparisons where bitwidths allow.
- **Encode-on-call**: rewrite `f(x)` as `f'((x − k))` with `k` restored inside;
  callers and body agree via the constant pool, recoverable only after VM
  decoding.
- **Outline/inline blending**: split a function into sub-fn segments called via
  the transition table; rebalance per build so call graphs differ across builds.

### Layer 1 — Identifiers
- Hexlike `_0x7A`, scope-hash-derived names (not sequence — so re-runs differ),
  optional Unicode confusables. **Member names** (`.GetService`,
  `Enum.UserInputType.MouseButton1`) are NOT renamable (externals) → they go into
  the VM constant pool, so they also stop appearing plaintext. So L1's real win
  beyond today is "externals stop being visible", which is delivered by the VM.

### Layer 8 — Anti-tamper (must actually work)
This replaces the broken `_at_map`/`_exp_map`+`serializeFunction` mess. Spec:
- Integrity is computed **over the real emitted bytecode blob** at load: the
  blob is a string in the output, so the verifier hashes actual
  `string.byte(blob, i)` segments and compares to *different* precomputed
  values stored from the **compiler** (not a re-hash of the same stored data —
  that's the current bug: `nil ~= nil`/same-vs-same).
- **Corrupt-on-tamper, not detect-and-bail.** On mismatch the verifier does
  *not* `return` (obvious); it silently poisons a value later execution
  depends on, so tampering yields a confusing failure 100s of ops downstream —
  far harder to trace back to the trip.
- The dispatch table (§4.4) is rebuilt from a source that was hashed; tampering
  the handlers makes the VM silently produce wrong results, the strongest form.
- Concrete fixes folded in: name-mismatch gone (single module-local names), the
  hash is over real bytes not over `body.map(s=>s.kind)`.

---

## 6. Resistance to real deobfuscators

Public Luau VM-deobfuscators (MoonSec-style, IronBrew-Lua, PSU) attack by:
1. **Signature-matching the dispatch loop** → fix a known shape.
2. **Constant-folding the opcode/transition table** to recover `perm`.
3. **Symbolizing handlers** and lifting bytecode to a real IR.

We resist each:
- (1) Per-build **structurally different** dispatch loops (handler order,
  register vs tuple-pass, inlining vary per seed) — no fixed signature.
- (2) Dispatch table **not present as a literal**; rebuilt at runtime from
  scrambled fragments + **rotates every N ops** → a single snapshot is stale.
- (3) Handlers individually obfuscated (their own constants encrypted, MBA in
  arithmetic), plus **opaque anti-constant-flush** pads (insertions that break
  naive symbolic execution without changing semantics).
- The constant pool is behind lazy decrypt, so a static lifter can't even read
  symbol names/field strings without running it.

A capable human (L4) can still win given time; our target is that their only
path is **dynamic** (run + trace), and even that is degraded by per-op
inlining + corruption-on-tamper (patching one handler out crashes the program
cryptically 100s of ops later, not with an obvious "protection" signal).

---

## 7. Validation harness (the missing oracle)

The single most important non-feature decision: **stop self-re-parsing as the
only "validation."** That is precisely how the broken base64 decoder and
`+=`/`..=` emissions shipped. Required:

- Add the **official `luau` CLI** (open-source, from Roblox) to CI as the
  functional oracle: emit obfuscated `.luau`, run it on a battery of inputs,
  assert observable behavior equals the un-obfuscated run.
- Build a **behavioral corpus**: `{input, expected-print-output}` pairs covering
  globals, member access (`Enum.X.Y`), method calls, string concat, loops,
  closures/upvalues, varargs, multi-return, error paths. Every phase keeps this
  green or it does not merge.
- A differential fuzzer: random Luau snippets → obfuscate → run both, assert
  equal outputs. Catches representation bugs across transforms + VM.
- The existing round-trip "re-parse output" check stays as a **cheap sanity**
  layer only, never the gate.

This alone moves us from "looks obfuscated but doesn't run" to "guaranteed
semantics-preserving."

---

## 8. Phased roadmap

Each phase merges green-corpus and compiles; no phase lands broken.

- **Phase 0 — Correctness baseline (prerequisite).** Complete the parser:
  `+= -= *= /= %= ..= ^= &= |=` lexer tokens + AST `CompoundAssignment`; make
  type-annotation + `export type` round-trip; fix the Generator's `undefined`
  leak for `Connect(function…end)` bodies. Add the `luau`-CLI corpus harness.
  *Outcome: today's output actually runs; real validation exists.*
- **Phase 1 — Real string encryption** (ChaCha8 in pure Luau, lazy, runtime key).
  Replace the four encoding strategies; the base64/`game.GetService` decoder
  bug is deleted with the old code.
- **Phase 2 — Real control-flow flattening** that triggers on all functions
  (state-tagged returns/break) + opaque predicates; remove the 40%/guard bail.
- **Phase 3 — VM foundation.** Register interpreter, fixed canonical opcode
  set (§4.2), AST→IR→bytecode compiler, virtualize simple numeric/string
  functions end-to-end. No hardening yet.
- **Phase 4 — VM hardening.** Per-build `perm`, encrypted bytecode, runtime
  rebuilt + rotating dispatch table, opcode permutation.
- **Phase 5 — Anti-tamper rewrite** (hash real blob, corrupt-on-tamper).
- **Phase 6 — MBA + function transforms, smart dead code, identifier polish.**
  Integration, per-build structural variance, corpus pass, presets per level.

Phase 0 is *not optional fluff* — it is the floor the rest stands on. Skipping
it (building a VM on top of a lexer that can't read `+=` and a generator that
emits `undefined`) would reproduce the current failure mode at greater cost.

---

## 9. Risks & open questions (for your call)

1. **VM output size.** A per-function interpreter + blob inflates size ~3–8×.
   Need a knob: virtualize only the top-K hot/lootable functions; the rest stay
   traditional. Threshold TBD.
2. **Runtime perf.** Pure-Luau ChaCha8 + register-VM dispatch are µs-to-ms
   scales; for hot loops this matters. Measure on representative workloads and
   let "extreme" presets accept the cost, "medium" defer virtualization of hot loops.
3. **Roblox sandbox limits.** `string.byte` over large blobs, closure caps,
   instruction-count throttling — confirm the VM shell stays under the caps of
   the user's target context.
4. **Maintenance of minified files.** The current `src/transforms/*` are
   one-liners, which is why nothing caught the bugs. Un-minify (or at least
   1-stmt-per-line) before Phase 0; it costs nothing and makes review possible.
5. **Explicit threat-model ceiling** (non-goal §1): a reverser who can run the
   code can always observe values at use-time. We raise cost and force *dynamic*
   recovery; we don't make it impossible. If secrecy-at-rest against a full
   runtime attacker is required, obfuscation is the wrong tool — the answer is
   server-side logic.

---

## Appendix A — Cross-reference: current bugs this design obsoletes

| File:line | Current bug | Removed by phase |
|---|---|---|
| `strings/protect.ts:304-307` | base64 "decoder" returns `game.GetService(input)` | Phase 1 (file replaced) |
| `strings/protect.ts` xor/reverse | emit `..=` the lexer can't read | Phase 0 + Phase 1 |
| `antiTamper/inject.ts:59,62 vs 66-67` | bare `_at_map`/`_exp_map` vs suffixed decls → `nil ~= nil` never trips | Phase 5 |
| `antiTamper/inject.ts:88` | hashes only `body.map(s=>s.kind)` vs itself | Phase 5 |
| `controlflow/flatten.ts` | bails on nested/return + 40% + emits `+=` | Phase 2 + Phase 0 |
| `parser/lexer.ts` `MULTI_CHAR_TOKENS` | no `+= -= *= /= %= ..= ^=` tokens | Phase 0 |
| `generator/*` | emits `undefined` for some callback bodies | Phase 0 |
| `transforms/index.ts` | no virtualizer exists | Phase 3–4 |

Open to adjusting scope/order before I touch any code — tell me what to change.