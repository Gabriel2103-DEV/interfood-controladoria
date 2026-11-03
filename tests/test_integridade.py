"""
Testes de Integridade Estrutural e Referencial (ETAPA 5).
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from interfood.database.connection import DatabaseConnection


def test_contagem_dimensoes(db_conn: DatabaseConnection) -> None:
    """Verifica se todas as dimensões possuem o volume esperado de cadastros."""
    counts = db_conn.get_table_counts()
    assert counts["dim_cliente"] == 60
    assert counts["dim_produto"] == 80
    assert counts["dim_departamento"] == 7
    assert counts["dim_vendedor"] == 8
    assert counts["dim_tempo"] == 1096  # 2022 (365) + 2023 (365) + 2024 bissexto (366)
    assert counts["dim_plano_contas"] >= 20


def test_sem_pedidos_duplicados(db_conn: DatabaseConnection) -> None:
    """Garante unicidade absoluta de pedido_id em fato_pedido."""
    df = db_conn.execute_query(
        "SELECT COUNT(*) AS total, COUNT(DISTINCT pedido_id) AS distintos FROM fato_pedido"
    )
    assert int(df.iloc[0]["total"]) > 15000
    assert int(df.iloc[0]["total"]) == int(df.iloc[0]["distintos"])


def test_datas_no_periodo_36_meses(db_conn: DatabaseConnection) -> None:
    """Garante que os pedidos cobrem exatamente os 36 meses de Jan/2022 a Dez/2024."""
    df = db_conn.execute_query(
        """
        SELECT
            MIN(data_pedido) AS min_dt,
            MAX(data_pedido) AS max_dt,
            COUNT(DISTINCT printf('%04d-%02d', ano, mes)) AS meses_distintos
        FROM fato_pedido
        """
    )
    assert int(df.iloc[0]["meses_distintos"]) == 36
    assert str(df.iloc[0]["min_dt"]).startswith("2022-01")
    assert str(df.iloc[0]["max_dt"]).startswith("2024-12")


def test_integridade_referencial_clientes_vendedores_produtos(db_conn: DatabaseConnection) -> None:
    """Garante que não existem chaves órfãs em fato_pedido e fato_item_pedido."""
    orfaos_cli = db_conn.execute_query(
        """
        SELECT COUNT(*) AS cnt
        FROM fato_pedido p
        LEFT JOIN dim_cliente c ON p.cliente_id = c.cliente_id
        WHERE c.cliente_id IS NULL
        """
    ).iloc[0]["cnt"]
    assert int(orfaos_cli) == 0

    orfaos_vnd = db_conn.execute_query(
        """
        SELECT COUNT(*) AS cnt
        FROM fato_pedido p
        LEFT JOIN dim_vendedor v ON p.vendedor_id = v.vendedor_id
        WHERE v.vendedor_id IS NULL
        """
    ).iloc[0]["cnt"]
    assert int(orfaos_vnd) == 0

    orfaos_prd = db_conn.execute_query(
        """
        SELECT COUNT(*) AS cnt
        FROM fato_item_pedido i
        LEFT JOIN dim_produto pr ON i.produto_id = pr.produto_id
        WHERE pr.produto_id IS NULL
        """
    ).iloc[0]["cnt"]
    assert int(orfaos_prd) == 0


def test_estoque_saldo_nao_negativo(db_conn: DatabaseConnection) -> None:
    """Garante que nenhuma movimentação de estoque resultou em saldo negativo."""
    negativos = db_conn.execute_query(
        """
        SELECT COUNT(*) AS cnt
        FROM fato_estoque
        WHERE saldo_quantidade < 0 OR saldo_valor < 0
        """
    ).iloc[0]["cnt"]
    assert int(negativos) == 0


def test_orcamento_todos_36_meses_preenchidos(db_conn: DatabaseConnection) -> None:
    """Garante que o orçamento cobre todos os 36 meses para todos os 7 departamentos."""
    df = db_conn.execute_query(
        """
        SELECT
            COUNT(DISTINCT printf('%04d-%02d', ano, mes)) AS meses,
            COUNT(DISTINCT departamento_id) AS depts
        FROM fato_orcamento
        """
    )
    assert int(df.iloc[0]["meses"]) == 36
    assert int(df.iloc[0]["depts"]) == 7
