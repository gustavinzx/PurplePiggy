// scripts/release_app.cjs
// Script de Automação de Lançamento e Atualização In-App do PurplePiggy
// Executa: Bump de versão -> Build web -> Build APK -> Upload Supabase Storage -> Registro em app_releases

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { createClient } = require('@supabase/supabase-js')

function getEnv(key) {
  if (process.env[key]) return process.env[key]
  const envPath = path.resolve(__dirname, '../.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(new RegExp('^' + key + '\\s*=\\s*(.*)$', 'm'))
    if (match) return match[1].trim()
  }
  return ''
}

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL')
// Upload do APK e registro em app_releases exigem a service_role (o bucket releases não aceita escrita anônima).
// Defina SUPABASE_SERVICE_ROLE_KEY no .env local (nunca commitar) ou como variável de ambiente.
const SUPABASE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ ERRO: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente no .env ou nas variáveis de ambiente.')
  console.error('   Pegue a chave em Supabase > Project Settings > API Keys (service_role) e adicione ao .env local.')
  process.exit(1)
}

const JAVA_HOME = 'C:\\Users\\gsds0\\.jdks\\jbr-21.0.11'

async function main() {
  console.log('\n======================================================')
  console.log('🚀 [PurplePiggy] Automação Completa de Lançamento (Release)')
  console.log('======================================================\n')

  // 1. Ler argumentos ou derivar versão
  const args = process.argv.slice(2)
  let customVersion = null
  let customNotes = null

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' && args[i + 1]) {
      customVersion = args[i + 1]
      i++
    } else if (args[i] === '--notes' && args[i + 1]) {
      customNotes = args[i + 1]
      i++
    }
  }

  // 2. Ler versão atual de src/lib/appVersion.ts
  const appVersionPath = path.resolve(__dirname, '../src/lib/appVersion.ts')
  let appVersionContent = fs.readFileSync(appVersionPath, 'utf-8')

  const codeMatch = appVersionContent.match(/APP_VERSION_CODE\s*=\s*(\d+)/)
  const nameMatch = appVersionContent.match(/APP_VERSION_NAME\s*=\s*'([^']+)'/)

  const currentCode = codeMatch ? parseInt(codeMatch[1], 10) : 210
  const currentName = nameMatch ? nameMatch[1] : '2.1.0'

  // Calcular nova versão
  const newCode = currentCode + 10
  let newName = customVersion
  if (!newName) {
    const parts = currentName.split('.').map((p) => parseInt(p, 10))
    if (parts.length === 3) {
      parts[1] += 1
      parts[2] = 0
      newName = parts.join('.')
    } else {
      newName = `2.${Math.floor(newCode / 100)}.${newCode % 10}`
    }
  }

  const releaseNotes =
    customNotes ||
    `Atualização do PurplePiggy (v${newName}): Melhorias de desempenho, navegação fluida, novas correções e estabilidade geral.`

  console.log(`📌 Versão Atual:   v${currentName} (código ${currentCode})`)
  console.log(`✨ Nova Versão:    v${newName} (código ${newCode})`)
  console.log(`📝 Notas:          ${releaseNotes}\n`)

  // 3. Atualizar src/lib/appVersion.ts
  console.log('✏️  1/6 Atualizando arquivos de versão do projeto...')
  const newAppVersionContent = `// src/lib/appVersion.ts
// Fonte única da verdade para a versão do aplicativo PurplePiggy
export const APP_VERSION_CODE = ${newCode}
export const APP_VERSION_NAME = '${newName}'
export const APP_RELEASE_YEAR = '2026'
`
  fs.writeFileSync(appVersionPath, newAppVersionContent, 'utf-8')

  // Atualizar package.json
  const pkgPath = path.resolve(__dirname, '../package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.version = newName
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  // Atualizar android/app/build.gradle
  const gradlePath = path.resolve(__dirname, '../android/app/build.gradle')
  if (fs.existsSync(gradlePath)) {
    let gradleContent = fs.readFileSync(gradlePath, 'utf-8')
    gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${newCode}`)
    gradleContent = gradleContent.replace(/versionName\s+"[^"]+"/, `versionName "${newName}"`)
    fs.writeFileSync(gradlePath, gradleContent, 'utf-8')
  }

  // 4. Executar build web de produção (Vite + TS + Mascotes)
  console.log('🔨 2/6 Compilando build web de produção (Vite + TypeScript)...')
  execSync('npm run build', { stdio: 'inherit' })

  // 5. Copiar assets para o projeto Android
  console.log('📱 3/6 Sincronizando com Android via Capacitor...')
  execSync('npx cap copy android', { stdio: 'inherit' })

  // 6. Compilar o APK Android via Gradle
  console.log('🤖 4/6 Compilando APK Android (Gradle assembleDebug)...')
  const env = { ...process.env, JAVA_HOME }
  const gradlewCmd = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew'
  execSync(`${gradlewCmd} assembleDebug`, {
    cwd: path.resolve(__dirname, '../android'),
    stdio: 'inherit',
    env,
  })

  // Copiar o APK final para a raiz
  const builtApkPath = path.resolve(
    __dirname,
    '../android/app/build/outputs/apk/debug/app-debug.apk'
  )
  const targetApkPath = path.resolve(__dirname, '../PurplePiggy.apk')
  fs.copyFileSync(builtApkPath, targetApkPath)
  const apkSize = fs.statSync(targetApkPath).size
  console.log(`📦 APK gerado com sucesso: PurplePiggy.apk (${(apkSize / 1024 / 1024).toFixed(2)} MB)`)

  // 7. Enviar o APK para o Supabase Storage (bucket releases)
  console.log('☁️  5/6 Fazendo upload do APK para Supabase Storage (bucket releases)...')
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const apkBuffer = fs.readFileSync(targetApkPath)

  const { error: uploadErr } = await supabase.storage
    .from('releases')
    .upload('PurplePiggy.apk', apkBuffer, {
      contentType: 'application/vnd.android.package-archive',
      upsert: true,
    })

  if (uploadErr) {
    console.error('❌ Erro no upload para o Storage:', uploadErr)
    process.exit(1)
  }

  const { data: publicUrlData } = supabase.storage
    .from('releases')
    .getPublicUrl('PurplePiggy.apk')
  const downloadUrl = publicUrlData.publicUrl
  console.log(`🔗 URL pública de download: ${downloadUrl}`)

  // 8. Inserir ou atualizar na tabela app_releases do Supabase
  console.log('📡 6/6 Notificando banco de dados (app_releases)...')
  const { error: dbErr } = await supabase.from('app_releases').upsert(
    {
      version_code: newCode,
      version_name: newName,
      download_url: downloadUrl,
      release_notes: releaseNotes,
      is_mandatory: false,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'version_code' }
  )

  if (dbErr) {
    console.error('❌ Erro ao registrar a versão em app_releases:', dbErr)
    process.exit(1)
  }

  console.log('\n======================================================')
  console.log(`🎉 LANÇAMENTO AUTOMATIZADO CONCLUÍDO COM SUCESSO!`)
  console.log(`📲 Nova Versão Disponível: v${newName} (${newCode})`)
  console.log(`⚡ Qualquer usuário em versão anterior receberá o pop-up`)
  console.log(`   automaticamente ao abrir ou alternar para o aplicativo!`)
  console.log('======================================================\n')
}

main().catch((err) => {
  console.error('\n❌ Falha fatal no release:', err)
  process.exit(1)
})
