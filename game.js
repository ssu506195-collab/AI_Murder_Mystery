/*
 * GitHub Pages static demo edition.
 * This edition intentionally uses scripted responses and does not call any LLM API.
 * Never place a real API key in this file or any other frontend asset.
 */
const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'mystery-room-github-demo-v1';
let caseData = null;
let gameState = null;
let selectedVote = null;
let busy = false;

const INITIAL_QUESTIONS = {
  role_01: '你曾表示晚餐後要處理合作文件，請說明你當晚是否進入過書房？',
  role_02: '你和江先生近期有帳務爭執，這是否影響你當晚的行動？',
  role_03: '你說自己晚餐後回房休息，是否有人能證明你的行蹤？',
  role_04: '你比其他人更了解江先生的健康狀況，晚餐前後有沒有發現異常？'
};

const FINAL_STATEMENTS = {
  role_01: '我認為陳先生需要說清楚他當晚為何要詢問書房的情況。至於我自己的行動，我確實有工作上的疏失，但我沒有傷害江先生。',
  role_02: '我認為雨彤與江先生的家庭爭執值得注意，許醫師也掌握死者的健康資訊。不能只因為我有帳務爭議，就把所有事情都指向我。',
  role_03: '我承認和舅舅有過爭執，但我認為帳冊缺頁才是最重要的線索。應該查清楚誰有機會接觸帳冊，以及誰最怕帳務被公開。',
  role_04: '我認為陳先生與死者的帳務爭議，以及管家可能目擊到的走廊情況，都值得納入判斷。我的醫療背景不應成為沒有證據的指控。'
};

function showToast(message, duration = 4200) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.classList.remove('show'), duration);
}

function setBusy(value, message = '') {
  busy = value;
  document.querySelectorAll('button').forEach(btn => {
    if (btn.id === 'resetBtn') return;
    btn.disabled = value || btn.dataset.disabled === 'true';
  });
  if (message) showToast(message, 7000);
}

