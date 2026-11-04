"""
Módulo de Carga (Load) do Pipeline ETL.
Carrega as tabelas dimensionais e tabelas fato no banco analítico DuckDB.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from pathlib import Path
import pandas as pd
from loguru import logger

from interfood.config.settings import DB_PATH
from interfood.database.connection import DatabaseConnection

LOAD_ORDER = [
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


def load_all_to_duckdb(
    transformed_data: dict[str, pd.DataFrame],
    db_path: Path = DB_PATH,
) -> dict[str, int]:
    """
    Inicializa o schema e views no DuckDB e carrega todas as tabelas de forma idempotente.
    Retorna um dicionário {nome_tabela: total_linhas_carregadas}.
    """
    counts: dict[str, int] = {}
    with DatabaseConnection(db_path) as db:
        db.init_schema_and_views()

        # Limpar fatos antes das dimensões para evitar conflitos lógicos
        for table_name in reversed(LOAD_ORDER):
            db.connect().execute(f"DELETE FROM {table_name}").fetchall()

        for table_name in LOAD_ORDER:
            df = transformed_data[table_name]
            total = db.load_from_df(table_name, df, truncate=False)
            counts[table_name] = total
            logger.info(f"[LOAD] Tabela '{table_name}' carregada com {total:,} registros")

        # Recriar/atualizar views analíticas sobre os dados carregados
        db.init_schema_and_views()

    return counts
