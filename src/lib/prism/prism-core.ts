import Prism from 'prismjs'

// Ensure Prism is globally available so that Prism component scripts
// (which execute as standalone scripts referencing global `Prism`)
// can safely attach their grammars to `Prism.languages`.
if (typeof window !== 'undefined') {
  ;(window as any).Prism = Prism
}
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).Prism = Prism
}
if (typeof global !== 'undefined') {
  ;(global as any).Prism = Prism
}

export default Prism
