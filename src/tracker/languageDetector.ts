/**
 * Detect the language of a file from its extension.
 * Mirrors a subset of the languages recognised by WakaTime / chroma.
 */
import * as path from "path";

const MAP: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
  java: "Java",
  kt: "Kotlin",
  kts: "Kotlin",
  swift: "Swift",
  cs: "C#",
  cpp: "C++",
  c: "C",
  h: "C",
  hpp: "C++",
  php: "PHP",
  sh: "Shell",
  bash: "Shell",
  zsh: "Shell",
  ps1: "PowerShell",
  html: "HTML",
  htm: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  xml: "XML",
  md: "Markdown",
  mdx: "MDX",
  sql: "SQL",
  graphql: "GraphQL",
  gql: "GraphQL",
  vue: "Vue",
  svelte: "Svelte",
  dart: "Dart",
  lua: "Lua",
  r: "R",
  jl: "Julia",
  scala: "Scala",
  clj: "Clojure",
  ex: "Elixir",
  exs: "Elixir",
  erl: "Erlang",
  hs: "Haskell",
  pl: "Perl",
  zig: "Zig",
  vuex: "Vue",
};

export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return MAP[ext] ?? "Text";
}
