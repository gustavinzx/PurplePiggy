// Copia a lógica pura (única fonte: supabase/functions/_shared) para o front. Rode no "prebuild".
const fs = require('fs'), path = require('path')
const from = path.join(__dirname, '..', 'supabase', 'functions', '_shared')
const to = path.join(__dirname, '..', 'src', 'lib', 'finance', 'shared')
fs.mkdirSync(to, { recursive: true })
for (const f of ['pluggy-core.ts', 'finance-totals.ts', 'import-parsers.ts']) {
  fs.copyFileSync(path.join(from, f), path.join(to, f))
}
console.log('shared sincronizado ->', to)
