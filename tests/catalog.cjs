const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.GROWPWE_TEST_URL||'http://127.0.0.1:8080';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.GROWPWE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox'],env:{...process.env,XDG_CACHE_HOME:'/tmp/growpwe-test-cache',XDG_CONFIG_HOME:'/tmp/growpwe-test-config'}});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1100}});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(base);
  await page.waitForFunction(()=>document.getElementById('cultivar-status').textContent.includes('100 cepas'));
  await page.getByRole('button',{name:'Criar lote'}).click();
  await page.getByRole('combobox',{name:'Cultivar / cepa declarada'}).fill('acapulco');
  await page.getByRole('option',{name:/Acapulco Gold/}).click();
  assert.equal(await page.locator('#field-cultivar').inputValue(),'Acapulco Gold');assert.equal(await page.locator('#field-lotName').inputValue(),'Acapulco Gold · lote 01');
  assert.equal(await page.locator('#field-plantType').inputValue(),'Não informado');assert.equal(await page.locator('#field-species').inputValue(),'');
  assert.match(await page.locator('#cultivar-reference').innerText(),/não são medições/);
  assert.equal(await page.locator('#cultivar-reference .reference-values').isVisible(),false);
  await page.locator('#cultivar-reference .reference-details > summary').click();
  assert.match(await page.locator('#cultivar-reference .reference-values').innerText(),/19-24%/);
  await page.locator('#cultivar-reference .reference-details > summary').click();
  await page.locator('#field-started').fill('4');assert.equal(await page.locator('#field-planned').inputValue(),'4');
  await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
  assert.match(await page.locator('#review-fields').innerText(),/Referência enviada · Acapulco Gold/);assert.equal(await page.locator('#total').innerText(),'04');
  await page.getByRole('button',{name:'Confirmar e criar lote'}).click();
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('growpwe-v1')));assert.equal(saved.specimens.length,8);const lot=saved.lots[0];
  assert.equal(lot.data.plantType,'Não informado');assert.equal(lot.data.species,null);assert.equal(lot.data.cultivarReference.record.cepa,'Acapulco Gold');assert.equal(lot.data.cultivarReference.source.verification_status,'unverified');assert.equal(lot.data.cultivarReference.record.thc_medio,'19-24%');
  // Reference snapshot is retained on reload, in detail views and the export.
  await page.reload();await page.locator('[data-page="specimens"]').click();const specimen=saved.specimens.find(s=>s.lotId===lot.id);
  await page.getByRole('button',{name:'Detalhes de '+specimen.name,exact:true}).click();assert.match(await page.locator('#detail-fields').innerText(),/Referência enviada · Acapulco Gold/);await page.locator('#close-details').click();
  const exported=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar registros'}).click();const download=await exported;await download.saveAs('/tmp/growpwe-catalog-export.json');assert.equal(JSON.parse(require('node:fs').readFileSync('/tmp/growpwe-catalog-export.json','utf8')).lots[0].data.cultivarReference.record.id,1);
  await page.getByRole('button',{name:'Criar lote'}).click();assert.equal(await page.locator('#cultivar-reference').innerText(),'');
  await page.locator('#field-lotName').fill('Nome escolhido pela associação');
  // Search ignores punctuation and keyboard selection does not submit the form.
  await page.locator('#field-cultivar').fill('ak47');await page.locator('#field-cultivar').press('ArrowDown');await page.locator('#field-cultivar').press('Enter');
  assert.equal(await page.locator('#field-cultivar').inputValue(),'AK-47');assert.equal(await page.locator('#field-lotName').inputValue(),'Nome escolhido pela associação');assert(await page.locator('#field-cultivar').isVisible());
  await page.locator('#field-cultivar').fill('Minha cepa particular');assert.equal(await page.locator('#cultivar-reference').innerText(),'');assert.match(await page.locator('#cultivar-status').innerText(),/cadastro manual/);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();assert.equal(await page.locator('#review .catalog-reference').count(),0);
  await page.getByRole('button',{name:'Confirmar e criar lote'}).click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('growpwe-v1')));assert.equal(saved.lots[1].data.cultivarReference,null);assert.equal(saved.lots[1].data.cultivar,'Minha cepa particular');
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Criar lote'}).click();await page.locator('#field-cultivar').fill('blue');await page.getByRole('option',{name:/Blue Dream/}).click();
  assert.equal(await page.locator('#create-dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'/tmp/growpwe-catalog-mobile.png',fullPage:true});await page.locator('#cancel').click();
  const fallback=await context.newPage();await fallback.route('**/data/cultivars.json',route=>route.abort());await fallback.goto(base);await fallback.waitForFunction(()=>document.getElementById('cultivar-status').textContent.includes('indisponível'));
  await fallback.getByRole('button',{name:'Criar lote'}).click();await fallback.locator('#field-cultivar').fill('Cadastro sem catálogo');await fallback.locator('#field-lotName').fill('Fallback');await fallback.getByRole('button',{name:'Continuar',exact:true}).click();await fallback.getByRole('button',{name:'Continuar',exact:true}).click();await fallback.getByRole('button',{name:'Confirmar e criar lote'}).click();assert.match(await fallback.locator('#toast').innerText(),/Lote salvo/);
  assert.equal(errors.length,0,errors.join('; '));await context.close();
  console.log('PASS: 100-entry catalog, search, keyboard selection, quantity defaults, reference provenance/snapshot, no guessed plant type, manual custom names, reset, persisted/exported references, mobile layout and offline catalog fallback.');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
