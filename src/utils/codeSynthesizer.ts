import { LANGUAGES, SnippetItem, SnippetLength } from '@/constants/languages';

export function pick<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function createSeededRandom(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DomainContext {
  domain: string;
  entity: string;
  Entity: string;
  action: string;
  Action: string;
  collection: string;
  keyVar: string;
  valVar: string;
  errCode: string;
  limitNum: number;
  primeHex: string;
  timeoutMs: number;
  statusOk: string;
}

const DOMAINS = [
  {
    domain: 'cache',
    entities: ['entry', 'shard', 'bucket', 'segment', 'slot', 'page', 'frame', 'block'],
    actions: ['evict', 'hydrate', 'lookup', 'compact', 'promote', 'invalidate', 'snapshot', 'prefetch'],
    collections: ['lruMap', 'ringBuffer', 'slabPool', 'hashTable', 'pageIndex', 'HotTier'],
    keys: ['cacheKey', 'shardId', 'nsPrefix', 'slotHash', 'pageAddr', 'digestKey'],
    vals: ['payload', 'serialized', 'byteSlice', 'cachedRef', 'blob', 'record'],
    errs: ['ERR_CACHE_MISS', 'ERR_SLAB_FULL', 'ERR_STALE_EPOCH', 'ERR_SHARD_LOCKED'],
  },
  {
    domain: 'network',
    entities: ['packet', 'socket', 'stream', 'frame', 'channel', 'session', 'tunnel', 'peer'],
    actions: ['dispatch', 'multiplex', 'handshake', 'throttle', 'acknowledge', 'route', 'relay', 'drain'],
    collections: ['peerPool', 'outboxQueue', 'ingressRing', 'routeTable', 'connRegistry', 'frameBuf'],
    keys: ['peerId', 'streamId', 'seqNum', 'routeKey', 'socketFd', 'traceId'],
    vals: ['frameBytes', 'datagram', 'headerMap', 'chunkData', 'ackPacket', 'envelope'],
    errs: ['ERR_CONN_RESET', 'ERR_BACKPRESSURE', 'ERR_TLS_HANDSHAKE', 'ERR_TIMEOUT_EXCEEDED'],
  },
  {
    domain: 'auth',
    entities: ['token', 'session', 'principal', 'claim', 'grant', 'credential', 'policy', 'scope'],
    actions: ['verify', 'introspect', 'rotate', 'revoke', 'elevate', 'sign', 'attest', 'decrypt'],
    collections: ['keySet', 'claimStore', 'revocationList', 'aclMatrix', 'sessionVault', 'nonceSet'],
    keys: ['subjectId', 'kidHeader', 'tenantId', 'nonceHash', 'sessionKey', 'policyArn'],
    vals: ['jwtPayload', 'signature', 'digestBuf', 'grantScope', 'authContext', 'claims'],
    errs: ['ERR_TOKEN_EXPIRED', 'ERR_INVALID_SIGNATURE', 'ERR_SCOPE_DENIED', 'ERR_NONCE_REPLAY'],
  },
  {
    domain: 'database',
    entities: ['cursor', 'transaction', 'tuple', 'walRecord', 'indexNode', 'predicate', 'snapshot', 'batch'],
    actions: ['commit', 'checkpoint', 'vacuum', 'materialize', 'scan', 'merge', 'project', 'rebalance'],
    collections: ['btreePage', 'memTable', 'walBuffer', 'dirtyPages', 'txRegistry', 'rowBatch'],
    keys: ['txId', 'lsnOffset', 'primaryKey', 'pageId', 'partitionKey', 'rowHash'],
    vals: ['tupleData', 'columnVec', 'mutationSet', 'rowSlice', 'indexEntry', 'deltaLog'],
    errs: ['ERR_DEADLOCK_DETECTED', 'ERR_SERIALIZATION_FAILURE', 'ERR_WAL_CORRUPT', 'ERR_PAGE_SPLIT'],
  },
  {
    domain: 'scheduler',
    entities: ['task', 'fiber', 'job', 'worker', 'quota', 'deadline', 'ticket', 'future'],
    actions: ['enqueue', 'steal', 'preempt', 'resume', 'yieldNow', 'poll', 'cancel', 'prioritize'],
    collections: ['runQueue', 'minHeap', 'workerPool', 'parkedFibers', 'timerWheel', 'waitGraph'],
    keys: ['taskId', 'workerIdx', 'priorityKey', 'epochTick', 'jobHandle', 'affinityMask'],
    vals: ['taskState', 'wakerRef', 'execResult', 'timeSlice', 'contextFrame', 'budget'],
    errs: ['ERR_QUEUE_SATURATED', 'ERR_DEADLINE_MISSED', 'ERR_WORKER_PANIC', 'ERR_CANCELED'],
  },
  {
    domain: 'compiler',
    entities: ['astNode', 'symbol', 'token', 'irBlock', 'regAlloc', 'typeVar', 'span', 'opcode'],
    actions: ['unify', 'lower', 'inline', 'foldConstants', 'typecheck', 'emit', 'resolve', 'lex'],
    collections: ['symbolTable', 'workList', 'cfgBlocks', 'liveRanges', 'diagBag', 'constPool'],
    keys: ['nodeId', 'defIndex', 'scopeDepth', 'varSymbol', 'blockLabel', 'spanStart'],
    vals: ['inferredType', 'irInstr', 'bytecode', 'constraint', 'operand', 'binding'],
    errs: ['ERR_TYPE_MISMATCH', 'ERR_UNRESOLVED_SYMBOL', 'ERR_CYCLE_DETECTED', 'ERR_REGISTER_SPILL'],
  },
];

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildContext(rng: () => number): DomainContext {
  const d = pick(DOMAINS, rng);
  const entity = pick(d.entities, rng);
  const action = pick(d.actions, rng);
  const collection = pick(d.collections, rng);
  const keyVar = pick(d.keys, rng);
  const valVar = pick(d.vals, rng);
  const errCode = pick(d.errs, rng);
  const limitNum = pick([16, 32, 64, 128, 256, 512, 1024, 4096], rng);
  const primeHex = pick(['0x9E3779B9', '0x5DEECE66D', '0x85EBCA6B', '0xC2B2AE35', '0x27D4EB2D'], rng);
  const timeoutMs = pick([150, 250, 500, 1200, 2500, 5000], rng);
  const statusOk = pick(['READY', 'COMMITTED', 'VERIFIED', 'ACTIVE', 'SYNCED'], rng);

  return {
    domain: d.domain,
    entity,
    Entity: cap(entity),
    action,
    Action: cap(action),
    collection,
    keyVar,
    valVar,
    errCode,
    limitNum,
    primeHex,
    timeoutMs,
    statusOk,
  };
}

// ============================================================================
// SHORT BLUEPRINTS (3 to 5 lines — crisp, meaningful guards & helpers)
// ============================================================================

// ============================================================================
// BEGINNER BLUEPRINTS (1 to 4 lines — extreme basics for learning)
// ============================================================================
function genBeginnerBlock(family: string, variant: number): string {
  const py = [
    'print("Hello World")',
    'def calculate(a, b):\n    return a + b',
    'def say_hello(name):\n    print(f"Hi {name}")',
    'for i in range(5):\n    print(i)'
  ];
  const rs = [
    'fn main() {\n    println!("Hello World");\n}',
    'fn calculate(a: i32, b: i32) -> i32 {\n    a + b\n}',
    'fn is_even(num: i32) -> bool {\n    num % 2 == 0\n}'
  ];
  const go = [
    'func main() {\n    fmt.Println("Hello World")\n}',
    'func calculate(a int, b int) int {\n    return a + b\n}',
    'func isEven(n int) bool {\n    return n % 2 == 0\n}'
  ];
  const ts = [
    'console.log("Hello World");',
    'function calculate(a: number, b: number) {\n  return a + b;\n}',
    'const name = "DevType";\nconsole.log(name);',
    'function isEven(num: number) {\n  return num % 2 === 0;\n}'
  ];
  
  if (family === 'python') return py[variant % py.length];
  if (family === 'rust') return rs[variant % rs.length];
  if (family === 'go') return go[variant % go.length];
  return ts[variant % ts.length];
}

function genShortBlock(family: string, c: DomainContext, variant: number): string {
  if (family === 'python') {
    const templates = [
      `def ${c.action}_${c.entity}(${c.keyVar}: str, limit: int = ${c.limitNum}) -> bool:\n    if not ${c.keyVar} or len(${c.keyVar}) > limit:\n        raise ValueError("${c.errCode}")\n    return ${c.keyVar}.startswith("${c.domain}_")`,
      `def compute_${c.entity}_slot(${c.keyVar}: int, mask: int = ${c.primeHex}) -> int:\n    mixed = (${c.keyVar} ^ (mask >> 16)) & 0xFFFFFFFF\n    return mixed % ${c.limitNum}`,
      `async def fetch_${c.entity}(${c.collection}: dict, ${c.keyVar}: str):\n    record = ${c.collection}.get(${c.keyVar})\n    if record is None:\n        raise KeyError("${c.errCode}")\n    return record`,
      `def validate_${c.valVar}(${c.valVar}: bytes, max_bytes: int = ${c.limitNum}) -> memoryview:\n    if len(${c.valVar}) == 0 or len(${c.valVar}) > max_bytes:\n        raise RuntimeError("${c.errCode}")\n    return memoryview(${c.valVar})`,
      `def next_${c.entity}_backoff(attempt: int, base_ms: int = ${c.timeoutMs}) -> int:\n    capped = min(attempt, 8)\n    return base_ms * (1 << capped)`,
    ];
    return templates[variant % templates.length];
  }

  if (family === 'rust') {
    const templates = [
      `pub fn ${c.action}_${c.entity}(${c.keyVar}: &str, max_len: usize) -> Result<usize, &'static str> {\n    if ${c.keyVar}.is_empty() || ${c.keyVar}.len() > max_len {\n        return Err("${c.errCode}");\n    }\n    Ok(${c.keyVar}.len() ^ ${c.limitNum})\n}`,
      `pub fn hash_${c.entity}_key(${c.keyVar}: u64) -> u64 {\n    let mut h = ${c.keyVar}.wrapping_mul(${c.primeHex});\n    h ^= h >> 17;\n    h & (${c.limitNum} - 1)\n}`,
      `pub fn try_${c.action}(${c.collection}: &[u64], limit: u64) -> Option<u64> {\n    ${c.collection}.iter().copied().find(|&val| val > 0 && val <= limit)\n}`,
      `pub const fn align_${c.entity}(offset: usize) -> usize {\n    let mask = ${c.limitNum} - 1;\n    (offset + mask) & !mask\n}`,
      `pub fn verify_${c.valVar}(${c.valVar}: &[u8]) -> Result<&[u8], &'static str> {\n    if ${c.valVar}.len() < 4 { return Err("${c.errCode}"); }\n    Ok(&${c.valVar}[4..])\n}`,
    ];
    return templates[variant % templates.length];
  }

  if (family === 'go') {
    const templates = [
      `func ${c.Action}${c.Entity}(${c.keyVar} string, limit int) (string, error) {\n  if len(${c.keyVar}) == 0 || len(${c.keyVar}) > limit {\n    return "", errors.New("${c.errCode}")\n  }\n  return ${c.keyVar}, nil\n}`,
      `func Compute${c.Entity}Shard(${c.keyVar} uint64) uint64 {\n  mixed := (${c.keyVar} ^ (${c.keyVar} >> 16)) * ${c.primeHex}\n  return mixed % ${c.limitNum}\n}`,
      `func Is${c.Entity}Valid(${c.valVar} []byte) bool {\n  return len(${c.valVar}) > 0 && len(${c.valVar}) <= ${c.limitNum}\n}`,
    ];
    return templates[variant % templates.length];
  }

  if (family === 'sql') {
    const templates = [
      `SELECT ${c.keyVar}, COUNT(*) AS total_${c.entity}\nFROM ${c.domain}_${c.collection}\nWHERE status = '${c.statusOk}' AND latency_ms < ${c.timeoutMs}\nGROUP BY ${c.keyVar}\nHAVING COUNT(*) >= ${Math.min(c.limitNum, 32)};`,
      `UPDATE ${c.domain}_${c.collection}\nSET status = '${c.statusOk}', updated_at = NOW()\nWHERE ${c.keyVar} = $1 AND retry_count < 5\nRETURNING ${c.keyVar}, status;`,
    ];
    return templates[variant % templates.length];
  }

  if (family === 'shell') {
    const templates = [
      `#!/usr/bin/env bash\nset -euo pipefail\nif [[ -z "\${${c.keyVar.toUpperCase()}:-}" ]]; then\n  echo "${c.errCode}: missing ${c.keyVar}" >&2; exit 1\nfi`,
      `for ${c.entity} in $(seq 1 ${Math.min(c.limitNum, 16)}); do\n  curl -fsSL "https://api.internal/${c.domain}/\${${c.entity}}" || exit 1\ndone`,
    ];
    return templates[variant % templates.length];
  }

  // Default TS / JS / C++ / JVM style
  const templates = [
    `export function ${c.action}${c.Entity}(${c.keyVar}: string, limit = ${c.limitNum}): boolean {\n  if (!${c.keyVar} || ${c.keyVar}.length > limit) {\n    throw new Error("${c.errCode}");\n  }\n  return ${c.keyVar}.startsWith("${c.domain}:");\n}`,
    `export const compute${c.Entity}Slot = (${c.keyVar}: number): number => {\n  const mixed = (${c.keyVar} ^ (${c.keyVar} >>> 16)) * ${c.primeHex};\n  return (mixed >>> 0) % ${c.limitNum};\n};`,
    `export function guard${c.Entity}Payload(${c.valVar}: Uint8Array): Uint8Array {\n  if (${c.valVar}.byteLength === 0 || ${c.valVar}.byteLength > ${c.limitNum}) {\n    throw new RangeError("${c.errCode}");\n  }\n  return ${c.valVar}.subarray(0, ${c.limitNum});\n}`,
    `export const resolve${c.Entity}Timeout = (attempt: number, baseMs = ${c.timeoutMs}): number => {\n  const shift = Math.min(Math.max(0, attempt), 6);\n  return Math.min(baseMs * (1 << shift), 30000);\n};`,
    `export function pluck${c.Entity}<T extends Record<string, unknown>>(row: T, ${c.keyVar}: keyof T) {\n  const ${c.valVar} = row[${c.keyVar}];\n  if (${c.valVar} === undefined) throw new Error("${c.errCode}");\n  return ${c.valVar};\n}`,
  ];
  return templates[variant % templates.length];
}

// ============================================================================
// MEDIUM BLUEPRINTS (8 to 14 lines — complete, realistic single functions)
// ============================================================================
function genMediumBlock(family: string, c: DomainContext, variant: number): string {
  if (family === 'python') {
    const templates = [
      `def ${c.action}_${c.entity}_batch(items: list[dict], max_size: int = ${c.limitNum}) -> list[str]:\n    accepted: list[str] = []\n    for ${c.entity} in items:\n        ${c.keyVar} = ${c.entity}.get("${c.keyVar}")\n        if not ${c.keyVar}:\n            raise ValueError("${c.errCode}")\n        if ${c.entity}.get("status") == "${c.statusOk}":\n            accepted.append(str(${c.keyVar}))\n        if len(accepted) >= max_size:\n            break\n    return accepted`,
      `class ${c.Entity}Limiter:\n    def __init__(self, capacity: int = ${c.limitNum}, window_ms: int = ${c.timeoutMs}):\n        self.capacity = capacity\n        self.window_ms = window_ms\n        self.${c.collection}: dict[str, int] = {}\n\n    def allow_${c.action}(self, ${c.keyVar}: str) -> bool:\n        used = self.${c.collection}.get(${c.keyVar}, 0)\n        if used >= self.capacity:\n            return False\n        self.${c.collection}[${c.keyVar}] = used + 1\n        return True`,
      `def binary_${c.action}_${c.entity}(sorted_keys: list[int], target: int) -> int:\n    low, high = 0, len(sorted_keys) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        probe = sorted_keys[mid]\n        if probe == target:\n            return mid\n        if probe < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1`,
    ];
    return templates[variant % templates.length];
  }

  if (family === 'rust') {
    const templates = [
      `pub fn ${c.action}_${c.entity}_batch(${c.collection}: &[u64], threshold: u64) -> Result<Vec<u64>, &'static str> {\n    if ${c.collection}.is_empty() {\n        return Err("${c.errCode}");\n    }\n    let mut out = Vec::with_capacity(${c.collection}.len().min(${c.limitNum}));\n    for &${c.keyVar} in ${c.collection}.iter() {\n        if ${c.keyVar} >= threshold {\n            out.push(${c.keyVar} ^ ${c.primeHex});\n        }\n    }\n    Ok(out)\n}`,
      `pub struct ${c.Entity}Window {\n    pub capacity: usize,\n    pub count: usize,\n    pub mask: u64,\n}\n\nimpl ${c.Entity}Window {\n    pub fn try_${c.action}(&mut self, ${c.keyVar}: u64) -> Result< usize, &'static str > {\n        if self.count >= self.capacity {\n            return Err("${c.errCode}");\n        }\n        self.mask ^= ${c.keyVar}.wrapping_mul(${c.primeHex});\n        self.count += 1;\n        Ok(self.count)\n    }\n}`,
      `pub fn scan_${c.entity}_ring(buf: &[u8], delimiter: u8) -> Option<(usize, u32)> {\n    let mut checksum: u32 = 0;\n    for (idx, &byte) in buf.iter().enumerate() {\n        checksum = checksum.wrapping_add(u32::from(byte));\n        if byte == delimiter && idx > 0 {\n            return Some((idx, checksum));\n        }\n    }\n    None\n}`,
    ];
    return templates[variant % templates.length];
  }

  if (family === 'go') {
    const templates = [
      `func ${c.Action}${c.Entity}Batch(items []string, limit int) ([]string, error) {\n  if len(items) == 0 {\n    return nil, errors.New("${c.errCode}")\n  }\n  out := make([]string, 0, limit)\n  for _, ${c.keyVar} := range items {\n    if len(${c.keyVar}) > 0 && len(out) < limit {\n      out = append(out, ${c.keyVar})\n    }\n  }\n  return out, nil\n}`,
      `type ${c.Entity}Tracker struct {\n  mu sync.Mutex\n  counts map[string]int\n  limit int\n}\n\nfunc (t *${c.Entity}Tracker) Record(${c.keyVar} string) bool {\n  t.mu.Lock()\n  defer t.mu.Unlock()\n  if t.counts[${c.keyVar}] >= t.limit {\n    return false\n  }\n  t.counts[${c.keyVar}]++\n  return true\n}`,
    ];
    return templates[variant % templates.length];
  }

  // Default TS / JS / C++ / JVM style
  const templates = [
    `export function ${c.action}${c.Entity}Batch(\n  ${c.collection}: Map<string, number>,\n  limit = ${c.limitNum}\n): string[] {\n  const selected: string[] = [];\n  for (const [${c.keyVar}, weight] of ${c.collection}.entries()) {\n    if (weight <= 0) continue;\n    selected.push(\`\${${c.keyVar}}:\${weight}\`);\n    if (selected.length >= limit) break;\n  }\n  if (selected.length === 0) throw new Error("${c.errCode}");\n  return selected;\n}`,
    `export async function ${c.action}WithRetry<T>(\n  task: () => Promise<T>,\n  maxRetries = 4,\n  baseDelayMs = ${c.timeoutMs}\n): Promise<T> {\n  for (let attempt = 0; attempt <= maxRetries; attempt++) {\n    try {\n      return await task();\n    } catch (err) {\n      if (attempt === maxRetries) throw new Error("${c.errCode}");\n      const backoff = baseDelayMs * (1 << attempt);\n      await new Promise((r) => setTimeout(r, backoff));\n    }\n  }\n  throw new Error("${c.errCode}");\n}`,
    `export class ${c.Entity}RingBuffer<T> {\n  private readonly buf: Array<T | undefined>;\n  private head = 0;\n  private tail = 0;\n  constructor(private readonly cap = ${c.limitNum}) {\n    this.buf = new Array<T | undefined>(cap);\n  }\n  public ${c.action}(item: T): boolean {\n    if (this.tail - this.head >= this.cap) return false;\n    this.buf[this.tail++ % this.cap] = item;\n    return true;\n  }\n}`,
    `export function verify${c.Entity}Digest(\n  ${c.valVar}: Uint8Array,\n  expectedSeed = ${c.primeHex}\n): number {\n  if (${c.valVar}.byteLength === 0) throw new Error("${c.errCode}");\n  let acc = expectedSeed >>> 0;\n  for (let i = 0; i < ${c.valVar}.byteLength; i++) {\n    acc = Math.imul(acc ^ ${c.valVar}[i], 0x01000193) >>> 0;\n  }\n  return acc;\n}`,
  ];
  return templates[variant % templates.length];
}

// ============================================================================
// LONG BLUEPRINTS (20 to 30 lines — multi-part cohesive module)
// ============================================================================
function genLongBlock(family: string, c1: DomainContext, c2: DomainContext, v1: number, v2: number): string {
  const part1 = genMediumBlock(family, c1, v1);
  const part2 = genMediumBlock(family, c2, v2 + 1);
  const part3 = genShortBlock(family, c1, v1 + 2);
  return `${part1}\n\n${part2}\n\n${part3}`;
}

export function synthesizeUnlimitedSnippet(
  langId: string,
  lengthMode: SnippetLength = 'medium',
  seed?: string
): SnippetItem {
  const spec = LANGUAGES.find((l) => l.id === langId) || LANGUAGES[0];
  const entropy =
    seed ||
    `${langId}_${lengthMode}_${Date.now()}_${Math.random().toString(36).slice(2)}_${
      typeof performance !== 'undefined' ? performance.now() : 0
    }`;
  const rng = createSeededRandom(entropy);

  const ctx1 = buildContext(rng);
  const ctx2 = buildContext(rng);
  const v1 = Math.floor(rng() * 1000);
  const v2 = Math.floor(rng() * 1000);

  let code = '';
  if (lengthMode === 'beginner') {
    code = genBeginnerBlock(spec.family, v1);
  } else if (lengthMode === 'short') {
    code = genShortBlock(spec.family, ctx1, v1);
  } else if (lengthMode === 'medium') {
    code = genMediumBlock(spec.family, ctx1, v1);
  } else {
    code = genLongBlock(spec.family, ctx1, ctx2, v1, v2);
  }

  const fileNum = Math.floor(100 + rng() * 899);
  const lineCount = code.split('\n').length;

  return {
    langId: spec.id,
    label: spec.name,
    filename: `${ctx1.domain}_${ctx1.entity}_${fileNum}.${spec.ext}`,
    badge: `${lengthMode.toUpperCase()} (${lineCount}L) • ${spec.badge}`,
    category: spec.category,
    code,
    difficulty: lengthMode === 'beginner' ? 'beginner' : lengthMode === 'long' ? 'hard' : lengthMode === 'medium' ? 'medium' : 'easy',
    sourceType: 'synthetic',
  };
}

export function synthesizeSmartCoachSnippet(
  langId: string,
  missedKeys: Record<string, number>,
  weakPatterns: Record<string, number> = {},
  recentAvgWpm: number = 60
): SnippetItem {
  const patternEntries = Object.entries(weakPatterns).sort((a, b) => b[1] - a[1]);
  const keyEntries = Object.entries(missedKeys).sort((a, b) => b[1] - a[1]);
  const topPattern = patternEntries[0]?.[0] || '=>';
  const topMisses = keyEntries.slice(0, 4).map(([k]) => k);
  const base = synthesizeUnlimitedSnippet(langId, recentAvgWpm > 80 ? 'long' : 'medium');
  return {
    ...base,
    label: `AI Coach • ${base.label}`,
    badge: `DRILL TARGET: ${topPattern} ${topMisses.join(' ')}`,
    sourceType: 'coach',
  };
}

export function sanitizeAndChunkCode(
  rawCode: string,
  stripComments: boolean,
  lengthMode: SnippetLength = 'medium'
): string[] {
  const lines = rawCode
    .split('\n')
    .map((l) => l.replace(/\t/g, '  ').trimEnd())
    .filter((l) => {
      const t = l.trim();
      if (!t) return false;
      if (stripComments && (t.startsWith('//') || t.startsWith('#') || t.startsWith('/*') || t.startsWith('*'))) {
        return false;
      }
      return t.length <= 92;
    });

  const minLines = lengthMode === 'short' ? 3 : lengthMode === 'medium' ? 8 : 18;
  const maxLines = lengthMode === 'short' ? 5 : lengthMode === 'medium' ? 13 : 28;
  const stepLines = lengthMode === 'short' ? 4 : lengthMode === 'medium' ? 10 : 22;

  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += stepLines) {
    const slice = lines.slice(i, i + maxLines);
    if (slice.length >= minLines) {
      // Normalize base indentation so snippets don't start with 12 leading spaces
      const minIndent = slice.reduce((min, line) => {
        const match = line.match(/^(\s*)\S/);
        return match ? Math.min(min, match[1].length) : min;
      }, 99);
      const normalized =
        minIndent > 0 && minIndent < 99
          ? slice.map((l) => l.slice(minIndent)).join('\n')
          : slice.join('\n');
      chunks.push(normalized);
    }
  }
  return chunks;
}

export function tokenizeSyntaxColors(code: string): string[] {
  return code.split('').map((char) => {
    if ('(){}[]'.includes(char)) return '#c4b5fd';
    if (';,.<>'.includes(char)) return '#94a3b8';
    if ('+-*/=&|!%^~?:'.includes(char)) return '#f472b6';
    if ('0123456789'.includes(char)) return '#fb923c';
    if (char === '"' || char === "'") return '#a3e635';
    return '#f8fafc';
  });
}
