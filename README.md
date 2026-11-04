# INTERFOOD FINANCIAL INTELLIGENCE

> ⚠️ **AVISO LEGAL — DADOS 100% SINTÉTICOS:** Todos os dados contidos neste repositório (clientes, CNPJs, produtos, pedidos, custos, despesas, orçamentos e indicadores) são **100% sintéticos e fictícios**, gerados deterministicamente (`seed=42`) para fins exclusivos de demonstração técnica em **Controladoria, Engenharia de Dados e Ciência de Dados**. Nenhuma informação real da Interfood ou de terceiros foi utilizada.

---

## 🎯 Visão Executiva do Case

O **INTERFOOD FINANCIAL INTELLIGENCE** simula e analisa **36 meses de operação (Janeiro/2022 a Dezembro/2024)** de uma distribuidora atacadista B2B de alimentos e bebidas no Brasil, integrando:

- 🏗️ **Arquitetura Dimensional (Star Schema)** sobre **DuckDB** (6 dimensões, 6 tabelas fato e 6 views OLAP).
- 🔄 **Pipeline ETL Idempotente** em Python com validação de schema, logs estruturados (`Loguru`) e reconciliação contábil automática centavo a centavo.
- 📊 **Motor de Controladoria (DRE, Budget Matricial & KPIs)**: apuração completa da DRE mensal e anual, análise de variação Orçado vs. Realizado, curva ABC de clientes/SKUs e semáforo executivo de metas.
- 🎨 **Identidade Visual Executiva**: Paleta institucional **Azul-Marinho (`#0A1628`)**, **Branco (`#FFFFFF`)** e **Verde (`#00A86B`)**, com valores em **R$** e formatação numérica brasileira (`pt-BR`).
- 🧪 **Qualidade Assegurada**: Suíte automatizada `Pytest` com **16 testes** de integridade referencial, reconciliação contábil da DRE e validação de KPIs.

---

## 📈 Destaques Financeiros do Dataset Sintético (Consolidado 36 Meses)

| Indicador Executivo | 2022 | 2023 | 2024 | Total 36 Meses | Status Meta |
| :--- | ---: | ---: | ---: | ---: | :---: |
| **Pedidos Faturados** | 5.264 | 5.904 | 6.813 | **17.981** | 🟢 |
| **Receita Bruta de Vendas** | R$ 32.086.620,62 | R$ 35.941.347,20 | R$ 41.914.279,49 | **R$ 109.942.247,31** | 🟢 |
| **Receita Líquida (DRE)** | R$ 27.143.091,17 | R$ 30.391.425,40 | R$ 35.439.754,75 | **R$ 92.974.271,32** | 🟢 |
| **Lucro Bruto** | R$ 8.399.839,58 | R$ 9.403.524,18 | R$ 10.965.724,80 | **R$ 28.769.088,56** | 🟢 |
| **Margem Bruta (%)** | 30,95% | 30,94% | 30,94% | **30,94%** | 🟢 `>= 28%` |
| **EBITDA (LAJIDA)** | R$ 3.350.684,96 | R$ 4.058.431,20 | R$ 5.308.665,30 | **R$ 12.717.781,46** | 🟢 |
| **Margem EBITDA (%)** | 12,34% | 13,35% | 14,98% | **13,68%** | 🟢 `>= 10%` |
| **Lucro Líquido** | R$ 2.128.057,26 | R$ 2.643.802,38 | R$ 3.582.893,97 | **R$ 8.354.753,61** | 🟢 |
| **Margem Líquida (%)** | 7,84% | 8,70% | 10,11% | **8,99%** | 🟢 `>= 6%` |

---

## 🗂️ Estrutura do Projeto

