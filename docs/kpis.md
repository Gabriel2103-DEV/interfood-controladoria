# Manual de KPIs e Indicadores de Controladoria — INTERFOOD FINANCIAL INTELLIGENCE

> **AVISO IMPORTANTE:** Todos os indicadores abaixo são calculados sobre **DADOS 100% SINTÉTICOS e fictícios**.

---

## 1. Indicadores de Rentabilidade (DRE)

### 1.1 Margem Bruta (%)
Mede a rentabilidade direta das vendas após impostos, devoluções, descontos comerciais e custo de aquisição das mercadorias vendidas (CMV líquido).

$$\text{Margem Bruta (\%)} = \frac{\text{Lucro Bruto}}{\text{Receita Líquida}} \times 100$$

- **Fonte SQL**: `vw_dre_mensal.margem_bruta_perc`
- **Semáforo de Controladoria**:
  - 🟢 **Verde (Meta)**: $\ge 28,00\%$
  - 🟡 **Amarelo (Atenção)**: entre $22,00\%$ e $27,99\%$
  - 🔴 **Vermelho (Crítico)**: $< 22,00\%$

---

### 1.2 Margem EBITDA (%)
Representa a geração operacional de caixa (LAJIDA — Lucro Antes de Juros, Impostos, Depreciação e Amortização) sobre a Receita Líquida.

$$\text{Margem EBITDA (\%)} = \frac{\text{Lucro Bruto} - \text{Despesas Operacionais (SG\&A)}}{\text{Receita Líquida}} \times 100$$

- **Fonte SQL**: `vw_dre_mensal.margem_ebitda_perc`
- **Semáforo de Controladoria**:
  - 🟢 **Verde (Meta)**: $\ge 10,00\%$
  - 🟡 **Amarelo (Atenção)**: entre $6,00\%$ e $9,99\%$
  - 🔴 **Vermelho (Crítico)**: $< 6,00\%$

---

### 1.3 Margem Líquida (%)
Mede a parcela da Receita Líquida que efetivamente se converte em lucro líquido final para os acionistas após D&A, resultado financeiro e provisão de IRPJ/CSLL.

$$\text{Margem Líquida (\%)} = \frac{\text{Lucro Líquido}}{\text{Receita Líquida}} \times 100$$

- **Fonte SQL**: `vw_dre_mensal.margem_liquida_perc`
- **Semáforo de Controladoria**:
  - 🟢 **Verde (Meta)**: $\ge 6,00\%$
  - 🟡 **Amarelo (Atenção)**: entre $3,00\%$ e $5,99\%$
  - 🔴 **Vermelho (Crítico)**: $< 3,00\%$

---

### 1.4 ROI Operacional Anualizado (%)
Mede o retorno gerado pelo Lucro Líquido sobre o Ativo Operacional Médio estimado da operação logística e de capital de giro.

$$\text{ROI (\%)} = \frac{\text{Lucro Líquido Anualizado}}{\text{Ativo Operacional Médio}} \times 100$$

---

## 2. Indicadores de Eficiência Comercial e Operacional

### 2.1 Ticket Médio por Pedido (R$)
Valor médio faturado por pedido emitido aos clientes B2B.

$$\text{Ticket Médio} = \frac{\text{Receita Bruta Total}}{\text{Quantidade Total de Pedidos}}$$

### 2.2 Receita por Executivo de Vendas (R$)
Produtividade média da carteira comercial por vendedor ativo.

$$\text{Receita por Vendedor} = \frac{\text{Receita Bruta Total}}{\text{Nº de Vendedores Ativos}}$$

### 2.3 Índice de Devolução sobre Vendas (%)
Percentual do faturamento bruto que retornou por avaria, divergência ou temperatura inadequada.

$$\text{Índice de Devolução (\%)} = \frac{\text{Valor Total de Devoluções}}{\text{Receita Bruta}} \times 100$$

- **Semáforo de Controladoria**:
  - 🟢 **Verde (Meta)**: $\le 3,50\%$
  - 🟡 **Amarelo (Atenção)**: entre $3,51\%$ e $5,00\%$
  - 🔴 **Vermelho (Crítico)**: $> 5,00\%$

### 2.4 Peso do CMV sobre a Receita Líquida (%)
Representa o comprometimento da receita líquida com o custo direto da mercadoria.

$$\text{CMV / RL (\%)} = \frac{\text{CMV Líquido}}{\text{Receita Líquida}} \times 100$$

- **Semáforo de Controladoria**:
  - 🟢 **Verde (Meta)**: $\le 72,00\%$
  - 🟡 **Amarelo (Atenção)**: entre $72,01\%$ e $78,00\%$
  - 🔴 **Vermelho (Crítico)**: $> 78,00\%$

---

## 3. Indicadores de Planejamento Orçamentário (Budget) e Crescimento

### 3.1 Variação Orçamentária (%) e Aderência (%)
Avaliam a precisão do planejamento financeiro anual e o controle matricial de receitas, custos e despesas.

$$\text{Variação Orçamentária (\%)} = \frac{\text{Realizado} - \text{Orçado}}{\text{Orçado}} \times 100$$

$$\text{Aderência Orçamentária (\%)} = \frac{\text{Realizado}}{\text{Orçado}} \times 100$$

- **Faixa de Conformidade**: Aderência entre $90,00\%$ e $110,00\%$.

### 3.2 Crescimento Anual Composto — YoY (%)
Compara a evolução anual do faturamento e do EBITDA entre exercícios consecutivos (`2023 vs 2022` e `2024 vs 2023`).

$$\text{YoY (\%)} = \frac{\text{Valor}_{\text{Ano } t} - \text{Valor}_{\text{Ano } t-1}}{\text{Valor}_{\text{Ano } t-1}} \times 100$$
