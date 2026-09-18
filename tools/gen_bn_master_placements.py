# -*- coding: utf-8 -*-
"""
產生 BN 公版定位資料（全部主題共用），兩份：

    主題JSON/主題公版定位 New/     ->  packs/bn/master-placements.js
                                       XD.packs.bnMasterPlacements     （文字/LOGO/CTA ＋ 人物框）
    主題JSON/主題公版定位 圖素版/  ->  packs/bn/stock-placements.js
                                       XD.packs.bnStockPlacements      （只有圖素定位框）

第二份**只取「圖素定位框」**：兩個來源的文字/LOGO/CTA 欄位實測完全一樣，
所以腳本會逐欄比對、不一致就停下來（設計端若哪天連文字也改了，要先確認
是兩份都改還是只有圖素版改，不能靜靜地讓兩份定位漂開）。

使用者 2026-09-16 指示「所有主題的定位先統一用 主題公版定位 New」，所以只有這一份。
先前並存的單人版（主題公版定位）與雙人版（主題公版定位 雙人版）都已停用，連同
packs/bn/master-placements-duo.js 與編輯器右欄的「人物版位」切換一起移除。
兩份舊來源仍在 主題JSON/ 底下，真要回頭比較就在 VARIANTS 多加一行重跑。

New 版的人物框是**一個**「雙人人物框」（不是先前的「人物1」「人物2」兩個框），
長寬比約 1.70＝圖素的**畫布**比例（1200/700）。

⚠ 但圖素的**墨迹**只佔畫布寬 40~62%（插畫四周留了透明邊），照畫布擺進人物框的話
插畫只有設計尺寸的 28~87%（實測中位數約一半）。所以使用者 2026-09-17 另外給了
「主題公版定位 圖素版」——那份的「圖素定位框」長寬比一律 1.10，正好等於雙人圖素
**墨迹**的長寬比（740/674＝1.098），也就是「插畫本身該佔的範圍」。
渲染端因此分兩條路（見 bn-editor.html 的 photoBoxAt()／slotInk()）：
    圖素          -> 圖素定位框 ＋ 墨迹貼合（開機量 alpha 邊界）
    自己上傳的照片 -> 人物框     ＋ 整張 contain（維持原本手感）

來源：Photoshop 逐層抽出的色塊標記，每個色塊一個 psdName，不用靠幾何推論。
使用者 2026-09-10 指示「所有主題的文字及人物框定位以這個路徑為主」，所以
定位只有這一份（不再像先前那樣主題A／主題B／主題1-1~3-4 各留一份）。

psdName -> 定位欄位對照（其餘圖層一律忽略，例如「矩形 2037」那種
超出畫布的綠色背景標記塊，不是版面元素）：
    主標              -> title
    副標              -> sub
    小字              -> small
    蝦皮LOGO範圍      -> logo          （整條 LOGO 帶，渲染端等分成
                                        蝦大／蝦皮直播／分隔線／廠商LOGO位）
    蝦皮購物LOGO範圍  -> shopeeLogo    （右上角那顆「蝦皮購物」LOGO，
                                        目前只有 3 塊板有）
    CTA範圍           -> cta           （按鈕本體）
    CTA文字範圍       -> ctaText.box   （只用來算字級，位置仍用 cta）
    雙人人物框        -> photos[0]     （New 版的寫法：一個框放一張圖素）
    圖素定位框        -> 圖素版那份的唯一欄位（框住插畫墨迹該佔的範圍）
    人物N             -> photos[N-1]   （舊版寫法，仍然吃得下；不限數量，照數字
                                        排序，沿用主題B「廠商LOGOn」那套慣例）
    AR文案            -> ar

⚠ photos 一律是陣列（New 版長度 1）。渲染端統一吃陣列，不用為「一個框」跟
「多個框」分兩條程式路徑——之後公版若又改成多框，渲染端不用跟著改。

版位對應一律「靠 canvas 尺寸」比對 packs/bn/placements.js 的版位清單，
不靠檔名——公版檔名跟版位 id 的全形/半形破折號、SUBN/SU BN 寫法都對不起來
（例如 "BN1_04_SUBN 方型_1040x1040" 對到的 id 是 "SU BN_1040x1040"），
尺寸則是唯一且穩定的鍵（17 塊板尺寸互不重複，已驗證）。

⚠ 色塊的 fill 只是標記色，不是設計色，一律不取——文字/CTA 顏色來自
packs/bn/themes.js 各主題的 colors（工單「BN主題文案配色」），以及
tools/bn-editor.html 的 BOARD_FIXED_COLORS。

改了公版 PSD 之後重跑這支腳本即可。
"""
import io, json, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_ROOT = os.path.join(os.path.dirname(ROOT), u'主題JSON')
BOARDS_JS = os.path.join(ROOT, 'packs', 'bn', 'placements.js')