```text
interfood-controladoria/
├── src/
│   └── interfood/
│       ├── config/
│       │   └── settings.py            # Configurações, caminhos, paleta de cores e formatadores R$ (pt-BR)
│       ├── data/
│       │   └── generator.py           # Gerador sintético determinístico (seed=42, 36 meses, 11 tabelas)
│       ├── database/
│       │   ├── schema.sql             # DDL Star Schema (6 dimensões e 6 tabelas fato)
│       │   ├── views.sql              # 6 Views analíticas OLAP (DRE, Clientes, Mix, Budget, Evolução, Estoque)
│       │   ├── connection.py          # Gerenciador de conexão DuckDB
│       │   └── queries.py             # Consultas analíticas estruturadas em DataFrames
│       ├── etl/
│       │   ├── extract.py             # Extração de CSVs e validação estrita de schemas
│       │   ├── transform.py           # Transformação, dim_tempo e reconciliação Pedido vs. Itens
│       │   ├── load.py                # Carga transacional idempotente no DuckDB
│       │   └── pipeline.py            # Orquestrador ETL com telemetria e logs (Loguru)
│       └── kpis/
│           └── calculators.py         # Calculadores de KPIs, YoY, aderência ao Budget e Semáforo
├── scripts/
│   ├── 01_generate_data.py            # Etapa 2: Gera os 11 CSVs sintéticos em data/raw/
│   ├── 02_setup_database.py           # Etapa 3: Inicializa o banco DuckDB, tabelas e views
│   ├── 03_run_etl.py                  # Etapa 4: Executa a pipeline ETL ponta a ponta
│   ├── 04_relatorio_executivo.py      # Etapa 6: Exibe relatório Rich e exporta Dashboard HTML + CSVs
│   └── run_all.py                     # Executa todas as etapas e a suíte Pytest em sequência
├── tests/
│   ├── conftest.py                    # Fixtures Pytest com auto-população do banco
│   ├── test_integridade.py            # Testes de chaves, unicidade, período de 36 meses e saldos
│   ├── test_reconciliacao.py          # Testes contábeis (Pedido == Itens, identidades da DRE)
│   └── test_kpis.py                   # Testes de intervalos de margens, YoY e aderência ao Budget
├── docs/
│   ├── arquitetura.md                 # Arquitetura, fluxo Mermaid, ADRs e identidade visual
│   ├── dicionario_dados.md            # Dicionário completo das 12 tabelas e 6 views
│   ├── kpis.md                        # Fórmulas matemáticas, fontes e semáforos dos KPIs
│   └── regras_negocio.md              # Regras de sazonalidade, impostos, devoluções, estoque e DRE
├── data/
│   ├── raw/                           # CSVs brutos gerados localmente
│   ├── processed/                     # Resumos mensais processados pelo ETL
│   └── exports/                       # Dashboard HTML executivo e CSVs de DRE / Budget
├── pyproject.toml
├── requirements.txt
└── .env.example
```

---

## 🚀 Como Executar

### 1. Instalar dependências
```bash
pip install -r requirements.txt
```

### 2. Executar o fluxo completo de uma só vez (Recomendado)
```bash
python scripts/run_all.py
```

Ou executar etapa por etapa:
```bash
python scripts/01_generate_data.py
python scripts/02_setup_database.py
python scripts/03_run_etl.py
python scripts/04_relatorio_executivo.py
pytest tests/ -v --tb=short
```

---

## 📚 Documentação Técnica e de Negócios

- [📐 Arquitetura do Sistema](docs/arquitetura.md)
- [📖 Dicionário de Dados (Star Schema & Views)](docs/dicionario_dados.md)
- [📊 Manual de KPIs e Semáforos](docs/kpis.md)
- [⚖️ Regras de Negócio e Contábeis](docs/regras_negocio.md)
- [🖥️ Dashboard Executivo HTML](data/exports/relatorio_executivo_interfood.html)

---

*INTERFOOD FINANCIAL INTELLIGENCE v1.0.0 — Case Fictício de Controladoria e Ciência de Dados (Dados 100% Sintéticos)*
