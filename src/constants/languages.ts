export interface SnippetItem {
  langId: string;
  label: string;
  filename: string;
  badge: string;
  category: string;
  code: string;
  difficulty?: 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';
  sourceType?: 'verified' | 'synthetic' | 'coach';
}

export type SnippetLength = 'beginner' | 'short' | 'medium' | 'long';
export type ErrorMode = 'forgiving' | 'strict' | 'no-backspace';
export type GameMode =
  | 'standard'
  | '15'
  | '30'
  | '60'
  | 'suddendeath'
  | 'zen'
  | 'daily'
  | 'vim'
  | 'smartcoach';
export type CaretSmoothness = 'instant' | 'snappy' | 'butter' | 'liquid' | 'spring';
export type CaretShape = 'block' | 'beam' | 'underline' | 'outline';

export interface DigraphStat {
  sequence: string;
  attempts: number;
  errors: number;
  avgMs: number;
}

export interface HistoryRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  timestamp?: number;
  langId: string;
  gameMode?: GameMode;
  wpm: number;
  rawWpm?: number;
  accuracy: number;
  consistency?: number;
  syntaxAccuracy?: number;
  chars: number;
  durationSec?: number;
}

export interface DeveloperSocials {
  github?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
  youtube?: string;
  leetcode?: string;
  discord?: string;
  location?: string;
  bio?: string;
}

export interface DeveloperUser {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string;
  githubHandle?: string;
  title: string;
  isCloudSynced: boolean;
  joinedAt: string;
  socials?: DeveloperSocials;
}

export interface LanguageSpec {
  id: string;
  name: string;
  ext: string;
  badge: string;
  category:
    | 'Web'
    | 'Systems'
    | 'Functional'
    | 'JVM & .NET'
    | 'Scripting'
    | 'Data & AI'
    | 'Web3'
    | 'DevOps'
    | 'Hardware & GPU';
  family:
    | 'ts'
    | 'js'
    | 'rust'
    | 'python'
    | 'go'
    | 'cpp'
    | 'c'
    | 'jvm'
    | 'functional'
    | 'beam'
    | 'lisp'
    | 'ruby_like'
    | 'php_perl'
    | 'lua_r_julia'
    | 'sql'
    | 'shell'
    | 'config'
    | 'markup'
    | 'shader'
    | 'hardware'
    | 'asm'
    | 'hell';
}

export const QUICK_LANGUAGES = ['typescript', 'rust', 'python', 'go', 'cpp'];

