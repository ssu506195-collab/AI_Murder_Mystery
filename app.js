'use strict';

const $ = (id) => document.getElementById(id);
const CASES = (window.MYSTERY_CASES || []).filter(c => c.enabled !== false);
const DEMO = window.MYSTERY_DEMO_PRIVATE || {};
const state = {
  mode: 'demo', workerUrl: '', apiKey: '', model: 'openai/gpt-oss-20b',
  selectedCase: null, playerRoleId: null, playerCard: null, playerFullDossier: null, sessionToken: null,
  stage: 'home', openingIndex: 0, introIndex: 0, turnIndex: 0, roundIndex: 0,
  turnOrder: [], askedByTarget: {}, completedTurns: [], publicLog: [],
  publicClues: [], interview: null, finalStatements: {}, npcVotes: {}, playerVote: null,
  introducedIds: [], roleMemories: {}, unlockedRound: 0, journalTab: 'story',
  usage: {tokens: 0, calls: 0, window: []},
  typeTimer: null, typeResolve: null, chosenRoleId: null, pendingAction: null
};

function showToast(message, ms = 3600) {
  const toast = $('toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), ms);
}
function setBusy(on, message = '角色正在思考……') {
  $('busyOverlay').hidden = !on; $('busyText').textContent = message;
  document.querySelectorAll('button').forEach(b => { if (b.id !== 'settingsBtn' && b.id !== 'closeSettings') b.disabled = on; });
}
function setScreen(id) {
  document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.hidden = true; });
  const target = $(id); target.hidden = false; requestAnimationFrame(() => target.classList.add('active'));
  state.stage = id.replace('Screen','').replace('screen','').toLowerCase();
  const journalVisible = ['playerCardScreen','investigationScreen','finalScreen','voteScreen'].includes(id);
  $('openJournalTopBtn').hidden = !journalVisible || !state.playerCard;
  window.scrollTo({top:0,behavior:'smooth'});
}
function getCase() { return state.selectedCase; }
function getRole(id) { return getCase().cast.find(r => r.id === id); }
function faceOf(role) { return role?.facePortrait || role?.portrait || ''; }
function playerIsRole(id) { return id === state.playerRoleId; }
function npcRoles() { return getCase().cast.filter(r => r.id !== state.playerRoleId); }
function safeText(s) { return String(s ?? '').replace(/[<>]/g, ch => ch === '<' ? '‹' : '›'); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function renderCases() {
  const grid = $('caseGrid'); grid.replaceChildren(); $('caseCount').textContent = String(CASES.length).padStart(2,'0');
  CASES.forEach((c, index) => {
    const card = document.createElement('article'); card.className = 'case-card';
    const cover = document.createElement('div'); cover.className = 'case-cover'; cover.style.backgroundImage = `url('${c.cover}')`;
    const label = document.createElement('div'); label.className = 'case-cover-label'; label.textContent = `CASE 00${index+1}`; cover.appendChild(label);
    const body = document.createElement('div'); body.className = 'case-body';
    const meta = document.createElement('div'); meta.className = 'case-meta';
    [c.genre,'5 位角色','1 玩家 + 4 AI'].forEach(t=>{const s=document.createElement('span');s.textContent=t;meta.appendChild(s);});
    const h = document.createElement('h3'); h.textContent = c.title;
    const p = document.createElement('p'); p.textContent = c.subtitle;
    const bottom = document.createElement('div'); bottom.className = 'case-bottom';
    const duration = document.createElement('span'); duration.textContent = `◷ ${c.duration}`;
    const btn = document.createElement('button'); btn.className = 'case-select-btn'; btn.textContent = '選擇劇本 →'; btn.addEventListener('click',()=>openRoleModal(c.id));
    bottom.append(duration,btn); body.append(meta,h,p,bottom); card.append(cover,body); grid.appendChild(card);
  });
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('mystery-v2-settings') || '{}');
    state.mode = s.mode || 'demo'; state.workerUrl = s.workerUrl || ''; state.model = s.model || 'openai/gpt-oss-20b';
  } catch { /* ignore */ }
  document.querySelector(`input[name="gameMode"][value="${state.mode}"]`).checked = true;
  $('workerUrl').value = state.workerUrl; $('modelSelect').value = state.model;
  updateModeFields(); updateModeBadge();
}
function updateModeBadge() {
  $('modeBadge').textContent = state.mode === 'groq' ? 'GROQ AI MODE' : 'DEMO MODE';
  $('modeBadge').style.color = state.mode === 'groq' ? '#b8d0a5' : '#d8b56e';
  $('tokenBadge').textContent = `TOKEN ${state.usage.tokens.toLocaleString()}`;
}
function openSettings() { $('settingsModal').hidden = false; }
function closeSettings() { $('settingsModal').hidden = true; }
function updateModeFields() {
  const mode = document.querySelector('input[name="gameMode"]:checked').value;
  $('groqFields').hidden = mode !== 'groq';
}
function saveSettings() {
  state.mode = document.querySelector('input[name="gameMode"]:checked').value;
  state.workerUrl = $('workerUrl').value.trim().replace(/\/$/,'');
  state.model = $('modelSelect').value;
  if (state.mode === 'groq') {
    state.apiKey = $('groqKey').value.trim();
    if (!state.workerUrl || !state.apiKey) { showToast('Groq 模式需要 Worker 網址與個人 API Key。'); return; }
  } else { state.apiKey = ''; }
  localStorage.setItem('mystery-v2-settings', JSON.stringify({mode:state.mode,workerUrl:state.workerUrl,model:state.model}));
  updateModeBadge(); closeSettings(); showToast(state.mode === 'groq' ? '已啟用 Groq AI 模式。API Key 僅保留在目前頁面記憶體。' : '已切換至模擬模式，不會消耗 Token。');
}

async function fetchWorker(path, payload = null, estimate = 900) {
  if (!state.workerUrl || !state.apiKey) throw new Error('請先在設定中輸入 Worker 網址與 Groq API Key。');
  await waitForTokenBudget(estimate);
  const response = await fetch(`${state.workerUrl}${path}`, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? {'Content-Type':'application/json','X-Groq-User-Key':state.apiKey} : {},
    body: payload ? JSON.stringify({...payload, model:state.model}) : undefined
  });
  let data = {};
  try { data = await response.json(); } catch { throw new Error(`Worker 回傳非 JSON（HTTP ${response.status}）。請檢查 Worker 部署與 CORS 設定。`); }
  if (!response.ok || data.error) throw new Error(data.error || `Worker 請求失敗（HTTP ${response.status}）`);
  if (data.usage?.total_tokens) {
    state.usage.tokens += data.usage.total_tokens; state.usage.calls += 1;
    state.usage.window.push({time:Date.now(),tokens:data.usage.total_tokens});
    updateModeBadge();
  }
  if(data.rate_limits?.remaining_tokens!==null && data.rate_limits?.remaining_tokens!==undefined){
    const value=Number(data.rate_limits.remaining_tokens);
    if(Number.isFinite(value))state.usage.rateRemaining=value;
    const reset=String(data.rate_limits.reset_tokens||'');
    const match=reset.match(/([0-9.]+)\s*(ms|s|m)?/i);
    if(match){const n=Number(match[1]);state.usage.rateResetMs=match[2]?.toLowerCase()==='ms'?n:match[2]?.toLowerCase()==='m'?n*60000:n*1000;}
  }
  return data;
}
async function waitForTokenBudget(estimate) {
  const softLimit = 6000;
  while (true) {
    const now = Date.now();
    state.usage.window = state.usage.window.filter(x => now - x.time < 60000);
    const used = state.usage.window.reduce((sum,x)=>sum+x.tokens,0);
    const headerBlocked=Number.isFinite(state.usage.rateRemaining)&&state.usage.rateRemaining<estimate;
    if (used + estimate <= softLimit && !headerBlocked) return;
    const first = state.usage.window[0];
    const waitMs = headerBlocked && state.usage.rateResetMs>0 ? Math.max(1000,state.usage.rateResetMs+500) : first ? Math.max(1000,60000-(now-first.time)+800) : 3000;
    if(headerBlocked)state.usage.rateRemaining=null;
    showToast(`接近每分鐘 Token 軟性上限，將等待約 ${Math.ceil(waitMs/1000)} 秒再呼叫 AI。`, waitMs);
    await sleep(waitMs);
  }
}
async function testConnection() {
  const workerUrl = $('workerUrl').value.trim().replace(/\/$/,'');
  const apiKey = $('groqKey').value.trim();
  const status = $('connectionStatus');
  if (!workerUrl || !apiKey) { status.textContent='請先輸入 Worker 網址與 Groq Key。'; status.className='connection-status error'; return; }
  status.textContent='正在測試 Worker 與 Groq……'; status.className='connection-status';
  try {
    const res = await fetch(`${workerUrl}/api/test`, {method:'POST',headers:{'Content-Type':'application/json','X-Groq-User-Key':apiKey},body:JSON.stringify({model:$('modelSelect').value})});
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
    status.textContent=`連線成功：${data.model}，本次 ${data.usage?.total_tokens ?? 0} Tokens。`;
    status.className='connection-status ok';
  } catch (e) {
    status.textContent=`連線失敗：${e.message}`; status.className='connection-status error';
  }
}

