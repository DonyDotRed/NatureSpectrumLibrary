const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const state = {
  data: null,
  view: 'overview',
  theme: localStorage.getItem('nsl-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  favorites: new Set(JSON.parse(localStorage.getItem('nsl-favorites') || '[]')),
  nuclidePage: 1,
  nuclideSort: {key:0, dir:'asc'},
  bandSheet: '03_저에너지_20-100keV',
  workbookSheet: '00_README',
};

document.documentElement.dataset.theme = state.theme;

const SHEETS = {
  readme:'00_README', master:'01_에너지지도_MASTER', detectors:'02_검출기_에너지창',
  low:'03_저에너지_20-100keV', mid:'04_중에너지_100-600keV', high:'05_고에너지_600-1500keV', ultra:'06_초고에너지_1500keV이상',
  origins:'07_발생원_계보', chemistry:'08_화학형태_거동', samples:'09_시료매질_교차', matrix:'10_통합매트릭스', calculator:'11_역추적계산기', refs:'12_참고문헌'
};

function escapeHTML(v='') {
  return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function fmt(v, digits=3) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined,{maximumFractionDigits:digits});
  return String(v);
}
function textCell(v) {
  const s = String(v ?? '');
  if (/^https?:\/\//i.test(s)) return `<a href="${escapeHTML(s)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s)}</a>`;
  return escapeHTML(s).replace(/\n/g,'<br>');
}
function toast(msg) {
  const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),1800);
}
function saveFavorites(){ localStorage.setItem('nsl-favorites', JSON.stringify([...state.favorites])); }
function baseNuclide(name=''){ return String(name).replace(/\s*\([^)]*\)\s*$/,'').trim(); }
function rowId(row){ return `${row[0]}|${row[2]}|${row[5]}`; }
function sheet(name){ return state.data?.sheets?.[name]?.values || []; }
function masterRows(){ return sheet(SHEETS.master).slice(3).filter(r=>typeof r?.[0] === 'number'); }
function masterHeaders(){ return sheet(SHEETS.master)[2] || []; }
function detectorRows(){ return sheet(SHEETS.detectors).slice(3).filter(r=>r?.[0] && typeof r?.[2]==='number').slice(0,5); }
function detectorModels(){ return sheet(SHEETS.calculator).filter(r=>r?.[0] && typeof r?.[1]==='number' && typeof r?.[2]==='number').map(r=>({name:r[0],a:r[1],b:r[2],note:r[11]||''})); }
function chemistryRows(){ return sheet(SHEETS.chemistry).slice(3).filter(r=>/^F\d{2}$/.test(String(r?.[0]||''))); }
function refRows(){ return sheet(SHEETS.refs).slice(3).filter(r=>typeof r?.[0] === 'number'); }
function sourceRows(){ return sheet(SHEETS.origins).slice(3).filter(r=>r?.[0] && !String(r[0]).includes('▼') && typeof r?.[5] === 'number'); }

function bytesFromB64(b64){ const bin=atob(b64); return Uint8Array.from(bin, c=>c.charCodeAt(0)); }
async function decryptDataset(password){
  const res=await fetch('./assets/data/library.enc.json',{cache:'no-store'});
  if(!res.ok) throw new Error('암호화 데이터 파일을 불러오지 못했습니다.');
  const p=await res.json();
  const keyMaterial=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytesFromB64(p.salt),iterations:p.iterations,hash:'SHA-256'},keyMaterial,{name:'AES-GCM',length:256},false,['decrypt']);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytesFromB64(p.iv),tagLength:128},key,bytesFromB64(p.ciphertext));
  const data=JSON.parse(new TextDecoder().decode(plain));
  if(!data?.sheets?.[SHEETS.master]) throw new Error('데이터 구조 검증 실패');
  return data;
}

$('#togglePassword').addEventListener('click',()=>{ const i=$('#passwordInput'); i.type=i.type==='password'?'text':'password'; $('#togglePassword').textContent=i.type==='password'?'보기':'숨김'; });
$('#unlockForm').addEventListener('submit',async e=>{
  e.preventDefault(); const btn=$('#unlockButton'), status=$('#unlockStatus'), pw=$('#passwordInput').value;
  btn.disabled=true; btn.textContent='Decrypting…'; status.textContent='';
  try{
    state.data=await decryptDataset(pw);
    $('#passwordInput').value=''; $('#lockScreen').hidden=true; $('#appShell').hidden=false;
    $('#datasetStamp').textContent=`${state.data.meta?.source_file || 'Dataset'} · ${Object.keys(state.data.sheets).length} sheets`;
    const hash=location.hash.replace('#',''); if(hash && $(`[data-view="${CSS.escape(hash)}"]`)) state.view=hash;
    renderCurrent(); registerServiceWorker();
  }catch(err){ status.textContent='비밀번호가 올바르지 않거나 데이터 파일을 복호화할 수 없습니다.'; console.error(err); }
  finally{btn.disabled=false;btn.textContent='라이브러리 열기';}
});

