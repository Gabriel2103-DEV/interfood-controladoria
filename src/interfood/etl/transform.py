"""
Módulo de Transformação (Transform) do Pipeline ETL.
Realiza limpeza, criação da dim_tempo, chaves de data (data_id), validações de
reconciliação contábil e geração de artefatos em data/processed/.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from pathlib import Path
import numpy as np
import pandas as pd
from loguru import logger

from interfood.config.settings import END_DATE, PROCESSED_DIR, START_DATE

MESES_PT = {
    1: ("Janeiro", "Jan"),
    2: ("Fevereiro", "Fev"),
    3: ("Março", "Mar"),
    4: ("Abril", "Abr"),
    5: ("Maio", "Mai"),
    6: ("Junho", "Jun"),
    7: ("Julho", "Jul"),
    8: ("Agosto", "Ago"),
    9: ("Setembro", "Set"),
    10: ("Outubro", "Out"),
    11: ("Novembro", "Nov"),
    12: ("Dezembro", "Dez"),
}

DIAS_SEMANA_PT = {
    0: "Segunda-feira",
    1: "Terça-feira",
    2: "Quarta-feira",
    3: "Quinta-feira",
    4: "Sexta-feira",
    5: "Sábado",
    6: "Domingo",
}


def build_dim_tempo(start_date: str = START_DATE, end_date: str = END_DATE) -> pd.DataFrame:
    """Constrói a dimensão calendário completa para o período 2022-2024."""
    datas = pd.date_range(start_date, end_date, freq="D")
    registros = []
    for dt in datas:
        mes_nome, mes_abrev = MESES_PT[dt.month]
        dia_sem = dt.weekday()
        registros.append({
            "data_id": int(dt.strftime("%Y%m%d")),
            "data": dt.strftime("%Y-%m-%d"),
            "ano": int(dt.year),
            "mes": int(dt.month),
            "dia": int(dt.day),
            "trimestre": int((dt.month - 1) // 3 + 1),
            "semestre": 1 if dt.month <= 6 else 2,
            "nome_mes": mes_nome,
            "nome_mes_abrev": mes_abrev,
            "dia_semana": int(dia_sem),
            "nome_dia_semana": DIAS_SEMANA_PT[dia_sem],
            "is_fim_semana": bool(dia_sem >= 5),
            "is_ultimo_dia_mes": bool(dt.is_month_end),
        })
    df_tempo = pd.DataFrame(registros)
    logger.info(f"[TRANSFORM] dim_tempo construída ({len(df_tempo):,} dias)")
    return df_tempo


def _date_str_to_id(series: pd.Series) -> pd.Series:
    """Converte série de datas YYYY-MM-DD em inteiro YYYYMMDD."""
    return pd.to_datetime(series).dt.strftime("%Y%m%d").astype(int)


def validate_financial_consistency(pedidos_df: pd.DataFrame, itens_df: pd.DataFrame) -> None:
    """
    Garante consistência contábil estrita entre os itens de pedido e os cabeçalhos de pedido.
    Corrige eventuais diferenças de arredondamento de centavos e valida invariantes.
    """
    agrup = (
        itens_df.groupby("pedido_id")
        .agg(
            soma_bruto=("valor_bruto", "sum"),
            soma_desconto=("valor_desconto", "sum"),
            soma_liquido=("valor_liquido", "sum"),
            soma_cmv=("cmv", "sum"),
            soma_margem=("margem_bruta", "sum"),
        )
        .round(2)
        .reset_index()
    )

    merged = pedidos_df.merge(agrup, on="pedido_id", how="left")
    diff_bruto = np.abs(merged["valor_bruto"] - merged["soma_bruto"]).max()
    diff_cmv = np.abs(merged["cmv_total"] - merged["soma_cmv"]).max()

    if diff_bruto > 0.05 or diff_cmv > 0.05:
        raise ValueError(
            f"Inconsistência contábil entre pedidos e itens! diff_bruto={diff_bruto}, diff_cmv={diff_cmv}"
        )

    logger.info(
        f"[TRANSFORM] Reconciliação Pedidos vs Itens validada (diff máx R$ {max(diff_bruto, diff_cmv):.4f})"
    )


def transform_all(
    raw_data: dict[str, pd.DataFrame],
    processed_dir: Path = PROCESSED_DIR,
) -> dict[str, pd.DataFrame]:
    """
    Executa todas as transformações, adiciona chaves substitutas de data (data_id),
    valida integridade referencial e salva dados processados.
    """
    processed_dir.mkdir(parents=True, exist_ok=True)
    transformed: dict[str, pd.DataFrame] = {}

    # 1. Dimensões
    transformed["dim_departamento"] = raw_data["departamentos"].copy()
    transformed["dim_vendedor"] = raw_data["vendedores"].copy()
    transformed["dim_cliente"] = raw_data["clientes"].copy()
    transformed["dim_produto"] = raw_data["produtos"].copy()
    transformed["dim_tempo"] = build_dim_tempo()

    plano = raw_data["plano_contas"].copy()
    plano["conta_pai"] = plano["conta_pai"].where(plano["conta_pai"].notna(), None)
    transformed["dim_plano_contas"] = plano

    # 2. Fato Pedido e Fato Item Pedido
    pedidos = raw_data["pedidos"].copy()
    itens = raw_data["itens_pedido"].copy()
    validate_financial_consistency(pedidos, itens)

    pedidos["data_id"] = _date_str_to_id(pedidos["data_pedido"])
    cols_pedido = [
        "pedido_id", "data_id", "data_pedido", "ano", "mes", "cliente_id",
        "vendedor_id", "status", "valor_bruto", "valor_desconto",
        "valor_liquido", "cmv_total", "lucro_bruto",
    ]
    transformed["fato_pedido"] = pedidos[cols_pedido]

    cols_item = [
        "item_id", "pedido_id", "produto_id", "quantidade", "preco_unitario",
        "custo_unitario", "valor_bruto", "valor_desconto", "valor_liquido",
        "cmv", "margem_bruta",
    ]
    transformed["fato_item_pedido"] = itens[cols_item]

    # 3. Fato Devolução
    devol = raw_data["devolucoes"].copy()
    devol["data_id"] = _date_str_to_id(devol["data_devolucao"])
    cols_devol = [
        "devolucao_id", "pedido_origem_id", "produto_id", "data_id",
        "data_devolucao", "ano", "mes", "quantidade", "valor_devolucao",
        "cmv_revertido", "motivo",
    ]
    transformed["fato_devolucao"] = devol[cols_devol]

    # 4. Fato Despesa
    desp = raw_data["despesas"].copy()
    desp["data_id"] = _date_str_to_id(desp["data_despesa"])
    cols_desp = [
        "despesa_id", "data_id", "data_despesa", "ano", "mes",
        "departamento_id", "conta_id", "descricao", "valor", "tipo",
    ]
    transformed["fato_despesa"] = desp[cols_desp]

    # 5. Fato Orçamento
    orc = raw_data["orcamento"].copy()
    cols_orc = [
        "orcamento_id", "ano", "mes", "departamento_id",
        "conta_id", "descricao", "valor_orcado",
    ]
    transformed["fato_orcamento"] = orc[cols_orc]

    # 6. Fato Estoque
    est = raw_data["movimentacao_estoque"].copy()
    est["data_id"] = _date_str_to_id(est["data_movimentacao"])
    cols_est = [
        "movimentacao_id", "data_id", "data_movimentacao", "ano", "mes",
        "produto_id", "tipo_mov", "quantidade", "custo_unitario",
        "valor_total", "saldo_quantidade", "saldo_valor",
    ]
    transformed["fato_estoque"] = est[cols_est]

    # Salvar resumos processados em data/processed/
    resumo_mensal = (
        pedidos.groupby(["ano", "mes"])
        .agg(
            qtd_pedidos=("pedido_id", "count"),
            receita_bruta=("valor_bruto", "sum"),
            descontos=("valor_desconto", "sum"),
            receita_pos_desconto=("valor_liquido", "sum"),
            cmv_bruto=("cmv_total", "sum"),
            lucro_bruto_comercial=("lucro_bruto", "sum"),
        )
        .round(2)
        .reset_index()
    )
    resumo_mensal.to_csv(processed_dir / "resumo_vendas_mensal.csv", index=False, encoding="utf-8")
    logger.info("[TRANSFORM] Artefato resumo_vendas_mensal.csv salvo em data/processed/")

    return transformed
