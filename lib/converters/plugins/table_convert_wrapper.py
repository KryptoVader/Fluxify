#!/usr/bin/env python3
"""
Universal table converter: CSV, XLSX, JSON, XML, PDF (tables), XLSB, ODS via Python.
Usage:
    table_convert_wrapper.py input_file output_file
"""
import sys
import os
import subprocess
import pandas as pd
import json
import xmltodict

SUPPORTED = ['csv', 'xlsx', 'xls', 'json', 'xml', 'pdf', 'xlsb', 'ods']


def libreoffice_convert(src, dst):
    # Uses LibreOffice CLI to convert unsupported formats
    dst_ext = os.path.splitext(dst)[1][1:]
    cmd = [
        'soffice', '--headless', '--convert-to', dst_ext,
        '--outdir', os.path.dirname(dst), src
    ]
    subprocess.run(cmd, check=True)
    # LibreOffice names output with same base name
    return dst


def read_table(path, ext):
    if ext == 'csv':
        return pd.read_csv(path)
    if ext in ['xls', 'xlsx']:
        return pd.read_excel(path)
    if ext == 'json':
        return pd.read_json(path)
    if ext == 'xml':
        with open(path, 'rb') as f:
            data = xmltodict.parse(f)
        # Flatten nested structures
        return pd.json_normalize(data)
    if ext == 'pdf':
        # requires tabula-py and Java installed
        try:
            import tabula
            tables = tabula.read_pdf(path, pages='all', multiple_tables=True)
            if not tables:
                raise ValueError(f"No tables found in PDF: {path}")
            return pd.concat(tables, ignore_index=True)
        except Exception as e:
            raise RuntimeError(f"Error reading PDF tables: {e}")
    if ext in ['xlsb', 'ods']:
        # Try pandas engine; fallback to LibreOffice
        try:
            engine = 'pyxlsb' if ext == 'xlsb' else None
            return pd.read_excel(path, engine=engine)
        except Exception:
            tmp_csv = os.path.splitext(path)[0] + '.csv'
            libreoffice_convert(path, tmp_csv)
            return pd.read_csv(tmp_csv)
    raise ValueError(f"Unsupported read format: {ext}")


def write_table(df, path, ext):
    if ext == 'csv':
        df.to_csv(path, index=False)
    elif ext in ['xls', 'xlsx']:
        df.to_excel(path, index=False)
    elif ext == 'json':
        df.to_json(path, orient='records', indent=2)
    elif ext == 'xml':
        records = json.loads(df.to_json(orient='records'))
        xml_str = xmltodict.unparse({'root': {'row': records}}, pretty=True)
        with open(path, 'w') as f:
            f.write(xml_str)
    elif ext in ['xlsb', 'ods']:
        # Write to XLSX then convert
        tmp_xlsx = os.path.splitext(path)[0] + '.xlsx'
        df.to_excel(tmp_xlsx, index=False)
        return libreoffice_convert(tmp_xlsx, path)
    else:
        raise ValueError(f"Unsupported write format: {ext}")
    return path


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    src, dst = sys.argv[1], sys.argv[2]
    se = os.path.splitext(src)[1][1:].lower()
    de = os.path.splitext(dst)[1][1:].lower()

    if se not in SUPPORTED or de not in SUPPORTED:
        raise ValueError(f"Formats not supported: {se} -> {de}")

    try:
        # Read into DataFrame
        df = read_table(src, se)
        # Write to target
        write_table(df, dst, de)
    except Exception as e:
        print(f"Conversion error: {e}", file=sys.stderr)
        sys.exit(2)

    # Verify output
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        sys.exit(0)
    else:
        print(f"Failed to create output file: {dst}", file=sys.stderr)
        sys.exit(3)

if __name__ == '__main__':
    main()