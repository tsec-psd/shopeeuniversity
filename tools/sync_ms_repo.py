# -*- coding: utf-8 -*-
"""
把 MS 線上編輯器同步到「MS 獨立 repo」（specs/013）。

    這個 repo（V1）               ->  MS 獨立 repo 的本機 clone
    兩支工具＋兩個入口（設計師用）     只有 MS（給蝦大用）

**V1 是唯一的開發來源**，MS repo 只是它的子集合。不要直接在 MS repo 裡改檔案，
下一次同步會整個蓋掉（腳本看到 MS repo 有沒 commit 的修改就會停下來）。

用法：
    python tools/sync_ms_repo.py                  # 同步到預設位置（V1 旁邊的 MS-repo 資料夾）
    python tools/sync_ms_repo.py <資料夾>          # 同步到指定的 MS repo 本機 clone
    python tools/sync_ms_repo.py <資料夾> --commit # 同步＋commit（不推）
    python tools/sync_ms_repo.py <資料夾> --push   # 同步＋commit＋push
    python tools/sync_ms_repo.py --preview         # 只輸出到 output/ms-repo-preview/（探針用）

要帶哪些檔案**不寫死清單**：從 ms-live.html 與 MS 使用說明出發，沿著 html 的
href/src、css 的 url() 一路找下去（js 不追，裡面的路徑是程式組的）。所以 ms-live
多載一支 core/*.js，下次同步就會自動帶上，不用回來改這支腳本。

首頁不另外維護一份：直接拿 V1 的 index.html，刪掉 BN-ONLY 記號之間的整段。
"""
import os
import posixpath
import re
import shutil
import subprocess
import sys
from urllib.parse import unquote

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:  # noqa: BLE001
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DEST = os.path.join(os.path.dirname(ROOT), 'MS-repo')
PREVIEW_DEST = os.path.join(ROOT, 'output', 'ms-repo-preview')

HOME = 'index.html'
ENTRIES = ['tools/ms-live.html', 'MS線上編輯器使用說明.html']
# 追連結追到這些就停下來：代表 MS 那邊有東西連到 BN，同步過去就會把 BN 一起帶走
FORBIDDEN = ['tools/bn-editor.html', 'BN編輯器使用說明.html', 'img/']
MANIFEST = '.ms-sync-manifest'

# README 刻意不寫開發 repo 的名字：MS repo 是給蝦大的，不要從這裡指回 BN 所在的 repo
README = """# 蝦大 MS 線上編輯器

線上使用：開這個 repo 的 GitHub Pages 網址（Settings → Pages 顯示的那一個）。

⚠ 這裡的檔案是從開發用的 repo 以 `sync_ms_repo.py` 同步產生的，**不要直接在這裡改**——
下一次同步會整個蓋掉。要改請回開發 repo 改完、commit，再重新同步。
"""
EXTRA = {'.nojekyll': b'', 'README.md': README.encode('utf-8')}

MARK = re.compile(r'^\s*(?:/\*|<!--)\s*BN-ONLY:(start|end)\s*(?:\*/|-->)\s*$')
REF_HTML = re.compile(r'\b(?:href|src)="([^"]+)"')
# 字型檔名帶括號（ShopeeNotoSans(content)-Bold.woff2），有引號時不能用「切到 ) 為止」
REF_CSS = re.compile(r'url\(\s*(?:"([^"]+)"|\'([^\']+)\'|([^\'")\s]+))\s*\)')
SKIP = re.compile(r'^(?:#|[a-z][a-z0-9+.-]*:|//)', re.I)


class SyncError(Exception):
    pass


# ---------------------------------------------------------------- 首頁
def strip_bn(text):
    """刪掉 BN-ONLY:start ~ BN-ONLY:end（含記號本身）。記號必須獨佔一行、成對、不巢狀。"""
    out, inside, pairs = [], False, 0
    for i, line in enumerate(text.splitlines(True), 1):
        m = MARK.match(line.rstrip('\r\n'))
        if m:
            if m.group(1) == 'start':
                if inside:
                    raise SyncError('index.html 第 %d 行：上一段 BN-ONLY 還沒結束又開始一段' % i)
                inside = True
                pairs += 1
            else:
                if not inside:
                    raise SyncError('index.html 第 %d 行：BN-ONLY 結束記號沒有對應的開始' % i)
                inside = False
            continue
        if not inside:
            out.append(line)
    if inside:
        raise SyncError('index.html：最後一段 BN-ONLY 沒有結束記號')
    if not pairs:
        raise SyncError('index.html 找不到任何 BN-ONLY 記號')
    res = ''.join(out)
    for leak in ('bn-editor', 'BN-ONLY'):
        if leak in res:
            raise SyncError('刪完 BN-ONLY 後首頁仍含「%s」：有 BN 的東西沒包進記號' % leak)
    return res


