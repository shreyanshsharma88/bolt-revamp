// @index(['./*.{ts,tsx}', './*/index.{ts,tsx}'], f => `export * from '${f.path.replace(/\/index$/, '')}'`)
export * from './boltParser'
export * from './streamParser'
export * from './webContainer'
