/* =========================================================
   bn-workorder.js — 手工 BN 工單解析（錨點式，不用任何固定儲存格位址）

   為什麼不用位址：蝦大的工單是手工排版，每檔活動的欄列位置都不同
   （實測跨三個活動的工單，同一版位落在完全不同的儲存格）。
   所以一律用「標籤錨點 + 相對位移」定位。支援兩種來源格式：

   ① 表格式（2026-09 新版，較穩定，優先偵測）
      表頭列：版位名稱｜尺寸｜KB數限制｜勾選需要版位（欄位順序找標籤決定，不寫死欄號）
      每列＝一個版位，「尺寸」欄是純 WxH（不含「尺寸：」字樣），
      「勾選需要版位」是布林格——這欄直接決定 on 清單，不用再用「有沒有找到」去猜。
      文案是全域一份：案型 主標/副標/小字/CTA（＋獨立的 AR案型 覆蓋 AR 版位的文案）。
      2026-09 再更新：加了「廠商LOGO1/2（請填圖片檔名）」——這是素材包裡對應圖片的
      實際檔名，不是文案，用來跟上傳的素材包做精準比對（見 bn-editor.html）；
      「人物圖片N」先收著（personImageNames），定位範圍待補。
      2026-09 第三次更新：加了「主題」欄（themeName，跟 packs/bn/themes.js 的主題名稱
      對應，匯入時自動選主題）；廠商LOGO 從寫死「LOGO1/LOGO2」兩欄改成可重複列
      （findAllLabelValues，不限數量）——廠商LOGO／人物圖片都是「同活動同數量同圖，
      套用到所有勾選版位」，數量依主題設計（主題A橫排固定2個、主題B圓圈可能3個+），
      欄位本身不用跟著主題改，新舊工單格式（LOGO1/LOGO2 vs 不編號的多列 LOGO）都吃得到。

   ② 自由格式（舊版）：
      錨點①「尺寸：W x H」 → 一個版位區塊的起點，尺寸即與 packs/bn 對位的鍵
      錨點②「設計建議」     → 文案區塊開始（可有可無，跳過即可）
      錨點③「主/副 + 分隔符」→ 文案行；分隔符容錯 : ： - － — –
      錨點④「CTA」          → 該格右鄰或下鄰即 CTA 文字
      終止子「X：N張」或下一個「尺寸：」→ 區塊結束（避免吃到隔壁版位）
      文案可能同格多行或拆成上下相鄰數格 → 續行合併；同尺寸重複時留最完整的一筆。
   ========================================================= */
