(function () {
  'use strict';
  const api = window.Meihua;
  const root = document.getElementById('app');
  const historyKey = 'meihua-android-history-v1';
  const currentKey = 'meihua-android-current-v1';
  const drafts = {};
  const titles = { home: '古法梅花排盘', two: '两数起卦', three: '三数起卦', hanzi: '汉字起卦', random: '随机起卦', result: '卦象结果', history: '历史记录', about: '关于与隐私' };
  let current = read(currentKey, null);
  let resultParent = 'home';
  let toastTimer;
  let randomTimer;
  let route = 'home';

  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }
  function read(key, fallback) {
    try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch (error) { return fallback; }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function records() {
    const value = read(historyKey, []);
    return Array.isArray(value) ? value.filter(item => item && item.id && item.original && item.changed && item.mutual && item.body && item.use && item.relation && Array.isArray(item.original.lines)) : [];
  }
  function toast(message) {
    const element = document.getElementById('toast');
    element.textContent = message;
    element.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('visible'), 3000);
  }
  window.onNativeResult = toast;
  function navigate(next) {
    if (location.hash === '#' + next) render();
    else location.hash = next;
  }
  window.appBack = function () {
    if (route === 'home') return false;
    navigate(route === 'result' ? resultParent : 'home');
    return true;
  };
  document.getElementById('back').addEventListener('click', window.appBack);
  document.getElementById('about').addEventListener('click', () => navigate('about'));
  window.addEventListener('hashchange', render);
  function getDraft(mode) {
    if (!drafts[mode]) drafts[mode] = { numbers: ['', '', ''], question: '', original: '', traditional: '', analysed: null, ready: false, rolling: false };
    return drafts[mode];
  }
  function heading(eyebrow, title, subtitle) {
    return '<section class="hero"><p class="eyebrow">' + eyebrow + '</p><h1>' + title + '</h1><p class="subtitle">' + subtitle + '</p></section>';
  }
  function question(draft) {
    return '<div class="question-block"><label for="question">所问之事<small>选填 · 仅保存在本机</small></label><input id="question" data-field="question" maxlength="50" value="' + escape(draft.question) + '" placeholder="一事一问，心诚则明"></div>';
  }
  function home() {
    const methods = [['two', '数', '两数起卦', '心中报数，以数取象'], ['three', '参', '三数起卦', '前两数取卦，第三数定动爻'], ['hanzi', '字', '汉字起卦', '心念成字，依笔画取卦'], ['random', '机', '随机起卦', '静心一念，随机取数']];
    return '<section class="hero"><img class="hero-icon" src="icon.png" alt="黑金太极"><p class="eyebrow">观物 · 取象 · 明变</p><h1>古法梅花排盘</h1><p class="subtitle">心有所感，数有所应</p></section>' + methods.map(method => '<button class="method card" data-route="' + method[0] + '"><span class="seal">' + method[1] + '</span><span><strong>' + method[2] + '</strong><small>' + method[3] + '</small></span><span class="arrow">›</span></button>').join('') + '<button class="quiet" data-route="history">查看历史记录 →</button><p class="notice">离线使用 · 无需登录<br>传统文化学习与娱乐参考，请理性看待结果</p>';
  }
  function numbers(mode) {
    const draft = getDraft(mode);
    const isThree = mode === 'three';
    const isRandom = mode === 'random';
    const labels = isThree ? ['上卦数', '下卦数', '动爻数'] : ['上卦数', '下卦数'];
    const subtitle = isThree ? '前两数取卦，第三数取动爻' : isRandom ? '静心片刻，抽取两个数字' : '请静心输入两个 1 至 99 的数字';
    const rule = isThree ? '三个数字均保持原顺序；前两数依次取上下卦，第三数取动爻。' : '两个一位数从小到大排列；只要有一个是两位数，就保持输入顺序。两数之和取动爻。';
    return heading(isRandom ? '随感而应' : '心有所念', titles[mode], subtitle) + '<form id="cast-form" novalidate><div class="number-row">' + labels.map((label, index) => '<div class="number-field"><label for="number-' + index + '">' + label + '</label>' + (isRandom ? '<output class="random-number" id="number-' + index + '">' + escape(draft.numbers[index] || '—') + '</output>' : '<input id="number-' + index + '" data-number="' + index + '" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" aria-label="' + label + '，1至99" value="' + escape(draft.numbers[index]) + '" placeholder="—">') + '</div>').join('') + '</div>' + (isRandom ? '<button type="button" class="secondary center-button" data-action="random">' + (draft.ready ? '重新抽取' : '抽取数字') + '</button>' : '') + question(draft) + '<div class="rule card"><strong>计算方式</strong>' + rule + '<br>除以 8 余数为 0 取坤，除以 6 余数为 0 取上爻。</div><button class="primary center-button" id="cast-submit" type="submit"' + (isRandom && !draft.ready ? ' disabled' : '') + '>排定卦象</button></form>';
  }
  function hanzi() {
    const draft = getDraft('hanzi');
    const result = draft.analysed;
    return heading('以字取象', '汉字起卦', '输入两个汉字，按繁体字笔画计算') + '<form id="hanzi-form" novalidate><section class="entry card"><label for="original" class="entry-label">输入两个汉字</label><input id="original" class="hanzi-input" data-field="original" type="text" autocomplete="off" value="' + escape(draft.original) + '" placeholder="—　—"><p class="entry-hint">输入此刻心中想到的两个汉字</p><button type="button" class="secondary center-button" data-action="convert">转换并核对</button></section><section id="conversion" class="conversion card"' + (!draft.traditional ? ' hidden' : '') + '><div class="conversion-head">繁体字结果<small>可修改繁体字，再重新核对笔画</small></div><input class="hanzi-input" aria-label="核对繁体字" data-field="traditional" type="text" value="' + escape(draft.traditional) + '"><div id="stroke-values" class="strokes">' + (result ? Array.from(result.traditional).map((character, index) => '<div>' + escape(character) + '<span>' + result.strokes[index] + '画</span></div>').join('') : '请重新计算笔画') + '</div><button type="button" class="quiet" data-action="recount">重新计算笔画</button></section>' + question(draft) + '<div class="rule card"><strong>计算方式</strong>第一个字笔画取上卦，第二个字笔画取下卦；两字笔画之和取动爻。繁体字及笔画请核对后使用。</div><button class="primary center-button" type="submit" id="hanzi-submit"' + (!result ? ' disabled' : '') + '>排定卦象</button></form>';
  }
  function hexLines(hexagram, moving) {
    return '<div class="lines" role="img" aria-label="' + escape(hexagram.name + (moving ? '，' + hexagram.yaoLabel + '动' : '')) + '">' + hexagram.displayLines.map(line => '<div class="line-row' + (line.yang ? '' : ' yin') + (moving && line.moving ? ' moving' : '') + '"><i></i>' + (line.yang ? '' : '<i></i>') + '</div>').join('') + '</div>';
  }
  function smallHex(label, hexagram) {
    return '<details class="small-hex card"><summary><span class="small-type">' + label + '</span><strong>' + escape(hexagram.name) + '</strong>' + hexLines(hexagram, false) + '<span class="expand-tip">展开 / 收起卦辞</span></summary><p>' + escape(hexagram.guaCi) + '</p></details>';
  }
  function resultPage() {
    if (!current || !current.original || !current.changed) return '<div class="empty">暂时没有卦象<button class="primary center-button" data-route="home">返回首页</button></div>';
    const saved = records().some(item => item.id === current.id);
    return '<div class="meta"><span>' + escape(current.createdAtText) + '</span><span>' + escape(current.method) + '</span></div>' + (current.question ? '<div class="question-card card"><span>问</span>' + escape(current.question) + '</div>' : '') + '<section class="main-hex card"><p class="hex-type">本 卦</p><h2>' + escape(current.original.name) + '</h2><p class="hex-trigrams">上' + escape(current.original.upper.name + ' · ' + current.original.upper.nature) + '　下' + escape(current.original.lower.name + ' · ' + current.original.lower.nature) + '</p>' + hexLines(current.original, true) + '<p class="moving-copy"><strong>' + escape(current.original.yaoLabel) + '动</strong>' + escape(current.original.yaoCi) + '</p></section><div class="pair-grid">' + smallHex('互卦', current.mutual) + smallHex('变卦', current.changed) + '</div><h3 class="section-title">体 用</h3><section class="relation card"><div class="body-use"><div><span class="role">体卦</span><span class="trigram">' + escape(current.body.name + ' · ' + current.body.element) + '</span></div><span class="relation-center">' + escape(current.relation.name) + '</span><div><span class="role">用卦</span><span class="trigram">' + escape(current.use.name + ' · ' + current.use.element) + '</span></div></div><p class="relation-text">' + escape(current.relation.text) + '</p></section><h3 class="section-title">卦 辞</h3><section class="reading card"><label>本卦卦辞</label><p>' + escape(current.original.guaCi) + '</p><hr><label>' + escape(current.original.yaoLabel) + '爻辞</label><p>' + escape(current.original.yaoCi) + '</p><hr><label>白话参考</label><p class="plain">' + escape(current.original.theme) + '</p></section><div class="calculation card"><strong>起卦记录</strong><p>' + escape(current.sourceText) + '</p><p>' + escape(current.calculationText) + '</p></div><div class="actions"><button class="secondary" data-action="save">' + (saved ? '已保存 · 再次保存' : '保存记录') + '</button><button class="secondary" data-action="poster">导出卦象图片</button><button class="secondary full-row" data-action="share">分享卦象文字</button></div><button class="primary center-button" data-route="home">重新起卦</button><p class="notice">卦象与文字仅作传统文化学习和娱乐参考<br>不作为医疗、投资等现实决策依据</p>';
  }
  function historyPage() {
    const items = records();
    return '<div class="history-header"><h2>历史记录</h2>' + (items.length ? '<button class="text-button" data-action="clear">全部清空</button>' : '') + '</div><p class="subtitle">仅保存在本机，最多保留 50 条手动保存的记录。</p>' + (items.length ? items.map(item => '<article class="history-item card"><button class="history-open" data-open="' + escape(item.id) + '"><strong>' + escape(item.original.name + ' → ' + item.changed.name) + '</strong><small>' + escape(item.createdAtText + ' · ' + item.method) + '</small>' + (item.question ? '<p>' + escape(item.question) + '</p>' : '') + '</button><div class="history-bottom"><span>' + escape(item.original.yaoLabel + '动 · ' + item.relation.name) + '</span><button class="text-button" data-remove="' + escape(item.id) + '">删除</button></div></article>').join('') : '<div class="empty">尚无保存的卦象<br>起卦后点击“保存记录”，即可在这里查看。<button class="secondary center-button" data-route="home">去起一卦</button></div>');
  }
  function aboutPage() {
    return heading('观物 · 取象 · 明变', '古法梅花排盘', 'Android 离线版 · 1.0.1') + '<section class="about-card card"><h3>本机隐私</h3><p>本应用无需账号，不请求联网、位置、通讯录、相机、麦克风或相册读取权限；不包含广告或统计 SDK，不向服务器上传数据。</p><p>输入内容、最近一次结果及手动保存的历史记录只保存在本机。分享时仅在你主动选择后，把当前卦象文字交给系统分享面板；导出图片由你选择保存位置。</p><p>卸载应用或清除应用数据会删除本地记录，应用不提供云端恢复。请提前导出需要保留的内容。</p><button class="secondary center-button" data-action="erase">清除全部本机数据</button></section><section class="about-card card"><h3>规则与字库</h3><p>数字范围为 1–99。两数或随机起卦仅在两个数都是一位数时从小到大排列；三数始终保持顺序。动爻从下往上计数。</p><p>动爻在下卦，下卦为用、上卦为体；动爻在上卦，上卦为用、下卦为体。</p><p>汉字转换与笔画沿用小程序字库。字库笔画并非对全部汉字逐字核验的康熙笔画，遇到异体字或不同笔画口径，请核对后使用。</p></section><section class="about-card card"><h3>理性使用</h3><p>本应用提供传统排卦规则与古籍文字展示，不保证预测准确性，不作为医疗、投资、法律等现实决策依据。</p></section><section class="about-card card"><h3>开源许可与数据来源</h3><p>汉字转换与笔画：cnchar / cnchar-trad 3.2.6（MIT）。古籍结构化数据许可随应用附带。</p><details><summary>cnchar 许可</summary><pre id="cnchar-license" class="license"></pre></details><details><summary>卦爻辞数据许可</summary><pre id="zhouyi-license" class="license"></pre></details></section>';
  }
  function render() {
    clearInterval(randomTimer);
    if (drafts.random) drafts.random.rolling = false;
    route = location.hash.slice(1) || 'home';
    if (!titles[route]) route = 'home';
    document.getElementById('page-title').textContent = titles[route];
    document.getElementById('back').style.visibility = route === 'home' ? 'hidden' : 'visible';
    root.innerHTML = route === 'home' ? home() : ['two', 'three', 'random'].includes(route) ? numbers(route) : route === 'hanzi' ? hanzi() : route === 'history' ? historyPage() : route === 'about' ? aboutPage() : resultPage();
    if (route === 'about' && window.AppLicenses) {
      document.getElementById('cnchar-license').textContent = window.AppLicenses.cnchar;
      document.getElementById('zhouyi-license').textContent = window.AppLicenses.zhouyi;
    }
    window.scrollTo(0, 0);
  }
  function showReading(reading, parent) {
    current = reading;
    resultParent = parent;
    try { write(currentKey, current); } catch (error) { toast('本机存储空间不足，结果暂未持久保存'); }
    navigate('result');
  }
  function strictNumber(value, index) {
    if (!/^[1-9][0-9]?$/.test(String(value))) throw new Error('第' + (index + 1) + '个数字请输入 1 至 99 的整数');
    return Number(value);
  }
  function submit() {
    const draft = getDraft(route);
    if (route === 'hanzi') {
      if (!draft.analysed) throw new Error('请先转换并核对两个汉字');
      showReading(api.castCharacters(draft.original.trim(), draft.analysed.traditional, draft.analysed.strokes, draft.question), route);
    } else {
      if (route === 'random' && (!draft.ready || draft.rolling)) throw new Error('请先抽取数字');
      const values = draft.numbers.slice(0, route === 'three' ? 3 : 2).map(strictNumber);
      const reading = route === 'three' ? api.castThree(values[0], values[1], values[2], draft.question) : api.castTwo(values[0], values[1], draft.question, route === 'random' ? '随机起卦' : '两数起卦');
      showReading(reading, route);
    }
  }
  function randomNumber() {
    const array = new Uint32Array(1);
    const bound = Math.floor(4294967296 / 99) * 99;
    do { crypto.getRandomValues(array); } while (array[0] >= bound);
    return array[0] % 99 + 1;
  }
  function randomize() {
    const draft = getDraft('random');
    if (draft.rolling) return;
    draft.rolling = true;
    draft.ready = false;
    document.querySelector('[data-action="random"]').disabled = true;
    document.getElementById('cast-submit').disabled = true;
    let count = 0;
    randomTimer = setInterval(() => {
      draft.numbers = [String(randomNumber()), String(randomNumber()), ''];
      draft.numbers.slice(0, 2).forEach((value, index) => { document.getElementById('number-' + index).textContent = value; });
      count += 1;
      if (count >= 12) {
        clearInterval(randomTimer);
        draft.rolling = false;
        draft.ready = true;
        const button = document.querySelector('[data-action="random"]');
        button.disabled = false;
        button.textContent = '重新抽取';
        document.getElementById('cast-submit').disabled = false;
      }
    }, 65);
  }
  function convert(recount) {
    const draft = getDraft('hanzi');
    const result = api.analyseCharacters(recount ? draft.traditional : draft.original);
    draft.analysed = result;
    draft.traditional = result.traditional;
    render();
    toast('请核对繁体字和笔画');
  }
  function save() {
    const items = records().filter(item => item.id !== current.id);
    items.unshift(current);
    write(historyKey, items.slice(0, 50));
    document.querySelector('[data-action="save"]').textContent = '已保存 · 再次保存';
    toast('已保存到本机历史');
  }
  function shareText() {
    const text = ['古法梅花排盘 · ' + current.method, current.createdAtText, current.question ? '所问：' + current.question : '', '本卦：' + current.original.name + '，' + current.original.yaoLabel + '动', '互卦：' + current.mutual.name, '变卦：' + current.changed.name, '体：' + current.body.name + '（' + current.body.element + '） 用：' + current.use.name + '（' + current.use.element + '）', current.relation.name + '：' + current.relation.text, '卦辞：' + current.original.guaCi, '爻辞：' + current.original.yaoCi, '来源：' + current.sourceText, '传统文化学习与娱乐参考，不作为现实决策依据。'].filter(Boolean).join('\n');
    if (window.Android) window.Android.shareText(text);
    else if (navigator.share) navigator.share({ title: '古法梅花排盘', text }).catch(() => {});
    else toast('请在安卓应用中使用系统分享');
  }
  function poster() {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1320;
    const context = canvas.getContext('2d');
    context.fillStyle = '#0b0b0a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#6c582c';
    context.lineWidth = 2;
    context.strokeRect(32, 32, 836, 1256);
    context.textAlign = 'center';
    context.fillStyle = '#c9a84c';
    context.font = '28px sans-serif';
    context.fillText('古 法 梅 花 排 盘', 450, 108);
    context.fillStyle = '#eee4cd';
    context.font = '54px serif';
    context.fillText(current.original.name, 450, 200);
    context.fillStyle = '#a29681';
    context.font = '22px sans-serif';
    context.fillText(current.method + ' · ' + current.createdAtText, 450, 246);
    current.original.displayLines.forEach((line, index) => {
      const top = 310 + index * 47;
      context.fillStyle = line.moving ? '#f0d777' : '#c9a84c';
      if (line.yang) context.fillRect(310, top, 280, 12);
      else { context.fillRect(310, top, 116, 12); context.fillRect(474, top, 116, 12); }
      if (line.moving) { context.beginPath(); context.arc(625, top + 6, 8, 0, Math.PI * 2); context.stroke(); }
    });
    context.fillStyle = '#e0c46e';
    context.font = '28px sans-serif';
    context.fillText(current.original.yaoLabel + '动', 450, 632);
    context.fillStyle = '#d5c7a6';
    context.font = '24px sans-serif';
    wrapCanvas(context, current.original.yaoCi, 450, 682, 720, 36, 4);
    context.fillStyle = '#e0c46e';
    context.font = '27px sans-serif';
    context.fillText('互卦 ' + current.mutual.name + '　·　变卦 ' + current.changed.name, 450, 865);
    context.font = '25px sans-serif';
    context.fillText('体：' + current.body.name + '（' + current.body.element + '）　用：' + current.use.name + '（' + current.use.element + '）', 450, 930);
    context.fillText(current.relation.name, 450, 987);
    context.fillStyle = '#a29681';
    context.font = '22px sans-serif';
    wrapCanvas(context, current.sourceText, 450, 1050, 730, 34, 2);
    context.font = '19px sans-serif';
    context.fillText('传统文化学习与娱乐参考', 450, 1190);
    context.fillText('不作为医疗、投资等现实决策依据', 450, 1227);
    const data = canvas.toDataURL('image/png');
    if (window.Android) window.Android.saveImage(data);
    else { const link = document.createElement('a'); link.href = data; link.download = '古法梅花排盘-' + current.original.name + '.png'; link.click(); }
  }
  function wrapCanvas(context, text, center, top, width, lineHeight, limit) {
    const lines = [];
    let line = '';
    for (const character of Array.from(text)) {
      if (line && context.measureText(line + character).width > width) { lines.push(line); line = ''; }
      line += character;
    }
    if (line) lines.push(line);
    if (lines.length > limit) lines[limit - 1] = lines[limit - 1].slice(0, -1) + '…';
    lines.slice(0, limit).forEach((value, index) => context.fillText(value, center, top + index * lineHeight));
  }
  root.addEventListener('input', event => {
    const draft = getDraft(route);
    const target = event.target;
    if (target.dataset.number != null) draft.numbers[Number(target.dataset.number)] = target.value;
    if (target.dataset.field) {
      draft[target.dataset.field] = target.value;
      if (['original', 'traditional'].includes(target.dataset.field)) {
        draft.analysed = null;
        document.getElementById('hanzi-submit').disabled = true;
        if (target.dataset.field === 'original') { draft.traditional = ''; document.getElementById('conversion').hidden = true; }
        else document.getElementById('stroke-values').textContent = '请重新计算笔画';
      }
    }
  });
  root.addEventListener('submit', event => {
    event.preventDefault();
    try { submit(); } catch (error) { toast(error.message); }
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    try {
      if (button.dataset.route) navigate(button.dataset.route);
      else if (button.dataset.open) { const item = records().find(value => value.id === button.dataset.open); if (item) showReading(item, 'history'); }
      else if (button.dataset.remove) {
        if (confirm('确定删除这条记录？删除后无法恢复。')) { write(historyKey, records().filter(item => item.id !== button.dataset.remove)); render(); }
      } else {
        const action = button.dataset.action;
        if (action === 'convert' || action === 'recount') convert(action === 'recount');
        else if (action === 'random') randomize();
        else if (action === 'save') save();
        else if (action === 'share') shareText();
        else if (action === 'poster') poster();
        else if (action === 'clear' && confirm('确定清空全部历史记录？此操作无法恢复。')) { write(historyKey, []); render(); }
        else if (action === 'erase' && confirm('删除所有历史记录、最近结果与输入内容？此操作无法恢复。')) {
          localStorage.removeItem(historyKey); localStorage.removeItem(currentKey); current = null;
          Object.keys(drafts).forEach(key => delete drafts[key]);
          toast('本机数据已清除'); navigate('home');
        }
      }
    } catch (error) { toast(error.name === 'QuotaExceededError' ? '本机存储空间不足，请先清理历史记录' : error.message); }
  });
  render();
})();