$('#lockButton').addEventListener('click',()=>{ state.data=null; $('#appShell').hidden=true; $('#lockScreen').hidden=false; $('#passwordInput').focus(); closeDrawer(); });
$('#themeButton').addEventListener('click',()=>{ state.theme=state.theme==='dark'?'light':'dark'; document.documentElement.dataset.theme=state.theme; localStorage.setItem('nsl-theme',state.theme); toast(`${state.theme==='dark'?'Dark':'Light'} theme`); });
$('#helpButton').addEventListener('click',()=>openHelp());
$('#menuButton').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$('#drawerClose').addEventListener('click',closeDrawer); $('#drawerBackdrop').addEventListener('click',closeDrawer);

document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){e.preventDefault(); $('#globalSearch').focus();}
  if(e.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#globalSearch').focus();}
  if(e.key==='Escape'){closeDrawer();$('#globalSearch').blur();}
});

$('#navList').addEventListener('click',e=>{ const b=e.target.closest('[data-view]'); if(!b)return; navigate(b.dataset.view); });
function navigate(view){ state.view=view; location.hash=view; $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view)); $('#sidebar').classList.remove('open'); renderCurrent(); $('#main').focus(); }

$('#globalSearch').addEventListener('input',e=>{ const q=e.target.value.trim(); if(q.length<2) return; renderGlobalSearch(q); });
$('#globalSearch').addEventListener('keydown',e=>{ if(e.key==='Enter' && e.target.value.trim()){ renderGlobalSearch(e.target.value.trim()); }});

function pageHead(title, subtitle, actions=''){
  return `<div class="page-head"><div><p class="eyebrow">NATURE SPECTRUM LIBRARY</p><h1>${title}</h1><p>${subtitle}</p></div>${actions?`<div class="page-actions">${actions}</div>`:''}</div>`;
}
function button(label, attrs=''){ return `<button class="icon-button" ${attrs}>${label}</button>`; }
function badge(text,cls=''){ return `<span class="badge ${cls}">${escapeHTML(text)}</span>`; }

function renderCurrent(){
  if(!state.data)return;
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
  const map={overview:renderOverview,energy:renderEnergyFinder,nuclides:renderNuclides,detectors:renderDetectors,bands:renderBands,origins:renderOrigins,chemistry:renderChemistry,samples:renderSamples,matrix:renderMatrix,halflife:renderHalfLife,references:renderReferences,workbook:renderWorkbook};
  (map[state.view]||renderOverview)();
}

function renderOverview(){
  const rows=masterRows(), uniqueDisplay=new Set(rows.map(r=>r[2])).size, sources=new Set(rows.map(r=>r[5])).size;
  const minE=Math.min(...rows.map(r=>r[0])), maxE=Math.max(...rows.map(r=>r[0]));
  const main=$('#main');
  main.innerHTML=pageHead('Overview','원본 Excel의 구조를 유지하면서 에너지 중심으로 핵종·발생원·화학형태·시료·검출기를 연결한 통합 탐색 환경입니다.')+
  `<div class="notice warn"><strong>연구·교육용:</strong> 핵종 판정은 에너지 일치만으로 확정하지 말고 다중선, 반감기, 시료 맥락, 발생원 타당성 및 실제 장비 교정을 함께 확인하십시오.</div>
  <div class="kpi-grid">
    ${kpi('Gamma lines',rows.length)}${kpi('Display nuclides',uniqueDisplay)}${kpi('Origin classes',sources)}${kpi('Chemical forms',chemistryRows().length)}${kpi('Detectors',detectorRows().length)}${kpi('References',refRows().length)}
  </div>
  <div class="card"><div class="section-title"><h2>Primary reasoning flow</h2><p>${fmt(minE)}–${fmt(maxE)} keV</p></div>
  <div class="flow"><span class="flow-step">Observed energy</span><span class="flow-arrow">→</span><span class="flow-step">Candidate nuclides</span><span class="flow-arrow">→</span><span class="flow-step">Origin</span><span class="flow-arrow">→</span><span class="flow-step">Chemical form</span><span class="flow-arrow">→</span><span class="flow-step">Sample</span><span class="flow-arrow">→</span><span class="flow-step">Detector</span></div></div>
  <div class="grid-2" style="margin-top:16px">
    <section class="card"><h2>Quick energy lookup</h2><p class="muted">예: 351.93 keV를 입력하고 후보 핵종을 즉시 확인합니다.</p><div class="field"><label>Observed energy (keV)</label><input id="ovEnergy" type="number" step="0.01" value="351.93"></div><div style="margin-top:12px"><button class="primary-button" id="ovFind">Open Energy Finder</button></div></section>
    <section class="card"><h2>Dataset integrity</h2><dl class="kv"><dt>Workbook sheets</dt><dd>${Object.keys(state.data.sheets).length}</dd><dt>MASTER lines</dt><dd>${rows.length}</dd><dt>Energy range</dt><dd class="mono">${fmt(minE)}–${fmt(maxE)} keV</dd><dt>Source file</dt><dd>${escapeHTML(state.data.meta?.source_file||'—')}</dd></dl><p class="muted">Workbook Browser에서 13개 시트의 원본 셀 내용을 확인할 수 있습니다.</p></section>
  </div>
  <div class="section-title"><h2>Fast entry points</h2><p>자주 쓰는 작업</p></div>
  <div class="grid-3">
   ${quickCard('Energy Finder','관측 에너지에서 가장 가까운 10개 핵종 후보를 계산합니다.','energy')}
   ${quickCard('Detector Lab','FWHM(E)와 ΔE/FWHM으로 두 감마선의 분리 가능성을 비교합니다.','detectors')}
   ${quickCard('Workbook Browser','전문화 화면에 포함되지 않은 주석과 보조표까지 원본 시트 그대로 확인합니다.','workbook')}
  </div>`;
  $('#ovFind').onclick=()=>{ sessionStorage.setItem('nsl-energy',$('#ovEnergy').value); navigate('energy'); };
  $$('[data-goto]').forEach(b=>b.onclick=()=>navigate(b.dataset.goto));
}
function kpi(label,value){return `<div class="kpi-card"><span>${label}</span><strong>${fmt(value,2)}</strong></div>`;}
function quickCard(title,desc,view){return `<div class="card"><h3>${title}</h3><p class="muted">${desc}</p><button class="icon-button" data-goto="${view}">Open</button></div>`;}

