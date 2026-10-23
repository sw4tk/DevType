import { LANGUAGES, LanguageSpec, SnippetItem, SnippetLength } from '@/constants/languages';

const seenSyntheticHashes = new Set<string>();
let lastPatternIndex = -1;

export function createSeededRandom(seedStr: string) {
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

export function pick<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateSnippetByFamily(
  lang: LanguageSpec,
  patternIdx: number,
  rng: () => number = Math.random
): string {
  const verbs = [
    'compute', 'resolve', 'dispatch', 'validate', 'transform', 'aggregate',
    'sync', 'decode', 'compact', 'verify', 'serialize', 'schedule', 'partition',
    'reconcile', 'quantize', 'hydrate', 'coalesce', 'multiplex', 'encrypt',
  ];
  const nouns = [
    'Frame', 'Packet', 'Buffer', 'Vector', 'Token', 'Batch', 'Matrix',
    'Cursor', 'Signal', 'Shard', 'Socket', 'Ledger', 'Tensor', 'Payload',
    'Segment', 'Merkle', 'Bucket', 'Stream', 'Digest', 'Inode',
  ];
  const vars = [
    'stride', 'offset', 'pivot', 'delta', 'limit', 'cursor', 'epoch',
    'weight', 'quota', 'mask', 'radix', 'depth', 'window', 'nonce', 'bound',
  ];

  const v = pick(verbs, rng);
  const n = pick(nouns, rng);
  const fnCamel = `${v}${n}`;
  const fnSnake = `${v}_${n.toLowerCase()}`;
  const a = pick(vars, rng);
  const b = pick(vars.filter((x) => x !== a), rng);
  const c = pick(vars.filter((x) => x !== a && x !== b), rng);
  const p1 = pick([7, 13, 17, 29, 31, 53, 97, 127, 251, 509], rng);
  const p2 = pick([3, 4, 6, 8, 12, 16, 24, 32, 48, 64], rng);
  const hex = pick(['0x1F', '0x3F', '0x7F', '0xFF', '0xA5', '0x0F', '0x5A', '0xC3'], rng);
  const op = pick(['^', '&', '|', '+'], rng);

  // 10 Universal Algorithmic Blueprints for C-like / TS / JS / Rust / Python / Go
  if (lang.family === 'ts' || lang.family === 'js') {
    const blueprints = [
      // 0: Binary Search
      `export function ${fnCamel}(nums: readonly number[], target: number): number {\n  let low = 0, high = nums.length - 1;\n  while (low <= high) {\n    const ${a} = (low + high) >>> 1;\n    if (nums[${a}] === target) return ${a};\n    if (nums[${a}] < target) low = ${a} + 1;\n    else high = ${a} - 1;\n  }\n  return -1;\n}`,
      // 1: Token Bucket Rate Limiter
      `export class ${n}RateLimiter {\n  private tokens = ${p1};\n  private lastRefill = Date.now();\n  consume(${a}: number, rate = ${p2}): boolean {\n    const now = Date.now();\n    this.tokens = Math.min(${p1}, this.tokens + ((now - this.lastRefill) / 1000) * rate);\n    this.lastRefill = now;\n    if (this.tokens < ${a}) return false;\n    this.tokens -= ${a};\n    return true;\n  }\n}`,
      // 2: Sliding Window Maximum Sum
      `export function ${fnCamel}Window(arr: number[], ${a} = ${p2}): number {\n  let ${b} = 0, maxSum = 0;\n  for (let i = 0; i < arr.length; i++) {\n    ${b} += arr[i];\n    if (i >= ${a}) ${b} -= arr[i - ${a}];\n    if (${b} > maxSum) maxSum = ${b};\n  }\n  return maxSum;\n}`,
      // 3: Fenwick / Binary Indexed Tree Update
      `export function update${n}Tree(tree: Int32Array, idx: number, ${a}: number): void {\n  let ${b} = idx + 1;\n  while (${b} < tree.length) {\n    tree[${b}] = (tree[${b}] + ${a}) ${op} ${hex};\n    ${b} += ${b} & -${b};\n  }\n}`,
      // 4: LRU Cache Eviction Step
      `export class ${n}Cache<K, V> {\n  private store = new Map<K, V>();\n  constructor(private readonly ${a} = ${p1}) {}\n  set(key: K, val: V): void {\n    if (this.store.has(key)) this.store.delete(key);\n    else if (this.store.size >= this.${a}) {\n      const oldest = this.store.keys().next().value;\n      if (oldest !== undefined) this.store.delete(oldest);\n    }\n    this.store.set(key, val);\n  }\n}`,
      // 5: FNV-1a Fast Checksum Hasher
      `export function hash${n}Buffer(bytes: Uint8Array, seed = ${hex}): number {\n  let ${a} = 0x811c9dc5 ^ seed;\n  for (let i = 0; i < bytes.length; i++) {\n    ${a} ^= bytes[i];\n    ${a} = Math.imul(${a}, 0x01000193);\n  }\n  return ${a} >>> 0;\n}`,
      // 6: Async Retry Backoff Executor
      `export async function ${fnCamel}WithRetry<T>(task: () => Promise<T>, retries = ${p2}): Promise<T> {\n  for (let ${a} = 0; ${a} < retries; ${a}++) {\n    try {\n      return await task();\n    } catch (err) {\n      if (${a} === retries - 1) throw err;\n      await new Promise((r) => setTimeout(r, (1 << ${a}) * ${p1}));\n    }\n  }\n  throw new Error("Exhausted");\n}`,
      // 7: Event Emitter Pub/Sub Bus
      `export class ${n}Emitter<E extends Record<string, unknown>> {\n  private listeners = new Map<keyof E, Set<(payload: any) => void>>();\n  emit<K extends keyof E>(event: K, ${a}: E[K]): number {\n    const group = this.listeners.get(event);\n    if (!group) return 0;\n    group.forEach((fn) => fn(${a}));\n    return group.size;\n  }\n}`,
      // 8: Matrix Transpose & Scale
      `export function transpose${n}(grid: number[][], ${a} = ${p2}): number[][] {\n  const rows = grid.length, cols = grid[0]?.length ?? 0;\n  const out = Array.from({ length: cols }, () => new Array<number>(rows));\n  for (let r = 0; r < rows; r++) {\n    for (let c = 0; c < cols; c++) out[c][r] = grid[r][c] * ${a};\n  }\n  return out;\n}`,
      // 9: Ring Buffer Dequeue
      `export function drain${n}Queue(ring: Float64Array, head: number, tail: number): number {\n  let ${b} = 0, ${c} = head;\n  while (${c} !== tail) {\n    ${b} += ring[${c}] * ${p2};\n    ${c} = (${c} + 1) % ring.length;\n  }\n  return Math.round(${b});\n}`,
    ];
    return blueprints[patternIdx % blueprints.length];
  }

  if (lang.family === 'rust') {
    const blueprints = [
      `pub fn ${fnSnake}(slice: &[i32], ${a}: i32) -> Vec<i32> {\n  let mut out = Vec::with_capacity(slice.len());\n  for (idx, &val) in slice.iter().enumerate() {\n    let ${b} = (val ^ ${p1}) + ((idx as i32) << 2);\n    if ${b} >= ${a} {\n      out.push(${b} & ${hex});\n    }\n  }\n  out\n}`,
      `pub struct ${n}Pool<T> {\n  items: Vec<T>,\n  ${a}: usize,\n}\nimpl<T: Clone> ${n}Pool<T> {\n  pub fn acquire(&mut self) -> Option<T> {\n    if self.${a} == 0 { return None; }\n    self.${a} -= 1;\n    self.items.get(self.${a}).cloned()\n  }\n}`,
      `pub fn binary_partition(nums: &[i64], ${a}: i64) -> (usize, i64) {\n  let mut ${b} = 0usize;\n  let mut sum = 0i64;\n  for &x in nums.iter().filter(|&&v| v >= ${a}) {\n    ${b} += 1;\n    sum = sum.wrapping_add(x ^ ${hex});\n  }\n  (${b}, sum)\n}`,
      `pub fn crc_digest(bytes: &[u8], seed: u32) -> u32 {\n  bytes.iter().fold(seed ^ ${hex}, |${a}, &byte| {\n    let ${b} = (${a} ^ (byte as u32)).rotate_left(${p2 % 7 + 1});\n    ${b}.wrapping_mul(${p1} as u32)\n  })\n}`,
      `pub fn merge_sorted<T: Ord + Copy>(left: &[T], right: &[T]) -> Vec<T> {\n  let (mut i, mut j) = (0, 0);\n  let mut out = Vec::with_capacity(left.len() + right.len());\n  while i < left.len() && j < right.len() {\n    if left[i] <= right[j] { out.push(left[i]); i += 1; }\n    else { out.push(right[j]); j += 1; }\n  }\n  out.extend_from_slice(&left[i..]);\n  out.extend_from_slice(&right[j..]);\n  out\n}`,
    ];
    return blueprints[patternIdx % blueprints.length];
  }

  if (lang.family === 'python') {
    const blueprints = [
      `def ${fnSnake}(records: list[int], ${a}: int = ${p1}) -> list[int]:\n  ${b}: list[int] = []\n  for idx, val in enumerate(records):\n    score = (val * ${p2}) ^ (idx + ${a})\n    if score >= ${a}:\n      ${b}.append(score & ${hex})\n  return ${b}`,
      `def top_k_${n.toLowerCase()}(weights: dict[str, int], k: int = ${p2}) -> list[str]:\n  ranked = sorted(weights.items(), key=lambda item: item[1], reverse=True)\n  return [key for key, val in ranked[:k] if val >= ${p1}]`,
      `class ${n}Window:\n  def __init__(self, capacity: int = ${p2}) -> None:\n    self.capacity = capacity\n    self.buffer: list[float] = []\n  def push(self, ${a}: float) -> float:\n    self.buffer.append(${a})\n    if len(self.buffer) > self.capacity:\n      self.buffer.pop(0)\n    return sum(self.buffer) / len(self.buffer)`,
      `def dijkstra_step(adj: dict[int, list[tuple[int, int]]], start: int) -> dict[int, int]:\n  dist: dict[int, int] = {start: 0}\n  queue: list[int] = [start]\n  for u in queue:\n    for v, ${a} in adj.get(u, []):\n      if v not in dist or dist[u] + ${a} < dist[v]:\n        dist[v] = dist[u] + ${a}\n        queue.append(v)\n  return dist`,
      `defsliding_${fnSnake}(nums: list[int], ${a}: int = ${p2}) -> int:\n  ${b} = sum(nums[:${a}])\n  best = ${b}\n  for i in range(${a}, len(nums)):\n    ${b} += nums[i] - nums[i - ${a}]\n    if ${b} > best:\n      best = ${b}\n  return best`,
    ];
    return blueprints[patternIdx % blueprints.length];
  }

  if (lang.family === 'go') {
    const blueprints = [
      `func ${fnCamel}(input []int, ${a} int) []int {\n  out := make([]int, 0, ${p2})\n  for idx, val := range input {\n    ${b} := (val ^ ${p1}) + idx*2\n    if ${b} >= ${a} {\n      out = append(out, ${b}&${hex})\n    }\n  }\n  return out\n}`,
      `func ${n}Worker(jobs <-chan int, results chan<- int, ${a} int) {\n  for raw := range jobs {\n    ${b} := (raw * ${p2}) ^ ${a}\n    if ${b} >= ${p1} {\n      results <- ${b}\n    }\n  }\n}`,
      `type ${n}Broker struct {\n  subs map[string][]chan []byte\n  ${a} int\n}\nfunc (b *${n}Broker) Publish(topic string, msg []byte) int {\n  targets := b.subs[topic]\n  for _, ch := range targets {\n    select {\n    case ch <- msg:\n    default:\n    }\n  }\n  return len(targets)\n}`,
    ];
    return blueprints[patternIdx % blueprints.length];
  }

  switch (lang.family) {
    case 'cpp':
      return `template <typename T>\nstd::vector<T> ${fnSnake}(const std::vector<T>& buf, T ${a}) {\n  std::vector<T> out;\n  out.reserve(buf.size());\n  for (size_t i = 0; i < buf.size(); ++i) {\n    T ${b} = (buf[i] ^ ${hex}) + static_cast<T>(i * ${p2});\n    if (${b} >= ${a}) out.push_back(${b});\n  }\n  return out;\n}`;
    case 'c':
      return `size_t ${fnSnake}(const uint32_t *src, uint32_t *dst, size_t len) {\n  size_t ${a} = 0;\n  for (size_t i = 0; i < len; ++i) {\n    uint32_t ${b} = (src[i] << 2) ^ ${hex}U;\n    if (${b} > ${p1}U) dst[${a}++] = ${b};\n  }\n  return ${a};\n}`;
    case 'jvm':
      return `public class ${n}Processor {\n  public static int ${fnCamel}(int[] data, int ${a}) {\n    int ${b} = ${p1};\n    for (int i = 0; i < data.length; i++) {\n      if (data[i] > ${a}) {\n        ${b} = (${b} * ${p2}) ^ (data[i] & ${hex});\n      }\n    }\n    return ${b};\n  }\n}`;
    case 'functional':
      return `${fnSnake} :: Int -> [Int] -> [Int]\n${fnSnake} ${a} xs =\n  let step x = (x * ${p2}) + ${p1}\n      valid y = y >= ${a}\n  in filter valid (map step xs)`;
    case 'beam':
      return `defmodule ${n}Engine do\n  def ${fnSnake}(items, ${a} \\\\ ${p1}) do\n    items\n    |> Enum.map(fn x -> Bitwise.bxor(x * ${p2}, ${a}) end)\n    |> Enum.filter(fn ${b} -> ${b} >= ${a} end)\n  end\nend`;
    case 'lisp':
      return `(defn ${fnSnake} [items ${a}]\n  (reduce\n    (fn [acc val]\n      (let [${b} (bit-xor (* val ${p2}) ${p1})]\n        (if (>= ${b} ${a}) (conj acc ${b}) acc)))\n    []\n    items))`;
    case 'ruby_like':
      return `def ${fnSnake}(items, ${a} = ${p1})\n  items.each_with_index.filter_map do |val, idx|\n    ${b} = (val * ${p2}) ^ (idx + ${a})\n    ${b} & ${hex} if ${b} >= ${a}\n  end\nend`;
    case 'php_perl':
      return `function ${fnSnake}(array $items, int $${a} = ${p1}): array {\n  $out = [];\n  foreach ($items as $idx => $val) {\n    $${b} = ($val * ${p2}) ^ ($idx + $${a});\n    if ($${b} >= $${a}) $out[] = $${b} & ${hex};\n  }\n  return $out;\n}`;
    case 'lua_r_julia':
      return `local function ${fnSnake}(items, ${a})\n  local out = {}\n  for i = 1, #items do\n    local ${b} = (items[i] * ${p2}) + (i * ${p1})\n    if ${b} >= ${a} then\n      out[#out + 1] = ${b}\n    end\n  end\n  return out\nend`;
    case 'sql':
      return `SELECT\n  t.id,\n  COUNT(t.${a}) AS total_${a},\n  AVG(t.${b}) FILTER (WHERE t.${b} >= ${p1}) AS avg_${b}\nFROM telemetry_${n.toLowerCase()} t\nWHERE t.created_at >= NOW() - INTERVAL '${p2} minutes'\nGROUP BY t.id\nHAVING COUNT(t.${a}) > ${p2}\nORDER BY avg_${b} DESC\nLIMIT ${p1};`;
    case 'shell':
      return `#!/usr/bin/env bash\nset -euo pipefail\n${fnSnake}() {\n  local ${a}="\${1:-${p1}}"\n  for f in ./logs/*.log; do\n    [[ -f "$f" ]] && grep -E "WARN|ERR" "$f" | head -n "$${a}"\n  done\n}\n${fnSnake} ${p2}`;
    case 'config':
      return `[package]\nname = "devtype-${n.toLowerCase()}"\nversion = "0.${p2}.${p1}"\nedition = "2024"\n\n[dependencies]\ntokio = { version = "1.${p2}", features = ["full"] }\nserde = { version = "1.0", features = ["derive"] }`;
    case 'markup':
      return `.studio-${n.toLowerCase()} {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(${p1}0px, 1fr));\n  gap: ${p2}px;\n  backdrop-filter: blur(${p2}px);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n}`;
    case 'shader':
      return `@compute @workgroup_size(${p2}, 1, 1)\nfn ${fnSnake}(@builtin(global_invocation_id) id: vec3<u32>) {\n  let idx = id.x;\n  let ${a} = f32(idx * ${p1}u) * 0.015625;\n  buffer[idx] = sin(${a}) * cos(${a} * ${p2}.0);\n}`;
    case 'hardware':
      return `module ${fnSnake} #(\n  parameter int WIDTH = ${p2}\n) (\n  input  logic clk,\n  input  logic rst_n,\n  input  logic [WIDTH-1:0] din_${a},\n  output logic [WIDTH-1:0] dout_${b}\n);\n  always_ff @(posedge clk or negedge rst_n) begin\n    if (!rst_n) dout_${b} <= '0;\n    else dout_${b} <= (din_${a} << 1) ^ ${p1};\n  end\nendmodule`;
    case 'asm':
      return `global ${fnSnake}\nsection .text\n${fnSnake}:\n  xor rax, rax\n  mov rcx, rdi\n.loop_${a}:\n  add rax, ${p1}\n  xor rax, ${hex}\n  dec rcx\n  jnz .loop_${a}\n  ret`;
    case 'hell':
    default:
      return `pub fn mux_${p1}<'a, F: Fn(&'a [u8]) -> Result<u32, &'static str>>(buf: &'a mut [u32], ${a}: u32) -> &'a [u32] {\n  for ptr in buf.iter_mut() {\n    *ptr = ((*ptr << 3) ^ (${hex}_u32 | !${a})) >> ${p2 % 5 + 1};\n  }\n  &buf[..]\n}`;
  }
}

export function synthesizeUnlimitedSnippet(
  langId: string,
  lengthMode: SnippetLength = 'medium',
  seedStr?: string
): SnippetItem {
  const rng = seedStr ? createSeededRandom(seedStr) : Math.random;
  const spec = LANGUAGES.find((l) => l.id === langId) || LANGUAGES[0];

  // Ensure patternIdx always advances and never repeats consecutively
  let patternA = Math.floor(rng() * 20);
  if (!seedStr && patternA === lastPatternIndex) {
    patternA = (patternA + 1 + Math.floor(Math.random() * 8)) % 20;
  }
  lastPatternIndex = patternA;

  let block1 = generateSnippetByFamily(spec, patternA, rng);
  let attempts = 0;
  while (!seedStr && seenSyntheticHashes.has(block1) && attempts < 12) {
    patternA = (patternA + 1) % 20;
    block1 = generateSnippetByFamily(spec, patternA, rng);
    attempts++;
  }
  seenSyntheticHashes.add(block1);
  if (seenSyntheticHashes.size > 500) seenSyntheticHashes.clear();

  let finalCode = block1;
  if (lengthMode === 'short') {
    const lines = block1.split('\n');
    finalCode = lines.slice(0, Math.min(6, lines.length)).join('\n');
  } else if (lengthMode === 'long') {
    const block2 = generateSnippetByFamily(spec, patternA + 3, rng);
    finalCode = `${block1}\n\n${block2}`;
  }

  const suffix = Math.floor(100 + rng() * 899);
  return {
    langId: spec.id,
    label: spec.name,
    filename: seedStr ? `daily_${seedStr}.${spec.ext}` : `${spec.id}_${suffix}.${spec.ext}`,
    badge: seedStr ? `DAILY SEED • ${seedStr}` : spec.badge,
    category: spec.category,
    code: finalCode,
  };
}

export function sanitizeAndChunkCode(rawText: string, stripComments: boolean): string[] {
  let cleaned = rawText.replace(/\r\n/g, '\n').replace(/\t/g, '  ');
  if (stripComments) {
    cleaned = cleaned
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/^\s*#.*$/gm, '');
  }

  const lines = cleaned
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0 && l.length <= 92);

  if (lines.length <= 13) return [lines.join('\n')];

  const chunks: string[] = [];
  for (let i = 0; i < lines.length; i += 10) {
    const slice = lines.slice(i, i + 10);
    if (slice.length >= 5) chunks.push(slice.join('\n'));
  }
  return chunks.length > 0 ? chunks : [lines.slice(0, 10).join('\n')];
}