function openRoleModal(caseId) {
  state.selectedCase = CASES.find(c=>c.id===caseId); if (!state.selectedCase) return;
  if (state.mode === 'groq' && (!state.workerUrl || !state.apiKey)) { openSettings(); showToast('請先設定自己的 Groq Key 與 Cloudflare Worker 網址。'); return; }
  $('roleModal').hidden = false; $('myRoleCard').hidden = true; $('enterStoryBtn').hidden = true; $('confirmRoleBtn').hidden = false;
  $('roleChoices').hidden = true; $('roleChoices').replaceChildren();
  state.chosenRoleId = null;
  state.selectedCase.cast.forEach(role=>{
    const card=document.createElement('button');card.type='button';card.className='role-choice';
    const img=document.createElement('img');img.className='face-portrait-image';img.src=faceOf(role);img.alt=role.name;
    const span=document.createElement('span');span.textContent=`${role.number}號 ${role.name}`;
    card.append(img,span);card.addEventListener('click',()=>{state.chosenRoleId=role.id;document.querySelectorAll('.role-choice').forEach(el=>el.classList.remove('selected'));card.classList.add('selected');});
    $('roleChoices').appendChild(card);
  });
}
function closeRoleModal() { $('roleModal').hidden=true; }
function updateRoleMode() { const choose=document.querySelector('input[name="roleMode"]:checked').value==='choose';$('roleChoices').hidden=!choose; }
async function confirmRole() {
  const roleMode=document.querySelector('input[name="roleMode"]:checked').value;
  const role=roleMode==='choose' ? state.chosenRoleId : state.selectedCase.cast[Math.floor(Math.random()*state.selectedCase.cast.length)].id;
  if (!role) { showToast('請選擇一個角色。'); return; }
  setBusy(true,'正在建立案件並分配你的角色……');
  try {
    state.playerRoleId=role; state.sessionToken=null;
    state.playerFullDossier=null;
    if (state.mode==='groq') {
      const data=await fetchWorker('/api/game/start',{case_id:state.selectedCase.id,player_role_id:role},500);
      state.sessionToken=data.session_token; state.playerCard=data.player_card;
    } else {
      const demo=DEMO[state.selectedCase.id]; const privateRole=demo.roles[role];
      state.playerFullDossier=JSON.parse(JSON.stringify(privateRole.dossier||{}));
      const visibleDossier=JSON.parse(JSON.stringify(privateRole.dossier||{}));
      delete visibleDossier.second_round;
      state.playerCard={...privateRole,is_culprit:role===demo.truth.culprit_id,name:getRole(role).name,occupation:getRole(role).occupation,secret:privateRole.secret,goal:privateRole.goal,dossier:visibleDossier};
    }
    initializeGameState(); renderPlayerCard(); closeRoleModal(); setScreen('prologueScreen'); startOpening();
  } catch(e) { showToast(`建立案件失敗：${e.message}`,6500); }
  finally { setBusy(false); }
}
function initializeGameState() {
  state.openingIndex=0;state.introIndex=0;state.turnIndex=0;state.turnOrder=state.selectedCase.cast.map(r=>r.id);
  state.askedByTarget=Object.fromEntries(state.selectedCase.cast.map(r=>[r.id,[]]));
  state.completedTurns=[];state.publicLog=[];state.publicClues=[];state.interview=null;state.finalStatements={};state.npcVotes={};state.playerVote=null;
  state.introducedIds=[];state.roleMemories=Object.fromEntries(state.selectedCase.cast.map(r=>[r.id,[]]));state.unlockedRound=0;
  state.usage={tokens:0,calls:0,window:[],rateRemaining:null,rateResetMs:0};updateModeBadge();
}
function storyParagraphs(dossier) {
  if (Array.isArray(dossier.player_story_chapters) && dossier.player_story_chapters.length) {
    return dossier.player_story_chapters.flatMap(ch => Array.isArray(ch.paragraphs) ? ch.paragraphs : []);
  }
  if (Array.isArray(dossier.player_story) && dossier.player_story.length) return dossier.player_story;
  const timeline = Array.isArray(dossier.personal_timeline) ? dossier.personal_timeline : [];
  const groups = [timeline.slice(0,3), timeline.slice(3,6), timeline.slice(6)].filter(g=>g.length);
  const relationText = (dossier.relationships||[]).map(rel=>`你與${rel.name}的關係是：${rel.detail}`).join(' ');
  const timelineText = groups.map((group,idx)=>{
    const prefix = idx===0 ? '故事從晚宴前的準備開始。' : idx===1 ? '晚餐結束後，賓客逐漸散開，山莊裡的談話也開始變得複雜。' : '夜色漸深，先前看似平常的行動逐漸交會，直到遺體被發現。';
    return `${prefix}${group.map(item=>`${item.time}，你在${item.location}。${item.action}${item.knowledge?`你能確定的是：${item.knowledge}`:''}`).join(' ')}`;
  });
  return [dossier.identity||'',dossier.background||'',relationText,...timelineText,dossier.secret||''].filter(Boolean);
}
function appendNovelStorySection(root,title,chapters,paragraphFallback=[],cls='journal-story-section novel-story') {
  const section=document.createElement('section');section.className=cls;
  const heading=document.createElement('h3');heading.textContent=title;section.append(heading);
  if(Array.isArray(chapters)&&chapters.length){
    chapters.forEach((chapter,index)=>{
      const block=document.createElement('article');block.className='novel-chapter';
      const h=document.createElement('h4');h.textContent=chapter.title||`第 ${index+1} 章`;block.append(h);
      (chapter.paragraphs||[]).forEach(text=>{const p=document.createElement('p');p.textContent=text;block.append(p);});
      section.append(block);
    });
  } else {
    paragraphFallback.forEach(text=>{const p=document.createElement('p');p.textContent=text;section.append(p);});
  }
  root.append(section);
}
function appendStorySection(root,title,paragraphs,cls='journal-story-section') {
  if(!paragraphs || !paragraphs.length)return;
  const section=document.createElement('section');section.className=cls;
  const h=document.createElement('h3');h.textContent=title;section.append(h);
  paragraphs.forEach(text=>{const p=document.createElement('p');p.textContent=text;section.append(p);});
  root.append(section);
}
function appendTaskPanel(root,roundIndex) {
  const d=state.playerCard?.dossier||{};
  const task=roundIndex===0?d.first_round:d.second_round;
  const section=document.createElement('section');section.className='journal-task-panel';
  const h=document.createElement('h3');h.textContent=roundIndex===0?'第一輪｜目前任務':'第二輪｜新線索後的任務';section.append(h);
  if(!task){const p=document.createElement('p');p.textContent='本階段任務尚未解鎖。';section.append(p);root.append(section);return;}
  if(task.objective){const p=document.createElement('p');p.className='task-objective';p.textContent=task.objective;section.append(p);}
  if(task.task){const p=document.createElement('p');p.textContent=`本輪目標：${task.task}`;section.append(p);}
  [['本輪可以公開',task.may_reveal],['本輪暫時隱瞞',task.prefer_hide]].forEach(([title,items])=>{
    if(!items?.length)return;const block=document.createElement('div');block.className='task-list';const b=document.createElement('b');b.textContent=title;const ul=document.createElement('ul');items.forEach(t=>{const li=document.createElement('li');li.textContent=t;ul.append(li);});block.append(b,ul);section.append(block);
  });
  root.append(section);
}
function renderPlayerCard() {
  const r=getRole(state.playerRoleId), card=state.playerCard, dossier=card.dossier||{};
  const root=$('playerCardContent');root.replaceChildren();
  const inner=document.createElement('article');inner.className='player-dossier-card';
  const hero=document.createElement('div');hero.className='player-dossier-hero';
  const img=document.createElement('img');img.className='face-portrait-image';img.src=faceOf(r);img.alt=r.name;
  const meta=document.createElement('div');meta.className='player-dossier-hero-meta';
  const kicker=document.createElement('span');kicker.className='eyebrow';kicker.textContent=`ROLE ${String(r.number).padStart(2,'0')} · YOUR STORY`;
  const name=document.createElement('h3');name.textContent=r.name;
  const occ=document.createElement('div');occ.className='occupation';occ.textContent=r.occupation;
  const relation=document.createElement('p');relation.textContent=r.relation;
  meta.append(kicker,name,occ,relation);hero.append(img,meta);inner.append(hero);
  if(card.is_culprit){const banner=document.createElement('div');banner.className='culprit-banner';banner.textContent='你抽到的角色掌握案件核心秘密。請依照自己的角色劇本行動。';inner.append(banner);}
  const story=storyParagraphs(dossier);
  appendNovelStorySection(inner,'你的角色故事｜從過去到案發當晚',dossier.player_story_chapters,story,'journal-story-section novel-story');
  appendStorySection(inner,'你目前對外的說法',[dossier.cover_story||'你尚未建立公開說法。']);
  appendTaskPanel(inner,0);
  const locked=document.createElement('section');locked.className='journal-locked-panel';locked.innerHTML='<b>第二輪角色任務尚未解鎖</b><p>完成第一輪公開調查、第二批線索公開後，才會顯示第二輪需要處理的任務與可揭露資訊。</p>';inner.append(locked);
  root.append(inner);
}


