/* =========================================================
   flow-engine.js — 內容驅動高度的區段渲染引擎
   （BODA schema-renderer 是絕對定位，不能用於 flow，故新寫）

   一個區段 = 連續的列（row），每列來自一個列型 preset。
   preset.mode 決定列的呈現面：
     grid  （預設）連續表格：欄軌全表共用，表格線＝容器底色+gap 透出
     plain  無框列：文字直接落在頁底上（亮點、注意事項、表外註記）
     card   卡片列：每列一張獨立圓角卡（顧問牆）
   連續同 mode 的列會合成一個 batch 一起畫；
   跨列（group/lead）只會發生在 grid batch 內。
   ========================================================= */
(function () {
  'use strict';
  const XD = window.XD;
  const flow = (XD.flow = {});

  /* ---------- 分批 ---------- */
  flow.batches = function (rows, presets) {
    const out = [];
    rows.forEach((row, i) => {
      const mode = (presets[row.preset] || {}).mode || 'grid';
      const last = out[out.length - 1];
      if (last && last.mode === mode) { last.rows.push(row); last.idx.push(i); }
      else out.push({ mode, rows: [row], idx: [i] });
    });
    return out;
  };

  /* ---------- 佔用表（grid batch 內） ----------
     算出每個 cell 的欄位、跨欄、跨列；lead 格向下跨滿整組。 */
  flow.place = function (rows, nCol) {
    const occ = [], out = [];
    const take = (r, c, rs, cs) => { for (let i = r; i < r + rs; i++) { occ[i] = occ[i] || [];
                                     for (let j = c; j < c + cs; j++) occ[i][j] = true; } };
    rows.forEach((row, r) => {
      occ[r] = occ[r] || [];
      const items = [];
      if (row.lead) {
        const span = rows.filter(x => x.gid === row.gid).length;
        items.push({ cell: row.lead, col: 0, cs: 1, rs: span, row, isLead: true, r });
        take(r, 0, span, 1);
      }
      let c = 0;
      row.cells.forEach(cell => {
        while (occ[r][c]) c++;
        const cs = Math.min(cell.cs || 1, nCol - c);
        items.push({ cell, col: c, cs, rs: 1, row, r });
        take(r, c, 1, cs);
        c += cs;
      });
      out.push({ r, row, items });
    });
    return out;
  };

  /* ---------- 還原點 ---------- */
  flow.stampDef = function (row) {
    if (row.lead && !row.lead._def) row.lead._def = XD.clone(row.lead.atoms);
    row.cells.forEach(c => {
      if (c.sub) c.sub.forEach(x => { if (!x._def) x._def = XD.clone(x.atoms); });
      else if (!c._def) c._def = XD.clone(c.atoms);
    });
  };

  /* ---------- 渲染 ---------- */
  /* 列內子網格：欄數／欄寬由列型自帶的 cell.subCols 決定（沒寫＝沿用雙軌列的 1fr 1fr）。
     這是「欄軌由區段固定」的例外，也是唯一的例外：子網格只活在單一格內、
     不影響區段欄軌，所以 icon 三卡／等式列／並排小卡這類列型不必為它改欄軌。 */
  const subStyle = c => c.subCols ? ' style="grid-template-columns:' + c.subCols + '"' : '';
  /* 子格與外層格共用同一組旗標（lab／ctr／pad0），子格不自動吃 pad0 */
  const cellCls = (c, outer) => ['cell', c.lab && 'lab', c.ctr && 'ctr',
    ((outer && c.sub) || c.pad0) && 'pad0'].filter(Boolean).join(' ');

  /* data-cell＝格位址 [iid|rowId|ci|si]，線上編輯器靠它做「在這一格加欄位」 */
  const cellAddr = (iid, rowId, ci, si) => [iid, rowId, ci, si == null ? '' : si].join('|');

  function subgridHTML(c, di, extraCls, live, iid, rowId, ci) {
    return '<div class="subgrid' + (extraCls ? ' ' + extraCls : '') + '"' + subStyle(c) + '>' +
      c.sub.map((sx, si) => '<div class="' + cellCls(sx) + '"' +
        (live ? ' data-cell="' + cellAddr(iid, rowId, ci, si) + '"' : '') + '>' +
        sx.atoms.map((a, ai) => XD.atomHTML(a, di(ai, si), live)).join('') + '</div>').join('') + '</div>';
  }

  function cellHTML(it, iid, editable, live) {
    const c = it.cell, row = it.row;
    const ci = it.isLead ? -1 : row.cells.indexOf(c);
    const cls = cellCls(c, true);
    const style = 'grid-column:' + (it.col + 1) + ' / span ' + it.cs +
                  ';grid-row:' + (it.r + 1) + ' / span ' + it.rs + ';';
    const di = (ai, si) => editable ? [iid, row.id, ci, si == null ? '' : si, ai].join('|') : '';
    let inner;
    if (c.sub) {
      inner = subgridHTML(c, di, '', live, iid, row.id, ci);
    } else {
      inner = c.atoms.map((a, ai) => XD.atomHTML(a, di(ai, null), live)).join('');
    }
    /* data-row：讓工具頁能從任何一格反查它屬於哪一列（列選取用）。
       plain 的 .prow 與 card 的 .ccard 本來就有，grid 面補上才三種面一致。 */
    return '<div class="' + cls + '" data-row="' + row.id + '"' +
           (live && !c.sub ? ' data-cell="' + cellAddr(iid, row.id, ci) + '"' : '') +
           ' style="' + style + '">' + inner + '</div>';
  }

  function rowAtomsHTML(row, iid, editable, live) {
    return row.cells.map((c, ci) => {
      const di = (ai, si) => editable ? [iid, row.id, ci, si == null ? '' : si, ai].join('|') : '';
      /* plain 面也吃子網格（亮點的 icon 三卡／等式列／痛點三卡）：
         同一份 cell.sub 結構，只是不畫表格線（.subgrid.plain）。 */
      if (c.sub) return subgridHTML(c, di, 'plain', live, iid, row.id, ci);
      const inner = (c.atoms || []).map((a, ai) => XD.atomHTML(a, di(ai, null), live)).join('');
      return live ? '<div class="pcell" data-cell="' + cellAddr(iid, row.id, ci) + '">' + inner + '</div>'
                  : inner;
    }).join('');
  }

  /* ---------- 區段縮圖 ----------
     兩支工具的左欄都要畫「這個區段長怎樣」。列型積木卡本來就有縮圖，區段卡沒有——
     這是「只看到活動資訊四個字，不知道是幾欄的表」的主因（2026-09-08）。
     px 欄照實際寬度、1fr 平分剩下的，所以縮圖的欄寬比例跟版面上一致。
     face 只是這個區段的代表面（實際的面由列型決定）。 */
  flow.secThumb = function (sdef, opts) {
    const o = opts || {}, W = o.w || 218, H = o.h || 40, pad = 2, gap = 2.5;
    const CARD = '#F3FDFF', LAB = '#FEFBEA', LINE = '#8FB4E8', BLUE = '#2358E6';
    const box = (x, y, w, h, fill, extra) =>
      '<rect x="' + x + '" y="' + y + '" width="' + Math.max(w, 3) + '" height="' + Math.max(h, 3) +
      '" rx="2.5" fill="' + fill + '"' + (extra || '') + '/>';
    const inner = W - pad * 2;
    /* 不畫膠囊——標題不屬於區段，是自己加上去的一塊積木 */
    let body = box(0, 0, W, H, BLUE);
    const top = pad, bh = H - pad * 2;

    if (sdef.kv) {
      body += box(pad, top, inner, bh, CARD, ' opacity=".45"');
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%">' + body + '</svg>';
    }
    if (o.face === 'plain' || sdef.face === 'plain') {
      body += box(pad + inner * .18, top + 1, inner * .64, 5, '#FFF68F');
      body += box(pad + inner * .10, top + 10, inner * .80, 4, CARD, ' opacity=".85"');
      body += box(pad + inner * .22, top + 18, inner * .56, 4, CARD, ' opacity=".85"');
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%">' + body + '</svg>';
    }
    if (sdef.face === 'card') {
      const ch = (bh - gap) / 2;
      [0, 1].forEach(i => {
        const y = top + i * (ch + gap);
        body += box(pad, y, inner, ch, CARD);
        body += '<circle cx="' + (pad + inner * .13) + '" cy="' + (y + ch / 2) + '" r="' +
                Math.min(ch / 2 - 2, 7) + '" fill="' + LINE + '" opacity=".5"/>';
        body += box(pad + inner * .26, y + ch / 2 - 4, inner * .30, 3, LINE, ' opacity=".55"');
        body += box(pad + inner * .26, y + ch / 2 + 1, inner * .55, 3, LINE, ' opacity=".35"');
      });
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%">' + body + '</svg>';
    }
    if (sdef.face === 'photo') {
      const cw = (inner - gap) / 2, ch = (bh - gap) / 2;
      [0, 1].forEach(r => [0, 1].forEach(c => {
        body += box(pad + c * (cw + gap), top + r * (ch + gap), cw, ch, CARD);
      }));
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%">' + body + '</svg>';
    }
    /* grid：欄軌照 1200px 的實際比例攤開，第一欄是固定窄欄就畫成米黃標籤欄 */
    const cols = sdef.cols || ['1fr'];
    const isPx = c => /px$/.test(String(c));
    const fixed = cols.reduce((n, c) => n + (isPx(c) ? parseFloat(c) : 0), 0);
    const frN = cols.filter(c => !isPx(c)).length || 1;
    const rest = Math.max(1200 - fixed, 1);
    const wRaw = cols.map(c => isPx(c) ? parseFloat(c) : rest / frN);
    const total = wRaw.reduce((a, b) => a + b, 0);
    const avail = inner - gap * (cols.length - 1);
    const ch = (bh - gap) / 2;
    const labCol = cols.length > 1 && isPx(cols[0]);
    [0, 1].forEach(r => {
      let x = pad;
      wRaw.forEach((raw, ci) => {
        const w = avail * raw / total;
        body += box(x, top + r * (ch + gap), w, ch, (labCol && ci === 0) ? LAB : CARD);
        x += w + gap;
      });
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%">' + body + '</svg>';
  };

  /* 區段內容（不含外框 chrome，由工具頁包） */
  flow.sectionBodyHTML = function (sec, sdef, presets, opts) {
    const o = opts || {};
    /* KV：無標題，滿版圖片欄（點選或拖入由工具頁接線） */
    if (sdef.kv) {
      /* KV 圖同樣支援「只存 id、dataURL 放 XD.IMAGES」（線上編輯器的 undo 快照才不會扛著整張圖） */
      const kv = sec.kvImg || (sec.kvImgId && XD.IMAGES ? XD.IMAGES[sec.kvImgId] : null);
      if (kv)
        return '<div class="kvwrap has" data-kv="1"><img src="' + kv + '" alt="KV">' +
               '<button class="kvdel" title="移除 KV 圖">✕</button></div>';
      return '<div class="kvwrap" data-kv="1"><div class="kvph"><b>KV 主視覺</b>' +
             '<span>點一下上傳完稿圖，或直接把圖拖進來</span>' +
             '<i>1200 × ' + (sdef.kvH || 550) + '</i></div></div>';
    }
    /* 標題不在這裡畫——2026-09-08 起膠囊是一塊列型積木（x_pill），
       所以「沒有標題」「一顆標題管兩張表」「一個區段兩顆標題」都排得出來。 */
    let html = '';
    if (!sec.rows.length) {
      html += '<div class="empty"><b>這一段還沒有內容</b><span>從側邊選一個列型加進來</span></div>';
      return html;
    }
    sec.rows.forEach(flow.stampDef);
    flow.batches(sec.rows, presets).forEach(batch => {
      if (batch.mode === 'grid') {
        const placed = flow.place(batch.rows, sdef.cols.length);
        html += '<div class="grid" data-batch="1" style="grid-template-columns:' + sdef.cols.join(' ') + '">';
        placed.forEach(p => p.items.forEach(it => { html += cellHTML(it, sec.iid, o.editable, o.live); }));
        html += '</div>';
      } else if (batch.mode === 'card') {
        html += '<div class="cards" data-batch="1">';
        batch.rows.forEach(row => {
          /* badge＝每張卡自己可切換的旗標（row.badge），沒設過才退回列型自帶的預設值
             （c_badge 預設開／c_card 預設關）——不再是「這個列型永遠有/永遠沒有」。 */
          const badge = row.badge != null ? !!row.badge : !!(presets[row.preset] || {}).badge;
          html += '<div class="ccard" data-row="' + row.id + '">' +
                  (badge ? '<div class="cbadge">賣家<br>共創</div>' : '') +
                  /* cava＝固定寬的照片欄。列型可用 cell.ava 明講（並排小卡三格都不是照片欄）；
                     沒寫的沿用「第一格就是照片欄」，舊版面 JSON 不受影響。 */
                  row.cells.map((c, ci) => '<div class="ccol' +
                    ((c.ava != null ? c.ava : ci === 0) ? ' cava' : '') + '"' +
                    (o.live ? ' data-cell="' + cellAddr(sec.iid, row.id, ci) + '"' : '') + '>' +
                    (c.atoms || []).map((a, ai) =>
                      XD.atomHTML(a, o.editable ? [sec.iid, row.id, ci, '', ai].join('|') : '',
                                  o.live)).join('') +
                  '</div>').join('') + '</div>';
        });
        html += '</div>';
      } else { /* plain */
        html += '<div class="plainrun" data-batch="1">';
        batch.rows.forEach(row => {
          /* rowCls＝列型自帶的修飾 class（目前只有膠囊列用來吃它自己的下緣間距） */
          const rc = (presets[row.preset] || {}).rowCls;
          html += '<div class="prow' + (rc ? ' ' + rc : '') + '" data-row="' + row.id + '">' +
                  rowAtomsHTML(row, sec.iid, o.editable, o.live) + '</div>';
        });
        html += '</div>';
      }
    });
    return html;
  };
})();
