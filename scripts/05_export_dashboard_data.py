"""
Script: 05_export_dashboard_data.py
Descrição: Exporta o dataset analítico completo do DuckDB para o Dashboard Interativo
em docs/assets/data/interfood_data.js e docs/assets/data/interfood_data.json.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS (Seed=42).
"""
import os
import sys
from pathlib import Path

os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from interfood.config.settings import DB_PATH, format_int
from interfood.dashboard_exporter import export_dashboard_files
from interfood.etl.pipeline import ETLPipeline


def main() -> None:
    if not DB_PATH.exists():
        ETLPipeline(db_path=DB_PATH, auto_generate_if_missing=True).run()

    json_path, js_path = export_dashboard_files(db_path=DB_PATH)
    print(f"[OK] Dataset JSON exportado: {json_path} ({format_int(json_path.stat().st_size)} bytes)")
    print(f"[OK] Dataset JS exportado:   {js_path} ({format_int(js_path.stat().st_size)} bytes)")


if __name__ == "__main__":
    main()