function renderEnergyFinder(){
  const sources=[...new Set(masterRows().map(r=>r[5]).filter(Boolean))].sort();
  const dets=detectorRows(); const initial=sessionStorage.getItem('nsl-energy')||'351.93'; sessionStorage.removeItem('nsl-energy');
  $('#main').innerHTML=pageHead('Energy Finder','관측된 감마선 봉우리 에너지와 라이브러리 183개 라인의 절대 에너지 차를 계산하여 근접 후보를 정렬합니다.',button('Export results','id="energyExport"'))+
  `<div class="grid-2"><section class="card form-card"><h2>Search conditions</h2><div class="field-grid">
    <div class="field"><label>Observed energy (keV)</label><input id="energyInput" type="number" step="0.001" value="${initial}"></div>
    <div class="field"><label>Tolerance ± (keV)</label><input id="tolInput" type="number" step="0.1" value="2"></div>
    <div class="field"><label>Origin</label><select id="energyOrigin"><option value="">All origins</option>${sources.map(x=>`<option>${escapeHTML(x)}</option>`).join('')}</select></div>
    <div class="field"><label>Detector context</label><select id="energyDetector"><option value="">Any detector</option>${dets.map(r=>`<option value="${escapeHTML(r[0])}">${escapeHTML(r[0])}</option>`).join('')}</select></div>
  </div><div class="notice">허용오차는 장비의 FWHM 수준과 실제 에너지 교정 불확도를 고려해 설정하십시오. NaI에서 HPGe 수준의 좁은 허용오차를 쓰면 가짜 분리감을 줄 수 있습니다.</div></section>
  <section class="card"><h2>Energy axis</h2><div id="energyAxis"></div><dl class="kv"><dt>Within tolerance</dt><dd id="withinCount">—</dd><dt>Nearest line</dt><dd id="nearestLine">—</dd><dt>Detector range</dt><dd id="detectorRange">—</dd></dl></section></div>
  <div class="section-title"><h2>Nearest candidates</h2><p>Top 10</p></div><div id="energyResults"></div>`;
  const update=()=>updateEnergyResults();
  ['energyInput','tolInput','energyOrigin','energyDetector'].forEach(id=>$('#'+id).addEventListener('input',update));
  $('#energyExport').onclick=()=>exportEnergyResults(); update();
}
function updateEnergyResults(){
  const e=Number($('#energyInput').value), tol=Math.max(0,Number($('#tolInput').value)||0), origin=$('#energyOrigin').value, det=$('#energyDetector').value;
  if(!Number.isFinite(e)){ $('#energyResults').innerHTML='<div class="notice danger">유효한 에너지를 입력하십시오.</div>'; return; }
  let rows=masterRows().map(r=>({r,d:Math.abs(r[0]-e)})); if(origin) rows=rows.filter(x=>x.r[5]===origin); rows.sort((a,b)=>a.d-b.d);
  const within=rows.filter(x=>x.d<=tol).length, top=rows.slice(0,10); state.lastEnergyResults=top.map(x=>x.r);
  $('#withinCount').textContent=`${within} lines`; $('#nearestLine').textContent=top[0]?`${fmt(top[0].r[0])} keV · ${top[0].r[2]}`:'—';
  const detRow=detectorRows().find(r=>r[0]===det); $('#detectorRange').innerHTML=detRow?`${fmt(detRow[2])}–${fmt(detRow[3])} keV ${e<detRow[2]||e>detRow[3]?badge('out of practical range','bad'):badge('within practical range','good')}`:'Any detector';
  $('#energyAxis').innerHTML=energyAxis(e,top.map(x=>x.r[0]));
  $('#energyResults').innerHTML=`<div class="result-list">${top.map((x,i)=>`<div class="result-row" data-master-id="${escapeHTML(rowId(x.r))}"><div>${badge(x.d<=tol?'IN':'OUT',x.d<=tol?'good':'warn')} #${i+1}</div><div class="delta">Δ ${fmt(x.d,3)}</div><div><span class="nuclide">${escapeHTML(x.r[2])}</span><br><span class="energy">${fmt(x.r[0],4)} keV</span></div><div>${escapeHTML(x.r[5]||'—')}<br><span class="muted">${escapeHTML(x.r[7]||'')}</span></div><div>${badge(x.r[13]||'—','accent')}<br><span class="muted">${escapeHTML(x.r[15]||'')}</span></div></div>`).join('')}</div>`;
  $$('[data-master-id]').forEach(el=>el.onclick=()=>openMasterDetail(masterRows().find(r=>rowId(r)===el.dataset.masterId)));
}
function energyAxis(e, lines){
  const span=Math.max(20,Math.max(...lines.map(x=>Math.abs(x-e)),2)*2.4), lo=Math.max(0,e-span), hi=e+span;
  const ticks=[lo,(lo+hi)/2,hi]; const pos=x=>Math.max(3,Math.min(97,(x-lo)/(hi-lo)*94+3));
  return `<div class="energy-axis"><div class="axis-line"></div>${ticks.map(x=>`<span class="axis-tick" style="left:${pos(x)}%"></span><span class="axis-label" style="left:${pos(x)}%">${fmt(x,1)}</span>`).join('')}<span class="axis-marker" style="left:${pos(e)}%" title="Observed ${e} keV"></span></div>`;
}
function exportEnergyResults(){ exportRows('energy_candidates.csv',masterHeaders(),state.lastEnergyResults||[]); }

