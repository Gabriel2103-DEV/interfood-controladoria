"""
Gerenciador de conexão DuckDB para o INTERFOOD FINANCIAL INTELLIGENCE.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from pathlib import Path
import duckdb
import pandas as pd

from interfood.config.settings import DB_PATH

SCHEMA_SQL_PATH = Path(__file__).resolve().parent / "schema.sql"
VIEWS_SQL_PATH = Path(__file__).resolve().parent / "views.sql"


class DatabaseConnection:
    """Encapsula a conexão e operações sobre o banco analítico DuckDB."""

    def __init__(self, db_path: Path | str = DB_PATH, read_only: bool = False) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.read_only = read_only
        self.conn: duckdb.DuckDBPyConnection | None = None

    def connect(self) -> duckdb.DuckDBPyConnection:
        """Abre ou retorna a conexão ativa com o DuckDB."""
        if self.conn is None:
            self.conn = duckdb.connect(str(self.db_path), read_only=self.read_only)
        return self.conn

    def disconnect(self) -> None:
        """Fecha a conexão com o DuckDB."""
        if self.conn is not None:
            self.conn.close()
            self.conn = None

    def __enter__(self) -> "DatabaseConnection":
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.disconnect()

    def execute_script(self, sql_file_path: Path) -> None:
        """Lê e executa um arquivo SQL completo no DuckDB."""
        conn = self.connect()
        sql_text = sql_file_path.read_text(encoding="utf-8")
        conn.execute(sql_text)

    def init_schema_and_views(self) -> None:
        """Cria todas as tabelas do Star Schema e as Views analíticas."""
        self.execute_script(SCHEMA_SQL_PATH)
        self.execute_script(VIEWS_SQL_PATH)

    def execute_query(self, query: str, params: list | tuple | None = None) -> pd.DataFrame:
        """Executa uma consulta SQL e retorna o resultado como DataFrame Pandas."""
        conn = self.connect()
        if params:
            return conn.execute(query, params).df()
        return conn.execute(query).df()

    def load_from_df(self, table_name: str, df: pd.DataFrame, truncate: bool = True) -> int:
        """Carrega um DataFrame Pandas em uma tabela do DuckDB de forma idempotente."""
        conn = self.connect()
        if truncate:
            conn.execute(f"DELETE FROM {table_name}")
        conn.register("_temp_df_load", df)
        cols = ", ".join(df.columns)
        conn.execute(f"INSERT INTO {table_name} ({cols}) SELECT {cols} FROM _temp_df_load")
        conn.unregister("_temp_df_load")
        res = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()
        return int(res[0]) if res else 0

    def get_table_counts(self) -> dict[str, int]:
        """Retorna a contagem de registros de todas as tabelas base do banco."""
        conn = self.connect()
        tables = [
            "dim_departamento",
            "dim_vendedor",
            "dim_cliente",
            "dim_produto",
            "dim_tempo",
            "dim_plano_contas",
            "fato_pedido",
            "fato_item_pedido",
            "fato_devolucao",
            "fato_despesa",
            "fato_orcamento",
            "fato_estoque",
        ]
        counts = {}
        for t in tables:
            try:
                row = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()
                counts[t] = int(row[0]) if row else 0
            except Exception:
                counts[t] = 0
        return counts
