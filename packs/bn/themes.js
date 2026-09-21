/* =========================================================
   packs/bn/themes.js — BN 主題設定（底圖路徑＋文案配色）
   MS 線上編輯器也會讀這份的 colors（見 specs/006），不要另抄一份配色。
   dir + images 就是實際會畫出來的底圖路徑（相對專案根目錄），
   渲染端直接組成 URL 用，沒有第二份複本。
   ⚠ 這個工具必須用 http(s) 開（部署到 Git 空間用網址，或本機
   `python -m http.server`）。file:// 底下圖片雖然顯示得出來，但一畫進
   canvas 就會 tainted，匯出 PNG 必定失敗——先前為了雙擊開檔而把圖
   內嵌成 base64 的做法（theme-assets.js / theme-simple-assets.js）
   已於 2026-09-10 移除，因為那讓「改圖要重跑產生腳本」變成常態負擔。
   定位資料不在這裡，也不是每個主題一份：使用者 2026-09-10 指示「所有主題的
   文字及人物框定位以公版為主」，全部主題共用 packs/bn/master-placements.js
   （來源 主題JSON/主題公版定位 New，2026-09-16 換的這一版）。主題物件之間的
   差別只有 dir/images（底圖）、colors（文案配色）與 logoColor（蝦皮/直播 LOGO
   用橘版還是白版）。
   ⚠ 2026-09-16 起**所有主題都有人物框**（使用者指示），所以沒有任何主題宣告
   noPhoto——先前主題1-1~3-4 那個旗標已經拿掉。旗標本身在 bn-editor.html 的
   placementFor() 還留著當機制（之後真有某個主題不放人物框，加一行 noPhoto:true
   就好），但目前沒有資料會走到。人物框裡預設放 img/圖素版/ 的圖素，
   清單見 packs/bn/photo-assets.js。
   colors 與 logoColor 兩者都來自工單「BN主題文案配色」分頁。⚠ 那個分頁有
   兩張表，欄位定義不一樣，抄的時候要看清楚是哪一張：
   ① 常規表（主題1-1~5-1、5-4）：「主標顏色/小字顏色」→ title＋small、
      「副標顏色/CTA底色顏色」→ sub＋ctaBg（同一個色號兩個用途）、
      「CTA文字顏色」→ ctaText、「蝦皮/直播LOGO顏色」→ logoColor。
   ② 5-2／5-3 專用表：副標與 CTA 底色**分開**兩欄，且 CTA 底色跟主標同色
      （sub 是另一個色）。這就是使用者說的「5-2/5-3 顏色邏輯較不同」。
      colors 這五個欄位本來就各自獨立，所以不需要任何程式改動，填值即可。
   logoColor：白→'white'、橘→'orange'。
   新增主題：① 把圖丟進 img/主題X 資料夾 ② 在這裡多加一組物件
   （dir 指到那個資料夾，images 逐一列出版位 id → 檔名。不會、也不應該
   去猜資料夾內容——瀏覽器讀不到目錄清單，這份表就是目錄）。
   換圖不用改這裡，也不用跑任何腳本：覆蓋 img/ 裡的檔、重新整理即可。
   ⚠ 部署到 Linux 主機（GitLab）時檔名大小寫必須完全一致。
   ========================================================= */
