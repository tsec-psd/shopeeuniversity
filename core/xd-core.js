/* =========================================================
   xd-core.js — 全域 namespace 與共用小工具
   載入順序契約：tokens.css → xd-core → atoms → flow-engine → workorder → 頁面腳本
   Classic script（不用 ES modules，file:// 下才能雙擊直開）。
   ========================================================= */
(function () {
  'use strict';
  const XD = (window.XD = window.XD || {});
  XD.version = '0.1.0';
  XD.packs = XD.packs || {};

  /* DOM */
  XD.$  = (s, el) => (el || document).querySelector(s);
  XD.$$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* 資料 */
  XD.clone = o => JSON.parse(JSON.stringify(o));
  let _uid = 0;
  XD.uid = (p) => (p || 'r') + (++_uid) + '_' + Date.now().toString(36).slice(-4);
  XD.esc = s => String(s == null ? '' : s).replace(/[&<>"]/g,
    m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m]));

  /* toast：頁面要有 #msg 元素 */
  XD.toast = function (t) {
    const m = XD.$('#msg'); if (!m) return console.log('[toast]', t);
    m.textContent = t; m.classList.add('on');
    clearTimeout(m._t); m._t = setTimeout(() => m.classList.remove('on'), 2000);
  };

  /* ---------- 對話框：頁內 modal，取代 alert / confirm / prompt ----------
     不用瀏覽器原生對話框：實測在 Windows 多螢幕／系統縮放下常常點不到，
     而且原生框會凍住整頁 JS（匯出跑到一半跳一個就整個卡死）。
     同一個節點重複使用不重建——ms-editor 有 MutationObserver 盯著 body 的
     childList，每次 append/remove 都會多跑一次 applyZoom。
     一律回傳 Promise：confirm → true/false，prompt → 字串／null，alert → true。 */
  let _dlg = null;
  function dlgEl() {
    if (_dlg) return _dlg;
    const d = document.createElement('div');
    d.className = 'xd-modal';
    d.innerHTML =
      '<div class="xd-mbox" role="dialog" aria-modal="true">' +
        '<div class="xd-mtitle"></div><div class="xd-mtext"></div>' +
        '<input class="xd-minput" type="text" spellcheck="false">' +
        '<div class="xd-macts"><button class="xd-mcancel ghost"></button>' +
        '<button class="xd-mok primary"></button></div></div>';
    /* 工具頁在 document／#paper 上有自己的 click、keydown 選取邏輯，
       在對話框裡的操作不該被當成「點到畫布」 */
    ['click', 'mousedown', 'mouseup', 'dblclick', 'keydown', 'keyup', 'input']
      .forEach(t => d.addEventListener(t, e => e.stopPropagation()));
    document.body.appendChild(d);
    return (_dlg = d);
  }

  XD.dialog = function (opts) {
    opts = opts || {};
    const d = dlgEl(), el = s => d.querySelector(s);
    const tit = el('.xd-mtitle'), txt = el('.xd-mtext'), inp = el('.xd-minput');
    const bOk = el('.xd-mok'), bNo = el('.xd-mcancel');
    const ask = opts.input === true;
    tit.textContent = opts.title || ''; tit.hidden = !opts.title;
    txt.textContent = opts.text || '';  txt.hidden = !opts.text;
    inp.hidden = !ask;
    if (ask) {
      inp.value = opts.value == null ? '' : String(opts.value);
      if (opts.maxlength) inp.maxLength = opts.maxlength; else inp.removeAttribute('maxlength');
    }
    bOk.textContent = opts.ok || '確定';
    bNo.textContent = opts.cancel || '取消';
    bNo.hidden = opts.cancel === false;            /* alert：只留一顆 */
    bOk.classList.toggle('danger', !!opts.danger);
    const prev = document.activeElement;

    return new Promise(resolve => {
      function done(v) {
        d.classList.remove('open');
        bOk.onclick = bNo.onclick = d.onclick = d.onkeydown = null;
        try { if (prev && prev.focus) prev.focus(); } catch (e) {}
        resolve(v);
      }
      const yes = () => done(ask ? inp.value : true);
      const bail = () => done(ask ? null : false);
      bOk.onclick = yes;
      bNo.onclick = bail;
      d.onclick = e => { if (e.target === d) bail(); };        /* 點背景＝取消 */
      d.onkeydown = e => {
        if (e.key === 'Escape') { e.preventDefault(); bail(); }
        else if (e.key === 'Enter') { e.preventDefault(); yes(); }
      };
      d.classList.add('open');
      setTimeout(() => { (ask ? inp : bOk).focus(); if (ask) inp.select(); }, 0);
    });
  };
  XD.confirm = (text, opts) => XD.dialog(Object.assign({ text: text }, opts));
  XD.prompt  = (text, value, opts) =>
    XD.dialog(Object.assign({ text: text, input: true, value: value }, opts));
  XD.alert   = (text, opts) => XD.dialog(Object.assign({ text: text, cancel: false }, opts));

  /* storage：key 一律 xd_ 前綴，避免與 BODA 同網域互染 */
  XD.store = {
    get(k, dft) {
      try { const v = localStorage.getItem('xd_' + k); return v == null ? dft : JSON.parse(v); }
      catch (e) { return dft; }
    },
    set(k, v) { try { localStorage.setItem('xd_' + k, JSON.stringify(v)); } catch (e) {} },
    del(k)    { try { localStorage.removeItem('xd_' + k); } catch (e) {} },
  };

  /* 下載 blob */
  XD.download = function (blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };

  XD.debounce = function (fn, ms) {
    let t; return function () { clearTimeout(t); t = setTimeout(() => fn.apply(this, arguments), ms); };
  };

  /* 字數：中文／全形算 1，英數半形算 0.5（與 shrimp2choice 的 cc() 同規則）。
     用途是「這行字在版面上佔多寬」，不是字元數。 */
  XD.countUnits = function (text) {
    const s = String(text == null ? '' : text);
    let n = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.codePointAt(i);
      if ((c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3400 && c <= 0x4DBF) ||
          (c >= 0xF900 && c <= 0xFAFF) || (c >= 0x3000 && c <= 0x303F) ||
          (c >= 0xFF00 && c <= 0xFF60) || (c >= 0xAC00 && c <= 0xD7AF)) n += 1;
      else if (c > 0xFFFF) { n += 1; i++; }
      else n += 0.5;
    }
    return n;
  };

  /* 字數提示：軟性警告，不硬擋。
     超字仍然打得進去、畫面照畫，只是輸入框與計數轉成強調色——
     擋死會讓人繞路改用別的工具，反而更糟（承 02_吸底 的 textLimit 決策）。 */
  XD.applyCount = function (inputEl, countEl, max) {
    const n = XD.countUnits(inputEl.value);
    const over = n > max;
    if (countEl) {
      countEl.textContent = (Number.isInteger(n) ? n : n.toFixed(1)) + ' / ' + max;
      countEl.classList.toggle('over', over);
    }
    inputEl.classList.toggle('over', over);
    return { units: n, over };
  };
})();
