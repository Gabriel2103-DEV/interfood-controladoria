# INTERFOOD FINANCIAL INTELLIGENCE

> ⚠️ **AVISO LEGAL — DADOS 100% SINTÉTICOS:** Todos os dados contidos neste repositório (clientes, CNPJs, produtos, pedidos, custos, despesas, orçamentos e indicadores) são **100% sintéticos e fictícios**, gerados deterministicamente (`seed=42`) para fins exclusivos de demonstração técnica em **Controladoria, Planejamento Financeiro (FP&A), Engenharia de Dados e Ciência de Dados**. Nenhuma informação real da Interfood ou de terceiros foi utilizada.

---

## 🎯 Visão Executiva do Case

O **INTERFOOD FINANCIAL INTELLIGENCE** simula e analisa **36 meses de operação (Janeiro/2022 a Dezembro/2024)** de uma distribuidora atacadista B2B de alimentos e bebidas no Brasil, integrando:

- 🏗️ **Arquitetura Dimensional (Star Schema)** sobre **DuckDB** (6 dimensões, 6 tabelas fato e 6 views OLAP).
- 🔄 **Pipeline ETL Idempotente** em Python com validação de schema, logs estruturados (`Loguru`) e reconciliação contábil automática centavo a centavo.
- 📊 **Dashboard Executivo Interativo de Controladoria (`docs/index.html`)**: aplicação web estática (compatível com **GitHub Pages** e **100% offline**, zero dependências de CDNs externas) com filtros dinâmicos simultâneos, gráficos SVG interativos, DRE completa, análise Budget x Actual, rentabilidade multidimensional, módulo **Gestão de Dados** (CRUD inline + persistência `localStorage` + importação/exportação CSV e JSON) e **Modo de Apresentação Executiva (Boardroom Mode)**.
- 🎨 **Identidade Visual Executiva**: Paleta institucional **Azul-Marinho (`#0A1628`)**, **Branco (`#FFFFFF`)** e **Verde (`#00A86B`)**, com valores em **R$** e formatação numérica brasileira (`pt-BR`).
- 🧪 **Qualidade Assegurada**: Suíte automatizada `Pytest` com **20 testes** cobrindo integridade referencial, reconciliação contábil da DRE, validação de KPIs e todos os fluxos do dashboard interativo.

---

## 📈 Destaques Financeiros do Dataset Sintético (Consolidado 36 Meses)

| Indicador Executivo | 2022 | 2023 | 2024 | Total 36 Meses | Status Meta |
| :--- | ---: | ---: | ---: | ---: | :---: |
| **Pedidos Faturados** | 5.264 | 5.904 | 6.813 | **17.981** | 🟢 |
| **Receita Bruta de Vendas** | R$ 32.086.620,62 | R$ 35.941.347,20 | R$ 41.914.222,40 | **R$ 109.942.190,22** | 🟢 |
| **Receita Líquida (DRE)** | R$ 27.143.091,17 | R$ 30.391.425,40 | R$ 35.439.754,75 | **R$ 92.974.271,32** | 🟢 |
| **Lucro Bruto** | R$ 8.399.839,58 | R$ 9.403.524,18 | R$ 10.965.724,80 | **R$ 28.769.088,56** | 🟢 |
| **Margem Bruta (%)** | 30,95% | 30,94% | 30,94% | **30,94%** | 🟢 `>= 28%` |
| **EBITDA (LAJIDA)** | R$ 3.350.684,96 | R$ 4.058.431,20 | R$ 5.308.665,30 | **R$ 12.717.781,46** | 🟢 |
| **Margem EBITDA (%)** | 12,34% | 13,35% | 14,98% | **13,68%** | 🟢 `>= 10%` |
| **Lucro Líquido** | R$ 2.128.057,26 | R$ 2.643.802,38 | R$ 3.582.893,97 | **R$ 8.354.753,61** | 🟢 |
| **Margem Líquida (%)** | 7,84% | 8,70% | 10,11% | **8,99%** | 🟢 `>= 6%` |

---

## 🖥️ Como Utilizar o Dashboard Executivo Interativo (`docs/index.html`)

O ponto de entrada do dashboard é `docs/index.html` (compatível com **GitHub Pages** ou abertura direta local no navegador). O relatório estático original foi integralmente preservado em `docs/relatorio_estatico_original.html` (e em `data/exports/relatorio_executivo_interfood.html`).

