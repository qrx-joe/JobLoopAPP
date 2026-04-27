import re, os

base = r'd:\code\JobLoop\jobloop-mini\src'

# Aggressive regex replacement for any var(---pattern)
patterns = [
    (r"var\(\s*['\"]?--r-xl['\"]?\s*\)", "'24rpx'"),
    (r"var\(\s*--r-xl\s*\)", "'24rpx'"),
    (r"var\(\s*['\"]?--r-lg['\"]?\s*\)", "'20rpx'"),
    (r"var\(\s*--r-lg\s*\)", "'20rpx'"),
    (r"var\(\s*['\"]?-r-lg\s*\)", "'20rpx'"),
    (r"var\(\s*['\"]?--r-md['\"]?\s*\)", "'16rpx'"),
    (r"var\(\s*--r-md\s*\)", "'16rpx'"),
    (r"var\(\s*'-r-md'\s*\)", "'16rpx'"),
    (r"var\(\s*['\"]?--r-xs['\"]?\s*\)", "'8rpx'"),
    (r"var\(\s*-r-xs\s*\)", "'8rpx'"),
    (r"var\(\s*['\"]?--r-full['\"]?\s*\)", "'999rpx'"),
    (r"var\(\s*--r-full\s*\)", "'999rpx'"),
    (r"var\(\s*['\"]?--text-1['\"]?\s*\)", "#0f172a"),
    (r"var\(\s*text-1\s*\)", "#0f172a"),
    (r"var\(\s*['\"]?--text-2['\"]?\s*\)", "#334155"),
    (r"var\(\s*text-2\s*\)", "#334155"),
    (r"var\(\s*['\"]?--text-3['\"]?\s*\)", "#64748b"),
    (r"var\(\s*text-3\s*\)", "#64748b"),
    (r"var\(\s*['\"]?--text-4['\"]?\s*\)", "#94a3b8"),
    (r"var\(\s*text-4\s*\)", "#94a3b8"),
    (r"var\(\s*['\"]?--primary['\"]?\s*\)", "#2563eb"),
    (r"var\(\s*primary\s*\)", "#2563eb"),
    (r"var\(\s*['\"]?--primary-light['\"]?\s*\)", "#60a5fa"),
    (r"var\(\s*primary-light\s*\)", "#60a5fa"),
    (r"var\(\s*['\"]?--success['\"]?\s*\)", "#10b981"),
    (r"var\(\s*success\s*\)", "#10b981"),
    (r"var\(\s*['\"]?--warning['\"]?\s*\)", "#f59e0b"),
    (r"var\(\s*warning\s*\)", "#f59e0b"),
    (r"var\(\s*['\"]?--danger['\"]?\s*\)", "#ef4444"),
    (r"var\(\s*danger\s*\)", "#ef4444"),
    (r"var\(\s*['\"]?--danger-bg['\"]?\s*\)", "#fef2f2"),
    (r"var\(\s*danger-bg\s*\)", "#fef2f2"),
    (r"var\(\s*['\"]?--border['\"]?\s*\)", "#e2e8f0"),
    (r"var\(\s*border\s*\)", "#e2e8f0"),
    (r"var\(\s*['\"]?--border-light['\"]?\s*\)", "#f1f5f9"),
    (r"var\(\s*border-light\s*\)", "#f1f5f9"),
]

helper_re = re.compile(r'\n\s*\n?[^\S]*function\s+var\s*\([^)]*\)\s*[:{][^}]*}\s*\n?', re.DOTALL)

for root, dirs, files in os.walk(base):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fh:
                c = fh.read()
            for pat, repl in patterns:
                c = re.sub(pat, repl, c)
            c = helper_re.sub('\n', c)
            c = re.sub(r'\n{3,}', '\n\n', c)
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(c)
            print('Fixed: ' + f)

# Final check
count = 0
for root, dirs, files in os.walk(base):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fh:
                c = fh.read()
            matches = re.findall(r'var\(', c)
            if matches:
                count += len(matches)
                print(f'Still has {len(matches)} var( in {f}')
if count == 0:
    print('ALL CLEAN!')
else:
    print(f'{count} remaining')
