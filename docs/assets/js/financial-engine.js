/**
 * INTERFOOD FINANCIAL INTELLIGENCE — Motor Centralizado de Cálculos Financeiros
 * =============================================================================
 * ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS (Seed=42).
 * Camada única de regras contábeis, DRE, Margens, EBITDA, Budget x Actual,
 * Rentabilidade e Validação de Dados (zero fórmulas duplicadas).
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.InterfoodFinancialEngine = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    const MESES_NOMES = {
        1: { nome: "Janeiro", abrev: "Jan" },
        2: { nome: "Fevereiro", abrev: "Fev" },
        3: { nome: "Março", abrev: "Mar" },
        4: { nome: "Abril", abrev: "Abr" },
        5: { nome: "Maio", abrev: "Mai" },
        6: { nome: "Junho", abrev: "Jun" },
        7: { nome: "Julho", abrev: "Jul" },
        8: { nome: "Agosto", abrev: "Ago" },
        9: { nome: "Setembro", abrev: "Set" },
        10: { nome: "Outubro", abrev: "Out" },
        11: { nome: "Novembro", abrev: "Nov" },
        12: { nome: "Dezembro", abrev: "Dez" },
    };

    function round2(val) {
        const n = Number(val);
        if (!Number.isFinite(n)) return 0.0;
        return Math.round((n + Number.EPSILON) * 100) / 100;
    }

    function formatBRL(val, showSymbol = true) {
        const n = Number(val);
        if (!Number.isFinite(n)) return showSymbol ? "R$ 0,00" : "0,00";
        const neg = n < 0;
        const absVal = Math.abs(round2(n));
        const parts = absVal.toFixed(2).split(".");
        const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const decPart = parts[1];
        const prefix = showSymbol ? "R$ " : "";
        return (neg ? "-" : "") + prefix + intPart + "," + decPart;
    }

    function formatPct(val, decimals = 2) {
        const n = Number(val);
        if (!Number.isFinite(n)) return "0,00%";
        return n.toFixed(decimals).replace(".", ",") + "%";
    }

    function formatInt(val) {
        const n = Math.round(Number(val) || 0);
        return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function isValidISODate(dateStr) {
        if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return false;
        }
        const [y, m, d] = dateStr.split("-").map(Number);
        if (y < 2020 || y > 2030 || m < 1 || m > 12 || d < 1 || d > 31) return false;
        const dt = new Date(Date.UTC(y, m - 1, d));
        return (
            dt.getUTCFullYear() === y &&
            dt.getUTCMonth() === m - 1 &&
            dt.getUTCDate() === d
        );
    }

    /**
     * Valida um registro antes de inserção ou edição no módulo Gestão de Dados.
     */
    function validateRecord(entityType, record, dataset) {
        const errors = [];
        if (!record || typeof record !== "object") {
            return { valid: false, errors: ["Registro inválido ou vazio."] };
        }

        if (entityType === "vendas") {
            if (!isValidISODate(record.data)) {
                errors.push("Data inválida. Utilize o formato AAAA-MM-DD entre 2020 e 2030.");
            }
            const qtd = Number(record.quantidade);
            if (!Number.isFinite(qtd) || qtd <= 0) {
                errors.push("Quantidade deve ser um número maior que zero.");
            }
            const recBruta = Number(record.receita_bruta);
            if (!Number.isFinite(recBruta) || recBruta <= 0) {
                errors.push("Receita Bruta deve ser um valor numérico maior que zero.");
            }
            const desc = Number(record.descontos ?? 0);
            const dev = Number(record.devolucoes ?? 0);
            if (!Number.isFinite(desc) || desc < 0) {
                errors.push("Descontos não podem ser negativos.");
            }
            if (!Number.isFinite(dev) || dev < 0) {
                errors.push("Devoluções não podem ser negativas.");
            }
            if (Number.isFinite(recBruta) && desc + dev > recBruta) {
                errors.push("A soma de Descontos e Devoluções não pode superar a Receita Bruta.");
            }
            const cmvBruto = Number(record.cmv_bruto);
            const cmvRev = Number(record.cmv_revertido ?? 0);
            if (!Number.isFinite(cmvBruto) || cmvBruto < 0) {
                errors.push("CMV Bruto deve ser um valor numérico não negativo.");
            }
            if (!Number.isFinite(cmvRev) || cmvRev < 0) {
                errors.push("CMV Revertido não pode ser negativo.");
            }
            if (Number.isFinite(cmvBruto) && cmvRev > cmvBruto) {
                errors.push("CMV Revertido não pode superar o CMV Bruto.");
            }
            if (dataset && dataset.dimensoes) {
                const prodExists = dataset.dimensoes.produtos.some(
                    (p) => p.produto_id === record.produto_id
                );
                if (!prodExists) errors.push("Produto selecionado não existe no cadastro.");
                const cliExists = dataset.dimensoes.clientes.some(
                    (c) => c.cliente_id === record.cliente_id
                );
                if (!cliExists) errors.push("Cliente selecionado não existe no cadastro.");
            }
        } else if (entityType === "despesas") {
            if (!isValidISODate(record.data)) {
                errors.push("Data da despesa inválida. Utilize AAAA-MM-DD.");
            }
            if (!record.departamento_id) {
                errors.push("Departamento é obrigatório.");
            }
            if (!record.conta_id) {
                errors.push("Conta contábil de despesa é obrigatória.");
            }
            if (!record.descricao || String(record.descricao).trim().length < 3) {
                errors.push("Descrição da despesa deve ter pelo menos 3 caracteres.");
            }
            const val = Number(record.valor);
            if (!Number.isFinite(val) || val < 0) {
                errors.push("Valor da despesa deve ser um número maior ou igual a zero.");
            }
        } else if (entityType === "orcamento") {
            const ano = Number(record.ano);
            const mes = Number(record.mes);
            if (!Number.isInteger(ano) || ano < 2020 || ano > 2030) {
                errors.push("Ano do orçamento deve estar entre 2020 e 2030.");
            }
            if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
                errors.push("Mês do orçamento deve estar entre 1 e 12.");
            }
            if (!record.departamento_id) {
                errors.push("Departamento é obrigatório.");
            }
            if (!record.conta_id) {
                errors.push("Conta contábil do orçamento é obrigatória.");
            }
            const valOrc = Number(record.valor_orcado);
            if (!Number.isFinite(valOrc) || valOrc < 0) {
                errors.push("Valor Orçado deve ser um número maior ou igual a zero.");
            }
        } else if (entityType === "parametros_metas") {
            const imp = Number(record.aliquota_impostos_perc);
            const dep = Number(record.depreciacao_mensal);
            const ir = Number(record.aliquota_ir_csll_perc);
            if (!Number.isFinite(imp) || imp < 0 || imp > 60) {
                errors.push("Alíquota de impostos sobre vendas deve estar entre 0% e 60%.");
            }
            if (!Number.isFinite(dep) || dep < 0) {
                errors.push("Depreciação mensal deve ser maior ou igual a zero.");
            }
            if (!Number.isFinite(ir) || ir < 0 || ir > 60) {
                errors.push("Alíquota de IRPJ/CSLL deve estar entre 0% e 60%.");
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Normaliza o objeto de filtros.
     */
    function normalizeFilters(rawFilters = {}) {
        return {
            dataInicio: rawFilters.dataInicio || "2022-01-01",
            dataFim: rawFilters.dataFim || "2024-12-31",
            ano: rawFilters.ano && rawFilters.ano !== "TODOS" ? Number(rawFilters.ano) : "TODOS",
            mes: rawFilters.mes && rawFilters.mes !== "TODOS" ? Number(rawFilters.mes) : "TODOS",
            categoria: rawFilters.categoria || "TODAS",
            produtoId: rawFilters.produtoId || "TODOS",
            regiao: rawFilters.regiao || "TODAS",
            clienteId: rawFilters.clienteId || "TODOS",
            buscaTexto: (rawFilters.buscaTexto || "").trim().toLowerCase(),
        };
    }

    /**
     * Verifica se um registro de venda atende a todos os filtros ativos.
     */
    function matchesVendaFilter(v, f) {
        if (f.dataInicio && v.data < f.dataInicio) return false;
        if (f.dataFim && v.data > f.dataFim) return false;
        if (f.ano !== "TODOS" && Number(v.ano) !== f.ano) return false;
        if (f.mes !== "TODOS" && Number(v.mes) !== f.mes) return false;
        if (f.categoria !== "TODAS" && v.categoria !== f.categoria) return false;
        if (f.produtoId !== "TODOS" && v.produto_id !== f.produtoId) return false;
        if (f.regiao !== "TODAS" && v.regiao !== f.regiao) return false;
        if (f.clienteId !== "TODOS" && v.cliente_id !== f.clienteId) return false;
        return true;
    }

    /**
     * Verifica se um mês (ano, mes) está dentro dos filtros temporais.
     */
    function matchesPeriodFilter(ano, mes, f) {
        if (f.ano !== "TODOS" && Number(ano) !== f.ano) return false;
        if (f.mes !== "TODOS" && Number(mes) !== f.mes) return false;
        const ym = `${ano}-${String(mes).padStart(2, "0")}`;
        if (f.dataInicio) {
            const startYm = f.dataInicio.slice(0, 7);
            if (ym < startYm) return false;
        }
        if (f.dataFim) {
            const endYm = f.dataFim.slice(0, 7);
            if (ym > endYm) return false;
        }
        return true;
    }

    /**
     * Calcula uma linha de DRE mensal seguindo estritamente as regras contábeis do DuckDB (vw_dre_mensal).
     */
    function computeSingleMonthDRE(ano, mes, vendasMes, despesasMes, qtdPedidosMes, params, allocationFactor) {
        const aliqImp = Number(params.aliquota_impostos_perc ?? 12.0) / 100.0;
        const depBase = Number(params.depreciacao_mensal ?? 35000.0);
        const resFinPerc = Number(params.resultado_financeiro_perc ?? -0.5) / 100.0;
        const aliqIr = Number(params.aliquota_ir_csll_perc ?? 24.0) / 100.0;

        let receitaBruta = 0;
        let descontos = 0;
        let devolucoes = 0;
        let cmvBruto = 0;
        let cmvRevertido = 0;
        let quantidadeTotal = 0;

        for (let i = 0; i < vendasMes.length; i++) {
            const v = vendasMes[i];
            receitaBruta += Number(v.receita_bruta) || 0;
            descontos += Number(v.descontos) || 0;
            devolucoes += Number(v.devolucoes) || 0;
            cmvBruto += Number(v.cmv_bruto) || 0;
            cmvRevertido += Number(v.cmv_revertido) || 0;
            quantidadeTotal += Number(v.quantidade) || 0;
        }

        receitaBruta = round2(receitaBruta);
        descontos = round2(descontos);
        devolucoes = round2(devolucoes);
        cmvBruto = round2(cmvBruto);
        cmvRevertido = round2(cmvRevertido);

        const baseImposto = Math.max(0, receitaBruta - descontos - devolucoes);
        const impostosVendas = round2(baseImposto * aliqImp);
        const deducoesTotais = round2(descontos + devolucoes + impostosVendas);
        const receitaLiquida = round2(receitaBruta - deducoesTotais);
        const cmvLiquido = round2(cmvBruto - cmvRevertido);
        const lucroBruto = round2(receitaLiquida - cmvLiquido);
        const margemBrutaPerc = receitaLiquida !== 0 ? round2((lucroBruto / receitaLiquida) * 100) : 0.0;

        let despPessoal = 0;
        let despAluguel = 0;
        let despMarketing = 0;
        let despLogistica = 0;
        let despAdmin = 0;
        let despOutras = 0;

        for (let i = 0; i < despesasMes.length; i++) {
            const d = despesasMes[i];
            const valorAlocado = (Number(d.valor) || 0) * allocationFactor;
            if (d.conta_id === "PC021") despPessoal += valorAlocado;
            else if (d.conta_id === "PC022") despAluguel += valorAlocado;
            else if (d.conta_id === "PC023") despMarketing += valorAlocado;
            else if (d.conta_id === "PC024") despLogistica += valorAlocado;
            else if (d.conta_id === "PC025") despAdmin += valorAlocado;
            else despOutras += valorAlocado;
        }

        despPessoal = round2(despPessoal);
        despAluguel = round2(despAluguel);
        despMarketing = round2(despMarketing);
        despLogistica = round2(despLogistica);
        despAdmin = round2(despAdmin);
        despOutras = round2(despOutras);

        const despesasOperacionaisTotais = round2(
            despPessoal + despAluguel + despMarketing + despLogistica + despAdmin + despOutras
        );

        const ebitda = round2(lucroBruto - despesasOperacionaisTotais);
        const margemEbitdaPerc = receitaLiquida !== 0 ? round2((ebitda / receitaLiquida) * 100) : 0.0;
        const depreciacaoAmortizacao = round2(depBase * allocationFactor);
        const ebit = round2(ebitda - depreciacaoAmortizacao);
        const resultadoFinanceiro = round2(receitaLiquida * resFinPerc);
        const ebt = round2(ebit + resultadoFinanceiro);
        const irCsll = ebt > 0 ? round2(ebt * aliqIr) : 0.0;
        const lucroLiquido = round2(ebt - irCsll);
        const margemLiquidaPerc = receitaLiquida !== 0 ? round2((lucroLiquido / receitaLiquida) * 100) : 0.0;

        const mInfo = MESES_NOMES[mes] || { nome: `Mês ${mes}`, abrev: String(mes) };

        return {
            ano: Number(ano),
            mes: Number(mes),
            competencia: `${ano}-${String(mes).padStart(2, "0")}`,
            competenciaLabel: `${mInfo.abrev}/${String(ano).slice(2)}`,
            qtd_pedidos: Math.max(0, Math.round(qtdPedidosMes * allocationFactor)),
            quantidade_vendida: Math.round(quantidadeTotal),
            receita_bruta: receitaBruta,
            descontos_concedidos: descontos,
            devolucoes: devolucoes,
            impostos_vendas: impostosVendas,
            deducoes_totais: deducoesTotais,
            receita_liquida: receitaLiquida,
            cmv_bruto: cmvBruto,
            cmv_revertido: cmvRevertido,
            cmv_liquido: cmvLiquido,
            lucro_bruto: lucroBruto,
            margem_bruta_perc: margemBrutaPerc,
            despesas_pessoal: despPessoal,
            despesas_aluguel: despAluguel,
            despesas_marketing: despMarketing,
            despesas_logistica: despLogistica,
            despesas_administrativas: despAdmin,
            despesas_outras: despOutras,
            despesas_operacionais_totais: despesasOperacionaisTotais,
            ebitda: ebitda,
            margem_ebitda_perc: margemEbitdaPerc,
            depreciacao_amortizacao: depreciacaoAmortizacao,
            ebit: ebit,
            resultado_financeiro: resultadoFinanceiro,
            ebt: ebt,
            ir_csll: irCsll,
            lucro_liquido: lucroLiquido,
            margem_liquida_perc: margemLiquidaPerc,
            allocation_factor: allocationFactor,
        };
    }

    /**
     * Agrega uma lista de objetos DRE mensais em um único objeto DRE consolidado.
     */
    function aggregateDREList(dreList, label = "Consolidado") {
        const acc = {
            label,
            qtd_pedidos: 0,
            quantidade_vendida: 0,
            receita_bruta: 0,
            descontos_concedidos: 0,
            devolucoes: 0,
            impostos_vendas: 0,
            deducoes_totais: 0,
            receita_liquida: 0,
            cmv_bruto: 0,
            cmv_revertido: 0,
            cmv_liquido: 0,
            lucro_bruto: 0,
            despesas_pessoal: 0,
            despesas_aluguel: 0,
            despesas_marketing: 0,
            despesas_logistica: 0,
            despesas_administrativas: 0,
            despesas_outras: 0,
            despesas_operacionais_totais: 0,
            ebitda: 0,
            depreciacao_amortizacao: 0,
            ebit: 0,
            resultado_financeiro: 0,
            ebt: 0,
            ir_csll: 0,
            lucro_liquido: 0,
        };

        for (let i = 0; i < dreList.length; i++) {
            const d = dreList[i];
            acc.qtd_pedidos += d.qtd_pedidos;
            acc.quantidade_vendida += d.quantidade_vendida;
            acc.receita_bruta = round2(acc.receita_bruta + d.receita_bruta);
            acc.descontos_concedidos = round2(acc.descontos_concedidos + d.descontos_concedidos);
            acc.devolucoes = round2(acc.devolucoes + d.devolucoes);
            acc.impostos_vendas = round2(acc.impostos_vendas + d.impostos_vendas);
            acc.deducoes_totais = round2(acc.deducoes_totais + d.deducoes_totais);
            acc.receita_liquida = round2(acc.receita_liquida + d.receita_liquida);
            acc.cmv_bruto = round2(acc.cmv_bruto + d.cmv_bruto);
            acc.cmv_revertido = round2(acc.cmv_revertido + d.cmv_revertido);
            acc.cmv_liquido = round2(acc.cmv_liquido + d.cmv_liquido);
            acc.lucro_bruto = round2(acc.lucro_bruto + d.lucro_bruto);
            acc.despesas_pessoal = round2(acc.despesas_pessoal + d.despesas_pessoal);
            acc.despesas_aluguel = round2(acc.despesas_aluguel + d.despesas_aluguel);
            acc.despesas_marketing = round2(acc.despesas_marketing + d.despesas_marketing);
            acc.despesas_logistica = round2(acc.despesas_logistica + d.despesas_logistica);
            acc.despesas_administrativas = round2(acc.despesas_administrativas + d.despesas_administrativas);
            acc.despesas_outras = round2(acc.despesas_outras + d.despesas_outras);
            acc.despesas_operacionais_totais = round2(
                acc.despesas_operacionais_totais + d.despesas_operacionais_totais
            );
            acc.ebitda = round2(acc.ebitda + d.ebitda);
            acc.depreciacao_amortizacao = round2(acc.depreciacao_amortizacao + d.depreciacao_amortizacao);
            acc.ebit = round2(acc.ebit + d.ebit);
            acc.resultado_financeiro = round2(acc.resultado_financeiro + d.resultado_financeiro);
            acc.ebt = round2(acc.ebt + d.ebt);
            acc.ir_csll = round2(acc.ir_csll + d.ir_csll);
            acc.lucro_liquido = round2(acc.lucro_liquido + d.lucro_liquido);
        }

        const rl = acc.receita_liquida;
        const rb = acc.receita_bruta;

        acc.margem_bruta_perc = rl !== 0 ? round2((acc.lucro_bruto / rl) * 100) : 0.0;
        acc.margem_ebitda_perc = rl !== 0 ? round2((acc.ebitda / rl) * 100) : 0.0;
        acc.margem_liquida_perc = rl !== 0 ? round2((acc.lucro_liquido / rl) * 100) : 0.0;
        acc.cmv_sobre_receita_perc = rl !== 0 ? round2((acc.cmv_liquido / rl) * 100) : 0.0;
        acc.despesas_sobre_receita_perc = rl !== 0 ? round2((acc.despesas_operacionais_totais / rl) * 100) : 0.0;
        acc.indice_devolucao_perc = rb !== 0 ? round2((acc.devolucoes / rb) * 100) : 0.0;
        acc.ticket_medio = acc.qtd_pedidos > 0 ? round2(rb / acc.qtd_pedidos) : 0.0;

        return acc;
    }

    /**
     * Função principal do motor: calcula todo o estado analítico do dashboard
     * respeitando simultaneamente todos os filtros ativos.
     */
    function computeDashboardState(dataset, rawFilters = {}) {
        const filters = normalizeFilters(rawFilters);
        const params = dataset.parametros_metas || {};
        const vendasAll = dataset.vendas || [];
        const despesasAll = dataset.despesas || [];
        const orcamentoAll = dataset.orcamento || [];
        const pedidosMesList = dataset.pedidos_por_mes || [];

        const pedidosMesMap = {};
        for (let i = 0; i < pedidosMesList.length; i++) {
            const pm = pedidosMesList[i];
            pedidosMesMap[`${pm.ano}-${pm.mes}`] = Number(pm.qtd_pedidos_mes) || 0;
        }

        // Verifica se há filtro de segmento comercial ou recorte de dias dentro do mês
        const hasCommercialSegmentFilter =
            filters.categoria !== "TODAS" ||
            filters.produtoId !== "TODOS" ||
            filters.regiao !== "TODAS" ||
            filters.clienteId !== "TODOS";

        // Filtrar vendas
        const vendasFiltradas = vendasAll.filter((v) => matchesVendaFilter(v, filters));

        // Agrupar vendas totais por (ano, mes) e vendas filtradas por (ano, mes)
        const recTotalPorMes = {};
        const vendasFiltradasPorMes = {};
        const mesesAtivosSet = new Set();

        for (let i = 0; i < vendasAll.length; i++) {
            const v = vendasAll[i];
            const key = `${v.ano}-${v.mes}`;
            recTotalPorMes[key] = (recTotalPorMes[key] || 0) + (Number(v.receita_bruta) || 0);
            if (matchesPeriodFilter(v.ano, v.mes, filters)) {
                mesesAtivosSet.add(key);
            }
        }

        for (let i = 0; i < vendasFiltradas.length; i++) {
            const v = vendasFiltradas[i];
            const key = `${v.ano}-${v.mes}`;
            if (!vendasFiltradasPorMes[key]) vendasFiltradasPorMes[key] = [];
            vendasFiltradasPorMes[key].push(v);
            mesesAtivosSet.add(key);
        }

        // Agrupar despesas por (ano, mes)
        const despesasPorMes = {};
        for (let i = 0; i < despesasAll.length; i++) {
            const d = despesasAll[i];
            if (filters.dataInicio && d.data && d.data < filters.dataInicio.slice(0, 8) + "01") continue;
            if (filters.dataFim && d.data && d.data > filters.dataFim.slice(0, 8) + "31") continue;
            const key = `${d.ano}-${d.mes}`;
            if (!despesasPorMes[key]) despesasPorMes[key] = [];
            despesasPorMes[key].push(d);
        }

        // Ordenar competências ativas cronologicamente
        const competenciasOrdenadas = Array.from(mesesAtivosSet)
            .map((k) => {
                const [a, m] = k.split("-").map(Number);
                return { ano: a, mes: m, key: k };
            })
            .filter((item) => matchesPeriodFilter(item.ano, item.mes, filters))
            .sort((a, b) => (a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes));

        const dreMensal = [];
        const allocationByMonthKey = {};

        for (let i = 0; i < competenciasOrdenadas.length; i++) {
            const { ano, mes, key } = competenciasOrdenadas[i];
            const vMes = vendasFiltradasPorMes[key] || [];
            const dMes = despesasPorMes[key] || [];
            const recTotalMes = recTotalPorMes[key] || 0;
            let recFiltradaMes = 0;
            for (let j = 0; j < vMes.length; j++) {
                recFiltradaMes += Number(vMes[j].receita_bruta) || 0;
            }

            let alloc = 1.0;
            if (hasCommercialSegmentFilter) {
                alloc = recTotalMes > 0 ? recFiltradaMes / recTotalMes : 0.0;
            } else if (
                (filters.dataInicio && filters.dataInicio > `${ano}-${String(mes).padStart(2, "0")}-01`) ||
                (filters.dataFim && filters.dataFim < `${ano}-${String(mes).padStart(2, "0")}-28`)
            ) {
                alloc = recTotalMes > 0 ? recFiltradaMes / recTotalMes : 0.0;
            }
            allocationByMonthKey[key] = alloc;

            const qtdPedMes = pedidosMesMap[key] || Math.round(vMes.length * 6);
            const dreRow = computeSingleMonthDRE(ano, mes, vMes, dMes, qtdPedMes, params, alloc);
            if (dreRow.receita_bruta > 0 || !hasCommercialSegmentFilter) {
                dreMensal.push(dreRow);
            }
        }

        // Calcular crescimento MoM na série mensal
        for (let i = 0; i < dreMensal.length; i++) {
            if (i === 0) {
                dreMensal[i].crescimento_mom_perc = 0.0;
            } else {
                const prev = dreMensal[i - 1].receita_liquida;
                const curr = dreMensal[i].receita_liquida;
                dreMensal[i].crescimento_mom_perc = prev > 0 ? round2(((curr - prev) / prev) * 100) : 0.0;
            }
        }

        // DRE Anual (agrupada por ano)
        const anosMap = {};
        for (let i = 0; i < dreMensal.length; i++) {
            const row = dreMensal[i];
            if (!anosMap[row.ano]) anosMap[row.ano] = [];
            anosMap[row.ano].push(row);
        }
        const dreAnual = Object.keys(anosMap)
            .map(Number)
            .sort((a, b) => a - b)
            .map((ano) => {
                const agg = aggregateDREList(anosMap[ano], String(ano));
                agg.ano = ano;
                return agg;
            });

        // Consolidado Global dos filtros ativos
        const kpisConsolidados = aggregateDREList(dreMensal, "Período Filtrado");

        // Budget x Actual (Orçado vs Realizado)
        let orcReceita = 0;
        let orcCmv = 0;
        let orcDespesas = 0;
        const budgetPorMes = {};
        const budgetPorConta = {};

        for (let i = 0; i < orcamentoAll.length; i++) {
            const o = orcamentoAll[i];
            const key = `${o.ano}-${o.mes}`;
            if (allocationByMonthKey[key] === undefined) continue;
            const alloc = allocationByMonthKey[key];
            const valOrc = round2((Number(o.valor_orcado) || 0) * alloc);

            if (!budgetPorMes[key]) {
                budgetPorMes[key] = {
                    ano: o.ano,
                    mes: o.mes,
                    competencia: `${o.ano}-${String(o.mes).padStart(2, "0")}`,
                    receita_orcada: 0,
                    cmv_orcado: 0,
                    despesa_orcada: 0,
                };
            }

            if (o.conta_id === "PC002" || o.tipo_conta === "RECEITA") {
                orcReceita = round2(orcReceita + valOrc);
                budgetPorMes[key].receita_orcada = round2(budgetPorMes[key].receita_orcada + valOrc);
            } else if (o.conta_id === "PC011" || o.tipo_conta === "CUSTO") {
                orcCmv = round2(orcCmv + valOrc);
                budgetPorMes[key].cmv_orcado = round2(budgetPorMes[key].cmv_orcado + valOrc);
            } else {
                orcDespesas = round2(orcDespesas + valOrc);
                budgetPorMes[key].despesa_orcada = round2(budgetPorMes[key].despesa_orcada + valOrc);
            }

            const cKey = `${o.departamento_id}|${o.conta_id}`;
            if (!budgetPorConta[cKey]) {
                budgetPorConta[cKey] = {
                    departamento_id: o.departamento_id,
                    departamento_nome: o.departamento_nome || o.departamento_id,
                    conta_id: o.conta_id,
                    conta_nome: o.conta_nome || o.descricao,
                    tipo_conta:
                        o.conta_id === "PC002"
                            ? "RECEITA"
                            : o.conta_id === "PC011"
                            ? "CUSTO"
                            : "DESPESA",
                    valor_orcado: 0,
                    valor_realizado: 0,
                };
            }
            budgetPorConta[cKey].valor_orcado = round2(budgetPorConta[cKey].valor_orcado + valOrc);
        }

        // Preencher realizado em budgetPorConta
        if (budgetPorConta["DEP001|PC002"]) {
            budgetPorConta["DEP001|PC002"].valor_realizado = kpisConsolidados.receita_bruta;
        }
        if (budgetPorConta["DEP004|PC011"]) {
            budgetPorConta["DEP004|PC011"].valor_realizado = kpisConsolidados.cmv_bruto;
        }
        for (let i = 0; i < despesasAll.length; i++) {
            const d = despesasAll[i];
            const key = `${d.ano}-${d.mes}`;
            if (allocationByMonthKey[key] === undefined) continue;
            const alloc = allocationByMonthKey[key];
            const cKey = `${d.departamento_id}|${d.conta_id}`;
            if (budgetPorConta[cKey]) {
                budgetPorConta[cKey].valor_realizado = round2(
                    budgetPorConta[cKey].valor_realizado + (Number(d.valor) || 0) * alloc
                );
            }
        }

        const tabelaOrcadoRealizado = Object.values(budgetPorConta).map((row) => {
            const varAbs = round2(row.valor_realizado - row.valor_orcado);
            const varPerc = row.valor_orcado !== 0 ? round2((varAbs / row.valor_orcado) * 100) : 0.0;
            const aderencia =
                row.valor_orcado !== 0 ? round2((row.valor_realizado / row.valor_orcado) * 100) : 0.0;
            return {
                ...row,
                variacao_absoluta: varAbs,
                variacao_perc: varPerc,
                aderencia_perc: aderencia,
            };
        });

        // Série mensal de Budget x Actual
        const serieBudgetMensal = dreMensal.map((d) => {
            const b = budgetPorMes[`${d.ano}-${d.mes}`] || {
                receita_orcada: 0,
                cmv_orcado: 0,
                despesa_orcada: 0,
            };
            const ebitdaOrcado = round2(
                b.receita_orcada * (1 - (Number(params.aliquota_impostos_perc ?? 12) + 3.8) / 100) -
                    b.cmv_orcado -
                    b.despesa_orcada
            );
            return {
                competencia: d.competencia,
                competenciaLabel: d.competenciaLabel,
                ano: d.ano,
                mes: d.mes,
                receita_orcada: b.receita_orcada,
                receita_realizada: d.receita_bruta,
                variacao_receita_abs: round2(d.receita_bruta - b.receita_orcada),
                variacao_receita_perc:
                    b.receita_orcada > 0
                        ? round2(((d.receita_bruta - b.receita_orcada) / b.receita_orcada) * 100)
                        : 0.0,
                cmv_orcado: b.cmv_orcado,
                cmv_realizado: d.cmv_bruto,
                despesa_orcada: b.despesa_orcada,
                despesa_realizada: d.despesas_operacionais_totais,
                ebitda_orcado: ebitdaOrcado,
                ebitda_realizado: d.ebitda,
            };
        });

        const budgetSummary = {
            receita: {
                orcado: orcReceita,
                realizado: kpisConsolidados.receita_bruta,
                variacao_abs: round2(kpisConsolidados.receita_bruta - orcReceita),
                variacao_perc:
                    orcReceita > 0
                        ? round2(((kpisConsolidados.receita_bruta - orcReceita) / orcReceita) * 100)
                        : 0.0,
                aderencia_perc:
                    orcReceita > 0 ? round2((kpisConsolidados.receita_bruta / orcReceita) * 100) : 0.0,
            },
            cmv: {
                orcado: orcCmv,
                realizado: kpisConsolidados.cmv_bruto,
                variacao_abs: round2(kpisConsolidados.cmv_bruto - orcCmv),
                variacao_perc:
                    orcCmv > 0 ? round2(((kpisConsolidados.cmv_bruto - orcCmv) / orcCmv) * 100) : 0.0,
                aderencia_perc:
                    orcCmv > 0 ? round2((kpisConsolidados.cmv_bruto / orcCmv) * 100) : 0.0,
            },
            despesas: {
                orcado: orcDespesas,
                realizado: kpisConsolidados.despesas_operacionais_totais,
                variacao_abs: round2(kpisConsolidados.despesas_operacionais_totais - orcDespesas),
                variacao_perc:
                    orcDespesas > 0
                        ? round2(
                              ((kpisConsolidados.despesas_operacionais_totais - orcDespesas) / orcDespesas) * 100
                          )
                        : 0.0,
                aderencia_perc:
                    orcDespesas > 0
                        ? round2((kpisConsolidados.despesas_operacionais_totais / orcDespesas) * 100)
                        : 0.0,
            },
        };

        // Rentabilidade por Categoria e por Produto
        const catMap = {};
        const prodMap = {};
        const regiaoMap = {};
        const clienteMap = {};

        for (let i = 0; i < vendasFiltradas.length; i++) {
            const v = vendasFiltradas[i];
            const rb = Number(v.receita_bruta) || 0;
            const desc = Number(v.descontos) || 0;
            const dev = Number(v.devolucoes) || 0;
            const rlComercial = round2(rb - desc);
            const cmvB = Number(v.cmv_bruto) || 0;
            const cmvR = Number(v.cmv_revertido) || 0;
            const margemComercial = round2(rlComercial - cmvB);
            const qtd = Number(v.quantidade) || 0;
            const peds = Number(v.pedidos_item) || 1;

            // Categoria
            if (!catMap[v.categoria]) {
                catMap[v.categoria] = {
                    categoria: v.categoria,
                    quantidade: 0,
                    receita_bruta: 0,
                    descontos: 0,
                    devolucoes: 0,
                    receita_liquida_comercial: 0,
                    cmv_bruto: 0,
                    cmv_liquido: 0,
                    margem_bruta_valor: 0,
                };
            }
            const cObj = catMap[v.categoria];
            cObj.quantidade += qtd;
            cObj.receita_bruta = round2(cObj.receita_bruta + rb);
            cObj.descontos = round2(cObj.descontos + desc);
            cObj.devolucoes = round2(cObj.devolucoes + dev);
            cObj.receita_liquida_comercial = round2(cObj.receita_liquida_comercial + rlComercial);
            cObj.cmv_bruto = round2(cObj.cmv_bruto + cmvB);
            cObj.cmv_liquido = round2(cObj.cmv_liquido + (cmvB - cmvR));
            cObj.margem_bruta_valor = round2(cObj.margem_bruta_valor + margemComercial);

            // Produto
            if (!prodMap[v.produto_id]) {
                prodMap[v.produto_id] = {
                    produto_id: v.produto_id,
                    sku: v.sku || v.produto_id,
                    produto_nome: v.produto_nome || v.produto_id,
                    categoria: v.categoria,
                    quantidade_vendida: 0,
                    receita_bruta: 0,
                    descontos: 0,
                    devolucoes: 0,
                    receita_liquida_comercial: 0,
                    cmv_total: 0,
                    margem_bruta_valor: 0,
                };
            }
            const pObj = prodMap[v.produto_id];
            pObj.quantidade_vendida += qtd;
            pObj.receita_bruta = round2(pObj.receita_bruta + rb);
            pObj.descontos = round2(pObj.descontos + desc);
            pObj.devolucoes = round2(pObj.devolucoes + dev);
            pObj.receita_liquida_comercial = round2(pObj.receita_liquida_comercial + rlComercial);
            pObj.cmv_total = round2(pObj.cmv_total + cmvB);
            pObj.margem_bruta_valor = round2(pObj.margem_bruta_valor + margemComercial);

            // Região
            const reg = v.regiao || "Sudeste";
            if (!regiaoMap[reg]) {
                regiaoMap[reg] = {
                    regiao: reg,
                    quantidade: 0,
                    receita_bruta: 0,
                    receita_liquida_comercial: 0,
                    cmv_total: 0,
                    margem_bruta_valor: 0,
                };
            }
            const rObj = regiaoMap[reg];
            rObj.quantidade += qtd;
            rObj.receita_bruta = round2(rObj.receita_bruta + rb);
            rObj.receita_liquida_comercial = round2(rObj.receita_liquida_comercial + rlComercial);
            rObj.cmv_total = round2(rObj.cmv_total + cmvB);
            rObj.margem_bruta_valor = round2(rObj.margem_bruta_valor + margemComercial);

            // Cliente
            if (!clienteMap[v.cliente_id]) {
                clienteMap[v.cliente_id] = {
                    cliente_id: v.cliente_id,
                    razao_social: v.cliente_nome || v.cliente_id,
                    segmento: v.cliente_segmento || "-",
                    estado: v.estado || "-",
                    regiao: reg,
                    total_pedidos: 0,
                    quantidade_vendida: 0,
                    receita_bruta: 0,
                    receita_liquida_comercial: 0,
                    cmv_total: 0,
                    margem_bruta_valor: 0,
                };
            }
            const clObj = clienteMap[v.cliente_id];
            clObj.total_pedidos += peds;
            clObj.quantidade_vendida += qtd;
            clObj.receita_bruta = round2(clObj.receita_bruta + rb);
            clObj.receita_liquida_comercial = round2(clObj.receita_liquida_comercial + rlComercial);
            clObj.cmv_total = round2(clObj.cmv_total + cmvB);
            clObj.margem_bruta_valor = round2(clObj.margem_bruta_valor + margemComercial);
        }

        const totalRecFiltrada = kpisConsolidados.receita_bruta || 1;

        const rentabilidadePorCategoria = Object.values(catMap)
            .map((c) => ({
                ...c,
                margem_bruta_perc:
                    c.receita_liquida_comercial > 0
                        ? round2((c.margem_bruta_valor / c.receita_liquida_comercial) * 100)
                        : 0.0,
                share_receita_perc: round2((c.receita_bruta / totalRecFiltrada) * 100),
            }))
            .sort((a, b) => b.receita_bruta - a.receita_bruta);

        const rentabilidadePorProduto = Object.values(prodMap)
            .map((p) => ({
                ...p,
                margem_bruta_perc:
                    p.receita_liquida_comercial > 0
                        ? round2((p.margem_bruta_valor / p.receita_liquida_comercial) * 100)
                        : 0.0,
                share_receita_perc: round2((p.receita_bruta / totalRecFiltrada) * 100),
            }))
            .sort((a, b) => b.margem_bruta_valor - a.margem_bruta_valor);

        const rentabilidadePorRegiao = Object.values(regiaoMap)
            .map((r) => ({
                ...r,
                margem_bruta_perc:
                    r.receita_liquida_comercial > 0
                        ? round2((r.margem_bruta_valor / r.receita_liquida_comercial) * 100)
                        : 0.0,
                share_receita_perc: round2((r.receita_bruta / totalRecFiltrada) * 100),
            }))
            .sort((a, b) => b.receita_bruta - a.receita_bruta);

        const rentabilidadePorCliente = Object.values(clienteMap)
            .map((c) => ({
                ...c,
                margem_bruta_perc:
                    c.receita_liquida_comercial > 0
                        ? round2((c.margem_bruta_valor / c.receita_liquida_comercial) * 100)
                        : 0.0,
                ticket_medio: c.total_pedidos > 0 ? round2(c.receita_bruta / c.total_pedidos) : 0.0,
                share_receita_perc: round2((c.receita_bruta / totalRecFiltrada) * 100),
            }))
            .sort((a, b) => b.receita_bruta - a.receita_bruta);

        // Semáforo de Metas Dinâmico
        const metaMB = Number(params.meta_margem_bruta_perc ?? 28.0);
        const metaEBITDA = Number(params.meta_margem_ebitda_perc ?? 10.0);
        const metaML = Number(params.meta_margem_liquida_perc ?? 6.0);
        const metaDev = Number(params.meta_indice_devolucao_max_perc ?? 3.5);
        const metaCMV = Number(params.meta_cmv_sobre_rl_max_perc ?? 72.0);

        const semaforo = [
            {
                id: "margem_bruta",
                kpi: "Margem Bruta (%)",
                valorNum: kpisConsolidados.margem_bruta_perc,
                valorFormatado: formatPct(kpisConsolidados.margem_bruta_perc),
                metaFormatada: `>= ${formatPct(metaMB)}`,
                status:
                    kpisConsolidados.margem_bruta_perc >= metaMB
                        ? "VERDE"
                        : kpisConsolidados.margem_bruta_perc >= metaMB - 5
                        ? "AMARELO"
                        : "VERMELHO",
            },
            {
                id: "margem_ebitda",
                kpi: "Margem EBITDA (%)",
                valorNum: kpisConsolidados.margem_ebitda_perc,
                valorFormatado: formatPct(kpisConsolidados.margem_ebitda_perc),
                metaFormatada: `>= ${formatPct(metaEBITDA)}`,
                status:
                    kpisConsolidados.margem_ebitda_perc >= metaEBITDA
                        ? "VERDE"
                        : kpisConsolidados.margem_ebitda_perc >= metaEBITDA - 4
                        ? "AMARELO"
                        : "VERMELHO",
            },
            {
                id: "margem_liquida",
                kpi: "Margem Líquida (%)",
                valorNum: kpisConsolidados.margem_liquida_perc,
                valorFormatado: formatPct(kpisConsolidados.margem_liquida_perc),
                metaFormatada: `>= ${formatPct(metaML)}`,
                status:
                    kpisConsolidados.margem_liquida_perc >= metaML
                        ? "VERDE"
                        : kpisConsolidados.margem_liquida_perc >= metaML - 3
                        ? "AMARELO"
                        : "VERMELHO",
            },
            {
                id: "indice_devolucao",
                kpi: "Índice de Devolução (%)",
                valorNum: kpisConsolidados.indice_devolucao_perc,
                valorFormatado: formatPct(kpisConsolidados.indice_devolucao_perc),
                metaFormatada: `<= ${formatPct(metaDev)}`,
                status:
                    kpisConsolidados.indice_devolucao_perc <= metaDev
                        ? "VERDE"
                        : kpisConsolidados.indice_devolucao_perc <= metaDev + 1.5
                        ? "AMARELO"
                        : "VERMELHO",
            },
            {
                id: "cmv_sobre_rl",
                kpi: "CMV / Receita Líquida (%)",
                valorNum: kpisConsolidados.cmv_sobre_receita_perc,
                valorFormatado: formatPct(kpisConsolidados.cmv_sobre_receita_perc),
                metaFormatada: `<= ${formatPct(metaCMV)}`,
                status:
                    kpisConsolidados.cmv_sobre_receita_perc <= metaCMV
                        ? "VERDE"
                        : kpisConsolidados.cmv_sobre_receita_perc <= metaCMV + 5
                        ? "AMARELO"
                        : "VERMELHO",
            },
        ];

        return {
            filters,
            hasCommercialSegmentFilter,
            kpis: kpisConsolidados,
            budgetSummary,
            dreMensal,
            dreAnual,
            serieBudgetMensal,
            tabelaOrcadoRealizado,
            rentabilidadePorCategoria,
            rentabilidadePorProduto,
            rentabilidadePorRegiao,
            rentabilidadePorCliente,
            semaforo,
            totalRegistrosFiltrados: vendasFiltradas.length,
        };
    }

    return {
        MESES_NOMES,
        round2,
        formatBRL,
        formatPct,
        formatInt,
        isValidISODate,
        validateRecord,
        normalizeFilters,
        computeDashboardState,
    };
});
