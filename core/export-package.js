/* =========================================================
   core/export-package.js — 整包下載共用工具
   承 02_吸底/v1/src/export/exportBatch.js 的做法：JSZip 打包全部
   PNG/JPG＋一份專案 JSON，一次觸發下載。這裡把「打包＋下載」與
   「離屏渲染容器」抽成共用函式，讓 bn-editor / ms-editor / ms-studio
   三個工具都能用同一套，不必各自重寫一份 JSZip 邏輯。
   需要頁面已載入 JSZip（CDN）與 core/export-png.js（XD.captureNode）。
   ========================================================= */
(function () {
  'use strict';
  const XD = window.XD;

  /* 建一個畫面外的容器（fixed + 位移到視窗外），呼叫 fn(container) 渲染／擷取，
     結束後（無論成功失敗）都會移除容器——不會動到使用者正在看的畫面。 */
  XD.withOffscreen = async function (fn) {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none;';
    document.body.appendChild(container);
    try { return await fn(container); }
    finally { document.body.removeChild(container); }
  };

  /* 把一張 dataURL 縮放成指定像素尺寸（給「設計稿尺寸≠實際交付尺寸」的版位用，
     例如 BN 608×608 那張是在 800×800 設計稿上做的，交付要縮成 608×608）。 */
  XD.resizeDataUrl = function (dataUrl, w, h) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cnv = document.createElement('canvas');
        cnv.width = w; cnv.height = h;
        cnv.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(cnv.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  /* items: [{name, dataUrl}]；projectJson 給 null 就不附加。 */
  XD.zipAndDownload = async function (items, projectJson, projectFilename, zipFilename) {
    if (typeof JSZip === 'undefined') throw new Error('JSZip 尚未載入（需要連網）');
    const zip = new JSZip();
    items.forEach(it => zip.file(it.name, it.dataUrl.split(',')[1], { base64: true }));
    if (projectJson != null) zip.file(projectFilename || 'project.json', JSON.stringify(projectJson, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    XD.download(blob, zipFilename);
    return blob;
  };
})();