function openJournal(tab='story') {
  if(!state.playerCard){showToast('目前尚未取得角色劇本。');return;}
  state.journalTab=tab;$('journalModal').hidden=false;renderJournal();
}
function closeJournal() {$('journalModal').hidden=true;}
function renderJournal() {
  const root=$('journalContent');root.replaceChildren();
  document.querySelectorAll('.journal-tab').forEach(b=>b.classList.toggle('active',b.dataset.journalTab===state.journalTab));
  const card=state.playerCard,d=card?.dossier||{},role=getRole(state.playerRoleId);
  const makeSection=(title,body,cls='journal-read-section')=>{const s=document.createElement('section');s.className=cls;const h=document.createElement('h3');h.textContent=title;s.append(h);if(Array.isArray(body)){body.forEach(x=>{const p=document.createElement('p');p.textContent=x;s.append(p);});}else{const p=document.createElement('p');p.textContent=body||'目前沒有資料。';s.append(p);}root.append(s);};
  if(state.journalTab==='story') {
    const story=storyParagraphs(d);
    appendNovelStorySection(root,'你的完整角色故事',d.player_story_chapters,story,'journal-read-section novel-story');
    makeSection('目前對外的說法',d.cover_story||'尚未建立');
    const task=d[state.unlockedRound===0?'first_round':'second_round'];
    const t=document.createElement('section');t.className='journal-task-panel';const h=document.createElement('h3');h.textContent=state.unlockedRound===0?'目前任務｜第一輪':'目前任務｜第二輪';t.append(h);
    if(task){const p=document.createElement('p');p.textContent=task.objective||'';t.append(p);if(task.task){const p2=document.createElement('p');p2.textContent=`任務：${task.task}`;t.append(p2);}for(const [label,items] of [['可以公開',task.may_reveal],['暫時隱瞞',task.prefer_hide]]){if(items?.length){const b=document.createElement('b');b.textContent=label;t.append(b);const ul=document.createElement('ul');items.forEach(x=>{const li=document.createElement('li');li.textContent=x;ul.append(li);});t.append(ul);}}}else{const p=document.createElement('p');p.textContent='此輪任務尚未解鎖。';t.append(p);}root.append(t);
    if(state.unlockedRound===0){const lock=document.createElement('div');lock.className='journal-locked-panel';lock.textContent='第二輪任務與新增資訊將在第一輪完成、第二批線索公開後解鎖。';root.append(lock);}
  } else if(state.journalTab==='known') {
    makeSection('角色劇本中明確知道的事情',d.known_facts||[]);
    const timeline=(d.personal_timeline||[]).map(x=>`${x.time}｜${x.location}：${x.action}（你能確定：${x.knowledge||'無額外資訊'}）`);
    makeSection('自己的完整行動時間線',timeline);
    const own=state.publicLog.filter(x=>x.speaker_id===state.playerRoleId&&['intro','question','answer','final'].includes(x.kind)).map(x=>`${x.speaker}：${x.text}`);
    makeSection('你已公開說過的內容',own.length?own:['目前尚未公開發言。']);
    const recent=state.roleMemories[state.playerRoleId]||[];makeSection('你的記憶摘要',recent.map(x=>x.text));
  } else if(state.journalTab==='clues') {
    makeSection(`目前已公開線索（${state.publicClues.length}）`,state.publicClues.map(c=>`${c.title}：${c.content}`));
  } else {
    makeSection(`公開發言與事件紀錄（${state.publicLog.length}）`,state.publicLog.map(x=>`${x.speaker}：${x.text}`));
  }
}
async function unlockSecondRoundForPlayer() {
  if(state.mode==='groq' && state.sessionToken) {
    const data=await fetchWorker('/api/game/unlock-round',{session_token:state.sessionToken,round_index:1},350);
    state.playerCard.dossier=state.playerCard.dossier||{};
    state.playerCard.dossier.second_round=data.second_round;
  } else if(state.playerFullDossier?.second_round) {
    state.playerCard.dossier=state.playerCard.dossier||{};
    state.playerCard.dossier.second_round=JSON.parse(JSON.stringify(state.playerFullDossier.second_round));
  }
  state.unlockedRound=1;
  if(!$('journalModal').hidden)renderJournal();
}

