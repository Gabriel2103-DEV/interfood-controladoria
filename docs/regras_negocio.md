# Regras de Negócio e Contábeis — INTERFOOD FINANCIAL INTELLIGENCE

> **AVISO IMPORTANTE:** Todas as regras abaixo regem o ambiente simulado (**DADOS 100% SINTÉTICOS e fictícios**) desenvolvido para o case de Controladoria.

---

## 1. Sazonalidade e Crescimento Orgânico (36 Meses)

A operação simula 36 meses contínuos (`Janeiro/2022` a `Dezembro/2024`) com dois vetores combinados:

### 1.1 Curva de Sazonalidade Mensal
O setor de distribuição de alimentos e bebidas apresenta forte concentração no segundo semestre (festas juninas, Black Friday e Natal) e retração no início do ano:
- **Janeiro (`0,72`) e Fevereiro (`0,75`)**: Retração pós-festas de fim de ano.
- **Março (`0,88`), Abril (`0,90`) e Maio (`0,95`)**: Recuperação gradual do food service e varejo.
- **Junho (`1,15`)**: Pico intermediário impulsionado por festas de inverno e São João.
- **Julho (`0,92`), Agosto (`0,93`) e Setembro (`0,97`)**: Estabilidade operacional do 3º trimestre.
- **Outubro (`1,02`), Novembro (`1,18`) e Dezembro (`1,35`)**: Abastecimento de fim de ano e pico máximo no Natal/Réveillon.

### 1.2 Vetor de Expansão Anual
- **2022**: Ano-base (`1,00x`).
- **2023**: Expansão orgânica de **`+12,0%`** sobre 2022 (`1,12x`).
- **2024**: Expansão adicional de **`+15,0%`** sobre 2023 (`1,288x` acumulado sobre 2022).

---

## 2. Regras de Precificação, Descontos e CMV

1. **Formação de Preço e Custo por Item**:
   - Cada um dos 80 produtos possui um `custo_unitario` de referência e um `preco_venda` de tabela com margens brutas de lista entre **35% e 42%**.
   - Em cada pedido, pequenas oscilações de negociação ($\pm 3\%$ no preço e $\pm 2\%$ no custo de reposição) refletem condições reais de mercado.
2. **Política de Descontos Comerciais**:
   - Os pedidos podem receber descontos comerciais escalonados de `0%`, `2%`, `3%` ou `5%` conforme volume e negociação.
3. **Consistência Estrita Pedido–Itens**:
   - O valor bruto, desconto, valor líquido, CMV e lucro bruto do cabeçalho do pedido (`fato_pedido`) correspondem **exatamente** à soma algébrica dos seus respectivos itens (`fato_item_pedido`).

---

## 3. Logística Reversa e Devoluções

1. **Taxa de Ocorrência**: Cerca de `4,5%` dos pedidos sofrem devolução parcial de 1 SKU (representando entre `1,0%` e `3,5%` da Receita Bruta).
2. **Prazo de Ocorrência**: As devoluções ocorrem entre `3` e `18` dias corridos após o faturamento original, respeitando a data limite do dataset (`2024-12-31`).
3. **Impacto Contábil Duplo**:
   - Reduz a Receita Bruta através da conta redutora `1.2.1 - Devoluções de Vendas` (`PC004`).
   - Reverte proporcionalmente o Custo da Mercadoria Vendida (`cmv_revertido`), reintegrando a mercadoria ao kardex de estoque (`fato_estoque` com `tipo_mov = 'DEVOLUCAO'`).

---

## 4. Estrutura da DRE Gerencial

A Demonstração do Resultado do Exercício (`vw_dre_mensal`) obedece rigorosamente às seguintes identidades contábeis:

1. **Receita Bruta de Vendas**: Soma de `valor_bruto` dos pedidos faturados no mês.
2. **(-) Deduções da Receita Bruta**:
   - Descontos Comerciais Concedidos (`fato_pedido.valor_desconto`)
   - Devoluções de Vendas (`fato_devolucao.valor_devolucao`)
   - Impostos sobre Vendas (alíquota média efetiva de **12,0%** de ICMS/PIS/COFINS sobre a receita líquida de descontos e devoluções).
3. **(=) Receita Líquida de Vendas**: $\text{Receita Bruta} - \text{Deduções Totais}$.
4. **(-) CMV Líquido**: $\text{CMV Bruto dos Pedidos} - \text{CMV Revertido em Devoluções}$.
5. **(=) Lucro Bruto Operacional**: $\text{Receita Líquida} - \text{CMV Líquido}$.
6. **(-) Despesas Operacionais (SG&A)**: Soma das despesas fixas e variáveis dos 7 departamentos (`Pessoal`, `Aluguel`, `Marketing`, `Logística`, `Administrativas` e `Outras`).
7. **(=) EBITDA (LAJIDA)**: $\text{Lucro Bruto} - \text{Despesas Operacionais Totais}$.
8. **(-) Depreciação e Amortização (D&A)**: Quota mensal linear de `R$ 35.000,00` referente à frota própria refrigerada e câmaras frias.
9. **(=) EBIT (Lucro Operacional)**: $\text{EBITDA} - \text{D\&A}$.
10. **(+/-) Resultado Financeiro Líquido**: Despesa financeira líquida equivalente a `-0,5%` da Receita Líquida (custo de capital de giro e antecipação de recebíveis).
11. **(=) EBT (LAIR)**: $\text{EBIT} + \text{Resultado Financeiro}$.
12. **(-) Provisão para IRPJ e CSLL**: Alíquota efetiva combinada de **24,0%** quando $\text{EBT} > 0$.
13. **(=) Lucro Líquido do Exercício**: $\text{EBT} - \text{IRPJ/CSLL}$.

---

## 5. Política de Estoque e Orçamento Matricial

- **Controle de Estoque (`fato_estoque`)**: Todo SKU inicia com saldo positivo em `01/01/2022`. Compras mensais (`ENTRADA`) são dimensionadas para suprir a demanda do mês e preservar o `estoque_minimo`, impedindo saldos físicos ou financeiros negativos.
- **Orçamento Matricial (`fato_orcamento`)**: Elaborado para todos os 36 meses cobrindo os 7 departamentos corporativos e as rubricas de Receita Bruta (`PC002`), CMV (`PC011`) e Despesas (`PC021` a `PC026`).
