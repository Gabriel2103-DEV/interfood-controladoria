"""
Calculadores de KPIs Financeiros e Indicadores de Controladoria.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from pathlib import Path
import pandas as pd

from interfood.config.settings import DB_PATH, format_pct
from interfood.database.connection import DatabaseConnection


def calcular_kpis_consolidados(ano: int | None = None, db_path: Path = DB_PATH) -> dict[str, float]:
    """
    Calcula os principais KPIs financeiros de Rentabilidade, Eficiência e Qualidade
    para todo o período de 36 meses ou para um ano específico.
    """
    where_clause = f"WHERE ano = {int(ano)}" if ano is not None else ""

    sql_dre = f"""
    SELECT
        COALESCE(SUM(qtd_pedidos), 0) AS total_pedidos,
        ROUND(COALESCE(SUM(receita_bruta), 0), 2) AS receita_bruta,
        ROUND(COALESCE(SUM(descontos_concedidos), 0), 2) AS descontos_concedidos,
        ROUND(COALESCE(SUM(devolucoes), 0), 2) AS devolucoes,
        ROUND(COALESCE(SUM(impostos_vendas), 0), 2) AS impostos_vendas,
        ROUND(COALESCE(SUM(deducoes_totais), 0), 2) AS deducoes_totais,
        ROUND(COALESCE(SUM(receita_liquida), 0), 2) AS receita_liquida,
        ROUND(COALESCE(SUM(cmv_liquido), 0), 2) AS cmv_liquido,
        ROUND(COALESCE(SUM(lucro_bruto), 0), 2) AS lucro_bruto,
        ROUND(COALESCE(SUM(despesas_operacionais_totais), 0), 2) AS despesas_operacionais,
        ROUND(COALESCE(SUM(ebitda), 0), 2) AS ebitda,
        ROUND(COALESCE(SUM(ebit), 0), 2) AS ebit,
        ROUND(COALESCE(SUM(lucro_liquido), 0), 2) AS lucro_liquido
    FROM vw_dre_mensal
    {where_clause};
    """

    with DatabaseConnection(db_path) as db:
        row = db.execute_query(sql_dre).iloc[0]
        vendedores_cnt = int(
            db.execute_query("SELECT COUNT(*) AS cnt FROM dim_vendedor WHERE ativo = TRUE").iloc[0]["cnt"]
        )
        clientes_ativos_cnt = int(
            db.execute_query(
                f"SELECT COUNT(DISTINCT cliente_id) AS cnt FROM fato_pedido {where_clause}"
            ).iloc[0]["cnt"]
        )

    rec_bruta = float(row["receita_bruta"])
    rec_liq = float(row["receita_liquida"])
    cmv_liq = float(row["cmv_liquido"])
    lucro_bruto = float(row["lucro_bruto"])
    desp_op = float(row["despesas_operacionais"])
    ebitda = float(row["ebitda"])
    ebit = float(row["ebit"])
    lucro_liq = float(row["lucro_liquido"])
    devolucoes = float(row["devolucoes"])
    total_pedidos = int(row["total_pedidos"])

    margem_bruta_perc = round(lucro_bruto / rec_liq * 100, 2) if rec_liq > 0 else 0.0
    margem_ebitda_perc = round(ebitda / rec_liq * 100, 2) if rec_liq > 0 else 0.0
    margem_liquida_perc = round(lucro_liq / rec_liq * 100, 2) if rec_liq > 0 else 0.0
    cmv_sobre_receita_perc = round(cmv_liq / rec_liq * 100, 2) if rec_liq > 0 else 0.0
    despesas_sobre_receita_perc = round(desp_op / rec_liq * 100, 2) if rec_liq > 0 else 0.0
    indice_devolucao_perc = round(devolucoes / rec_bruta * 100, 2) if rec_bruta > 0 else 0.0
    ticket_medio = round(rec_bruta / total_pedidos, 2) if total_pedidos > 0 else 0.0
    receita_por_vendedor = round(rec_bruta / vendedores_cnt, 2) if vendedores_cnt > 0 else 0.0

    # Ativo operacional médio simulado (~40% da Receita Bruta anualizada) para cálculo de ROIC/ROI
    fator_anual = 1.0 if ano is not None else (1.0 / 3.0)
    ativo_operacional_medio = max(1.0, rec_bruta * fator_anual * 0.40)
    roi_anualizado_perc = round((lucro_liq * fator_anual) / ativo_operacional_medio * 100, 2)

    return {
        "total_pedidos": float(total_pedidos),
        "clientes_ativos": float(clientes_ativos_cnt),
        "receita_bruta": rec_bruta,
        "deducoes_totais": float(row["deducoes_totais"]),
        "devolucoes": devolucoes,
        "receita_liquida": rec_liq,
        "cmv_liquido": cmv_liq,
        "lucro_bruto": lucro_bruto,
        "despesas_operacionais": desp_op,
        "ebitda": ebitda,
        "ebit": ebit,
        "lucro_liquido": lucro_liq,
        "margem_bruta_perc": margem_bruta_perc,
        "margem_ebitda_perc": margem_ebitda_perc,
        "margem_liquida_perc": margem_liquida_perc,
        "cmv_sobre_receita_perc": cmv_sobre_receita_perc,
        "despesas_sobre_receita_perc": despesas_sobre_receita_perc,
        "indice_devolucao_perc": indice_devolucao_perc,
        "ticket_medio": ticket_medio,
        "receita_por_vendedor": receita_por_vendedor,
        "roi_anualizado_perc": roi_anualizado_perc,
    }


def calcular_crescimento_yoy(db_path: Path = DB_PATH) -> dict[str, float]:
    """Calcula as taxas de crescimento anual (YoY) de Receita Bruta, Receita Líquida e EBITDA."""
    sql = """
    SELECT
        ano,
        SUM(receita_bruta) AS receita_bruta,
        SUM(receita_liquida) AS receita_liquida,
        SUM(ebitda) AS ebitda,
        SUM(lucro_liquido) AS lucro_liquido
    FROM vw_dre_mensal
    GROUP BY ano
    ORDER BY ano;
    """
    with DatabaseConnection(db_path) as db:
        df = db.execute_query(sql).set_index("ano")

    rec_2022 = float(df.loc[2022, "receita_bruta"])
    rec_2023 = float(df.loc[2023, "receita_bruta"])
    rec_2024 = float(df.loc[2024, "receita_bruta"])

    rl_2022 = float(df.loc[2022, "receita_liquida"])
    rl_2023 = float(df.loc[2023, "receita_liquida"])
    rl_2024 = float(df.loc[2024, "receita_liquida"])

    ebitda_2022 = float(df.loc[2022, "ebitda"])
    ebitda_2023 = float(df.loc[2023, "ebitda"])
    ebitda_2024 = float(df.loc[2024, "ebitda"])

    return {
        "crescimento_receita_bruta_2023_vs_2022_perc": round((rec_2023 - rec_2022) / rec_2022 * 100, 2),
        "crescimento_receita_bruta_2024_vs_2023_perc": round((rec_2024 - rec_2023) / rec_2023 * 100, 2),
        "crescimento_receita_bruta_acumulado_2024_vs_2022_perc": round((rec_2024 - rec_2022) / rec_2022 * 100, 2),
        "crescimento_receita_liquida_2023_vs_2022_perc": round((rl_2023 - rl_2022) / rl_2022 * 100, 2),
        "crescimento_receita_liquida_2024_vs_2023_perc": round((rl_2024 - rl_2023) / rl_2023 * 100, 2),
        "crescimento_ebitda_2023_vs_2022_perc": round((ebitda_2023 - ebitda_2022) / ebitda_2022 * 100, 2),
        "crescimento_ebitda_2024_vs_2023_perc": round((ebitda_2024 - ebitda_2023) / ebitda_2023 * 100, 2),
    }


def calcular_aderencia_orcamentaria(ano: int | None = None, db_path: Path = DB_PATH) -> dict[str, float]:
    """Calcula a variação e aderência ao orçamento por grupo (RECEITA, CUSTO, DESPESA)."""
    where_clause = f"WHERE ano = {int(ano)}" if ano is not None else ""
    sql = f"""
    SELECT
        tipo_conta,
        ROUND(SUM(valor_orcado), 2) AS total_orcado,
        ROUND(SUM(valor_realizado), 2) AS total_realizado
    FROM vw_orcado_realizado
    {where_clause}
    GROUP BY tipo_conta;
    """
    with DatabaseConnection(db_path) as db:
        df = db.execute_query(sql)

    resultado: dict[str, float] = {}
    for _, row in df.iterrows():
        tipo = str(row["tipo_conta"]).lower()
        orc = float(row["total_orcado"])
        real = float(row["total_realizado"])
        var_perc = round((real - orc) / orc * 100, 2) if orc > 0 else 0.0
        aderencia = round(real / orc * 100, 2) if orc > 0 else 0.0
        resultado[f"{tipo}_orcado"] = orc
        resultado[f"{tipo}_realizado"] = real
        resultado[f"{tipo}_variacao_perc"] = var_perc
        resultado[f"{tipo}_aderencia_perc"] = aderencia

    return resultado


def avaliar_semaforo_kpis(kpis: dict[str, float]) -> list[dict[str, str]]:
    """
    Avalia os KPIs frente às metas de Controladoria da distribuidora de alimentos,
    classificando em VERDE (Dentro da Meta), AMARELO (Atenção) ou VERMELHO (Crítico).
    """
    regras = [
        {
            "kpi": "Margem Bruta (%)",
            "valor": format_pct(kpis["margem_bruta_perc"]),
            "meta": ">= 28,00%",
            "status": (
                "VERDE" if kpis["margem_bruta_perc"] >= 28.0
                else ("AMARELO" if kpis["margem_bruta_perc"] >= 22.0 else "VERMELHO")
            ),
        },
        {
            "kpi": "Margem EBITDA (%)",
            "valor": format_pct(kpis["margem_ebitda_perc"]),
            "meta": ">= 10,00%",
            "status": (
                "VERDE" if kpis["margem_ebitda_perc"] >= 10.0
                else ("AMARELO" if kpis["margem_ebitda_perc"] >= 6.0 else "VERMELHO")
            ),
        },
        {
            "kpi": "Margem Líquida (%)",
            "valor": format_pct(kpis["margem_liquida_perc"]),
            "meta": ">= 6,00%",
            "status": (
                "VERDE" if kpis["margem_liquida_perc"] >= 6.0
                else ("AMARELO" if kpis["margem_liquida_perc"] >= 3.0 else "VERMELHO")
            ),
        },
        {
            "kpi": "Índice de Devolução (%)",
            "valor": format_pct(kpis["indice_devolucao_perc"]),
            "meta": "<= 3,50%",
            "status": (
                "VERDE" if kpis["indice_devolucao_perc"] <= 3.5
                else ("AMARELO" if kpis["indice_devolucao_perc"] <= 5.0 else "VERMELHO")
            ),
        },
        {
            "kpi": "CMV / Receita Líquida (%)",
            "valor": format_pct(kpis["cmv_sobre_receita_perc"]),
            "meta": "<= 72,00%",
            "status": (
                "VERDE" if kpis["cmv_sobre_receita_perc"] <= 72.0
                else ("AMARELO" if kpis["cmv_sobre_receita_perc"] <= 78.0 else "VERMELHO")
            ),
        },
    ]
    return regras
