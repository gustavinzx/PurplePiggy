const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../docs/v2-inicio');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function verifyViewport(browser, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log(`\n========================================`);
  console.log(`Testando viewport: ${width}x${height}`);
  console.log(`========================================`);

  await page.goto('http://127.0.0.1:5173/entrar');
  const demoBtn = page.locator('text=Ver modo demonstração');
  await demoBtn.click();
  await page.waitForURL('**/inicio', { timeout: 10000 });

  // Esperar o toast sumir completamente (sonner toast dura ~4s)
  await page.waitForTimeout(5000);

  // Garantir que todos os dados foram renderizados
  await page.waitForSelector('[data-testid="balance-card-container"]', { timeout: 5000 });
  await page.waitForSelector('[data-testid="mascot-wink-container"]', { timeout: 5000 });

  // Medir bounding boxes exatos no viewport
  const bell = await page.locator('button[aria-label="Notificações"]').boundingBox();
  const mascot = await page.locator('[data-testid="mascot-wink-container"]').boundingBox();
  const balanceCard = await page.locator('[data-testid="balance-card-container"]').boundingBox();

  console.log('Medidas Sino (Bell):', bell);
  console.log('Medidas Mascote (Wink):', mascot);
  console.log('Medidas Card de Saldo:', balanceCard);

  if (!bell || !mascot || !balanceCard) {
    throw new Error('Falha ao localizar elementos para medição!');
  }

  // Calcular interseção Mascote x Sino
  const xOverlap = Math.max(0, Math.min(mascot.x + mascot.width, bell.x + bell.width) - Math.max(mascot.x, bell.x));
  const yOverlap = Math.max(0, Math.min(mascot.y + mascot.height, bell.y + bell.height) - Math.max(mascot.y, bell.y));
  const intersectionArea = xOverlap * yOverlap;

  console.log(`\n--- RESULTADOS GEOMÉTRICOS ---`);
  console.log(`Sobreposição X: ${xOverlap.toFixed(2)} px`);
  console.log(`Sobreposição Y: ${yOverlap.toFixed(2)} px`);
  console.log(`Área de Interseção: ${intersectionArea.toFixed(2)} px²`);

  const verticalGap = mascot.y - (bell.y + bell.height);
  console.log(`Distância vertical (Sino -> Mascote): ${verticalGap.toFixed(1)} px`);

  if (intersectionArea > 0) {
    console.error(`❌ FALHA CRÍTICA: Há sobreposição de ${intersectionArea.toFixed(2)} px² entre o mascote e o sino!`);
    throw new Error(`Interseção mascote x sino deve ser ZERO! Encontrado: ${intersectionArea.toFixed(2)} px²`);
  } else {
    console.log(`✅ APROVADO: Interseção Mascote x Sino é rigorosamente ZERO!`);
  }

  // Screenshot da tela completa
  const screenshotPath = path.join(OUT_DIR, `inicio-${width}x${height}.png`);
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot salvo: ${screenshotPath}`);

  // Testar clique no sino para abrir bottom sheet de notificações
  if (width === 390) {
    await page.click('button[aria-label="Notificações"]');
    await page.waitForTimeout(600);
    const notificationsPath = path.join(OUT_DIR, `inicio-notificacoes-${width}x${height}.png`);
    await page.screenshot({ path: notificationsPath });
    console.log(`Screenshot notificações salvo: ${notificationsPath}`);
  }

  await context.close();

  return {
    viewport: `${width}x${height}`,
    bell: {
      x: Number(bell.x.toFixed(1)),
      y: Number(bell.y.toFixed(1)),
      width: Number(bell.width.toFixed(1)),
      height: Number(bell.height.toFixed(1)),
      bottom: Number((bell.y + bell.height).toFixed(1)),
    },
    mascot: {
      x: Number(mascot.x.toFixed(1)),
      y: Number(mascot.y.toFixed(1)),
      width: Number(mascot.width.toFixed(1)),
      height: Number(mascot.height.toFixed(1)),
      top: Number(mascot.y.toFixed(1)),
      bottom: Number((mascot.y + mascot.height).toFixed(1)),
    },
    balanceCard: {
      x: Number(balanceCard.x.toFixed(1)),
      y: Number(balanceCard.y.toFixed(1)),
      width: Number(balanceCard.width.toFixed(1)),
      height: Number(balanceCard.height.toFixed(1)),
    },
    verticalGap: Number(verticalGap.toFixed(1)),
    intersectionArea: Number(intersectionArea.toFixed(2)),
    status: intersectionArea === 0 ? 'APROVADO' : 'REPROVADO',
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  results.push(await verifyViewport(browser, 390, 844));
  results.push(await verifyViewport(browser, 360, 780));

  await browser.close();

  // Salvar relatório JSON com as medidas
  fs.writeFileSync(
    path.join(OUT_DIR, 'medidas.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log('\nTodas as verificações Playwright concluídas com sucesso!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
