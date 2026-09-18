/* =========================================================
   core/bg-remove.js — 去白底（原樣搬自 02_吸底/v1/src/render/bgRemove.js）
   純像素運算，跟頁面/工具無關，供 core/logo-editor.js 使用。
   ========================================================= */
(function () {
  var FEATHER = 32; // 邊緣漸進帶寬（以下方的 whiteness 距離為單位，0~255）
  var DEFAULT_TOLERANCE = 24;

  function whiteness(d, i) {
    var m = d[i];
    if (d[i + 1] < m) m = d[i + 1];
    if (d[i + 2] < m) m = d[i + 2];
    return 255 - m;
  }

  function alphaFactor(dev, tol, soft) {
    if (dev <= tol) return 0;
    if (dev >= soft) return 1;
    return (dev - tol) / (soft - tol);
  }

  function applyAll(d, tol, soft) {
    var changed = 0;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      var f = alphaFactor(whiteness(d, i), tol, soft);
      if (f >= 1) continue;
      d[i + 3] = Math.round(d[i + 3] * f);
      changed++;
    }
    return changed;
  }

  function applyEdgeFlood(d, w, h, tol, soft) {
    var n = w * h;
    var visited = new Uint8Array(n);
    var stack = new Int32Array(n);
    var sp = 0;

    function push(p) {
      if (visited[p]) return;
      var i = p * 4;
      if (d[i + 3] !== 0 && whiteness(d, i) >= soft) return;
      visited[p] = 1;
      stack[sp++] = p;
    }

    var x, y;
    for (x = 0; x < w; x++) {
      push(x);
      push((h - 1) * w + x);
    }
    for (y = 0; y < h; y++) {
      push(y * w);
      push(y * w + w - 1);
    }

    while (sp > 0) {
      var p = stack[--sp];
      var py = (p / w) | 0;
      var px = p - py * w;
      if (px > 0) push(p - 1);
      if (px < w - 1) push(p + 1);
      if (py > 0) push(p - w);
      if (py < h - 1) push(p + w);
    }

    var changed = 0;
    for (var q = 0; q < n; q++) {
      if (!visited[q]) continue;
      var j = q * 4;
      if (d[j + 3] === 0) continue;
      var f = alphaFactor(whiteness(d, j), tol, soft);
      if (f >= 1) continue;
      d[j + 3] = Math.round(d[j + 3] * f);
      changed++;
    }
    return changed;
  }

  function apply(imageData, options) {
    var opts = options || {};
    var tol = typeof opts.tolerance === "number" ? opts.tolerance : DEFAULT_TOLERANCE;
    var soft = tol + FEATHER;

    if (opts.mode === "all") {
      return applyAll(imageData.data, tol, soft);
    }
    return applyEdgeFlood(imageData.data, imageData.width, imageData.height, tol, soft);
  }

  window.BgRemove = {
    FEATHER: FEATHER,
    DEFAULT_TOLERANCE: DEFAULT_TOLERANCE,
    whiteness: whiteness,
    apply: apply,
  };
})();
