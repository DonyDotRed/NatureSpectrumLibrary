#!/usr/bin/env python3
"""Minimal XLSX -> JSON extractor using Python standard library only.
Preserves worksheet names and rectangular used-cell matrices. It reads cached
formula values stored in the XLSX package; it does not calculate formulas.
"""
import json, re, sys, zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS_PKG = 'http://schemas.openxmlformats.org/package/2006/relationships'


def col_index(ref):
    m = re.match(r'([A-Z]+)', ref)
    n = 0
    for ch in m.group(1): n = n * 26 + ord(ch) - 64
    return n - 1


def parse_shared_strings(z):
    if 'xl/sharedStrings.xml' not in z.namelist(): return []
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    out = []
    for si in root.findall(f'{{{NS_MAIN}}}si'):
        texts = [t.text or '' for t in si.iter(f'{{{NS_MAIN}}}t')]
        out.append(''.join(texts))
    return out


def cell_value(c, shared):
    t = c.get('t')
    if t == 'inlineStr':
        return ''.join((x.text or '') for x in c.iter(f'{{{NS_MAIN}}}t'))
    v = c.find(f'{{{NS_MAIN}}}v')
    if v is None: return None
    raw = v.text or ''
    if t == 's':
        try: return shared[int(raw)]
        except Exception: return raw
    if t in ('str', 'e'): return raw
    if t == 'b': return raw == '1'
    try:
        f = float(raw)
        return int(f) if f.is_integer() else f
    except ValueError:
        return raw


def main(src, dst):
    with zipfile.ZipFile(src) as z:
        shared = parse_shared_strings(z)
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        relmap = {r.get('Id'): r.get('Target') for r in rels.findall(f'{{{NS_PKG}}}Relationship')}
        sheets = {}
        for s in wb.find(f'{{{NS_MAIN}}}sheets'):
            name = s.get('name')
            rid = s.get(f'{{{NS_REL}}}id')
            target = relmap[rid].lstrip('/')
            if not target.startswith('xl/'): target = 'xl/' + target
            root = ET.fromstring(z.read(target))
            cells = []
            max_r = max_c = -1
            for c in root.iter(f'{{{NS_MAIN}}}c'):
                ref = c.get('r')
                m = re.match(r'[A-Z]+(\d+)', ref or '')
                if not m: continue
                r = int(m.group(1)) - 1
                col = col_index(ref)
                val = cell_value(c, shared)
                cells.append((r, col, val))
                max_r, max_c = max(max_r, r), max(max_c, col)
            matrix = [[None]*(max_c+1) for _ in range(max_r+1)] if max_r >= 0 else []
            for r,c,val in cells: matrix[r][c] = val
            sheets[name] = {'values': matrix}
    payload = {'meta': {'name':'NatureSpectrumLibrary','source_file':Path(src).name,'sheet_count':len(sheets)}, 'sheets': sheets}
    Path(dst).write_text(json.dumps(payload, ensure_ascii=False, separators=(',',':')), encoding='utf-8')
    print(f'Wrote {dst}: {len(sheets)} sheets')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: python tools/xlsx_to_json.py input.xlsx output.json')
        raise SystemExit(2)
    main(sys.argv[1], sys.argv[2])
