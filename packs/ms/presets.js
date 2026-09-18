/* =========================================================
   packs/ms/presets.js — MS 活動頁資料包
   （區段骨架 + 列型積木 + 假字預設整頁）

   這是「設計師發佈的成果」：資料為主，只允許宣告式 factory。
   採 .js 而非 .json：file:// 雙擊開檔時 fetch 會被擋，
   classic <script> 不會。
   所有預設內容一律假字（蝦大端不預填任何實際案型文案）。
   ========================================================= */
(function () {
  'use strict';
  const XD = window.XD, A = XD.A, BUL = XD.BUL;

  /* ---------- 區段骨架：欄軌固定，蝦大不能改 ----------
     nm    = 左欄面板的顯示名。2026-09-08 改成「形狀優先」——盤點後發現 11 個區段
             其實只有 5 種骨架（欄軌），照用途命名看不出是幾欄的表；後綴保留用途，
             所以第一次用的人也找得到。詳見 MS討論記錄 §11.9。
     title = 用途名。工單的區段分組橫條用它，新增區段時膠囊標題也帶這個字。
     face  = 左欄縮圖畫成哪一種面。實際的面是列型決定的，這裡只是這個區段的代表值。
     demo  = 這一段「原本的樣態」（＝2026-09-08 以前的 dft，一列都沒動）。
             下面的迴圈會拿它變出兩份：`full`（不含膠囊）給「新增區段」與「整張表」用，
             `demo`（首列插膠囊）給「範例整頁」用。
             ⭐ 曾經拆成「膠囊＋一列」的最小版，使用者試用後改回整塊：
             一列一列疊太慢，多的刪掉比較快。
     hot   = 七檔活動裡的高命中區段，線上編輯器預設只列這些（其餘收在「全部」）。 */
  const sections = {
    kv:         { nm:'KV 主視覺', kv:true, kvH:550, hot:1, face:'kv', pin:'top',
                  ds:'滿版完稿圖，設計提供，這裡只佔位', demo:[] },

    highlight:  { nm:'單欄無框 · 活動亮點', title:'活動亮點', cols:['1fr'], hot:1, face:'plain',
                  ds:'標語＋說明直接落在藍底上，不畫表格線',
                  cards:['h_slogan','h_body','h_icons3','h_equation','h_pain3','h_tagline'],
                  demo:['h_slogan','h_body'] },

    ticket:     { nm:'標籤＋兩欄對照 · 票種說明', title:'票種說明', cols:['226px','1fr','1fr'],
                  face:'grid', ds:'標籤欄 226 ＋ 兩個票種並排比較',
                  cards:['t_intro','t_head','t_desc','t_list','t_price'],
                  demo:['t_intro','t_head','t_desc','t_list','t_price'] },

    flow:       { nm:'時間＋內容＋講者 · 活動流程', title:'活動流程', hot:1, face:'grid',
                  cols:['270px','1fr','250px'], ds:'三欄 270／1fr／250，可跨列、可分隔',
                  cards:['f_note','f_head','f_group','f_part','f_div','f_row','f_wide','f_dual'],
                  demo:['f_head','f_group','f_div','f_dual'] },

    consultant: { nm:'照片大卡 · 賣家顧問', title:'賣家顧問', cols:['370px','1fr'], hot:1, face:'card',
                  ds:'每列一張圓角卡：照片欄 370 ＋ 內容',
                  cards:['c_badge','c_card','c_lect','c_grid','c_subhead','c_more'],
                  demo:['c_badge','c_card','c_card'] },

    info:       { nm:'標籤＋內容 · 活動資訊', title:'活動資訊', cols:['200px','1fr'], hot:1, face:'grid',
                  ds:'標籤欄 200 ＋ 內容，一列一件事',
                  cards:['i_row','i_fee','i_hot','i_dual','i_reward'],
                  demo:['i_row','i_row','i_row','i_fee','i_hot'] },

    notice:     { nm:'單欄無框 · 注意事項', title:'注意事項', cols:['1fr'], hot:1, face:'plain',
                  ds:'白字條列＋聯絡方式，不畫表格線',
                  cards:['n_bullets','n_contact'], demo:['n_bullets','n_contact'] },

    /* ---- 2026-09-04 新增區段（七檔命中：適合對象 3、花絮／品牌／主題各 2） ---- */
    schedule:   { nm:'標籤＋內容 · 課程時程', title:'課程時程', cols:['240px','1fr'], face:'grid',
                  ds:'標籤欄 240 ＋ 內容，左欄放日期時間',
                  cards:['w_week'], demo:['w_week','w_week'] },

    audience:   { nm:'單欄表格 · 適合對象', title:'適合對象', cols:['1fr'], hot:1, face:'grid',
                  ds:'單欄表格格，可放條列、icon 對卡、勾叉對照',
                  cards:['a_body','a_icons','a_check'], demo:['a_body'] },

    topics:     { nm:'單欄橫條 · 討論主題', title:'討論主題', cols:['1fr'], face:'grid',
                  ds:'單欄橫條，一題一條',
                  cards:['p_topic','p_note','p_wait'], demo:['p_topic','p_topic','p_note'] },

    gallery:    { nm:'照片格 · 活動花絮', title:'活動花絮', cols:['1fr'], face:'photo',
                  ds:'2×2 照片格，檔名可留白走素材包配對',
                  cards:['g_grid'], demo:['g_grid'] },

    brand:      { nm:'照片大卡 · 合作品牌', title:'合作品牌', cols:['370px','1fr'], face:'card',
                  ds:'欄軌與賣家顧問相同：LOGO 370 ＋ 介紹',
                  cards:['b_card','b_points','b_pics'], demo:['b_card','b_points'] },
  };

  /* ---------- 列型積木（內容一律假字） ---------- */
  const presets = {
    /* ---------- 通用：膠囊標題（每個區段都有） ----------
       2026-09-08 起黃底膠囊是一塊列型積木，不再由 flow-engine 對每個區段無條件
       吐一顆。所以做得到：不要標題／一顆標題管兩張表／一個區段放兩顆。
       ctx.title＝新增時帶進來的區段用途名，之後就是一般欄位，改它不影響工單分組。 */
    x_pill: { nm:'膠囊標題', ds:'黃底圓角大標。可以刪掉、可以搬、可以再加一顆',
              mode:'plain', rowCls:'pillrow', shape:[1],
              cells:(n, ctx) => [{ atoms:[{ t:'pill', v:(ctx && ctx.title) || XD.ATOMS.pill.ph }] }] },

    /* 活動亮點 */
    h_slogan: { nm:'標語列', ds:'黃色大字標語（可多行）', mode:'plain', shape:[1],
                cells:() => [{ atoms:[A('slogan','活動標語大字\n第二行標語')] }] },
    h_body:   { nm:'內文列', ds:'白色說明文字（可多行）', mode:'plain', shape:[1],
                cells:() => [{ atoms:[A('hbody','活動說明文字第一行\n活動說明文字第二行\n可以自由增減行數')] }] },
    h_icons3: { nm:'icon 三卡列', ds:'三張並排：圖示＋兩行短語', mode:'plain', shape:[1,1,1],
                cells:() => [{ pad0:1, subCols:'1fr 1fr 1fr', subNames:['卡一','卡二','卡三'],
                  sub:[{ atoms:[A('icon'), A('hbody','標語一\n短句補述')] },
                       { atoms:[A('icon'), A('hbody','標語二\n短句補述')] },
                       { atoms:[A('icon'), A('hbody','標語三\n短句補述')] }] }] },
    h_equation:{ nm:'icon 等式列', ds:'項目＋項目＝成果（運算符是裝飾字，不進工單）',
                mode:'plain', shape:[3,1,3,1,3],
                cells:() => [{ pad0:1, subCols:'1fr 64px 1fr 64px 1fr',
                  subNames:['項目甲','符號','項目乙','符號','成果'],
                  sub:[{ atoms:[A('icon'), A('hbody','項目甲\n一句能力描述')] },
                       { atoms:[A('eqop','＋')] },
                       { atoms:[A('icon'), A('hbody','項目乙\n一句能力描述')] },
                       { atoms:[A('eqop','＝')] },
                       { atoms:[A('slogan','成果項')] }] }] },
    h_pain3:  { nm:'痛點三卡', ds:'三張並排痛點短句', mode:'plain', shape:[1,1,1],
                cells:() => [{ pad0:1, subCols:'1fr 1fr 1fr', subNames:['痛點一','痛點二','痛點三'],
                  sub:[{ atoms:[A('hbody','痛點描述一\n兩行內')] },
                       { atoms:[A('hbody','痛點描述二\n兩行內')] },
                       { atoms:[A('hbody','痛點描述三\n兩行內')] }] }] },
    h_tagline:{ nm:'標籤＋說明列', ds:'窄標籤欄＋寬說明欄', mode:'plain', shape:[1,3],
                cells:() => [{ pad0:1, subCols:'190px 1fr', subNames:['標籤','說明'],
                  sub:[{ atoms:[A('tag')] },
                       { atoms:[A('hbody','一句主張\n補充說明文字，可多行')] }] }] },

    /* 票種說明 */
    t_intro: { nm:'表前註記', ds:'表格上方的黃色提醒字', mode:'plain', shape:[1],
               cells:() => [{ atoms:[A('slogan','表格上方的提醒文字\n可以換行')] }] },
    t_head:  { nm:'表頭列', ds:'票種名稱那一排', shape:[1,1,1],
               cells:() => [{ lab:1, ctr:1, atoms:[A('label','票種')] },
                            { ctr:1, atoms:[A('head','票種名稱 A')] },
                            { ctr:1, atoms:[A('head','票種名稱 B')] }] },
    t_desc:  { nm:'說明列', ds:'標籤＋兩段說明（含藍色重點）', shape:[1,1,1],
               cells:() => [{ lab:1, ctr:1, atoms:[A('label','形式')] },
                            { ctr:1, atoms:[A('text'), A('star'), A('note')] },
                            { ctr:1, atoms:[A('text'), A('star'), A('note')] }] },
    t_list:  { nm:'條列列', ds:'標籤＋兩組條列（一行一條）', shape:[1,1,1],
               cells:() => [{ lab:1, ctr:1, atoms:[A('label','適合對象')] },
                            { atoms:[BUL('bullets', 2)] },
                            { atoms:[BUL('bullets', 3)] }] },
    t_price: { nm:'價格列', ds:'標籤＋兩組大字價格', shape:[1,1,1],
               cells:() => [{ lab:1, ctr:1, atoms:[A('label','票價')] },
                            { ctr:1, atoms:[A('price'), A('note')] },
                            { ctr:1, atoms:[A('price'), A('note')] }] },

    /* 活動流程 */
    f_note:  { nm:'表內說明列', ds:'橫跨整排的開場說明', shape:[3],
               cells:() => [{ cs:3, ctr:1, atoms:[A('text','表格開場說明文字\n可以換行')] }] },
    f_head:  { nm:'表頭列', ds:'時間／流程／講者', shape:[1,1,1],
               cells:() => [{ ctr:1, lab:1, atoms:[A('label','時間')] },
                            { ctr:1, lab:1, atoms:[A('label','流程')] },
                            { ctr:1, lab:1, atoms:[A('label','講者')] }] },
    f_row:   { nm:'一般列', ds:'時間＋流程＋講者', shape:[1,1,1],
               cells:() => [{ ctr:1, atoms:[A('time')] },
                            { atoms:[A('text')] },
                            { ctr:1, atoms:[A('text','講者名稱')] }] },
    f_wide:  { nm:'滿版列', ds:'時間＋一格橫跨後兩欄', shape:[1,2],
               cells:() => [{ ctr:1, atoms:[A('time')] },
                            { cs:2, ctr:1, atoms:[A('text')] }] },
    f_div:   { nm:'分隔列', ds:'一格橫跨整排（如：中場休息）', shape:[3],
               cells:() => [{ cs:3, ctr:1, lab:1, atoms:[A('topic','分隔標題')] }] },
    f_part:  { nm:'章節分隔列', ds:'跨整排的章節大標（Part 1／Part 2）', shape:[3],
               cells:() => [{ cs:3, ctr:1, lab:1, atoms:[A('part')] }] },
    f_dual:  { nm:'雙軌列', ds:'時間＋左右兩軌各自條列', shape:[1,1,1],
               cells:() => [{ ctr:1, atoms:[A('time')] },
                            { cs:2, pad0:1, sub:[
                              { atoms:[A('label','左軌標題'), BUL('bullets', 2)] },
                              { atoms:[A('label','右軌標題'), BUL('bullets', 3)] }] }] },
    f_group: { nm:'主題組', ds:'時間格跨列＋多個主題（跨列已包好）', shape:[1,1,1], group:3,
               sub:() => [{ atoms:[A('topic'), BUL('bullets', 2), A('practice')] },
                          { ctr:1, atoms:[{ t:'speaker', brand:'品牌', name:'姓名' }] }],
               lead:() => ({ ctr:1, atoms:[A('time'), A('topic','主題組標題')] }) },

    /* 賣家顧問 */
    c_badge: { nm:'顧問卡（賣家共創）', ds:'圓形照片＋名稱＋介紹，含共創貼片', mode:'card', badge:1, shape:[1,2],
               cells:() => [{ atoms:[{ t:'photo', v:'' }] },
                            { atoms:[A('cname'), BUL('cbullets', 3)] }] },
    c_card:  { nm:'顧問卡', ds:'圓形照片＋名稱＋介紹', mode:'card', shape:[1,2],
               cells:() => [{ atoms:[{ t:'photo', v:'' }] },
                            { atoms:[A('cname'), BUL('cbullets', 3)] }] },
    c_lect:  { nm:'講師經歷大卡', ds:'照片＋頭銜姓名＋經歷／評價兩組條列', mode:'card', shape:[1,1,1],
               cells:() => [{ ava:1, atoms:[{ t:'photo', v:'' }, A('cname','講師名'), A('note','頭銜描述一行')] },
                            { ava:0, atoms:[A('label','講師經歷'), BUL('cbullets', 3)] },
                            { ava:0, atoms:[A('label','特點評價'), BUL('cbullets', 2)] }] },
    c_grid:  { nm:'並排小卡列', ds:'三張並排小卡：LOGO＋名稱＋重點條列（含佔位卡）',
               mode:'card', shape:[1,1,1],
               cells:() => [{ ava:0, atoms:[A('icon'), A('cname','賣家名稱一'), BUL('sqbul', 2)] },
                            { ava:0, atoms:[A('icon'), A('cname','賣家名稱二'), BUL('sqbul', 2)] },
                            { ava:0, atoms:[A('icon'), A('cname','（佔位卡）名單即將公布')] }] },
    c_subhead:{ nm:'子分類標題列', ds:'跨整排的小標（如：直播／短影音）', mode:'plain', shape:[1],
               cells:() => [{ atoms:[A('slogan','子分類標題')] }] },
    c_more:  { nm:'尾註列', ds:'跨整排一行白字尾註', mode:'plain', shape:[1],
               cells:() => [{ atoms:[A('wnote','更多名單陸續公布中......')] }] },

    /* 活動資訊 */
    i_row: { nm:'資訊列', ds:'標籤＋內容（日期、時間、地點…）', shape:[1,2],
             cells:() => [{ lab:1, ctr:1, atoms:[A('label','標籤')] },
                          { ctr:1, atoms:[A('text','內容文字')] }] },
    i_fee: { nm:'費用列', ds:'標籤＋注意說明＋票價（可多行）', shape:[1,2],
             cells:() => [{ lab:1, ctr:1, atoms:[A('label','費用')] },
                          { ctr:1, atoms:[A('star','注意提醒文字'),
                                          A('text','票種一：$0,000 / 人\n票種二：$000 / 人')] }] },
    i_hot: { nm:'強調列', ds:'橫跨整排的橘色大字', shape:[3],
             cells:() => [{ cs:3, ctr:1, atoms:[A('price','強調大字內容')] }] },
    i_dual: { nm:'雙週資訊列', ds:'標籤欄＋兩週各自內容', shape:[1,1,1],
              cells:() => [{ lab:1, ctr:1, atoms:[A('label','標籤')] },
                           { pad0:1, subCols:'1fr 1fr', subNames:['第一週','第二週'],
                             sub:[{ ctr:1, atoms:[A('text','第一週內容')] },
                                  { ctr:1, atoms:[A('text','第二週內容')] }] }] },
    i_reward: { nm:'任務獎勵列', ds:'左側圖示＋獎勵說明', shape:[1,2],
                cells:() => [{ ctr:1, atoms:[A('icon')] },
                             { ctr:1, atoms:[A('text','完成任務享獎勵示意文字')] }] },

    /* 注意事項 */
    n_bullets: { nm:'條列組', ds:'白色圓點條列（一行一條）', mode:'plain', shape:[1],
                 cells:() => [{ atoms:[BUL('wbullets', 3)] }] },
    n_contact: { nm:'聯絡資訊', ds:'兩行白字（說明＋帳號/信箱）', mode:'plain', shape:[1],
                 cells:() => [{ atoms:[A('wtext','說明文字\n聯絡帳號或信箱')] }] },

    /* 課程時程（週次課表） */
    w_week: { nm:'週次組', ds:'左欄日期時間＋右欄週次主題與大綱', shape:[1,2],
              cells:() => [{ lab:1, ctr:1, atoms:[A('time','日期：0/00(週)\n時間：00:00–00:00')] },
                           { atoms:[A('topic','WeekN 週次主題'), BUL('sqbul', 3)] }] },

    /* 適合對象 */
    a_body:  { nm:'條列內文', ds:'條列（建議最多六項）', shape:[1],
               cells:() => [{ atoms:[BUL('bullets', 3)] }] },
    a_icons: { nm:'icon 對卡', ds:'兩張並排：圖示＋一句描述', shape:[1,1],
               cells:() => [{ pad0:1, subCols:'1fr 1fr', subNames:['卡一','卡二'],
                 sub:[{ ctr:1, atoms:[A('icon'), A('text','對象描述一')] },
                      { ctr:1, atoms:[A('icon'), A('text','對象描述二')] }] }] },
    a_check: { nm:'勾叉列', ds:'✓ 適合／✗ 不建議 兩欄對照', shape:[1,1],
               cells:() => [{ pad0:1, subCols:'1fr 1fr', subNames:['適合','不建議'],
                 sub:[{ atoms:[BUL('okbul', 2)] },
                      { atoms:[BUL('ngbul', 2)] }] }] },

    /* 討論主題 */
    p_topic: { nm:'主題橫條', ds:'一題一條的主題列', shape:[1],
               cells:() => [{ ctr:1, atoms:[A('topic','討論主題示意？')] }] },
    p_note:  { nm:'免責小字', ds:'跨整排白色小字說明', mode:'plain', shape:[1],
               cells:() => [{ atoms:[A('wnote','此為初步規劃，實際內容以後續公告為主')] }] },
    p_wait:  { nm:'佔位列', ds:'整區佔位：敬請期待', mode:'plain', shape:[1],
               cells:() => [{ atoms:[A('slogan','主題整理中，敬請期待')] }] },

    /* 活動花絮 */
    g_grid: { nm:'照片四格', ds:'2×2 照片格（檔名可留白，走素材包配對）', shape:[1,1],
              cells:() => [{ pad0:1, subCols:'1fr 1fr',
                subNames:['照片一','照片二','照片三','照片四'],
                sub:[{ atoms:[A('pic')] }, { atoms:[A('pic')] },
                     { atoms:[A('pic')] }, { atoms:[A('pic')] }] }] },

    /* 合作品牌 */
    b_card:   { nm:'品牌卡', ds:'LOGO＋品牌名稱與介紹', shape:[1,2],
                cells:() => [{ ctr:1, atoms:[A('pic')] },
                             { atoms:[A('cname','品牌名稱'),
                                      A('text','品牌介紹段落示意，\n兩到四行說明文字。')] }] },
    b_points: { nm:'重點條列', ds:'標籤欄＋重點條列', shape:[1,2],
                cells:() => [{ lab:1, ctr:1, atoms:[A('label','品牌亮點')] },
                             { atoms:[BUL('sqbul', 3)] }] },
    b_pics:   { nm:'示意圖兩欄', ds:'跨整排並排兩張示意圖', shape:[1,1],
                cells:() => [{ cs:2, pad0:1, subCols:'1fr 1fr', subNames:['示意圖一','示意圖二'],
                  sub:[{ atoms:[A('pic')] }, { atoms:[A('pic')] }] }] },

    /* ---------- 容器積木（ct_*）：線上編輯器用的「空殼列」 ----------
       上面那 43 個是「常用組合範本」（從七檔真實活動反推的），這幾個是最小單位：
       先放一個容器，再自己往格子裡塞語意角色。cells 接得到區段欄軌數 n，
       所以同一個容器在 1 欄／2 欄／3 欄的區段都排得對。
       刻意不掛進任何區段的 cards：ms-editor 的積木盤不列它們，
       只有線上編輯器從 XD.packs.ms.containers 讀。 */
    ct_full:  { nm:'滿版一格', ds:'一格橫跨整排', ct:1, shape:[3],
                cells:(n) => [{ cs:n || 1, ctr:1, atoms:[A('text')] }] },
    ct_cols:  { nm:'逐欄一格', ds:'每個欄軌各一格', ct:1, shape:[1,1,1],
                cells:(n) => Array.from({ length: n || 1 }, () => ({ atoms:[A('text')] })) },
    ct_label: { nm:'標籤＋內容', ds:'左邊標籤格＋右邊內容格', ct:1, shape:[1,2],
                cells:(n) => (n || 1) < 2
                  ? [{ atoms:[A('label'), A('text')] }]
                  : [{ lab:1, ctr:1, atoms:[A('label')] }, { cs:(n - 1), atoms:[A('text')] }] },
    ct_split2:{ nm:'一格切二', ds:'整排一格，內部再分兩欄', ct:1, shape:[1,1],
                cells:(n) => [{ cs:n || 1, pad0:1, subCols:'1fr 1fr', subNames:['左','右'],
                  sub:[{ atoms:[A('text')] }, { atoms:[A('text')] }] }] },
    ct_split3:{ nm:'一格切三', ds:'整排一格，內部再分三欄', ct:1, shape:[1,1,1],
                cells:(n) => [{ cs:n || 1, pad0:1, subCols:'1fr 1fr 1fr', subNames:['左','中','右'],
                  sub:[{ atoms:[A('text')] }, { atoms:[A('text')] }, { atoms:[A('text')] }] }] },
    ct_plain: { nm:'無框文字', ds:'不畫表格線，直接落在藍底上', ct:1, mode:'plain', shape:[1],
                cells:() => [{ atoms:[A('hbody')] }] },
    ct_card:  { nm:'卡片列', ds:'獨立圓角卡：照片欄＋內容欄', ct:1, mode:'card', shape:[1,2],
                cells:() => [{ ava:1, atoms:[{ t:'photo', v:'' }] },
                             { atoms:[A('cname'), BUL('cbullets', 2)] }] },
  };

  /* 膠囊標題不屬於任何區段：不進 cards、不進 full。
     要加標題就從「加一段」的「通用」拿一塊，加在哪、加幾顆、要不要加都自己決定。
     full＝新增區段與「整張表」用的同一份清單（兩邊必須一致）。 */
  Object.keys(sections).forEach(k => {
    const sd = sections[k];
    sd.full = (sd.demo || []).slice();
    if (!sd.kv) sd.demo = ['x_pill'].concat(sd.demo);
  });

  /* 通用積木：不屬於任何區段，哪個區段裡都能加 */
  const commons = ['x_pill'];

  /* 線上編輯器的容器清單（順序＝積木盤顯示順序） */
  const containers = ['ct_full','ct_cols','ct_label','ct_split2','ct_split3','ct_plain','ct_card'];

  /* ---------- 假字預設整頁：七區段、各自帶 demo 列型 ---------- */
  function templateDefault() {
    const mkRows = type => {
      const sd = sections[type];
      const nCol = (sd.cols || ['1fr']).length;
      const ctx = { title: sd.title || sd.nm };
      return (sd.demo || []).map(pid => {
        const p = presets[pid];
        if (p.group) {
          const gid = XD.uid('g');
          return Array.from({ length: p.group }, (_, i) =>
            ({ id: XD.uid(), preset: pid, gid, lead: i === 0 ? p.lead() : null, cells: p.sub() }));
        }
        return [{ id: XD.uid(), preset: pid, cells: p.cells(nCol, ctx) }];
      }).flat();
    };
    return ['kv', 'highlight', 'ticket', 'flow', 'consultant', 'info', 'notice'].map(type =>
      ({ iid: XD.uid('s'), type, title: sections[type].title || sections[type].nm, rows: mkRows(type) }));
  }

  XD.packs.ms = { sections, presets, commons, containers, templateDefault };
})();
