# Dicionário de Dados — INTERFOOD FINANCIAL INTELLIGENCE

> **AVISO IMPORTANTE:** Todos os dados descritos neste dicionário são **100% SINTÉTICOS e fictícios** (`seed=42`).

---

## 1. Tabelas Dimensionais (`dim_*`)

### 1.1 `dim_cliente` (60 registros)
Cadastro de clientes pessoa jurídica (B2B) atendidos pela distribuidora.

| Coluna | Tipo SQL | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `cliente_id` | `VARCHAR PK` | Identificador único do cliente | `CLI0001` |
| `razao_social` | `VARCHAR` | Razão social fictícia identificada como sintética | `Silva & Filhos (Supermercado) [SINTÉTICO]` |
| `cnpj_ficticio` | `VARCHAR(25)` | CNPJ fictício formatado | `12.345.678/0001-11` |
| `segmento` | `VARCHAR(50)` | Canal B2B (`Supermercado`, `Restaurante`, `Atacado`, `Padaria`, `Hotel`, `Empório`) | `Supermercado` |
| `cidade` | `VARCHAR(100)` | Município de localização | `Campinas` |
| `estado` | `VARCHAR(2)` | UF (`SP`, `RJ`, `MG`, `RS`, `PR`, `SC`, `BA`, `GO`, `PE`, `CE`) | `SP` |
| `regiao` | `VARCHAR(30)` | Macrorregião geográfica brasileira | `Sudeste` |
| `limite_credito` | `DOUBLE` | Limite de crédito aprovado em R$ | `250000.00` |
| `vendedor_id` | `VARCHAR FK` | Vendedor responsável pela carteira (`dim_vendedor`) | `VND003` |
| `ativo` | `BOOLEAN` | Status cadastral do cliente | `TRUE` |

---

### 1.2 `dim_produto` (80 registros)
Catálogo de produtos distribuídos em 5 categorias alimentícias (16 SKUs por categoria).

| Coluna | Tipo SQL | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `produto_id` | `VARCHAR PK` | Identificador único do produto | `PRD0001` |
| `sku` | `VARCHAR(30)` | Código SKU único de estoque | `SKU-LAT-0001` |
| `nome` | `VARCHAR` | Descrição comercial do produto | `Leite Integral UHT 1L` |
| `categoria` | `VARCHAR(50)` | Categoria (`Laticínios`, `Carnes e Frios`, `Bebidas`, `Grãos e Cereais`, `Hortifruti`) | `Laticínios` |
| `subcategoria` | `VARCHAR(50)` | Subcategoria mercadológica | `Laticínios` |
| `unidade` | `VARCHAR(10)` | Unidade comercial (`UN`, `KG`, `CX`, `SC`, `PT`, `MÇ`) | `UN` |
| `custo_unitario` | `DOUBLE` | Custo padrão de reposição em R$ | `2.80` |
| `preco_venda` | `DOUBLE` | Preço de tabela de venda em R$ | `4.30` |
| `margem_bruta_perc` | `DOUBLE` | Margem bruta teórica de tabela (%) | `34.88` |
| `estoque_minimo` | `INTEGER` | Ponto mínimo de segurança em unidades | `120` |
| `ativo` | `BOOLEAN` | Indica se o SKU está ativo no portfólio | `TRUE` |

---

### 1.3 `dim_departamento` (7 registros)
Centros de custo e departamentos corporativos da distribuidora.

| Coluna | Tipo SQL | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `departamento_id` | `VARCHAR PK` | Código do departamento | `DEP002` |
| `nome` | `VARCHAR` | Nome do departamento | `Controladoria e Finanças` |
| `sigla` | `VARCHAR(10)` | Sigla executiva | `FIN` |
| `centro_custo` | `VARCHAR(20)` | Código do centro de custo contábil | `CC-102` |
| `gestor` | `VARCHAR` | Nome fictício do gestor responsável | `Ana Paula Costa` |

---

### 1.4 `dim_vendedor` (8 registros)
Equipe comercial responsável pelas vendas B2B.

| Coluna | Tipo SQL | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `vendedor_id` | `VARCHAR PK` | Código do executivo de vendas | `VND001` |
| `nome` | `VARCHAR` | Nome completo fictício | `Rafael Almeida` |
| `departamento_id` | `VARCHAR FK` | Departamento de alocação (`DEP001`) | `DEP001` |
| `comissao_perc` | `DOUBLE` | Percentual de comissão sobre vendas (%) | `2.45` |
| `ativo` | `BOOLEAN` | Status ativo na força de vendas | `TRUE` |

---

### 1.5 `dim_tempo` (1.096 registros)
Calendário diário contínuo de `2022-01-01` a `2024-12-31`.

