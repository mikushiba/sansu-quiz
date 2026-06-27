/* =========================================================================
   共有：進捗エンジン（けいさんカード図鑑・称号・メダル）— 算数クイズ全アプリ共通
   ・漢字クイズの shared/quiz-core.js を 算数むけに 作りかえたもの。
   ・localStorage キー 'sansuQuiz.v1' を 算数クイズ全アプリで共有（オリジン単位）。
     同じ store スキーマ・同じ STAGES/MEDALS を使うので、たし算・ひき算など
     複数アプリの進捗が自動で合算される（図鑑・称号・メダル）。
   ・図鑑（COLLECTIBLE）＝ 1〜9どうしの たし算カード（交かんは同じ＝45まい）。
     正かいで図鑑入り→3回で ★マスター。ひき算などを足すときは ここを ひろげる。
   ・store の既存フィールドは破壊せず保持（full load → 一部更新 → full save）。
   使い方:  SansuCore.recordFact(7,8); SansuCore.bumpCorrect(); SansuCore.save();
            SansuCore.checkMedals(); SansuCore.renderBuddy({...}); 等
   ========================================================================= */
(function (global) {
  const STORE_KEY = 'sansuQuiz.v1';

  let store = {};
  function load() {
    try { store = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { store = {}; }
    store.facts        = store.facts        || {};   // { 'a+b': 正解回数 }（a<=b に正規化）
    store.medals       = store.medals       || {};   // { メダルID: true }
    store.bestCombo    = store.bestCombo    || 0;
    store.plays        = store.plays        || 0;
    store.perfect      = store.perfect      || false;
    store.perfectCount = store.perfectCount || 0;
    store.totalCorrect = store.totalCorrect || 0;
    store.comebacks    = store.comebacks    || 0;
    store.dailyTotal   = store.dailyTotal   || 0;
    store.appCorrect   = store.appCorrect   || {};   // { アプリID: 正解数 } 上級クイズ解放用
    return store;
  }
  load();
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {} }

  /* ── 図鑑（集められる たし算カード＝1〜9どうし・交かんは同じ＝45まい） ── */
  const COLLECTIBLE = [];                                  // ['1+1','1+2',...] 文字列キー
  for (let a = 1; a <= 9; a++) for (let b = a; b <= 9; b++) COLLECTIBLE.push(a + '+' + b);
  COLLECTIBLE.sort((x, y) => {
    const [ax, bx] = x.split('+').map(Number), [ay, by] = y.split('+').map(Number);
    return (ax + bx) - (ay + by) || ax - ay;              // 答えの小さい順→aの小さい順
  });
  function factKey(a, b) { a = +a; b = +b; return (a <= b ? a + '+' + b : b + '+' + a); }
  const dexCount    = () => COLLECTIBLE.filter(k => (store.facts[k] || 0) >= 1).length;
  const masterCount = () => COLLECTIBLE.filter(k => (store.facts[k] || 0) >= 3).length;

  /* ── 記録 ── */
  function recordFact(a, b) {               // 正かいした たし算を 図鑑に（1回で図鑑入り→3回で★）
    const k = factKey(a, b);
    if (COLLECTIBLE.indexOf(k) >= 0) store.facts[k] = (store.facts[k] || 0) + 1;
  }
  function bumpCorrect(n = 1)  { store.totalCorrect = (store.totalCorrect || 0) + n; }
  function noteComeback(n = 1) { store.comebacks    = (store.comebacks || 0) + n; }
  function noteCombo(c)        { if (c > (store.bestCombo || 0)) store.bestCombo = c; }
  function notePlay()          { store.plays = (store.plays || 0) + 1; }
  function notePerfect()       { store.perfect = true; store.perfectCount = (store.perfectCount || 0) + 1; }
  function noteDaily()         { store.dailyTotal = (store.dailyTotal || 0) + 1; }

  /* ── 上級クイズの解放用（将来：ひき算・ミックス等を 足すとき用の土台） ── */
  function bumpApp(id, n = 1) { store.appCorrect[id] = (store.appCorrect[id] || 0) + n; }
  function appCorrect(id) { return store.appCorrect[id] || 0; }

  /* ── メダル（算数むけ。store 共有なので 全アプリ合算） ── */
  const DEX_ALL = COLLECTIBLE.length;   // 45
  const MEDALS = [
    // ── あそぶ（プレイ回数）──
    {id:'firstClear', icon:'🎫', name:'はじめの一歩',  desc:'1かい あそんだ',    test:()=> store.plays>=1},
    {id:'play5',      icon:'🎮', name:'5かい あそんだ', desc:'5かい あそんだ',    test:()=> store.plays>=5},
    {id:'play10',     icon:'🎯', name:'10かい あそんだ',desc:'10かい あそんだ',   test:()=> store.plays>=10},
    {id:'play20',     icon:'🕹️', name:'20かい あそんだ',desc:'20かい あそんだ',   test:()=> store.plays>=20},
    {id:'play30',     icon:'🎲', name:'30かい あそんだ',desc:'30かい あそんだ',   test:()=> store.plays>=30},
    {id:'play40',     icon:'🎰', name:'40かい あそんだ',desc:'40かい あそんだ',   test:()=> store.plays>=40},
    {id:'play50',     icon:'🏅', name:'50かい あそんだ',desc:'50かい あそんだ',   test:()=> store.plays>=50},
    {id:'play75',     icon:'🎖️', name:'75かい あそんだ',desc:'75かい あそんだ',   test:()=> store.plays>=75},
    {id:'play100',    icon:'💎', name:'100かい あそんだ',desc:'100かい あそんだ', test:()=> store.plays>=100},
    {id:'play150',    icon:'🏆', name:'150かい あそんだ',desc:'150かい あそんだ', test:()=> store.plays>=150},
    {id:'play200',    icon:'👑', name:'200かい あそんだ',desc:'200かい あそんだ', test:()=> store.plays>=200},
    {id:'play300',    icon:'🌌', name:'300かい あそんだ',desc:'300かい あそんだ', test:()=> store.plays>=300},
    {id:'play500',    icon:'🦄', name:'500かい あそんだ',desc:'500かい あそんだ', test:()=> store.plays>=500},
    // ── ぜんもん正かい ──
    {id:'perfect',    icon:'💯', name:'ぜんもん せいかい', desc:'1かいで ぜんぶ正かい',  test:()=> store.perfect},
    {id:'perfect3',   icon:'🥉', name:'全問正かい 3かい', desc:'ぜんもん正かいを 3かい', test:()=> store.perfectCount>=3},
    {id:'perfect5',   icon:'🥈', name:'全問正かい 5かい', desc:'ぜんもん正かいを 5かい', test:()=> store.perfectCount>=5},
    {id:'perfect10',  icon:'🥇', name:'全問正かい 10かい',desc:'ぜんもん正かいを 10かい',test:()=> store.perfectCount>=10},
    {id:'perfect15',  icon:'🎗️', name:'全問正かい 15かい',desc:'ぜんもん正かいを 15かい',test:()=> store.perfectCount>=15},
    {id:'perfect20',  icon:'🏆', name:'全問正かい 20かい',desc:'ぜんもん正かいを 20かい',test:()=> store.perfectCount>=20},
    {id:'perfect30',  icon:'👑', name:'全問正かい 30かい',desc:'ぜんもん正かいを 30かい',test:()=> store.perfectCount>=30},
    {id:'perfect50',  icon:'🎉', name:'全問正かい 50かい',desc:'ぜんもん正かいを 50かい',test:()=> store.perfectCount>=50},
    // ── 累計せいかい数 ──
    {id:'correct50',  icon:'✏️', name:'50もん 正かい',  desc:'ぜんぶで 50もん正かい',  test:()=> store.totalCorrect>=50},
    {id:'correct100', icon:'📘', name:'100もん 正かい', desc:'ぜんぶで 100もん正かい', test:()=> store.totalCorrect>=100},
    {id:'correct200', icon:'📗', name:'200もん 正かい', desc:'ぜんぶで 200もん正かい', test:()=> store.totalCorrect>=200},
    {id:'correct300', icon:'📙', name:'300もん 正かい', desc:'ぜんぶで 300もん正かい', test:()=> store.totalCorrect>=300},
    {id:'correct500', icon:'📕', name:'500もん 正かい', desc:'ぜんぶで 500もん正かい', test:()=> store.totalCorrect>=500},
    {id:'correct750', icon:'📚', name:'750もん 正かい', desc:'ぜんぶで 750もん正かい', test:()=> store.totalCorrect>=750},
    {id:'correct1000',icon:'📜', name:'1000もん 正かい',desc:'ぜんぶで 1000もん正かい',test:()=> store.totalCorrect>=1000},
    {id:'correct2000',icon:'🧾', name:'2000もん 正かい',desc:'ぜんぶで 2000もん正かい',test:()=> store.totalCorrect>=2000},
    {id:'correct3000',icon:'📰', name:'3000もん 正かい',desc:'ぜんぶで 3000もん正かい',test:()=> store.totalCorrect>=3000},
    {id:'correct5000',icon:'📊', name:'5000もん 正かい',desc:'ぜんぶで 5000もん正かい',test:()=> store.totalCorrect>=5000},
    // ── コンボ ──
    {id:'firstCombo', icon:'✌️', name:'はじめての コンボ', desc:'2れんぞく 正かい',  test:()=> store.bestCombo>=2},
    {id:'combo3',     icon:'🔥', name:'コンボ 3',  desc:'3れんぞく 正かい',  test:()=> store.bestCombo>=3},
    {id:'combo5',     icon:'🌶️', name:'コンボ 5',  desc:'5れんぞく 正かい',  test:()=> store.bestCombo>=5},
    {id:'combo7',     icon:'💥', name:'コンボ 7',  desc:'7れんぞく 正かい',  test:()=> store.bestCombo>=7},
    {id:'combo10',    icon:'⚡', name:'コンボ 10', desc:'10れんぞく 正かい', test:()=> store.bestCombo>=10},
    {id:'combo15',    icon:'☄️', name:'コンボ 15', desc:'15れんぞく 正かい', test:()=> store.bestCombo>=15},
    {id:'combo20',    icon:'🌈', name:'コンボ 20', desc:'20れんぞく 正かい', test:()=> store.bestCombo>=20},
    {id:'combo25',    icon:'🎆', name:'コンボ 25', desc:'25れんぞく 正かい', test:()=> store.bestCombo>=25},
    {id:'combo30',    icon:'💪', name:'コンボ 30', desc:'30れんぞく 正かい', test:()=> store.bestCombo>=30},
    {id:'combo40',    icon:'🐉', name:'コンボ 40', desc:'40れんぞく 正かい', test:()=> store.bestCombo>=40},
    {id:'combo50',    icon:'🦅', name:'コンボ 50', desc:'50れんぞく 正かい', test:()=> store.bestCombo>=50},
    // ── まちがい なおし ──
    {id:'comeback5',  icon:'🩹', name:'なおし はじめ', desc:'まちがいを 5もん なおした',  test:()=> store.comebacks>=5},
    {id:'comeback10', icon:'🔁', name:'まちがい なおし', desc:'まちがいを 10もん なおした', test:()=> store.comebacks>=10},
    {id:'comeback25', icon:'🔧', name:'なおし名人',     desc:'まちがいを 25もん なおした', test:()=> store.comebacks>=25},
    {id:'comeback50', icon:'🛠️', name:'なおし達人',     desc:'まちがいを 50もん なおした', test:()=> store.comebacks>=50},
    {id:'comeback100',icon:'🏗️', name:'なおし王',       desc:'まちがいを 100もん なおした',test:()=> store.comebacks>=100},
    // ── けいさんカードずかん ──
    {id:'firstDex',   icon:'📄', name:'ずかん はじめ', desc:'カードを 1まい', test:()=> dexCount()>=1},
    {id:'dex5',       icon:'📃', name:'ずかん 5まい',  desc:'カードを 5まい',  test:()=> dexCount()>=5},
    {id:'dex10',      icon:'📗', name:'ずかん 10まい', desc:'カードを 10まい', test:()=> dexCount()>=10},
    {id:'dex15',      icon:'🧧', name:'ずかん 15まい', desc:'カードを 15まい', test:()=> dexCount()>=15},
    {id:'dex20',      icon:'📒', name:'ずかん 20まい', desc:'カードを 20まい', test:()=> dexCount()>=20},
    {id:'dex25',      icon:'📙', name:'ずかん 25まい', desc:'カードを 25まい', test:()=> dexCount()>=25},
    {id:'dex30',      icon:'📚', name:'ずかん 30まい', desc:'カードを 30まい', test:()=> dexCount()>=30},
    {id:'dex35',      icon:'📔', name:'ずかん 35まい', desc:'カードを 35まい', test:()=> dexCount()>=35},
    {id:'dex40',      icon:'📓', name:'ずかん 40まい', desc:'カードを 40まい', test:()=> dexCount()>=40},
    {id:'dexAll',     icon:'👑', name:'ずかん コンプリート', desc:'カードを ぜんぶ（'+DEX_ALL+'まい）', test:()=> dexCount()>=DEX_ALL},
    // ── マスター（★／3回正かい）──
    {id:'firstStar',  icon:'⭐', name:'はじめての ★',  desc:'★を 1まい',  test:()=> masterCount()>=1},
    {id:'master5',    icon:'✴️', name:'マスター 5まい', desc:'★を 5まい',  test:()=> masterCount()>=5},
    {id:'master10',   icon:'🌟', name:'マスター 10まい',desc:'★を 10まい', test:()=> masterCount()>=10},
    {id:'master15',   icon:'✨', name:'マスター 15まい',desc:'★を 15まい', test:()=> masterCount()>=15},
    {id:'master20',   icon:'💫', name:'マスター 20まい',desc:'★を 20まい', test:()=> masterCount()>=20},
    {id:'master30',   icon:'🌠', name:'マスター 30まい',desc:'★を 30まい', test:()=> masterCount()>=30},
    {id:'master40',   icon:'🪐', name:'マスター 40まい',desc:'★を 40まい', test:()=> masterCount()>=40},
    {id:'masterAll',  icon:'🏵️', name:'ぜんぶ マスター', desc:'ぜんぶ ★に（'+DEX_ALL+'まい）', test:()=> masterCount()>=DEX_ALL},
    {id:'grandMaster',icon:'🏆', name:'グランドマスター', desc:'図かん＆★を ぜんぶ', test:()=> dexCount()>=DEX_ALL && masterCount()>=DEX_ALL},
    // ── デイリー（連続日数）──
    {id:'daily2',     icon:'🌱', name:'2日 れんぞく',  desc:'チャレンジ 2日れんぞく',  test:()=> (store.daily?.bestStreak||0)>=2},
    {id:'daily3',     icon:'📅', name:'3日 れんぞく',  desc:'チャレンジ 3日れんぞく',  test:()=> (store.daily?.bestStreak||0)>=3},
    {id:'daily5',     icon:'🗓️', name:'5日 れんぞく',  desc:'チャレンジ 5日れんぞく',  test:()=> (store.daily?.bestStreak||0)>=5},
    {id:'daily7',     icon:'📆', name:'7日 れんぞく',  desc:'チャレンジ 7日れんぞく',  test:()=> (store.daily?.bestStreak||0)>=7},
    {id:'daily10',    icon:'🎍', name:'10日 れんぞく', desc:'チャレンジ 10日れんぞく', test:()=> (store.daily?.bestStreak||0)>=10},
    {id:'daily14',    icon:'🎋', name:'14日 れんぞく', desc:'チャレンジ 14日れんぞく', test:()=> (store.daily?.bestStreak||0)>=14},
    {id:'daily21',    icon:'🎏', name:'21日 れんぞく', desc:'チャレンジ 21日れんぞく', test:()=> (store.daily?.bestStreak||0)>=21},
    {id:'daily30',    icon:'🏮', name:'30日 れんぞく', desc:'チャレンジ 30日れんぞく', test:()=> (store.daily?.bestStreak||0)>=30},
    {id:'daily50',    icon:'🎐', name:'50日 れんぞく', desc:'チャレンジ 50日れんぞく', test:()=> (store.daily?.bestStreak||0)>=50},
    {id:'daily100',   icon:'🎇', name:'100日 れんぞく',desc:'チャレンジ 100日れんぞく',test:()=> (store.daily?.bestStreak||0)>=100},
    // ── デイリー（のべ回数）──
    {id:'dailyT1',    icon:'🔔', name:'デイリー はじめ', desc:'デイリーを 1かい',   test:()=> store.dailyTotal>=1},
    {id:'dailyT5',    icon:'🪧', name:'デイリー 5かい',  desc:'デイリーを 5かい',   test:()=> store.dailyTotal>=5},
    {id:'dailyT10',   icon:'📌', name:'デイリー 10かい', desc:'デイリーを 10かい',  test:()=> store.dailyTotal>=10},
    {id:'dailyT30',   icon:'📍', name:'デイリー 30かい', desc:'デイリーを 30かい',  test:()=> store.dailyTotal>=30},
    {id:'dailyT50',   icon:'🧭', name:'デイリー 50かい', desc:'デイリーを 50かい',  test:()=> store.dailyTotal>=50},
    {id:'dailyT100',  icon:'🗺️', name:'デイリー 100かい',desc:'デイリーを 100かい', test:()=> store.dailyTotal>=100},
  ];
  function checkMedals() {
    const newly = [];
    MEDALS.forEach(m => {
      try { if (!store.medals[m.id] && m.test()) { store.medals[m.id] = true; newly.push(m); } }
      catch (e) {}
    });
    if (newly.length) save();
    return newly;
  }

  /* ── 称号（あいぼう／累計正解数で育つ） ── */
  const STAGES = [
    {need:0,     icon:'🥚',   title:'けいさん みならい'},
    {need:30,    icon:'🐣',   title:'けいさん かけだし'},
    {need:80,    icon:'🐥',   title:'けいさん がんばりや'},
    {need:150,   icon:'🐦',   title:'けいさん じょうず'},
    {need:300,   icon:'🦜',   title:'けいさん ものしり'},
    {need:500,   icon:'🦉',   title:'けいさん はかせ'},
    {need:800,   icon:'🦅',   title:'けいさん せんせい'},
    {need:1200,  icon:'🐺',   title:'けいさん 名人'},
    {need:1800,  icon:'🦁',   title:'けいさん 達人'},
    {need:2600,  icon:'🐲',   title:'けいさん マスター'},
    {need:3800,  icon:'🐉',   title:'けいさん グランドマスター'},
    {need:5500,  icon:'👑',   title:'けいさん キング'},
    {need:8000,  icon:'🌟',   title:'けいさん チャンピオン'},
    {need:11500, icon:'☄️',   title:'けいさん レジェンド'},
    {need:16000, icon:'🧙',   title:'けいさん 仙人'},
    {need:22000, icon:'🐉✨', title:'けいさんの 神さま'},
    {need:30000, icon:'🌌',   title:'けいさん うちゅういち'},
  ];
  function rankStage(n) { let s = 0; STAGES.forEach((e, i) => { if (n >= e.need) s = i; }); return s; }

  /* ── 描画ヘルパー（共有CSSの .dcard / .medal / .buddy を使う） ── */
  function renderBuddy(els) {   // els = {icon,name,coin,bar,next}（DOM要素）
    const tc = store.totalCorrect || 0, s = rankStage(tc), cur = STAGES[s], nxt = STAGES[s + 1];
    if (els.icon) els.icon.textContent = cur.icon;
    if (els.name) els.name.textContent = cur.title;
    if (els.coin) els.coin.textContent = `これまで せいかい ${tc}問`;
    if (nxt) {
      const span = nxt.need - cur.need;
      const prog = Math.max(0, Math.min(100, Math.floor((tc - cur.need) / span * 100)));
      if (els.bar)  els.bar.style.width = prog + '%';
      if (els.next) els.next.textContent = `あと ${nxt.need - tc}問 正解で「${nxt.title}」`;
    } else {
      if (els.bar)  els.bar.style.width = '100%';
      if (els.next) els.next.textContent = 'さいこうの 称号に なった！🎉';
    }
  }
  function dexHead() { return `${dexCount()} / ${COLLECTIBLE.length} まい（★${masterCount()}）`; }
  function dexGridHTML() {
    return COLLECTIBLE.map(k => {
      const c = store.facts[k] || 0;
      const [a, b] = k.split('+').map(Number);
      if (c >= 1) {
        const master = c >= 3;
        return `<div class="dcard${master ? ' master' : ''}"><div class="k">${a}+${b}</div>`
          + `<div class="star">${master ? '★' : '☆'}</div>`
          + `<div class="info">＝ ${a + b}</div></div>`;
      }
      return `<div class="dcard locked"><div class="k">？</div><div class="info">あつめよう</div></div>`;
    }).join('');
  }
  function medalsHead() { return `${MEDALS.filter(m => store.medals[m.id]).length} / ${MEDALS.length}`; }
  function medalsGridHTML() {
    return MEDALS.map(m => {
      const has = !!store.medals[m.id];
      return `<div class="medal${has ? '' : ' locked'}"><div class="mi">${has ? m.icon : '🔒'}</div>`
        + `<div class="mn">${m.name}</div><div class="md">${m.desc}</div></div>`;
    }).join('');
  }

  /* ── セーブ／読み込み（共有 store 全体＝算数クイズ全アプリの進捗をまとめて入出力） ── */
  function exportSave(filename) {
    const blob = new Blob([JSON.stringify(store)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'さんすうクイズ-きろく.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function importSave(file, onOk) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const obj = JSON.parse(r.result);
        if (!obj || typeof obj !== 'object' || !obj.facts) throw 0;
        if (!confirm('いまの きろくを、よみこんだ きろくに 入れかえます。よろしいですか？')) return;
        localStorage.setItem(STORE_KEY, JSON.stringify(obj));
        if (onOk) onOk(); else location.reload();
      } catch (e) { alert('この ファイルは よみこめませんでした。'); }
    };
    r.readAsText(file);
  }

  /* ── 出題数セレクタ（全アプリ共通）─ 値は文字列 '10'/'20'/'50'/'all' ── */
  const COUNT_OPTIONS = [
    { v: '10',  label: '10もん' },
    { v: '20',  label: '20もん' },
    { v: '50',  label: '50もん' },
    { v: 'all', label: 'ぜんぶ' },
  ];
  function renderCountSeg(segEl, current, onPick) {
    if (!segEl) return;
    segEl.innerHTML = '';
    COUNT_OPTIONS.forEach(o => {
      const b = document.createElement('button');
      b.dataset.count = o.v; b.textContent = o.label;
      if (String(current) === o.v) b.classList.add('active');
      b.onclick = () => {
        segEl.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        if (onPick) onPick(o.v);
      };
      segEl.appendChild(b);
    });
  }

  global.SansuCore = {
    get store() { return store; }, reload: load, save,
    COLLECTIBLE, factKey, dexCount, masterCount,
    recordFact, bumpCorrect, noteComeback, noteCombo, notePlay, notePerfect, noteDaily,
    MEDALS, checkMedals, STAGES, rankStage,
    renderBuddy, dexHead, dexGridHTML, medalsHead, medalsGridHTML,
    exportSave, importSave,
    COUNT_OPTIONS, renderCountSeg,
    bumpApp, appCorrect,
  };
})(window);
