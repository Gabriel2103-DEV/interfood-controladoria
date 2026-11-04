"""
Script Orquestrador Completo: run_all.py
Executa em sequência:
  1. Geração de dados sintéticos (01_generate_data.py)
  2. Setup do banco DuckDB (02_setup_database.py)
  3. Pipeline ETL completo (03_run_etl.py)
  4. Relatório Executivo e Dashboard HTML (04_relatorio_executivo.py)
  5. Suíte de Testes Automatizados Pytest (Integridade, Reconciliação e KPIs)
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
import importlib.util
import os
import sys
from pathlib import Path
import pytest

os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))


def _run_script(script_name: str) -> None:
    script_path = ROOT / "scripts" / script_name
    spec = importlib.util.spec_from_file_location(script_name.replace(".py", ""), script_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.argv = [str(script_path)]
    spec.loader.exec_module(module)
    if hasattr(module, "main"):
        module.main()


def main() -> int:
    print("=" * 80)
    print("EXECUTANDO SUITE COMPLETA - INTERFOOD FINANCIAL INTELLIGENCE (DADOS SINTETICOS)")
    print("=" * 80)

    _run_script("01_generate_data.py")
    _run_script("02_setup_database.py")
    _run_script("03_run_etl.py")
    _run_script("04_relatorio_executivo.py")
    _run_script("05_export_dashboard_data.py")

    print("\n" + "=" * 80)
    print("EXECUTANDO TESTES PYTEST (INTEGRIDADE, RECONCILIACAO E KPIS)")
    print("=" * 80)
    exit_code = pytest.main([str(ROOT / "tests"), "-v", "--tb=short"])
    return int(exit_code)


if __name__ == "__main__":
    sys.exit(main())
