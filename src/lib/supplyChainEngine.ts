/* ===========================================================================
   Supply-chain defense engine — the interactive for Ch.15 (Security).

   Premise: Node "trusts any code it is asked to run" (Node Security Policy),
   so your dependency tree IS your attack surface. The 2025–26 wave of npm
   worms and hijacks (Shai-Hulud, the debug/chalk compromise, the Axios
   compromise, provenance-attested malware) proved no SINGLE control is enough.
   This widget toggles real defenses against real attack classes and shows that
   only LAYERED defense leaves nothing exposed.

   For each attack we record:
     stoppedBy   — defenses that PREVENT it outright (status → "blocked")
     containedBy — defenses that limit blast radius if it runs (→ "contained")
   Status = blocked if any stoppedBy is active, else contained if any
   containedBy is active, else exposed.

   The mappings below reflect how each real mechanism actually behaves — most
   importantly that PROVENANCE proves origin, not intent, so it does NOT stop a
   maintainer who publishes attested malware. The permission-model half is
   anchored to a real Node in scripts/node-truth-security.mjs / test-security.ts
   (the stable --allow-* scopes; granting fs.read grants only fs.read).
   =========================================================================== */

export type Defense =
  | "lockfile"
  | "ignoreScripts"
  | "cooldown"
  | "provenance"
  | "audit"
  | "permission";

export interface DefenseMeta {
  id: Defense;
  label: string;
  /** The concrete command/flag/setting. */
  how: string;
  /** One line: what it actually does. */
  detail: string;
}

export const DEFENSES: DefenseMeta[] = [
  {
    id: "lockfile",
    label: "Lockfile + npm ci",
    how: "package-lock.json · npm ci",
    detail: "Pin exact versions with integrity hashes and install only what's locked — no silent jump to a hijacked new version.",
  },
  {
    id: "ignoreScripts",
    label: "Block install scripts",
    how: "npm ci --ignore-scripts",
    detail: "Stop pre/post-install lifecycle scripts from running — the #1 execution vector for npm worms.",
  },
  {
    id: "cooldown",
    label: "Release-age cooldown",
    how: "pnpm minimumReleaseAge (≥1 day)",
    detail: "Refuse versions published in the last N days; most malicious releases are caught and unpublished within hours.",
  },
  {
    id: "provenance",
    label: "Require provenance",
    how: "Trusted Publishing · Sigstore",
    detail: "Verify a package was built by a known CI pipeline from a known commit — proves ORIGIN, not that the code is safe.",
  },
  {
    id: "audit",
    label: "Audit / CVE gate",
    how: "npm audit · scanner in CI",
    detail: "Fail the build on dependencies with known, disclosed vulnerabilities.",
  },
  {
    id: "permission",
    label: "Permission model",
    how: "node --permission --allow-fs-read=…",
    detail: "Least privilege at runtime: deny fs / child_process / worker unless explicitly granted — a seat belt that contains damage.",
  },
];

export type AttackStatus = "blocked" | "contained" | "exposed";

export interface Attack {
  id: string;
  title: string;
  /** A real, named 2025–26 example. */
  real: string;
  blurb: string;
  stoppedBy: Defense[];
  containedBy: Defense[];
  /** A pointed teaching note shown with the result. */
  note: string;
}

export const ATTACKS: Attack[] = [
  {
    id: "compromised-popular",
    title: "Hijacked popular package",
    real: "debug/chalk (Sep 2025) · Axios (Mar 2026)",
    blurb: "A maintainer account is phished and a new, malicious version of a hugely popular package is published.",
    stoppedBy: ["cooldown", "lockfile"],
    containedBy: ["permission", "ignoreScripts", "audit"],
    note: "A lockfile keeps you off the new version on npm ci; a release-age cooldown skips it until it's pulled. Provenance does NOT help — the version is signed by the real pipeline.",
  },
  {
    id: "postinstall-worm",
    title: "Self-spreading install-script worm",
    real: "Shai-Hulud worm (2025)",
    blurb: "A compromised package ships a postinstall script that steals tokens and republishes itself into packages you maintain.",
    stoppedBy: ["ignoreScripts", "cooldown"],
    containedBy: ["permission"],
    note: "--ignore-scripts stops the payload from ever executing; the permission model denies it the fs/child_process/net access it needs to exfiltrate and spread.",
  },
  {
    id: "provenance-evading",
    title: "Attested malware",
    real: "‘wave-four’ attested packages (2026)",
    blurb: "A real maintainer publishes malware through a legitimate CI pipeline, so it carries valid provenance.",
    stoppedBy: ["cooldown"],
    containedBy: ["permission", "audit", "ignoreScripts"],
    note: "The whole point of this class: provenance is satisfied. Origin ≠ intent. Only a cooldown (time for it to be reported) and runtime least-privilege help.",
  },
  {
    id: "typosquat",
    title: "Typosquatted dependency",
    real: "reqeusts, crossenv, … (ongoing)",
    blurb: "You (or a tool) install a look-alike name; the impostor package runs malicious code.",
    stoppedBy: ["cooldown"],
    containedBy: ["permission", "ignoreScripts"],
    note: "Best stopped before install by verifying the name; a cooldown catches brand-new impostors and least-privilege contains one that slips through.",
  },
  {
    id: "known-cve",
    title: "Dependency with a known CVE",
    real: "any unpatched advisory",
    blurb: "You ship a version with a publicly disclosed, exploitable vulnerability.",
    stoppedBy: ["audit"],
    containedBy: ["permission"],
    note: "This is the one an audit/CVE gate is actually for — it won't catch zero-day supply-chain malware, which is why you need the other layers too.",
  },
];

export function evaluate(attack: Attack, active: ReadonlySet<Defense>): AttackStatus {
  if (attack.stoppedBy.some((d) => active.has(d))) return "blocked";
  if (attack.containedBy.some((d) => active.has(d))) return "contained";
  return "exposed";
}

export function evaluateAll(active: ReadonlySet<Defense>): { attack: Attack; status: AttackStatus }[] {
  return ATTACKS.map((attack) => ({ attack, status: evaluate(attack, active) }));
}

export interface SupplyScore {
  blocked: number;
  contained: number;
  exposed: number;
}

export function score(active: ReadonlySet<Defense>): SupplyScore {
  const s: SupplyScore = { blocked: 0, contained: 0, exposed: 0 };
  for (const { status } of evaluateAll(active)) s[status]++;
  return s;
}

/* ---- Permission model: the STABLE --allow-* scopes (verified on Node 22 LTS).
   Network permission (--allow-net) is intentionally absent — it is still
   experimental and is NOT part of this set. Asserted live in test-security.ts. */
export const STABLE_ALLOW_FLAGS: string[] = [
  "--allow-fs-read",
  "--allow-fs-write",
  "--allow-child-process",
  "--allow-worker",
  "--allow-addons",
  "--allow-wasi",
];
export const NET_PERMISSION_EXPERIMENTAL = true;