export function tokenizeSyntaxColors(code: string): string[] {
  const colors = new Array<string>(code.length).fill('text-neutral-100');
  const rules: { regex: RegExp; cls: string }[] = [
    {
      regex:
        /\b(export|function|return|let|const|while|if|else|for|in|pub|fn|mut|def|lambda|func|range|chan|class|private|public|static|template|typename|module|endmodule|always_ff|posedge|negedge|SELECT|FROM|WHERE|GROUP|BY|HAVING|ORDER|LIMIT|local|then|end|do|defmodule|defn|global|section|async|await|impl|struct|try|catch|throw|new)\b/g,
      cls: 'text-purple-300',
    },
    {
      regex:
        /\b(number|string|boolean|Vec|i32|i64|u8|u32|usize|list|int|float|dict|Some|None|Option|HashMap|Result|Fn|str|Map|Set|Int32Array|Uint8Array|Float64Array|readonly|void|uint32_t|size_t|f32|vec3|logic|Int|Promise)\b/g,
      cls: 'text-cyan-300',
    },
    {
      regex: /\b(\d+|0x[0-9A-Fa-f_]+|0b[01_]+)\b/g,
      cls: 'text-amber-300',
    },
    {
      regex: /([(){}[\]<>])/g,
      cls: 'text-sky-300',
    },
    {
      regex: /([=+\-*/:&|!><^~%]+)/g,
      cls: 'text-pink-300',
    },
  ];

  for (const { regex, cls } of rules) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(code)) !== null) {
      for (let i = match.index; i < match.index + match[0].length; i++) {
        colors[i] = cls;
      }
    }
  }
  return colors;
}

