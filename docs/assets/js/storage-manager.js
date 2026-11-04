/**
 * INTERFOOD FINANCIAL INTELLIGENCE — Gerenciador de Persistência Local e Importação/Exportação
 * ============================================================================================
 * Gerencia armazenamento no localStorage do navegador, restauração da base sintética original,
 * exportação para CSV/JSON e importação validada de arquivos JSON/CSV.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        const engine = require("./financial-engine.js");
        module.exports = factory(engine);
    } else {
        root.InterfoodStorageManager = factory(root.InterfoodFinancialEngine);
    }
})(typeof self !== "undefined" ? self : this, function (Engine) {
    "use strict";

    const STORAGE_KEY = "interfood_controladoria_state_v1";
    const META_KEY = "interfood_controladoria_meta_v1";

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Valida um dataset completo (JSON) antes de substituir a base ativa.
     */
    function validateFullDataset(candidate) {
        const errors = [];
        if (!candidate || typeof candidate !== "object") {
            return { valid: false, errors: ["Arquivo JSON inválido: estrutura raiz não é um objeto."] };
        }
        if (!Array.isArray(candidate.vendas) || candidate.vendas.length === 0) {
            errors.push("A base deve conter a lista 'vendas' com pelo menos 1 registro.");
        }
        if (!Array.isArray(candidate.despesas) || candidate.despesas.length === 0) {
            errors.push("A base deve conter a lista 'despesas' com pelo menos 1 registro.");
        }
        if (!Array.isArray(candidate.orcamento) || candidate.orcamento.length === 0) {
            errors.push("A base deve conter a lista 'orcamento' com pelo menos 1 registro.");
        }
        if (!candidate.dimensoes || !Array.isArray(candidate.dimensoes.produtos)) {
            errors.push("A base deve conter 'dimensoes.produtos'.");
        }
        if (!candidate.parametros_metas || typeof candidate.parametros_metas !== "object") {
            errors.push("A base deve conter 'parametros_metas'.");
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        // Validar amostra/todos os registros de vendas, despesas e orçamento
        for (let i = 0; i < Math.min(candidate.vendas.length, 200); i++) {
            const check = Engine.validateRecord("vendas", candidate.vendas[i], candidate);
            if (!check.valid) {
                errors.push(`Erro em vendas[${i}] (ID ${candidate.vendas[i]?.id}): ${check.errors.join("; ")}`);
                if (errors.length >= 5) break;
            }
        }
        for (let i = 0; i < Math.min(candidate.despesas.length, 200); i++) {
            const check = Engine.validateRecord("despesas", candidate.despesas[i], candidate);
            if (!check.valid) {
                errors.push(`Erro em despesas[${i}] (ID ${candidate.despesas[i]?.id}): ${check.errors.join("; ")}`);
                if (errors.length >= 5) break;
            }
        }
        for (let i = 0; i < Math.min(candidate.orcamento.length, 200); i++) {
            const check = Engine.validateRecord("orcamento", candidate.orcamento[i], candidate);
            if (!check.valid) {
                errors.push(`Erro em orcamento[${i}] (ID ${candidate.orcamento[i]?.id}): ${check.errors.join("; ")}`);
                if (errors.length >= 5) break;
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Carrega a base ativa: prioriza o localStorage se existir e for válido;
     * caso contrário, retorna uma cópia limpa de initialData.
     */
    function loadDataset(initialData, storage = typeof localStorage !== "undefined" ? localStorage : null) {
        if (storage) {
            try {
                const raw = storage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const check = validateFullDataset(parsed);
                    if (check.valid) {
                        const metaRaw = storage.getItem(META_KEY);
                        const meta = metaRaw ? JSON.parse(metaRaw) : { savedAt: new Date().toISOString() };
                        return {
                            dataset: parsed,
                            isModifiedLocal: true,
                            savedAt: meta.savedAt,
                        };
                    }
                }
            } catch (err) {
                console.warn("[StorageManager] Falha ao ler localStorage, usando base original:", err);
            }
        }
        return {
            dataset: deepClone(initialData),
            isModifiedLocal: false,
            savedAt: null,
        };
    }

    /**
     * Salva o dataset atual no localStorage após validação.
     */
    function saveDataset(dataset, storage = typeof localStorage !== "undefined" ? localStorage : null) {
        const validation = validateFullDataset(dataset);
        if (!validation.valid) {
            return { ok: false, errors: validation.errors };
        }
        if (!storage) {
            return { ok: false, errors: ["localStorage não disponível neste ambiente."] };
        }
        try {
            const savedAt = new Date().toISOString();
            // Remover dre_referencia_mensal para otimizar espaço no localStorage se necessário
            const payload = deepClone(dataset);
            storage.setItem(STORAGE_KEY, JSON.stringify(payload));
            storage.setItem(META_KEY, JSON.stringify({ savedAt }));
            return { ok: true, savedAt };
        } catch (err) {
            return { ok: false, errors: [`Erro ao gravar no localStorage: ${err.message}`] };
        }
    }

    /**
     * Restaura a base original sintética removendo o estado customizado do localStorage.
     */
    function restoreOriginalDataset(initialData, storage = typeof localStorage !== "undefined" ? localStorage : null) {
        if (storage) {
            try {
                storage.removeItem(STORAGE_KEY);
                storage.removeItem(META_KEY);
            } catch (err) {
                console.warn("[StorageManager] Erro ao limpar localStorage:", err);
            }
        }
        return {
            dataset: deepClone(initialData),
            isModifiedLocal: false,
            savedAt: null,
        };
    }

    /**
     * Converte um array de objetos para string CSV (UTF-8 com BOM opcional para Excel pt-BR).
     */
    function arrayToCSV(rows, columns = null) {
        if (!Array.isArray(rows) || rows.length === 0) return "";
        const cols = columns || Object.keys(rows[0]);
        const escapeCell = (val) => {
            if (val === null || val === undefined) return "";
            const str = String(val);
            if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes(";")) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };
        const header = cols.map(escapeCell).join(",");
        const lines = rows.map((r) => cols.map((c) => escapeCell(r[c])).join(","));
        return [header, ...lines].join("\n");
    }

    /**
     * Faz o parse de uma linha CSV respeitando aspas.
     */
    function parseCSVLine(line, delimiter = ",") {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === delimiter) {
                    result.push(current.trim());
                    current = "";
                } else {
                    current += ch;
                }
            }
        }
        result.push(current.trim());
        return result;
    }

    /**
     * Faz o parse e validação de um arquivo CSV para atualizar uma tabela específica
     * ('vendas', 'despesas' ou 'orcamento').
     */
    function parseAndValidateCSV(csvText, entityType, currentDataset) {
        if (!csvText || typeof csvText !== "string") {
            return { valid: false, errors: ["Conteúdo CSV vazio ou inválido."] };
        }
        const cleanText = csvText.replace(/^\uFEFF/, "").trim();
        const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
            return { valid: false, errors: ["O arquivo CSV deve conter cabeçalho e pelo menos 1 linha de dados."] };
        }

        const firstLine = lines[0];
        const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
        const headers = parseCSVLine(firstLine, delimiter);

        const requiredColsMap = {
            vendas: ["id", "data", "produto_id", "cliente_id", "quantidade", "receita_bruta", "cmv_bruto"],
            despesas: ["id", "data", "departamento_id", "conta_id", "descricao", "valor", "tipo"],
            orcamento: ["id", "ano", "mes", "departamento_id", "conta_id", "descricao", "valor_orcado"],
        };

        const requiredCols = requiredColsMap[entityType];
        if (!requiredCols) {
            return { valid: false, errors: [`Tipo de entidade desconhecido para importação CSV: ${entityType}`] };
        }

        const missingCols = requiredCols.filter((c) => !headers.includes(c));
        if (missingCols.length > 0) {
            return {
                valid: false,
                errors: [`Colunas obrigatórias ausentes no CSV (${entityType}): ${missingCols.join(", ")}`],
            };
        }

        const prodLookup = {};
        const cliLookup = {};
        const depLookup = {};
        const contaLookup = {};
        if (currentDataset && currentDataset.dimensoes) {
            (currentDataset.dimensoes.produtos || []).forEach((p) => (prodLookup[p.produto_id] = p));
            (currentDataset.dimensoes.clientes || []).forEach((c) => (cliLookup[c.cliente_id] = c));
            (currentDataset.dimensoes.departamentos || []).forEach((d) => (depLookup[d.departamento_id] = d));
            (currentDataset.dimensoes.plano_contas || []).forEach((pc) => (contaLookup[pc.conta_id] = pc));
        }

        const parsedRows = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i], delimiter);
            const rawObj = {};
            headers.forEach((h, idx) => {
                rawObj[h] = values[idx] !== undefined ? values[idx] : "";
            });

            if (entityType === "vendas") {
                const dt = String(rawObj.data || "").trim();
                const [anoStr, mesStr] = dt.split("-");
                const prod = prodLookup[rawObj.produto_id] || {};
                const cli = cliLookup[rawObj.cliente_id] || {};
                const row = {
                    id: String(rawObj.id || `VND-IMP-${i}`),
                    data: dt,
                    ano: Number(rawObj.ano || anoStr),
                    mes: Number(rawObj.mes || mesStr),
                    produto_id: String(rawObj.produto_id),
                    sku: rawObj.sku || prod.sku || rawObj.produto_id,
                    produto_nome: rawObj.produto_nome || prod.nome || rawObj.produto_id,
                    categoria: rawObj.categoria || prod.categoria || "Laticínios",
                    cliente_id: String(rawObj.cliente_id),
                    cliente_nome: rawObj.cliente_nome || cli.razao_social || rawObj.cliente_id,
                    cliente_segmento: rawObj.cliente_segmento || cli.segmento || "Atacado",
                    estado: rawObj.estado || cli.estado || "SP",
                    regiao: rawObj.regiao || cli.regiao || "Sudeste",
                    pedidos_item: Math.max(1, Number(rawObj.pedidos_item || 1)),
                    quantidade: Number(rawObj.quantidade),
                    receita_bruta: Number(rawObj.receita_bruta),
                    descontos: Number(rawObj.descontos || 0),
                    devolucoes: Number(rawObj.devolucoes || 0),
                    cmv_bruto: Number(rawObj.cmv_bruto),
                    cmv_revertido: Number(rawObj.cmv_revertido || 0),
                };
                const check = Engine.validateRecord("vendas", row, currentDataset);
                if (!check.valid) {
                    errors.push(`Linha ${i + 1}: ${check.errors.join("; ")}`);
                } else {
                    parsedRows.push(row);
                }
            } else if (entityType === "despesas") {
                const dt = String(rawObj.data || "").trim();
                const [anoStr, mesStr] = dt.split("-");
                const dep = depLookup[rawObj.departamento_id] || {};
                const pc = contaLookup[rawObj.conta_id] || {};
                const row = {
                    id: String(rawObj.id || `DSP-IMP-${i}`),
                    data: dt,
                    ano: Number(rawObj.ano || anoStr),
                    mes: Number(rawObj.mes || mesStr),
                    departamento_id: String(rawObj.departamento_id),
                    departamento_nome: rawObj.departamento_nome || dep.nome || rawObj.departamento_id,
                    conta_id: String(rawObj.conta_id),
                    conta_nome: rawObj.conta_nome || pc.descricao || rawObj.conta_id,
                    descricao: String(rawObj.descricao),
                    valor: Number(rawObj.valor),
                    tipo: String(rawObj.tipo || "FIXA").toUpperCase() === "VARIAVEL" ? "VARIAVEL" : "FIXA",
                };
                const check = Engine.validateRecord("despesas", row, currentDataset);
                if (!check.valid) {
                    errors.push(`Linha ${i + 1}: ${check.errors.join("; ")}`);
                } else {
                    parsedRows.push(row);
                }
            } else if (entityType === "orcamento") {
                const ano = Number(rawObj.ano);
                const mes = Number(rawObj.mes);
                const dep = depLookup[rawObj.departamento_id] || {};
                const pc = contaLookup[rawObj.conta_id] || {};
                const row = {
                    id: String(rawObj.id || `ORC-IMP-${i}`),
                    data: `${ano}-${String(mes).padStart(2, "0")}-01`,
                    ano,
                    mes,
                    departamento_id: String(rawObj.departamento_id),
                    departamento_nome: rawObj.departamento_nome || dep.nome || rawObj.departamento_id,
                    conta_id: String(rawObj.conta_id),
                    conta_nome: rawObj.conta_nome || pc.descricao || rawObj.conta_id,
                    tipo_conta:
                        rawObj.tipo_conta ||
                        pc.tipo ||
                        (rawObj.conta_id === "PC002"
                            ? "RECEITA"
                            : rawObj.conta_id === "PC011"
                            ? "CUSTO"
                            : "DESPESA"),
                    descricao: String(rawObj.descricao || `Orçamento ${rawObj.conta_id}`),
                    valor_orcado: Number(rawObj.valor_orcado),
                };
                const check = Engine.validateRecord("orcamento", row, currentDataset);
                if (!check.valid) {
                    errors.push(`Linha ${i + 1}: ${check.errors.join("; ")}`);
                } else {
                    parsedRows.push(row);
                }
            }

            if (errors.length >= 10) break;
        }

        return {
            valid: errors.length === 0 && parsedRows.length > 0,
            rows: parsedRows,
            errors,
        };
    }

    return {
        STORAGE_KEY,
        META_KEY,
        deepClone,
        validateFullDataset,
        loadDataset,
        saveDataset,
        restoreOriginalDataset,
        arrayToCSV,
        parseAndValidateCSV,
    };
});