function renderNuclides(){
  const rows=masterRows(), sources=[...new Set(rows.map(r=>r[5]).filter(Boolean))].sort(), bands=[...new Set(rows.map(r=>r[14]).filter(Boolean))], dets=[...new Set(rows.map(r=>r[13]).filter(Boolean))];
  $('#main').innerHTML=pageHead('Nuclide Library','MASTER 183개 감마선 라인을 통합 검색·필터·정렬하고 상세 맥락을 확인합니다.',button('Export filtered CSV','id="nuclideExport"'))+
  `<div class="toolbar"><input class="grow" id="nuclideSearch" type="search" placeholder="핵종, 에너지, 시료, 비고 검색"><select id="nuclideOrigin"><option value="">All origins</option>${sources.map(x=>`<option>${escapeHTML(x)}</option>`).join('')}</select><select id="nuclideBand"><option value="">All bands</option>${bands.map(x=>`<option>${escapeHTML(x)}</option>`).join('')}</select><select id="nuclideDet"><option value="">Best detector: all</option>${dets.map(x=>`<option>${escapeHTML(x)}</option>`).join('')}</select><select id="nuclideFav"><option value="">All rows</option><option value="fav">Favorites only</option></select></div><div id="nuclideTable"></div>`;
  ['nuclideSearch','nuclideOrigin','nuclideBand','nuclideDet','nuclideFav'].forEach(id=>$('#'+id).addEventListener('input',()=>{state.nuclidePage=1;updateNuclideTable();}));
  $('#nuclideExport').onclick=()=>exportRows('nuclide_library_filtered.csv',masterHeaders(),state.nuclideFiltered||[]); updateNuclideTable();
}
function filteredNuclides(){
  let rows=masterRows(); const q=$('#nuclideSearch')?.value.trim().toLowerCase()||'', origin=$('#nuclideOrigin')?.value||'',band=$('#nuclideBand')?.value||'',det=$('#nuclideDet')?.value||'',fav=$('#nuclideFav')?.value||'';
  if(q) rows=rows.filter(r=>r.some(v=>String(v??'').toLowerCase().includes(q))); if(origin)rows=rows.filter(r=>r[5]===origin); if(band)rows=rows.filter(r=>r[14]===band); if(det)rows=rows.filter(r=>r[13]===det); if(fav)rows=rows.filter(r=>state.favorites.has(rowId(r)));
  const {key,dir}=state.nuclideSort; rows=[...rows].sort((a,b)=>{let x=a[key],y=b[key]; if(typeof x==='number'&&typeof y==='number')return (x-y)*(dir==='asc'?1:-1); return String(x??'').localeCompare(String(y??''),'ko')*(dir==='asc'?1:-1);}); return rows;
}
function updateNuclideTable(){
  const rows=filteredNuclides(); state.nuclideFiltered=rows; const size=50,pages=Math.max(1,Math.ceil(rows.length/size)); state.nuclidePage=Math.min(state.nuclidePage,pages); const slice=rows.slice((state.nuclidePage-1)*size,state.nuclidePage*size);
  const headers=['★','E (keV)','Nuclide','Iγ','Half-life','Origin','Form','Sample','Best detector','Band','Notes'];
  const cols=[null,0,2,3,4,5,6,7,13,14,15];
  $('#nuclideTable').innerHTML=`<div class="table-wrap"><table><thead><tr>${headers.map((h,i)=>`<th ${i>0?`data-sort="${cols[i]}" style="cursor:pointer"`:''}>${h}${state.nuclideSort.key===cols[i]?(state.nuclideSort.dir==='asc'?' ↑':' ↓'):''}</th>`).join('')}</tr></thead><tbody>${slice.map(r=>`<tr class="clickable" data-master-id="${escapeHTML(rowId(r))}"><td><button class="icon-button fav-btn" data-fav="${escapeHTML(rowId(r))}" title="favorite">${state.favorites.has(rowId(r))?'★':'☆'}</button></td><td class="numeric">${fmt(r[0],4)}</td><td><strong>${escapeHTML(r[2])}</strong></td><td class="numeric">${fmt(r[3],5)}</td><td>${escapeHTML(r[4]||'')}</td><td>${escapeHTML(r[5]||'')}</td><td>${badge(r[6]||'—')}</td><td>${escapeHTML(r[7]||'')}</td><td>${badge(r[13]||'—','accent')}</td><td>${escapeHTML(r[14]||'')}</td><td>${escapeHTML(r[15]||'')}</td></tr>`).join('')}</tbody></table></div><div class="pagination"><span>${rows.length} rows · page ${state.nuclidePage}/${pages}</span><div class="buttons"><button class="icon-button" id="prevPage" ${state.nuclidePage<=1?'disabled':''}>Previous</button><button class="icon-button" id="nextPage" ${state.nuclidePage>=pages?'disabled':''}>Next</button></div></div>`;
  $$('[data-sort]').forEach(th=>th.onclick=()=>{const key=Number(th.dataset.sort); state.nuclideSort=state.nuclideSort.key===key?{key,dir:state.nuclideSort.dir==='asc'?'desc':'asc'}:{key,dir:'asc'}; updateNuclideTable();});
  $$('.fav-btn').forEach(b=>b.onclick=e=>{e.stopPropagation(); const id=b.dataset.fav; state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id); saveFavorites();updateNuclideTable();});
  $$('[data-master-id]').forEach(tr=>tr.onclick=()=>openMasterDetail(masterRows().find(r=>rowId(r)===tr.dataset.masterId)));
  $('#prevPage').onclick=()=>{state.nuclidePage--;updateNuclideTable();}; $('#nextPage').onclick=()=>{state.nuclidePage++;updateNuclideTable();};
}

