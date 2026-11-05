const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '../docs/v2-metas');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function verifyMetas() {
  console.log('🚀 [verify_metas_v2] Iniciando verificação completa da tela /metas...');
  
  const browser = await chromium.launch({ headless: true });

  // 1. Viewport 390x844
  const context390 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context390.newPage();

  console.log('1. Autenticando com usuário Demo...');
  await page.goto('http://127.0.0.1:5173/entrar');
  const demoBtn = page.locator('text=Ver modo demonstração');
  await demoBtn.click();
  await page.waitForURL('**/inicio', { timeout: 15000 });
  await page.waitForTimeout(3000);

  console.log('2. Navegando para /metas...');
  await page.click('nav a:has-text("Metas")');
  await page.waitForURL('**/metas', { timeout: 10000 });
  await page.waitForTimeout(1500);

  // Garantir que a lista carregou
  await page.waitForSelector('text=Suas metas', { timeout: 5000 });
  await page.waitForTimeout(1000);

  // Capturar screenshot principal 390x844
  const path390 = path.join(OUTPUT_DIR, 'metas-390x844.png');
  await page.screenshot({ path: path390 });
  console.log(`✅ Screenshot 390x844 salvo em: ${path390}`);

  // Verificar elementos obrigatórios
  const headerTitle = await page.locator('text=Suas metas').isVisible();
  const headerSubtitle = await page.locator('text=Pequenos passos, grandes conquistas.').isVisible();
  console.log(`🔎 Cabeçalho título visível: ${headerTitle}, subtítulo visível: ${headerSubtitle}`);

  // Verificar mascote com pose trophy
  const mascotTrophy = page.locator('img[src*="pig-trophy"]');
  const trophyVisible = await mascotTrophy.first().isVisible();
  console.log(`🔎 Mascote com troféu visível: ${trophyVisible}`);

  // Verificar colisão texto x mascote
  const textBounding = await page.locator('h1:has-text("Suas metas")').boundingBox();
  const mascotBounding = await mascotTrophy.first().boundingBox();
  console.log('📍 Bounding box do texto:', textBounding);
  console.log('📍 Bounding box do mascote:', mascotBounding);

  if (textBounding && mascotBounding) {
    const overlapX = Math.max(0, Math.min(textBounding.x + textBounding.width, mascotBounding.x + mascotBounding.width) - Math.max(textBounding.x, mascotBounding.x));
    const overlapY = Math.max(0, Math.min(textBounding.y + textBounding.height, mascotBounding.y + mascotBounding.height) - Math.max(textBounding.y, mascotBounding.y));
    const overlapArea = overlapX * overlapY;
    console.log(`📐 Área de colisão Texto x Mascote: ${overlapArea.toFixed(2)} px²`);
    if (overlapArea > 0) {
      console.warn('⚠️ Alerta: Detectada sobreposição entre texto e mascote!');
    } else {
      console.log('✅ Nenhuma sobreposição: mascote fica perfeitamente à direita do texto.');
    }
  }

  // Verificar botão Criar nova meta
  const btnCriarMeta = page.locator('button:has-text("Criar nova meta")');
  const btnVisible = await btnCriarMeta.isVisible();
  console.log(`🔎 Botão "+ Criar nova meta" visível: ${btnVisible}`);

  // Abrir modal de criação para capturar grid de ícones 3D
  console.log('3. Abrindo modal de criação de meta para validar ícones 3D...');
  await btnCriarMeta.click();
  await page.waitForTimeout(600);
  const pathCreate = path.join(OUTPUT_DIR, 'metas-criar-390x844.png');
  await page.screenshot({ path: pathCreate });
  console.log(`✅ Screenshot do Modal de Criar Meta salvo em: ${pathCreate}`);

  // Fechar modal de criação
  const closeBtn = page.locator('button:has(svg.lucide-x)');
  if (await closeBtn.first().isVisible()) {
    await closeBtn.first().click();
    await page.waitForTimeout(500);
  }

  // Clicar no primeiro card de meta para validar o sheet de detalhes
  console.log('4. Clicando no primeiro card de meta para validar sheet de detalhes...');
  const firstCard = page.locator('div[class*="cursor-pointer"]:has(h3)').first();
  if (await firstCard.isVisible()) {
    await firstCard.click();
    await page.waitForTimeout(600);
    const pathSheet = path.join(OUTPUT_DIR, 'metas-sheet-390x844.png');
    await page.screenshot({ path: pathSheet });
    console.log(`✅ Screenshot do Sheet de Detalhes salvo em: ${pathSheet}`);

    // Fechar sheet
    const closeSheet = page.locator('button:has(svg.lucide-x)');
    if (await closeSheet.first().isVisible()) {
      await closeSheet.first().click();
      await page.waitForTimeout(500);
    }
  }

  await context390.close();

  // 2. Viewport 360x780 (Mobile Android padrão)
  console.log('5. Testando no viewport Android 360x780...');
  const context360 = await browser.newContext({
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 2,
  });
  const page360 = await context360.newPage();
  await page360.goto('http://127.0.0.1:5173/entrar');
  await page360.click('text=Ver modo demonstração');
  await page360.waitForURL('**/inicio', { timeout: 15000 });
  await page360.waitForTimeout(3000);
  await page360.click('nav a:has-text("Metas")');
  await page360.waitForURL('**/metas', { timeout: 10000 });
  await page360.waitForTimeout(1500);

  const path360 = path.join(OUTPUT_DIR, 'metas-360x780.png');
  await page360.screenshot({ path: path360 });
  console.log(`✅ Screenshot 360x780 salvo em: ${path360}`);

  await context360.close();
  await browser.close();

  console.log('✨ [verify_metas_v2] Verificação Playwright concluída com sucesso!');
}

verifyMetas().catch((err) => {
  console.error('❌ Erro na verificação:', err);
  process.exit(1);
});
