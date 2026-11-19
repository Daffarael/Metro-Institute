import Prism from 'prismjs'

// Unwrap .default if it exists (CJS / ESM compatibility)
const p: typeof Prism = (Prism as any)?.default || Prism

// Ensure Prism is globally available so that Prism component scripts
// (which execute as standalone scripts referencing global `Prism`)
// can safely attach their grammars to `Prism.languages`.
if (typeof window !== 'undefined') {
  ;(window as any).Prism = p
}
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).Prism = p
}
if (typeof global !== 'undefined') {
  ;(global as any).Prism = p
}

export default p
