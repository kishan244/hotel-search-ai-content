"""Run this first. Checks everything is in place before you start."""
import os, shutil, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data")
NEEDED = {"train.csv": 2.0, "item_metadata.csv": 0.2}

print("Python:", sys.version.split()[0])

try:
    import duckdb
    print("duckdb:", duckdb.__version__)
except ImportError:
    print("MISSING duckdb -> pip install -r requirements.txt")

free_gb = shutil.disk_usage(HERE).free / 1e9
print(f"free disk: {free_gb:.1f} GB", "OK" if free_gb > 8 else "TIGHT, need ~8 GB")

for name, min_gb in NEEDED.items():
    path = os.path.join(DATA, name)
    if os.path.exists(path):
        gb = os.path.getsize(path) / 1e9
        flag = "OK" if gb >= min_gb * 0.8 else "looks too small, re-download"
        print(f"{name}: {gb:.2f} GB  {flag}")
    else:
        print(f"{name}: MISSING -> put it in data/")