function typeText(element,text,speed=26) {
  clearInterval(state.typeTimer); if(state.typeResolve) state.typeResolve();
  const chars=Array.from(String(text??''));element.textContent='';element.classList.add('typing');let i=0;let completed=false;
  $('nextNarrationBtn').disabled=true;
  const promise=new Promise(resolve=>{
    state.typeResolve=()=>{if(completed)return;completed=true;clearInterval(state.typeTimer);state.typeTimer=null;state.typeResolve=null;element.textContent=chars.join('');element.classList.remove('typing');resolve();};
    state.typeTimer=setInterval(()=>{i++;element.textContent=chars.slice(0,i).join('');if(i>=chars.length){completed=true;clearInterval(state.typeTimer);state.typeTimer=null;state.typeResolve=null;element.classList.remove('typing');resolve();}},speed);
  });
  return promise;
}
async function startOpening() {
  $('prologueBg').style.backgroundImage=`url('${getCase().scene}')`;$('prologueCaseName').textContent=getCase().title;$('sceneCaption').textContent=getCase().sceneLabel;
  state.openingIndex=0;await showOpeningLine();
}
async function showOpeningLine() {
  const lines=getCase().opening;$('narrationProgress').textContent=`${String(state.openingIndex+1).padStart(2,'0')} / ${String(lines.length).padStart(2,'0')}`;
  $('nextNarrationBtn').textContent=state.openingIndex===lines.length-1?'進入人物介紹 →':'繼續 →';
  $('nextNarrationBtn').disabled=true;
  await typeText($('narrationText'),lines[state.openingIndex],25);$('nextNarrationBtn').disabled=false;
}
async function nextOpening() {
  if(state.typeTimer){state.typeResolve?.();state.typeTimer=null;return;}
  if(state.openingIndex<getCase().opening.length-1){state.openingIndex++;await showOpeningLine();}
  else startIntroductions();
}
function startIntroductions() {
  setScreen('introScreen');$('introBg').style.backgroundImage=`url('${getCase().scene}')`;renderIntroRoster();state.introIndex=0;showCharacterIntro();
}
function renderIntroRoster() {
  const host=$('introRoster');host.replaceChildren();getCase().cast.forEach((r,i)=>{
    const card=document.createElement('div');card.className='roster-person';card.dataset.id=r.id;
    const img=document.createElement('img');img.className='face-portrait-image';img.src=faceOf(r);img.alt=r.name;
    const b=document.createElement('b');b.textContent=r.name;
    const sm=document.createElement('small');sm.textContent=r.occupation;
    card.append(img,b,sm);host.appendChild(card);
  });
}
async function showCharacterIntro() {
  const r=getCase().cast[state.introIndex];
  $('activePortrait').src=faceOf(r);$('activePortrait').alt=r.name;$('activePortrait').classList.add('face-portrait-image');$('portraitNumber').textContent=String(r.number).padStart(2,'0');
  $('activeName').textContent=r.name;$('activeOccupation').textContent=r.occupation;$('activeRelation').textContent=`與死者的關係：${r.relation}`;$('activeStageAction').textContent=r.introAction?`【登場動作】${r.introAction}`:'';
  $('introCount').textContent=`${String(state.introIndex+1).padStart(2,'0')} / 05`;
  $('characterKicker').textContent=playerIsRole(r.id)?'YOUR CHARACTER · PUBLIC INTRODUCTION':'AI CHARACTER · PUBLIC INTRODUCTION';
  document.querySelectorAll('.roster-person').forEach(el=>{el.classList.toggle('active',el.dataset.id===r.id);el.classList.toggle('done',getCase().cast.findIndex(x=>x.id===el.dataset.id)<state.introIndex);});
  $('nextCharacterBtn').textContent=state.introIndex===getCase().cast.length-1?'查看我的角色劇本 →':'下一位角色 →';$('nextCharacterBtn').disabled=true;
  await typeText($('introTypeText'),r.intro,28);
  if(!state.introducedIds.includes(r.id)){state.introducedIds.push(r.id);addLog(r.id,r.intro,'intro',`${r.number}號 ${r.name}｜自我介紹`);}
  $('nextCharacterBtn').disabled=false;
}
async function nextCharacter() {
  if(state.typeTimer){state.typeResolve?.();state.typeTimer=null;return;}
  if(state.introIndex<getCase().cast.length-1){state.introIndex++;await showCharacterIntro();}
  else {renderPlayerCard();setScreen('playerCardScreen');}
}

function addLog(speakerId,text,kind='speech',displayName=null) {
  const role=speakerId?getRole(speakerId):null;
  const entry={speaker_id:speakerId,speaker:displayName||(role?`${role.number}號 ${role.name}`:'旁白'),text:String(text),kind,time:new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})};
  state.publicLog.push(entry);
  if(speakerId && state.roleMemories[speakerId]){state.roleMemories[speakerId].push({kind,text:String(text).slice(0,220)});state.roleMemories[speakerId]=state.roleMemories[speakerId].slice(-8);}
  renderPublicTranscript();
}
function publishClues(items) {
  items.forEach(c=>{if(state.publicClues.some(x=>x.id===c.id))return;state.publicClues.push(c);addLog(null,`${c.title}：${c.content}`,'clue','公開線索');});renderClues();
}
function renderClues() {
  const host=$('clueStack');host.replaceChildren();state.publicClues.forEach(c=>{
    const div=document.createElement('div');div.className='clue-item';const b=document.createElement('b');b.textContent=c.title;const p=document.createElement('p');p.textContent=c.content;div.append(b,p);host.appendChild(div);
  });if(!state.publicClues.length)host.textContent='尚未公開線索。';
}
function renderPublicTranscript() {
  const host=$('publicTranscript');host.replaceChildren();state.publicLog.slice(-32).forEach(log=>{
    const div=document.createElement('div');div.className=`transcript-item ${log.kind}`;const b=document.createElement('b');b.textContent=log.speaker;const span=document.createElement('span');span.textContent=log.text;div.append(b,span);host.appendChild(div);
  });host.scrollTop=host.scrollHeight;
}
function renderCharacterTable() {
  const host=$('characterTable');host.replaceChildren();getCase().cast.forEach((r,i)=>{
    const el=document.createElement('div');el.className='table-person'+(i===state.turnIndex?' current':'')+(r.id===state.playerRoleId?' me':'');
    const img=document.createElement('img');img.className='face-portrait-image';img.src=faceOf(r);img.alt=r.name;
    const wrap=document.createElement('div');const b=document.createElement('b');b.textContent=(r.id===state.playerRoleId?'你｜':'')+r.name;const sm=document.createElement('small');sm.textContent=state.completedTurns.includes(r.id)?'已完成詢問':r.id===state.playerRoleId?'真人玩家':'AI 嫌疑犯';wrap.append(b,sm);el.append(img,wrap);host.appendChild(el);
  });
}
function eligibleTargets(askerId) {
  return getCase().cast.filter(r=>r.id!==askerId&&(state.askedByTarget[r.id]||[]).length<2);
}
function renderDuelStage(askerId,targetId,speakingId=null) {
  const asker=getRole(askerId),target=getRole(targetId);
  if(!asker||!target)return;
  $('duelStage').hidden=false;
  $('stageAskerPortrait').src=faceOf(asker);$('stageAskerPortrait').alt=asker.name;$('stageAskerPortrait').classList.add('face-portrait-image');
  $('stageTargetPortrait').src=faceOf(target);$('stageTargetPortrait').alt=target.name;$('stageTargetPortrait').classList.add('face-portrait-image');
  $('stageAskerName').textContent=(asker.id===state.playerRoleId?'你｜':'')+`${asker.number}號 ${asker.name}`;
  $('stageTargetName').textContent=(target.id===state.playerRoleId?'你｜':'')+`${target.number}號 ${target.name}`;
  $('stageAskerRole').textContent=asker.occupation;$('stageTargetRole').textContent=target.occupation;
  $('duelRound').textContent=`第 ${state.roundIndex+1} 輪 · 問答 ${state.interview?.exchangeCount||0}/3`;
  $('stageAsker').classList.toggle('is-speaking',speakingId===askerId);
  $('stageAsker').classList.toggle('is-listening',!!speakingId&&speakingId!==askerId);
  $('stageTarget').classList.toggle('is-speaking',speakingId===targetId);
  $('stageTarget').classList.toggle('is-listening',!!speakingId&&speakingId!==targetId);
  $('askerSpeechBubble').classList.toggle('active-bubble',speakingId===askerId);
  $('targetSpeechBubble').classList.toggle('active-bubble',speakingId===targetId);
}