function renderDetectors(){
  const dets=detectorRows();
  $('#main').innerHTML=pageHead('Detector Lab','검출기별 실용 에너지창과 FWHM(E)=√(a+bE) 모델을 이용해 분해능과 두 선의 분리 가능성을 계산합니다.')+
  `<div class="grid-2"><section class="card form-card"><h2>Two-line separation</h2><div class="field-grid"><div class="field"><label>Line 1 (keV)</label><input id="line1" type="number" step="0.01" value="604.72"></div><div class="field"><label>Line 2 (keV)</label><input id="line2" type="number" step="0.01" value="609.31"></div></div><div id="separationTable"></div></section>
   <section class="card"><h2>Interpretation</h2><div class="notice"><strong>R = ΔE / FWHM</strong><br>R ≥ 1: 분리 가능 · 0.5–1: 부분 중첩 · R ≤ 0.5: 단일 봉우리로 합쳐질 가능성 큼.</div><p class="muted">계수 a,b 및 실용범위는 원본 워크북의 대표값입니다. 보유 장비의 실제 교정 FWHM으로 대체해야 합니다.</p></section></div>
  <div class="section-title"><h2>Detector energy windows</h2><p>원본 02번 시트</p></div><div id="detectorCards" class="cards-list">${dets.map(r=>`<article class="info-card"><header><div><h3>${escapeHTML(r[0])}</h3><span class="muted">${escapeHTML(r[1]||'')}</span></div>${badge(`${fmt(r[2])}–${fmt(r[3])} keV`,'accent')}</header><p><strong>Optimal:</strong> ${escapeHTML(r[9]||'—')} · <strong>Use:</strong> ${escapeHTML(r[10]||'—')}</p><p>${escapeHTML(r[11]||'')}</p></article>`).join('')}</div>`;
  ['line1','line2'].forEach(id=>$('#'+id).addEventListener('input',updateSeparation)); updateSeparation();
}
function updateSeparation(){
  const e1=Number($('#line1').value),e2=Number($('#line2').value),mean=(e1+e2)/2,delta=Math.abs(e1-e2),models=detectorModels();
  $('#separationTable').innerHTML=`<div class="table-wrap"><table><thead><tr><th>Detector</th><th>FWHM(mean)</th><th>ΔE/FWHM</th><th>Assessment</th></tr></thead><tbody>${models.map(m=>{const f=Math.sqrt(m.a+m.b*mean),ratio=delta/f,ass=ratio>=1?['분리 가능','good']:ratio>0.5?['부분 중첩','warn']:['단일 봉우리 가능','bad'];return `<tr><td><strong>${escapeHTML(m.name)}</strong></td><td class="numeric">${fmt(f,3)} keV</td><td class="numeric">${fmt(ratio,3)}</td><td>${badge(ass[0],ass[1])}</td></tr>`;}).join('')}</tbody></table></div><p class="muted">ΔE=${fmt(delta,3)} keV · mean=${fmt(mean,3)} keV</p>`;
}

function renderBands(){
  const tabs=[[SHEETS.low,'20–100 keV'],[SHEETS.mid,'100–600 keV'],[SHEETS.high,'600–1500 keV'],[SHEETS.ultra,'≥1500 keV']];
  $('#main').innerHTML=pageHead('Energy Bands','원본의 에너지 대역별 심층 시트를 그대로 탐색하면서 핵심 표와 설명문을 확인합니다.')+`<div class="sheet-tabs">${tabs.map(([s,l])=>`<button class="icon-button sheet-tab ${state.bandSheet===s?'active':''}" data-band="${escapeHTML(s)}">${l}</button>`).join('')}</div><div id="bandContent" style="margin-top:12px"></div>`;
  $$('[data-band]').forEach(b=>b.onclick=()=>{state.bandSheet=b.dataset.band;renderBands();}); renderRawSheetInto('#bandContent',state.bandSheet,true);
}