# ---------------------------------------------------------------- 追連結
def exact_exists(rel):
    """逐層比對真實目錄：Windows 不分大小寫，os.path.exists 會讓大小寫打錯的路徑過關，
       上了 GitHub Pages（Linux）才 404。"""
    cur = ROOT
    for part in rel.split('/'):
        try:
            if part not in os.listdir(cur):
                return False
        except OSError:
            return False
        cur = os.path.join(cur, part)
    return os.path.isfile(cur)


def refs(rel, text):
    base = posixpath.dirname(rel)
    if rel.endswith('.html'):
        found = REF_HTML.findall(text)
    else:
        found = [next(g for g in m if g) for m in REF_CSS.findall(text)]
    for u in found:
        if SKIP.match(u):
            continue
        p = unquote(u.split('#')[0].split('?')[0])
        if not p:
            continue
        r = posixpath.normpath(posixpath.join(base, p))
        if r == '..' or r.startswith('../'):
            raise SyncError('%s 裡的 %s 跳出專案根目錄' % (rel, u))
        yield r


def is_forbidden(rel):
    return any(rel == f or (f.endswith('/') and rel.startswith(f)) for f in FORBIDDEN)


def collect():
    """回傳 {發佈路徑: bytes}，就是 MS repo 該有的全部檔案。"""
    with open(os.path.join(ROOT, HOME), encoding='utf-8', newline='') as f:
        home = strip_bn(f.read())
    files = {HOME: home.encode('utf-8')}
    todo = [(r, HOME) for r in refs(HOME, home)] + [(e, '（起點）') for e in ENTRIES]
    while todo:
        rel, src = todo.pop()
        if rel in files:
            continue
        if is_forbidden(rel):
            raise SyncError('%s 連到了 BN 專屬的 %s，同步過去會把 BN 一起帶走' % (src, rel))
        if not exact_exists(rel):
            raise SyncError('%s 連到的 %s 不存在（或大小寫／正規化不符）' % (src, rel))
        with open(os.path.join(ROOT, *rel.split('/')), 'rb') as f:
            data = f.read()
        files[rel] = data
        if rel.endswith(('.html', '.css')):
            todo.extend((r, rel) for r in refs(rel, data.decode('utf-8')))
    files.update(EXTRA)
    return files


# ---------------------------------------------------------------- 寫出
def write_tree(dest, files):
    """只動自己上一次寫過的檔案（記在 MANIFEST）：使用者在 MS repo 自己加的檔不會被刪。"""
    man = os.path.join(dest, MANIFEST)
    old = []
    if os.path.isfile(man):
        with open(man, encoding='utf-8') as f:
            old = [ln.strip() for ln in f if ln.strip()]
    added = updated = 0
    for rel, data in sorted(files.items()):
        p = os.path.join(dest, *rel.split('/'))
        if os.path.isfile(p):
            with open(p, 'rb') as f:
                if norm_eol(f.read()) == norm_eol(data):
                    continue
            updated += 1
        else:
            added += 1
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, 'wb') as f:
            f.write(data)
    removed = [r for r in old if r not in files]
    for rel in removed:
        p = os.path.join(dest, *rel.split('/'))
        if os.path.isfile(p):
            os.remove(p)
        d = os.path.dirname(p)
        while os.path.normcase(d) != os.path.normcase(dest) and os.path.isdir(d) and not os.listdir(d):
            os.rmdir(d)
            d = os.path.dirname(d)
    with open(man, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(sorted(files)) + '\n')
    return added, updated, removed


def preview():
    """探針用：每次整個重建，不碰 git。"""
    files = collect()
    shutil.rmtree(PREVIEW_DEST, ignore_errors=True)
    os.makedirs(PREVIEW_DEST)
    write_tree(PREVIEW_DEST, files)
    return files


# ---------------------------------------------------------------- git
def git(cwd, *args, check=True, raw=False):
    r = subprocess.run(['git', '-C', cwd] + list(args), capture_output=True,
                       text=True, encoding='utf-8', errors='replace')
    if check and r.returncode:
        raise SyncError('git %s 失敗：%s' % (' '.join(args), (r.stderr or r.stdout).strip()))
    return r.stdout if raw else r.stdout.strip()


def check_dest(dest):
    if not os.path.isdir(dest):
        raise SyncError('找不到 %s。先把 MS repo clone 到這裡，或在參數指定位置。' % dest)
    if not os.path.exists(os.path.join(dest, '.git')):
        raise SyncError('%s 不是 git repo（沒有 .git）' % dest)
    rd, rr = os.path.normcase(os.path.realpath(dest)), os.path.normcase(os.path.realpath(ROOT))
    if rd == rr or rd.startswith(rr + os.sep):
        raise SyncError('目標在 V1 裡面。MS repo 要 clone 在 V1 外面，不然會變成巢狀 repo')
    src_remote = git(ROOT, 'remote', 'get-url', 'origin', check=False)
    dst_remote = git(dest, 'remote', 'get-url', 'origin', check=False)
    if src_remote and dst_remote == src_remote:
        raise SyncError('目標的 origin 跟 V1 一樣（%s），這不是 MS repo' % dst_remote)
    return dst_remote


