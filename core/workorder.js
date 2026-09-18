/* =========================================================
   workorder.js — 試算表工單 產出／解析
   XIADA_WORKORDER_V1 契約的唯一定義處。

   填寫表結構：
     A 欄＝隱藏鍵欄（每個綠格那一列寫 fieldId，匯入靠它定位，不靠位址）
     B..G 欄＝內容區（各區段的表格欄依比例映射到這 6 欄）
     深藍橫條＝區段（▓ MS_01｜活動亮點）
     藍色橫條＝積木（▍第 N 列｜積木名）
     灰色小字＝欄位名；其正下方綠格＝填寫處
     多行欄位：一行一條，Alt+Enter 換行（條列數量靠行數，不准插列）
   _META（veryHidden）：magic、版面 JSON、fieldId 對照表
   ========================================================= */
(function () {
  'use strict';
  const XD = window.XD;
  const wo = (XD.workorder = {});
  wo.MAGIC = 'XIADA_WORKORDER_V1';

  const C = {
    line:'FF2C49CE', lab:'FFEAEFFC', fill:'FFDFF3E1', lock:'FFF2F3F5',
    head:'FF16277F', warn:'FFFFF6D9', name:'FF8A93A6', nameBg:'FFF7F8FA',
    band:'FFD7E0F9', secBand:'FF1C3887', key:'FFB9C0CC',
  };
  const thin  = { style:'thin', color:{ argb:C.line } };
  const box   = { top:thin, left:thin, bottom:thin, right:thin };
  const solid = a => ({ type:'pattern', pattern:'solid', fgColor:{ argb:a } });

  const COL0 = 2, COLN = 7;             /* 內容區 B..G */
  const spanMap = { 1:[[2,7]], 2:[[2,3],[4,7]], 3:[[2,3],[4,5],[6,7]] };

  /* 把 cL..cR 這段欄位平分成 n 段（列內子網格用；欄數不足時尾段擠在最後一欄）。
     n=2 且 cL..cR=B..G 時結果與舊的「取中點對半切」相同，舊工單版面不變。 */
  function splitSpan(cL, cR, n) {
    const total = cR - cL + 1, out = [];
    let start = cL;
    for (let i = 0; i < n; i++) {
      const w = Math.round(total * (i + 1) / n) - Math.round(total * i / n);
      const s = Math.min(start, cR);
      const e = Math.min(cR, Math.max(s, s + w - 1));
      out.push([s, e]);
      start = e + 1;
    }
    return out;
  }

  const PHOTO_PROMPT = '填素材包裡的圖片檔名（例：黃佐奇.png）。也可以留白：系統會用姓名／品牌自動配對。';

  wo.makePageXlsx = async function (page, presets, sectionDefs, opts) {
    if (typeof ExcelJS === 'undefined') throw new Error('ExcelJS 尚未載入（需要連網）');
    const o = opts || {};
    const secs = page.sections.filter(s => !(sectionDefs[s.type] || {}).kv);
    if (!secs.length) throw new Error('頁面上還沒有可填寫的區段');

    const wb = new ExcelJS.Workbook();
    wb.creator = '蝦大素材工具 ms-editor v' + XD.version;
    const ws = wb.addWorksheet('填寫表', { views:[{ showGridLines:false, state:'frozen', ySplit:3 }] });
    const mt = wb.addWorksheet('_META'); mt.state = 'veryHidden';

    ws.getColumn(1).width = 4; ws.getColumn(1).hidden = true;
    for (let c = COL0; c <= COLN; c++) ws.getColumn(c).width = 19;

    /* ---- 表頭三行 ---- */
    ws.mergeCells(1, COL0, 1, COLN);
    Object.assign(ws.getCell(1, COL0), {
      value: '蝦大活動頁工單　' + (o.eventName || ''),
      font: { size:15, bold:true, color:{ argb:C.head } } });
    ws.getRow(1).height = 26;
    ws.mergeCells(2, COL0, 2, COLN);
    const t2 = ws.getCell(2, COL0);
    t2.value = '深藍橫條＝區段｜藍色橫條＝版面上的一塊積木｜灰色小字＝欄位名（不要動）｜正下方綠色格＝內容填這裡';
    t2.font = { size:11, color:{ argb:'FF6B7280' } }; t2.fill = solid(C.warn);
    ws.getRow(2).height = 18;
    ws.mergeCells(3, COL0, 3, COLN);
    const t3 = ws.getCell(3, COL0);
    t3.value = '多行欄位一行填一條（換行按 Alt+Enter），請不要插入或刪除列。照片欄填素材包檔名，留白＝用姓名自動配對。';
    t3.font = { size:11, color:{ argb:'FF6B7280' } }; t3.fill = solid(C.warn);
    ws.getRow(3).height = 18;

    const metaRows = [];
    let cur = 5;

    /* ---- 寫一組欄位（灰字列＋綠格列）到 cL..cR ---- */
    const writePairs = (fields, r0, r1, cL, cR) => {
      let r = r0;
      fields.forEach(fd => {
        if (r + 1 > r1) return;
        if (cR > cL) ws.mergeCells(r, cL, r, cR);
        const lab = ws.getCell(r, cL);
        lab.value = fd.nm;
        lab.font = { size:8, italic:true, color:{ argb:C.name } };
        lab.fill = solid(C.nameBg);
        lab.border = { left:thin, right:thin, top:thin };
        lab.alignment = { vertical:'bottom' };
        ws.getRow(r).height = 12;
        r++;
        if (cR > cL) ws.mergeCells(r, cL, r, cR);
        const inp = ws.getCell(r, cL);
        inp.value = '';
        inp.fill = solid(C.fill);
        inp.border = { left:thin, right:thin, bottom:thin };
        inp.alignment = { vertical:'top', wrapText:true };
        inp.protection = { locked:false };
        const lines = fd.multi ? Math.max(2, fd.lines || 2) : 1;
        ws.getRow(r).height = fd.multi ? (14 * (lines + 1)) : 20;
        const maxChars = fd.multi ? fd.max * (lines + 2) : fd.max;
        inp.dataValidation = {
          type:'textLength', operator:'lessThanOrEqual', formulae:[maxChars],
          allowBlank:true, showInputMessage:true,
          promptTitle: fd.nm + (fd.multi ? '（每行約 ' + fd.max + ' 字內）' : '（上限 ' + fd.max + ' 字）'),
          prompt: fd.photo ? PHOTO_PROMPT
                : (fd.multi ? '一行一條，Alt+Enter 換行。原本的樣子：' : '原本的樣子：') +
                  String(fd.v == null ? '' : fd.v).replace(/\n/g, ' / ').slice(0, 60),
          showErrorMessage:true, errorStyle:'warning',
          errorTitle:'超過建議字數',
          error:'超過建議字數，版面會變長。確定要這樣填嗎？',
        };
        const key = ws.getCell(r, 1);   /* 并排欄位共用同一列 → 逗號串接 */
        key.value = key.value ? key.value + ',' + fd.id : fd.id;
        key.font = { size:7, color:{ argb:C.key } };
        metaRows.push([fd.id, fd.nm, inp.address, fd.max, fd.multi ? 1 : 0]);
        r++;
      });
      if (r <= r1) {                      /* 塊內剩餘空間鎖起來 */
        if (r1 > r || cR > cL) ws.mergeCells(r, cL, r1, cR);
        const g = ws.getCell(r, cL);
        g.fill = solid(C.lock); g.border = box;
      }
    };

    const bandRow = (label) => {
      ws.mergeCells(cur, COL0, cur, COLN);
      const h = ws.getCell(cur, COL0);
      h.value = '▍' + label;
      h.font = { size:10, bold:true, color:{ argb:C.head } };
      h.fill = solid(C.band);
      ws.getRow(cur).height = 15;
      cur++;
    };

    /* ---- 逐區段 ---- */
    secs.forEach((sec, si) => {
      const sdef = sectionDefs[sec.type];
      const msNo = 'MS_' + String(si + 1).padStart(2, '0');
      ws.getRow(cur).height = 10; cur++;
      ws.mergeCells(cur, COL0, cur, COLN);
      const b = ws.getCell(cur, COL0);
      b.value = '▓ ' + msNo + '｜' + sec.title;
      b.font = { size:12, bold:true, color:{ argb:'FFFFFFFF' } };
      b.fill = solid(C.secBand);
      ws.getRow(cur).height = 22;
      cur++;

      const sid = 's' + (si + 1) + '_' + sec.type;

      /* 2026-09-08 起沒有「區段標題」這個區段屬性欄位——
         黃底膠囊現在是一塊列型積木（x_pill），跟其他欄位一樣逐列寫出。
         sec.title 退成內部的區段名，只用在上面那條深藍分組橫條。 */

      /* 視覺塊：主題組整組算一塊 */
      const blocks = [];
      sec.rows.forEach((r, i) => {
        if (r.gid && i > 0 && sec.rows[i - 1].gid === r.gid) blocks[blocks.length - 1].rows.push(i);
        else blocks.push({ rows: [i], nm: (presets[r.preset] || {}).nm || r.preset, mode: (presets[r.preset] || {}).mode || 'grid' });
      });

      const nCol = (sdef.cols || ['1fr']).length;
      const spans = spanMap[nCol] || spanMap[1];
      const gridRows = sec.rows;
      const placedAll = XD.flow.place(gridRows, nCol);

      const subNeed = f => {                       /* 子網格：取最高的那一格 */
        const per = {};
        f.forEach(x => { per[x.sub] = (per[x.sub] || 0) + 2; });
        return Math.max.apply(null, [2].concat(Object.keys(per).map(k => per[k])));
      };
      const stackH = it => {
        const f = XD.fieldsOf(it.cell, 'x');
        return it.cell.sub ? subNeed(f) : Math.max(2, f.length * 2);
      };

      blocks.forEach((blk, bi) => {
        ws.getRow(cur).height = 6; cur++;
        bandRow('第 ' + (bi + 1) + ' 塊｜' + blk.nm);
        const pid = sid + '.b' + (bi + 1);

        if (blk.mode === 'plain') {
          blk.rows.forEach(ri => {
            gridRows[ri].cells.forEach((cell, ci) => {
              const f = XD.fieldsOf(cell, pid + '.c' + ci);
              if (cell.sub) {                       /* 亮點的 icon 三卡／等式列：橫向並排 */
                const need = subNeed(f);
                const parts = splitSpan(COL0, COLN, cell.sub.length);
                cell.sub.forEach((sx, si2) =>
                  writePairs(f.filter(x => x.sub === si2), cur, cur + need - 1,
                             parts[si2][0], parts[si2][1]));
                cur += need;
              } else {
                const need = f.length * 2;
                writePairs(f, cur, cur + need - 1, COL0, COLN);
                cur += need;
              }
            });
          });
        } else if (blk.mode === 'card') {
          blk.rows.forEach(ri => {
            const row = gridRows[ri];
            const perCol = row.cells.map((cell, ci) => XD.fieldsOf(cell, pid + '.c' + ci));
            const need = Math.max.apply(null, perCol.map(f => f.reduce((t, fd) => t + 2, 0)));
            const sp = spanMap[Math.min(row.cells.length, 3)] || spanMap[1];
            perCol.forEach((f, ci) => {
              const s = sp[Math.min(ci, sp.length - 1)];
              writePairs(f, cur, cur + need - 1, s[0], s[1]);
            });
            cur += need;
          });
        } else { /* grid */
          const rowH = {};
          blk.rows.forEach(ri => {
            let h = 2;
            placedAll[ri].items.forEach(it => { if (!it.isLead && it.rs === 1) h = Math.max(h, stackH(it)); });
            rowH[ri] = h;
          });
          const lead0 = placedAll[blk.rows[0]].items.find(it => it.isLead);
          if (lead0) {
            const need = XD.fieldsOf(lead0.cell, 'x').length * 2;
            const have = blk.rows.reduce((t, ri) => t + rowH[ri], 0) + (blk.rows.length - 1);
            if (need > have) rowH[blk.rows[blk.rows.length - 1]] += need - have;
          }
          const bandStart = cur, rowStart = {};
          blk.rows.forEach((ri, k) => {
            if (k > 0) { ws.getRow(cur).height = 4; cur++; }
            rowStart[ri] = cur; cur += rowH[ri];
          });
          const blockEnd = cur - 1;
          blk.rows.forEach(ri => {
            placedAll[ri].items.forEach(it => {
              const f = XD.fieldsOf(it.cell, pid + '.r' + ri + 'c' + it.col);
              if (it.isLead) {
                writePairs(f, bandStart, blockEnd, spans[0][0], spans[0][1]);
              } else if (it.cell.sub) {
                const s = spans[Math.min(it.col, spans.length - 1)];
                const csSpan = [s[0], (spans[Math.min(it.col + it.cs - 1, spans.length - 1)] || s)[1]];
                const parts = splitSpan(csSpan[0], csSpan[1], it.cell.sub.length);
                it.cell.sub.forEach((sx, si2) => {
                  writePairs(f.filter(x => x.sub === si2), rowStart[ri], rowStart[ri] + rowH[ri] - 1,
                             parts[si2][0], parts[si2][1]);
                });
              } else {
                const s0 = spans[Math.min(it.col, spans.length - 1)];
                const s1 = spans[Math.min(it.col + it.cs - 1, spans.length - 1)] || s0;
                writePairs(f, rowStart[ri], rowStart[ri] + rowH[ri] - 1, s0[0], s1[1]);
              }
            });
          });
        }
      });
    });

    ws.protect('', { selectLockedCells:true, selectUnlockedCells:true,
                     formatColumns:true, formatRows:true,
                     insertRows:false, deleteRows:false, sort:false });

    /* ---- _META ---- */
    mt.addRow([wo.MAGIC]);
    mt.addRow(['tool', 'ms-editor', XD.version, new Date().toISOString()]);
    const layout = JSON.stringify({
      sections: page.sections.map(s => ({
        iid: s.iid, type: s.type, title: s.title,
        rows: (s.rows || []).map(r => ({ preset: r.preset, gid: r.gid || null, cells: r.cells, lead: r.lead || null })),
      })),
    });
    for (let i = 0; i < layout.length; i += 30000)
      mt.addRow([i === 0 ? 'layout' : 'layout+', layout.slice(i, i + 30000)]);
    mt.addRow([]);
    mt.addRow(['fieldId', '欄位名', '儲存格', '每行上限', '多行']);
    metaRows.forEach(r => mt.addRow(r));

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return { blob, fields: metaRows.length, sections: secs.length,
             filename: '蝦大MS工單_' + new Date().toISOString().slice(0, 10) + '.xlsx' };
  };

  /* =========================================================
     匯入：解析填好的工單 → 重建整頁版面
     定位以 _META 的位址為主（工單已鎖 insertRows），
     A 欄鍵欄做交叉核對，不符列入 warnings。
     ========================================================= */
  const cellText = v => {
    if (v == null) return '';
    if (typeof v === 'object') {
      if (v.richText) return v.richText.map(t => t.text).join('');
      if (v.text) return String(v.text);
      if (v.result != null) return String(v.result);
      return '';
    }
    return String(v);
  };

  wo.parseXlsx = async function (arrayBuffer, presets, sectionDefs) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(arrayBuffer);
    const mt = wb.getWorksheet('_META');
    const ws = wb.getWorksheet('填寫表');
    if (!mt || !ws) throw new Error('這不是蝦大工單（找不到 _META／填寫表）');
    if (cellText(mt.getRow(1).getCell(1).value) !== wo.MAGIC)
      throw new Error('工單版本不符（magic 不是 ' + wo.MAGIC + '）');

    /* layout JSON（分塊組回） + 欄位對照 */
    let layoutStr = '';
    const fields = [];
    mt.eachRow(row => {
      const k = cellText(row.getCell(1).value);
      if (k === 'layout' || k === 'layout+') layoutStr += cellText(row.getCell(2).value);
      else if (/^s\d+_/.test(k))
        fields.push({ id: k, nm: cellText(row.getCell(2).value),
                      addr: cellText(row.getCell(3).value),
                      multi: cellText(row.getCell(5).value) === '1' });
    });
    if (!layoutStr) throw new Error('_META 缺 layout');
    const page = JSON.parse(layoutStr);

    /* 取值 + 鍵欄核對 */
    const valueMap = {}, warnings = [], missing = [];
    fields.forEach(fd => {
      const cell = ws.getCell(fd.addr);
      const v = cellText(cell.value).replace(/\r\n?/g, '\n').trim();
      valueMap[fd.id] = v;
      if (!v) missing.push(fd);
      const keys = cellText(ws.getCell('A' + cell.row).value).split(',');
      if (keys.indexOf(fd.id) < 0)
        warnings.push('鍵欄不符：' + fd.addr + ' 應為 ' + fd.id + '（工單可能被動過列）');
    });

    /* 寫回版面（走訪順序與產出時一致） */
    let applied = 0;
    const secs = page.sections.filter(s => !(sectionDefs[s.type] || {}).kv);
    secs.forEach((sec, si) => {
      const sid = 's' + (si + 1) + '_' + sec.type;
      const blocks = [];
      sec.rows.forEach((r, i) => {
        if (r.gid && i > 0 && sec.rows[i - 1].gid === r.gid) blocks[blocks.length - 1].rows.push(i);
        else blocks.push({ rows: [i], mode: (presets[r.preset] || {}).mode || 'grid' });
      });
      const nCol = (sectionDefs[sec.type].cols || ['1fr']).length;
      const placedAll = XD.flow.place(sec.rows, nCol);
      blocks.forEach((blk, bi) => {
        const pid = sid + '.b' + (bi + 1);
        if (blk.mode === 'plain' || blk.mode === 'card') {
          blk.rows.forEach(ri => sec.rows[ri].cells.forEach((cell, ci) => {
            applied += XD.applyFields(cell, pid + '.c' + ci, valueMap);
          }));
        } else {
          blk.rows.forEach(ri => placedAll[ri].items.forEach(it => {
            applied += XD.applyFields(it.cell, pid + '.r' + ri + 'c' + it.col, valueMap);
          }));
        }
      });
      /* 匯入後的列都重新給 id（避免與編輯器既有 id 撞名） */
      sec.rows.forEach(r => { r.id = XD.uid(); });
    });

    return { page, applied, total: fields.length, missing, warnings };
  };
})();