function renderInvestigation() {
  $('investigationBg').style.backgroundImage=`url('${getCase().scene}')`;
  const currentId=state.turnOrder[state.turnIndex];const current=getRole(currentId);
  $('turnCounter').textContent=`ROUND ${state.roundIndex+1} · TURN ${Math.min(state.turnIndex+1,5)} / 5`;
  $('roundDescription').textContent=state.roundIndex===0?'第一輪調查：先釐清人物行蹤與初步證詞；所有問答皆公開。':'第二輪調查：新線索已公開，請根據前一輪證詞追查矛盾；所有問答皆公開。';
  $('turnTitle').textContent=current?`${current.number} 號｜${current.name}`:'所有角色已完成詢問';
  $('turnEyebrow').textContent=currentId===state.playerRoleId?'YOUR TURN · YOU MAY ASK ANYONE':'AI TURN · PUBLIC QUESTIONING';
  $('interviewStatus').textContent=currentId===state.playerRoleId?'輪到你詢問。選擇一名尚未達到詢問上限的角色，輸入問題。':'AI 角色將依照自己的立場選擇詢問對象。若目標是你，你需要公開回答。';
  $('startTurnBtn').hidden=state.completedTurns.includes(currentId)||!!state.interview;
  $('startTurnBtn').disabled=!current;
  $('nextTurnBtn').hidden=!!state.interview||!state.completedTurns.includes(currentId)||state.turnIndex>=state.turnOrder.length-1;
  $('endInterviewBtn').hidden=!state.interview;
  $('turnLimit').textContent=state.interview?`${state.interview.exchangeCount} / 3 組問答`:'最多 3 組問答';
  if(state.interview)renderDuelStage(state.interview.askerId,state.interview.targetId);else $('duelStage').hidden=true;
  renderCharacterTable();renderClues();renderPublicTranscript();
}
function renderPlayerActionArea(html) {const host=$('playerActionArea');host.hidden=false;host.innerHTML=html;}
function hidePlayerActionArea(){const host=$('playerActionArea');host.hidden=true;host.replaceChildren();}

async function startCurrentTurn() {
  if(state.interview)return;const askerId=state.turnOrder[state.turnIndex];if(!askerId)return;
  if(askerId===state.playerRoleId){showPlayerQuestionForm();return;}
  setBusy(true,`${getRole(askerId).name} 正在選擇詢問對象……`);
  try {
    const available=eligibleTargets(askerId);if(!available.length)throw new Error('目前沒有符合詢問限制的對象。');
    let selection;
    if(state.mode==='groq') {
      selection=await fetchWorker('/api/ai/choose',{session_token:state.sessionToken,case_id:getCase().id,actor_id:askerId,round_index:state.roundIndex,available_target_ids:available.map(r=>r.id),asked_by_target:state.askedByTarget,public_log:state.publicLog.slice(-28),public_clues:state.publicClues,public_introductions:getCase().cast.map(r=>({name:r.name,occupation:r.occupation,relation:r.relation,intro:r.intro})),role_memory:state.roleMemories[askerId]||[]},1400);
    } else {
      const demo=DEMO[getCase().id];
      const plan=demo.question_plans?.[askerId]?.[state.roundIndex===0?'round1':'round2'];
      const privateRole=demo.roles[askerId];
      const ordered=[plan?.target,...(privateRole.priority||[])].filter(Boolean).filter((id,i,a)=>a.indexOf(id)===i&&available.some(r=>r.id===id));
      const targetId=ordered[0]||available[0].id;
      const targetPlan=targetId===plan?.target?plan:null;
      const fallbackPlan=demo.roles[targetId]?.dossier?.default_interview;
      selection={target_id:targetId,question:targetPlan?.question||fallbackPlan?.question||`${getRole(targetId).name}，請說明你在公開自我介紹中提到的行動與相關時間。`};
      selection._demoPlan=targetPlan||fallbackPlan||null;
    }
    let targetId=available.some(r=>r.id===selection.target_id)?selection.target_id:available[0].id;
    await beginInterview(askerId,targetId,selection.question||'請說明案發當晚的行動。');
  } catch(e) {showToast(`無法開始詢問：${e.message}`,6500);}
  finally {setBusy(false);}
}
function beginInterview(askerId,targetId,question) {
  if((state.askedByTarget[targetId]||[]).length>=2)throw new Error('該角色本輪已達兩名詢問者上限。');
  state.askedByTarget[targetId].push(askerId);
  const demoPlan=DEMO[getCase().id]?.question_plans?.[askerId]?.[state.roundIndex===0?'round1':'round2'];
  const targetFallback=DEMO[getCase().id]?.roles?.[targetId]?.dossier?.default_interview;
  const resolvedPlan=demoPlan?.target===targetId?demoPlan:targetFallback;
  state.interview={askerId,targetId,exchangeCount:0,currentQuestion:question,exchanges:[],waitingForPlayer:false,demoQuestions:[resolvedPlan?.question,...(resolvedPlan?.followups||[])].filter(Boolean),demoFollowups:resolvedPlan?.followups||[],demoAnswers:resolvedPlan?.answers||[]};
  $('exchangeList').replaceChildren();
  $('askerSpeechLabel').textContent='即將提出問題';$('askerSpeechText').textContent='';
  $('targetSpeechLabel').textContent='等待回答';$('targetSpeechText').textContent='';
  $('interviewStatus').textContent=`${getRole(askerId).name} 正在公開詢問 ${getRole(targetId).name}。所有在場角色都能聽見。`;
  renderDuelStage(askerId,targetId,askerId);renderInvestigation();
  return runQuestionAnswer(question);
}
async function typeDialogue(element,text,speed=28) {
  const chars=Array.from(String(text||''));element.textContent='';element.classList.add('typing-caret');
  for(let i=0;i<chars.length;i++) { element.textContent+=chars[i]; await sleep(speed); }
  element.classList.remove('typing-caret');
}
async function appendSpeech(roleId,text,kind,displayName=null) {
  const role=getRole(roleId), iv=state.interview;
  if(iv && roleId) {
    const isAsker=roleId===iv.askerId;
    renderDuelStage(iv.askerId,iv.targetId,roleId);
    const label=$(isAsker?'askerSpeechLabel':'targetSpeechLabel');
    const bubble=$(isAsker?'askerSpeechBubble':'targetSpeechBubble');
    const content=$(isAsker?'askerSpeechText':'targetSpeechText');
    label.textContent=`${role.number}號 ${role.name}｜${kind==='question'?'提出問題':kind==='answer'?'回答':'發言'}`;
    bubble.classList.add('active-bubble');
    // Only the current speaker's bubble is replaced; the other side keeps the
    // immediately preceding line, so the exchange reads as a live conversation.
    await typeDialogue(content,text,25);
  }
  addLog(roleId,text,kind,displayName);
}
function demoAnswer(role,question,roundIndex) {
  const q=String(question||'').toLowerCase().replace(/[？?。！!，,、\s]/g,'');
  const rules=(role.dossier?.response_rules||[]).filter(rule=>Number(rule.unlock_round||0)<=Number(roundIndex));
  const scored=rules.map(rule=>{
    const matches=(rule.keywords||[]).filter(k=>{
      const key=String(k||'').toLowerCase().replace(/[？?。！!，,、\s]/g,'');
      return key.length>0 && q.includes(key);
    });
    const strong=matches.filter(k=>String(k).length>=3 || /\d{1,2}:\d{2}/.test(String(k)));
    const score=matches.reduce((sum,k)=>sum+Math.min(String(k).length,10),0)+strong.length*4;
    return {rule,score,strong:strong.length,matches:matches.length};
  }).filter(x=>x.matches>=2 || x.strong>=1).sort((a,b)=>b.score-a.score);
  if(scored.length && (scored.length===1 || scored[0].score>scored[1].score)) return scored[0].rule.answer;

  // Exact time/location questions may be answered from the role's own timeline.
  const timeline=(role.dossier?.personal_timeline||[]).filter(item=>Number(item.disclosure_round||0)<=Number(roundIndex));
  const timelineMatch=timeline.find(item=>{
    const time=String(item.time||'').replace(/\s/g,'');
    return time && q.includes(time);
  });
  if(timelineMatch) return `${timelineMatch.time}，我在${timelineMatch.location}。${timelineMatch.action}我能確認的是：${timelineMatch.knowledge||'我只知道自己的行動，無法確認其他人的情況。'}`;

  return '這個問題沒有對應到我目前能確認的具體事實。我不想憑印象補出不存在的細節；請指出一個明確的時間、地點、人物或線索，我再依照自己的經歷回答。';
}

