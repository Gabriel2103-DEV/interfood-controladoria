-- =============================================================================
-- INTERFOOD FINANCIAL INTELLIGENCE - Schema SQL (DuckDB)
-- ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS - Uso exclusivo para demonstração.
-- Modelagem Dimensional Star Schema para Controladoria e Finanças
-- =============================================================================

-- ─── DIMENSÕES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dim_departamento (
    departamento_id VARCHAR PRIMARY KEY,
    nome VARCHAR NOT NULL,
    sigla VARCHAR(10) NOT NULL,
    centro_custo VARCHAR(20) NOT NULL,
    gestor VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_vendedor (
    vendedor_id VARCHAR PRIMARY KEY,
    nome VARCHAR NOT NULL,
    departamento_id VARCHAR NOT NULL,
    comissao_perc DOUBLE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dim_cliente (
    cliente_id VARCHAR PRIMARY KEY,
    razao_social VARCHAR NOT NULL,
    cnpj_ficticio VARCHAR(25) NOT NULL,
    segmento VARCHAR(50) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    regiao VARCHAR(30) NOT NULL,
    limite_credito DOUBLE NOT NULL,
    vendedor_id VARCHAR NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dim_produto (
    produto_id VARCHAR PRIMARY KEY,
    sku VARCHAR(30) UNIQUE NOT NULL,
    nome VARCHAR NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    subcategoria VARCHAR(50) NOT NULL,
    unidade VARCHAR(10) NOT NULL,
    custo_unitario DOUBLE NOT NULL,
    preco_venda DOUBLE NOT NULL,
    margem_bruta_perc DOUBLE NOT NULL,
    estoque_minimo INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dim_tempo (
    data_id INTEGER PRIMARY KEY,
    data DATE NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    trimestre INTEGER NOT NULL,
    semestre INTEGER NOT NULL,
    nome_mes VARCHAR(20) NOT NULL,
    nome_mes_abrev VARCHAR(5) NOT NULL,
    dia_semana INTEGER NOT NULL,
    nome_dia_semana VARCHAR(20) NOT NULL,
    is_fim_semana BOOLEAN NOT NULL,
    is_ultimo_dia_mes BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_plano_contas (
    conta_id VARCHAR PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    descricao VARCHAR NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    nivel INTEGER NOT NULL,
    conta_pai VARCHAR,
    natureza VARCHAR(20) NOT NULL
);

-- ─── TABELAS FATO ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fato_pedido (
    pedido_id VARCHAR PRIMARY KEY,
    data_id INTEGER NOT NULL,
    data_pedido DATE NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    cliente_id VARCHAR NOT NULL,
    vendedor_id VARCHAR NOT NULL,
    status VARCHAR(30) NOT NULL,
    valor_bruto DOUBLE NOT NULL,
    valor_desconto DOUBLE NOT NULL,
    valor_liquido DOUBLE NOT NULL,
    cmv_total DOUBLE NOT NULL,
    lucro_bruto DOUBLE NOT NULL
);

CREATE TABLE IF NOT EXISTS fato_item_pedido (
    item_id VARCHAR PRIMARY KEY,
    pedido_id VARCHAR NOT NULL,
    produto_id VARCHAR NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario DOUBLE NOT NULL,
    custo_unitario DOUBLE NOT NULL,
    valor_bruto DOUBLE NOT NULL,
    valor_desconto DOUBLE NOT NULL,
    valor_liquido DOUBLE NOT NULL,
    cmv DOUBLE NOT NULL,
    margem_bruta DOUBLE NOT NULL
);

CREATE TABLE IF NOT EXISTS fato_devolucao (
    devolucao_id VARCHAR PRIMARY KEY,
    pedido_origem_id VARCHAR NOT NULL,
    produto_id VARCHAR NOT NULL,
    data_id INTEGER NOT NULL,
    data_devolucao DATE NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    valor_devolucao DOUBLE NOT NULL,
    cmv_revertido DOUBLE NOT NULL,
    motivo VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS fato_despesa (
    despesa_id VARCHAR PRIMARY KEY,
    data_id INTEGER NOT NULL,
    data_despesa DATE NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    departamento_id VARCHAR NOT NULL,
    conta_id VARCHAR NOT NULL,
    descricao VARCHAR NOT NULL,
    valor DOUBLE NOT NULL,
    tipo VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS fato_orcamento (
    orcamento_id VARCHAR PRIMARY KEY,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    departamento_id VARCHAR NOT NULL,
    conta_id VARCHAR NOT NULL,
    descricao VARCHAR NOT NULL,
    valor_orcado DOUBLE NOT NULL
);

CREATE TABLE IF NOT EXISTS fato_estoque (
    movimentacao_id VARCHAR PRIMARY KEY,
    data_id INTEGER NOT NULL,
    data_movimentacao DATE NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    produto_id VARCHAR NOT NULL,
    tipo_mov VARCHAR(20) NOT NULL,
    quantidade INTEGER NOT NULL,
    custo_unitario DOUBLE NOT NULL,
    valor_total DOUBLE NOT NULL,
    saldo_quantidade INTEGER NOT NULL,
    saldo_valor DOUBLE NOT NULL
);
