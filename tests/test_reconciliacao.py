"""
Testes de Reconciliação Contábil e Financeira (ETAPA 5).
Garante que Vendas, Itens, CMV, Devoluções, Despesas e DRE batam centavo a centavo.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from interfood.database.connection import DatabaseConnection


def test_soma_itens_igual_cabecalho_pedido(db_conn: DatabaseConnection) -> None:
    """Garante que para 100% dos pedidos a soma dos itens é igual ao total do pedido."""
    divergencias = db_conn.execute_query(
        """
        WITH itens_soma AS (
            SELECT
                pedido_id,
                ROUND(SUM(valor_bruto), 2) AS soma_bruto,
                ROUND(SUM(valor_desconto), 2) AS soma_desc,
                ROUND(SUM(valor_liquido), 2) AS soma_liq,
                ROUND(SUM(cmv), 2) AS soma_cmv,
                ROUND(SUM(margem_bruta), 2) AS soma_margem
            FROM fato_item_pedido
            GROUP BY pedido_id
        )
        SELECT COUNT(*) AS cnt
        FROM fato_pedido p
        JOIN itens_soma i ON p.pedido_id = i.pedido_id
        WHERE ABS(p.valor_bruto - i.soma_bruto) > 0.01
           OR ABS(p.valor_desconto - i.soma_desc) > 0.01
           OR ABS(p.valor_liquido - i.soma_liq) > 0.01
           OR ABS(p.cmv_total - i.soma_cmv) > 0.01
           OR ABS(p.lucro_bruto - i.soma_margem) > 0.01
        """
    ).iloc[0]["cnt"]
    assert int(divergencias) == 0


def test_cmv_positivo_e_menor_que_receita(db_conn: DatabaseConnection) -> None:
    """Garante que o CMV é estritamente positivo e menor que a receita bruta em todos os meses."""
    inconsistentes = db_conn.execute_query(
        """
        SELECT COUNT(*) AS cnt
        FROM vw_dre_mensal
        WHERE cmv_liquido <= 0 OR cmv_liquido >= receita_liquida
        """
    ).iloc[0]["cnt"]
    assert int(inconsistentes) == 0


def test_dre_mensal_equacoes_contabeis(db_conn: DatabaseConnection) -> None:
    """
    Verifica todas as identidades contábeis da DRE nos 36 meses:
    1) Receita Líquida = Receita Bruta - Deduções Totais
    2) Lucro Bruto = Receita Líquida - CMV Líquido
    3) EBITDA = Lucro Bruto - Despesas Operacionais Totais
    4) EBIT = EBITDA - D&A
    5) EBT = EBIT + Resultado Financeiro
    6) Lucro Líquido = EBT - IR/CSLL
    """
    df = db_conn.execute_query("SELECT * FROM vw_dre_mensal")
    assert len(df) == 36

    for _, row in df.iterrows():
        assert abs((row["receita_bruta"] - row["deducoes_totais"]) - row["receita_liquida"]) <= 0.02
        assert abs((row["receita_liquida"] - row["cmv_liquido"]) - row["lucro_bruto"]) <= 0.02
        assert abs((row["lucro_bruto"] - row["despesas_operacionais_totais"]) - row["ebitda"]) <= 0.02
        assert abs((row["ebitda"] - row["depreciacao_amortizacao"]) - row["ebit"]) <= 0.02
        assert abs((row["ebit"] + row["resultado_financeiro"]) - row["ebt"]) <= 0.02
        assert abs((row["ebt"] - row["ir_csll"]) - row["lucro_liquido"]) <= 0.02


def test_reconciliacao_despesas_fato_vs_dre(db_conn: DatabaseConnection) -> None:
    """Garante que a soma de fato_despesa é idêntica ao total de despesas operacionais na DRE."""
    soma_fato = float(
        db_conn.execute_query("SELECT ROUND(SUM(valor), 2) AS total FROM fato_despesa").iloc[0]["total"]
    )
    soma_dre = float(
        db_conn.execute_query(
            "SELECT ROUND(SUM(despesas_operacionais_totais), 2) AS total FROM vw_dre_mensal"
        ).iloc[0]["total"]
    )
    assert abs(soma_fato - soma_dre) <= 0.05


def test_devolucoes_vinculadas_a_pedidos_reais(db_conn: DatabaseConnection) -> None:
    """Garante que toda devolução referencia um pedido de origem válido."""
    orfaos = db_conn.execute_query(
        """
        SELECT COUNT(*) AS cnt
        FROM fato_devolucao d
        LEFT JOIN fato_pedido p ON d.pedido_origem_id = p.pedido_id
        WHERE p.pedido_id IS NULL
        """
    ).iloc[0]["cnt"]
    assert int(orfaos) == 0
