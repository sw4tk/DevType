export interface VimDrill {
  task: string;
  command: string;
  explanation: string;
  code: string;
  highlightToken: string;
}

export const VIM_DRILLS: VimDrill[] = [
  {
    task: 'Change Inside Double Quotes',
    command: 'ci"',
    explanation: 'Deletes string literal inside quotes and enters Insert mode',
    code: `const endpoint = "https://api.devtype.dev/v2/telemetry";`,
    highlightToken: `"https://api.devtype.dev/v2/telemetry"`,
  },
  {
    task: 'Delete Around Curly Braces',
    command: 'da{',
    explanation: 'Deletes entire block including { } braces',
    code: `if (err !== null) { return Result.err(err); }`,
    highlightToken: `{ return Result.err(err); }`,
  },
  {
    task: 'Delete Until Closing Parenthesis',
    command: 'dt)',
    explanation: 'Deletes from cursor up to (but not including) ")"',
    code: `export function dispatch(payload: Uint8Array, flags: number) {}`,
    highlightToken: `payload: Uint8Array, flags: number`,
  },
  {
    task: 'Jump Forward 3 Words',
    command: '3w',
    explanation: 'Moves cursor 3 word boundaries to the right',
    code: `pub async fn poll_socket(stream: &mut TcpStream) -> io::Result<()>`,
    highlightToken: `poll_socket`,
  },
  {
    task: 'Change Until Semicolon',
    command: 'ct;',
    explanation: 'Replaces everything from cursor until the line terminator ";"',
    code: `let checksum = (crc32 ^ 0xFF00_u32) >> 4;`,
    highlightToken: `(crc32 ^ 0xFF00_u32) >> 4`,
  },
  {
    task: 'Delete Entire Current Line',
    command: 'dd',
    explanation: 'Cuts the entire active line into the default register',
    code: `console.debug("[DEPRECATED_TRACE]", performance.now());`,
    highlightToken: `console.debug("[DEPRECATED_TRACE]", performance.now());`,
  },
  {
    task: 'Yank Inside Square Brackets',
    command: 'yi[',
    explanation: 'Copies array slice expression inside [ ] without brackets',
    code: `const matrix = buffer.subarray(offset, indices[stride + 2]);`,
    highlightToken: `stride + 2`,
  },
  {
    task: 'Jump to Matching Bracket Pair',
    command: '%',
    explanation: 'Toggles cursor directly to the matching ), ], or } delimiter',
    code: `fn compute<T: Clone>(items: &[T]) -> Vec<T> { items.to_vec() }`,
    highlightToken: `{ items.to_vec() }`,
  },
];