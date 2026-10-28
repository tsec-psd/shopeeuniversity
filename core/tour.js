/* =========================================================
   tour.js — 新手導覽引擎（specs/016）
   做法參考同事的 SKBN 編輯器導覽（ionaaaaa.github.io/Mall-SKBN 的 js/tour.js）：
   把畫面上的功能一個一個打亮、旁邊出現說明卡，按「下一步」看完就好（不用真的操作）；
   有示範動畫的步驟會出現一個假游標，在範例資料上「真的」點按鈕／打字，重複播放。

   引擎不認識任何工具的 DOM——步驟、範例資料的進出都由工具頁提供：

     const tour = XD.tour({
       steps: [...],
       onStart() {},            // 開始前：換上範例資料（可回傳 Promise）
       onEnd() {},              // 結束時：還原使用者原本的內容
       onDecline() {},          // ask() 問了、使用者選「先不用」（什麼都沒換過）
       intro: { art: 'HTML', meta: '共 N 步…' },
     });
     tour.start();   // 直接開始（使用者自己按「新手導覽」）
     tour.ask();     // 只跳出開場卡問要不要看；按了「開始導覽」才換範例資料、往下走

   step 欄位：
     target   CSS 選擇器／回傳元素（或元素陣列）的函式／null（畫面正中間的說明卡）
     title, body（body 可以寫 HTML）
     place    'right'|'left'|'top'|'bottom'，說明卡偏好的位置（放不下會自己換邊）
     pad      打亮框比目標外擴幾 px，預設 6
     before() / after()  進出這一步要做的事，可回傳 Promise
     anim(a)  示範動畫，a 是假游標（見 Anim）；animOnce:true 只播一次
     intro    開場那張卡（置中、有插圖、按鈕是「開始導覽／先不用」）

   載入順序：xd-core.js 之後即可（樣式在 core/ui.css 的 .tour-*）。
   ========================================================= */
