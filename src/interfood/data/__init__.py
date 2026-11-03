"""Módulo de geração de dados sintéticos do INTERFOOD FINANCIAL INTELLIGENCE."""
from interfood.data.generator import (
    gerar_clientes,
    gerar_departamentos,
    gerar_despesas,
    gerar_devolucoes,
    gerar_movimentacao_estoque,
    gerar_orcamento,
    gerar_pedidos_e_itens,
    gerar_plano_contas,
    gerar_produtos,
    gerar_todos_dados,
    gerar_vendedores,
    salvar_csvs,
)

__all__ = [
    "gerar_clientes",
    "gerar_departamentos",
    "gerar_despesas",
    "gerar_devolucoes",
    "gerar_movimentacao_estoque",
    "gerar_orcamento",
    "gerar_pedidos_e_itens",
    "gerar_plano_contas",
    "gerar_produtos",
    "gerar_todos_dados",
    "gerar_vendedores",
    "salvar_csvs",
]