function renderOrigins(){
  const rows=sourceRows();
  $('#main').innerHTML=pageHead('Origins','동일 핵종·동일 에너지라도 발생 맥락에 따라 해석이 달라진다는 원칙을 중심으로 자연계열, 핵분열, 활성화, CRUD, 의료, 산업, NORM을 비교합니다.')+
  `<div class="cards-list">${rows.map(r=>`<article class="info-card"><header><div><h3>${escapeHTML(r[0])}</h3><span class="muted">${escapeHTML(r[1]||'')}</span></div>${badge(`${fmt(r[5])} lines`,'accent')}</header><p><strong>Context:</strong> ${escapeHTML(r[2]||'')}</p><p><strong>Critical note:</strong> ${escapeHTML(r[3]||'')}</p><p><strong>Nuclides:</strong> ${escapeHTML(r[4]||'')}</p></article>`).join('')}</div><div class="section-title"><h2>Full origin sheet</h2><p>NUREG-1465 휘발성군 포함</p></div><div id="originRaw"></div>`;
  renderRawSheetInto('#originRaw',SHEETS.origins,true);
}

function renderChemistry(){
  const rows=chemistryRows();
  $('#main').innerHTML=pageHead('Chemical Forms','F01–F22를 화학형태·물리상태·용해도·환경분배·전처리 관점으로 탐색합니다.',button('Export forms','id="chemExport"'))+
  `<div class="toolbar"><input class="grow" id="chemSearch" type="search" placeholder="Cs, iodine, aerosol, 용해도, 전처리…"></div><div id="chemCards" class="cards-list"></div>`;
  const update=()=>{const q=$('#chemSearch').value.trim().toLowerCase(); const f=rows.filter(r=>!q||r.some(v=>String(v??'').toLowerCase().includes(q))); $('#chemCards').innerHTML=f.map(r=>`<article class="info-card"><header><div><h3>${escapeHTML(r[0])} · ${escapeHTML(r[1])}</h3><span class="muted">Representative: ${escapeHTML(r[2]||'—')}</span></div>${badge(r[3]||'—','accent')}</header><p><strong>Physical state:</strong> ${escapeHTML(r[4]||'—')} · <strong>Solubility/mobility:</strong> ${escapeHTML(r[5]||'—')}</p><p><strong>Distribution:</strong> ${escapeHTML(r[6]||'—')}</p><p><strong>Measurement implication:</strong> ${escapeHTML(r[7]||'—')}</p><p>${escapeHTML(r[8]||'')}</p></article>`).join('')||'<div class="notice">검색 결과가 없습니다.</div>';};
  $('#chemSearch').addEventListener('input',update); $('#chemExport').onclick=()=>exportRows('chemical_forms.csv',sheet(SHEETS.chemistry)[2],rows); update();
}

function renderSamples(){
  $('#main').innerHTML=pageHead('Sample Matrix','시료 매질 × 예상 핵종 × 화학형태를 교차 확인합니다. 원본 구조를 유지하여 실무 전처리 맥락을 놓치지 않도록 했습니다.',button('Export sheet CSV','id="sampleExport"'))+'<div id="sampleRaw"></div>';
  renderRawSheetInto('#sampleRaw',SHEETS.samples,true); $('#sampleExport').onclick=()=>exportRawSheet(SHEETS.samples);
}
function renderMatrix(){
  $('#main').innerHTML=pageHead('Integration Matrix','검출기 × 에너지대역 × 발생원 교점에서 실용선 존재 여부와 조건부 적합성을 확인합니다.',button('Export sheet CSV','id="matrixExport"'))+'<div id="matrixRaw"></div>';
  renderRawSheetInto('#matrixRaw',SHEETS.matrix,true); $('#matrixExport').onclick=()=>exportRawSheet(SHEETS.matrix);
}

function renderHalfLife(){
  $('#main').innerHTML=pageHead('Half-life Lab','에너지가 동일하거나 매우 근접해 분광학적 분리가 어려울 때 시간 변화로 후보를 구분하는 보조 계산기입니다.')+
  `<div class="grid-2"><section class="card form-card"><h2>Two-measurement estimate</h2><div class="field-grid"><div class="field"><label>Net count N₁</label><input id="n1" type="number" value="10000"></div><div class="field"><label>Net count N₂</label><input id="n2" type="number" value="2500"></div><div class="field"><label>Interval Δt</label><input id="dt" type="number" step="0.1" value="24"></div><div class="field"><label>Time unit</label><input id="timeUnit" value="h"></div></div><div id="halfOut" class="calc-output"></div></section>
  <section class="card"><h2>Equation</h2><p class="mono">T½ = Δt · ln(2) / ln(N₁/N₂)</p><div class="notice warn">이 식은 동일 계측조건, 단일 지수감쇠, 유의한 추가 유입·제거 없음이라는 단순 가정을 사용합니다. 생물학적 제거, 지속 유입, 혼합핵종, 배경변화가 있으면 별도 모델이 필요합니다.</div></section></div>`;
  ['n1','n2','dt','timeUnit'].forEach(id=>$('#'+id).addEventListener('input',updateHalfLife)); updateHalfLife();
}
function updateHalfLife(){ const n1=Number($('#n1').value),n2=Number($('#n2').value),dt=Number($('#dt').value),u=escapeHTML($('#timeUnit').value||'unit'); let html=''; if(n1>0&&n2>0&&dt>0&&n1!==n2){const t=dt*Math.log(2)/Math.log(n1/n2),lambda=Math.log(2)/t; const cls=t>0?'good':'warn'; html=`<span class="muted">Estimated effective half-life</span><br><strong>${fmt(t,4)} ${u}</strong><p>λ = ${fmt(lambda,6)} /${u} ${badge(t>0?'decay-like':'count increased',cls)}</p>`;}else if(n1===n2){html='<strong>∞</strong><p class="muted">두 순계수가 같아 관측 구간에서 감쇠를 추정할 수 없습니다.</p>';}else html='<p class="muted">N₁, N₂, Δt는 0보다 커야 합니다.</p>'; $('#halfOut').innerHTML=html; }

