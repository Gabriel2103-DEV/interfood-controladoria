"""
Script: 03_run_etl.py
Descrição: Executa o Pipeline ETL completo (Extract -> Transform -> Load) para o DuckDB.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
import argparse
import os
import sys
from pathlib import Path

os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from interfood.config.settings import format_int
from interfood.data.generator import gerar_todos_dados, salvar_csvs
from interfood.etl.pipeline import ETLPipeline

console = Console(force_terminal=True, legacy_windows=False)


def main() -> None:
    parser = argparse.ArgumentParser(description="Executa o Pipeline ETL do Interfood Financial Intelligence.")
    parser.add_argument("--regenerate", action="store_true", help="Regera os CSVs sintéticos antes do ETL.")
    args = parser.parse_args()

    console.print(
        Panel.fit(
            "[bold white]INTERFOOD FINANCIAL INTELLIGENCE - PIPELINE ETL[/bold white]\n"
            "[bold green]Extração, Transformação, Validação Contábil e Carga DuckDB (DADOS SINTÉTICOS)[/bold green]",
            style="white on #0A1628",
            border_style="#00A86B",
        )
    )

    if args.regenerate:
        dados = gerar_todos_dados()
        salvar_csvs(dados)

    pipeline = ETLPipeline()
    counts = pipeline.run()

    tbl = Table(
        title="[bold white]Resultado da Carga no DuckDB (Star Schema)[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl.add_column("Tabela DuckDB", style="bold white")
    tbl.add_column("Camada", style="white")
    tbl.add_column("Registros Carregados", style="bold #00A86B", justify="right")

    for table_name, count in counts.items():
        camada = "Dimensão" if table_name.startswith("dim_") else "Fato"
        tbl.add_row(table_name, camada, format_int(count))

    console.print(tbl)
    console.print(
        f"\n[bold #00A86B][OK] Pipeline ETL concluído em {pipeline.metrics.get('total_sec', 0):.2f}s "
        f"(Extract: {pipeline.metrics.get('extract_sec', 0):.2f}s | "
        f"Transform: {pipeline.metrics.get('transform_sec', 0):.2f}s | "
        f"Load: {pipeline.metrics.get('load_sec', 0):.2f}s)[/bold #00A86B]\n"
    )


if __name__ == "__main__":
    main()
