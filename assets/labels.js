'use strict';
const $=id=>document.getElementById(id);
function text(className,value){const element=document.createElement('div');element.className=className;element.textContent=value;return element}
function short(value,max){return value.length>max?value.slice(0,max-1)+'…':value}
function makeLabel(record,job){
  const label=document.createElement('article');label.className='label'+(job.width<55||job.height<35?' small-label':'');label.dataset.specimenId=record.id;
  const code=short(record.code,job.width<55?24:40);const max=Math.floor(job.width*1.4);
  label.append(text('brand','GROWPWE · IDENTIFICAÇÃO'),text('code',code),text('meta','Lote: '+short(record.lot,max)),text('meta','Cultivar: '+short(record.cultivar,max)));
  if(record.startDate){const parts=record.startDate.split('-');label.append(text('label-date','Início: '+(parts.length===3?parts.reverse().join('/'):short(record.startDate,20))))}
  label.append(text('uuid','UUID '+record.id));return label;
}
try{
  const jobId=new URLSearchParams(location.search).get('job');if(!jobId||!/^[a-f0-9-]{36}$/i.test(jobId))throw Error('Não há um trabalho de impressão válido. Prepare as etiquetas na página de espécimes.');
  const raw=sessionStorage.getItem('growpwe-print-'+jobId);if(!raw)throw Error('A prévia expirou ou esta aba não recebeu os dados. Prepare as etiquetas novamente no mesmo navegador.');
  const job=JSON.parse(raw);
  if(job.version!==1||!Number.isInteger(job.width)||job.width<40||job.width>120||!Number.isInteger(job.height)||job.height<30||job.height>100||!['roll','a4'].includes(job.layout)||!Array.isArray(job.records)||job.records.length<1||job.records.length>5000||!job.records.every(r=>r&&['id','code','lot','cultivar'].every(k=>typeof r[k]==='string')&&/^[a-f0-9-]{36}$/i.test(r.id)&&(!r.startDate||typeof r.startDate==='string')))throw Error('Os dados ou dimensões das etiquetas são inválidos. Volte à página de espécimes.');
  if(new Set(job.records.map(r=>r.id)).size!==job.records.length)throw Error('A seleção contém identificadores duplicados.');
  document.documentElement.style.setProperty('--label-width',job.width+'mm');document.documentElement.style.setProperty('--label-height',job.height+'mm');
  const style=document.createElement('style');style.textContent='@page { size: '+(job.layout==='a4'?'A4':job.width+'mm '+job.height+'mm')+'; margin: '+(job.layout==='a4'?'10mm':'0')+'; }';document.head.append(style);
  const cols=job.layout==='a4'?Math.floor((190+2)/(job.width+2)):1,rows=job.layout==='a4'?Math.floor((277+2)/(job.height+2)):1,perPage=cols*rows;
  for(let index=0;index<job.records.length;index+=perPage){const sheet=document.createElement('section');sheet.className='sheet'+(job.layout==='a4'?' a4':'');sheet.style.gridTemplateColumns=`repeat(${cols}, ${job.width}mm)`;sheet.style.gridAutoRows=job.height+'mm';for(const record of job.records.slice(index,index+perPage))sheet.append(makeLabel(record,job));$('sheets').append(sheet)}
  $('summary').textContent=`${job.records.length} etiqueta${job.records.length===1?'':'s'} · ${job.width} × ${job.height} mm · ${job.layout==='a4'?'folha A4, margens de 10 mm e intervalo de 2 mm':'rolo, uma etiqueta por página'}.`;
  $('print').disabled=false;$('print').onclick=()=>window.print();
}catch(error){$('summary').textContent='Prévia indisponível.';$('error').textContent=error.message}
