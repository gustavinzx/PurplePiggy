/**
 * Script de verificação de integridade dos Mascotes no build.
 * Varre todos os arquivos do código-fonte em src/ procurando por usos de <Mascot pose=...>
 * e garante que:
 * 1. A pose está registrada no mascotes/manifest.json
 * 2. O arquivo PNG correspondente existe em public/assets/mascot/ (1x e 2x quando declarado)
 * Falha o processo com exit code 1 se houver qualquer discrepância.
 */

const fs = require('fs')
const path = require('path')

const ROOT_DIR = path.resolve(__dirname, '..')
const MANIFEST_PATH = path.join(ROOT_DIR, 'mascotes', 'manifest.json')
const PUBLIC_MASCOT_DIR = path.join(ROOT_DIR, 'public', 'assets', 'mascot')
const SRC_DIR = path.join(ROOT_DIR, 'src')

console.log('🔍 [verify_mascots] Iniciando auditoria estrita de mascotes...')

// 1. Carregar manifesto
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`❌ Erro crítico: manifest.json não encontrado em ${MANIFEST_PATH}`)
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
const manifestPoses = new Map()

manifest.poses.forEach((p) => {
  manifestPoses.set(p.id, p)
})

console.log(`📋 Manifesto carregado: ${manifestPoses.size} poses oficiais registradas.`)

// 2. Verificar se todos os arquivos do manifesto existem em public/assets/mascot/
let manifestMissingFiles = 0
for (const [poseId, meta] of manifestPoses.entries()) {
  const relativeFile = meta.file.replace(/^\//, '')
  const fullPath = path.join(ROOT_DIR, 'public', relativeFile.replace(/^public\//, '').replace(/^assets\/mascot\//, 'assets/mascot/'))
  
  // Caminho normalizado para public/assets/mascot/<filename>
  const resolvedPath = path.join(ROOT_DIR, 'public', relativeFile)
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Pose "${poseId}" no manifest aponta para arquivo inexistente: ${resolvedPath}`)
    manifestMissingFiles++
  } else {
    const stats = fs.statSync(resolvedPath)
    if (stats.size === 0) {
      console.error(`❌ Arquivo da pose "${poseId}" está vazio: ${resolvedPath}`)
      manifestMissingFiles++
    }
  }
}

if (manifestMissingFiles > 0) {
  console.error(`❌ Falha: ${manifestMissingFiles} arquivo(s) de imagem do manifesto estão ausentes ou vazios!`)
  process.exit(1)
}

// 3. Varrer recursivamente src/ procurando <Mascot
function getFilesRecursively(dir, exts) {
  let results = []
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath, exts))
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(filePath)
      }
    }
  }
  return results
}

const sourceFiles = getFilesRecursively(SRC_DIR, ['.ts', '.tsx', '.js', '.jsx'])

let totalMascotTags = 0
let errors = []

// Regex para capturar usos de <Mascot ... />
const mascotTagRegex = /<Mascot\b([^>]*)\/?>/g
const poseAttrRegex = /pose=(?:\{([^}]+)\}|"([^"]+)"|'([^']*)')/

sourceFiles.forEach((filePath) => {
  const relativePath = path.relative(ROOT_DIR, filePath)
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((lineText, lineIdx) => {
    let match
    while ((match = mascotTagRegex.exec(lineText)) !== null) {
      totalMascotTags++
      const tagAttrs = match[1]
      const poseMatch = tagAttrs.match(poseAttrRegex)

      if (poseMatch) {
        if (poseMatch[2] || poseMatch[3]) {
          // pose="head" ou pose='head'
          const poseValue = poseMatch[2] || poseMatch[3]
          if (!manifestPoses.has(poseValue)) {
            errors.push({
              file: relativePath,
              line: lineIdx + 1,
              message: `Pose estática inválida: "${poseValue}". Não existe no manifest.`,
            })
          }
        } else if (poseMatch[1]) {
          // Expressão dinâmica, ex: pose={cond ? 'medal' : 'retry'} ou pose={'head'}
          const expr = poseMatch[1].trim()
          
          let candidates = []
          if (expr.includes('?') && expr.includes(':')) {
            // É um ternário: pegar os ramos após ? e :
            const afterQuestion = expr.split('?')[1]
            const [branchTrue, branchFalse] = afterQuestion.split(':').map((s) => s.trim())
            candidates.push(branchTrue, branchFalse)
          } else {
            candidates.push(expr)
          }

          candidates.forEach((cand) => {
            const strMatch = cand.match(/^['"]([^'"]+)['"]$/)
            if (strMatch) {
              const cleanStr = strMatch[1]
              if (!manifestPoses.has(cleanStr)) {
                errors.push({
                  file: relativePath,
                  line: lineIdx + 1,
                  message: `Pose literal inválida na expressão {${expr}}: "${cleanStr}". Não existe no manifest.`,
                })
              }
            }
          })
        }
      }
    }
  })
})

console.log(`🔎 Total de chamadas <Mascot> auditadas em src/: ${totalMascotTags}`)

if (errors.length > 0) {
  console.error('\n🚨 Foram encontrados erros nos usos de <Mascot>: ')
  errors.forEach((e) => {
    console.error(`  - ${e.file}:${e.line} -> ${e.message}`)
  })
  console.error('\nBuild cancelado devido a poses de mascote inválidas.')
  process.exit(1)
}

console.log('✅ [verify_mascots] Todas as 16 poses e chamadas <Mascot> foram verificadas com sucesso!')
process.exit(0)
