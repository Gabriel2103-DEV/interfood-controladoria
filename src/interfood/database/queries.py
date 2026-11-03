"""
Consultas Financeiras e de Controladoria no DuckDB.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from pathlib import Path
import pandas as pd

from interfood.config.settings import DB_PATH
from interfood.database.connection import DatabaseConnection


def get_dre_anual(db_path: Path = DB_PATH) -> pd.DataFrame:
    """Retorna a DRE consolidada por ano (2022, 2023, 2024)."""
    sql = """
    SELECT
        ano,
        SUM(qtd_pedidos) AS qtd_pedidos,
        ROUND(SUM(receita_bruta), 2) AS receita_bruta,
        ROUND(SUM(descontos_concedidos), 2) AS descontos_concedidos,
        ROUND(SUM(devolucoes), 2) AS devolucoes,
        ROUND(SUM(impostos_vendas), 2) AS impostos_vendas,
        ROUND(SUM(deducoes_totais), 2) AS deducoes_totais,
        ROUND(SUM(receita_liquida), 2) AS receita_liquida,
        ROUND(SUM(cmv_liquido), 2) AS cmv_liquido,
        ROUND(SUM(lucro_bruto), 2) AS lucro_bruto,
        ROUND(SUM(lucro_bruto) / NULLIF(SUM(receita_liquida), 0) * 100, 2) AS margem_bruta_perc,
        ROUND(SUM(despesas_pessoal), 2) AS despesas_pessoal,
        ROUND(SUM(despesas_aluguel), 2) AS despesas_aluguel,
        ROUND(SUM(despesas_marketing), 2) AS despesas_marketing,
        ROUND(SUM(despesas_logistica), 2) AS despesas_logistica,
        ROUND(SUM(despesas_administrativas), 2) AS despesas_administrativas,
        ROUND(SUM(despesas_outras), 2) AS despesas_outras,
        ROUND(SUM(despesas_operacionais_totais), 2) AS despesas_operacionais_totais,
        ROUND(SUM(ebitda), 2) AS ebitda,
        ROUND(SUM(ebitda) / NULLIF(SUM(receita_liquida), 0) * 100, 2) AS margem_ebitda_perc,
        ROUND(SUM(depreciacao_amortizacao), 2) AS depreciacao_amortizacao,
        ROUND(SUM(ebit), 2) AS ebit,
        ROUND(SUM(resultado_financeiro), 2) AS resultado_financeiro,
        ROUND(SUM(ebt), 2) AS ebt,
        ROUND(SUM(ir_csll), 2) AS ir_csll,
        ROUND(SUM(lucro_liquido), 2) AS lucro_liquido,
        ROUND(SUM(lucro_liquido) / NULLIF(SUM(receita_liquida), 0) * 100, 2) AS margem_liquida_perc
    FROM vw_dre_mensal
    GROUP BY ano
    ORDER BY ano;
    """
    with DatabaseConnection(db_path) as db:
        return db.execute_query(sql)


def get_dre_mensal(ano: int | None = None, db_path: Path = DB_PATH) -> pd.DataFrame:
    """Retorna a DRE mensal (todos os 36 meses ou filtrada por ano)."""
    with DatabaseConnection(db_path) as db:
        if ano is not None:
            return db.execute_query("SELECT * FROM vw_dre_mensal WHERE ano = ? ORDER BY mes", [ano])
        return db.execute_query("SELECT * FROM vw_dre_mensal ORDER BY ano, mes")


def get_top_clientes(limit: int = 10, db_path: Path = DB_PATH) -> pd.DataFrame:
    """Retorna os Top N clientes por receita bruta."""
    with DatabaseConnection(db_path) as db:
        return db.execute_query(f"SELECT * FROM vw_vendas_por_cliente LIMIT {int(limit)}")


def get_top_produtos_margem(limit: int = 10, db_path: Path = DB_PATH) -> pd.DataFrame:
    """Retorna os Top N produtos por geração de margem bruta absoluta."""
    with DatabaseConnection(db_path) as db:
        return db.execute_query(f"SELECT * FROM vw_mix_produtos LIMIT {int(limit)}")


def get_desempenho_categorias(db_path: Path = DB_PATH) -> pd.DataFrame:
    """Retorna o desempenho consolidado por categoria de produto."""
    sql = """
    SELECT
        categoria,
        COUNT(DISTINCT produto_id) AS qtd_skus,
        SUM(quantidade_vendida) AS quantidade_vendida,
        ROUND(SUM(receita_bruta), 2) AS receita_bruta,
        ROUND(SUM(receita_liquida_comercial), 2) AS receita_liquida_comercial,
        ROUND(SUM(cmv_total), 2) AS cmv_total,
        ROUND(SUM(margem_bruta_valor), 2) AS margem_bruta_valor,
        ROUND(SUM(margem_bruta_valor) / NULLIF(SUM(receita_liquida_comercial), 0) * 100, 2) AS margem_bruta_perc,
        ROUND(SUM(share_receita_perc), 2) AS share_receita_perc
    FROM vw_mix_produtos
    GROUP BY categoria
    ORDER BY receita_bruta DESC;
    """
    with DatabaseConnection(db_path) as db:
        return db.execute_query(sql)


def get_resumo_orcado_vs_realizado(db_path: Path = DB_PATH) -> pd.DataFrame:
    """Retorna o consolidado anual de Orçado vs Realizado por tipo de conta e departamento."""
    sql = """
    SELECT
        ano,
        tipo_conta,
        departamento_id,
        departamento_nome,
        ROUND(SUM(valor_orcado), 2) AS valor_orcado,
        ROUND(SUM(valor_realizado), 2) AS valor_realizado,
        ROUND(SUM(variacao_absoluta), 2) AS variacao_absoluta,
        ROUND((SUM(valor_realizado) - SUM(valor_orcado)) / NULLIF(SUM(valor_orcado), 0) * 100, 2) AS variacao_perc,
        ROUND(SUM(valor_realizado) / NULLIF(SUM(valor_orcado), 0) * 100, 2) AS aderencia_perc
    FROM vw_orcado_realizado
    GROUP BY ano, tipo_conta, departamento_id, departamento_nome
    ORDER BY ano, tipo_conta, departamento_id;
    """
    with DatabaseConnection(db_path) as db:
        return db.execute_query(sql)


def get_posicao_estoque_resumo(db_path: Path = DB_PATH) -> pd.DataFrame:
    """Retorna a posição consolidada de estoque por categoria."""
    sql = """
    SELECT
        categoria,
        COUNT(*) AS total_skus,
        SUM(saldo_atual_qtd) AS saldo_total_qtd,
        ROUND(SUM(saldo_atual_valor), 2) AS saldo_total_valor,
        SUM(CASE WHEN status_estoque = 'CRITICO' THEN 1 ELSE 0 END) AS skus_criticos,
        SUM(CASE WHEN status_estoque = 'ATENCAO' THEN 1 ELSE 0 END) AS skus_atencao,
        SUM(CASE WHEN status_estoque = 'NORMAL' THEN 1 ELSE 0 END) AS skus_normais
    FROM vw_estoque_posicao
    GROUP BY categoria
    ORDER BY saldo_total_valor DESC;
    """
    with DatabaseConnection(db_path) as db:
        return db.execute_query(sql)
