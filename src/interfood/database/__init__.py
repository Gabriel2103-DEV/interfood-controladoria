"""Módulo de banco de dados DuckDB, schema e consultas analíticas (DADOS SINTÉTICOS)."""
from interfood.database.connection import DatabaseConnection
from interfood.database.queries import (
    get_desempenho_categorias,
    get_dre_anual,
    get_dre_mensal,
    get_posicao_estoque_resumo,
    get_resumo_orcado_vs_realizado,
    get_top_clientes,
    get_top_produtos_margem,
)

__all__ = [
    "DatabaseConnection",
    "get_desempenho_categorias",
    "get_dre_anual",
    "get_dre_mensal",
    "get_posicao_estoque_resumo",
    "get_resumo_orcado_vs_realizado",
    "get_top_clientes",
    "get_top_produtos_margem",
]
