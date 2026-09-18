/* =========================================================
   packs/bn/logo-assets.js — 固定 LOGO 的路徑與長寬比
   =========================================================
   2026-09-10 前這裡是內嵌 base64（因為 file:// 底下把畫面轉 PNG 需要
   每張圖都是 data URL，否則 canvas 會 tainted）。工具改成部署到 GitLab、
   用網址開之後這條限制消失，所以改回直接指到 img/LOGO/ 的原始檔——
   換 LOGO 只要覆蓋那個檔案，不用再跑任何產生腳本。
   ⚠ 必須用 http(s) 開（部署網址，或本機 server / VS Code 的 Live Server）。
   file:// 底下圖顯示得出來但匯出必炸，這是瀏覽器的安全限制不是設定問題。

   路徑一律「相對專案根目錄」，跟 themes.js 的 dir 同一套慣例；
   頁面自己補相對層級（tools/bn-editor.html 的 ASSET_BASE）。

   ---- 2026-09-11 素材改版：直式/橫式 → 橘色/白色 ----
   蝦皮直播與蝦皮購物兩顆 LOGO 現在各有橘、白兩版，**依主題底色深淺挑一版**
   （哪個主題用哪一版寫在 themes.js 的 logoColor，來源是工單「BN主題文案配色」
   分頁的「蝦皮/直播LOGO顏色」欄）。舊的「直式 394×243／橫式 620×103」兩版
   已被使用者刪除，themes.js 的 liveLogo:'wide' 一併作廢——**新素材兩版都是
   正方形 1:1**，不再有寬窄之分。
   蝦大 LOGO 只有一版（它被畫在白色圓形底上，不隨主題變色）。

   ratio 是各 LOGO 的原始長寬比（寬÷高）。LOGO 條要靠它換算每一格的寬度，
   不能寫死在頁面程式裡，也不能等圖載入才量（排版當下就要用）。
   換圖若尺寸比例變了，這裡的數字要跟著改。
   ========================================================= */
(function () {
  window.XD = window.XD || {}; XD.packs = XD.packs || {};
  XD.packs.bnLogoAssets = {
    /* 蝦大 LOGO：600×600，畫在 .logo-circle 白色圓形裡，不分顏色版本 */
    xiada: 'img/LOGO/蝦大logo.png',
    /* 蝦皮直播：兩版都是 600×600 */
    live: {
      white: 'img/LOGO/蝦皮直播LOGO_白.png',
      orange: 'img/LOGO/蝦皮直播LOGO_橘.png'
    },
    /* 蝦皮購物（公版定位的「蝦皮購物LOGO範圍」，右上角那顆）：白 428×508、橘 429×508 */
    shopee: {
      white: 'img/LOGO/蝦皮購物LOGO_白.png',
      orange: 'img/LOGO/蝦皮購物LOGO_橘.png'
    },
    /* shopee 的兩版差 1px 寬（429 vs 428＝0.2%），肉眼看不出來也小於一個像素的
       排版誤差，取單一值即可；預覽還有 object-fit:contain 兜底。 */
    ratio: { xiada: 1, live: 1, shopee: 428 / 508 }
  };
})();
