/* =========================================================
   core/logo-editor.js — LOGO 圖片編輯器（裁切／去背／圓角）
   改寫自 02_吸底/v1/src/ui/imageEditor.js（CropperJS 為基礎），
   拿掉該版專屬的 107:58 icon 框比例按鈕（各版位 LOGO 位比例不固定，
   改留自由比例／1:1 兩種即可），新增「圓角」——用 canvas 裁出圓角矩形
   路徑再貼回去，把圓角直接烤進透明 PNG（CSS border-radius 沒辦法
   反映在下載出去的圖檔上，要圓角就得是像素本身有那個形狀）。
   ========================================================= */
(function () {
  var CSS_URL = "https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/cropper.min.css";
  var JS_URL = "https://cdn.jsdelivr.net/npm/cropperjs@1.6.2/dist/cropper.min.js";
  var CROP_MIN_WIDTH = 428;
  var MAX_OUTPUT = 4000;
  var HISTORY_LIMIT = 30;
  var PAD_STEP = 0.12;

  var loadingPromise = null;
  var activeCropper = null;
  var session = null; // { history: [dataUrl], index, onDone, tolerance, cornerPct }

  function loadCropper() {
    if (window.Cropper) return Promise.resolve();
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise(function (resolve, reject) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      document.head.appendChild(link);

      var script = document.createElement("script");
      script.src = JS_URL;
      script.onload = function () { resolve(); };
      script.onerror = function () {
        loadingPromise = null;
        reject(new Error("無法載入裁切元件 CropperJS，請確認網路連線"));
      };
      document.head.appendChild(script);
    });
    return loadingPromise;
  }

  function rasterize(src, minWidth) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var nw = img.naturalWidth || img.width || 1;
        var nh = img.naturalHeight || img.height || 1;
        var scale = Math.max(1, minWidth / nw);
        var w = Math.round(nw * scale);
        var h = Math.round(nh * scale);

        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = function () { reject(new Error("圖片載入失敗")); };
      img.src = src;
    });
  }

  function loadImageData(dataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        resolve({ ctx: ctx, canvas: canvas, imageData: ctx.getImageData(0, 0, canvas.width, canvas.height) });
      };
      img.onerror = function () { reject(new Error("圖片載入失敗")); };
      img.src = dataUrl;
    });
  }

  function destroyCropper() {
    try { if (activeCropper) activeCropper.destroy(); } catch (e) { /* 已銷毀就忽略 */ }
    activeCropper = null;
  }

  function ensureModal() {
    var existing = document.getElementById("logoed-modal");
    if (existing) return existing;

    var modal = document.createElement("div");
    modal.id = "logoed-modal";
    modal.className = "crop-modal";
    modal.innerHTML =
      '<div class="crop-panel">' +
      "  <header>" +
      "    <strong>LOGO 編輯器</strong>" +
      '    <button type="button" class="mini" data-le="close">關閉</button>' +
      "  </header>" +
      '  <div class="crop-body checker"><img id="logoed-image" alt="編輯預覽" /></div>' +
      '  <div class="crop-tools">' +
      '    <span class="crop-group-label">裁切</span>' +
      '    <button type="button" class="mini" data-le="ratio" data-ar="free">自由比例</button>' +
      '    <button type="button" class="mini" data-le="ratio" data-ar="1">1:1</button>' +
      '    <button type="button" class="mini" data-le="ratio" data-ar="' + (4 / 3) + '">4:3</button>' +
      '    <button type="button" class="mini" data-le="ratio" data-ar="' + (3 / 2) + '">3:2</button>' +
      '    <button type="button" class="mini" data-le="ratio" data-ar="' + (16 / 9) + '">16:9</button>' +
      '    <button type="button" class="mini" data-le="crop">✂ 套用裁切</button>' +
      '    <button type="button" class="mini" data-le="reset">重設視圖</button>' +
      "  </div>" +
      '  <div class="crop-tools">' +
      '    <span class="crop-group-label">邊界</span>' +
      '    <button type="button" class="mini" data-le="pad">⊕ 加透明邊</button>' +
      '    <button type="button" class="mini" data-le="pad-white">⊞ 加白底</button>' +
      '    <button type="button" class="mini" data-le="trim">⊖ 裁到內容</button>' +
      "  </div>" +
      '  <div class="crop-tools">' +
      '    <span class="crop-group-label">圓角</span>' +
      '    <label class="crop-slider">弧度' +
      '      <input type="range" id="logoed-corner" min="0" max="50" step="1" />' +
      '      <span id="logoed-corner-value"></span>' +
      "    </label>" +
      '    <button type="button" class="mini" data-le="corner">◜ 套用圓角</button>' +
      "  </div>" +
      '  <div class="crop-tools">' +
      '    <span class="crop-group-label">去背</span>' +
      '    <button type="button" class="mini" data-le="bg-edge">去白底（保留內部白色）</button>' +
      '    <button type="button" class="mini" data-le="bg-all">連內部白色一起去</button>' +
      '    <label class="crop-slider">容差' +
      '      <input type="range" id="logoed-tolerance" min="0" max="120" step="2" />' +
      '      <span id="logoed-tolerance-value"></span>' +
      "    </label>" +
      "  </div>" +
      '  <div class="crop-actions">' +
      '    <button type="button" class="mini" data-le="undo">↩ 復原</button>' +
      '    <button type="button" class="mini" data-le="redo">↪ 重做</button>' +
      '    <span class="crop-status" id="logoed-status"></span>' +
      '    <button type="button" class="primary" data-le="apply">✓ 完成</button>' +
      "  </div>" +
      "</div>";
    document.body.appendChild(modal);
    return modal;
  }

  function setStatus(text) {
    var node = document.getElementById("logoed-status");
    if (node) node.textContent = text || "";
  }

  function syncHistoryButtons() {
    var modal = document.getElementById("logoed-modal");
    if (!modal || !session) return;
    var undoBtn = modal.querySelector('[data-le="undo"]');
    var redoBtn = modal.querySelector('[data-le="redo"]');
    if (undoBtn) undoBtn.disabled = session.index <= 0;
    if (redoBtn) redoBtn.disabled = session.index >= session.history.length - 1;
  }

  function current() {
    return session.history[session.index];
  }

  function pushStep(dataUrl) {
    session.history = session.history.slice(0, session.index + 1);
    session.history.push(dataUrl);
    if (session.history.length > HISTORY_LIMIT) session.history.shift();
    session.index = session.history.length - 1;
  }

  function loadWorking() {
    var modal = document.getElementById("logoed-modal");
    var image = modal.querySelector("#logoed-image");

    return new Promise(function (resolve) {
      destroyCropper();
      image.onload = function () {
        image.onload = null;
        destroyCropper();
        activeCropper = new window.Cropper(image, {
          viewMode: 0,
          autoCropArea: 1,
          movable: true,
          zoomable: true,
          scalable: true,
          background: false,
        });
        syncHistoryButtons();
        resolve();
      };
      image.removeAttribute("src");
      image.src = current();
    });
  }

  function runBgRemove(mode) {
    var tol = session.tolerance;
    setStatus("處理中…");

    loadImageData(current())
      .then(function (r) {
        var changed = window.BgRemove.apply(r.imageData, { tolerance: tol, mode: mode });
        if (!changed) {
          setStatus("依目前容差沒有偵測到可去除的白底，試著把容差調高。");
          return null;
        }
        r.ctx.putImageData(r.imageData, 0, 0);
        pushStep(r.canvas.toDataURL("image/png"));
        return changed;
      })
      .then(function (changed) {
        if (changed === null) return;
        return loadWorking().then(function () {
          setStatus(
            (mode === "all" ? "已去除所有白色" : "已去除邊界白底") +
              "（容差 " + tol + "，" + changed.toLocaleString() + " 個像素）"
          );
        });
      })
      .catch(function (err) {
        setStatus("去背失敗：" + err.message);
      });
  }

  function padTransparent() {
    setStatus("處理中…");
    loadImageData(current())
      .then(function (r) {
        var padX = Math.round(r.canvas.width * PAD_STEP);
        var padY = Math.round(r.canvas.height * PAD_STEP);
        var w = r.canvas.width + padX * 2;
        var h = r.canvas.height + padY * 2;

        if (w > MAX_OUTPUT || h > MAX_OUTPUT) {
          setStatus("已達尺寸上限 " + MAX_OUTPUT + "px，無法再加透明邊。");
          return null;
        }

        var out = document.createElement("canvas");
        out.width = w;
        out.height = h;
        out.getContext("2d").drawImage(r.canvas, padX, padY);
        pushStep(out.toDataURL("image/png"));
        return { w: w, h: h };
      })
      .then(function (size) {
        if (!size) return;
        return loadWorking().then(function () {
          setStatus("已加透明邊（" + size.w + "×" + size.h + "）");
        });
      })
      .catch(function (err) {
        setStatus("加透明邊失敗：" + err.message);
      });
  }

  /*
   * 加白底：跟加透明邊同一種「往四周擴一圈」動作，差在新畫布先鋪滿白色再貼原圖，
   * 不是留白透明。順便也把原圖裡本來就透明／半透明的像素墊上白色——很多廠商 LOGO
   * 是去背過的透明 PNG，貼到深色底的版位上會看起來浮在深色背景上，需要這顆補一塊
   * 實心白底墊在後面。
   */
  function padWhite() {
    setStatus("處理中…");
    loadImageData(current())
      .then(function (r) {
        var padX = Math.round(r.canvas.width * PAD_STEP);
        var padY = Math.round(r.canvas.height * PAD_STEP);
        var w = r.canvas.width + padX * 2;
        var h = r.canvas.height + padY * 2;

        if (w > MAX_OUTPUT || h > MAX_OUTPUT) {
          setStatus("已達尺寸上限 " + MAX_OUTPUT + "px，無法再加白底。");
          return null;
        }

        var out = document.createElement("canvas");
        out.width = w;
        out.height = h;
        var octx = out.getContext("2d");
        octx.fillStyle = "#ffffff";
        octx.fillRect(0, 0, w, h);
        octx.drawImage(r.canvas, padX, padY);
        pushStep(out.toDataURL("image/png"));
        return { w: w, h: h };
      })
      .then(function (size) {
        if (!size) return;
        return loadWorking().then(function () {
          setStatus("已加白底（" + size.w + "×" + size.h + "）");
        });
      })
      .catch(function (err) {
        setStatus("加白底失敗：" + err.message);
      });
  }

  function trimToContent() {
    setStatus("處理中…");
    loadImageData(current())
      .then(function (r) {
        var d = r.imageData.data;
        var w = r.canvas.width;
        var h = r.canvas.height;
        var minX = w, minY = h, maxX = -1, maxY = -1;

        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++) {
            if (d[(y * w + x) * 4 + 3] <= 8) continue;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }

        if (maxX < 0) {
          setStatus("整張圖都是透明的，沒有內容可以裁。");
          return null;
        }
        if (minX === 0 && minY === 0 && maxX === w - 1 && maxY === h - 1) {
          setStatus("四周沒有多餘的透明留白，不用裁。");
          return null;
        }

        var cw = maxX - minX + 1;
        var ch = maxY - minY + 1;
        var out = document.createElement("canvas");
        out.width = cw;
        out.height = ch;
        out.getContext("2d").drawImage(r.canvas, minX, minY, cw, ch, 0, 0, cw, ch);
        pushStep(out.toDataURL("image/png"));
        return { w: cw, h: ch };
      })
      .then(function (size) {
        if (!size) return;
        return loadWorking().then(function () {
          setStatus("已裁到內容（" + size.w + "×" + size.h + "）");
        });
      })
      .catch(function (err) {
        setStatus("裁到內容失敗：" + err.message);
      });
  }

  // 圓角矩形路徑（手動 arcTo 拼接，不依賴 ctx.roundRect——舊版 Chromium 沒有這個 API）
  function roundedRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /*
   * 圓角是烤進像素的破壞性操作（跟裁切/去背一樣走 pushStep 進歷史）：
   * 弧度＝短邊一半 × 滑桿百分比，50% 時短邊會變成完全的圓/膠囊形。
   */
  function applyCorner(pct) {
    setStatus("處理中…");
    loadImageData(current())
      .then(function (r) {
        var w = r.canvas.width, h = r.canvas.height;
        var rad = (Math.min(w, h) / 2) * (pct / 100);
        var out = document.createElement("canvas");
        out.width = w; out.height = h;
        var octx = out.getContext("2d");
        roundedRectPath(octx, 0, 0, w, h, rad);
        octx.clip();
        octx.drawImage(r.canvas, 0, 0);
        pushStep(out.toDataURL("image/png"));
        return { w: w, h: h };
      })
      .then(function (size) {
        if (!size) return;
        return loadWorking().then(function () {
          setStatus("已套用圓角（弧度 " + pct + "%）");
        });
      })
      .catch(function (err) {
        setStatus("圓角失敗：" + err.message);
      });
  }

  function commitCrop() {
    if (!activeCropper) return;
    var out = activeCropper.getCroppedCanvas({
      maxWidth: MAX_OUTPUT,
      maxHeight: MAX_OUTPUT,
      imageSmoothingQuality: "high",
    });
    if (!out) return;
    pushStep(out.toDataURL("image/png"));
    loadWorking().then(function () {
      setStatus("已套用裁切（" + out.width + "×" + out.height + "）");
    });
  }

  function open(src, onDone, onError) {
    var modal = ensureModal();
    var image = modal.querySelector("#logoed-image");
    var tolSlider = modal.querySelector("#logoed-tolerance");
    var tolValue = modal.querySelector("#logoed-tolerance-value");
    var cornerSlider = modal.querySelector("#logoed-corner");
    var cornerValue = modal.querySelector("#logoed-corner-value");

    function close() {
      destroyCropper();
      modal.classList.remove("open");
      session = null;
      document.removeEventListener("keydown", onKeyDown, true);
    }

    function onKeyDown(e) {
      if (!session) return;
      if (e.key === "Escape") { close(); return; }
      if (!(e.ctrlKey || e.metaKey)) return;
      var k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); step(-1); }
      else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); e.stopPropagation(); step(1); }
    }

    function step(delta) {
      var next = session.index + delta;
      if (next < 0 || next >= session.history.length) return;
      session.index = next;
      loadWorking().then(function () {
        setStatus(delta < 0 ? "已復原" : "已重做");
      });
    }

    session = {
      history: [],
      index: -1,
      tolerance: window.BgRemove.DEFAULT_TOLERANCE,
      cornerPct: 20,
      onDone: onDone,
    };

    tolSlider.value = String(session.tolerance);
    tolValue.textContent = String(session.tolerance);
    tolSlider.oninput = function (e) {
      session.tolerance = Number(e.target.value);
      tolValue.textContent = e.target.value;
    };
    cornerSlider.value = String(session.cornerPct);
    cornerValue.textContent = session.cornerPct + "%";
    cornerSlider.oninput = function (e) {
      session.cornerPct = Number(e.target.value);
      cornerValue.textContent = e.target.value + "%";
    };

    modal.onclick = function (e) {
      var btn = e.target.closest ? e.target.closest("[data-le]") : null;
      if (!btn) {
        if (e.target === modal) close();
        return;
      }
      var action = btn.getAttribute("data-le");

      if (action === "close") { close(); return; }
      if (!session || !session.history.length) return;

      if (action === "undo") { step(-1); return; }
      if (action === "redo") { step(1); return; }
      if (action === "bg-edge") { runBgRemove("edge"); return; }
      if (action === "bg-all") { runBgRemove("all"); return; }
      if (action === "pad") { padTransparent(); return; }
      if (action === "pad-white") { padWhite(); return; }
      if (action === "trim") { trimToContent(); return; }
      if (action === "crop") { commitCrop(); return; }
      if (action === "corner") { applyCorner(session.cornerPct); return; }

      if (!activeCropper) return;

      if (action === "ratio") activeCropper.setAspectRatio(btn.dataset.ar === "free" ? NaN : Number(btn.dataset.ar));
      else if (action === "reset") activeCropper.reset();
      else if (action === "apply") {
        var out = activeCropper.getCroppedCanvas({
          maxWidth: MAX_OUTPUT,
          maxHeight: MAX_OUTPUT,
          imageSmoothingQuality: "high",
        });
        if (!out) return;
        var dataUrl = out.toDataURL("image/png");
        var done = session.onDone;
        close();
        if (typeof done === "function") done(dataUrl);
      }
    };

    modal.classList.add("open");
    setStatus("");
    document.addEventListener("keydown", onKeyDown, true);

    rasterize(src, CROP_MIN_WIDTH)
      .then(function (rasterSrc) {
        return loadCropper().then(function () { return rasterSrc; });
      })
      .then(function (rasterSrc) {
        if (!session) return;
        session.history = [rasterSrc];
        session.index = 0;
        return loadWorking();
      })
      .catch(function (err) {
        close();
        if (typeof onError === "function") onError(err);
      });

    void image;
  }

  function isOpen() {
    return !!session;
  }

  window.LogoEditor = { open: open, isOpen: isOpen };
})();