(function () {
  'use strict';
  const XD = window.XD;
  const bw = (XD.bnWorkorder = {});

  const SEP = '[:：\\-－—–~〜]';
  const RE_MAIN   = new RegExp('^\\s*(?:主標題|主標|主|main)\\s*' + SEP + '\\s*(.+?)\\s*$', 'i');
  const RE_SUB    = new RegExp('^\\s*(?:副標題|副標|副|sub)\\s*'  + SEP + '\\s*(.+?)\\s*$', 'i');
  const RE_SIZE   = /尺寸\s*[:：]?\s*(\d{2,4})\s*[x*×]\s*(\d{2,4})/i;
  const RE_SIZE_BARE = /(\d{2,4})\s*[x*×]\s*(\d{2,4})/i;      /* 表格式：尺寸欄自己就是 WxH，沒有「尺寸」字樣 */
  const RE_CTA    = /^\s*CTA\s*$/i;
  const RE_ADVICE = /^\s*設計建議\s*$/;
  const RE_COUNT  = /[:：]\s*\d+\s*張/;              /* 「SU BN：3張」= 新區塊標題 */

  const SCAN_DOWN = 8, SCAN_RIGHT = 3, SCAN_UP = 4;

  function cellText(v) {
    if (v == null) return '';
    if (typeof v === 'object') {
      if (v.richText) return v.richText.map(t => t.text).join('');
      if (v.text != null) return String(v.text);
      if (v.result != null) return String(v.result);
      if (v.formula != null) return '';
      return '';
    }
    return String(v);
  }
  const at = (ws, r, c) => (r < 1 || c < 1) ? '' : cellText(ws.getCell(r, c).value).trim();
  const rawAt = (ws, r, c) => (r < 1 || c < 1) ? null : ws.getCell(r, c).value;

  function themeKey(s) {
    return String(s).normalize('NFC').replace(/\s/g, '')
      .replace(/[０-９]/g, ch => String(ch.charCodeAt(0) - 0xFF10))
      .replace(/[－‐‑‒–—―～〜~]/g, '-')
      .replace(/^(?:主題|theme)/i, '').toLowerCase();
  }
  bw.themeKey = themeKey;

  function buildSizeMap(boards) {
    const m = {};
    (boards || []).forEach(b => {
      m[b.w + 'x' + b.h] = b.id;
      if (b.deliverW) m[b.deliverW + 'x' + b.deliverH] = b.id;
    });
    return m;
  }

  /* ---------------------------------------------------------
     ① 表格式：找表頭列，欄位順序不寫死——掃整列找標籤字樣定位欄號
     --------------------------------------------------------- */
  function findTableHeader(ws) {
    const maxR = ws.rowCount || 0, maxC = Math.max(ws.columnCount || 0, 1);
    for (let r = 1; r <= maxR; r++) {
      let nameCol = null, sizeCol = null, kbCol = null, checkCol = null;
      for (let c = 1; c <= maxC; c++) {
        const v = at(ws, r, c);
        if (!v) continue;
        if (/^版位名稱$/.test(v)) nameCol = c;
        else if (/^尺寸$/.test(v)) sizeCol = c;
        else if (/KB數?限制/.test(v)) kbCol = c;
        else if (/勾選.*版位|需要.*版位/.test(v)) checkCol = c;
      }
      if (nameCol && sizeCol) return { row: r, nameCol, sizeCol, kbCol, checkCol };
    }
    return null;
  }

  function cellChecked(ws, r, c) {
    const raw = rawAt(ws, r, c);
    if (raw === true) return true;
    if (raw === false || raw == null) return false;
    return /^(true|v|✓|y|yes|是|需要)$/i.test(String(raw).trim());
  }

  function parseTableRows(ws, header) {
    const maxR = ws.rowCount || 0;
    const rows = [];
    let blank = 0;
    for (let r = header.row + 1; r <= maxR; r++) {
      const nm = at(ws, r, header.nameCol);
      const szRaw = at(ws, r, header.sizeCol);
      if (!nm && !szRaw) { blank++; if (blank >= 3) break; continue; }
      blank = 0;
      const m = szRaw.match(RE_SIZE_BARE);
      if (!m) continue;
      rows.push({
        name: nm || null, w: +m[1], h: +m[2],
        kb: header.kbCol ? (at(ws, r, header.kbCol) || null) : null,
        checked: header.checkCol ? cellChecked(ws, r, header.checkCol) : true,
        at: ws.name + '!' + ws.getCell(r, header.nameCol).address,
      });
    }
    return rows;
  }

  /* 在整張表找「標籤：值」——值取同一列標籤右邊第一個非空格 */
  function findLabelValue(ws, labelRe) {
    const maxR = ws.rowCount || 0, maxC = Math.max(ws.columnCount || 0, 1);
    for (let r = 1; r <= maxR; r++) {
      for (let c = 1; c <= maxC; c++) {
        const v = at(ws, r, c);
        if (!v || !labelRe.test(v)) continue;
        for (let cc = c + 1; cc <= maxC; cc++) {
          const vv = at(ws, r, cc);
          if (vv) return vv;
        }
      }
    }
    return null;
  }

  /* 主題欄專用：保留 ExcelJS 原始 Date 與該格格式，其餘欄位仍走 cellText。 */
  function findLabelRawValue(ws, labelRe) {
    const maxR = ws.rowCount || 0, maxC = Math.max(ws.columnCount || 0, 1);
    for (let r = 1; r <= maxR; r++) {
      for (let c = 1; c <= maxC; c++) {
        const v = at(ws, r, c);
        if (!v || !labelRe.test(v)) continue;
        for (let cc = c + 1; cc <= maxC; cc++) {
          const value = rawAt(ws, r, cc);
          if (value !== null && value !== undefined && value !== '')
            return { value, numFmt: ws.getCell(r, cc).numFmt };
        }
      }
    }
    return null;
  }

  function themeDateOf(raw) {
    if (!raw || !(raw.value instanceof Date)) return null;
    const m = raw.value.getMonth() + 1, d = raw.value.getDate();
    const fmt = String(raw.numFmt || '').replace(/"(?:[^"]|"")*"/g, '').toLowerCase();
    const mi = fmt.indexOf('m'), di = fmt.indexOf('d');
    const order = mi < 0 || di < 0 ? null : mi < di ? 'md' : 'dm';
    const candidates = [...new Set(order === 'md' ? [m + '-' + d]
      : order === 'dm' ? [d + '-' + m] : [m + '-' + d, d + '-' + m])];
    return { m, d, order, candidates };
  }

  /* 同 findLabelValue，但收集「所有」符合的列（同一個標籤可能出現多次，例如人物圖片1/2） */
  function findAllLabelValues(ws, labelRe) {
    const maxR = ws.rowCount || 0, maxC = Math.max(ws.columnCount || 0, 1);
    const out = [];
    for (let r = 1; r <= maxR; r++) {
      for (let c = 1; c <= maxC; c++) {
        const v = at(ws, r, c);
        if (!v || !labelRe.test(v)) continue;
        for (let cc = c + 1; cc <= maxC; cc++) {
          const vv = at(ws, r, cc);
          if (vv) { out.push(vv); break; }
        }
      }
    }
    return out;
  }

  function parseTable(ws, boards) {
    const header = findTableHeader(ws);
    if (!header) return null;
    const rows = parseTableRows(ws, header);
    if (!rows.length) return null;

    const sizeMap = buildSizeMap(boards);
    const main = findLabelValue(ws, /^主標題?$/);
    const sub  = findLabelValue(ws, /^副標題?$/);
    const small = findLabelValue(ws, /^小字$/);
    const cta  = findLabelValue(ws, /^CTA$/i);
    const arText = findLabelValue(ws, /^AR案型$/);
    /* 主題＝跟 packs/bn/themes.js 的主題名稱/代號對應（如「主題A」），匯入時用來自動選主題。
       廠商LOGO／人物圖片都是「同活動同數量同圖，套用到所有勾選版位」，不是逐版位各自不同，
       所以用可重複列收集（不寫死1/2兩欄）——數量跟著主題設計走：主題A的橫排固定2個，
       主題B這種圍繞人物照片的圓圈可能是3個或更多，欄位本身不用跟著主題改。
       這裡的正規表達式不加開頭^結尾$錨定，「廠商LOGO1」「廠商LOGO2」（舊工單）跟
       「廠商LOGO」（新工單，可重複列）都吃得到，新舊格式都相容。 */
    const themeName = findLabelValue(ws, /^主題$/);
    const themeDate = themeName ? null : themeDateOf(findLabelRawValue(ws, /^主題$/));
    const vendorLogoNames = findAllLabelValues(ws, /廠商LOGO/i).filter(Boolean);
    const personImageNames = findAllLabelValues(ws, /人物圖片/).filter(Boolean);
    /* 蝦皮直播 LOGO：預設不畫，工單明講要才畫（使用者 2026-09-11 指示）。
       目前的工單範本還沒有這一列，所以絕大多數情況會是 null＝不畫；
       之後在工單加一列「蝦皮直播」並填 Y／是／V／TRUE 之類就會打開。
       回傳三態：true＝要、false＝明講不要、null＝工單沒提到（編輯器當成不要，
       但不會覆蓋掉使用者在畫面上手動打開的狀態）。 */
    const liveRaw = findLabelValue(ws, /蝦皮直播/);
    const liveLogo = (liveRaw === null || liveRaw === undefined || liveRaw === '')
      ? null : /^(y|yes|t|true|是|要|v|✓|1|o)$/i.test(String(liveRaw).trim());

    const placements = rows.map(r => {
      const boardId = sizeMap[r.w + 'x' + r.h] || null;
      const isAR = boardId === 'AR' || /^AR$/i.test(r.name || '');
      return {
        w: r.w, h: r.h, name: r.name, boardId, checked: r.checked, kb: r.kb, at: r.at,
        main: isAR ? arText : main,
        sub:  isAR ? null : sub,
        cta:  isAR ? null : cta,
        extra: (!isAR && small) ? [small] : [],
      };
    });

    const checkedMatched = placements.filter(p => p.checked && p.boardId);
    const checkedUnmatched = placements.filter(p => p.checked && !p.boardId);
    const warnings = [];
    if (checkedUnmatched.length)
      warnings.push('有 ' + checkedUnmatched.length + ' 個勾選的版位對不到目前的版位資料：' +
                    checkedUnmatched.map(p => (p.name || '?') + '（' + p.w + '×' + p.h + '）').join('、'));

    const onIds = checkedMatched.map(p => p.boardId).filter((v, i, a) => a.indexOf(v) === i);
    const asVote = (v, n) => v ? { value: v, votes: n, candidates: 1 } : null;

    return {
      placements,
      onIds,                          /* 表格式有明確勾選，直接用，不用再從「有沒有找到」去猜 */
      consensus: {
        main: asVote(main, checkedMatched.length),
        sub:  asVote(sub, checkedMatched.length),
        cta:  asVote(cta, checkedMatched.length),
        extra: small ? { value: small, votes: checkedMatched.length } : null,
      },
      themeName,
      themeDate,
      vendorLogoNames,
      personImageNames,
      liveLogo,
      /* AR 版位的文案是獨立一格「AR案型」，不跟其他版位共用主標/副標，
         所以除了塞進 placements 的逐版位資料，也抬到頂層讓編輯器直接取用。 */
      arText: arText || null,
      warnings,
    };
  }

  /* ---------------------------------------------------------
     ② 自由格式（舊版，沿用）
     --------------------------------------------------------- */
  function parseCopyLine(text) {
    const out = { main: null, sub: null, extra: [] };
    text.split('\n').forEach(raw => {
      const ln = raw.trim();
      if (!ln) return;
      let m = RE_MAIN.exec(ln);
      if (m) { out.main = m[1]; return; }
      m = RE_SUB.exec(ln);
      if (m) { out.sub = m[1]; return; }
      out.extra.push(ln);
    });
    return out;
  }

  function labelAbove(ws, r, c) {
    for (let d = 1; d <= SCAN_UP; d++) {
      const v = at(ws, r - d, c);
      if (!v) continue;
      if (RE_SIZE.test(v) || RE_ADVICE.test(v) || RE_CTA.test(v)) continue;
      const first = v.split('\n')[0];
      if (RE_MAIN.test(first) || RE_SUB.test(first)) continue;
      return v.replace(RE_COUNT, '').replace(/\s+$/, '').trim();
    }
    return null;
  }

  function parseFreeform(ws, boards) {
    const sizeMap = buildSizeMap(boards);
    const found = [];
    const maxR = ws.rowCount || 0, maxC = Math.max(ws.columnCount || 0, 1);
    for (let r = 1; r <= maxR; r++) {
      for (let c = 1; c <= maxC; c++) {
        const v = at(ws, r, c);
        if (!v) continue;
        const m = RE_SIZE.exec(v);
        if (!m) continue;
        const w = +m[1], h = +m[2];
        if (w < 90 || h < 90 || w > 2400 || h > 2400) continue;

        const rec = { w, h, name: labelAbove(ws, r, c), main: null, sub: null,
                      extra: [], cta: null, boardId: sizeMap[w + 'x' + h] || null,
                      at: ws.name + '!' + ws.getCell(r, c).address };

        let started = false;
        for (let d = 1; d <= SCAN_DOWN; d++) {
          const nv = at(ws, r + d, c);
          if (!nv) { if (started) break; continue; }
          if (RE_SIZE.test(nv) || RE_COUNT.test(nv)) break;
          if (RE_ADVICE.test(nv) || RE_CTA.test(nv)) continue;
          const blk = parseCopyLine(nv);
          if (blk.main || blk.sub) {
            started = true;
            if (blk.main && !rec.main) rec.main = blk.main;
            if (blk.sub && !rec.sub) rec.sub = blk.sub;
            rec.extra = rec.extra.concat(blk.extra);
          } else if (started) break;
          else if (!rec.extra.length) rec.extra = blk.extra;
        }

        for (let d = 1; d <= SCAN_DOWN && !rec.cta; d++) {
          for (let dc = 0; dc <= 2 && !rec.cta; dc++) {
            if (!RE_CTA.test(at(ws, r + d, c + dc))) continue;
            for (let k = 1; k <= SCAN_RIGHT; k++) {
              const t = at(ws, r + d, c + dc + k);
              if (t && !RE_CTA.test(t)) { rec.cta = t; break; }
            }
            if (!rec.cta) {
              const t = at(ws, r + d + 1, c + dc);
              if (t && !RE_CTA.test(t) && !RE_SIZE.test(t)) rec.cta = t;
            }
          }
        }
        found.push(rec);
      }
    }
    if (!found.length) return null;

    const best = {};
    found.forEach(r => {
      const k = r.w + 'x' + r.h;
      const score = (r.main ? 1 : 0) + (r.sub ? 1 : 0) + (r.cta ? 1 : 0) + (r.name ? .5 : 0);
      if (!best[k] || score > best[k].score) best[k] = { score, rec: r };
    });
    const placements = Object.keys(best).map(k => best[k].rec)
      .sort((a, b) => (b.w * b.h) - (a.w * a.h));

    const vote = key => {
      const cnt = {};
      placements.forEach(p => { if (p[key]) cnt[p[key]] = (cnt[p[key]] || 0) + 1; });
      const ks = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]);
      return ks.length ? { value: ks[0], votes: cnt[ks[0]], candidates: ks.length, all: cnt } : null;
    };
    const extraCnt = {};
    placements.forEach(p => p.extra.forEach(e => { extraCnt[e] = (extraCnt[e] || 0) + 1; }));
    const extraTop = Object.keys(extraCnt).sort((a, b) => extraCnt[b] - extraCnt[a])[0] || null;

    const unmatched = placements.filter(p => !p.boardId);
    const warnings = [];
    if (unmatched.length)
      warnings.push('有 ' + unmatched.length + ' 個尺寸對不到已知版位：' +
                    unmatched.map(p => p.w + '×' + p.h).join('、'));

    return {
      placements,
      onIds: placements.filter(p => p.boardId).map(p => p.boardId),   /* 舊格式沒有勾選欄，找到的都視為要 */
      arText: null,                 /* 舊的自由格式工單沒有「AR案型」這一格 */
      consensus: { main: vote('main'), sub: vote('sub'), cta: vote('cta'),
                   extra: extraTop ? { value: extraTop, votes: extraCnt[extraTop] } : null },
      themeName: null,       /* 自由格式（舊工單）沒有這些欄位 */
      themeDate: null,
      vendorLogoNames: [],
      personImageNames: [],
      liveLogo: null,        /* null＝工單沒提到，編輯器維持現狀（預設不畫） */
      warnings,
    };
  }

  /* ---------------------------------------------------------
     入口：逐分頁嘗試表格式，沒有才退回自由格式；不看分頁名稱
     （新版檔案分頁已直接叫「BN」，但兩種格式都可能出現在任何分頁名下，
     偵測邏輯本身已經夠嚴謹，不用再靠分頁名稱把關）
     --------------------------------------------------------- */
  bw.parse = async function (arrayBuffer, boards) {
    if (typeof ExcelJS === 'undefined') throw new Error('ExcelJS 尚未載入（需要連網）');
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(arrayBuffer);

    let result = null, format = null;
    wb.eachSheet(ws => {
      if (result) return;
      const t = parseTable(ws, boards);
      if (t) { result = t; format = 'table'; return; }
    });
    if (!result) {
      wb.eachSheet(ws => {
        if (result) return;
        const f = parseFreeform(ws, boards);
        if (f) { result = f; format = 'freeform'; }
      });
    }
    if (!result) {
      return { placements: [], onIds: [], arText: null,
               consensus: { main: null, sub: null, cta: null, extra: null },
               themeName: null, themeDate: null, vendorLogoNames: [], personImageNames: [],
               warnings: ['這份檔案讀不到任何版位資料（找不到「尺寸」欄或「尺寸：WxH」格式）'] };
    }
    result.format = format;
    return result;
  };
})();