### 1. Navegação entre Módulos
Na barra superior de navegação você pode alternar entre 4 módulos:
1. **📊 1. Visão Executiva & KPIs**: 8 cards dinâmicos (Receita Bruta, Receita Líquida, Lucro Bruto & Margem Bruta, EBITDA & Margem EBITDA, Despesas SG&A, Lucro Líquido, Aderência Budget x Actual e Ticket Médio/Devoluções), 4 gráficos interativos SVG (Evolução Mensal, Ponte DRE Waterfall, Comparativo Budget x Actual e Rentabilidade por Categoria) e Semáforo de Metas.
2. **📑 2. DRE Gerencial & Budget x Actual**: Demonstração do Resultado do Exercício completa com alternância entre **Visão Anual Consolidada** e **Visão Mensal Detalhada** (incluindo Análise Vertical `AV %`), além da tabela analítica de desvios Orçado vs. Realizado por Centro de Custo e Conta Contábil.
3. **🎯 3. Rentabilidade Comercial**: Tabelas interativas com busca e ordenação para as **5 Categorias**, **4 Regiões Geográficas**, **80 Produtos (SKUs)** e **60 Clientes B2B**.
4. **⚙️ 4. Gestão de Dados**: Edição inline de registros, adição, exclusão com confirmação, ajuste de parâmetros fiscais/metas, persistência local (`localStorage`) e importação/exportação CSV e JSON.

### 2. Filtros Dinâmicos Simultâneos
O painel global de filtros permite refinar simultaneamente todos os indicadores, gráficos e tabelas por:
- **Período / Intervalo de Datas** (`Data Inicial` e `Data Final`)
- **Ano Fiscal** (`2022`, `2023`, `2024` ou `Todos`)
- **Mês de Competência** (`Janeiro` a `Dezembro` ou `Todos`)
- **Categoria de Produto** (`Bebidas`, `Congelados`, `Conservas e Óleos`, `Laticínios`, `Secos e Mercearia`)
- **Produto (SKU)** (`80 SKUs`, filtrados dinamicamente pela categoria selecionada)
- **Região Geográfica** (`Centro-Oeste`, `Nordeste`, `Sudeste`, `Sul`)
- **Cliente B2B** (`60 clientes`, filtrados dinamicamente pela região selecionada)
- Botão **↺ Limpar Todos os Filtros** para retornar imediatamente à visão consolidada de 36 meses.

### 3. Como Editar, Adicionar e Excluir Dados ("Gestão de Dados")
No módulo **⚙️ 4. Gestão de Dados**, selecione a sub-aba desejada (`Vendas & Custos`, `Despesas Operacionais`, `Orçamento (Budget)` ou `Metas & Parâmetros DRE`):
- **Edição Inline**: altere os valores numéricos (quantidade, receita bruta, descontos, devoluções, CMV, despesas ou orçamento) ou a data diretamente nas células da tabela e clique em **💾 Salvar** na respectiva linha. O motor valida imediatamente os dados (impedindo números negativos, datas inexistentes ou descontos superiores à receita) e recalcula toda a DRE, KPIs e gráficos.
- **Adicionar Registro**: preencha o formulário superior da aba ativa e clique em **➕ Incluir Venda / Despesa / Orçamento**.
- **Excluir Registro**: clique no botão **🗑** da linha desejada e confirme no modal de segurança.
- **Metas & Parâmetros DRE**: ajuste alíquotas de impostos, depreciação mensal, resultado financeiro e metas do semáforo, clicando em **💾 Salvar Parâmetros e Recalcular DRE & Metas**.

### 4. Como Salvar, Exportar, Importar e Restaurar a Base Original
Como o projeto é hospedado estaticamente no **GitHub Pages**:
- **Persistência Local (`localStorage`)**: todas as alterações salvas ficam armazenadas no `localStorage` do seu navegador (chave `interfood_controladoria_state_v1`) e permanecem ativas mesmo após atualizar a página (`F5`) ou fechar e reabrir o navegador. Você também pode clicar em **💾 Salvar no Navegador** a qualquer momento.
- **Aviso Importante**: as alterações são locais ao seu navegador e não modificam automaticamente o repositório GitHub nem os dados visualizados por outros usuários.
- **Exportar Dados (`CSV` e `JSON`)**:
  - Clique em **⬇ Exportar CSV** para baixar os registros da aba ativa em formato `.csv` (compatível com Excel/BI).
  - Clique em **⬇ Exportar JSON Completo** para baixar o snapshot integral da base editada (`.json`).
- **Importar Dados (`CSV` e `JSON`)**:
  - Clique em **⬆ Importar JSON / CSV** e selecione um arquivo `.json` (base completa) ou `.csv` (para atualizar a tabela da aba ativa). O sistema valida todas as colunas, tipos numéricos e datas antes de solicitar sua confirmação para substituir a base.
- **Restaurar Base Original**:
  - Clique em **↺ Restaurar Base Original** e confirme no modal para limpar o `localStorage` e restaurar instantaneamente o dataset sintético oficial (`Seed=42`) extraído do DuckDB.