function renderReferences(){
  const rows=refRows();
  $('#main').innerHTML=pageHead('References','원본 워크북의 미주 [1]–[46]과 동일한 참고문헌 목록입니다.',button('Export references','id="refExport"'))+
  `<div class="toolbar"><input id="refSearch" class="grow" type="search" placeholder="NNDC, IAEA, NUREG, ISO, Currie…"><select id="refCat"><option value="">All categories</option>${[...new Set(rows.map(r=>r[1]))].map(x=>`<option>${escapeHTML(x)}</option>`).join('')}</select></div><div id="refTable"></div>`;
  const update=()=>{const q=$('#refSearch').value.toLowerCase().trim(),cat=$('#refCat').value; const f=rows.filter(r=>(!q||r.some(v=>String(v??'').toLowerCase().includes(q)))&&(!cat||r[1]===cat)); $('#refTable').innerHTML=renderTable(['No.','Category','Citation','URL / identifier'],f,{numericCols:[0]});};
  $('#refSearch').oninput=update;$('#refCat').oninput=update;$('#refExport').onclick=()=>exportRows('references.csv',sheet(SHEETS.refs)[2],rows);update();
}

function renderWorkbook(){
  const names=Object.keys(state.data.sheets);
  $('#main').innerHTML=pageHead('Workbook Browser','원본 Excel의 모든 셀 내용을 시트별로 확인하는 무손실 보기입니다. 전문화된 화면에서 생략된 설명문·경고·보조표도 여기에서 확인할 수 있습니다.',button('Export current sheet','id="wbExport"'))+
  `<div class="toolbar"><select id="wbSheet" class="grow">${names.map(n=>`<option ${n===state.workbookSheet?'selected':''}>${escapeHTML(n)}</option>`).join('')}</select><input id="wbSearch" type="search" placeholder="현재 시트 검색"><label class="badge"><input id="wbCompact" type="checkbox" checked> compact blank rows</label></div><div id="wbContent"></div>`;
  $('#wbSheet').oninput=()=>{state.workbookSheet=$('#wbSheet').value;updateWorkbook();}; $('#wbSearch').oninput=updateWorkbook;$('#wbCompact').oninput=updateWorkbook;$('#wbExport').onclick=()=>exportRawSheet(state.workbookSheet);updateWorkbook();
}
function updateWorkbook(){ renderRawSheetInto('#wbContent',state.workbookSheet,$('#wbCompact').checked,$('#wbSearch').value); }

