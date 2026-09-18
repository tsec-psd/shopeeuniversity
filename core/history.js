/* =========================================================
   history.js — 快照式 undo / redo
   （做法承自 02_吸底/v1 的 src/state/store.js，改成不依賴 reducer 的版本）

   為什麼可以直接存「整份 state 的複本」而不是 diff：
   我們的編輯狀態很小（文案字串＋勾選清單），一份複本才幾百 bytes，
   50 步也吃不到記憶體；用複本就不必維護反向操作，永遠不會對不回去。
   ⚠ 呼叫端必須把 state 當成不可變：改動一律經由 set()，
     不要直接改 getState() 回傳的物件，否則歷史會被污染。

   合併（coalesce）：同一個欄位在 700ms 內連打，只記一步。
   不合併的話 undo 會一個字一個字倒退，實際上很難用。

   批次（beginBatch/endBatch）：把「匯入工單」這種一次改很多欄位的操作
   併成單一步歷史、單一次通知。
   ========================================================= */
(function () {
  'use strict';
  const XD = window.XD;

  XD.createHistory = function (initialState, options) {
    const o = options || {};
    const LIMIT = o.limit || 50;
    const COALESCE_MS = o.coalesceMs == null ? 700 : o.coalesceMs;
    const clone = s => JSON.parse(JSON.stringify(s));

    let state = clone(initialState);
    const past = [], future = [];
    let lastMark = null;                  /* {key, time} 用來判斷要不要合併 */
    const listeners = [];

    let batchDepth = 0, batchBase = null, batchTouched = false;

    function notify(meta) { listeners.slice().forEach(fn => fn(state, meta)); }

    function pushPast(snap) {
      past.push(snap);
      if (past.length > LIMIT) past.shift();
    }

    /* meta: { key, silent } —— key 相同且在 COALESCE_MS 內視為同一步；
       silent:true 代表這次變更不進歷史（例如純檢視狀態） */
    function set(next, meta) {
      const m = meta || {};
      const prev = state;
      state = clone(next);
      if (m.silent) { if (!batchDepth) notify(m); return state; }

      if (batchDepth > 0) {
        batchTouched = true;
      } else {
        const now = Date.now();
        const merge = m.key && lastMark && lastMark.key === m.key &&
                      (now - lastMark.time) < COALESCE_MS;
        if (!merge) pushPast(prev);       /* 合併時堆疊頂端已經是這輪開始前的狀態 */
        future.length = 0;
        lastMark = { key: m.key || null, time: now };
      }
      if (!batchDepth) notify(m);
      return state;
    }

    function beginBatch() {
      if (batchDepth === 0) { batchBase = state; batchTouched = false; }
      batchDepth++;
    }
    function endBatch(meta) {
      if (batchDepth === 0) return;
      if (--batchDepth > 0) return;
      if (batchTouched && batchBase !== state) { pushPast(batchBase); future.length = 0; }
      batchBase = null; batchTouched = false;
      lastMark = null;                    /* 批次後不與後續打字合併 */
      notify(meta || { type: '@@BATCH' });
    }

    function undo() {
      if (!past.length) return false;
      future.push(state);
      state = past.pop();
      lastMark = null;
      notify({ type: '@@UNDO' });
      return true;
    }
    function redo() {
      if (!future.length) return false;
      pushPast(state);
      state = future.pop();
      lastMark = null;
      notify({ type: '@@REDO' });
      return true;
    }

    return {
      getState: () => state,
      set, undo, redo, beginBatch, endBatch,
      canUndo: () => past.length > 0,
      canRedo: () => future.length > 0,
      depth: () => ({ past: past.length, future: future.length }),
      subscribe(fn) {
        listeners.push(fn);
        return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
      },
    };
  };

  /* 綁 Ctrl+Z / Ctrl+Shift+Z（與 Ctrl+Y）。輸入框裡不攔截——
     讓瀏覽器自己處理該欄位的文字 undo，避免整份版面被倒回。 */
  XD.bindUndoKeys = function (history, onChange) {
    document.addEventListener('keydown', e => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k !== 'z' && k !== 'y') return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      const ok = (k === 'y' || e.shiftKey) ? history.redo() : history.undo();
      if (onChange) onChange(ok);
    });
  };
})();