# (來源資料夾, 輸出檔名, 全域變數名, 人話說明)
# 主要那一份：使用者 2026-09-16 指示所有主題統一用「主題公版定位 New」。
VARIANTS = [
    (u'主題公版定位 New', 'master-placements.js', 'bnMasterPlacements', u'公版'),
]
# 圖素定位框（2026-09-17 新增）：同一批板、只取那一個框，其餘欄位拿來跟公版交叉核對。
STOCK_SRC = u'主題公版定位 圖素版'
STOCK_OUT = 'stock-placements.js'
STOCK_VAR = "bnStockPlacements"

FIELD_BY_PSD_NAME = {
    u'主標': 'title',
    u'副標': 'sub',
    u'小字': 'small',
    u'蝦皮LOGO範圍': 'logo',
    u'蝦皮購物LOGO範圍': 'shopeeLogo',
    u'CTA範圍': 'cta',
    u'AR文案': 'ar',
}
CTA_TEXT_NAME = u'CTA文字範圍'
PERSON_RE = re.compile(u'^人物(\\d+)$')
# New 版只標一個「雙人人物框」（框裡放一張已經畫好一人或兩人的圖素）。
# 舊版的「人物1／人物2」仍然認得，兩種寫法同時出現時照編號併在一起。
DUO_FRAME_NAME = u'雙人人物框'
# 圖素版那份的框（框的是插畫墨迹，不是畫布）
STOCK_FRAME_NAME = u'圖素定位框'
# 出現在來源檔但不是版面元素的圖層（超出畫布的背景標記塊）
IGNORED_RE = re.compile(u'^矩形\\s')

ORDER = ['title', 'sub', 'small', 'logo', 'shopeeLogo', 'cta', 'ctaText', 'photos', 'ar']


def load_boards():
    """從 placements.js 讀版位 id/w/h，建立 (w,h) -> id 對照。"""
    src = io.open(BOARDS_JS, encoding='utf-8').read()
    boards = re.findall(r'"id":\s*"([^"]+)",\s*"w":\s*(\d+),\s*"h":\s*(\d+)', src)
    by_size, ids = {}, []
    for bid, w, h in boards:
        key = (int(w), int(h))
        if key in by_size:
            raise SystemExit('duplicate board size %s: %s / %s' % (key, by_size[key], bid))
        by_size[key] = bid
        ids.append(bid)
    return by_size, ids


def box(layer):
    return [round(layer['x']), round(layer['y']), round(layer['width']), round(layer['height'])]


def build(src_dir, by_size, board_ids, label):
    out, seen, unknown_layers = {}, set(), set()
    for path in sorted(glob.glob(os.path.join(src_dir, '*.json'))):
        d = json.load(io.open(path, encoding='utf-8'))
        c = d['canvas']
        size = (int(c['width']), int(c['height']))
        bid = by_size.get(size)
        if not bid:
            raise SystemExit('no board matches canvas %sx%s (%s)'
                             % (size[0], size[1], os.path.basename(path)))
        if bid in seen:
            raise SystemExit('two source files map to board %s' % bid)
        seen.add(bid)

        entry = dict((f, None) for f in ORDER)
        people = {}
        for name, layer in d.get('layers', {}).items():
            if IGNORED_RE.match(name):
                continue
            if name == CTA_TEXT_NAME:
                entry['ctaText'] = {'box': box(layer)}
                continue
            if name == DUO_FRAME_NAME or name == STOCK_FRAME_NAME:
                people[1] = box(layer)
                continue
            m = PERSON_RE.match(name)
            if m:
                people[int(m.group(1))] = box(layer)
                continue
            field = FIELD_BY_PSD_NAME.get(name)
            if not field:
                unknown_layers.add(name)
                continue
            entry[field] = box(layer)
        # 照「人物N」的數字排序，中間跳號也不會錯位
        entry['photos'] = [people[k] for k in sorted(people)] or None
        out[bid] = entry
        print('  %-46s %4dx%-4d -> %-46s 人物 %d'
              % (os.path.basename(path)[:46], size[0], size[1], bid, len(people)))

    missing = [b for b in board_ids if b not in seen]
    if missing:
        print('  WARNING: no source file for boards:', missing)
    if unknown_layers:
        print('  WARNING: unrecognised layer names (ignored):', sorted(unknown_layers))
    return out