export const LANGUAGES: LanguageSpec[] = [
  { id: 'typescript', name: 'TypeScript', ext: 'ts', badge: 'TS 5.8', category: 'Web', family: 'ts' },
  { id: 'javascript', name: 'JavaScript', ext: 'js', badge: 'ES2025', category: 'Web', family: 'js' },
  { id: 'rust', name: 'Rust', ext: 'rs', badge: 'RUST 2024', category: 'Systems', family: 'rust' },
  { id: 'python', name: 'Python', ext: 'py', badge: 'PY 3.13', category: 'Data & AI', family: 'python' },
  { id: 'go', name: 'Go', ext: 'go', badge: 'GO 1.24', category: 'Systems', family: 'go' },
  { id: 'cpp', name: 'C++', ext: 'cpp', badge: 'C++23', category: 'Systems', family: 'cpp' },
  { id: 'c', name: 'C', ext: 'c', badge: 'C23', category: 'Systems', family: 'c' },
  { id: 'csharp', name: 'C#', ext: 'cs', badge: '.NET 9', category: 'JVM & .NET', family: 'jvm' },
  { id: 'java', name: 'Java', ext: 'java', badge: 'JDK 23', category: 'JVM & .NET', family: 'jvm' },
  { id: 'kotlin', name: 'Kotlin', ext: 'kt', badge: 'KT 2.1', category: 'JVM & .NET', family: 'ts' },
  { id: 'swift', name: 'Swift', ext: 'swift', badge: 'SWIFT 6', category: 'Systems', family: 'ts' },
  { id: 'zig', name: 'Zig', ext: 'zig', badge: 'ZIG 0.14', category: 'Systems', family: 'rust' },
  { id: 'odin', name: 'Odin', ext: 'odin', badge: 'ODIN', category: 'Systems', family: 'go' },
  { id: 'nim', name: 'Nim', ext: 'nim', badge: 'NIM 2.2', category: 'Systems', family: 'python' },
  { id: 'haskell', name: 'Haskell', ext: 'hs', badge: 'GHC 9.10', category: 'Functional', family: 'functional' },
  { id: 'ocaml', name: 'OCaml', ext: 'ml', badge: 'OCAML 5', category: 'Functional', family: 'functional' },
  { id: 'elixir', name: 'Elixir', ext: 'ex', badge: 'OTP 27', category: 'Functional', family: 'beam' },
  { id: 'erlang', name: 'Erlang', ext: 'erl', badge: 'BEAM', category: 'Functional', family: 'beam' },
  { id: 'gleam', name: 'Gleam', ext: 'gleam', badge: 'GLEAM 1.6', category: 'Functional', family: 'rust' },
  { id: 'clojure', name: 'Clojure', ext: 'clj', badge: 'CLJ 1.12', category: 'Functional', family: 'lisp' },
  { id: 'scala', name: 'Scala', ext: 'scala', badge: 'SCALA 3', category: 'JVM & .NET', family: 'ts' },
  { id: 'fsharp', name: 'F#', ext: 'fs', badge: 'F# 9', category: 'Functional', family: 'functional' },
  { id: 'ruby', name: 'Ruby', ext: 'rb', badge: 'RUBY 3.4', category: 'Scripting', family: 'ruby_like' },
  { id: 'crystal', name: 'Crystal', ext: 'cr', badge: 'CRYSTAL', category: 'Systems', family: 'ruby_like' },
  { id: 'php', name: 'PHP', ext: 'php', badge: 'PHP 8.4', category: 'Web', family: 'php_perl' },
  { id: 'hack', name: 'Hack', ext: 'hh', badge: 'HHVM', category: 'Web', family: 'php_perl' },
  { id: 'perl', name: 'Perl', ext: 'pl', badge: 'PERL 5.40', category: 'Scripting', family: 'php_perl' },
  { id: 'lua', name: 'Lua', ext: 'lua', badge: 'LUA 5.4', category: 'Scripting', family: 'lua_r_julia' },
  { id: 'r', name: 'R', ext: 'R', badge: 'R 4.4', category: 'Data & AI', family: 'lua_r_julia' },
  { id: 'julia', name: 'Julia', ext: 'jl', badge: 'JULIA 1.11', category: 'Data & AI', family: 'lua_r_julia' },
  { id: 'dart', name: 'Dart', ext: 'dart', badge: 'DART 3.6', category: 'Web', family: 'jvm' },
  { id: 'solidity', name: 'Solidity', ext: 'sol', badge: 'EVM 0.8', category: 'Web3', family: 'ts' },
  { id: 'move', name: 'Move', ext: 'move', badge: 'SUI / APTOS', category: 'Web3', family: 'rust' },
  { id: 'cairo', name: 'Cairo', ext: 'cairo', badge: 'STARKNET', category: 'Web3', family: 'rust' },
  { id: 'vyper', name: 'Vyper', ext: 'vy', badge: 'EVM PY', category: 'Web3', family: 'python' },
  { id: 'sql', name: 'PostgreSQL', ext: 'sql', badge: 'PG 17', category: 'Data & AI', family: 'sql' },
  { id: 'graphql', name: 'GraphQL', ext: 'graphql', badge: 'GQL', category: 'Web', family: 'config' },
  { id: 'prisma', name: 'Prisma', ext: 'prisma', badge: 'ORM 6', category: 'Data & AI', family: 'config' },
  { id: 'bash', name: 'Bash', ext: 'sh', badge: 'BASH 5.2', category: 'DevOps', family: 'shell' },
  { id: 'zsh', name: 'Zsh', ext: 'zsh', badge: 'ZSH 5.9', category: 'DevOps', family: 'shell' },
  { id: 'powershell', name: 'PowerShell', ext: 'ps1', badge: 'PWSH 7.5', category: 'DevOps', family: 'php_perl' },
  { id: 'dockerfile', name: 'Dockerfile', ext: 'dockerfile', badge: 'DOCKER', category: 'DevOps', family: 'shell' },
  { id: 'yaml', name: 'Kubernetes YAML', ext: 'yaml', badge: 'K8S', category: 'DevOps', family: 'config' },
  { id: 'toml', name: 'Cargo TOML', ext: 'toml', badge: 'TOML', category: 'DevOps', family: 'config' },
  { id: 'html', name: 'HTML5', ext: 'html', badge: 'HTML5', category: 'Web', family: 'markup' },
  { id: 'css', name: 'Modern CSS', ext: 'css', badge: 'CSS4', category: 'Web', family: 'markup' },
  { id: 'wgsl', name: 'WebGPU WGSL', ext: 'wgsl', badge: 'WEBGPU', category: 'Hardware & GPU', family: 'shader' },
  { id: 'glsl', name: 'OpenGL GLSL', ext: 'frag', badge: 'GLSL 460', category: 'Hardware & GPU', family: 'shader' },
  { id: 'verilog', name: 'SystemVerilog', ext: 'sv', badge: 'FPGA', category: 'Hardware & GPU', family: 'hardware' },
  { id: 'vhdl', name: 'VHDL', ext: 'vhd', badge: 'ASIC RTL', category: 'Hardware & GPU', family: 'hardware' },
  { id: 'asm', name: 'x86_64 Assembly', ext: 'asm', badge: 'NASM 64', category: 'Hardware & GPU', family: 'asm' },
  { id: 'fortran', name: 'Fortran', ext: 'f90', badge: 'F2023', category: 'Data & AI', family: 'hardware' },
  { id: 'lisp', name: 'Common Lisp', ext: 'lisp', badge: 'SBCL', category: 'Functional', family: 'lisp' },
  { id: 'scheme', name: 'Scheme', ext: 'scm', badge: 'R7RS', category: 'Functional', family: 'lisp' },
  { id: 'dlang', name: 'D Language', ext: 'd', badge: 'DLANG', category: 'Systems', family: 'cpp' },
  { id: 'syntax_hell', name: 'Syntax Hell', ext: 'hell', badge: 'EXTREME', category: 'Systems', family: 'hell' },
];