function saveState() {
  if (!gameState) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameState, selectedVote }));
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.gameState?.case_id === 'case_001') {
      gameState = parsed.gameState;
      selectedVote = parsed.selectedVote || null;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function addLog(speaker, roleId, text, kind = 'system') {
  gameState.public_log.push({
    id: gameState.public_log.length + 1,
    speaker,
    role_id: roleId,
    text,
    kind,
    time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
  });
}

function roleById(id) {
  return caseData.roles.find(role => role.id === id);
}

function stageLabel(stage) {
  return ({
    opening: '案件介紹',
    investigation: '公開調查',
    final_statements: '最終陳述',
    voting: '玩家投票',
    reveal: '真相揭曉'
  })[stage] || stage;
}

function updateStageNav(stage) {
  const items = [
    ['opening', '01 案件介紹'],
    ['investigation', '02 公開調查'],
    ['final_statements', '03 最終陳述'],
    ['voting', '04 玩家投票'],
    ['reveal', '05 真相揭曉']
  ];
  const order = items.map(x => x[0]);
  const current = order.indexOf(stage);
  $('stageNav').replaceChildren();
  items.forEach(([key, label], index) => {
    const span = document.createElement('span');
    span.className = 'stage-item' + (key === stage ? ' active' : index < current ? ' done' : '');
    span.textContent = label;
    $('stageNav').appendChild(span);
  });
}

function renderSuspects() {
  const host = $('suspectList');
  host.replaceChildren();
  caseData.roles.forEach(role => {
    const div = document.createElement('div');
    div.className = 'suspect';
    const number = document.createElement('div');
    number.className = 'suspect-no';
    number.textContent = role.number;
    const info = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = role.name;
    const small = document.createElement('span');
    const asked = gameState?.askers_by_target?.[role.id]?.length ?? 0;
    small.textContent = `${role.occupation}｜本輪被詢問 ${asked}/2 位`;
    info.append(strong, small);
    div.append(number, info);
    host.appendChild(div);
  });
}

function renderIntros() {
  $('openingText').textContent = caseData.opening;
  const host = $('introCards');
  host.replaceChildren();
  caseData.roles.forEach(role => {
    const card = document.createElement('div');
    card.className = 'intro-card';
    const head = document.createElement('div');
    head.className = 'intro-head';
    const name = document.createElement('span');
    name.className = 'intro-name';
    name.textContent = `${role.number} 號｜${role.name}`;
    const occupation = document.createElement('span');
    occupation.className = 'intro-role';
    occupation.textContent = role.occupation;
    head.append(name, occupation);
    const p = document.createElement('div');
    p.className = 'intro-copy';
    p.textContent = caseData.introductions[role.id] || '（尚無自我介紹）';
    card.append(head, p);
    host.appendChild(card);
  });
}

function renderClues() {
  const host = $('clueList');
  host.replaceChildren();
  (gameState?.public_clues || []).forEach(clue => {
    const div = document.createElement('div');
    div.className = 'clue';
    const title = document.createElement('strong');
    title.textContent = clue.title;
    const p = document.createElement('p');
    p.textContent = clue.content;
    div.append(title, p);
    host.appendChild(div);
  });
  if (!gameState?.public_clues?.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '尚未公開線索。';
    host.appendChild(empty);
  }
}

function renderPublicLog() {
  const host = $('publicLog');
  host.replaceChildren();
  const logs = gameState?.public_log || [];
  $('logCount').textContent = `${logs.length} 則`;
  if (!logs.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '目前沒有公開紀錄。';
    host.appendChild(empty);
    return;
  }
  logs.forEach(item => {
    const div = document.createElement('div');
    div.className = `log-item ${item.kind || ''}`;
    const meta = document.createElement('div');
    meta.className = 'log-meta';
    const who = document.createElement('span');
    who.textContent = item.speaker;
    const time = document.createElement('span');
    time.textContent = item.time || '';
    meta.append(who, time);
    const text = document.createElement('div');
    text.className = 'log-text';
    text.textContent = item.text;
    div.append(meta, text);
    host.appendChild(div);
  });
  host.scrollTop = host.scrollHeight;
}

function renderTurnOrder() {
  const host = $('turnOrder');
  host.replaceChildren();
  const names = Object.fromEntries(caseData.roles.map(r => [r.id, `${r.number}號 ${r.name}`]));
  gameState.turn_order.forEach((id, idx) => {
    const div = document.createElement('div');
    div.className = 'turn-chip' + (gameState.completed_askers.includes(id) ? ' done' : idx === gameState.turn_index && gameState.stage === 'investigation' ? ' active' : '');
    div.textContent = `${idx + 1}. ${names[id]}`;
    host.appendChild(div);
  });
  $('turnProgress').textContent = `${gameState.completed_askers.length} / ${gameState.turn_order.length} 回合`;
  const currentId = gameState.turn_order[gameState.turn_index];
  const currentRole = currentId ? roleById(currentId) : null;
  $('currentTurnName').textContent = currentRole ? `${currentRole.number} 號｜${currentRole.name}` : '調查完成';
  $('turnHint').textContent = currentRole
    ? '此角色會依自己的懷疑順序選擇一名對象，最多進行三組公開問答。'
    : '所有角色已完成詢問，可以進入最終陳述。';
  $('runTurnBtn').hidden = gameState.stage !== 'investigation';
  $('runTurnBtn').disabled = busy || gameState.stage !== 'investigation';
  $('finalizeBtn').hidden = gameState.stage !== 'final_statements';
}

function renderUsage() {
  $('gameTokens').textContent = '0';
  $('usageBar').style.width = '0%';
  $('tokenPill').textContent = 'Token 0';
  $('apiCalls').textContent = 'API 0 次';
  $('modePill').textContent = 'GitHub Pages 演示版';
  $('modePill').className = 'pill muted';
}

function renderFinalStatements() {
  const host = $('finalList');
  host.replaceChildren();
  const statements = gameState?.final_statements || {};
  caseData.roles.forEach(role => {
    if (!statements[role.id]) return;
    const card = document.createElement('div');
    card.className = 'final-card';
    const strong = document.createElement('strong');
    strong.textContent = `${role.number} 號｜${role.name}`;
    const p = document.createElement('p');
    p.textContent = statements[role.id];
    card.append(strong, p);
    host.appendChild(card);
  });
  $('generateFinalBtn').hidden = gameState.stage !== 'final_statements';
  $('goVoteBtn').hidden = true;
}

function renderVoteChoices() {
  const host = $('voteChoices');
  host.replaceChildren();
  caseData.roles.forEach(role => {
    const label = document.createElement('label');
    label.className = 'vote-choice' + (selectedVote === role.id ? ' selected' : '');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'suspect';
    input.value = role.id;
    input.checked = selectedVote === role.id;
    input.addEventListener('change', () => {
      selectedVote = role.id;
      saveState();
      renderVoteChoices();
    });
    const strong = document.createElement('strong');
    strong.textContent = `${role.number} 號｜${role.name}（${role.occupation}）`;
    label.append(input, strong);
    host.appendChild(label);
  });
  $('submitVoteBtn').disabled = busy || !selectedVote;
}

function renderReveal() {
  const result = gameState?.result;
  if (!result) return;
  $('revealTitle').textContent = result.correct ? '推理成功！' : '兇手另有其人';
  $('revealSub').textContent = result.correct
    ? `你投票選擇 ${result.voted_name}，成功找出真正兇手。`
    : `你投票選擇 ${result.voted_name}，但真正的兇手是 ${result.culprit_name}。`;
  const truth = $('truthCard');
  truth.replaceChildren();
  const label = document.createElement('div');
  label.className = 'truth-title';
  label.textContent = 'THE REAL CULPRIT';
  const name = document.createElement('div');
  name.className = 'truth-name';
  name.textContent = result.culprit_name;
  const motive = document.createElement('p');
  motive.textContent = `犯案動機：${result.motive}`;
  const method = document.createElement('p');
  method.textContent = `犯案經過：${result.method_summary}`;
  const why = document.createElement('p');
  why.textContent = `關鍵判斷：${result.explanation}`;
  truth.append(label, name, motive, method, why);
  const timeline = $('timeline');
  timeline.replaceChildren();
  (result.timeline || []).forEach(item => {
    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.textContent = item;
    timeline.appendChild(div);
  });
  const secretList = $('secretList');
  secretList.replaceChildren();
  caseData.roles.forEach(role => {
    const item = document.createElement('div');
    item.className = 'secret-item';
    const title = document.createElement('strong');
    title.textContent = `${role.number} 號｜${role.name}`;
    const p = document.createElement('p');
    p.textContent = result.character_secrets?.[role.id] || '無額外秘密。';
    item.append(title, p);
    secretList.appendChild(item);
  });
}

function render() {
  if (!gameState) return;
  $('setupPanel').hidden = true;
  $('gamePanel').hidden = false;
  $('resetBtn').hidden = false;
  updateStageNav(gameState.stage);
  $('introPanel').hidden = gameState.stage !== 'opening';
  $('investigationPanel').hidden = gameState.stage !== 'investigation';
  $('finalPanel').hidden = !['final_statements', 'voting', 'reveal'].includes(gameState.stage);
  $('votePanel').hidden = gameState.stage !== 'voting';
  $('revealPanel').hidden = gameState.stage !== 'reveal';
  renderSuspects();
  renderPublicLog();
  renderUsage();
  renderClues();
  renderTurnOrder();
  renderFinalStatements();
  if (gameState.stage === 'voting') renderVoteChoices();
  if (gameState.stage === 'reveal') renderReveal();
  saveState();
}

function newGame() {
  selectedVote = null;
  gameState = {
    case_id: 'case_001',
    mode: 'github_demo',
    stage: 'opening',
    round_number: 1,
    turn_index: 0,
    turn_order: caseData.stages.rules.turn_order,
    completed_askers: [],
    askers_by_target: Object.fromEntries(caseData.roles.map(role => [role.id, []])),
    public_log: [],
    public_clues: [],
    mid_clues_revealed: false,
    answer_counts: Object.fromEntries(caseData.roles.map(role => [role.id, 0])),
    final_statements: {},
    result: null,
    usage: { game_tokens: 0, game_api_calls: 0 }
  };
  addLog('旁白', null, '案件開始。請先閱讀案件背景及角色自我介紹。', 'system');
  renderIntros();
  render();
  showToast('案件已建立。這是 GitHub Pages 模擬版，不會消耗 API Token。');
}

function startInvestigation() {
  if (!gameState || gameState.stage !== 'opening') return;
  gameState.stage = 'investigation';
  caseData.clues.opening_clues.forEach(clue => {
    gameState.public_clues.push(clue);
    addLog('系統公開線索', null, `${clue.title}：${clue.content}`, 'clue');
  });
  render();
}

function chooseTarget(asker) {
  const eligible = caseData.roles.filter(role =>
    role.id !== asker.id && (gameState.askers_by_target[role.id] || []).length < 2
  );
  if (!eligible.length) return null;
  const priority = asker.suspect_priority || [];
  const rank = id => {
    const idx = priority.indexOf(id);
    return idx < 0 ? 999 : idx;
  };
  // Prefer targets with fewer distinct questioners; use the asker's role priorities to break ties.
  eligible.sort((a, b) => {
    const loadDiff = gameState.askers_by_target[a.id].length - gameState.askers_by_target[b.id].length;
    return loadDiff || rank(a.id) - rank(b.id) || a.number - b.number;
  });
  return eligible[0];
}

function nextFollowup(previousAnswer, round) {
  if (round === 1) return `你剛才提到「${previousAnswer.slice(0, 34)}」，可以再說明當時的具體時間，以及是否有人能證明嗎？`;
  return '你的說法和目前公開的線索似乎有些落差。你能針對這個時間點再解釋一次嗎？';
}

function runTurn() {
  if (!gameState || gameState.stage !== 'investigation' || busy) return;
  const askerId = gameState.turn_order[gameState.turn_index];
  const asker = roleById(askerId);
  const target = chooseTarget(asker);
  if (!target) {
    showToast('目前沒有符合詢問限制的對象，請檢查劇本角色及詢問上限。');
    return;
  }
  setBusy(true, `${asker.name} 正在公開詢問 ${target.name}……`);
  $('runTurnBtn').disabled = true;

  // A short pause makes the scripted demo feel like a turn-based game.
  window.setTimeout(() => {
    const askerIdLocal = asker.id;
    gameState.askers_by_target[target.id].push(askerIdLocal);
    const exchanges = [];
    let question = INITIAL_QUESTIONS[asker.id] || `請你說明案發當晚的行動，以及你與死者之間的關係。`;

    for (let i = 0; i < 3; i++) {
      addLog(`${asker.number}號 ${asker.name}`, asker.id, question, 'question');
      const answers = target.mock_answers || ['我已經說明自己的情況，沒有其他補充。'];
      const count = gameState.answer_counts[target.id] || 0;
      const answer = answers[count % answers.length];
      gameState.answer_counts[target.id] = count + 1;
      addLog(`${target.number}號 ${target.name}`, target.id, answer, 'answer');
      exchanges.push({ question, answer });
      question = nextFollowup(answer, i);
    }

    gameState.completed_askers.push(asker.id);
    gameState.turn_index += 1;

    if (gameState.turn_index === 2 && !gameState.mid_clues_revealed) {
      caseData.clues.mid_round_clues.forEach(clue => {
        gameState.public_clues.push(clue);
        addLog('系統公開線索', null, `${clue.title}：${clue.content}`, 'clue');
      });
      gameState.mid_clues_revealed = true;
    }

    if (gameState.turn_index >= gameState.turn_order.length) {
      gameState.stage = 'final_statements';
      showToast('所有角色已完成公開詢問，接下來進入最終陳述。');
    } else {
      showToast(`${asker.name} 已完成對 ${target.name} 的公開詢問。`);
    }

    const box = $('turnResult');
    box.hidden = false;
    box.replaceChildren();
    const title = document.createElement('div');
    title.className = 'result-title';
    title.textContent = `${asker.number} 號 ${asker.name} 詢問 ${target.number} 號 ${target.name}`;
    box.appendChild(title);
    exchanges.forEach((ex, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'exchange';
      const q = document.createElement('div');
      q.className = 'speech question';
      const ql = document.createElement('div');
      ql.className = 'speech-label';
      ql.textContent = `第 ${i + 1} 問｜${asker.name}`;
      const qt = document.createElement('div');
      qt.textContent = ex.question;
      q.append(ql, qt);
      const a = document.createElement('div');
      a.className = 'speech answer';
      const al = document.createElement('div');
      al.className = 'speech-label';
      al.textContent = `回答｜${target.name}`;
      const at = document.createElement('div');
      at.textContent = ex.answer;
      a.append(al, at);
      wrap.append(q, a);
      box.appendChild(wrap);
    });
    setBusy(false);
    render();
  }, 350);
}

function generateFinals() {
  if (!gameState || gameState.stage !== 'final_statements') return;
  setBusy(true, '正在整理角色最後陳述……');
  window.setTimeout(() => {
    caseData.roles.forEach(role => {
      const statement = FINAL_STATEMENTS[role.id] || '我已經說明自己的立場，請根據所有證據判斷。';
      gameState.final_statements[role.id] = statement;
      addLog(`${role.number}號 ${role.name}（最終陳述）`, role.id, statement, 'final');
    });
    gameState.stage = 'voting';
    setBusy(false);
    render();
    showToast('最終陳述完成，現在由你決定兇手。');
  }, 350);
}

function vote() {
  if (!gameState || gameState.stage !== 'voting' || !selectedVote) return;
  const truth = caseData.truth;
  const votedRole = roleById(selectedVote);
  gameState.result = {
    correct: selectedVote === truth.culprit_id,
    voted_name: votedRole.name,
    culprit_id: truth.culprit_id,
    culprit_name: truth.culprit_name,
    motive: truth.motive,
    method_summary: truth.method_summary,
    timeline: truth.timeline,
    explanation: truth.explanation,
    character_secrets: truth.character_secrets
  };
  gameState.stage = 'reveal';
  addLog('系統', null, `玩家投票：${votedRole.name}。案件真相已揭曉。`, 'result');
  render();
  showToast('投票完成，案件已結束。');
}

function resetGame() {
  gameState = null;
  selectedVote = null;
  saveState();
  $('setupPanel').hidden = false;
  $('gamePanel').hidden = true;
  $('resetBtn').hidden = true;
  $('turnResult').hidden = true;
  $('turnResult').replaceChildren();
  showToast('已清除目前案件，可以重新開始。');
}

async function boot() {
  try {
    const response = await fetch('./data/case_001.json');
    if (!response.ok) throw new Error(`無法讀取劇本資料（HTTP ${response.status}）`);
    caseData = await response.json();
    loadSavedState();
    if (gameState) {
      renderIntros();
      render();
      showToast('已從此瀏覽器還原上次的遊戲進度。');
    }
  } catch (error) {
    showToast(`${error.message}。請確認已透過 GitHub Pages 或本機 HTTP 伺服器開啟，不要直接雙擊 HTML。`, 9000);
    $('newGameBtn').disabled = true;
  }
}

$('newGameBtn').addEventListener('click', newGame);
$('startInvestigationBtn').addEventListener('click', startInvestigation);
$('runTurnBtn').addEventListener('click', runTurn);
$('finalizeBtn').addEventListener('click', generateFinals);
$('generateFinalBtn').addEventListener('click', generateFinals);
$('submitVoteBtn').addEventListener('click', vote);
$('resetBtn').addEventListener('click', resetGame);
$('playAgainBtn').addEventListener('click', resetGame);

boot();
