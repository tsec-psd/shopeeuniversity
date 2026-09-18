/* =========================================================
   packs/bn/master-placements.js -- BN 公版定位（公版版，全部主題共用）
   =========================================================
   由 tools/gen_bn_master_placements.py 從 主題JSON/主題公版定位 New/ 產生，
   不要手改；改了公版 PSD 就重跑那支腳本。

   使用者 2026-09-10 指示：所有主題的文字與人物框定位一律以公版為準，
   所以位置只有這一份——主題之間只差「底圖」與「文案配色」
   （packs/bn/themes.js）。2026-09-16 起連人物框也一律照畫：所有主題都有
   人物框（先前主題1-1~3-4 的 noPhoto 旗標已拿掉），框裡預設放 img/圖素版/
   的圖素，見 packs/bn/photo-assets.js。

   人物框在這一版是**一個**「雙人人物框」（長寬比約 1.70），裡面放一張
   1200×700 的圖素（圖素本身可能畫了一人或兩人）。先前「人物1／人物2」
   兩個獨立框的雙人版已停用，`photos` 因此長度 1——但仍然是陣列，
   渲染端不分「一個框」與「多個框」兩條路。

   欄位：title / sub / small / logo（整條LOGO帶，渲染端等分成蝦大／
   蝦皮直播／分隔線／廠商LOGO位）/ shopeeLogo（右上角蝦皮購物LOGO，
   只有 3 塊板有）/ cta（按鈕本體）/ ctaText.box（只用來算字級）/
   photos（人物框陣列，這一版長度 1）/ ar（AR版位專用文案框）。
   沒有的欄位是 null，渲染端本來就是「有欄位才畫」。

   ⚠ 人物框「底部超出畫布 1~2px」是原本的設計（圖素下緣貼齊版位底部、
   多出來的被裁掉），不是轉檔錯誤。

   ⚠ 沒有顏色資料：來源色塊的 fill 只是標記色。文字/CTA 顏色來自
   packs/bn/themes.js 的各主題 colors 與 bn-editor.html 的 BOARD_FIXED_COLORS。
   ========================================================= */