(function () {
  'use strict';
  const XD = window.XD;

  /* 假游標是在模仿系統滑鼠，不是 UI icon，所以是實心箭頭（UI icon 的線性規範管不到它） */
  const CURSOR_SVG = '<svg width="26" height="30" viewBox="0 0 26 30" aria-hidden="true">' +
    '<path d="M3 2v22l6-6 4.5 9.5 4-2L13 16h9z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const ABORT = { tourAbort: true };

  const visible = el => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function waitFor(fn, timeout) {
    const t0 = Date.now();
    return new Promise(resolve => {
      (function poll() {
        let v = null; try { v = fn(); } catch (e) {}
        if (v || Date.now() - t0 > (timeout || 4000)) return resolve(v);
        setTimeout(poll, 60);
      })();
    });
  }
  const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  XD.tour = function (cfg) {
    const STEPS = cfg.steps;
    let root, block, spot, card, cursor;
    let idx = 0, active = false, busy = false, raf = 0, targets = null, animToken = 0;
    let asking = false;     /* ask() 開的開場卡：還沒換範例資料，畫面底下是使用者自己的內容 */

    function build() {
      if (root) return;
      root = document.createElement('div');
      root.className = 'tour-root'; root.hidden = true;
      root.innerHTML =
        '<div class="tour-block"></div><div class="tour-spot none"></div>' +
        '<div class="tour-cursor">' + CURSOR_SVG + '<span class="tour-ripple"></span></div>' +
        '<div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourTitle">' +
          '<div class="tour-art">' + ((cfg.intro && cfg.intro.art) || '') + '</div>' +
          '<div class="tour-step"></div><div class="tour-title" id="tourTitle"></div><div class="tour-body"></div>' +
          '<div class="tour-bar"><i></i></div>' +
          '<div class="tour-foot">' +
            '<button type="button" class="tour-skip">跳過導覽</button>' +
            '<button type="button" class="tour-later">先不用，直接開始</button>' +
            '<button type="button" class="tour-prev">上一步</button>' +
            '<button type="button" class="primary tour-next">下一步</button>' +
          '</div>' +
          '<div class="tour-meta">' + ((cfg.intro && cfg.intro.meta) || '') + '</div>' +
        '</div>';
      document.body.appendChild(root);
      block = root.querySelector('.tour-block'); spot = root.querySelector('.tour-spot');
      card = root.querySelector('.tour-card'); cursor = root.querySelector('.tour-cursor');
      card.querySelector('.tour-skip').onclick = () => end();
      card.querySelector('.tour-later').onclick = () => end();
      card.querySelector('.tour-prev').onclick = () => go(idx - 1);
      card.querySelector('.tour-next').onclick = () => {
        if (asking) return accept();
        if (idx >= STEPS.length - 1) end(); else go(idx + 1);
      };
    }

    /* ---------- 假游標 ---------- */
    function Anim(token) {
      let x = window.innerWidth * .6, y = window.innerHeight * .7;
      const alive = () => { if (token !== animToken || !active) throw ABORT; };
      const place = () => { cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)'; };
      const a = {
        show(px, py) { alive(); x = px; y = py; place(); cursor.classList.add('on'); },
        hide() { cursor.classList.remove('on'); },
        shown: () => cursor.classList.contains('on'),
        wait(ms) {
          return new Promise((res, rej) => setTimeout(() => { try { alive(); res(); } catch (e) { rej(e); } }, ms));
        },
        move(tx, ty, ms) {
          alive();
          const sx = x, sy = y, t0 = performance.now(), dur = ms || 600;
          return new Promise((res, rej) => {
            (function frame(now) {
              try { alive(); } catch (e) { return rej(e); }
              const e = ease(Math.min(1, (now - t0) / dur));
              x = sx + (tx - sx) * e; y = sy + (ty - sy) * e; place();
              if (now - t0 < dur) requestAnimationFrame(frame); else res();
            })(t0);
          });
        },
        ripple() {
          const r = cursor.querySelector('.tour-ripple');
          r.classList.remove('go'); void r.offsetWidth; r.classList.add('go');
        },
        /* 移到元素中央，真的點一下。el 可以是函式：工具重畫後元素會換掉，每次重抓。
           then(node) 在點下去的同一個 tick 執行（例如點完選單會自己收起來，要馬上再打開，
           不然打亮框會先縮一下） */
        tap(el, pause, then) {
          alive();
          const node = typeof el === 'function' ? el() : el;
          if (!node || !visible(node)) return a.wait(300);
          const c = center(node);
          if (!a.shown()) a.show(c.x + 110, c.y + 80);
          return a.move(c.x, c.y, 650).then(() => {
            alive(); a.ripple(); node.click();
            if (then) then(node);
            return a.wait(pause == null ? 900 : pause);
          });
        },
        /* 逐字打進 contenteditable 或 input，每個字送一次 input 事件（工具照常存進資料） */
        type(el, text, perChar) {
          alive();
          const node = typeof el === 'function' ? el() : el;
          if (!node) return a.wait(300);
          const isInput = 'value' in node && node.tagName !== 'LI';
          const fire = () => node.dispatchEvent(new Event('input', { bubbles: true }));
          const set = v => { if (isInput) node.value = v; else node.textContent = v; fire(); };
          const c = center(node);
          if (!a.shown()) a.show(c.x + 110, c.y + 80);
          let p = a.move(c.x, c.y, 600).then(() => { a.ripple(); set(''); return a.wait(250); });
          text.split('').forEach((ch, i) => {
            p = p.then(() => { set(text.slice(0, i + 1)); return a.wait(perChar || 130); });
          });
          return p;
        },
        /* 只移過去晃一下、不點（例如下載鈕：示範位置就好，不要真的下載） */
        point(el, pause) {
          alive();
          const node = typeof el === 'function' ? el() : el;
          if (!node || !visible(node)) return a.wait(300);
          const c = center(node);
          if (!a.shown()) a.show(c.x + 110, c.y + 80);
          return a.move(c.x, c.y, 650).then(() => { a.ripple(); return a.wait(pause == null ? 700 : pause); });
        },
        pos: () => ({ x, y }),
      };
      return a;
    }
    function startAnim() {
      const token = ++animToken, step = STEPS[idx];
      if (!step || !step.anim) { cursor.classList.remove('on'); return; }
      const a = Anim(token);
      (function loop() {
        Promise.resolve().then(() => step.anim(a))
          .then(() => { if (step.animOnce) throw ABORT; return a.wait(1400); })
          .then(loop)
          .catch(e => {
            if (e !== ABORT) console.warn('[tour anim]', e);
            if (token === animToken) cursor.classList.remove('on');
          });
      })();
    }
    function stopAnim() { animToken++; if (cursor) cursor.classList.remove('on'); }

    /* ---------- 排版：打亮框＋說明卡 ---------- */
    function resolveTargets(step) {
      const t = step.target;
      if (!t) return null;
      const v = typeof t === 'function' ? t() : document.querySelector(t);
      const arr = (Array.isArray(v) ? v : [v]).filter(visible);
      return arr.length ? arr : null;
    }
    function unionRect(els) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      els.forEach(el => { const r = el.getBoundingClientRect();
        x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); });
      return { left: x0, top: y0, right: x1, bottom: y1, width: x1 - x0, height: y1 - y0 };
    }
    function layout() {
      if (!active) return;
      const step = STEPS[idx], vw = window.innerWidth, vh = window.innerHeight, M = 12;
      /* 示範動畫會讓工具重畫，打亮的元素可能被換掉：被換掉就重抓 */
      if (targets && (step.anim || targets.some(el => !visible(el)))) {
        const re = resolveTargets(step); if (re) targets = re;
      }
      const cw = card.offsetWidth, ch = card.offsetHeight;
      let x, y;
      root.classList.toggle('dim', !targets);
      if (!targets) {
        spot.classList.add('none');
        x = (vw - cw) / 2; y = (vh - ch) / 2;
      } else {
        const pad = step.pad != null ? step.pad : 6;
        const r = unionRect(targets);
        const sx = Math.max(4, r.left - pad), sy = Math.max(4, r.top - pad);
        const sw = Math.min(vw - 4, r.right + pad) - sx, sh = Math.min(vh - 4, r.bottom + pad) - sy;
        spot.classList.remove('none');
        spot.style.left = sx + 'px'; spot.style.top = sy + 'px';
        spot.style.width = sw + 'px'; spot.style.height = sh + 'px';
        const gap = 14;
        const room = { right: vw - (sx + sw) - gap - M, left: sx - gap - M, bottom: vh - (sy + sh) - gap - M, top: sy - gap - M };
        const order = [step.place || 'right', 'right', 'left', 'bottom', 'top'];
        const place = order.find(p => (p === 'right' || p === 'left') ? room[p] >= cw : room[p] >= ch);
        if (place === 'right') { x = sx + sw + gap; y = sy + sh / 2 - ch / 2; }
        else if (place === 'left') { x = sx - gap - cw; y = sy + sh / 2 - ch / 2; }
        else if (place === 'bottom') { x = sx + sw / 2 - cw / 2; y = sy + sh + gap; }
        else if (place === 'top') { x = sx + sw / 2 - cw / 2; y = sy - gap - ch; }
        else { x = vw - cw - M; y = vh - ch - M; }           /* 哪邊都放不下：右下角 */
      }
      card.style.left = Math.max(M, Math.min(vw - cw - M, x)) + 'px';
      card.style.top = Math.max(M, Math.min(vh - ch - M, y)) + 'px';
    }
    /* 換步驟途中（busy）不排版：舊目標可能已經被重畫掉，排了會先往別處跳一下才到新位置 */
    function loop() { if (!busy) layout(); raf = requestAnimationFrame(loop); }

    function go(n) {
      if (busy || n < 0 || n >= STEPS.length) return;
      busy = true;
      stopAnim();
      const prev = STEPS[idx];
      Promise.resolve(prev && prev.after && idx !== n ? prev.after() : null)
        .then(() => { idx = n; const s = STEPS[idx]; return s.before ? s.before() : null; })
        .then(() => { const s = STEPS[idx]; return s.target ? waitFor(() => resolveTargets(s), 4000) : null; })
        .then(found => {
          if (!active) { busy = false; return; }
          targets = found;
          if (found && found[0]) {
            found[found.length - 1].scrollIntoView({ block: 'nearest' });
            found[0].scrollIntoView({ block: 'nearest' });
            const r = unionRect(found);
            if (r.top < 60 || r.bottom > window.innerHeight - 20) found[0].scrollIntoView({ block: 'center' });
          }
          const s = STEPS[idx], last = idx === STEPS.length - 1;
          card.querySelector('.tour-step').textContent = (idx + 1) + ' / ' + STEPS.length;
          card.querySelector('.tour-title').textContent = s.title;
          card.querySelector('.tour-body').innerHTML = s.body || '';
          card.querySelector('.tour-bar i').style.width = ((idx + 1) / STEPS.length * 100) + '%';
          card.querySelector('.tour-prev').disabled = idx === 0;
          card.classList.toggle('intro', !!s.intro);
          card.querySelector('.tour-next').textContent = s.intro ? '開始導覽' : last ? '完成' : '下一步';
          layout();
          busy = false;
          card.querySelector('.tour-next').focus({ preventScroll: true });
          startAnim();
        })
        .catch(e => { console.warn('[tour]', e); busy = false; });
    }

    /* 導覽進行中鍵盤一律攔下：不讓工具的 Ctrl+Z、Delete 去動到範例資料 */
    function onKey(e) {
      if (!active) return;
      if (e.key === 'Tab') return;                       /* 卡片內的按鈕照常可以 Tab 切換 */
      e.stopImmediatePropagation();
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); card.querySelector('.tour-next').click(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
      else if (e.key === 'Escape') { e.preventDefault(); end(); }
      else e.preventDefault();
    }

    function open() {
      root.hidden = false;
      active = true; idx = 0; targets = null;
      window.addEventListener('keydown', onKey, true);
      cancelAnimationFrame(raf); loop();
      go(0);
    }
    function start() {
      if (active) return Promise.resolve();
      build();
      return Promise.resolve(cfg.onStart ? cfg.onStart() : null).then(open);
    }
    /* 第一次打開用：只跳開場卡問一句，選「先不用」就什麼都不動 */
    function ask() {
      if (active) return;
      build();
      asking = true;
      open();
    }
    function accept() {
      if (!asking || busy) return;
      asking = false; busy = true;
      Promise.resolve(cfg.onStart ? cfg.onStart() : null)
        .then(() => { busy = false; go(1); })
        .catch(e => { console.warn('[tour]', e); busy = false; });
    }
    function end() {
      if (!active) return;
      const declined = asking;
      asking = false;
      stopAnim();
      const s = STEPS[idx];
      if (s && s.after) { try { s.after(); } catch (e) { console.warn('[tour]', e); } }
      active = false; busy = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      root.hidden = true;
      if (declined) { if (cfg.onDecline) cfg.onDecline(); }
      else if (cfg.onEnd) cfg.onEnd();
    }

    return {
      start, ask, end, steps: STEPS, waitFor, sleep,
      get active() { return active; },
      get asking() { return asking; },
      get index() { return idx; },
      get busy() { return busy; },
      next() { card.querySelector('.tour-next').click(); },
    };
  };
})();
