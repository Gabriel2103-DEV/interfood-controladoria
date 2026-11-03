-- =============================================================================
-- INTERFOOD FINANCIAL INTELLIGENCE - Views Analíticas de Controladoria (DuckDB)
-- ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS
-- =============================================================================

-- 1. View de DRE Mensal Completa (36 meses)
CREATE OR REPLACE VIEW vw_dre_mensal AS
WITH vendas_mes AS (
    SELECT
        ano,
        mes,
        COUNT(DISTINCT pedido_id) AS qtd_pedidos,
        ROUND(SUM(valor_bruto), 2) AS receita_bruta,
        ROUND(SUM(valor_desconto), 2) AS descontos_concedidos,
        ROUND(SUM(valor_liquido), 2) AS receita_pos_desconto,
        ROUND(SUM(cmv_total), 2) AS cmv_bruto
    FROM fato_pedido
    GROUP BY ano, mes
),
devolucoes_mes AS (
    SELECT
        ano,
        mes,
        ROUND(COALESCE(SUM(valor_devolucao), 0), 2) AS devolucoes,
        ROUND(COALESCE(SUM(cmv_revertido), 0), 2) AS cmv_revertido
    FROM fato_devolucao
    GROUP BY ano, mes
),
despesas_mes AS (
    SELECT
        ano,
        mes,
        ROUND(SUM(CASE WHEN conta_id = 'PC021' THEN valor ELSE 0 END), 2) AS despesas_pessoal,
        ROUND(SUM(CASE WHEN conta_id = 'PC022' THEN valor ELSE 0 END), 2) AS despesas_aluguel,
        ROUND(SUM(CASE WHEN conta_id = 'PC023' THEN valor ELSE 0 END), 2) AS despesas_marketing,
        ROUND(SUM(CASE WHEN conta_id = 'PC024' THEN valor ELSE 0 END), 2) AS despesas_logistica,
        ROUND(SUM(CASE WHEN conta_id = 'PC025' THEN valor ELSE 0 END), 2) AS despesas_administrativas,
        ROUND(SUM(CASE WHEN conta_id = 'PC026' THEN valor ELSE 0 END), 2) AS despesas_outras,
        ROUND(SUM(valor), 2) AS despesas_operacionais_totais
    FROM fato_despesa
    GROUP BY ano, mes
),
base_dre AS (
    SELECT
        v.ano,
        v.mes,
        printf('%04d-%02d', v.ano, v.mes) AS competencia,
        v.qtd_pedidos,
        v.receita_bruta,
        v.descontos_concedidos,
        COALESCE(d.devolucoes, 0.0) AS devolucoes,
        ROUND((v.receita_bruta - v.descontos_concedidos - COALESCE(d.devolucoes, 0.0)) * 0.12, 2) AS impostos_vendas,
        ROUND(
            v.descontos_concedidos
            + COALESCE(d.devolucoes, 0.0)
            + ROUND((v.receita_bruta - v.descontos_concedidos - COALESCE(d.devolucoes, 0.0)) * 0.12, 2),
            2
        ) AS deducoes_totais,
        ROUND(
            v.receita_bruta
            - v.descontos_concedidos
            - COALESCE(d.devolucoes, 0.0)
            - ROUND((v.receita_bruta - v.descontos_concedidos - COALESCE(d.devolucoes, 0.0)) * 0.12, 2),
            2
        ) AS receita_liquida,
        v.cmv_bruto,
        COALESCE(d.cmv_revertido, 0.0) AS cmv_revertido,
        ROUND(v.cmv_bruto - COALESCE(d.cmv_revertido, 0.0), 2) AS cmv_liquido,
        COALESCE(dp.despesas_pessoal, 0.0) AS despesas_pessoal,
        COALESCE(dp.despesas_aluguel, 0.0) AS despesas_aluguel,
        COALESCE(dp.despesas_marketing, 0.0) AS despesas_marketing,
        COALESCE(dp.despesas_logistica, 0.0) AS despesas_logistica,
        COALESCE(dp.despesas_administrativas, 0.0) AS despesas_administrativas,
        COALESCE(dp.despesas_outras, 0.0) AS despesas_outras,
        COALESCE(dp.despesas_operacionais_totais, 0.0) AS despesas_operacionais_totais
    FROM vendas_mes v
    LEFT JOIN devolucoes_mes d ON v.ano = d.ano AND v.mes = d.mes
    LEFT JOIN despesas_mes dp ON v.ano = dp.ano AND v.mes = dp.mes
)
SELECT
    ano,
    mes,
    competencia,
    qtd_pedidos,
    receita_bruta,
    descontos_concedidos,
    devolucoes,
    impostos_vendas,
    deducoes_totais,
    receita_liquida,
    cmv_bruto,
    cmv_revertido,
    cmv_liquido,
    ROUND(receita_liquida - cmv_liquido, 2) AS lucro_bruto,
    ROUND((receita_liquida - cmv_liquido) / NULLIF(receita_liquida, 0) * 100, 2) AS margem_bruta_perc,
    despesas_pessoal,
    despesas_aluguel,
    despesas_marketing,
    despesas_logistica,
    despesas_administrativas,
    despesas_outras,
    despesas_operacionais_totais,
    ROUND((receita_liquida - cmv_liquido) - despesas_operacionais_totais, 2) AS ebitda,
    ROUND(((receita_liquida - cmv_liquido) - despesas_operacionais_totais) / NULLIF(receita_liquida, 0) * 100, 2) AS margem_ebitda_perc,
    35000.00 AS depreciacao_amortizacao,
    ROUND(((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00, 2) AS ebit,
    ROUND(receita_liquida * -0.005, 2) AS resultado_financeiro,
    ROUND((((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00) + ROUND(receita_liquida * -0.005, 2), 2) AS ebt,
    CASE
        WHEN (((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00) + ROUND(receita_liquida * -0.005, 2) > 0
        THEN ROUND(((((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00) + ROUND(receita_liquida * -0.005, 2)) * 0.24, 2)
        ELSE 0.0
    END AS ir_csll,
    ROUND(
        ((((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00) + ROUND(receita_liquida * -0.005, 2))
        - CASE
            WHEN (((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00) + ROUND(receita_liquida * -0.005, 2) > 0
            THEN ROUND(((((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00) + ROUND(receita_liquida * -0.005, 2)) * 0.24, 2)
            ELSE 0.0
          END,
        2
    ) AS lucro_liquido,
    ROUND(
        (
            ((((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00) + ROUND(receita_liquida * -0.005, 2))
            - CASE
                WHEN (((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00) + ROUND(receita_liquida * -0.005, 2) > 0
                THEN ROUND(((((receita_liquida - cmv_liquido) - despesas_operacionais_totais) - 35000.00) + ROUND(receita_liquida * -0.005, 2)) * 0.24, 2)
                ELSE 0.0
              END
        ) / NULLIF(receita_liquida, 0) * 100,
        2
    ) AS margem_liquida_perc
FROM base_dre
ORDER BY ano, mes;

-- 2. View de Vendas e Rentabilidade por Cliente
CREATE OR REPLACE VIEW vw_vendas_por_cliente AS
SELECT
    c.cliente_id,
    c.razao_social,
    c.segmento,
    c.cidade,
    c.estado,
    c.regiao,
    c.limite_credito,
    v.nome AS vendedor_nome,
    COUNT(DISTINCT p.pedido_id) AS total_pedidos,
    ROUND(SUM(p.valor_bruto), 2) AS receita_bruta,
    ROUND(SUM(p.valor_desconto), 2) AS total_descontos,
    ROUND(SUM(p.valor_liquido), 2) AS receita_liquida_comercial,
    ROUND(SUM(p.cmv_total), 2) AS cmv_total,
    ROUND(SUM(p.lucro_bruto), 2) AS lucro_bruto_comercial,
    ROUND(SUM(p.lucro_bruto) / NULLIF(SUM(p.valor_liquido), 0) * 100, 2) AS margem_bruta_perc,
    ROUND(SUM(p.valor_bruto) / NULLIF(COUNT(DISTINCT p.pedido_id), 0), 2) AS ticket_medio
FROM dim_cliente c
JOIN fato_pedido p ON c.cliente_id = p.cliente_id
LEFT JOIN dim_vendedor v ON c.vendedor_id = v.vendedor_id
GROUP BY
    c.cliente_id, c.razao_social, c.segmento, c.cidade, c.estado, c.regiao, c.limite_credito, v.nome
ORDER BY receita_bruta DESC;

-- 3. View de Mix de Produtos e Categorias
CREATE OR REPLACE VIEW vw_mix_produtos AS
WITH totais AS (
    SELECT SUM(valor_bruto) AS receita_total_empresa FROM fato_item_pedido
)
SELECT
    pr.produto_id,
    pr.sku,
    pr.nome AS produto_nome,
    pr.categoria,
    pr.unidade,
    COUNT(DISTINCT i.pedido_id) AS pedidos_com_item,
    SUM(i.quantidade) AS quantidade_vendida,
    ROUND(SUM(i.valor_bruto), 2) AS receita_bruta,
    ROUND(SUM(i.valor_desconto), 2) AS descontos,
    ROUND(SUM(i.valor_liquido), 2) AS receita_liquida_comercial,
    ROUND(SUM(i.cmv), 2) AS cmv_total,
    ROUND(SUM(i.margem_bruta), 2) AS margem_bruta_valor,
    ROUND(SUM(i.margem_bruta) / NULLIF(SUM(i.valor_liquido), 0) * 100, 2) AS margem_bruta_perc,
    ROUND(SUM(i.valor_bruto) / NULLIF((SELECT receita_total_empresa FROM totais), 0) * 100, 3) AS share_receita_perc
FROM dim_produto pr
JOIN fato_item_pedido i ON pr.produto_id = i.produto_id
GROUP BY pr.produto_id, pr.sku, pr.nome, pr.categoria, pr.unidade
ORDER BY margem_bruta_valor DESC;

-- 4. View de Orçado vs Realizado (Receita, CMV e Despesas por Departamento)
CREATE OR REPLACE VIEW vw_orcado_realizado AS
WITH realizado_unificado AS (
    -- Receita Bruta Realizada (PC002 / DEP001)
    SELECT
        ano,
        mes,
        'DEP001' AS departamento_id,
        'PC002' AS conta_id,
        ROUND(SUM(valor_bruto), 2) AS valor_realizado
    FROM fato_pedido
    GROUP BY ano, mes
    UNION ALL
    -- CMV Realizado (PC011 / DEP004)
    SELECT
        ano,
        mes,
        'DEP004' AS departamento_id,
        'PC011' AS conta_id,
        ROUND(SUM(cmv_total), 2) AS valor_realizado
    FROM fato_pedido
    GROUP BY ano, mes
    UNION ALL
    -- Despesas Operacionais por Departamento e Conta
    SELECT
        ano,
        mes,
        departamento_id,
        conta_id,
        ROUND(SUM(valor), 2) AS valor_realizado
    FROM fato_despesa
    GROUP BY ano, mes, departamento_id, conta_id
)
SELECT
    o.ano,
    o.mes,
    printf('%04d-%02d', o.ano, o.mes) AS competencia,
    o.departamento_id,
    d.nome AS departamento_nome,
    o.conta_id,
    pc.descricao AS conta_descricao,
    pc.tipo AS tipo_conta,
    ROUND(o.valor_orcado, 2) AS valor_orcado,
    ROUND(COALESCE(r.valor_realizado, 0.0), 2) AS valor_realizado,
    ROUND(COALESCE(r.valor_realizado, 0.0) - o.valor_orcado, 2) AS variacao_absoluta,
    ROUND((COALESCE(r.valor_realizado, 0.0) - o.valor_orcado) / NULLIF(o.valor_orcado, 0) * 100, 2) AS variacao_perc,
    ROUND(COALESCE(r.valor_realizado, 0.0) / NULLIF(o.valor_orcado, 0) * 100, 2) AS aderencia_perc
FROM fato_orcamento o
LEFT JOIN realizado_unificado r
    ON o.ano = r.ano
   AND o.mes = r.mes
   AND o.departamento_id = r.departamento_id
   AND o.conta_id = r.conta_id
LEFT JOIN dim_departamento d ON o.departamento_id = d.departamento_id
LEFT JOIN dim_plano_contas pc ON o.conta_id = pc.conta_id
ORDER BY o.ano, o.mes, o.conta_id, o.departamento_id;

-- 5. View de Evolução Mensal de Indicadores
CREATE OR REPLACE VIEW vw_evolucao_mensal AS
SELECT
    dre.ano,
    dre.mes,
    dre.competencia,
    dre.qtd_pedidos,
    ROUND(dre.receita_bruta / NULLIF(dre.qtd_pedidos, 0), 2) AS ticket_medio,
    dre.receita_bruta,
    dre.devolucoes,
    ROUND(dre.devolucoes / NULLIF(dre.receita_bruta, 0) * 100, 2) AS indice_devolucao_perc,
    dre.receita_liquida,
    dre.cmv_liquido,
    dre.lucro_bruto,
    dre.margem_bruta_perc,
    dre.despesas_operacionais_totais,
    dre.ebitda,
    dre.margem_ebitda_perc,
    dre.lucro_liquido,
    dre.margem_liquida_perc,
    LAG(dre.receita_liquida) OVER (ORDER BY dre.ano, dre.mes) AS receita_liquida_mes_anterior,
    ROUND(
        (dre.receita_liquida - LAG(dre.receita_liquida) OVER (ORDER BY dre.ano, dre.mes))
        / NULLIF(LAG(dre.receita_liquida) OVER (ORDER BY dre.ano, dre.mes), 0) * 100,
        2
    ) AS crescimento_mom_perc
FROM vw_dre_mensal dre
ORDER BY dre.ano, dre.mes;

-- 6. View de Posição de Estoque por Produto
CREATE OR REPLACE VIEW vw_estoque_posicao AS
WITH ultima_mov AS (
    SELECT
        produto_id,
        saldo_quantidade,
        saldo_valor,
        ROW_NUMBER() OVER (PARTITION BY produto_id ORDER BY ano DESC, mes DESC, movimentacao_id DESC) AS rn
    FROM fato_estoque
),
mov_resumo AS (
    SELECT
        produto_id,
        SUM(CASE WHEN tipo_mov = 'ENTRADA' THEN quantidade ELSE 0 END) AS total_entradas_qtd,
        SUM(CASE WHEN tipo_mov = 'SAIDA' THEN quantidade ELSE 0 END) AS total_saidas_qtd,
        SUM(CASE WHEN tipo_mov = 'DEVOLUCAO' THEN quantidade ELSE 0 END) AS total_devolucoes_qtd
    FROM fato_estoque
    GROUP BY produto_id
)
SELECT
    p.produto_id,
    p.sku,
    p.nome AS produto_nome,
    p.categoria,
    p.unidade,
    p.estoque_minimo,
    u.saldo_quantidade AS saldo_atual_qtd,
    ROUND(u.saldo_valor, 2) AS saldo_atual_valor,
    m.total_entradas_qtd,
    m.total_saidas_qtd,
    m.total_devolucoes_qtd,
    CASE
        WHEN u.saldo_quantidade < p.estoque_minimo THEN 'CRITICO'
        WHEN u.saldo_quantidade < p.estoque_minimo * 1.5 THEN 'ATENCAO'
        ELSE 'NORMAL'
    END AS status_estoque
FROM dim_produto p
JOIN ultima_mov u ON p.produto_id = u.produto_id AND u.rn = 1
LEFT JOIN mov_resumo m ON p.produto_id = m.produto_id
ORDER BY u.saldo_valor DESC;