(function(){ window.XD = window.XD || {}; XD.packs = XD.packs || {};
XD.packs.bnMasterPlacements = {
  "蝦大課程首圖 長型_1080x608": {
    "title": [
      55,
      245,
      470,
      56
    ],
    "sub": [
      55,
      306,
      471,
      66
    ],
    "small": [
      55,
      377,
      471,
      35
    ],
    "logo": [
      55,
      180,
      471,
      57
    ],
    "shopeeLogo": null,
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        548,
        153,
        512,
        300
      ]
    ],
    "ar": null
  },
  "蝦大課程首圖 方型_608x608": {
    "title": [
      74,
      106,
      462,
      43
    ],
    "sub": [
      74,
      153,
      462,
      54
    ],
    "small": [
      74,
      213,
      461,
      27
    ],
    "logo": [
      73,
      57,
      463,
      44
    ],
    "shopeeLogo": null,
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        13,
        269,
        582,
        341
      ]
    ],
    "ar": null
  },
  "SU BN－課程HBN (APP) (縮圖)_540x304": {
    "title": [
      26,
      121,
      243,
      29
    ],
    "sub": [
      26,
      152,
      243,
      34
    ],
    "small": [
      26,
      188,
      243,
      17
    ],
    "logo": [
      26,
      88,
      244,
      30
    ],
    "shopeeLogo": null,
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        284,
        81,
        240,
        141
      ]
    ],
    "ar": null
  },
  "SU BN_1040x1040": {
    "title": [
      60,
      224,
      920,
      82
    ],
    "sub": [
      60,
      314,
      919,
      93
    ],
    "small": [
      59,
      414,
      921,
      46
    ],
    "logo": [
      258,
      125,
      523,
      92
    ],
    "shopeeLogo": null,
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        60,
        503,
        919,
        538
      ]
    ],
    "ar": null
  },
  "Shopee DDC_531×792": {
    "title": [
      45,
      166,
      442,
      46
    ],
    "sub": [
      44,
      221,
      444,
      62
    ],
    "small": [
      44,
      292,
      444,
      29
    ],
    "logo": [
      45,
      95,
      441,
      62
    ],
    "shopeeLogo": null,
    "cta": [
      193,
      672,
      145,
      49
    ],
    "ctaText": {
      "box": [
        211,
        680,
        110,
        34
      ]
    },
    "photos": [
      [
        26,
        336,
        479,
        281
      ]
    ],
    "ar": null
  },
  "Shopee HBN_1200x360": {
    "title": [
      97,
      151,
      448,
      41
    ],
    "sub": [
      97,
      198,
      448,
      62
    ],
    "small": [
      97,
      270,
      449,
      29
    ],
    "logo": [
      97,
      91,
      449,
      57
    ],
    "shopeeLogo": null,
    "cta": [
      1035,
      288,
      144,
      49
    ],
    "ctaText": {
      "box": [
        1051,
        295,
        112,
        34
      ]
    },
    "photos": [
      [
        594,
        36,
        555,
        326
      ]
    ],
    "ar": null
  },
  "Seller Center－Homepage-Banner_360x186": {
    "title": [
      15,
      56,
      330,
      37
    ],
    "sub": [
      15,
      94,
      330,
      41
    ],
    "small": [
      15,
      136,
      331,
      22
    ],
    "logo": [
      15,
      14,
      331,
      41
    ],
    "shopeeLogo": null,
    "cta": [
      280,
      159,
      72,
      24
    ],
    "ctaText": {
      "box": [
        288,
        163,
        56,
        17
      ]
    },
    "photos": null,
    "ar": null
  },
  "Seller Center－image Popup_800x720": {
    "title": [
      98,
      156,
      604,
      56
    ],
    "sub": [
      98,
      217,
      605,
      70
    ],
    "small": [
      98,
      292,
      605,
      35
    ],
    "logo": [
      100,
      95,
      602,
      57
    ],
    "shopeeLogo": null,
    "cta": [
      292,
      617,
      215,
      61
    ],
    "ctaText": {
      "box": [
        321,
        626,
        158,
        42
      ]
    },
    "photos": [
      [
        82,
        349,
        635,
        372
      ]
    ],
    "ar": null
  },
  "Seller Center－APP-Marketing banner_1200×346": {
    "title": [
      97,
      139,
      448,
      43
    ],
    "sub": [
      97,
      185,
      448,
      70
    ],
    "small": [
      97,
      258,
      449,
      32
    ],
    "logo": [
      97,
      81,
      448,
      57
    ],
    "shopeeLogo": null,
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        596,
        29,
        544,
        319
      ]
    ],
    "ar": null
  },
  "Seller Center－APP-Seller Announcement_1125×324": {
    "title": [
      38,
      120,
      448,
      48
    ],
    "sub": [
      38,
      175,
      448,
      61
    ],
    "small": [
      38,
      243,
      449,
      29
    ],
    "logo": [
      38,
      63,
      449,
      50
    ],
    "shopeeLogo": null,
    "cta": [
      940,
      265,
      165,
      47
    ],
    "ctaText": {
      "box": [
        960,
        270,
        125,
        36
      ]
    },
    "photos": [
      [
        540,
        32,
        501,
        294
      ]
    ],
    "ar": null
  },
  "Seller EDM_300x250": {
    "title": [
      55,
      42,
      190,
      23
    ],
    "sub": [
      28,
      67,
      244,
      32
    ],
    "small": [
      27,
      102,
      245,
      17
    ],
    "logo": [
      54,
      12,
      191,
      27
    ],
    "shopeeLogo": [
      252,
      6,
      40,
      51
    ],
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        42,
        124,
        216,
        128
      ]
    ],
    "ar": null
  },
  "Seller EDM_600x150": {
    "title": [
      34,
      49,
      241,
      24
    ],
    "sub": [
      34,
      74,
      241,
      35
    ],
    "small": [
      34,
      113,
      241,
      18
    ],
    "logo": [
      34,
      18,
      240,
      29
    ],
    "shopeeLogo": null,
    "cta": [
      522,
      118,
      67,
      24
    ],
    "ctaText": {
      "box": [
        530,
        122,
        51,
        17
      ]
    },
    "photos": [
      [
        317,
        12,
        240,
        141
      ]
    ],
    "ar": null
  },
  "AR_100×100": {
    "title": null,
    "sub": null,
    "small": null,
    "logo": null,
    "shopeeLogo": null,
    "cta": null,
    "ctaText": null,
    "photos": null,
    "ar": [
      15,
      14,
      71,
      73
    ]
  },
  "LINE_1200x1200": {
    "title": [
      69,
      261,
      1061,
      84
    ],
    "sub": [
      68,
      356,
      1061,
      113
    ],
    "small": [
      67,
      484,
      1063,
      46
    ],
    "logo": [
      193,
      143,
      811,
      106
    ],
    "shopeeLogo": [
      1027,
      25,
      129,
      167
    ],
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        61,
        572,
        1077,
        629
      ]
    ],
    "ar": null
  },
  "OM_AD2_640×320": {
    "title": [
      20,
      131,
      302,
      36
    ],
    "sub": [
      20,
      169,
      302,
      45
    ],
    "small": [
      20,
      219,
      302,
      24
    ],
    "logo": [
      20,
      87,
      302,
      40
    ],
    "shopeeLogo": [
      581,
      8,
      52,
      68
    ],
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        339,
        83,
        280,
        165
      ]
    ],
    "ar": null
  },
  "SUBN 方型_800x800": {
    "title": [
      93,
      141,
      615,
      56
    ],
    "sub": [
      93,
      203,
      615,
      70
    ],
    "small": [
      93,
      280,
      614,
      35
    ],
    "logo": [
      92,
      78,
      615,
      57
    ],
    "shopeeLogo": null,
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        91,
        365,
        619,
        362
      ]
    ],
    "ar": null
  },
  "LPBN_1200x550": {
    "title": [
      58,
      244,
      448,
      55
    ],
    "sub": [
      59,
      306,
      448,
      70
    ],
    "small": [
      59,
      379,
      448,
      32
    ],
    "logo": [
      59,
      173,
      449,
      67
    ],
    "shopeeLogo": null,
    "cta": null,
    "ctaText": null,
    "photos": [
      [
        538,
        90,
        632,
        370
      ]
    ],
    "ar": null
  }
};
})();
