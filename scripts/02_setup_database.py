"""
Script: 02_setup_database.py
Descrição: Cria e inicializa o banco analítico DuckDB, tabelas Star Schema e Views de Controladoria.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
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

from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from interfood.config.settings import DB_PATH
from interfood.database.connection import DatabaseConnection

console = Console(force_terminal=True, legacy_windows=False)


def main() -> None:
    console.print(
        Panel.fit(
            "[bold white]INTERFOOD FINANCIAL INTELLIGENCE - SETUP DO BANCO DUCKDB[/bold white]\n"
            "[bold green]Inicializando Star Schema e Views Analíticas (DADOS SINTÉTICOS)[/bold green]",
            style="white on #0A1628",
            border_style="#00A86B",
        )
    )

    with DatabaseConnection(DB_PATH) as db:
        db.init_schema_and_views()
        tables_df = db.execute_query(
            """
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'main'
            ORDER BY table_type, table_name
            """
        )

    tbl = Table(
        title=f"[bold white]Objetos Criados em {DB_PATH.name}[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl.add_column("Objeto SQL", style="bold white")
    tbl.add_column("Tipo", style="bold #00A86B")

    for _, row in tables_df.iterrows():
        tbl.add_row(str(row["table_name"]), str(row["table_type"]))

    console.print(tbl)
    console.print(f"\n[bold #00A86B][OK] Banco DuckDB configurado com {len(tables_df)} objetos![/bold #00A86B]\n")


if __name__ == "__main__":
    main()