function renderRawSheetInto(selector,name,compact=false,query=''){
  let rows=sheet(name).map((r,i)=>({r,i})); const q=String(query||'').trim().toLowerCase();
  if(q) rows=rows.filter(x=>x.r.some(v=>String(v??'').toLowerCase().includes(q))); if(compact) rows=rows.filter(x=>x.r.some(v=>v!==null&&v!==''));
  const maxCols=Math.max(1,...rows.map(x=>x.r.length)); const letters=Array.from({length:maxCols},(_,i)=>colLetter(i+1));
  $(selector).innerHTML=`<div class="table-wrap"><table class="raw-grid"><thead><tr><th>#</th>${letters.map(l=>`<th>${l}</th>`).join('')}</tr></thead><tbody>${rows.map(x=>`<tr><td>${x.i+1}</td>${Array.from({length:maxCols},(_,j)=>`<td>${textCell(x.r[j])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function colLetter(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
function renderTable(headers,rows,opts={}){const numeric=new Set(opts.numericCols||[]);return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map((_,i)=>`<td class="${numeric.has(i)?'numeric':''}">${textCell(r[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}

function openMasterDetail(r){ if(!r)return; const headers=masterHeaders(); const related=masterRows().filter(x=>baseNuclide(x[2])===baseNuclide(r[2])).sort((a,b)=>a[0]-b[0]); const chem=chemistryRows().find(x=>x[0]===r[6]);
  $('#drawerTitle').textContent=`${r[2]} · ${fmt(r[0],4)} keV`; $('#drawerBody').innerHTML=`<div class="page-actions"><button class="icon-button" id="drawerFav">${state.favorites.has(rowId(r))?'★ Favorited':'☆ Add favorite'}</button><button class="icon-button" id="copyRow">Copy row</button></div><h3>MASTER record</h3><dl class="kv">${headers.map((h,i)=>`<dt>${escapeHTML(String(h??'').replace(/\n/g,' '))}</dt><dd>${textCell(r[i])}</dd>`).join('')}</dl>${chem?`<h3>Chemical form ${escapeHTML(chem[0])}</h3><div class="notice"><strong>${escapeHTML(chem[1])}</strong><br>${escapeHTML(chem[6]||'')}<br><br><strong>Measurement:</strong> ${escapeHTML(chem[7]||'')}</div>`:''}<h3>Other gamma lines of the same nuclide</h3>${renderTable(['E (keV)','Nuclide','Iγ','Origin','Best detector'],related.map(x=>[x[0],x[2],x[3],x[5],x[13]]),{numericCols:[0,2]})}`;
  $('#drawerBackdrop').hidden=false;$('#detailDrawer').hidden=false; $('#drawerFav').onclick=()=>{const id=rowId(r);state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);saveFavorites();openMasterDetail(r);}; $('#copyRow').onclick=async()=>{await navigator.clipboard.writeText(r.map(x=>x??'').join('\t'));toast('Row copied');};
}
function closeDrawer(){ $('#drawerBackdrop').hidden=true;$('#detailDrawer').hidden=true; }
function openHelp(){ $('#drawerTitle').textContent='Quick guide'; $('#drawerBody').innerHTML=`<h3>Recommended workflow</h3><ol><li>Energy Finder에서 관측 봉우리 에너지와 장비 수준에 맞는 허용오차를 입력합니다.</li><li>후보 핵종의 동일 핵종 다중선을 확인합니다.</li><li>Origins, Chemical Forms, Sample Matrix에서 시료 맥락의 타당성을 확인합니다.</li><li>Detector Lab에서 실제 분리 가능성을 검토합니다.</li><li>시간 정보가 있으면 Half-life Lab으로 추가 배제합니다.</li><li>최종값은 원본 참고문헌 및 최신 공인 핵데이터로 재검증합니다.</li></ol><h3>Keyboard</h3><dl class="kv"><dt>Ctrl/Cmd + K</dt><dd>전역 검색 포커스</dd><dt>/</dt><dd>검색 포커스</dd><dt>Esc</dt><dd>상세 패널 닫기</dd></dl><div class="notice warn"><strong>Security:</strong> 정적 GitHub Pages의 서버 로그인 대신 암호화 데이터 payload를 사용합니다. 실제 운영에는 충분히 긴 passphrase를 권장합니다.</div>`; $('#drawerBackdrop').hidden=false;$('#detailDrawer').hidden=false; }

function renderGlobalSearch(q){
  state.view='search'; $$('.nav-item').forEach(b=>b.classList.remove('active')); const nq=q.toLowerCase(); const rows=masterRows().map(r=>({type:'nuclide',r,score:r.some(v=>String(v??'').toLowerCase().includes(nq))?1:0})).filter(x=>x.score).slice(0,40); const chem=chemistryRows().filter(r=>r.some(v=>String(v??'').toLowerCase().includes(nq))).slice(0,15); const refs=refRows().filter(r=>r.some(v=>String(v??'').toLowerCase().includes(nq))).slice(0,15);
  $('#main').innerHTML=pageHead(`Search: “${escapeHTML(q)}”`,'MASTER, 화학형태, 참고문헌을 동시에 검색했습니다.')+`<div class="search-overlay"><div class="section-title"><h2>Nuclide lines</h2><p>${rows.length} shown</p></div>${rows.map(x=>`<div class="search-hit" data-master-id="${escapeHTML(rowId(x.r))}"><strong>${escapeHTML(x.r[2])} · ${fmt(x.r[0],4)} keV</strong><span>${escapeHTML(x.r[5]||'')} · ${escapeHTML(x.r[7]||'')}</span></div>`).join('')||'<div class="muted">No matches</div>'}<div class="section-title"><h2>Chemical forms</h2><p>${chem.length}</p></div>${chem.map(r=>`<div class="search-hit"><strong>${escapeHTML(r[0])} · ${escapeHTML(r[1])}</strong><span>${escapeHTML(r[6]||'')}</span></div>`).join('')||'<div class="muted">No matches</div>'}<div class="section-title"><h2>References</h2><p>${refs.length}</p></div>${refs.map(r=>`<div class="search-hit"><strong>[${r[0]}] ${escapeHTML(r[1])}</strong><span>${escapeHTML(r[2])}</span></div>`).join('')||'<div class="muted">No matches</div>'}</div>`;
  $$('[data-master-id]').forEach(el=>el.onclick=()=>openMasterDetail(masterRows().find(r=>rowId(r)===el.dataset.masterId)));
}

function exportRows(filename,headers,rows){ const csv=[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n'); downloadBlob(filename,new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})); }
function exportRawSheet(name){ const rows=sheet(name); exportRows(`${name}.csv`,Array.from({length:Math.max(1,...rows.map(r=>r.length))},(_,i)=>colLetter(i+1)),rows); }
function csvCell(v){const s=String(v??'');return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
function downloadBlob(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast(`${name} saved`);}

async function registerServiceWorker(){ if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./sw.js');}catch(e){console.warn('SW registration failed',e);}} }

// Direct deep link updates without reload.
window.addEventListener('hashchange',()=>{const v=location.hash.replace('#','');if(state.data && $(`[data-view="${CSS.escape(v)}"]`)){state.view=v;renderCurrent();}});
