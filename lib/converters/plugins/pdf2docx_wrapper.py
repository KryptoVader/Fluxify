#!/usr/bin/env python
import sys
from pdf2docx import Converter

if len(sys.argv) != 3:
    print("Usage: pdf2docx_wrapper.py <input.pdf> <output.docx>", file=sys.stderr)
    sys.exit(1)

pdf, out = sys.argv[1], sys.argv[2]
try:
    cv = Converter(pdf)
    cv.convert(out, start=0, end=None)
    cv.close()
    # Avoid emojis—use plain ASCII
    print(f"[pdf2docx] Conversion succeeded: {pdf} -> {out}")
    sys.exit(0)
except Exception as e:
    print("[pdf2docx] Error during conversion:", str(e).encode('ascii', 'replace').decode('ascii'), file=sys.stderr)
    sys.exit(1)