export function synthesizeSmartCoachSnippet(
  langId: string,
  missedKeys: Record<string, number>,
  weakPatterns: Record<string, number> = {},
  recentAvgWpm: number = 60
): SnippetItem {
  const patternEntries = Object.entries(weakPatterns).sort((a, b) => b[1] - a[1]);
  const keyEntries = Object.entries(missedKeys).sort((a, b) => b[1] - a[1]);

  const topPattern = patternEntries[0]?.[0] || '';
  const topMisses = keyEntries.slice(0, 4).map(([k]) => k);
  const difficulty: SnippetItem['difficulty'] =
    recentAvgWpm >= 95 ? 'expert' : recentAvgWpm >= 70 ? 'hard' : recentAvgWpm >= 45 ? 'medium' : 'easy';

  const id = Math.floor(100 + Math.random() * 899);

  // 1. Target Optional Chaining & Strict Equality (`?.`, `===`, `!==`)
  if (topPattern === '?.' || topPattern === '===' || topPattern === '!==') {
    return {
      langId: 'typescript',
      label: 'AI Coach • Nullish & Strict Ops',
      filename: `coach_strict_${id}.ts`,
      badge: `SYNTHETIC DRILL • TARGET: ${topPattern} (${difficulty.toUpperCase()})`,
      category: 'Web',
      difficulty,
      sourceType: 'coach',
      code: `export function verifyNode(node?: { meta?: { status?: string; code?: number } }): boolean {\n  const status = node?.meta?.status;\n  const code = node?.meta?.code ?? 0;\n  if (status === undefined || status !== "READY") return false;\n  return code === 200 && node?.meta !== null;\n}`,
    };
  }

  // 2. Target Rust/C++ Scope & Thin Arrow Operators (`::`, `->`)
  if (topPattern === '::' || topPattern === '->' || langId === 'rust') {
    return {
      langId: 'rust',
      label: 'AI Coach • Scope & Return Arrows',
      filename: `coach_arrows_${id}.rs`,
      badge: `SYNTHETIC DRILL • TARGET: :: & -> (${difficulty.toUpperCase()})`,
      category: 'Systems',
      difficulty,
      sourceType: 'coach',
      code: `pub fn parse_header(raw: &[u8]) -> std::result::Result<u32, std::io::Error> {\n  let mut buf = std::collections::VecDeque::with_capacity(raw.len());\n  for &byte in raw.iter() {\n    buf.push_back(u32::from(byte));\n  }\n  Ok(buf.pop_front().unwrap_or_default())\n}`,
    };
  }

  // 3. Target Fat Arrows & Functional Pipelines (`=>`)
  if (topPattern === '=>' || topMisses.includes('=') || topMisses.includes('>')) {
    return {
      langId: 'typescript',
      label: 'AI Coach • Arrow Closures',
      filename: `coach_closures_${id}.ts`,
      badge: `SYNTHETIC DRILL • TARGET: => (${difficulty.toUpperCase()})`,
      category: 'Web',
      difficulty,
      sourceType: 'coach',
      code: `export const composePipelines = <T>(fns: Array<(arg: T) => T>) => {\n  return (initial: T): T =>\n    fns.reduce((acc, fn) => fn(acc), initial);\n};\nexport const filterValid = (items: number[]) => items.filter((x) => x >= 0).map((x) => x * 2);`,
    };
  }

  // 4. Target Nested Brackets & Generics (`{}`, `[]`, `()`)
  const hasBracketMiss = topMisses.some((k) => '()[]{}<>'.includes(k));
  if (hasBracketMiss) {
    return {
      langId,
      label: 'AI Coach • Nested Brackets',
      filename: `coach_brackets_${id}.ts`,
      badge: `SYNTHETIC DRILL • TARGET: ${topMisses.join(' ') || '{ [ ( ) ] }'}`,
      category: 'Web',
      difficulty,
      sourceType: 'coach',
      code: `export function unpackNested<T>(matrix: Array<Record<string, [T, number][]>>): T[] {\n  const out: T[] = [];\n  for (const row of matrix) {\n    for (const [, pairs] of Object.entries(row)) {\n      if (pairs[0]?.[1] > 0) out.push(pairs[0][0]);\n    }\n  }\n  return out;\n}`,
    };
  }

  // 5. Default Adaptive Operator Drill
  return {
    langId,
    label: 'AI Coach • Bitwise & Operators',
    filename: `coach_bitwise_${id}.rs`,
    badge: `SYNTHETIC DRILL • TARGET: ${topMisses.join(' ') || '=> ^ & |'}`,
    category: 'Systems',
    difficulty,
    sourceType: 'coach',
    code: `pub fn mix_entropy(seed: u64, mask: u64) -> u64 {\n  let mut state = (seed ^ 0x5DEECE66D) & ((1u64 << 48) - 1);\n  state = (state.wrapping_mul(0x27BB2EE687B0B0FD) + 0xB) ^ !mask;\n  (state >> 16) | (state & 0xFFFF_0000)\n}`,
  };
}