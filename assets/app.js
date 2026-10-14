'use strict';
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'growpwe-v1';
const phaseOptions = ['Não informado', 'Sementes', 'Clonagem', 'Enraizamento', 'Vegetação', 'Floração', 'Encerrado'];
const groups = [
  {title: 'Lote e quantidades', step: 0, fields: [
    ['lotName', 'Nome do lote', 'text', {required:true,maxLength:80}],
    ['prefix', 'Prefixo de identificação', 'text', {required:true,maxLength:8,value:'GP',pattern:'[A-Za-z0-9]{1,8}',hint:'Letras e números, até 8 caracteres. O sistema acrescenta um código de lote e a sequência.'}],
    ['planned', 'Quantidade planejada', 'number', {required:true,min:1,max:1000,step:1,value:1}],
    ['started', 'Quantidade de espécimes neste lote', 'number', {required:true,min:0,max:1000,step:1,value:1,hint:'Somente estas unidades receberão registros e etiquetas. Máximo de 1.000 por cadastro.'}],
    ['startDate', 'Data de início', 'date'], ['phase', 'Fase registrada', 'select', {options:phaseOptions}],
    ['responsible', 'Responsável / código da equipe', 'text'], ['cycle', 'Ciclo / projeto de pesquisa', 'text']
  ]},
  {title: 'Material biológico e origem', step: 0, fields: [
    ['species', 'Espécie declarada', 'text'], ['cultivar', 'Cultivar / cepa declarada', 'text'],
    ['plantType', 'Resposta ao fotoperíodo declarada', 'select', {options:['Não informado','Fotoperiódica','Autoflorescente','Outra / desconhecida']}],
    ['origin', 'Origem do material', 'select', {options:['Não informado','Semente','Muda','Material propagado','Outra']}],
    ['seedClass', 'Classificação comercial da semente', 'select', {options:['Não informado','Regular','Feminizada','Outra / não se aplica']}],
    ['observedSex', 'Sexo observado', 'select', {options:['Não observado','Feminino','Masculino','Intersexo','Não se aplica']}],
    ['supplier', 'Fornecedor / instituição de origem', 'text'], ['sourceLot', 'Lote do fornecedor / origem', 'text'],
    ['parent', 'Identificador do material de origem', 'text'], ['evidence', 'Fonte das características declaradas', 'text', {hint:'Ex.: rótulo do fornecedor, documento ou observação. Declaração não equivale a verificação genética.'}]
  ]},
  {title: 'Local e sistema registrado', step: 1, fields: [
    ['environment', 'Ambiente', 'select', {options:['Não informado','Interno','Externo','Protegido']}],
    ['location', 'Sala / setor / bancada', 'text'], ['position', 'Posição / bloco experimental', 'text'],
    ['area', 'Área associada ao lote (m²)', 'number', {min:0,step:'any',hint:'Informe qual área foi considerada nas observações.'}],
    ['method', 'Metodologia declarada', 'select', {options:['Não informado','SOG','SCROG','Outra']}],
    ['methodNotes', 'Descrição do sistema e da área', 'text']
  ]},
  {title: 'Recipientes e meio de cultivo', step: 1, fields: [
    ['containerBrand', 'Marca do recipiente', 'text'], ['containerModel', 'Modelo do recipiente', 'text'],
    ['containerShape', 'Formato', 'select', {options:['Não informado','Circular','Quadrado','Retangular','Outro']}],
    ['containerMaterial', 'Material do recipiente', 'text'], ['containerVolume', 'Volume nominal (L)', 'number', {min:0,step:'any'}],
    ['containerDimensions', 'Dimensões do recipiente (cm)', 'text', {hint:'Identifique altura, largura e profundidade; não calcule volume útil apenas pela forma.'}],
    ['plantsPerContainer', 'Plantas por recipiente', 'number', {min:1,step:1}],
    ['drainage', 'Características de drenagem registradas', 'text'],
    ['medium', 'Meio de cultivo', 'select', {options:['Não informado','Solo vivo','Fibra de coco','Lã de rocha','Solo / mistura','Outro']}],
    ['substrateBrand', 'Fabricante / produto do substrato', 'text'], ['substrateLot', 'Lote do substrato', 'text'],
    ['substrateComposition', 'Composição declarada do substrato', 'text']
  ]},
  {title: 'Iluminação e equipamentos — opcional', step: 1, advanced: true, fields: [
    ['lightBrand', 'Marca do painel', 'text'], ['lightModel', 'Modelo do painel', 'text'],
    ['ledMaker', 'Fabricante dos componentes LED', 'text'], ['ledModel', 'Modelo dos componentes LED', 'text'],
    ['panelCount', 'Quantidade de painéis', 'number', {min:0,step:1}],
    ['nominalPower', 'Potência nominal por painel (W)', 'number', {min:0,step:'any'}],
    ['measuredPower', 'Potência medida por painel (W)', 'number', {min:0,step:'any'}],
    ['powerMethod', 'Instrumento e condições da medição de potência', 'text'],
    ['lightSetting', 'Regulagem e posicionamento registrados', 'text'],
    ['lightSchedule', 'Horários de funcionamento registrados', 'text'],
    ['ventilation', 'Ventilação — marca / modelo / configuração', 'text'],
    ['climateEquipment', 'Climatização — marca / modelo', 'text'],
    ['irrigation', 'Sistema de irrigação registrado', 'text'],
    ['instruments', 'Instrumentos — modelo / identificação / calibração', 'text']
  ]},
  {title: 'Pesquisa e rastreabilidade — opcional', step: 1, advanced:true, fields: [
    ['studyDesign', 'Desenho do estudo / grupos de comparação', 'text'],
    ['observationUnit', 'Unidade de observação', 'select', {options:['Não informado','Planta','Recipiente','Lote','Sala','Outra']}],
    ['controls', 'Controles / repetições / fatores registrados', 'text'],
    ['waterSource', 'Origem da água', 'text'], ['documents', 'Referências de documentos / protocolos', 'text'],
    ['resultMethod', 'Método previsto de avaliação dos resultados', 'text'],
    ['costNotes', 'Despesas / equipamentos vinculados (observações)', 'text'],
    ['notes', 'Observações e limitações', 'textarea', {maxLength:4000}]
  ]}
];
const fields = groups.flatMap(g=>g.fields);
let state, lastRaw = null, storageBlocked = false, storageCorrupt = false;
let filter = 'all', step = 0, reviewedDraft = null, detailedSpecimen = null;
let cultivarPicker, autoLotName=null, plannedEdited=false;
const selected = new Set(); let printSelection = [];
function uuid(){return crypto.randomUUID()}
function validState(data){
  return data && data.version===1 && Array.isArray(data.lots) && Array.isArray(data.specimens)
    && data.lots.every(l=>l && typeof l.id==='string' && l.data && typeof l.data.lotName==='string')
    && data.specimens.every(s=>s && typeof s.id==='string' && typeof s.name==='string' && phaseOptions.includes(s.phase))
    && new Set(data.specimens.map(s=>s.id)).size===data.specimens.length;
}
function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').style.display='none',5500)}
function persist(candidate){
  if(storageCorrupt)throw Error('Os dados locais não puderam ser lidos. Exporte ou preserve o armazenamento antes de corrigir; os dados existentes não foram sobrescritos.');
  const current=localStorage.getItem(STORAGE_KEY);
  if(current!==lastRaw)throw Error('Os registros mudaram em outra aba. Recarregue a página antes de salvar para preservar as alterações.');
  const raw=JSON.stringify(candidate);localStorage.setItem(STORAGE_KEY,raw);lastRaw=raw;storageBlocked=false;
}
function initialize(){
  let legacy;
  try{
    lastRaw=localStorage.getItem(STORAGE_KEY);
    if(lastRaw!==null){state=JSON.parse(lastRaw);if(!validState(state))throw Error('invalid');return}
    const legacyRaw=localStorage.getItem('growpwe-demo');
    if(legacyRaw!==null){legacy=JSON.parse(legacyRaw);if(!Array.isArray(legacy)||!legacy.every(x=>x&&typeof x.name==='string'&&phaseOptions.includes(x.phase)))throw Error('invalid legacy')}
  }catch(error){
    if(error.name==='SecurityError'){storageBlocked=true}else{storageCorrupt=true}
    toast(storageCorrupt?'Dados locais inválidos: preservados sem alteração. O cadastro está bloqueado.':'O navegador bloqueou o armazenamento. Os exemplos são temporários; o cadastro precisará de armazenamento disponível.');
  }
  const defaults=[{name:'HZ-001',phase:'Sementes'},{name:'HZ-002',phase:'Vegetação'},{name:'HZ-003',phase:'Vegetação'},{name:'HZ-004',phase:'Floração'}];
  state={version:1,lots:[],specimens:(storageCorrupt?[]:(legacy||defaults)).map(s=>({id:uuid(),name:s.name,phase:s.phase,lotId:null,createdAt:null,demonstration:!legacy,history:[]}))};
  if(!storageCorrupt){try{persist(state)}catch{storageBlocked=true}}
}
function createField(definition){
  const [key,label,type,options={}] = definition;
  const wrapper=document.createElement('div');if(type==='textarea')wrapper.className='full-width';
  const lab=document.createElement('label');lab.htmlFor='field-'+key;lab.textContent=label+(options.required?' *':'');
  const input=document.createElement(type==='select'?'select':type==='textarea'?'textarea':'input');
  input.id='field-'+key;input.name=key;
  if(type==='select'){for(const value of options.options){const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option)}}
  else if(type==='textarea'){input.rows=3}else input.type=type;
  if(type==='text')input.maxLength=300;
  for(const attribute of ['required','min','max','step','maxLength','pattern'])if(options[attribute]!==undefined)input[attribute]=options[attribute];
  if(options.value!==undefined)input.defaultValue=options.value;
  wrapper.append(lab,input);
  if(options.hint){const hint=document.createElement('p');hint.className='field-hint';hint.id='hint-'+key;hint.textContent=options.hint;input.setAttribute('aria-describedby',hint.id);wrapper.append(hint)}
  return wrapper;
}
function buildForm(){
  const quickFields={
    'Lote e quantidades':['lotName','started','startDate','phase'],
    'Material biológico e origem':['cultivar','plantType','origin'],
    'Local e sistema registrado':['environment','location'],
    'Recipientes e meio de cultivo':['medium','containerVolume','containerShape']
  };
  const ordered=[groups[1],groups[0],...groups.slice(2)];
  for(const group of ordered){
    const section=document.createElement(group.advanced?'details':'fieldset');section.className='field-group';section.dataset.step=group.step;
    const title=document.createElement(group.advanced?'summary':'legend');title.textContent=group.title;section.append(title);
    const grid=document.createElement('div');grid.className='form-grid';
    const quick=quickFields[group.title];
    const visible=quick?quick.map(key=>group.fields.find(field=>field[0]===key)):group.fields;
    for(const definition of visible)grid.append(createField(definition));section.append(grid);
    if(quick){const advanced=document.createElement('details');advanced.className='additional-fields';const summary=document.createElement('summary');summary.textContent=group.step===0?'Mais informações e rastreabilidade (opcional)':'Detalhar configuração (opcional)';const extra=document.createElement('div');extra.className='form-grid';for(const definition of group.fields.filter(field=>!quick.includes(field[0])))extra.append(createField(definition));advanced.append(summary,extra);section.append(advanced)}
    $('form-fields').append(section);
  }
  cultivarPicker=GrowPWECatalog.attach($('field-cultivar'),{
    onSelect:record=>{if(!$('field-lotName').value.trim()||$('field-lotName').value===autoLotName){autoLotName=(record.cepa+' · lote '+String(state.lots.length+1).padStart(2,'0')).slice(0,80);$('field-lotName').value=autoLotName}},
    onClear:()=>{if($('field-lotName').value===autoLotName)$('field-lotName').value='';autoLotName=null}
  });
  $('field-started').addEventListener('input',()=>{if(!plannedEdited)$('field-planned').value=Math.max(1,Number($('field-started').value)||1)});
  $('field-planned').addEventListener('input',()=>plannedEdited=true);
}
function localDate(){const now=new Date();return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-')}
function readDraft(){
  const data={};for(const [key,,type] of fields){const raw=$('field-'+key).value.trim();data[key]=raw===''?null:type==='number'?Number(raw):raw}
  data.cultivarReference=cultivarPicker.getSelection();
  return data;
}
function dataList(data, definitions, compact=false){
  const list=document.createElement('dl');list.className='data-list';
  for(const [key,label] of definitions){if(compact&&!["phase","plantType","origin","medium"].includes(key)&&(data[key]===null||data[key]===undefined||data[key]===''||data[key]==='Não informado'||data[key]==='Não observado'))continue;const term=document.createElement('dt');term.textContent=label;const description=document.createElement('dd');description.textContent=data[key]===null||data[key]===undefined||data[key]===''?'Não informado':String(data[key]);list.append(term,description)}return list;
}
function validateStep(){
  $('form-error').textContent='';
  for(const group of groups.filter(g=>g.step===step)){
    for(const [key] of group.fields){const input=$('field-'+key);if(!input.checkValidity()){const details=input.closest('details');if(details)details.open=true;input.reportValidity();input.focus();return false}}
  }
  const data=readDraft();
  if(step===0){
    if(!data.lotName || !/^[A-Za-z0-9]{1,8}$/.test(data.prefix||'')){ $('form-error').textContent='Informe o nome do lote e um prefixo válido.';return false}
    if(!Number.isInteger(data.planned)||!Number.isInteger(data.started)||data.started>data.planned){$('form-error').textContent='As unidades iniciadas devem ser um número inteiro menor ou igual à quantidade planejada.';return false}
  }return true;
}
function setStep(value){
  cultivarPicker.close();step=value;$('review').hidden=step!==2;$('form-fields').hidden=step===2;
  document.querySelectorAll('[data-step]').forEach(el=>el.hidden=Number(el.dataset.step)!==step);
  document.querySelectorAll('[data-step-indicator]').forEach(el=>{const current=Number(el.dataset.stepIndicator)===step;el.classList.toggle('current',current);if(current)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});
  $('previous').hidden=step===0;$('next').textContent=step===2?'Confirmar e criar lote':'Continuar';$('form-error').textContent='';
  if(step===2){reviewedDraft=readDraft();$('review-summary').textContent=`${reviewedDraft.planned} unidades planejadas; ${reviewedDraft.started} espécimes serão criados e poderão receber etiquetas. Os dados permanecem privados neste navegador.`;$('review-fields').replaceChildren();for(const group of groups){const section=document.createElement('section');section.className='review-section';const heading=document.createElement('h3');heading.textContent=group.title;const values=dataList(reviewedDraft,group.fields,true);if(values.children.length){section.append(heading,values);$('review-fields').append(section);}if(group.title==='Material biológico e origem'&&reviewedDraft.cultivarReference)$('review-fields').append(GrowPWECatalog.renderReference(reviewedDraft.cultivarReference))}}
  $('create-dialog').scrollTop=0;
}
function openCreate(){
  $('create-form').reset();cultivarPicker.reset();autoLotName=null;plannedEdited=false;$('field-startDate').value=localDate();document.querySelectorAll('#create-form details').forEach(el=>el.open=false);reviewedDraft=null;setStep(0);$('create-dialog').showModal();$('field-cultivar').focus();
}
function saveLot(){
  const data=reviewedDraft;if(!data){$('form-error').textContent='Revise o lote antes de confirmar.';return}
  const now=new Date().toISOString(),lotId=uuid(),batch=lotId.replaceAll('-','').slice(0,12).toUpperCase();
  const lot={id:lotId,data:structuredClone(data),createdAt:now,history:[{type:'created',at:now}]};
  const specimens=Array.from({length:data.started},(_,index)=>({id:uuid(),name:`${data.prefix.toUpperCase()}-${batch}-${String(index+1).padStart(3,'0')}`,phase:data.phase,lotId,createdAt:now,history:[{type:'created',at:now,phase:data.phase}]}));
  const candidate={...state,lots:[...state.lots,lot],specimens:[...state.specimens,...specimens]};
  try{persist(candidate)}catch(error){$('form-error').textContent=error.message.includes('outra aba')?error.message:'Não foi possível salvar. O lote não foi criado. Verifique o armazenamento do navegador e exporte os registros existentes.';return}
  state=candidate;reviewedDraft=null;render();$('create-dialog').close();page('specimens');toast(specimens.length?`Lote salvo: ${specimens.length} espécimes criados. Você pode selecionar e imprimir suas etiquetas.`:'Planejamento salvo. Nenhum espécime foi criado porque a quantidade iniciada é zero.');
}
function lotFor(specimen){return state.lots.find(l=>l.id===specimen.lotId)}
function activeSpecimens(){return state.specimens.filter(s=>!s.archivedAt&&!lotFor(s)?.archivedAt)}
function activeLots(){return state.lots.filter(l=>!l.archivedAt)}
function visibleSpecimens(){const query=$('specimen-search').value.trim().toLocaleLowerCase('pt-BR');return activeSpecimens().filter(s=>(filter==='all'||s.phase===filter)&&(!query||[s.name,lotFor(s)?.data.lotName,lotFor(s)?.data.cultivar].some(value=>value?.toLocaleLowerCase('pt-BR').includes(query))))}
function detail(specimen){
  detailedSpecimen=specimen;$('detail-title').textContent=specimen.name;
  $('detail-copy').textContent='Identificação permanente · '+specimen.id;
  const lot=lotFor(specimen);$('detail-fields').replaceChildren();
  $('detail-fields').append(dataList({phase:specimen.phase,id:specimen.id,createdAt:specimen.createdAt?new Date(specimen.createdAt).toLocaleString('pt-BR'):'Não informado'},[['phase','Fase registrada'],['id','UUID do espécime'],['createdAt','Registro criado em']]));
  if(lot){if(lot.data.cultivarReference)$('detail-fields').append(GrowPWECatalog.renderReference(lot.data.cultivarReference));for(const group of groups){const section=document.createElement('details');section.className='review-section';const summary=document.createElement('summary');summary.textContent=group.title+' · cadastro inicial';section.append(summary,dataList(lot.data,group.fields,true));$('detail-fields').append(section)}}
  else {const p=document.createElement('p');p.textContent='Registro anterior / demonstrativo preservado. Dados de lote não informados.';$('detail-fields').append(p)}
  if(window.Lab)Lab.renderDetail(specimen);$('details').showModal();
}
function render(){
  const rows=$('specimen-rows');rows.replaceChildren();
  for(const specimen of visibleSpecimens()){
    const row=document.createElement('tr'),first=document.createElement('td'),wrap=document.createElement('div');wrap.className='specimen';
    const icon=document.createElement('span');icon.className='plant';icon.textContent='♧';
    const labels=document.createElement('div'),b=document.createElement('b'),small=document.createElement('small');b.textContent=specimen.name;small.textContent=lotFor(specimen)?.data.lotName||'Registro anterior / demonstrativo';labels.append(b,small);wrap.append(icon,labels);first.append(wrap);
    const phase=document.createElement('td'),badge=document.createElement('span');badge.className='phase '+(specimen.phase==='Vegetação'?'v':specimen.phase==='Floração'?'f':'');badge.textContent=specimen.phase;phase.append(badge);
    const visibility=document.createElement('td');visibility.className='private';visibility.textContent='Privado';
    const end=document.createElement('td'),button=document.createElement('button');button.className='row-detail';button.textContent='Ver';button.setAttribute('aria-label','Ver '+specimen.name);button.onclick=()=>detail(specimen);end.append(button);row.append(first,phase,visibility,end);rows.append(row);
  }
  if(!rows.children.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=4;cell.className='empty';cell.textContent='Nenhum registro nesta fase.';row.append(cell);rows.append(row)}
  $('total').textContent=String(activeSpecimens().length).padStart(2,'0');$('phases').textContent=String(new Set(activeSpecimens().map(s=>s.phase).filter(p=>p!=='Não informado')).size).padStart(2,'0');
  $('lot-list').replaceChildren();for(const lot of activeLots()){const card=document.createElement('div');card.className='lot-card';const title=document.createElement('b');title.textContent=lot.data.lotName;const info=document.createElement('p');info.textContent=`${lot.data.planned} planejados · ${activeSpecimens().filter(s=>s.lotId===lot.id).length} registrados`;card.append(title,info);if(window.Lab)Lab.lotActions(card,lot);$('lot-list').append(card)}
  $('specimen-list').replaceChildren();for(const specimen of visibleSpecimens()){
    const row=document.createElement('div');row.className='specimen-item';
    const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id='select-'+specimen.id;checkbox.dataset.specimenId=specimen.id;checkbox.checked=selected.has(specimen.id);checkbox.onchange=()=>{if(checkbox.checked)selected.add(specimen.id);else selected.delete(specimen.id);updateSelection()};
    const label=document.createElement('label');label.htmlFor=checkbox.id;label.append(document.createTextNode(specimen.name));const small=document.createElement('small');small.textContent=(lotFor(specimen)?.data.lotName||'Sem lote informado')+' · '+specimen.phase;label.append(small);
    const button=document.createElement('button');button.className='secondary';button.textContent='Detalhes';button.setAttribute('aria-label','Detalhes de '+specimen.name);button.onclick=()=>detail(specimen);row.append(checkbox,label,button);$('specimen-list').append(row);
  }
  for(const id of selected)if(!activeSpecimens().some(s=>s.id===id))selected.delete(id);
  updateSelection();$('list-count').textContent=visibleSpecimens().length+' registros visíveis de '+activeSpecimens().length+' ativos';if(window.Lab)Lab.render();
}
function updateSelection(){const count=selected.size,visible=visibleSpecimens(),inView=visible.filter(s=>selected.has(s.id)).length;$('selected-count').textContent=`${count} selecionado${count===1?'':'s'}`;$('print-labels').disabled=count===0;$('operate-selected').disabled=count===0;$('select-all').checked=visible.length>0&&inView===visible.length;$('select-all').indeterminate=inView>0&&inView<visible.length}
const titles={overview:['Tudo no seu tempo.','Uma visão clara de cada lote, fase e registro.'],specimens:['Cada espécime, uma história.','Origem, identificação e operações em um só espaço.'],conditions:['Observe. Registre. Compare.','Medições com contexto, método e rastreabilidade.'],references:['Conhecimento com origem.','Documentação e fontes com status de verificação.'],trash:['Histórias preservadas.','Restaure registros excluídos sem alterar seus identificadores.'],community:['Aprender em comunidade.','Compartilhamento voluntário, construído com cuidado.']};
function page(id){document.querySelectorAll('.panel').forEach(el=>el.classList.toggle('visible',el.id===id));document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===id));$('page-title').textContent=titles[id][0];$('page-description').textContent=titles[id][1];$('breadcrumb-page').textContent={overview:'Dashboard',specimens:'Lotes e espécimes',conditions:'Condições',references:'Referências',trash:'Lixeira',community:'Comunidade'}[id];}
function prepareLabels(ids){
  printSelection=activeSpecimens().filter(s=>ids.includes(s.id));if(!printSelection.length)return;if(printSelection.length>5000){toast('Selecione até 5.000 espécimes por trabalho de impressão.');return}
  $('labels-summary').textContent=`${printSelection.length} etiqueta${printSelection.length===1?'':'s'}, uma por espécime selecionado. Inclui código, UUID, lote, cultivar declarada e data de início, quando informados.`;
  $('labels-error').textContent='';$('labels-dialog').showModal();
}
function exportData(){
  const data=storageCorrupt?{unreadableStoredData:lastRaw,exportedAt:new Date().toISOString()}:{...state,exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='growpwe-registros-'+localDate()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
buildForm();initialize();render();
if(storageCorrupt){$('new-specimen').disabled=true;$('export-data').textContent='Exportar cópia do armazenamento';document.querySelector('.demo').textContent='Não foi possível ler os registros locais. Eles foram preservados sem alteração. Exporte uma cópia do armazenamento antes de corrigir; nenhum registro substituto foi criado.';}
document.querySelectorAll('[data-page]').forEach(el=>el.onclick=()=>page(el.dataset.page));document.querySelectorAll('[data-goto]').forEach(el=>el.onclick=()=>page(el.dataset.goto));
document.querySelectorAll('[data-phase]').forEach(el=>el.onclick=()=>{filter=el.dataset.phase;document.querySelectorAll('[data-phase]').forEach(other=>other.classList.toggle('active',other===el));render()});
$('new-specimen').onclick=openCreate;$('cancel').onclick=()=>$('create-dialog').close();$('previous').onclick=()=>setStep(step-1);
// Validate the active step ourselves; hidden required fields must not block navigation.
$('create-form').noValidate=true;$('create-form').onsubmit=event=>{event.preventDefault();if(step===2)saveLot();else if(validateStep())setStep(step+1)};
$('close-details').onclick=()=>$('details').close();$('print-one').onclick=()=>{const id=detailedSpecimen.id;$('details').close();prepareLabels([id])};
$('select-all').onchange=()=>{for(const specimen of visibleSpecimens()){if($('select-all').checked)selected.add(specimen.id);else selected.delete(specimen.id)}render()};
$('print-labels').onclick=()=>prepareLabels([...selected]);$('cancel-labels').onclick=()=>$('labels-dialog').close();$('export-data').onclick=exportData;
$('labels-form').onsubmit=event=>{
  event.preventDefault();$('labels-error').textContent='';
  const job={version:1,width:Number($('label-width').value),height:Number($('label-height').value),layout:$('label-layout').value,createdAt:new Date().toISOString(),records:printSelection.map(s=>({id:s.id,code:s.name,lot:lotFor(s)?.data.lotName||'Sem lote informado',cultivar:lotFor(s)?.data.cultivar||'Não informada',startDate:lotFor(s)?.data.startDate||null}))};
  const jobId=uuid();try{sessionStorage.setItem('growpwe-print-'+jobId,JSON.stringify(job))}catch{$('labels-error').textContent='O navegador bloqueou a preparação da impressão. Permita armazenamento para este site.';return}
  const popup=window.open('labels.html?job='+encodeURIComponent(jobId),'_blank');
  if(!popup){sessionStorage.removeItem('growpwe-print-'+jobId);$('labels-error').textContent='A prévia foi bloqueada. Permita pop-ups para este site e tente novamente.';return}
  // The new tab inherits only a session-local print job; IDs and private data stay out of the URL.
  popup.opener=null;$('labels-dialog').close();
};
window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY)return;try{const updated=JSON.parse(event.newValue);if(!validState(updated))throw Error('invalid');state=updated;lastRaw=event.newValue;storageCorrupt=false;render();toast('Registros atualizados em outra aba.')}catch{toast('O armazenamento mudou. Recarregue antes de salvar novos registros.')}});
fetch('data/reference/catalog.json').then(response=>{if(!response.ok)throw Error('catalog');return response.json()}).then(data=>{$('source-list').replaceChildren();for(const source of data.sources.filter(s=>s.category==='academic_repository_candidate')){const row=document.createElement('div');row.className='timeline';const a=document.createElement('a');a.textContent=source.institution+' · Repositório candidato';a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';a.style.cssText='font-size:12px;color:var(--green)';row.append(a);$('source-list').append(row)}}).catch(()=>{$('source-list').textContent='Não foi possível carregar o catálogo de fontes.'});
