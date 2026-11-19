import Prism from 'prismjs'

// Unwrap .default for ESM / Next.js bundler compatibility
const p: typeof Prism = (Prism as any)?.default || Prism

// ─── SQL GRAMMAR (Built-in Self-Contained) ──────────────────────────────
export const sqlGrammar = {
  comment: {
    pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
    lookbehind: true,
  },
  variable: [
    { pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/, greedy: true },
    /@[\w.$]+/,
  ],
  string: {
    pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
    greedy: true,
    lookbehind: true,
  },
  function: /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE|COALESCE|CONCAT|SUBSTRING)(?=\s*\()/i,
  keyword: /\b(?:ACTION|ADD|AFTER|ALL|ALTER|AND|ANY|AS|ASC|BEGIN|BY|CASE|CHECK|CREATE|CROSS|DEFAULT|DELETE|DESC|DISTINCT|DROP|ELSE|END|EXISTS|FOREIGN|FROM|FULL|GROUP|HAVING|IF|IN|INDEX|INNER|INSERT|INTO|IS|JOIN|KEY|LEFT|LIMIT|NOT|NULL|ON|OR|ORDER|OUTER|PRIMARY|REFERENCES|RIGHT|ROUND|SELECT|SET|TABLE|THEN|TO|TOP|TRUNCATE|UNION|UNIQUE|UPDATE|VALUES|VIEW|WHERE)\b/i,
  boolean: /\b(?:FALSE|NULL|TRUE)\b/i,
  number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
  operator: /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/i,
  punctuation: /[;[\]()`,.]/,
}

// ─── PYTHON GRAMMAR (Built-in Self-Contained) ──────────────────────────
export const pythonGrammar = {
  comment: {
    pattern: /(^|[^\\])#.*/,
    lookbehind: true,
    greedy: true,
  },
  'triple-quoted-string': {
    pattern: /(?:[rub]|br|rb)?("""|''')[\s\S]*?\1/i,
    greedy: true,
    alias: 'string',
  },
  string: {
    pattern: /(?:[rub]|br|rb)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,
    greedy: true,
  },
  function: {
    pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,
    lookbehind: true,
  },
  keyword: /\b(?:and|as|assert|async|await|break|case|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|match|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
  builtin: /\b(?:abs|all|any|bin|bool|dict|enumerate|filter|float|format|help|id|input|int|isinstance|issubclass|iter|len|list|map|max|min|next|object|open|print|range|round|set|sorted|str|sum|super|tuple|type|zip)\b/,
  boolean: /\b(?:False|None|True)\b/,
  number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
  operator: /[-+%=]=?|!=|:=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
  punctuation: /[{}[\];(),.:]/,
}

// ─── JSON GRAMMAR (Built-in Self-Contained) ────────────────────────────
export const jsonGrammar = {
  property: {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
    lookbehind: true,
    greedy: true,
  },
  string: {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"/,
    lookbehind: true,
    greedy: true,
  },
  number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
  punctuation: /[{}[\],]/,
  operator: /:/,
  boolean: /\b(?:false|true)\b/i,
  null: {
    pattern: /\bnull\b/i,
    alias: 'keyword',
  },
}

// ─── BASH GRAMMAR (Built-in Self-Contained) ────────────────────────────
export const bashGrammar = {
  comment: {
    pattern: /(^|[^#])#.*/,
    lookbehind: true,
  },
  string: {
    pattern: /(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
    greedy: true,
  },
  variable: /\$[a-zA-Z_]\w*|\$\{[^}]+\}/,
  function: /\b[a-zA-Z_]\w*(?=\s*\()/,
  keyword: /\b(?:if|then|else|elif|fi|for|while|in|do|done|case|esac|function|select|time|until|echo|cd|ls|mkdir|rm|cp|mv|cat|grep|chmod|curl|wget|npm|pnpm|yarn|npx|git|node|python|docker)\b/,
  boolean: /\b(?:false|true)\b/,
  number: /\b\d+\b/,
  operator: /&&|\|\||[<>|&;=]/,
  punctuation: /[{}[\]();]/,
}

// ─── Register Grammars onto Prism Instance ─────────────────────────────
p.languages.sql = sqlGrammar
p.languages.mysql = sqlGrammar
p.languages.postgres = sqlGrammar
p.languages.postgresql = sqlGrammar
p.languages.sqlite = sqlGrammar

p.languages.python = pythonGrammar
p.languages.py = pythonGrammar
p.languages.python3 = pythonGrammar
p.languages.py3 = pythonGrammar

p.languages.json = jsonGrammar
p.languages.bash = bashGrammar
p.languages.sh = bashGrammar
p.languages.shell = bashGrammar
p.languages.zsh = bashGrammar

// Also provide fallback alias mapping helper
export function getGrammar(lang: string): any {
  const norm = (lang || '').toLowerCase().trim()
  if (norm === 'sql' || norm === 'mysql' || norm === 'postgres' || norm === 'postgresql' || norm === 'sqlite') {
    return sqlGrammar
  }
  if (norm === 'py' || norm === 'python' || norm === 'python3' || norm === 'py3') {
    return pythonGrammar
  }
  if (norm === 'json') {
    return jsonGrammar
  }
  if (norm === 'bash' || norm === 'sh' || norm === 'shell' || norm === 'zsh') {
    return bashGrammar
  }
  return p.languages[norm] || p.languages.javascript || p.languages.clike
}

export default p