HEADER = u'''/* =========================================================
   packs/bn/%(file)s -- BN 公版定位（%(label)s版，全部主題共用）
   =========================================================
   由 tools/gen_bn_master_placements.py 從 主題JSON/%(src)s/ 產生，
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
XD.packs.%(var)s = '''


STOCK_HEADER = u'''/* =========================================================
   packs/bn/%(file)s -- BN 圖素定位框（全部主題共用）
   =========================================================
   由 tools/gen_bn_master_placements.py 從 主題JSON/%(src)s/ 產生，不要手改。

   這一份只有一個欄位：每塊板「插畫（圖素）墨迹該佔的範圍」。
   長寬比一律約 1.10＝雙人圖素墨迹的比例（740/674），跟 master-placements.js 的
   人物框（1.70＝圖素**畫布**比例）是兩個不同用途的框：
       圖素          -> 用這一份 ＋ 墨迹貼合（見 bn-editor.html 的 slotInk()）
       自己上傳的照片 -> 用 master 的人物框 ＋ 整張 contain
   兩份的文字/LOGO/CTA 欄位實測完全相同，產生時已逐欄比對過。

   ⚠ 框底部超出畫布 5~181px 是設計如此（插畫下緣出血、被版位邊界裁掉），
   不是轉檔錯誤。
   ========================================================= */
(function(){ window.XD = window.XD || {}; XD.packs = XD.packs || {};
XD.packs.%(var)s = '''


def build_stock(by_size, board_ids, master):
    """圖素版：只取「圖素定位框」，其餘欄位跟公版逐欄比對。"""
    src_dir = os.path.join(JSON_ROOT, STOCK_SRC)
    if not os.path.isdir(src_dir):
        raise SystemExit('source folder not found: %s' % src_dir)
    print('=== 圖素定位框：%s ===' % STOCK_SRC)
    data = build(src_dir, by_size, board_ids, u'圖素')
    same_fields = [f for f in ORDER if f != 'photos']
    for bid in board_ids:
        if bid not in data or bid not in master:
            continue
        for f in same_fields:
            if data[bid].get(f) != master[bid].get(f):
                raise SystemExit(
                    u'圖素版與公版的「%s」在 %s 不一致（%s vs %s）——'
                    u'先確認是兩份都要改還是只有圖素版改，再決定怎麼處理'
                    % (f, bid, data[bid].get(f), master[bid].get(f)))
    print(u'  文字/LOGO/CTA 欄位與公版逐欄比對：完全相同')
    out = {}
    for bid in board_ids:
        ph = (data.get(bid) or {}).get('photos')
        if ph:
            out[bid] = ph[0]
    body = json.dumps(out, ensure_ascii=False, indent=2)
    header = STOCK_HEADER % {'file': STOCK_OUT, 'src': STOCK_SRC, 'var': STOCK_VAR}
    out_path = os.path.join(ROOT, 'packs', 'bn', STOCK_OUT)
    io.open(out_path, 'w', encoding='utf-8').write(header + body + u';\n})();\n')
    print('  wrote %s  %d bytes; %d 個圖素定位框\n'
          % (STOCK_OUT, os.path.getsize(out_path), len(out)))


def main():
    by_size, board_ids = load_boards()
    master = None
    for src_name, out_name, var_name, label in VARIANTS:
        src_dir = os.path.join(JSON_ROOT, src_name)
        if not os.path.isdir(src_dir):
            raise SystemExit('source folder not found: %s' % src_dir)
        print('=== %s版：%s ===' % (label, src_name))
        data = build(src_dir, by_size, board_ids, label)
        ordered = dict((b, data[b]) for b in board_ids if b in data)
        if master is None:
            master = ordered
        body = json.dumps(ordered, ensure_ascii=False, indent=2)
        header = HEADER % {'file': out_name, 'label': label, 'src': src_name, 'var': var_name}
        out_path = os.path.join(ROOT, 'packs', 'bn', out_name)
        io.open(out_path, 'w', encoding='utf-8').write(header + body + u';\n})();\n')
        n_people = sum(len(v['photos'] or []) for v in ordered.values())
        print('  wrote %s  %d bytes; %d boards; %d 個人物框\n'
              % (out_name, os.path.getsize(out_path), len(ordered), n_people))
    build_stock(by_size, board_ids, master)


main()
