/* =========================================================
   atoms.js — 欄位元件目錄與渲染
   一個 atom = 版面上一個可填的最小單位。
   xlsx 對應規則：
     一般 atom   → 一個單行綠格
     multi atom  → 一個多行綠格（Alt+Enter 換行）
     bullets     → 一個多行綠格（一行＝一條）
     speaker     → 品牌＋姓名 兩個綠格
     photo       → 一個檔名綠格（可留白走自動配對）
   ========================================================= */
(function () {
  'use strict';
  const XD = window.XD;

  /* cls  = 預覽字樣 class；ph = 佔位字；max = 字數上限（multi 為每行上限）
     list = 條列（mod 可再指定符號變體）；photo = 圖片檔名欄（av 決定佔位框形狀）
     deco = 純裝飾字（會畫但不進工單，例如等式的 ＋ ＝） */
  /* 2026-09-09：除了 eqop（裝飾用的運算符號，line 一律不給打字進去，見 atomHTML 的
     deco 判斷）以外全部補上 multi——使用者要「全部都能手動斷行」，短欄位（標籤、
     價格…）平常還是一行，多按一個 Enter 純粹是使用者自己要斷才會斷，不影響既有內容。 */
  XD.ATOMS = {
    head:     { cls:'a-head',     nm:'標題',     ph:'欄位標題',            max:10, multi:true },
    label:    { cls:'a-label',    nm:'標籤',     ph:'標籤',                max:6,  multi:true },
    time:     { cls:'a-time',     nm:'時間',     ph:'00:00 - 00:00',       max:14, multi:true },
    text:     { cls:'a-text',     nm:'內文',     ph:'內文文字，會自動換行並撐開列高。', max:40, multi:true },
    star:     { cls:'a-star',     nm:'重點說明', ph:'★ 星註重點文字',      max:20, multi:true },
    topic:    { cls:'a-topic',    nm:'主題標題', ph:'主題標題',            max:16, multi:true },
    practice: { cls:'a-practice', nm:'實作環節', ph:'實作環節：說明文字',  max:30, multi:true },
    price:    { cls:'a-price',    nm:'價格',     ph:'$0,000 / 人',         max:14, multi:true },
    note:     { cls:'a-note',     nm:'註記',     ph:'（註記文字）',        max:20, multi:true },
    slogan:   { cls:'a-slogan',   nm:'標語',     ph:'活動標語大字',        max:16, multi:true },
    hbody:    { cls:'a-hbody',    nm:'亮點內文', ph:'亮點說明文字',        max:24, multi:true },
    wtext:    { cls:'a-wtext',    nm:'白字內文', ph:'白字說明文字',        max:40, multi:true },
    cname:    { cls:'a-cname',    nm:'顧問名稱', ph:'品牌 - 姓名',         max:20, multi:true },
    bullets:  { list:true,        nm:'條列',     ph:'條列項目',            max:26 },
    wbullets: { list:true, white:true, nm:'條列', ph:'條列項目',           max:40 },
    cbullets: { list:true, small:true, nm:'介紹條列', ph:'顧問介紹',       max:30 },
    /* photo:true＋av:'speaker' 讓講者頭像圈跟 photo/icon/pic 共用同一套上傳／拖曳
       調整位置／縮放／裁切虛線（見 atomHTML 的 def.spk 分支），不是另外接一套。 */
    speaker:  { spk:true, photo:true, av:'speaker', nm:'講者', ph:'品牌／姓名', max:12, multi:true },
    photo:    { photo:true, av:'circle', nm:'照片檔名', ph:'',             max:40 },

    /* ---- 2026-09-08 新增：膠囊標題 ----
       以前是 flow-engine 對每個區段無條件吐的 <span class="pill">，
       不是欄位；改成 atom 之後它就跟其他欄位一樣可加可刪可搬。 */
    pill:     { cls:'a-pill',     nm:'膠囊標題', ph:'區段標題',            max:10, multi:true },

    /* ---- 2026-09-04 新增（來源：蝦大MS.xlsx 七檔規律分析） ---- */
    tag:      { cls:'a-tag',      nm:'標籤詞',   ph:'標籤詞',              max:8,  multi:true },
    part:     { cls:'a-part',     nm:'章節標題', ph:'《 Part 1 章節標題 》', max:20, multi:true },
    wnote:    { cls:'a-wnote',    nm:'白字註記', ph:'（註記文字）',        max:40, multi:true },
    eqop:     { cls:'a-eqop',     nm:'運算符',   ph:'＋',                  max:2, deco:true },
    sqbul:    { list:true, mod:'a-bul-sq', nm:'重點條列', ph:'重點項目',   max:30 },
    okbul:    { list:true, mod:'a-bul-ok', nm:'適合對象', ph:'適合的對象描述',   max:30 },
    ngbul:    { list:true, mod:'a-bul-ng', nm:'不建議對象', ph:'不建議的對象描述', max:30 },
    icon:     { photo:true, av:'icon', nm:'圖示檔名', ph:'',               max:40 },
    pic:      { photo:true, av:'rect', nm:'圖片檔名', ph:'',               max:40 },
  };

  /* 圖片側表：atom 只存 imgId，dataURL 放這裡（見 atomHTML 的說明） */
  XD.IMAGES = XD.IMAGES || {};
  /* 判斷一個 photo atom「現在真的有圖可以畫」——不是只看 imgId 有沒有存在。
     重新整理瀏覽器時，圖片側表存不下（localStorage 塞爆）就會被整包丟掉，
     但 atom 上的 imgId／檔名還在，變成「有參照但沒圖」的孤兒狀態。
     兩邊都用這個判斷，才不會有的地方覺得「有圖」有的地方覺得「沒圖」。 */
  XD.photoResolved = a => !!(a && (a.img || (a.imgId && XD.IMAGES[a.imgId])));

  const A   = (t, v) => ({ t, v: v === undefined ? XD.ATOMS[t].ph : v });
  const BUL = (t, items) => ({ t, items: Array.isArray(items) ? items :
                Array.from({ length: items || 2 }, () => XD.ATOMS[t].ph) });
  XD.A = A; XD.BUL = BUL;

  /* 圓形／方形／矩形佔位框的畫法，photo/icon/pic 與講者頭像圈共用同一份——
     講者圈只是多一個 av 變體（av-speaker），upload／拖曳移動／縮放／裁切虛線
     全部走同一套 CSS class（.avatar[.has] .imgwrap），不必另外接一套 JS。
     placeholder＝沒有圖時畫在框裡的內容，兩邊各自的空狀態長相不同所以留給呼叫端傳。 */
  function avatarBoxHTML(a, def, di, live, placeholder) {
    const box = 'avatar av-' + (def.av || 'circle');
    const im = (live && di) ? ' data-img="' + di + '"' : '';
    /* 圖可以直接掛在 atom 上（ms-studio 的素材包配對），也可以只存一個 id、
       真正的 dataURL 放 XD.IMAGES 這張側表——線上編輯器走後者，
       因為 undo 是整份 state 複本，幾 MB 的 base64 不能每打一個字就複製一次。 */
    a = a.img ? a : (a.imgId && XD.IMAGES[a.imgId]
                      ? Object.assign({}, a, { img: XD.IMAGES[a.imgId] }) : a);
    /* 照片位置／縮放（tf＝{x,y,z}，% 位移 + 倍率）：只有線上編輯器讓人拖／縮，
       但存在 atom 上，任何一支工具重新畫都會照樣套用——不是 ms-live 專屬的畫法。
       ⚠ transform 刻意掛在多包的 .imgwrap，不是直接掛在 <img> 上：PNG 匯出
       （export-png.js 的 pinObjectFit）擷取前會把 object-fit:cover 的 <img>
       改寫成「絕對定位＋算好的尺寸」讓 html2canvas 讀得到，尺寸常常跟 100%/100%
       不一樣——如果 % 位移直接掛在 img 上，匯出時位移解讀的參照框會跟著換，畫面
       就會跟預覽對不起來。.imgwrap 永遠是 inset:0 撐滿整個佔位框，不會被
       pinObjectFit 動到，位移的參照框在編輯與匯出兩邊保證一致。 */
    const tf = a.tf;
    const tfStyle = tf && (tf.x || tf.y || tf.z !== 1)
      ? ' style="transform:translate(' + tf.x + '%,' + tf.y + '%) scale(' + tf.z + ')"' : '';
    return a.img
      ? '<div class="' + box + ' has"' + im + '><span class="imgwrap"' + tfStyle + '>' +
        '<img src="' + a.img + '" alt=""></span></div>'
      : '<div class="' + box + '"' + im + '>' + placeholder + '</div>';
  }

  /* ---------- 預覽渲染 ----------
     di   ＝ 欄位位址 [iid|rowId|ci|si|ai]，有值才畫移除鈕
     live ＝ 線上編輯模式：文字類掛 contenteditable、圖片類掛 data-img（點了換圖）。
            位址一律沿用 di，讓工具頁用同一套 split('|') 解析。
            講者一個 atom 有品牌／姓名兩欄，位址後面再接第 6 段區分。 */
  XD.atomHTML = function (a, di, live) {
    const esc = XD.esc, def = XD.ATOMS[a.t] || {};
    const ed = (live && di && !def.deco)
      ? ' contenteditable="true" spellcheck="false" data-ed="' + di + '"' : '';
    let core;
    if (def.list) {
      const cls = 'a-bul' + (def.white ? ' a-bul-w' : '') + (def.small ? ' a-bul-s' : '') +
                  (def.mod ? ' ' + def.mod : '');
      core = '<ul class="' + cls + '"' + ed + '>' +
             a.items.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>';
    } else if (def.spk) {
      /* 頭像圈跟 photo/icon/pic 共用 avatarBoxHTML（上傳／拖曳／縮放／裁切虛線
         全部跟著一起有），空狀態維持原本那顆大大的「講」字（框太小放不下
         「點一下上傳」那句提示）。品牌／姓名兩個文字格不受影響。 */
      const e2 = k => (live && di) ? ' contenteditable="true" spellcheck="false" data-ed="' +
                                     di + '|' + k + '"' : '';
      /* has-photo 給 ms-live 判斷「這一顆選取外框要不要畫」——有照片時外框
         交給照片自己的操作框＋裁切虛線接手（跟 .avatar:not(.has) 同一個道理，
         只是這裡多一層 .spk 包住品牌／姓名，不能只看 .avatar 本身）。 */
      const av = avatarBoxHTML(a, def, di, live, '<span>講</span>');
      core = '<div class="spk' + (XD.photoResolved(a) ? ' has-photo' : '') + '">' + av +
             '<div class="bd"' + e2('brand') + '>' +
             esc(a.brand).replace(/\n/g, '<br>') + '</div><div class="nm2"' + e2('name') + '>' +
             esc(a.name).replace(/\n/g, '<br>') + '</div></div>';
    } else if (def.photo) {
      const placeholder = '<span>' + esc(def.nm.replace('檔名', '')) + '</span>' +
        (a.v ? '<em>' + esc(a.v) + '</em>'
             : '<em class="dim">' + (live ? '點一下上傳' : '檔名可留白') + '</em>');
      core = avatarBoxHTML(a, def, di, live, placeholder);
    } else {
      core = '<div class="' + def.cls + '"' + ed + '>' + esc(a.v).replace(/\n/g, '<br>') + '</div>';
    }
    /* 右上角那顆 ✕ 只給工單生成器（不能打字，需要一個點的目標）。
       線上編輯器（live）不畫——積在每個欄位角上很吵，而且常壓到內容；
       那邊改成「欄位空了按 Backspace／Delete 就删掉」。 */
    return '<div class="aw"' + (di ? ' data-aw="' + di + '"' : '') + '>' + core +
           (di && !live ? '<button class="adel" data-di="' + di + '" title="移除這個欄位">✕</button>' : '') + '</div>';
  };

  /* ---------- 語意角色目錄（給編輯器選的東西） ----------
     這是「自由度放在組合、不放在樣式參數」的落點：使用者選的是
     『這句話是什麼』（大標／內文／條列…），不是『這句話多大、多粗』。
     長相一律由 tokens.css 決定，PSD 校準才不會被使用者調壞。

     ⚠ ROLES 不是 ATOMS 的別名，是刻意收斂過的另一層（2026-09-04 改）：
       ATOMS＝版面上實際存在的欄位型別（27 種，渲染與工單都靠它）
       ROLES＝使用者要挑的東西（一個面 4~12 個）
     收斂的四條規則：
       ① 只差底色的合成一個角色（內文/亮點內文/白字內文 → 一個「內文」），
          由容器的「面」決定實際用哪個 atom —— 這件事工具自己知道，不該問使用者
       ② 條列符號（・●■✓✗）與圖片框型（圓/方/矩形）不是角色，是角色底下的
          styles，只在選到該角色時才出現（Word 的「項目符號」下拉是同一個道理）
       ③ 模板專屬的（實作環節／講者／運算符）標 only，不開放新增，
          只有版面上已經在用時才會出現在清單裡
       ④ face：'card'＝白底表格格／卡片，'plain'＝藍底無框列。
          兩個面的角色幾乎不重疊，光是照面過濾就把 27 選 1 變成 6 或 12 選 1。
     hot＝常用，預設攤開；其餘收在「更多樣式」。 */
  XD.ROLES = [
    /* --- 白底表格格／卡片 --- */
    { id:'head',  nm:'表頭',   face:'card', set:'head',  hot:1, sample:'表頭文字',   ds:'欄位標題那一排' },
    { id:'topic', nm:'小標',   face:'card', set:'topic', hot:1, sample:'段落小標',   ds:'段落的小標題' },
    { id:'text',  nm:'內文',   face:'card', set:'text',  hot:1, sample:'內文文字會長這樣', ds:'一般說明文字' },
    { id:'bul',   nm:'條列',   face:'card', set:'bullets', hot:1, sample:'條列項目', ds:'一行一條',
      styles:[['bullets','・'], ['sqbul','■'], ['okbul','✓'], ['ngbul','✗'], ['cbullets','・小']] },
    { id:'note',  nm:'小註記', face:'card', set:'note',  hot:1, sample:'（補充說明）', ds:'括號補充、提醒' },
    { id:'label', nm:'欄位標籤',   face:'card', set:'label', sample:'標　籤',        ds:'米黃標籤格裡的字' },
    { id:'cname', nm:'人名／品牌', face:'card', set:'cname', sample:'品牌 - 姓名',   ds:'顧問、講師、品牌名' },
    { id:'star',  nm:'藍色重點',   face:'card', set:'star',  sample:'★ 要跳出來的一句', ds:'藍色粗體重點' },
    { id:'price', nm:'價格',       face:'card', set:'price', sample:'$0,000',        ds:'金額大字' },
    { id:'time',  nm:'時間',       face:'card', set:'time',  sample:'00:00 - 00:00', ds:'時段，置中' },
    { id:'part',  nm:'章節 Part',  face:'card', set:'part',  sample:'《 Part 1 》',  ds:'流程的章節分隔' },
    { id:'img',   nm:'圖片',       face:'card', set:'photo', sample:'圖片框', img:1,  ds:'點框上傳',
      styles:[['photo','圓形'], ['icon','方形'], ['pic','矩形']] },

    /* --- 藍底無框列 --- */
    { id:'slogan', nm:'大標語', face:'plain', set:'slogan', hot:1, sample:'活動大標語', ds:'黃色大字' },
    { id:'pbody',  nm:'內文',   face:'plain', set:'hbody', also:['wtext'], hot:1,
      sample:'白色說明文字', ds:'落在藍底上的說明文字' },
    { id:'pbul',   nm:'條列',   face:'plain', set:'wbullets', hot:1, sample:'條列項目', ds:'白色圓點條列',
      styles:[['wbullets','●']] },
    { id:'pnote',  nm:'小註記', face:'plain', set:'wnote', hot:1, sample:'（小字備註）', ds:'白色小字' },
    { id:'tag',    nm:'標籤詞', face:'plain', set:'tag',   sample:'標籤詞',   ds:'黃色標籤字' },
    { id:'pillt',  nm:'膠囊標題', face:'plain', set:'pill', sample:'區段標題', ds:'黃底圓角大標' },
    { id:'pimg',   nm:'圖片',   face:'plain', set:'photo', sample:'圖片框', img:1, ds:'點框上傳',
      styles:[['photo','圓形'], ['icon','方形'], ['pic','矩形']] },

    /* --- 模板專屬：不開放新增，只有已經在用時才顯示 --- */
    { id:'practice', nm:'實作環節', face:'card',  set:'practice', only:1, sample:'實作環節：說明' },
    { id:'speaker',  nm:'講者',     face:'card',  set:'speaker',  only:1, sample:'品牌／姓名' },
    { id:'eqop',     nm:'運算符',   face:'plain', set:'eqop',     only:1, sample:'＋' },
  ];

  const roleHas = (r, t) => r.set === t ||
    (r.also || []).indexOf(t) >= 0 || (r.styles || []).some(s => s[0] === t);

  /* 這個面可以新增／切換的角色（不含 only 的模板專屬角色） */
  XD.rolesFor = face => XD.ROLES.filter(r => r.face === face && !r.only);
  /* 某個 atom 型別現在算哪個角色（先在同一個面找，找不到才跨面） */
  XD.roleOf = function (t, face) {
    return XD.ROLES.find(r => r.face === face && roleHas(r, t)) ||
           XD.ROLES.find(r => roleHas(r, t)) || null;
  };
  /* 「＋ 加欄位」的三顆快速鈕：每個面各自對到合適的 atom */
  XD.QUICK_ADD = {
    card:  [['text', '＋ 文字'], ['bullets', '＋ 條列'], ['photo', '＋ 圖片']],
    plain: [['hbody', '＋ 文字'], ['wbullets', '＋ 條列'], ['photo', '＋ 圖片']],
  };

  /* 換角色：盡量把既有內容帶過去，帶不過去的用該角色的佔位字。
     文字↔條列用換行／合併互轉（這正是「加入項目符號」的實作）。 */
  XD.convertAtom = function (a, t) {
    const from = XD.ATOMS[a.t] || {}, to = XD.ATOMS[t] || {};
    if (!to.nm || a.t === t) return a;
    const asText = from.list ? (a.items || []).join('\n')
                 : from.spk  ? [a.brand, a.name].filter(Boolean).join(' ')
                 : String(a.v == null ? '' : a.v);
    const keepImg = from.photo && to.photo ? a.img : null;
    for (const k of Object.keys(a)) delete a[k];
    a.t = t;
    if (to.list) {
      const items = asText.split('\n').map(s => s.trim()).filter(Boolean);
      a.items = items.length ? items : [to.ph];
    } else if (to.spk) {
      const parts = asText.split(/[\s　\-–—/｜|]+/).filter(Boolean);
      a.brand = parts[0] || '品牌'; a.name = parts.slice(1).join(' ') || '姓名';
    } else if (to.photo) {
      a.v = from.photo ? asText : '';
      if (keepImg) a.img = keepImg;
    } else {
      a.v = asText || to.ph;
    }
    return a;
  };

  /* ---------- 子格名稱（工單欄位名的前綴） ----------
     cell.subNames 由列型自帶（如 ['卡一','卡二','卡三']）；
     沒寫的沿用雙軌列的舊稱呼，舊版面 JSON 因此不會變樣。 */
  const subPrefix = (cell, sub) => {
    if (sub == null) return '';
    const nm = (cell.subNames || [])[sub];
    return (nm || (sub === 0 ? '左軌' : sub === 1 ? '右軌' : '第 ' + (sub + 1) + ' 格')) + '・';
  };

  /* ---------- 攤平成可填欄位（工單用） ---------- */
  /* 回傳 [{id,nm,v,max,multi,lines,photo,sub}]；deco 裝飾字不列入 */
  /* 同一格出現同型別第二次時，id 後面接 2、3…
     合併格會把右邊那格的欄位接過來，不加後綴就會撞名。
     第一次不加，所以舊工單的 id 完全沒變。
     fieldsOf 與 applyFields 必須用同一套規則（各自數，走訪順序相同）。 */
  const idCounter = () => {
    const seen = {};
    return (pfx, t) => {
      const k = pfx + '|' + t;
      seen[k] = (seen[k] || 0) + 1;
      return pfx + '_' + t + (seen[k] > 1 ? String(seen[k]) : '');
    };
  };

  XD.fieldsOf = function (cell, prefix) {
    const out = [];
    const uid = idCounter();
    const push = (a, sub) => {
      const def = XD.ATOMS[a.t] || {};
      if (def.deco) return;
      const p = prefix + (sub != null ? '_' + sub : '');
      const pre = subPrefix(cell, sub);
      if (def.list) {
        out.push({ id: uid(p, a.t), nm: pre + def.nm + '（一行一條）',
                   v: a.items.join('\n'), max: def.max, multi: true, lines: a.items.length, sub });
      } else if (def.spk) {
        out.push({ id: uid(p, 'brand'), nm: pre + '講者品牌', v: a.brand, max: def.max, sub,
                   multi: !!def.multi, lines: def.multi ? String(a.brand || '').split('\n').length : 1 });
        out.push({ id: uid(p, 'name'),  nm: pre + '講者姓名', v: a.name,  max: def.max, sub,
                   multi: !!def.multi, lines: def.multi ? String(a.name || '').split('\n').length : 1 });
      } else if (def.photo) {
        /* id 用 atom 型別（photo 維持舊的 _photo，icon/pic 各自成欄，同格不撞名） */
        out.push({ id: uid(p, a.t), nm: pre + def.nm, v: a.v, max: def.max, photo: true, sub });
      } else {
        out.push({ id: uid(p, a.t), nm: pre + def.nm, v: a.v, max: def.max,
                   multi: !!def.multi, lines: def.multi ? String(a.v || '').split('\n').length : 1, sub });
      }
    };
    if (cell.sub) cell.sub.forEach((s, si) => s.atoms.forEach(a => push(a, si)));
    else (cell.atoms || []).forEach(a => push(a, null));
    return out;
  };

  /* ---------- 工單值寫回（匯入用） ----------
     與 fieldsOf 完全相同的走訪順序與 id 規則，把 valueMap 裡的值塞回 atom。
     回傳套用的欄位數。 */
  XD.applyFields = function (cell, prefix, valueMap) {
    let applied = 0;
    const uid = idCounter();
    const get = id => {
      const v = valueMap[id];
      return (v == null || String(v).trim() === '') ? null : String(v);
    };
    const apply = (a, sub) => {
      const def = XD.ATOMS[a.t] || {};
      if (def.deco) return;
      const p = prefix + (sub != null ? '_' + sub : '');
      if (def.list) {
        const v = get(uid(p, a.t));
        if (v != null) { a.items = v.split('\n').map(s => s.trim()).filter(Boolean); applied++; }
      } else if (def.spk) {
        const b = get(uid(p, 'brand')), n = get(uid(p, 'name'));
        if (b != null) { a.brand = b; applied++; }
        if (n != null) { a.name = n; applied++; }
      } else if (def.photo) {
        const v = get(uid(p, a.t));
        if (v != null) { a.v = v; applied++; }
      } else {
        const v = get(uid(p, a.t));
        if (v != null) { a.v = v; applied++; }
      }
    };
    if (cell.sub) cell.sub.forEach((s, si) => s.atoms.forEach(a => apply(a, si)));
    else (cell.atoms || []).forEach(a => apply(a, null));
    return applied;
  };
})();
