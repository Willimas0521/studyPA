#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""全局修正 book2 章节编号错位。

问题：正文把「前言 PREFACE」算作第一章，导致 45 个正文章标题编号 = 目录树编号 +1。
本脚本（只作用于 BODY 段，绝不动 CHAPTERS 树里的 label）：
  1. 正文 h3 id="bk2-cN" 的「第X章」整体 −1（第四十一章→第四十章 …）
  2. 前言 <h3>第一章 PREFACE</h3> → 「前言 PREFACE」
  3. 文末 back matter 去掉误标的「第九~十二部分」，改中文标题
  4. （CHAPTERS 段）本章大标题 bk2-c40 英译中
"""
import re, io

JS = r'C:\Users\Administrator\WorkBuddy\2026-09-22-01-32-25\studyPA\data\wyckoff_book2.js'
D = '一二三四五六七八九'

def cn2int(s):
    if s == '十': return 10
    if s.startswith('十'): return 10 + D.index(s[1]) + 1
    if '十' in s:
        t, r = s.split('十')
        n = (D.index(t[0]) + 1) * 10
        if r: n += D.index(r[0]) + 1
        return n
    return D.index(s[0]) + 1

def int2cn(n):
    if n < 10: return D[n-1]
    if n == 10: return '十'
    if n < 20: return '十' + D[n-11]
    t, r = divmod(n, 10)
    return D[t-1] + '十' + (D[r-1] if r else '')

def main():
    txt = io.open(JS, encoding='utf-8').read()
    marker = 'window.WYCKOFF_BOOK2_CHAPTERS'
    head, tail = txt.split(marker, 1)
    head = marker.join(['', '']) if False else head          # keep head as-is
    head_orig = head

    # 1) 正文章标题 −1（仅 h3 id="bk2-cN"）
    def dec(m):
        n = cn2int(m.group(2))
        return '%s第%s章' % (m.group(1), int2cn(n - 1))
    head, k = re.subn(r'(<h3 id="bk2-c\d+">)第([一二三四五六七八九十]+)章', dec, head)
    print('body chapter headings decremented:', k)

    # 2) 前言
    head, k2 = re.subn(r'第一章 PREFACE', '前言 PREFACE', head)
    print('preface renamed:', k2)

    # 3) back matter
    bm = [
        ('第九部分 BIBLIOGRAPHY', '参考文献（Bibliography）'),
        ('第十部分 ACKNOWLEDGEMENTS', '致谢（Acknowledgements）'),
        ('第十一部分 ABOUT THE AUTHOR', '关于作者（About the Author）'),
        ('第十二部分 BOOKS BY THIS AUTHOR', '作者其他著作（Books by this Author）'),
    ]
    for a, b in bm:
        c = head.count(a)
        head = head.replace(a, b)
        print('  back matter %-32s -> %-28s (%d)' % (a, b, c))

    # 4) CHAPTERS 树：本章标题英译中（不动编号）
    old_lbl = "label: '第四十章 EURO/DOLLAR ($6E)CURRENCY CROSS'"
    new_lbl = "label: '第四十章 欧元/美元（$6E）货币交叉盘'"
    c = tail.count(old_lbl)
    tail = tail.replace(old_lbl, new_lbl)
    print('tree label c40 translated:', c)

    io.open(JS, 'w', encoding='utf-8').write(head + marker + tail)
    print('written ->', JS)

if __name__ == '__main__':
    main()