| Coluna | Tipo SQL | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `data_id` | `INTEGER PK` | Chave inteira no formato `YYYYMMDD` | `20241231` |
| `data` | `DATE` | Data calendário ISO | `2024-12-31` |
| `ano` | `INTEGER` | Ano civil (`2022`, `2023`, `2024`) | `2024` |
| `mes` | `INTEGER` | Mês numérico (`1` a `12`) | `12` |
| `dia` | `INTEGER` | Dia do mês (`1` a `31`) | `31` |
| `trimestre` | `INTEGER` | Trimestre do ano (`1` a `4`) | `4` |
| `semestre` | `INTEGER` | Semestre do ano (`1` ou `2`) | `2` |
| `nome_mes` | `VARCHAR(20)` | Nome do mês em português | `Dezembro` |
| `nome_mes_abrev` | `VARCHAR(5)` | Abreviação de 3 letras | `Dez` |
| `dia_semana` | `INTEGER` | Dia da semana (`0`=Segunda a `6`=Domingo) | `1` |
| `nome_dia_semana` | `VARCHAR(20)` | Nome do dia da semana em português | `Terça-feira` |
| `is_fim_semana` | `BOOLEAN` | Indica sábado ou domingo | `FALSE` |
| `is_ultimo_dia_mes`| `BOOLEAN` | Indica fechamento mensal | `TRUE` |

---

### 1.6 `dim_plano_contas` (25 registros)
Estrutura hierárquica do Plano de Contas Gerencial e DRE.

| Coluna | Tipo SQL | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `conta_id` | `VARCHAR PK` | Identificador da conta contábil | `PC002` |
| `codigo` | `VARCHAR(20)` | Código estruturado da DRE | `1.1` |
| `descricao` | `VARCHAR` | Nome da rubrica contábil | `Receita Bruta de Vendas` |
| `tipo` | `VARCHAR(30)` | Classificação (`RECEITA`, `CUSTO`, `DESPESA`, `RESULTADO`) | `RECEITA` |
| `nivel` | `INTEGER` | Nível hierárquico (`1`, `2`, `3`) | `2` |
| `conta_pai` | `VARCHAR` | Conta sintética superior | `PC001` |
| `natureza` | `VARCHAR(20)` | Natureza contábil (`CREDORA`, `DEVEDORA`) | `CREDORA` |

---

## 2. Tabelas Fato (`fato_*`)

### 2.1 `fato_pedido` (~18.400 registros)
Cabeçalhos de pedidos de venda faturados nos 36 meses.

- **Granularidade**: 1 linha por pedido emitido.
- **Colunas principais**: `pedido_id (PK)`, `data_id (FK)`, `data_pedido`, `ano`, `mes`, `cliente_id (FK)`, `vendedor_id (FK)`, `status`, `valor_bruto`, `valor_desconto`, `valor_liquido`, `cmv_total`, `lucro_bruto`.

### 2.2 `fato_item_pedido` (~83.000 registros)
Itens detalhados de cada pedido de venda.

- **Granularidade**: 1 linha por produto (`produto_id`) dentro de um `pedido_id`.
- **Colunas principais**: `item_id (PK)`, `pedido_id (FK)`, `produto_id (FK)`, `quantidade`, `preco_unitario`, `custo_unitario`, `valor_bruto`, `valor_desconto`, `valor_liquido`, `cmv`, `margem_bruta`.

### 2.3 `fato_devolucao` (~830 registros)
Ocorrências de logística reversa e devoluções de clientes vinculadas aos pedidos originais.

- **Colunas principais**: `devolucao_id (PK)`, `pedido_origem_id (FK)`, `produto_id (FK)`, `data_id (FK)`, `data_devolucao`, `ano`, `mes`, `quantidade`, `valor_devolucao`, `cmv_revertido`, `motivo`.

### 2.4 `fato_despesa` (756 registros)
Lançamentos mensais de despesas operacionais (SG&A) por departamento e conta contábil.

- **Colunas principais**: `despesa_id (PK)`, `data_id (FK)`, `data_despesa`, `ano`, `mes`, `departamento_id (FK)`, `conta_id (FK)`, `descricao`, `valor`, `tipo` (`FIXA` ou `VARIAVEL`).

### 2.5 `fato_orcamento` (828 registros)
Peça orçamentária (Budget) mensalizada por ano, mês, departamento e conta contábil.

- **Colunas principais**: `orcamento_id (PK)`, `ano`, `mes`, `departamento_id (FK)`, `conta_id (FK)`, `descricao`, `valor_orcado`.

### 2.6 `fato_estoque` (~6.500 registros)
Kardex mensal de movimentações físicas e financeiras de estoque (`ENTRADA`, `SAIDA`, `DEVOLUCAO`).

- **Colunas principais**: `movimentacao_id (PK)`, `data_id (FK)`, `data_movimentacao`, `ano`, `mes`, `produto_id (FK)`, `tipo_mov`, `quantidade`, `custo_unitario`, `valor_total`, `saldo_quantidade`, `saldo_valor`.

---

## 3. Views Analíticas (`vw_*`)

| View SQL | Finalidade Executiva |
| :--- | :--- |
| `vw_dre_mensal` | Demonstração do Resultado do Exercício completa mês a mês (Receita Bruta até Lucro Líquido). |
| `vw_vendas_por_cliente` | Ranking de clientes com faturamento, descontos, margem bruta comercial e ticket médio. |
| `vw_mix_produtos` | Performance por SKU e categoria com volume, receita, CMV, margem bruta e share de faturamento. |
| `vw_orcado_realizado` | Confronto matricial entre Orçado e Realizado com variação em R$, variação % e índice de aderência. |
| `vw_evolucao_mensal` | Série temporal de 36 meses com cálculo de crescimento MoM (`LAG`) e índice de devolução. |
| `vw_estoque_posicao` | Posição de fechamento de estoque por SKU com classificação de criticidade (`NORMAL`, `ATENCAO`, `CRITICO`). |
