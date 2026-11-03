# INTERFOOD FINANCIAL INTELLIGENCE

> ⚠️ **AVISO: Todos os dados contidos neste projeto são 100% SINTÉTICOS e fictícios.**
> Gerados com seed=42 para fins de demonstração e análise de Controladoria.
> Nenhum dado reflete operações reais de qualquer empresa.

---

## Visão Geral

O **INTERFOOD FINANCIAL INTELLIGENCE** é um case completo de **Controladoria e Ciência de Dados** para uma empresa distribuidora de alimentos fictícia. O projeto demonstra:

- 🏗️ **Modelagem de Dados** (Star Schema / DuckDB)
- 🔄 **Pipeline ETL** completa com validações e logs
- 📊 **KPIs Financeiros** (DRE, Margens, Budget vs Realizado)
- 🧪 **Testes de Integridade e Reconciliação**
- 📋 **Relatórios Executivos**

### Período: Janeiro/2022 a Dezembro/2024 (36 meses)

---

## Tecnologias

| Componente         | Tecnologia          |
|--------------------|---------------------|
| Linguagem          | Python 3.11+        |
| Banco de Dados     | DuckDB 0.10+        |
| Manipulação        | Pandas 2.1+         |
| Numérico           | NumPy 1.26+         |
| Dados Sintéticos   | Faker 22+           |
| Interface Rich     | Rich 13.7+          |
| Validação          | Pydantic 2.5+       |
| Logging            | Loguru 0.7+         |
| Testes             | Pytest 7.4+         |
| Relatórios         | OpenPyXL + MatPlotlib |

---

## Estrutura do Projeto

```
interfood-controladoria/
├── src/
│   └── interfood/
│       ├── config/          # Configurações centralizadas
│       ├── database/        # Schema SQL, conexão DuckDB, views
│       ├── data/            # Gerador de dados sintéticos
│       ├── etl/             # Pipeline ETL (extract, transform, load)
│       └── kpis/            # Calculadores de KPIs financeiros
├── data/
│   ├── raw/                 # CSVs gerados pelo gerador
│   ├── processed/           # Dados processados
│   └── exports/             # Relatórios e exportações
├── tests/
│   ├── test_integridade.py  # Testes de integridade de dados
│   ├── test_reconciliacao.py # Testes de reconciliação financeira
│   └── test_kpis.py         # Validação de KPIs
├── docs/
│   ├── arquitetura.md       # Arquitetura do sistema
│   ├── dicionario_dados.md  # Dicionário de dados
│   ├── kpis.md              # Definição de KPIs
│   └── regras_negocio.md    # Regras de negócio
├── scripts/
│   ├── 01_generate_data.py  # Gera dados sintéticos
│   ├── 02_setup_database.py # Configura banco DuckDB
│   ├── 03_run_etl.py        # Executa pipeline ETL
│   └── 04_relatorio_executivo.py # Relatório executivo
├── logs/                    # Logs de execução
├── pyproject.toml
├── requirements.txt
└── .env.example
```

---

## Como Executar

### 1. Instalar dependências

```bash
pip install -r requirements.txt
```

### 2. Configurar ambiente

```bash
cp .env.example .env
```

### 3. Gerar dados sintéticos

```bash
python scripts/01_generate_data.py
```

### 4. Configurar banco de dados

```bash
python scripts/02_setup_database.py
```

### 5. Executar pipeline ETL

```bash
python scripts/03_run_etl.py
```

### 6. Ver relatório executivo

```bash
python scripts/04_relatorio_executivo.py
```

### 7. Rodar testes

```bash
pytest tests/ -v --tb=short
```

---

## Modelo de Dados

### Dimensões
- **dim_cliente**: 60 clientes fictícios (redes, restaurantes, atacados)
- **dim_produto**: 80 produtos em 5 categorias alimentícias
- **dim_departamento**: 7 departamentos corporativos
- **dim_vendedor**: 8 vendedores com comissões
- **dim_tempo**: Calendário completo 2022-2024
- **dim_plano_contas**: Hierarquia DRE completa

### Fatos
- **fato_pedido**: ~15.000-18.000 pedidos no período
- **fato_item_pedido**: ~60.000-90.000 itens de pedido
- **fato_devolucao**: ~3% do valor de vendas
- **fato_despesa**: Despesas mensais por departamento
- **fato_orcamento**: Budget anual mensalizado
- **fato_estoque**: Movimentações de entrada/saída

---

## KPIs Monitorados

| KPI | Fórmula |
|-----|---------|
| Margem Bruta % | Lucro Bruto / Receita Líquida × 100 |
| Margem EBITDA % | EBITDA / Receita Líquida × 100 |
| Margem Líquida % | Lucro Líquido / Receita Líquida × 100 |
| Ticket Médio | Receita Bruta / Nº Pedidos |
| Índice de Devolução | Devoluções / Receita Bruta × 100 |
| Variação Orçamento | (Realizado - Orçado) / Orçado × 100 |
| Crescimento YoY | (Receita Ano N - Ano N-1) / Ano N-1 × 100 |

---

## Disclaimer

> **DADOS SINTÉTICOS**: Todo o conteúdo deste repositório — clientes, produtos, pedidos,
> valores financeiros e demais dados — é 100% fictício, gerado programaticamente com
> seed=42 para reproduzibilidade. Qualquer semelhança com empresas, CNPJs ou situações
> reais é mera coincidência.

---

*INTERFOOD FINANCIAL INTELLIGENCE v1.0.0 | Interfood Analytics Team*
