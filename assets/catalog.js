'use strict';
// This catalog is supplied by the user. Values are references, never measured lot outcomes.
window.GrowPWECatalog = (() => {
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const referenceFields=[['thc_medio','THC informado'],['cbd_medio','CBD informado'],['rendimento_g_m2','Rendimento informado (g/m²)'],['floracao_semanas','Floração informada (semanas)']];
  function renderReference(snapshot){
    const box=document.createElement('section');box.className='catalog-reference';box.setAttribute('aria-label','Referência da cepa');
    const title=document.createElement('h3');title.textContent='Referência enviada · '+snapshot.record.cepa;
    const note=document.createElement('p');note.textContent='Base fornecida pelo usuário, sem fontes bibliográficas verificadas. Estas faixas não são medições, previsões do lote ou orientação clínica.';
    const grid=document.createElement('dl');grid.className='reference-values';
    for(const [key,label] of referenceFields){const cell=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=snapshot.record[key]||'Não informado';cell.append(dt,dd);grid.append(cell)}
    const extra=document.createElement('details'),summary=document.createElement('summary'),description=document.createElement('p');summary.textContent='Descrição original e origem';description.textContent=snapshot.record.descricao;const source=document.createElement('p');source.textContent='Origem: '+snapshot.source.file_name+' · registro '+snapshot.record.id+'. Não corresponde a um estudo acadêmico importado. O tipo fotoperiódico/autoflorescente não consta nesta base.';extra.append(summary,description,source);const referenceDetails=document.createElement('details'),referenceSummary=document.createElement('summary');referenceDetails.className='reference-details';referenceSummary.textContent='Consultar dados da base';referenceDetails.append(referenceSummary,grid,extra);box.append(title,note,referenceDetails);return box;
  }
  function attach(input,callbacks){
    let catalog=null,selection=null,results=[],active=-1;
    input.parentElement.classList.add('full-width','cultivar-field');input.autocomplete='off';input.placeholder='Busque uma cepa ou digite um nome próprio';
    input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');input.setAttribute('aria-controls','cultivar-options');
    const list=document.createElement('div');list.id='cultivar-options';list.className='catalog-options';list.setAttribute('role','listbox');list.setAttribute('aria-label','Cepas do catálogo');list.hidden=true;
    const status=document.createElement('p');status.className='field-hint';status.id='cultivar-status';status.setAttribute('role','status');status.textContent='Carregando catálogo…';input.setAttribute('aria-describedby',status.id);
    const card=document.createElement('div');card.id='cultivar-reference';
    input.after(list,status,card);
    function close(){list.hidden=true;active=-1;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')}
    function markActive(index){active=index;Array.from(list.children).forEach((option,i)=>option.setAttribute('aria-selected',String(i===active)));if(index>=0){input.setAttribute('aria-activedescendant',list.children[index].id);list.children[index].scrollIntoView({block:'nearest'})}else input.removeAttribute('aria-activedescendant')}
    function show(){
      if(!catalog)return;
      const query=normalize(input.value);results=catalog.records.filter(record=>normalize(record.cepa).includes(query));
      results.sort((a,b)=>Number(normalize(b.cepa).startsWith(query))-Number(normalize(a.cepa).startsWith(query))||a.cepa.localeCompare(b.cepa,'pt-BR'));
      const total=results.length;results=results.slice(0,8);list.replaceChildren();
      for(const [index,record] of results.entries()){
        const button=document.createElement('button');button.type='button';button.setAttribute('role','option');button.id='cultivar-option-'+index;button.setAttribute('aria-selected','false');
        const name=document.createElement('span');name.textContent=record.cepa;const type=document.createElement('small');type.textContent='Catálogo enviado · não verificado';button.append(name,type);
        // Keep input focus until the option receives its click (including pointer/touch).
        button.onmousedown=event=>event.preventDefault();button.onclick=()=>choose(record);list.append(button);
      }
      status.textContent=total?(total>8?`${total} resultados. Mostrando 8; continue digitando para refinar.`:`${total} resultado${total===1?'':'s'} no catálogo. Selecione para vincular a referência.`):'Nome fora do catálogo. Você pode continuar com cadastro manual.';
      if(results.length){list.hidden=false;input.setAttribute('aria-expanded','true');markActive(-1)}else close();
    }
    function choose(record){
      selection={catalog_id:catalog.catalog_id,schema_version:catalog.schema_version,source:structuredClone(catalog.source),record:structuredClone(record)};
      input.value=record.cepa;card.replaceChildren(renderReference(selection));
      const clear=document.createElement('button');clear.type='button';clear.className='link';clear.textContent='Desvincular referência';clear.onclick=()=>{selection=null;card.replaceChildren();callbacks.onClear?.();status.textContent='Cadastro manual. O nome foi mantido; nenhuma referência está vinculada.';input.focus();close()};card.append(clear);
      close();status.textContent='Cepa selecionada. Confira a resposta ao fotoperíodo e a origem do seu material; esses dados não constam no catálogo.';callbacks.onSelect?.(record);input.focus();
    }
    input.addEventListener('input',()=>{if(selection){selection=null;card.replaceChildren();callbacks.onClear?.()}show()});
    input.addEventListener('focus',()=>{if(!selection)show()});
    input.addEventListener('blur',()=>setTimeout(()=>{if(!list.contains(document.activeElement))close()},120));
    list.addEventListener('focusout',()=>setTimeout(()=>{if(document.activeElement!==input&&!list.contains(document.activeElement))close()},120));
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!list.hidden){event.preventDefault();event.stopPropagation();close();return}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(list.hidden)show();if(results.length)markActive(active===-1?(event.key==='ArrowDown'?0:results.length-1):(active+(event.key==='ArrowDown'?1:-1)+results.length)%results.length)}
      if(event.key==='Enter'&&!list.hidden&&active>=0){event.preventDefault();choose(results[active])}
    });
    document.getElementById('create-dialog').addEventListener('click',event=>{if(!input.parentElement.contains(event.target))close()});
    fetch('data/cultivars.json').then(response=>{if(!response.ok)throw Error('fetch');return response.json()}).then(data=>{
      const keys=['cepa','thc_medio','cbd_medio','rendimento_g_m2','floracao_semanas','descricao'];
      if(data.schema_version!==1||typeof data.catalog_id!=='string'||data.source?.type!=='user_provided'||!Array.isArray(data.records)||!data.records.length||!data.records.every(record=>Number.isInteger(record.id)&&keys.every(key=>typeof record[key]==='string'))||new Set(data.records.map(record=>record.id)).size!==data.records.length)throw Error('invalid catalog');
      catalog=data;status.textContent=`${catalog.records.length} cepas disponíveis. Busque pelo nome ou cadastre uma cepa própria.`;
      if(document.activeElement===input)show();
    }).catch(()=>{status.textContent='Catálogo indisponível. O cadastro manual continua disponível.'});
    return {getSelection:()=>selection&&input.value.trim()===selection.record.cepa?structuredClone(selection):null,reset:()=>{selection=null;card.replaceChildren();close();status.textContent=catalog?`${catalog.records.length} cepas disponíveis. Busque pelo nome ou cadastre uma cepa própria.`:'Cadastro manual disponível enquanto o catálogo carrega.'},close};
  }
  return {attach,renderReference};
})();