def foreign_changes(dest, files):
    """MS repo 裡沒 commit 的修改，扣掉「跟這次要寫的內容一模一樣」的（那是上一次
       只同步沒 commit 留下的），剩下的才是有人直接在 MS repo 改的。"""
    old = set()
    man = os.path.join(dest, MANIFEST)
    if os.path.isfile(man):
        with open(man, encoding='utf-8') as f:
            old = {ln.strip() for ln in f if ln.strip()}
    out = []
    # -z：路徑不加引號、不跳脫中文；-uall：未追蹤的資料夾要展開成檔案
    # raw：不能 strip，狀態碼第一格可能是空白（「 M」＝已追蹤、改了沒 add）
    entries = git(dest, 'status', '--porcelain', '-z', '-uall', raw=True).split('\0')
    i = 0
    while i < len(entries):
        e = entries[i]
        i += 1
        if len(e) < 4:
            continue
        code, rel = e[:2], e[3:]
        if 'R' in code or 'C' in code:
            i += 1                      # 改名的話下一筆是原路徑
        if rel == MANIFEST:
            continue
        p = os.path.join(dest, *rel.split('/'))
        if rel in files and os.path.isfile(p):
            with open(p, 'rb') as f:
                if norm_eol(f.read()) == norm_eol(files[rel]):
                    continue
        elif rel in old and rel not in files and not os.path.exists(p):
            continue                    # 上一次同步刪掉的
        out.append(code + ' ' + rel)
    return out


def norm_eol(b):
    # Windows 的 git 預設 autocrlf：checkout 出來是 CRLF，同一份內容不能因為換行被當成「有人改過」
    return b.replace(b'\r\n', b'\n')


def main(argv):
    flags = {a for a in argv if a.startswith('--')}
    args = [a for a in argv if not a.startswith('--')]
    unknown = flags - {'--commit', '--push', '--preview', '--force'}
    if unknown or len(args) > 1:
        print(__doc__)
        return 2
    try:
        if '--preview' in flags:
            files = preview()
            print('已輸出預覽：%s（%d 個檔案）' % (PREVIEW_DEST, len(files)))
            return 0

        dest = os.path.abspath(args[0]) if args else DEFAULT_DEST
        commit = '--commit' in flags or '--push' in flags
        remote = check_dest(dest)
        src_head = git(ROOT, 'rev-parse', '--short', 'HEAD')
        src_dirty = git(ROOT, 'status', '--porcelain', '--untracked-files=no')
        if src_dirty and commit:
            raise SyncError('V1 有還沒 commit 的修改。先在 V1 commit，MS repo 的每個版本'
                            '才對得回 V1 的某個 commit：\n' + src_dirty)

        files = collect()
        foreign = foreign_changes(dest, files)
        if foreign and '--force' not in flags:
            raise SyncError('MS repo 有不是同步產生的修改（有人直接在那邊改？）：\n  %s\n'
                            '這些改動下一次同步會被蓋掉。要保留就回 V1 改；確認可以蓋掉再加 --force。'
                            % '\n  '.join(foreign))
        added, updated, removed = write_tree(dest, files)
        total = sum(len(v) for v in files.values())
        print('來源  %s @ %s%s' % (ROOT, src_head, '（含未 commit 的修改）' if src_dirty else ''))
        print('目標  %s  %s' % (dest, remote))
        print('檔案  %d 個，%.1f MB；新增 %d、更新 %d、刪除 %d'
              % (len(files), total / 1048576, added, updated, len(removed)))
        for r in removed:
            print('      刪除 ' + r)

        if not commit:
            print('\n只同步了檔案。確認沒問題後：')
            print('  python tools/sync_ms_repo.py "%s" --push' % dest)
            return 0
        git(dest, 'add', '-A')
        if not git(dest, 'status', '--porcelain'):
            print('MS repo 已經是最新，沒有東西要 commit。')
        else:
            if git(dest, 'rev-parse', '--verify', 'HEAD', check=False) == '':
                git(dest, 'symbolic-ref', 'HEAD', 'refs/heads/main')   # 空 repo 的第一個 commit 一律放 main
            git(dest, 'commit', '-m', '同步 MS 線上編輯器（來源 %s）' % src_head)
            print('已 commit：' + git(dest, 'log', '-1', '--format=%h %s'))
        if '--push' in flags:
            git(dest, 'push', '-u', 'origin', 'HEAD')
            print('已 push 到 ' + remote)
        return 0
    except SyncError as e:
        print('[停止] ' + str(e))
        return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