### 5. Modo de Apresentação Executiva (Boardroom Mode)
Clique no botão **🖥 Modo Apresentação Executiva** no cabeçalho superior para abrir a interface limpa de reunião de diretoria:
- Navegue entre os **5 slides executivos** usando os botões superiores, `◀ Anterior` / `Próximo ▶` ou as setas do teclado (`⬅` / `➡`).
- Clique em **⛶ Tela Cheia** para ativar a API Fullscreen do navegador (`ESC` para sair).

---

## 🗂️ Estrutura do Projeto

```text
interfood-controladoria/
├── docs/                                  # Publicação GitHub Pages & Documentação Técnica
│   ├── index.html                         # Ponto de entrada do Dashboard Executivo Interativo
│   ├── relatorio_estatico_original.html   # Relatório estático original preservado
│   ├── assets/
│   │   ├── css/
│   │   │   └── dashboard.css              # Identidade visual (#0A1628, #FFFFFF, #00A86B) e responsividade
│   │   ├── data/
│   │   │   ├── interfood_data.json        # Dataset oficial exportado do DuckDB (JSON)
│   │   │   └── interfood_data.js          # Bundle JS offline (window.INTERFOOD_INITIAL_DATA)
│   │   └── js/
│   │       ├── financial-engine.js        # Motor centralizado de cálculo financeiro, DRE, filtros e validação
│   │       ├── storage-manager.js         # Persistência localStorage, importação/exportação CSV/JSON e restore
│   │       ├── charts.js                  # Renderizador de gráficos SVG interativos 100% offline
│   │       └── app.js                     # Controlador SPA, eventos de filtros, CRUD e Modo Apresentação
│   ├── arquitetura.md                     # Arquitetura, fluxo Mermaid, ADRs e identidade visual
│   ├── dicionario_dados.md                # Dicionário completo das 12 tabelas e 6 views
│   ├── kpis.md                            # Fórmulas matemáticas, fontes e semáforos dos KPIs
│   └── regras_negocio.md                  # Regras de sazonalidade, impostos, devoluções, estoque e DRE
├── src/
│   └── interfood/
│       ├── config/settings.py             # Configurações, caminhos, paleta de cores e formatadores R$
│       ├── data/generator.py              # Gerador sintético determinístico (seed=42, 36 meses, 11 tabelas)
│       ├── database/                      # DDL Star Schema, 6 Views OLAP, conexão DuckDB e queries
│       ├── etl/                           # Extração, transformação, reconciliação e carga transacional
│       ├── kpis/calculators.py            # Calculadores de KPIs, YoY, aderência ao Budget e Semáforo
│       └── dashboard_exporter.py          # Exportador do DuckDB para docs/assets/data/interfood_data.{json,js}
├── scripts/
│   ├── 01_generate_data.py                # Etapa 2: Gera os 11 CSVs sintéticos em data/raw/
│   ├── 02_setup_database.py               # Etapa 3: Inicializa o banco DuckDB, tabelas e views
│   ├── 03_run_etl.py                      # Etapa 4: Executa a pipeline ETL ponta a ponta
│   ├── 04_relatorio_executivo.py          # Etapa 6: Exibe relatório Rich e exporta relatórios estáticos
│   ├── 05_export_dashboard_data.py        # Exporta o bundle de dados do DuckDB para o Dashboard Interativo
│   └── run_all.py                         # Executa todas as etapas e a suíte Pytest em sequência
├── tests/
│   ├── conftest.py                        # Fixtures Pytest com auto-população do banco
│   ├── test_integridade.py                # Testes de chaves, unicidade, período de 36 meses e saldos
│   ├── test_reconciliacao.py              # Testes contábeis (Pedido == Itens, identidades da DRE)
│   ├── test_kpis.py                       # Testes de intervalos de margens, YoY e aderência ao Budget
│   └── test_dashboard_interativo.py       # Testes do motor financeiro JS, filtros, CRUD, persistência e offline
├── pyproject.toml
├── requirements.txt
└── .env.example
```

---

## 🚀 Como Executar a Pipeline Python e os Testes

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
python scripts/05_export_dashboard_data.py
pytest tests/ -v --tb=short
```

---

## 📚 Documentação Técnica e de Negócios

- [🖥️ Dashboard Executivo Interativo (`docs/index.html`)](docs/index.html)
- [📄 Relatório Estático Original Preservado (`docs/relatorio_estatico_original.html`)](docs/relatorio_estatico_original.html)
- [📐 Arquitetura do Sistema](docs/arquitetura.md)
- [📖 Dicionário de Dados (Star Schema & Views)](docs/dicionario_dados.md)
- [📊 Manual de KPIs e Semáforos](docs/kpis.md)
- [⚖️ Regras de Negócio e Contábeis](docs/regras_negocio.md)

---

*INTERFOOD FINANCIAL INTELLIGENCE v2.0.0 — Case Fictício de Controladoria, FP&A e Ciência de Dados (Dados 100% Sintéticos)*