function demoFollowupQuestion(askerId,targetId,exchangeCount,lastAnswer) {
  const target=getRole(targetId);
  const recent=String(lastAnswer||'');
  if(/沒有看見|無法確認|不確定/.test(recent)) return `你剛才表示無法確認細節。你能否說明當時你實際看見或聽見的最後一個確定事實？`;
  if(/文件|帳頁|帳務|紙片/.test(recent)) return `你提到相關文件。請說明你是否親自看過原件，以及你能確認的文件內容到哪個程度？`;
  return `你剛才提到的行動，能否再具體說明當時的位置、時間，以及是否有其他人在場？`;
}

async function runQuestionAnswer(question) {
  const iv=state.interview;if(!iv)return;iv.currentQuestion=question;iv.waitingForPlayer=false;
  await appendSpeech(iv.askerId,question,'question');
  if(iv.targetId===state.playerRoleId){
    showPlayerAnswerForm();return;
  }
  setBusy(true,`${getRole(iv.targetId).name} 正在回答公開問題……`);
  try {
    let answer;
    if(state.mode==='groq') {
      const data=await fetchWorker('/api/ai/answer',{session_token:state.sessionToken,case_id:getCase().id,actor_id:iv.targetId,round_index:state.roundIndex,question,public_log:state.publicLog.slice(-28),public_clues:state.publicClues,public_introductions:getCase().cast.map(r=>({name:r.name,occupation:r.occupation,relation:r.relation,intro:r.intro})),role_memory:state.roleMemories[iv.targetId]||[]},1500);
      answer=data.answer;
    } else {
      const demo=DEMO[getCase().id].roles[iv.targetId];
      const planned=iv.demoQuestions?.[iv.exchangeCount]||'';
      const normalizeQ=value=>String(value||'').replace(/[？?。！!，,、\s]/g,'').toLowerCase();
      const questionMatchesPlan=planned && normalizeQ(planned)===normalizeQ(question);
      answer=questionMatchesPlan && iv.demoAnswers?.[iv.exchangeCount] ? iv.demoAnswers[iv.exchangeCount] : demoAnswer(demo,question,state.roundIndex);
    }
    await appendSpeech(iv.targetId,answer,'answer');iv.exchanges.push({question,answer});iv.exchangeCount++;
    $('turnLimit').textContent=`${iv.exchangeCount} / 3 組問答`;
    if(iv.exchangeCount>=3){await finishInterview(false);return;}
    await continueOrFinish();
  } catch(e) {showToast(`角色回答失敗：${e.message}`,6500);$('interviewStatus').textContent='請檢查 Worker 與 Groq 連線，或提前結束本次詢問。';}
  finally {setBusy(false);}
}
async function continueOrFinish() {
  const iv=state.interview;if(!iv)return;
  if(iv.askerId===state.playerRoleId){showPlayerFollowupForm();return;}
  setBusy(true,`${getRole(iv.askerId).name} 正在根據回答追問……`);
  try {
    let nextQ;
    const last=iv.exchanges[iv.exchanges.length-1];
    if(state.mode==='groq') {
      const data=await fetchWorker('/api/ai/followup',{session_token:state.sessionToken,case_id:getCase().id,actor_id:iv.askerId,round_index:state.roundIndex,previous_question:last.question,previous_answer:last.answer,exchange_count:iv.exchangeCount,public_log:state.publicLog.slice(-28),public_clues:state.publicClues,public_introductions:getCase().cast.map(r=>({name:r.name,occupation:r.occupation,relation:r.relation,intro:r.intro})),role_memory:state.roleMemories[iv.askerId]||[]},1100);
      nextQ=data.question;
    } else {
      nextQ=iv.demoFollowups?.[iv.exchangeCount-1]||demoFollowupQuestion(iv.askerId,iv.targetId,iv.exchangeCount,last.answer);
    }
    if(!nextQ){await finishInterview(false);return;}
    await runQuestionAnswer(nextQ);
  } catch(e){showToast(`追問生成失敗：${e.message}`,6500);await finishInterview(true);}
  finally {setBusy(false);}
}
function showPlayerAnswerForm() {
  const iv=state.interview;const host=$('playerActionArea');host.hidden=false;
  host.innerHTML=`<label>你被 ${safeText(getRole(iv.askerId).name)} 公開詢問。請依照自己的完整角色劇本回答（最多 200 字）；本次對話會公開給所有角色。</label><textarea id="playerAnswerInput" maxlength="200" placeholder="輸入你的公開回答……"></textarea><div class="form-foot"><span id="answerCount">0 / 200</span><button id="submitPlayerAnswerBtn" class="gold-btn">公開回答 →</button></div>`;
  $('playerAnswerInput').addEventListener('input',()=>{$('answerCount').textContent=`${$('playerAnswerInput').value.length} / 200`;});
  $('submitPlayerAnswerBtn').addEventListener('click',submitPlayerAnswer);
}
async function submitPlayerAnswer() {
  const text=$('playerAnswerInput')?.value.trim();if(!text){showToast('請先輸入回答。');return;}
  const iv=state.interview;await appendSpeech(state.playerRoleId,text,'answer','你｜'+getRole(state.playerRoleId).name);
  iv.exchanges.push({question:iv.currentQuestion,answer:text});iv.exchangeCount++;hidePlayerActionArea();
  $('turnLimit').textContent=`${iv.exchangeCount} / 3 組問答`;
  if(iv.exchangeCount>=3)await finishInterview(false);else continueOrFinish();
}
function showPlayerQuestionForm() {
  const eligible=eligibleTargets(state.playerRoleId);const options=eligible.map(r=>`<option value="${r.id}">${r.number}號｜${safeText(r.name)}（已被 ${state.askedByTarget[r.id].length} 人詢問）</option>`).join('');
  if(!eligible.length){showToast('所有其他角色都已達詢問人數上限。');return;}
  renderPlayerActionArea(`<label>選擇你要公開詢問的對象</label><select id="playerTargetSelect">${options}</select><label>第一個問題（最多 200 字）</label><textarea id="playerQuestionInput" maxlength="200" placeholder="輸入你想詢問的問題……"></textarea><div class="form-foot"><span id="questionCount">0 / 200</span><button id="submitPlayerQuestionBtn" class="gold-btn">公開提問 →</button></div>`);
  $('playerQuestionInput').addEventListener('input',()=>{$('questionCount').textContent=`${$('playerQuestionInput').value.length} / 200`;});
  $('submitPlayerQuestionBtn').addEventListener('click',()=>{
    const target=$('playerTargetSelect').value;const q=$('playerQuestionInput').value.trim();if(!q){showToast('請輸入問題。');return;}
    beginInterview(state.playerRoleId,target,q);
  });
}
function showPlayerFollowupForm() {
  const iv=state.interview;
  renderPlayerActionArea(`<label>對方已回答。你可以追問，也可以提前結束。（第 ${iv.exchangeCount} / 3 組）</label><textarea id="playerFollowupInput" maxlength="200" placeholder="根據剛才的回答提出追問……"></textarea><div class="form-foot"><span id="followupCount">0 / 200</span><div><button id="finishPlayerTurnBtn" class="secondary-btn">結束詢問</button> <button id="submitPlayerFollowupBtn" class="gold-btn">繼續追問 →</button></div></div>`);
  $('playerFollowupInput').addEventListener('input',()=>{$('followupCount').textContent=`${$('playerFollowupInput').value.length} / 200`;});
  $('finishPlayerTurnBtn').addEventListener('click',()=>finishInterview(true));
  $('submitPlayerFollowupBtn').addEventListener('click',()=>{const q=$('playerFollowupInput').value.trim();if(!q){showToast('請輸入追問，或選擇結束詢問。');return;}hidePlayerActionArea();runQuestionAnswer(q);});
}
async function finishInterview(early) {
  if(!state.interview)return;
  const asker=getRole(state.interview.askerId),target=getRole(state.interview.targetId);
  addLog(null,`${asker.name} 完成對 ${target.name} 的公開詢問（${state.interview.exchangeCount} 組問答${early?'，提前結束':''}）。`,'system','調查紀錄');
  state.completedTurns.push(state.interview.askerId);state.interview=null;hidePlayerActionArea();
  renderInvestigation();
  $('startTurnBtn').hidden=true;
  if(state.completedTurns.length>=state.turnOrder.length){
    $('nextTurnBtn').hidden=true;
    if(state.roundIndex===0){
      try { await unlockSecondRoundForPlayer(); }
      catch(e) { showToast(`第二輪個人資料載入失敗：${e.message}`,6500); return; }
      publishClues(getCase().midClues);
      state.roundIndex=1;state.turnIndex=0;
      state.askedByTarget=Object.fromEntries(getCase().cast.map(r=>[r.id,[]]));
      state.completedTurns=[];
      addLog(null,'第一輪調查結束。第二批線索與第二輪角色任務已公開，所有角色可以根據新資訊重新選擇詢問對象。','system','旁白');
      renderInvestigation();
      if(!$('journalModal').hidden)renderJournal();
      showToast('第二輪調查開始：新任務與線索已解鎖，詢問名額已重置。');
    } else {
      setTimeout(()=>goFinalStage(),500);
    }
  } else $('nextTurnBtn').hidden=false;
}
function nextTurn() {
  if(state.turnIndex<state.turnOrder.length-1)state.turnIndex++;
  renderInvestigation();
}
function beginInvestigation() {
  publishClues(getCase().openingClues);state.roundIndex=0;state.turnIndex=0;state.completedTurns=[];state.askedByTarget=Object.fromEntries(getCase().cast.map(r=>[r.id,[]]));
  setScreen('investigationScreen');renderInvestigation();addLog(null,'公開調查開始。所有在場角色依序進行詢問，所有問答都會公開。','system','旁白');renderPublicTranscript();
}

