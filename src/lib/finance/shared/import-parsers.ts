// Importação universal (plano B para qualquer banco): OFX e CSV. Funções puras.
export interface ImportedRow { externalId: string | null; date: string; amount: number; description: string } // amount COM sinal

const toIso = (s: string): string | null => {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(s.trim())
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s.trim())
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`
  const isoM = /^(\d{4})-(\d{2})-(\d{2})/.exec(s.trim())
  return isoM ? `${isoM[1]}-${isoM[2]}-${isoM[3]}` : null
}
export function parseMoney(s: string): number | null {
  let t = s.replace(/[R$\s]/g, '')
  if (!t) return null
  const neg = /^\(.*\)$/.test(t) || t.startsWith('-') || /-$/.test(t)
  t = t.replace(/[()\-]/g, '')
  if (t.includes(',') && t.includes('.')) t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '')
  else if (t.includes(',')) t = t.replace(',', '.')
  const n = Number(t)
  return Number.isFinite(n) ? (neg ? -n : n) : null
}

export function parseOfx(text: string): ImportedRow[] {
  const out: ImportedRow[] = []
  const blocks = text.split(/<STMTTRN>/i).slice(1)
  for (const b of blocks) {
    const tag = (n: string) => new RegExp(`<${n}>([^<\\r\\n]*)`, 'i').exec(b)?.[1]?.trim() ?? ''
    const date = toIso(tag('DTPOSTED')); const amt = parseMoney(tag('TRNAMT'))
    if (!date || amt === null || amt === 0) continue
    out.push({ externalId: tag('FITID') || null, date, amount: amt, description: (tag('MEMO') || tag('NAME') || 'Lançamento').slice(0, 140) })
  }
  return out
}

export function parseCsv(text: string): ImportedRow[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const delim = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const split = (l: string) => { const r: string[] = []; let cur = '', q = false
    for (const ch of l) { if (ch === '"') q = !q; else if (ch === delim && !q) { r.push(cur); cur = '' } else cur += ch }
    r.push(cur); return r.map((x) => x.trim()) }
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const head = split(lines[0]).map(norm)
  const find = (...names: string[]) => head.findIndex((h) => names.some((n) => h.includes(n)))
  const iDate = find('data', 'date'), iDesc = find('descri', 'historico', 'memo', 'lancamento', 'estabelecimento'), iVal = find('valor', 'amount', 'value')
  const iCred = find('credito'), iDeb = find('debito')
  if (iDate < 0 || iDesc < 0 || (iVal < 0 && iCred < 0 && iDeb < 0)) return []
  const out: ImportedRow[] = []
  for (const l of lines.slice(1)) {
    const c = split(l); const date = toIso(c[iDate] || '')
    let amt: number | null = null
    if (iVal >= 0) amt = parseMoney(c[iVal] || '')
    else { const cr = parseMoney(c[iCred] || '') ?? 0; const db = parseMoney(c[iDeb] || '') ?? 0; amt = cr ? Math.abs(cr) : db ? -Math.abs(db) : null }
    if (!date || amt === null || amt === 0) continue
    out.push({ externalId: null, date, amount: amt, description: (c[iDesc] || 'Lançamento').slice(0, 140) })
  }
  return out
}
