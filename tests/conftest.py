"""
Fixtures globais para a suíte de testes Pytest do INTERFOOD FINANCIAL INTELLIGENCE.
Garante que o banco DuckDB esteja populado antes da execução dos testes.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from interfood.config.settings import DB_PATH
from interfood.database.connection import DatabaseConnection
from interfood.etl.pipeline import ETLPipeline


@pytest.fixture(scope="session", autouse=True)
def ensure_database_populated() -> Path:
    """Garante que o pipeline ETL tenha sido executado e o banco DuckDB esteja íntegro."""
    need_run = not DB_PATH.exists()
    if not need_run:
        with DatabaseConnection(DB_PATH) as db:
            counts = db.get_table_counts()
            if counts.get("fato_pedido", 0) == 0:
                need_run = True

    if need_run:
        pipeline = ETLPipeline(db_path=DB_PATH, auto_generate_if_missing=True)
        pipeline.run()

    return DB_PATH


@pytest.fixture()
def db_conn(ensure_database_populated: Path):
    """Retorna uma instância de DatabaseConnection conectada ao DuckDB."""
    with DatabaseConnection(ensure_database_populated) as db:
        yield db