async function goFinalStage() {
  setScreen('finalScreen');$('finalBg').style.backgroundImage=`url('${getCase().scene}')`;$('finalStatements').replaceChildren();$('generateFinalBtn').hidden=false;$('goVoteBtn').hidden=true;
  addLog(null,'所有角色已完成本輪公開詢問，現在進入最後陳述。','system','旁白');
}
function renderFinalCard(role,statement) {
  const card=document.createElement('article');card.className='final-card';const img=document.createElement('img');img.className='face-portrait-image';img.src=faceOf(role);img.alt=role.name;
  const content=document.createElement('div');const h=document.createElement('h3');h.textContent=`${role.number} 號｜${role.name}`;const p=document.createElement('p');p.textContent=statement;const hint=document.createElement('div');hint.className='vote-hidden';hint.textContent='已完成最後陳述並提交個人投票（投票結果將於揭曉時公開）';content.append(h,p,hint);card.append(img,content);$('finalStatements').appendChild(card);
}
async function generateFinalStatements() {
  $('generateFinalBtn').hidden=true;setBusy(true,'各角色正在整理最後陳述並獨立投票……');
  try {
    for(const role of npcRoles()) {
      let result;
      if(state.mode==='groq') {
        result=await fetchWorker('/api/ai/finalize',{session_token:state.sessionToken,case_id:getCase().id,actor_id:role.id,round_index:state.roundIndex,public_log:state.publicLog.slice(-24),public_clues:state.publicClues,public_introductions:getCase().cast.map(r=>({name:r.name,occupation:r.occupation,relation:r.relation,intro:r.intro})),role_memory:state.roleMemories[role.id]||[],allowed_vote_ids:getCase().cast.filter(r=>r.id!==role.id).map(r=>r.id)},1700);
      } else {
        const demo=DEMO[getCase().id];const priv=demo.roles[role.id];
        const target=(priv.priority||[])[0]||getCase().cast.find(r=>r.id!==role.id).id;
        result={statement:demoFinalStatement(role,priv,target),vote_id:demo.votes?.[role.id]||target};
      }
      const voteId=getCase().cast.some(r=>r.id===result.vote_id&&r.id!==role.id)?result.vote_id:getCase().cast.find(r=>r.id!==role.id).id;
      state.finalStatements[role.id]=result.statement;state.npcVotes[role.id]=voteId;renderFinalCard(role,result.statement);addLog(role.id,result.statement,'final',`${role.number}號 ${role.name}｜最後陳述`);
    }
    $('goVoteBtn').hidden=false;showToast('所有 AI 角色已完成最後陳述與投票。');
  } catch(e) {showToast(`最後陳述生成失敗：${e.message}`,7000);$('generateFinalBtn').hidden=false;}
  finally {setBusy(false);}
}
function demoFinalStatement(role,priv,targetId) {
  const target=getRole(targetId);
  if(priv.is_culprit)return '我承認自己與案件中的某些爭議有關，但目前公開線索仍不足以證明我犯案。請大家注意其他角色在關鍵時間的行動。';
  return `我認為${target.name}的說法仍有需要釐清之處。我的確有不希望公開的私人事情，但那與殺害死者是兩回事。請依照時間線和實際線索判斷。`;
}
function openVote() {
  setScreen('voteScreen');$('playerVoteChoices').replaceChildren();state.playerVote=null;
  getCase().cast.filter(r=>r.id!==state.playerRoleId).forEach(r=>{
    const card=document.createElement('button');card.type='button';card.className='vote-person';card.dataset.id=r.id;
    const img=document.createElement('img');img.className='face-portrait-image';img.src=faceOf(r);img.alt=r.name;const b=document.createElement('b');b.textContent=`${r.number} 號｜${r.name}`;const sm=document.createElement('small');sm.textContent=r.occupation;
    card.append(img,b,sm);card.addEventListener('click',()=>{state.playerVote=r.id;document.querySelectorAll('.vote-person').forEach(x=>x.classList.toggle('selected',x.dataset.id===r.id));$('submitVoteBtn').disabled=false;});$('playerVoteChoices').appendChild(card);
  });
  $('playerGoalNote').textContent=state.playerCard.is_culprit?'你的個人任務：讓其他角色無法確認你是真正的兇手。請選擇一個能保護自己立場的對象。':'你的個人任務：根據所有證詞與線索找出真正的兇手。';
}
async function submitVote() {
  if(!state.playerVote)return;setBusy(true,'正在結算玩家與 AI 角色的投票……');
  try {
    let truth;
    if(state.mode==='groq')truth=await fetchWorker('/api/game/reveal',{session_token:state.sessionToken,case_id:getCase().id},300);
    else truth=DEMO[getCase().id].truth;
    const aiVotes=Object.entries(state.npcVotes).map(([voter,target])=>({voter_id:voter,target_id:target}));
    renderReveal(truth,aiVotes);setScreen('revealScreen');
  } catch(e){showToast(`真相揭曉失敗：${e.message}`,6500);}
  finally{setBusy(false);}
}
function renderReveal(truth,aiVotes) {
  const culpritId=truth.culprit_id||truth.culpritId;const culprit=getRole(culpritId);const isPlayerCulprit=state.playerRoleId===culpritId;
  const playerCorrect=state.playerVote===culpritId;const playerVoteName=getRole(state.playerVote)?.name||'未投票';
  const npcCaughtPlayer=aiVotes.filter(v=>v.target_id===state.playerRoleId).length;
  const npcCorrect=aiVotes.filter(v=>v.target_id===culpritId).length;
  const npcMajorityCorrect=npcCorrect>aiVotes.length/2;
  $('revealBg').style.backgroundImage=`url('${getCase().scene}')`;
  $('revealHeading').textContent=isPlayerCulprit?(npcCaughtPlayer>aiVotes.length/2?'兇手被識破了':'你成功瞞過了其他人！'):(playerCorrect?'推理成功！':'兇手另有其人');
  let summary='';
  if(isPlayerCulprit)summary=`你抽到的角色是${culprit.name}，真正的兇手就是你。\n你的投票選擇了${playerVoteName}。\n${npcCaughtPlayer>aiVotes.length/2?'其他角色的多數投票成功指認你。':'其他角色未能形成多數票指認你，你成功隱瞞了犯案真相。'}`;
  else summary=`真正的兇手是：${culprit.name}。\n你的投票選擇了${playerVoteName}，${playerCorrect?'成功找出真正兇手。':'未能正確指認兇手。'}\nAI 角色中有 ${npcCorrect} / ${aiVotes.length} 票投向真正兇手，${npcMajorityCorrect?'AI 多數票成功找出兇手。':'AI 多數票未能找出真正兇手。'}`;
  summary+=`\n\n犯案動機：${truth.motive}\n\n犯案經過：${truth.method||truth.method_summary||''}`;
  $('revealSummary').textContent=summary;
  const results=$('voteResults');results.replaceChildren();
  getCase().cast.forEach(r=>{
    const item=document.createElement('div');item.className='vote-result-item';const b=document.createElement('b');b.textContent=`${r.number}號 ${r.name}${r.id===state.playerRoleId?'（你）':''}`;
    const targetId=r.id===state.playerRoleId?state.playerVote:state.npcVotes[r.id];const target=getRole(targetId);const text=document.createElement('span');text.textContent=`投票給：${target?.name||'未投票'}${targetId===culpritId?' ✓':''}`;item.append(b,text);results.appendChild(item);
  });
  const timeline=$('truthTimeline');timeline.replaceChildren();(truth.timeline||[]).forEach(line=>{const d=document.createElement('div');d.textContent=line;timeline.appendChild(d);});
  const secrets=$('allSecrets');secrets.replaceChildren();getCase().cast.forEach(r=>{
    const priv=(state.mode==='demo'?DEMO[getCase().id].roles[r.id]:null);
    const secretText=truth.role_secrets?.[r.id]||truth.character_secrets?.[r.id]||priv?.secret||'此角色沒有額外秘密。';
    const d=document.createElement('div');d.className='secret-result';const b=document.createElement('b');b.textContent=`${r.number}號 ${r.name}`;const p=document.createElement('span');p.textContent=secretText;d.append(b,p);secrets.appendChild(d);
  });
}

