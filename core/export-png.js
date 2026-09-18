/* =========================================================
   export-png.js — html-to-image 包裝（PNG 匯出）
   地雷處理（承 BODA / spike 實測）：
   - 匯出前等字型 ready
   - 超長頁要 skipAutoScale（>16384px 會被自動縮小）
   - 節點若有 transform 縮放，先取消再匯出、匯完還原
   需要頁面先載入 html2canvas 1.4.1 或 html-to-image 1.11.13（CDN，版本鎖定）。
   兩者都在時優先用 html2canvas——file:// 下只有它能保住 web font（見 captureNodeH2C）。
   ========================================================= */
(function () {
  'use strict';
  const XD = window.XD;

  /* html2canvas 不支援 object-fit。根因（01_蝦導播 v14 已查證並寫在 layout-runtime.js:180）：
     1.4.1 的 renderReplacedElement 就是
       drawImage(img, 0,0, 原圖寬,原圖高, box.left,box.top, box.寬,box.高)
     ——把整張原圖硬塞進 <img> 的 content box，object-fit 完全不看，
     所以只要「容器比例 ≠ 原圖比例」，預覽正常、匯出就被拉伸。
     （順帶查證：它也不會畫 <img> 自己的 background-image，所以「改用 background-size:cover」
      這招無效，實測過 12 條色帶還是全被壓進去。）

     這裡的做法：擷取前把圖改成「絕對定位 ＋ 明確算好的 cover/contain 尺寸」，
     讓父層的 overflow:hidden 負責裁切，object-fit 變成 no-op；畫完還原。
     只處理「圖剛好填滿父層內容框」這個標準用法（KV 圖、頭像、人物照片都是），
     其他情形改成絕對定位會跑位，寧可跳過不動。
     ⚠ 尺寸一律用 layout px（getComputedStyle 的用值／clientWidth），不能用
     getBoundingClientRect——MS 的 #paper 帶著 transform:scale 預覽縮放，rect 量到的是
     縮放後的值（實測 660x303 而 layout 是 1200x550），拿去算會整個錯掉。
     已經自己算好尺寸的圖（BN 的人物照片、LOGO、徽章）算出來就是現在的框，
     會被「本來就剛好」那個判斷略過，不會被動到。 */
  function pinObjectFit(root) {
    const undo = [];
    Array.prototype.forEach.call(root.querySelectorAll('img'), im => {
      const cs = getComputedStyle(im), fit = cs.objectFit;
      if (fit !== 'cover' && fit !== 'contain') return;
      const nw = im.naturalWidth, nh = im.naturalHeight;
      const cw = parseFloat(cs.width), ch = parseFloat(cs.height);
      if (!nw || !nh || !(cw > 0) || !(ch > 0)) return;
      if (parseFloat(cs.borderLeftWidth) || parseFloat(cs.borderTopWidth) ||
          parseFloat(cs.paddingLeft) || parseFloat(cs.paddingTop)) return;
      const sc = fit === 'cover' ? Math.max(cw / nw, ch / nh) : Math.min(cw / nw, ch / nh);
      const dw = nw * sc, dh = nh * sc;
      if (Math.abs(dw - cw) < 0.5 && Math.abs(dh - ch) < 0.5) return;   /* 本來就剛好 */
      const par = im.parentElement;
      if (!par) return;
      const pcs = getComputedStyle(par);
      const padL = parseFloat(pcs.paddingLeft), padR = parseFloat(pcs.paddingRight);
      const padT = parseFloat(pcs.paddingTop), padB = parseFloat(pcs.paddingBottom);
      /* 「圖＝父層內容框」而且沒有其他在流內的元素兄弟（絕對定位的提示層不算） */
      if (Math.abs(cw - (par.clientWidth - padL - padR)) > 0.5 ||
          Math.abs(ch - (par.clientHeight - padT - padB)) > 0.5) return;
      let inflowSiblings = 0;
      Array.prototype.forEach.call(par.children, ch2 => {
        if (ch2 === im) return;
        const p2 = getComputedStyle(ch2).position;
        if (p2 !== 'absolute' && p2 !== 'fixed') inflowSiblings++;
      });
      if (inflowSiblings) return;
      undo.push([im, im.getAttribute('style'), par, par.getAttribute('style')]);
      if (pcs.position === 'static') par.style.position = 'relative';
      if (pcs.overflow === 'visible') par.style.overflow = 'hidden';
      im.style.position = 'absolute';
      im.style.left = (padL + (cw - dw) / 2) + 'px';
      im.style.top = (padT + (ch - dh) / 2) + 'px';
      im.style.width = dw + 'px';
      im.style.height = dh + 'px';
      im.style.objectFit = 'fill';
    });
    /* 反向還原：同一個父層被兩張圖動過時，先還原後面那筆才不會留下中間狀態 */
    return function () {
      for (let i = undo.length - 1; i >= 0; i--) {
        const e = undo[i];
        if (e[1] == null) e[0].removeAttribute('style'); else e[0].setAttribute('style', e[1]);
        if (e[3] == null) e[2].removeAttribute('style'); else e[2].setAttribute('style', e[3]);
      }
    };
  }

  /* html2canvas 是從「活的 render tree」畫的，所以節點自己與祖先的 CSS transform
     都會被一起畫進去——MS 的 #paper 帶著 transform:scale(預覽縮放)，不處理的話
     擷取 1200x550 的區段會變成「內容只畫在左上角 660x303、其餘留白」（實測過）。
     html-to-image 不會有這個問題（它把節點重新掛到 SVG 裡，祖先的 transform 進不去），
     所以這裡要自己補：擷取前把「節點本身＋所有祖先」的 transform 暫時關掉，畫完還原。
     只動節點與祖先，不動子孫——子孫的 transform 往往是作品的一部分
     （例如 BN 的人物照片縮放/旋轉），關掉就錯了。 */
  function pinTransforms(node) {
    const undo = [];
    for (let n = node; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
      const tf = getComputedStyle(n).transform;
      if (tf && tf !== 'none') {
        undo.push([n, n.style.transform]);
        n.style.transform = 'none';
      }
    }
    return function () {
      for (let i = undo.length - 1; i >= 0; i--) undo[i][0].style.transform = undo[i][1];
    };
  }

  /* 擷取單一節點 → dataURL（type: 'png' | 'jpeg'） */
  XD.captureNode = async function (node, opts) {
    /* 頁面有載 html2canvas 就一律優先走它（理由見下面 captureNodeH2C）；
       沒載才退回 html-to-image，讓還沒換過的頁面照舊能用。 */
    if (typeof html2canvas !== 'undefined') return XD.captureNodeH2C(node, opts);
    if (typeof htmlToImage === 'undefined') throw new Error('html-to-image 尚未載入（需要連網）');
    const o = opts || {};
    const oldTf = node.style.transform;
    node.style.transform = 'none';
    try {
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
      const args = {
        width: o.width || node.offsetWidth,
        height: o.height || node.offsetHeight,
        pixelRatio: o.pixelRatio || 1,
        skipAutoScale: true,
        backgroundColor: o.background || null,
      };
      const dataUrl = o.type === 'jpeg'
        ? await htmlToImage.toJpeg(node, Object.assign(args, { quality: o.quality || 0.92 }))
        : await htmlToImage.toPng(node, args);
      return { dataUrl, width: args.width, height: args.height };
    } finally {
      node.style.transform = oldTf;
    }
  };

  /* html2canvas 版擷取（承 01_蝦導播 v14 的做法）。
     為什麼要另外一套：html-to-image 是把 DOM 包成 SVG foreignObject 再當圖片畫，
     而「SVG 當圖片」是受限模式、不能載入任何外部資源，所以字型必須先被內嵌進 SVG；
     它內嵌的方式是讀 document.styleSheets[].cssRules 找 @font-face 再 fetch 字型檔，
     但 file:// 底下每個檔案都是獨立來源 —— tokens.css 的 cssRules 直接丟 SecurityError、
     備援的 fetch('../core/tokens.css') 也被擋，結果匯出的 SVG 一個 @font-face 都沒有，
     圖只能用系統裝的字型畫（實測會退回 Noto Sans TC，字形與寬度都跟預覽不一樣）。
     就算把 @font-face 改指到 GitHub Pages（CORS 是通的）也救不了：SVG-as-image 不能連網，
     字型仍得整包內嵌，而這三支 CJK 字型各 18MB，內嵌進 16 張圖不可行。
     html2canvas 不走 SVG，是在主文件的 canvas 上直接 fillText，
     **文件裡已載入的 web font 直接就是對的**，不需要內嵌任何位元組。
     代價（v14 也踩過，呼叫端要自己處理）：
       ① 不支援 object-fit → 圖片要自己算好尺寸寫在 width/height 上；
       ② 不支援 box-shadow → 需要的邊框要用 border 畫。
     用法與 XD.captureNode 相同，回傳格式也相同。 */
  XD.captureNodeH2C = async function (node, opts) {
    if (typeof html2canvas === 'undefined') throw new Error('html2canvas 尚未載入（需要連網）');
    const o = opts || {};
    const w = o.width || node.offsetWidth, h = o.height || node.offsetHeight;
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    /* 先關 transform 再量 object-fit：兩者順序不能顛倒，
       getComputedStyle 的 width 雖然不受 transform 影響，但 html2canvas 是照關掉後的
       render tree 畫的，先關掉才能保證兩邊看到的是同一份幾何。 */
    const unTf = pinTransforms(node);
    const unFit = pinObjectFit(node);
    let canvas;
    try {
      canvas = await html2canvas(node, {
        width: o.width || node.offsetWidth, height: o.height || node.offsetHeight,
        scale: o.pixelRatio || 1,
        backgroundColor: o.background || null,
        logging: false, useCORS: true,
      });
    } finally { unFit(); unTf(); }
    const dataUrl = o.type === 'jpeg'
      ? canvas.toDataURL('image/jpeg', o.quality || 0.92)
      : canvas.toDataURL('image/png');
    return { dataUrl, width: canvas.width, height: canvas.height };
  };

  XD.exportPng = async function (node, filename, opts) {
    const r = await XD.captureNode(node, opts);
    const blob = await (await fetch(r.dataUrl)).blob();
    XD.download(blob, filename);
    return { bytes: blob.size, width: r.width, height: r.height };
  };
})();
