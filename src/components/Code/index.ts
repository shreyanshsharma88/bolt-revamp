// @index(['./*.{ts,tsx}', './*/index.{ts,tsx}'], f => `export * from '${f.path.replace(/\/index$/, '')}'`)
export * from './CodeEditor'
export * from './FileExplorer'
export * from './LivePreview'
export * from './TerminalOutput'