async function boot() {
  loadSettings();renderCases();
  $('homeHero').style.backgroundImage='';
  $('settingsBtn').addEventListener('click',openSettings);$('closeSettings').addEventListener('click',closeSettings);$('saveSettingsBtn').addEventListener('click',saveSettings);$('testApiBtn').addEventListener('click',testConnection);
  document.querySelectorAll('input[name="gameMode"]').forEach(r=>r.addEventListener('change',updateModeFields));
  document.querySelectorAll('input[name="roleMode"]').forEach(r=>r.addEventListener('change',updateRoleMode));
  $('closeRole').addEventListener('click',closeRoleModal);$('confirmRoleBtn').addEventListener('click',confirmRole);$('enterStoryBtn').addEventListener('click',()=>{});
  $('nextNarrationBtn').addEventListener('click',nextOpening);$('nextCharacterBtn').addEventListener('click',nextCharacter);
  $('beginInvestigationBtn').addEventListener('click',beginInvestigation);$('startTurnBtn').addEventListener('click',startCurrentTurn);$('nextTurnBtn').addEventListener('click',nextTurn);$('endInterviewBtn').addEventListener('click',()=>finishInterview(true));
  $('generateFinalBtn').addEventListener('click',generateFinalStatements);$('goVoteBtn').addEventListener('click',openVote);$('submitVoteBtn').addEventListener('click',submitVote);$('backHomeBtn').addEventListener('click',()=>{state.apiKey='';$('groqKey').value='';closeJournal();setScreen('homeScreen');});
  $('openJournalBtn').addEventListener('click',()=>openJournal('story'));$('openJournalTopBtn').addEventListener('click',()=>openJournal('story'));$('closeJournal').addEventListener('click',closeJournal);$('journalModal').addEventListener('click',e=>{if(e.target===$('journalModal'))closeJournal();});document.querySelectorAll('.journal-tab').forEach(b=>b.addEventListener('click',()=>{state.journalTab=b.dataset.journalTab;renderJournal();}));
  $('brandHome').addEventListener('click',e=>{e.preventDefault();if(confirm('返回首頁會結束目前案件，確定嗎？')){state.apiKey='';$('groqKey').value='';setScreen('homeScreen');}});
}
boot();