(function () {
  window.XD = window.XD || {}; XD.packs = XD.packs || {};
  XD.packs.bnThemes = {
    themes: [
      {
        id: '1-1',
        name: '主題1-1',
        dir: 'img/主題1-1/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#f5caa6', small: '#ffffff', ctaBg: '#f5caa6', ctaText: '#2e5270', arc: '#2e5270' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '1-2',
        name: '主題1-2',
        dir: 'img/主題1-2/',
        logoColor: 'orange',
        colors: { title: '#4f6c37', sub: '#52236a', small: '#4f6c37', ctaBg: '#52236a', ctaText: '#ffffff', arc: '#b9e5a2' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '1-3',
        name: '主題1-3',
        dir: 'img/主題1-3/',
        logoColor: 'orange',
        colors: { title: '#7d7b1b', sub: '#2e3c91', small: '#7d7b1b', ctaBg: '#2e3c91', ctaText: '#ffffff', arc: '#f1dc73' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '1-4',
        name: '主題1-4',
        dir: 'img/主題1-4/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#a4d7ff', small: '#ffffff', ctaBg: '#a4d7ff', ctaText: '#89461d', arc: '#89461d' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '2-1',
        name: '主題2-1',
        dir: 'img/主題2-1/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#5c342d', small: '#ffffff', ctaBg: '#5c342d', ctaText: '#ffffff', arc: '#88b7c0' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '2-2',
        name: '主題2-2',
        dir: 'img/主題2-2/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#e2ffc4', small: '#ffffff', ctaBg: '#e2ffc4', ctaText: '#9384cf', arc: '#9384cf' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '2-3',
        name: '主題2-3',
        dir: 'img/主題2-3/',
        logoColor: 'orange',
        colors: { title: '#ed9620', sub: '#1f2632', small: '#ed9620', ctaBg: '#1f2632', ctaText: '#ffffff', arc: '#f7e3c8' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '2-4',
        name: '主題2-4',
        dir: 'img/主題2-4/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#0a4c51', small: '#ffffff', ctaBg: '#0a4c51', ctaText: '#ffffff', arc: '#f7908e' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '3-1',
        name: '主題3-1',
        dir: 'img/主題3-1/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#fff477', small: '#ffffff', ctaBg: '#fff477', ctaText: '#5495d0', arc: '#5495d0' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '3-2',
        name: '主題3-2',
        dir: 'img/主題3-2/',
        logoColor: 'orange',
        colors: { title: '#44834b', sub: '#653f62', small: '#44834b', ctaBg: '#653f62', ctaText: '#ffffff', arc: '#a6d8ab' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '3-3',
        name: '主題3-3',
        dir: 'img/主題3-3/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#dea6d0', small: '#ffffff', ctaBg: '#dea6d0', ctaText: '#1b572a', arc: '#1b572a' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '3-4',
        name: '主題3-4',
        dir: 'img/主題3-4/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#ffc5bb', small: '#ffffff', ctaBg: '#ffc5bb', ctaText: '#1f5d68', arc: '#1f5d68' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '4-1',
        name: '主題4-1',
        dir: 'img/主題4-1/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#f19d96', small: '#ffffff', ctaBg: '#f19d96', ctaText: '#005099', arc: '#005099' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '4-2',
        name: '主題4-2',
        dir: 'img/主題4-2/',
        logoColor: 'orange',
        colors: { title: '#aa7127', sub: '#1f396f', small: '#aa7127', ctaBg: '#1f396f', ctaText: '#ffffff', arc: '#f4c991' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '4-3',
        name: '主題4-3',
        dir: 'img/主題4-3/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#52236a', small: '#ffffff', ctaBg: '#52236a', ctaText: '#ffffff', arc: '#73c5b0' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '4-4',
        name: '主題4-4',
        dir: 'img/主題4-4/',
        logoColor: 'white',
        colors: { title: '#f6f0ff', sub: '#28370d', small: '#f6f0ff', ctaBg: '#28370d', ctaText: '#ffffff', arc: '#ac93d5' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '5-1',
        name: '主題5-1',
        dir: 'img/主題5-1/',
        logoColor: 'white',
        colors: { title: '#a75f30', sub: '#1c4f78', small: '#a75f30', ctaBg: '#1c4f78', ctaText: '#ffffff', arc: '#f6b286' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '5-2',
        name: '主題5-2',
        dir: 'img/主題5-2/',
        logoColor: 'white',
        colors: { title: '#c2f4ce', sub: '#faf0fa', small: '#c2f4ce', ctaBg: '#c2f4ce', ctaText: '#5fa16f', arc: '#5fa16f' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '5-3',
        name: '主題5-3',
        dir: 'img/主題5-3/',
        logoColor: 'white',
        colors: { title: '#bac5ff', sub: '#f1e49b', small: '#bac5ff', ctaBg: '#bac5ff', ctaText: '#0a1865', arc: '#0a1865' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      },
      {
        id: '5-4',
        name: '主題5-4',
        dir: 'img/主題5-4/',
        logoColor: 'white',
        colors: { title: '#ffffff', sub: '#aa383a', small: '#ffffff', ctaBg: '#aa383a', ctaText: '#ffffff', arc: '#7cc6d6' },
        images: {
      "蝦大課程首圖 長型_1080x608": "空圖/01_蝦大課程首圖 長型_1080x608.jpg",
      "蝦大課程首圖 方型_608x608": "空圖/02_蝦大課程首圖 方型_608x608.jpg",
      "SU BN－課程HBN (APP) (縮圖)_540x304": "空圖/03_SU BN－課程HBN (APP) (縮圖)_540x304.jpg",
      "SU BN_1040x1040": "空圖/04_SUBN 方型_1040x1040.jpg",
      "Shopee DDC_531×792": "空圖/06_Shopee DDC_531×792.jpg",
      "Shopee HBN_1200x360": "空圖/07_Shopee HBN_1200x360.jpg",
      "Seller Center－Homepage-Banner_360x186": "空圖/08_Seller Center－Homepage-Banner_360x186.jpg",
      "Seller Center－image Popup_800x720": "空圖/09_Seller Center－image Popup_800x720.jpg",
      "Seller Center－APP-Marketing banner_1200×346": "空圖/10_Seller Center－APP-Marketing banner_1200×346.jpg",
      "Seller Center－APP-Seller Announcement_1125×324": "空圖/11_Seller Center－APP-Seller Announcement_1125×324.jpg",
      "Seller EDM_300x250": "空圖/12_Seller EDM_300x250.jpg",
      "Seller EDM_600x150": "空圖/13_Seller EDM_600x150.jpg",
      "AR_100×100": "空圖/14_AR_100×100.jpg",
      "LINE_1200x1200": "空圖/15_LINE_1200x1200.jpg",
      "OM_AD2_640×320": "空圖/16_OM_AD2_640×320.jpg",
      "SUBN 方型_800x800": "空圖/05_SUBN 方型_800x800.jpg",
      "LPBN_1200x550": "空圖/17_LPBN_1200x550.jpg"
        }
      }
    ]
  };
})();
