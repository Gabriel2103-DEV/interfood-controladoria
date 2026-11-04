/**
 * INTERFOOD FINANCIAL INTELLIGENCE — Controlador Principal da Aplicação (SPA)
 * ===========================================================================
 * Gerencia estado em memória, filtros dinâmicos simultâneos, renderização de
 * KPIs, gráficos SVG, DRE Gerencial, tabelas de rentabilidade, módulo de
 * Gestão de Dados (CRUD + validação + localStorage + CSV/JSON Import/Export)
 * e Modo Apresentação Executiva (Boardroom Mode).
 */
(function () {
    "use strict";

    const Engine = window.InterfoodFinancialEngine;
    const Storage = window.InterfoodStorageManager;
    const Charts = window.InterfoodCharts;

    // Estado global da aplicação
    const AppState = {
        dataset: null,
        isModified: false,
        lastSavedAt: null,
        editCount: 0,
        computed: null,
        activeModule: "executivo", // executivo | dre | rentabilidade | gestao
        dreViewMode: "anual", // anual | mensal
        rentabilidadeTab: "categorias", // categorias | produtos | regioes | clientes
        gestaoTab: "vendas", // vendas | despesas | orcamento | parametros
        gestaoSearch: "",
        gestaoPage: 1,
        gestaoPageSize: 25,
        prodSearch: "",
        prodSort: "margem_bruta_valor",
        cliSearch: "",
        presentationActive: false,
        presentationSlide: 1,
        totalSlides: 5,
        filters: {
            dataInicio: "2022-01-01",
            dataFim: "2024-12-31",
            ano: "TODOS",
            mes: "TODOS",
            categoria: "TODAS",
            produtoId: "TODOS",
            regiao: "TODAS",
            clienteId: "TODOS",
        },
    };

    // =========================================================================
    // 1. UTILITÁRIOS DE UI (TOASTS E MODAL DE CONFIRMAÇÃO)
    // =========================================================================
    function showToast(type, title, message, durationMs = 4200) {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const icons = {
            success: "✓",
            error: "✕",
            warning: "⚠",
            info: "ℹ",
        };

        const toast = document.createElement("div");
        toast.className = `if-toast if-toast-${type || "info"}`;
        toast.innerHTML = `
            <div class="if-toast-icon">${icons[type] || "ℹ"}</div>
            <div class="if-toast-content">
                <div class="if-toast-title">${escapeHtml(title)}</div>
                <div class="if-toast-msg">${escapeHtml(message)}</div>
            </div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(20px)";
            toast.style.transition = "all 0.25s ease";
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 260);
        }, durationMs);
    }

    function showConfirmModal({ title, message, confirmLabel = "Confirmar", danger = true, onConfirm }) {
        const backdrop = document.getElementById("confirmModalBackdrop");
        const titleEl = document.getElementById("confirmModalTitle");
        const bodyEl = document.getElementById("confirmModalBody");
        const btnConfirm = document.getElementById("btnModalConfirm");
        const btnCancel = document.getElementById("btnModalCancel");
        const btnClose = document.getElementById("btnModalClose");

        if (!backdrop || !titleEl || !bodyEl || !btnConfirm) {
            if (window.confirm(`${title}\n\n${message}`)) {
                onConfirm();
            }
            return;
        }

        titleEl.textContent = title;
        bodyEl.innerHTML = `<p style="margin:0;color:#334155;font-size:0.9rem;line-height:1.55;">${escapeHtml(
            message
        )}</p>`;
        btnConfirm.textContent = confirmLabel;
        btnConfirm.className = danger ? "if-btn if-btn-danger" : "if-btn if-btn-primary";

        const close = () => {
            backdrop.classList.remove("active");
        };

        btnConfirm.onclick = () => {
            close();
            if (typeof onConfirm === "function") onConfirm();
        };
        if (btnCancel) btnCancel.onclick = close;
        if (btnClose) btnClose.onclick = close;

        backdrop.classList.add("active");
    }

    function escapeHtml(str) {
        return String(str ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // =========================================================================
    // 2. INICIALIZAÇÃO E CARREGAMENTO DE DADOS
    // =========================================================================
    function initApp() {
        if (!window.INTERFOOD_INITIAL_DATA) {
            showToast(
                "error",
                "Erro ao carregar base inicial",
                "Objeto INTERFOOD_INITIAL_DATA não encontrado em assets/data/interfood_data.js."
            );
            return;
        }

        const loaded = Storage.loadDataset(window.INTERFOOD_INITIAL_DATA);
        AppState.dataset = loaded.dataset;
        AppState.isModified = loaded.isModified;
        AppState.lastSavedAt = loaded.lastSavedAt;
        AppState.editCount = loaded.editCount || 0;

        populateFilterOptions();
        bindFilterEvents();
        bindNavigationEvents();
        bindGestaoEvents();
        bindPresentationEvents();

        recalculateAndRenderAll();
    }

    // =========================================================================
    // 3. FILTROS DINÂMICOS SIMULTÂNEOS
    // =========================================================================
    function populateFilterOptions() {
        const dims = (AppState.dataset && AppState.dataset.dimensoes) || {};

        // Anos
        const selAno = document.getElementById("filterAno");
        if (selAno) {
            const anos = dims.anos || [2022, 2023, 2024];
            selAno.innerHTML =
                `<option value="TODOS">Todos os Anos (2022–2024)</option>` +
                anos.map((a) => `<option value="${a}">${a}</option>`).join("");
            selAno.value = AppState.filters.ano;
        }

        // Meses
        const selMes = document.getElementById("filterMes");
        if (selMes) {
            const mesesNomes = Engine.MESES_NOMES;
            let html = `<option value="TODOS">Todos os Meses (Jan–Dez)</option>`;
            for (let m = 1; m <= 12; m++) {
                const mLabel = mesesNomes[m] && mesesNomes[m].nome ? mesesNomes[m].nome : String(m);
                html += `<option value="${m}">${String(m).padStart(2, "0")} - ${mLabel}</option>`;
            }
            selMes.innerHTML = html;
            selMes.value = AppState.filters.mes;
        }

        // Categorias
        const selCat = document.getElementById("filterCategoria");
        if (selCat) {
            const cats = dims.categorias || [];
            selCat.innerHTML =
                `<option value="TODAS">Todas as Categorias (${cats.length})</option>` +
                cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
            selCat.value = AppState.filters.categoria;
        }

        // Regiões
        const selReg = document.getElementById("filterRegiao");
        if (selReg) {
            const regs = dims.regioes || [];
            selReg.innerHTML =
                `<option value="TODAS">Todas as Regiões (${regs.length})</option>` +
                regs.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join("");
            selReg.value = AppState.filters.regiao;
        }

        populateDependentDropdowns();
    }

    function populateDependentDropdowns() {
        const dims = (AppState.dataset && AppState.dataset.dimensoes) || {};
        const catFilter = AppState.filters.categoria;
        const regFilter = AppState.filters.regiao;

        // Produtos (filtrados pela categoria se selecionada)
        const selProd = document.getElementById("filterProduto");
        if (selProd) {
            const allProds = dims.produtos || [];
            const prods =
                catFilter && catFilter !== "TODAS"
                    ? allProds.filter((p) => p.categoria === catFilter)
                    : allProds;

            const currentVal = AppState.filters.produtoId;
            const stillExists = prods.some((p) => p.produto_id === currentVal);
            if (!stillExists) AppState.filters.produtoId = "TODOS";

            selProd.innerHTML =
                `<option value="TODOS">Todos os Produtos (${prods.length} SKUs)</option>` +
                prods
                    .map(
                        (p) =>
                            `<option value="${escapeHtml(p.produto_id)}">${escapeHtml(p.produto_id)} — ${escapeHtml(
                                p.nome
                            )}</option>`
                    )
                    .join("");
            selProd.value = AppState.filters.produtoId;
        }

        // Clientes (filtrados pela região se selecionada)
        const selCli = document.getElementById("filterCliente");
        if (selCli) {
            const allClis = dims.clientes || [];
            const clis =
                regFilter && regFilter !== "TODAS"
                    ? allClis.filter((c) => c.regiao === regFilter)
                    : allClis;

            const currentVal = AppState.filters.clienteId;
            const stillExists = clis.some((c) => c.cliente_id === currentVal);
            if (!stillExists) AppState.filters.clienteId = "TODOS";

            selCli.innerHTML =
                `<option value="TODOS">Todos os Clientes (${clis.length})</option>` +
                clis
                    .map(
                        (c) =>
                            `<option value="${escapeHtml(c.cliente_id)}">${escapeHtml(
                                c.cliente_id
                            )} — ${escapeHtml(c.razao_social)} (${escapeHtml(c.estado)})</option>`
                    )
                    .join("");
            selCli.value = AppState.filters.clienteId;
        }
    }

    function bindFilterEvents() {
        const elInicio = document.getElementById("filterDataInicio");
        const elFim = document.getElementById("filterDataFim");
        const elAno = document.getElementById("filterAno");
        const elMes = document.getElementById("filterMes");
        const elCat = document.getElementById("filterCategoria");
        const elProd = document.getElementById("filterProduto");
        const elReg = document.getElementById("filterRegiao");
        const elCli = document.getElementById("filterCliente");
        const btnReset = document.getElementById("btnResetFilters");

        const onFilterChange = (source) => {
            if (elInicio) AppState.filters.dataInicio = elInicio.value || "2022-01-01";
            if (elFim) AppState.filters.dataFim = elFim.value || "2024-12-31";
            if (elAno) AppState.filters.ano = elAno.value;
            if (elMes) AppState.filters.mes = elMes.value;
            if (elCat) AppState.filters.categoria = elCat.value;
            if (elReg) AppState.filters.regiao = elReg.value;

            if (source === "categoria" || source === "regiao") {
                populateDependentDropdowns();
            } else {
                if (elProd) AppState.filters.produtoId = elProd.value;
                if (elCli) AppState.filters.clienteId = elCli.value;
            }

            AppState.gestaoPage = 1;
            recalculateAndRenderAll();
        };

        if (elInicio) elInicio.addEventListener("change", () => onFilterChange("dataInicio"));
        if (elFim) elFim.addEventListener("change", () => onFilterChange("dataFim"));
        if (elAno) elAno.addEventListener("change", () => onFilterChange("ano"));
        if (elMes) elMes.addEventListener("change", () => onFilterChange("mes"));
        if (elCat) elCat.addEventListener("change", () => onFilterChange("categoria"));
        if (elProd) elProd.addEventListener("change", () => onFilterChange("produto"));
        if (elReg) elReg.addEventListener("change", () => onFilterChange("regiao"));
        if (elCli) elCli.addEventListener("change", () => onFilterChange("cliente"));

        if (btnReset) {
            btnReset.addEventListener("click", () => {
                AppState.filters = {
                    dataInicio: "2022-01-01",
                    dataFim: "2024-12-31",
                    ano: "TODOS",
                    mes: "TODOS",
                    categoria: "TODAS",
                    produtoId: "TODOS",
                    regiao: "TODAS",
                    clienteId: "TODOS",
                };
                if (elInicio) elInicio.value = "2022-01-01";
                if (elFim) elFim.value = "2024-12-31";
                if (elAno) elAno.value = "TODOS";
                if (elMes) elMes.value = "TODOS";
                if (elCat) elCat.value = "TODAS";
                if (elReg) elReg.value = "TODAS";
                populateDependentDropdowns();
                AppState.gestaoPage = 1;
                recalculateAndRenderAll();
                showToast("info", "Filtros Restaurados", "Exibindo o horizonte completo (Jan/2022 a Dez/2024).");
            });
        }
    }

    // =========================================================================
    // 4. NAVEGAÇÃO ENTRE MÓDULOS
    // =========================================================================
    function bindNavigationEvents() {
        const navTabs = document.querySelectorAll("[data-module-tab]");
        navTabs.forEach((btn) => {
            btn.addEventListener("click", () => {
                const mod = btn.getAttribute("data-module-tab");
                switchModule(mod);
            });
        });

        // Sub-toggle DRE (Anual vs Mensal)
        const dreModeBtns = document.querySelectorAll("[data-dre-mode]");
        dreModeBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                AppState.dreViewMode = btn.getAttribute("data-dre-mode");
                dreModeBtns.forEach((b) => b.classList.toggle("active", b === btn));
                renderDREModule();
            });
        });

        // Sub-tabs Rentabilidade
        const rentBtns = document.querySelectorAll("[data-rent-tab]");
        rentBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                AppState.rentabilidadeTab = btn.getAttribute("data-rent-tab");
                rentBtns.forEach((b) => b.classList.toggle("active", b === btn));
                renderRentabilidadeModule();
            });
        });

        // Busca e ordenação de Produtos/Clientes
        const inputProdSearch = document.getElementById("inputProdSearch");
        if (inputProdSearch) {
            inputProdSearch.addEventListener("input", (e) => {
                AppState.prodSearch = e.target.value.trim().toLowerCase();
                renderRentabilidadeModule();
            });
        }
        const selectProdSort = document.getElementById("selectProdSort");
        if (selectProdSort) {
            selectProdSort.addEventListener("change", (e) => {
                AppState.prodSort = e.target.value;
                renderRentabilidadeModule();
            });
        }
        const inputCliSearch = document.getElementById("inputCliSearch");
        if (inputCliSearch) {
            inputCliSearch.addEventListener("input", (e) => {
                AppState.cliSearch = e.target.value.trim().toLowerCase();
                renderRentabilidadeModule();
            });
        }
    }

    function switchModule(moduleName) {
        AppState.activeModule = moduleName;
        document.querySelectorAll("[data-module-tab]").forEach((btn) => {
            btn.classList.toggle("active", btn.getAttribute("data-module-tab") === moduleName);
        });
        document.querySelectorAll(".if-module-panel").forEach((panel) => {
            panel.classList.toggle("active", panel.id === `mod-${moduleName}`);
        });

        // Re-renderizar gráficos se voltou para o executivo
        if (moduleName === "executivo") {
            renderExecutiveCharts();
        } else if (moduleName === "dre") {
            renderDREModule();
        } else if (moduleName === "rentabilidade") {
            renderRentabilidadeModule();
        } else if (moduleName === "gestao") {
            renderGestaoModule();
        }
    }

    // =========================================================================
    // 5. MOTOR DE RECÁLCULO CENTRAL E RENDERIZAÇÃO GLOBAL
    // =========================================================================
    function recalculateAndRenderAll() {
        AppState.computed = Engine.computeDashboardState(AppState.dataset, AppState.filters);

        updateStorageStatusBadge();
        updateFilterStatusBanner();
        renderExecutiveKPIs();
        renderExecutiveCharts();
        renderSemaforoTable();
        renderDREModule();
        renderRentabilidadeModule();
        renderGestaoModule();

        if (AppState.presentationActive) {
            renderPresentationSlide();
        }
    }

    function updateStorageStatusBadge() {
        const badge = document.getElementById("storageStatusBadge");
        const countEl = document.getElementById("headerDatasetCounts");
        if (badge) {
            if (AppState.isModified) {
                const dtStr = AppState.lastSavedAt
                    ? new Date(AppState.lastSavedAt).toLocaleString("pt-BR")
                    : "Sessão Atual";
                badge.className = "if-badge-storage modified";
                badge.innerHTML = `● Base Editada Localmente (${AppState.editCount} alt. | Salvo: ${dtStr})`;
            } else {
                badge.className = "if-badge-storage";
                badge.innerHTML = `✓ Base Original Oficial (Seed=42 | DuckDB)`;
            }
        }
        if (countEl && AppState.dataset) {
            const vLen = (AppState.dataset.vendas || []).length;
            const dLen = (AppState.dataset.despesas || []).length;
            const oLen = (AppState.dataset.orcamento || []).length;
            countEl.textContent = `${Engine.formatInt(vLen)} reg. vendas | ${Engine.formatInt(
                dLen
            )} despesas | ${Engine.formatInt(oLen)} orçamento`;
        }
    }

    function updateFilterStatusBanner() {
        const elSummary = document.getElementById("filterSummaryText");
        if (!elSummary || !AppState.computed) return;

        const f = AppState.computed.filters;
        const parts = [];
        if (f.ano !== "TODOS") parts.push(`Ano: ${f.ano}`);
        if (f.mes !== "TODOS") {
            const mObj = Engine.MESES_NOMES[Number(f.mes)];
            parts.push(`Mês: ${(mObj && mObj.nome) || f.mes}`);
        }
        if (f.categoria !== "TODAS") parts.push(`Categoria: ${f.categoria}`);
        if (f.produtoId !== "TODOS") parts.push(`Produto: ${f.produtoId}`);
        if (f.regiao !== "TODAS") parts.push(`Região: ${f.regiao}`);
        if (f.clienteId !== "TODOS") parts.push(`Cliente: ${f.clienteId}`);
        if (f.dataInicio !== "2022-01-01" || f.dataFim !== "2024-12-31") {
            parts.push(`Período: ${f.dataInicio} a ${f.dataFim}`);
        }

        const mesesCount = AppState.computed.dreMensal.length;
        const regCount = AppState.computed.totalRegistrosFiltrados;
        const rateioNote = AppState.computed.hasCommercialSegmentFilter
            ? " (Despesas SG&A e Orçamento alocados proporcionalmente ao share de receita do filtro comercial)"
            : "";

        if (parts.length === 0) {
            elSummary.innerHTML = `Exibindo <strong>Base Completa (36 meses)</strong> • <strong>${Engine.formatInt(
                regCount
            )}</strong> agregações comerciais analisadas.`;
        } else {
            elSummary.innerHTML = `Filtros ativos: <strong>${escapeHtml(
                parts.join(" | ")
            )}</strong> • <strong>${mesesCount}</strong> competência(s) • <strong>${Engine.formatInt(
                regCount
            )}</strong> registros comerciais${escapeHtml(rateioNote)}.`;
        }
    }

    // =========================================================================
    // 6. MÓDULO 1: VISÃO EXECUTIVA (CARDS KPI + GRÁFICOS + SEMÁFORO)
    // =========================================================================
    function renderExecutiveKPIs() {
        const grid = document.getElementById("kpiCardsGrid");
        if (!grid || !AppState.computed) return;

        const k = AppState.computed.kpis;
        const b = AppState.computed.budgetSummary;

        const recVarPositive = b.receita.variacao_abs >= 0;
        const despVarPositive = b.despesas.variacao_abs <= 0; // Despesa menor que orçado é favorável

        grid.innerHTML = `
            <!-- 1. Receita Bruta -->
            <div class="if-kpi-card">
                <div class="if-kpi-label">
                    <span>Receita Bruta</span>
                    <span class="if-kpi-pill ${recVarPositive ? "positive" : "negative"}">
                        ${b.receita.variacao_perc >= 0 ? "+" : ""}${Engine.formatPct(b.receita.variacao_perc)} vs Budget
                    </span>
                </div>
                <div class="if-kpi-value" id="kpiReceitaBruta">${Engine.formatBRL(k.receita_bruta)}</div>
                <div class="if-kpi-sub">
                    <span>Orçado: <strong>${Engine.formatBRL(b.receita.orcado)}</strong></span>
                    <span>Δ: <strong>${Engine.formatBRL(b.receita.variacao_abs)}</strong></span>
                </div>
            </div>

            <!-- 2. Receita Líquida -->
            <div class="if-kpi-card">
                <div class="if-kpi-label">
                    <span>Receita Líquida</span>
                    <span class="if-kpi-pill neutral">
                        ${k.receita_bruta > 0 ? Engine.formatPct((k.receita_liquida / k.receita_bruta) * 100) : "0,00%"} da RB
                    </span>
                </div>
                <div class="if-kpi-value" id="kpiReceitaLiquida">${Engine.formatBRL(k.receita_liquida)}</div>
                <div class="if-kpi-sub">
                    <span>Deduções: <strong>${Engine.formatBRL(k.deducoes_totais)}</strong></span>
                    <span>Impostos: <strong>${Engine.formatBRL(k.impostos_vendas)}</strong></span>
                </div>
            </div>

            <!-- 3. Lucro Bruto & Margem Bruta -->
            <div class="if-kpi-card accent-green">
                <div class="if-kpi-label">
                    <span>Lucro Bruto & Margem</span>
                    <span class="if-kpi-pill ${k.margem_bruta_perc >= 28 ? "positive" : "warning"}">
                        MB: ${Engine.formatPct(k.margem_bruta_perc)}
                    </span>
                </div>
                <div class="if-kpi-value" id="kpiLucroBruto">${Engine.formatBRL(k.lucro_bruto)}</div>
                <div class="if-kpi-sub">
                    <span>CMV Líquido: <strong>${Engine.formatBRL(k.cmv_liquido)}</strong></span>
                    <span>CMV/RL: <strong>${Engine.formatPct(k.cmv_sobre_receita_perc)}</strong></span>
                </div>
            </div>

            <!-- 4. EBITDA & Margem EBITDA -->
            <div class="if-kpi-card accent-green">
                <div class="if-kpi-label">
                    <span>EBITDA Operacional</span>
                    <span class="if-kpi-pill ${k.margem_ebitda_perc >= 10 ? "positive" : "warning"}">
                        Mg: ${Engine.formatPct(k.margem_ebitda_perc)}
                    </span>
                </div>
                <div class="if-kpi-value" id="kpiEbitda">${Engine.formatBRL(k.ebitda)}</div>
                <div class="if-kpi-sub">
                    <span>EBIT: <strong>${Engine.formatBRL(k.ebit)}</strong></span>
                    <span>Meta Mg: <strong>>= 10,00%</strong></span>
                </div>
            </div>

            <!-- 5. Custos e Despesas Operacionais (SG&A) -->
            <div class="if-kpi-card ${despVarPositive ? "" : "accent-amber"}">
                <div class="if-kpi-label">
                    <span>Despesas SG&A</span>
                    <span class="if-kpi-pill ${despVarPositive ? "positive" : "warning"}">
                        ${b.despesas.variacao_perc >= 0 ? "+" : ""}${Engine.formatPct(b.despesas.variacao_perc)} vs Budget
                    </span>
                </div>
                <div class="if-kpi-value" id="kpiDespesasOperacionais">${Engine.formatBRL(k.despesas_operacionais_totais)}</div>
                <div class="if-kpi-sub">
                    <span>Pessoal: <strong>${Engine.formatBRL(k.despesas_pessoal)}</strong></span>
                    <span>Logística: <strong>${Engine.formatBRL(k.despesas_logistica)}</strong></span>
                </div>
            </div>

            <!-- 6. Lucro Líquido & Margem Líquida -->
            <div class="if-kpi-card ${k.lucro_liquido >= 0 ? "accent-green" : "accent-red"}">
                <div class="if-kpi-label">
                    <span>Lucro Líquido</span>
                    <span class="if-kpi-pill ${k.margem_liquida_perc >= 6 ? "positive" : "warning"}">
                        ML: ${Engine.formatPct(k.margem_liquida_perc)}
                    </span>
                </div>
                <div class="if-kpi-value" id="kpiLucroLiquido">${Engine.formatBRL(k.lucro_liquido)}</div>
                <div class="if-kpi-sub">
                    <span>LAIR: <strong>${Engine.formatBRL(k.ebt)}</strong></span>
                    <span>IRPJ/CSLL: <strong>${Engine.formatBRL(k.ir_csll)}</strong></span>
                </div>
            </div>

            <!-- 7. Budget x Actual (Aderência Receita) -->
            <div class="if-kpi-card">
                <div class="if-kpi-label">
                    <span>Aderência Budget Receita</span>
                    <span class="if-kpi-pill ${b.receita.aderencia_perc >= 98 ? "positive" : "warning"}">
                        ${Engine.formatPct(b.receita.aderencia_perc)} Atingido
                    </span>
                </div>
                <div class="if-kpi-value" id="kpiBudgetAderencia">${Engine.formatPct(b.receita.aderencia_perc)}</div>
                <div class="if-kpi-sub">
                    <span>Var. Abs: <strong>${Engine.formatBRL(b.receita.variacao_abs)}</strong></span>
                    <span>CMV Ader.: <strong>${Engine.formatPct(b.cmv.aderencia_perc)}</strong></span>
                </div>
            </div>

            <!-- 8. Eficiência Comercial & Devoluções -->
            <div class="if-kpi-card">
                <div class="if-kpi-label">
                    <span>Ticket Médio & Qualidade</span>
                    <span class="if-kpi-pill ${k.indice_devolucao_perc <= 3.5 ? "positive" : "negative"}">
                        Dev: ${Engine.formatPct(k.indice_devolucao_perc)}
                    </span>
                </div>
                <div class="if-kpi-value" id="kpiTicketMedio">${Engine.formatBRL(k.ticket_medio)}</div>
                <div class="if-kpi-sub">
                    <span>Volume: <strong>${Engine.formatInt(k.quantidade_vendida)} un.</strong></span>
                    <span>Devoluções: <strong>${Engine.formatBRL(k.devolucoes)}</strong></span>
                </div>
            </div>
        `;
    }

    function renderExecutiveCharts() {
        if (!AppState.computed) return;
        const c = AppState.computed;

        Charts.renderEvolutionChart(document.getElementById("chartEvolution"), c.dreMensal);
        Charts.renderDREWaterfallChart(document.getElementById("chartWaterfall"), c.kpis);
        Charts.renderBudgetComparisonChart(document.getElementById("chartBudget"), c.budgetSummary);
        Charts.renderCategoryProfitabilityChart(
            document.getElementById("chartCategory"),
            c.rentabilidadePorCategoria
        );
    }

    function renderSemaforoTable() {
        const tbody = document.getElementById("tbodySemaforo");
        if (!tbody || !AppState.computed) return;

        tbody.innerHTML = AppState.computed.semaforo
            .map(
                (s) => `
            <tr>
                <td><strong>${escapeHtml(s.kpi)}</strong></td>
                <td class="num"><strong>${escapeHtml(s.valorFormatado)}</strong></td>
                <td class="num">${escapeHtml(s.metaFormatada)}</td>
                <td>
                    <span class="if-status-badge status-${escapeHtml(s.status)}">
                        ● ${escapeHtml(s.status)}
                    </span>
                </td>
            </tr>
        `
            )
            .join("");
    }

    // =========================================================================
    // 7. MÓDULO 2: DRE GERENCIAL COMPLETA & BUDGET X ACTUAL
    // =========================================================================
    function renderDREModule() {
        if (!AppState.computed) return;
        renderDRETable();
        renderBudgetDetailTable();
    }

    function renderDRETable() {
        const thead = document.getElementById("theadDRE");
        const tbody = document.getElementById("tbodyDRE");
        if (!thead || !tbody || !AppState.computed) return;

        const c = AppState.computed;
        const cols =
            AppState.dreViewMode === "mensal"
                ? [...c.dreMensal, c.kpis]
                : [...c.dreAnual, c.kpis];

        thead.innerHTML = `
            <tr>
                <th style="min-width:250px;">Rubrica Contábil / Demonstrativo de Resultados</th>
                ${cols
                    .map((col, idx) => {
                        const isTotal = idx === cols.length - 1;
                        const label = col.competenciaLabel || col.label || col.competencia || col.ano;
                        return `<th class="num" style="${
                            isTotal ? "background:#00A86B;color:#FFF;" : ""
                        }">${escapeHtml(label)}</th>`;
                    })
                    .join("")}
                <th class="num">AV (%)</th>
            </tr>
        `;

        const lines = [
            { key: "receita_bruta", label: "(+) RECEITA OPERACIONAL BRUTA", cls: "dre-row-subtotal", fmt: "brl" },
            { key: "devolucoes", label: "(-) Devoluções de Vendas", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "descontos_concedidos", label: "(-) Descontos Comerciais Concedidos", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "impostos_vendas", label: "(-) Impostos Incidentes s/ Vendas (ICMS/PIS/COFINS)", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "deducoes_totais", label: "(=) Total de Deduções da Receita", cls: "", fmt: "brl", sign: -1 },
            { key: "receita_liquida", label: "(=) RECEITA OPERACIONAL LÍQUIDA", cls: "dre-row-subtotal", fmt: "brl" },
            { key: "cmv_liquido", label: "(-) Custo das Mercadorias Vendidas Líquido (CMV)", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "lucro_bruto", label: "(=) LUCRO BRUTO COMERCIAL", cls: "dre-row-subtotal", fmt: "brl" },
            { key: "margem_bruta_perc", label: "(%) Margem Bruta s/ Receita Líquida", cls: "", fmt: "pct" },
            { key: "despesas_pessoal", label: "(-) Despesas com Pessoal e Encargos", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "despesas_logistica", label: "(-) Despesas com Logística e Fretes", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "despesas_aluguel", label: "(-) Despesas com Aluguel, CD e Utilidades", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "despesas_administrativas", label: "(-) Despesas Administrativas e TI", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "despesas_marketing", label: "(-) Despesas Comerciais e Marketing", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "despesas_outras", label: "(-) Outras Despesas Operacionais", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "despesas_operacionais_totais", label: "(=) Total de Despesas Operacionais (SG&A)", cls: "", fmt: "brl", sign: -1 },
            { key: "ebitda", label: "(=) EBITDA (LAJIDA OPERACIONAL)", cls: "dre-row-highlight", fmt: "brl" },
            { key: "margem_ebitda_perc", label: "(%) Margem EBITDA s/ Receita Líquida", cls: "", fmt: "pct" },
            { key: "depreciacao_amortizacao", label: "(-) Depreciação e Amortização", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "ebit", label: "(=) EBIT (Lucro Operacional Antes do Resultado Financeiro)", cls: "dre-row-subtotal", fmt: "brl" },
            { key: "resultado_financeiro", label: "(+/-) Resultado Financeiro Líquido", cls: "dre-row-deduction", fmt: "brl" },
            { key: "ebt", label: "(=) LAIR / EBT (Lucro Antes do IRPJ e CSLL)", cls: "dre-row-subtotal", fmt: "brl" },
            { key: "ir_csll", label: "(-) Provisão para IRPJ e CSLL", cls: "dre-row-deduction", fmt: "brl", sign: -1 },
            { key: "lucro_liquido", label: "(=) LUCRO LÍQUIDO DO EXERCÍCIO", cls: "dre-row-total", fmt: "brl" },
            { key: "margem_liquida_perc", label: "(%) Margem Líquida Final", cls: "", fmt: "pct" },
        ];

        const rlConsolidada = c.kpis.receita_liquida || 1;

        tbody.innerHTML = lines
            .map((line) => {
                const cells = cols
                    .map((col) => {
                        const rawVal = Number(col[line.key] || 0);
                        const displayVal = line.sign === -1 && rawVal > 0 ? -rawVal : rawVal;
                        const formatted =
                            line.fmt === "pct" ? Engine.formatPct(rawVal) : Engine.formatBRL(displayVal);
                        return `<td class="num">${formatted}</td>`;
                    })
                    .join("");

                let avStr = "—";
                if (line.fmt === "brl") {
                    const totalRaw = Number(c.kpis[line.key] || 0);
                    const avPct = (totalRaw / rlConsolidada) * 100;
                    avStr = Engine.formatPct(avPct);
                }

                return `
                    <tr class="${line.cls}">
                        <td>${escapeHtml(line.label)}</td>
                        ${cells}
                        <td class="num"><strong>${avStr}</strong></td>
                    </tr>
                `;
            })
            .join("");
    }

    function renderBudgetDetailTable() {
        const tbody = document.getElementById("tbodyBudgetDetail");
        if (!tbody || !AppState.computed) return;

        const rows = AppState.computed.tabelaOrcadoRealizado || [];
        tbody.innerHTML = rows
            .map((r) => {
                // Para receita, realizado >= orçado é favorável; para custo/despesa, realizado <= orçado é favorável
                const isFavorable =
                    r.tipo_conta === "RECEITA" ? r.variacao_absoluta >= 0 : r.variacao_absoluta <= 0;
                const statusBadge = isFavorable
                    ? `<span class="if-status-badge status-VERDE">● FAVORÁVEL</span>`
                    : Math.abs(r.variacao_perc) <= 5
                    ? `<span class="if-status-badge status-AMARELO">● ATENÇÃO</span>`
                    : `<span class="if-status-badge status-VERMELHO">● DESVIO</span>`;

                return `
                    <tr>
                        <td><strong>${escapeHtml(r.departamento_id)}</strong> — ${escapeHtml(r.departamento_nome)}</td>
                        <td><code>${escapeHtml(r.conta_id)}</code> — ${escapeHtml(r.conta_nome)}</td>
                        <td>${escapeHtml(r.tipo_conta)}</td>
                        <td class="num">${Engine.formatBRL(r.valor_orcado)}</td>
                        <td class="num"><strong>${Engine.formatBRL(r.valor_realizado)}</strong></td>
                        <td class="num" style="color:${isFavorable ? "#059669" : "#DC2626"};font-weight:700;">
                            ${r.variacao_absoluta >= 0 ? "+" : ""}${Engine.formatBRL(r.variacao_absoluta)}
                        </td>
                        <td class="num" style="color:${isFavorable ? "#059669" : "#DC2626"};font-weight:700;">
                            ${r.variacao_perc >= 0 ? "+" : ""}${Engine.formatPct(r.variacao_perc)}
                        </td>
                        <td class="num">${Engine.formatPct(r.aderencia_perc)}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            })
            .join("");
    }

    // =========================================================================
    // 8. MÓDULO 3: RENTABILIDADE (CATEGORIAS, PRODUTOS, REGIÕES E CLIENTES)
    // =========================================================================
    function renderRentabilidadeModule() {
        if (!AppState.computed) return;
        const c = AppState.computed;

        // 1. Categorias
        const tbodyCat = document.getElementById("tbodyRentCategorias");
        if (tbodyCat) {
            tbodyCat.innerHTML = c.rentabilidadePorCategoria
                .map(
                    (cat) => `
                <tr>
                    <td><strong>${escapeHtml(cat.categoria)}</strong></td>
                    <td class="num">${Engine.formatInt(cat.quantidade)}</td>
                    <td class="num">${Engine.formatBRL(cat.receita_bruta)}</td>
                    <td class="num">${Engine.formatBRL(cat.descontos)}</td>
                    <td class="num">${Engine.formatBRL(cat.devolucoes)}</td>
                    <td class="num">${Engine.formatBRL(cat.receita_liquida_comercial)}</td>
                    <td class="num">${Engine.formatBRL(cat.cmv_bruto)}</td>
                    <td class="num"><strong>${Engine.formatBRL(cat.margem_bruta_valor)}</strong></td>
                    <td class="num">
                        <span class="if-status-badge ${
                            cat.margem_bruta_perc >= 32 ? "status-VERDE" : "status-AMARELO"
                        }">
                            ${Engine.formatPct(cat.margem_bruta_perc)}
                        </span>
                    </td>
                    <td class="num">${Engine.formatPct(cat.share_receita_perc)}</td>
                </tr>
            `
                )
                .join("");
        }

        // 2. Regiões
        const tbodyReg = document.getElementById("tbodyRentRegioes");
        if (tbodyReg) {
            tbodyReg.innerHTML = c.rentabilidadePorRegiao
                .map(
                    (reg) => `
                <tr>
                    <td><strong>${escapeHtml(reg.regiao)}</strong></td>
                    <td class="num">${Engine.formatInt(reg.quantidade)}</td>
                    <td class="num">${Engine.formatBRL(reg.receita_bruta)}</td>
                    <td class="num">${Engine.formatBRL(reg.receita_liquida_comercial)}</td>
                    <td class="num">${Engine.formatBRL(reg.cmv_total)}</td>
                    <td class="num"><strong>${Engine.formatBRL(reg.margem_bruta_valor)}</strong></td>
                    <td class="num">
                        <span class="if-status-badge status-VERDE">${Engine.formatPct(reg.margem_bruta_perc)}</span>
                    </td>
                    <td class="num">${Engine.formatPct(reg.share_receita_perc)}</td>
                </tr>
            `
                )
                .join("");
        }

        // 3. Produtos (com busca e ordenação)
        const tbodyProd = document.getElementById("tbodyRentProdutos");
        if (tbodyProd) {
            let prods = [...c.rentabilidadePorProduto];
            if (AppState.prodSearch) {
                const q = AppState.prodSearch;
                prods = prods.filter(
                    (p) =>
                        p.produto_id.toLowerCase().includes(q) ||
                        p.produto_nome.toLowerCase().includes(q) ||
                        p.categoria.toLowerCase().includes(q)
                );
            }
            const sortKey = AppState.prodSort || "margem_bruta_valor";
            prods.sort((a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0));

            const countSpan = document.getElementById("prodCountBadge");
            if (countSpan) countSpan.textContent = `${prods.length} SKUs exibidos`;

            tbodyProd.innerHTML = prods
                .map(
                    (p, idx) => `
                <tr>
                    <td>${idx + 1}º</td>
                    <td><code>${escapeHtml(p.produto_id)}</code></td>
                    <td><strong>${escapeHtml(p.produto_nome)}</strong></td>
                    <td>${escapeHtml(p.categoria)}</td>
                    <td class="num">${Engine.formatInt(p.quantidade_vendida)}</td>
                    <td class="num">${Engine.formatBRL(p.receita_bruta)}</td>
                    <td class="num">${Engine.formatBRL(p.cmv_total)}</td>
                    <td class="num"><strong>${Engine.formatBRL(p.margem_bruta_valor)}</strong></td>
                    <td class="num">
                        <span class="if-status-badge ${
                            p.margem_bruta_perc >= 32
                                ? "status-VERDE"
                                : p.margem_bruta_perc >= 25
                                ? "status-AMARELO"
                                : "status-VERMELHO"
                        }">${Engine.formatPct(p.margem_bruta_perc)}</span>
                    </td>
                    <td class="num">${Engine.formatPct(p.share_receita_perc)}</td>
                </tr>
            `
                )
                .join("");
        }

        // 4. Clientes
        const tbodyCli = document.getElementById("tbodyRentClientes");
        if (tbodyCli) {
            let clis = [...c.rentabilidadePorCliente];
            if (AppState.cliSearch) {
                const q = AppState.cliSearch;
                clis = clis.filter(
                    (cl) =>
                        cl.cliente_id.toLowerCase().includes(q) ||
                        cl.razao_social.toLowerCase().includes(q) ||
                        cl.segmento.toLowerCase().includes(q) ||
                        cl.regiao.toLowerCase().includes(q)
                );
            }

            const countSpan = document.getElementById("cliCountBadge");
            if (countSpan) countSpan.textContent = `${clis.length} Clientes exibidos`;

            tbodyCli.innerHTML = clis
                .map(
                    (cl, idx) => `
                <tr>
                    <td>${idx + 1}º</td>
                    <td><code>${escapeHtml(cl.cliente_id)}</code></td>
                    <td><strong>${escapeHtml(cl.razao_social)}</strong></td>
                    <td>${escapeHtml(cl.segmento)}</td>
                    <td>${escapeHtml(cl.regiao)} (${escapeHtml(cl.estado)})</td>
                    <td class="num">${Engine.formatInt(cl.quantidade_vendida)}</td>
                    <td class="num">${Engine.formatBRL(cl.receita_bruta)}</td>
                    <td class="num">${Engine.formatBRL(cl.cmv_total)}</td>
                    <td class="num"><strong>${Engine.formatBRL(cl.margem_bruta_valor)}</strong></td>
                    <td class="num">${Engine.formatPct(cl.margem_bruta_perc)}</td>
                    <td class="num">${Engine.formatBRL(cl.ticket_medio)}</td>
                </tr>
            `
                )
                .join("");
        }
    }

    // =========================================================================
    // 9. MÓDULO 4: GESTÃO DE DADOS (CRUD, VALIDAÇÃO, LOCALSTORAGE, IMPORT/EXPORT)
    // =========================================================================
    function bindGestaoEvents() {
        // Sub-abas de Gestão de Dados
        const gestaoSubTabs = document.querySelectorAll("[data-gestao-tab]");
        gestaoSubTabs.forEach((btn) => {
            btn.addEventListener("click", () => {
                AppState.gestaoTab = btn.getAttribute("data-gestao-tab");
                AppState.gestaoPage = 1;
                gestaoSubTabs.forEach((b) => b.classList.toggle("active", b === btn));
                renderGestaoModule();
            });
        });

        // Busca rápida na Gestão de Dados
        const inputGestaoSearch = document.getElementById("inputGestaoSearch");
        if (inputGestaoSearch) {
            inputGestaoSearch.addEventListener("input", (e) => {
                AppState.gestaoSearch = e.target.value.trim().toLowerCase();
                AppState.gestaoPage = 1;
                renderGestaoTableContent();
            });
        }

        // Paginação
        const btnPrevPage = document.getElementById("btnGestaoPrevPage");
        const btnNextPage = document.getElementById("btnGestaoNextPage");
        if (btnPrevPage) {
            btnPrevPage.addEventListener("click", () => {
                if (AppState.gestaoPage > 1) {
                    AppState.gestaoPage--;
                    renderGestaoTableContent();
                }
            });
        }
        if (btnNextPage) {
            btnNextPage.addEventListener("click", () => {
                AppState.gestaoPage++;
                renderGestaoTableContent();
            });
        }

        // Botão Salvar no Navegador (localStorage)
        const btnSaveStorage = document.getElementById("btnSaveStorage");
        if (btnSaveStorage) {
            btnSaveStorage.addEventListener("click", () => {
                persistCurrentState("Alterações salvas manualmente no armazenamento local do navegador.");
            });
        }

        // Botão Restaurar Base Original
        const btnRestoreOriginal = document.getElementById("btnRestoreOriginal");
        if (btnRestoreOriginal) {
            btnRestoreOriginal.addEventListener("click", () => {
                showConfirmModal({
                    title: "Restaurar Base Original (Seed=42)?",
                    message:
                        "Esta ação descartará todas as edições locais salvas no navegador (localStorage) e restaurará os valores originais do banco DuckDB da Interfood. Deseja prosseguir?",
                    confirmLabel: "Sim, Restaurar Base Original",
                    danger: true,
                    onConfirm: () => {
                        const restored = Storage.restoreOriginalDataset(window.INTERFOOD_INITIAL_DATA);
                        AppState.dataset = restored.dataset;
                        AppState.isModified = false;
                        AppState.lastSavedAt = null;
                        AppState.editCount = 0;
                        populateFilterOptions();
                        recalculateAndRenderAll();
                        showToast(
                            "success",
                            "Base Original Restaurada",
                            "Todos os indicadores, gráficos e tabelas voltaram ao estado original."
                        );
                    },
                });
            });
        }

        // Botão Exportar JSON Completo
        const btnExportJSON = document.getElementById("btnExportJSON");
        if (btnExportJSON) {
            btnExportJSON.addEventListener("click", () => {
                const jsonStr = JSON.stringify(AppState.dataset, null, 2);
                const stamp = new Date().toISOString().slice(0, 10);
                downloadFile(`interfood_controladoria_${stamp}.json`, jsonStr, "application/json;charset=utf-8");
                showToast(
                    "success",
                    "JSON Exportado com Sucesso",
                    "O arquivo JSON contendo toda a base editada foi gerado para download."
                );
            });
        }

        // Botão Exportar CSV da Aba Atual
        const btnExportCSV = document.getElementById("btnExportCSV");
        if (btnExportCSV) {
            btnExportCSV.addEventListener("click", () => {
                const tab = AppState.gestaoTab;
                const stamp = new Date().toISOString().slice(0, 10);
                if (tab === "vendas") {
                    const csv = Storage.arrayToCSV(AppState.dataset.vendas, [
                        "id",
                        "data",
                        "ano",
                        "mes",
                        "produto_id",
                        "produto_nome",
                        "categoria",
                        "cliente_id",
                        "cliente_nome",
                        "regiao",
                        "quantidade",
                        "receita_bruta",
                        "descontos",
                        "devolucoes",
                        "cmv_bruto",
                        "cmv_revertido",
                    ]);
                    downloadFile(`interfood_vendas_${stamp}.csv`, csv, "text/csv;charset=utf-8");
                    showToast("success", "CSV de Vendas Exportado", "Tabela de vendas e custos exportada para CSV.");
                } else if (tab === "despesas") {
                    const csv = Storage.arrayToCSV(AppState.dataset.despesas, [
                        "id",
                        "data",
                        "ano",
                        "mes",
                        "departamento_id",
                        "departamento_nome",
                        "conta_id",
                        "conta_nome",
                        "descricao",
                        "valor",
                        "tipo",
                    ]);
                    downloadFile(`interfood_despesas_${stamp}.csv`, csv, "text/csv;charset=utf-8");
                    showToast("success", "CSV de Despesas Exportado", "Tabela de despesas operacionais exportada.");
                } else if (tab === "orcamento") {
                    const csv = Storage.arrayToCSV(AppState.dataset.orcamento, [
                        "id",
                        "ano",
                        "mes",
                        "departamento_id",
                        "departamento_nome",
                        "conta_id",
                        "conta_nome",
                        "tipo_conta",
                        "descricao",
                        "valor_orcado",
                    ]);
                    downloadFile(`interfood_orcamento_${stamp}.csv`, csv, "text/csv;charset=utf-8");
                    showToast("success", "CSV de Orçamento Exportado", "Tabela de orçamento exportada para CSV.");
                } else {
                    const csv = Storage.arrayToCSV(AppState.computed.dreMensal, [
                        "competencia",
                        "receita_bruta",
                        "deducoes_totais",
                        "receita_liquida",
                        "cmv_liquido",
                        "lucro_bruto",
                        "margem_bruta_perc",
                        "despesas_operacionais_totais",
                        "ebitda",
                        "margem_ebitda_perc",
                        "lucro_liquido",
                        "margem_liquida_perc",
                    ]);
                    downloadFile(`interfood_dre_mensal_${stamp}.csv`, csv, "text/csv;charset=utf-8");
                    showToast("success", "CSV da DRE Exportado", "Demonstrativo de resultados mensal exportado.");
                }
            });
        }

        // Importar JSON ou CSV
        const btnTriggerImport = document.getElementById("btnTriggerImport");
        const inputFileImport = document.getElementById("inputFileImport");
        if (btnTriggerImport && inputFileImport) {
            btnTriggerImport.addEventListener("click", () => {
                inputFileImport.value = "";
                inputFileImport.click();
            });
            inputFileImport.addEventListener("change", handleFileImport);
        }
    }

    function persistCurrentState(toastMessage) {
        AppState.editCount = (AppState.editCount || 0) + 1;
        const res = Storage.saveDataset(AppState.dataset, AppState.editCount);
        if (res.success) {
            AppState.isModified = true;
            AppState.lastSavedAt = res.savedAt;
            updateStorageStatusBadge();
            if (toastMessage) {
                showToast("success", "Dados Persistidos Localmente", toastMessage);
            }
        } else {
            showToast(
                "error",
                "Falha ao Salvar",
                res.errors ? res.errors.join(" ") : "Não foi possível gravar no localStorage."
            );
        }
    }

    function handleFileImport(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const fileName = file.name.toLowerCase();

            if (fileName.endsWith(".json")) {
                try {
                    const parsed = JSON.parse(content);
                    const check = Storage.validateFullDataset(parsed);
                    if (!check.valid) {
                        showToast(
                            "error",
                            "JSON Inválido — Importação Recusada",
                            check.errors.slice(0, 3).join(" | ")
                        );
                        return;
                    }
                    showConfirmModal({
                        title: "Confirmar Importação de Base JSON",
                        message: `O arquivo "${file.name}" foi validado com sucesso (${parsed.vendas.length} vendas, ${parsed.despesas.length} despesas, ${parsed.orcamento.length} orçamentos). Deseja substituir a base atual no navegador?`,
                        confirmLabel: "Importar e Recalcular",
                        danger: false,
                        onConfirm: () => {
                            AppState.dataset = parsed;
                            persistCurrentState(`Base JSON "${file.name}" importada e validada com sucesso.`);
                            populateFilterOptions();
                            recalculateAndRenderAll();
                        },
                    });
                } catch (err) {
                    showToast("error", "Erro de Sintaxe JSON", "O arquivo selecionado não é um JSON válido.");
                }
            } else if (fileName.endsWith(".csv")) {
                const entityType =
                    AppState.gestaoTab === "despesas"
                        ? "despesas"
                        : AppState.gestaoTab === "orcamento"
                        ? "orcamento"
                        : "vendas";
                const check = Storage.parseAndValidateCSV(content, entityType, AppState.dataset);
                if (!check.valid) {
                    showToast(
                        "error",
                        `CSV Inválido (${entityType})`,
                        check.errors.slice(0, 3).join(" | ")
                    );
                    return;
                }
                showConfirmModal({
                    title: `Confirmar Importação CSV (${entityType.toUpperCase()})`,
                    message: `Foram validados ${check.rows.length} registros no arquivo "${file.name}" para a tabela "${entityType}". Deseja substituir os registros dessa tabela e recalcular os indicadores?`,
                    confirmLabel: "Substituir Tabela e Recalcular",
                    danger: false,
                    onConfirm: () => {
                        AppState.dataset[entityType] = check.rows;
                        persistCurrentState(
                            `${check.rows.length} registros importados em "${entityType}" via CSV.`
                        );
                        recalculateAndRenderAll();
                    },
                });
            } else {
                showToast("error", "Formato Não Suportado", "Selecione um arquivo .json ou .csv válido.");
            }
        };
        reader.readAsText(file, "utf-8");
    }

    function renderGestaoModule() {
        renderAddRecordForm();
        renderGestaoTableContent();
    }

    function renderAddRecordForm() {
        const container = document.getElementById("gestaoAddFormContainer");
        if (!container || !AppState.dataset) return;

        const dims = AppState.dataset.dimensoes || {};
        const tab = AppState.gestaoTab;

        if (tab === "vendas") {
            const prods = dims.produtos || [];
            const clis = dims.clientes || [];
            container.innerHTML = `
                <div class="if-form-title">➕ Adicionar Novo Registro de Venda & Custo</div>
                <div class="if-form-grid">
                    <div class="if-field">
                        <label>Data (YYYY-MM-DD)</label>
                        <input type="date" id="addVendaData" value="2024-12-01" min="2020-01-01" max="2030-12-31" />
                    </div>
                    <div class="if-field">
                        <label>Produto (SKU)</label>
                        <select id="addVendaProduto">
                            ${prods
                                .map(
                                    (p) =>
                                        `<option value="${escapeHtml(p.produto_id)}">${escapeHtml(
                                            p.produto_id
                                        )} — ${escapeHtml(p.nome)} (${escapeHtml(p.categoria)})</option>`
                                )
                                .join("")}
                        </select>
                    </div>
                    <div class="if-field">
                        <label>Cliente B2B</label>
                        <select id="addVendaCliente">
                            ${clis
                                .map(
                                    (c) =>
                                        `<option value="${escapeHtml(c.cliente_id)}">${escapeHtml(
                                            c.cliente_id
                                        )} — ${escapeHtml(c.razao_social)} (${escapeHtml(c.regiao)})</option>`
                                )
                                .join("")}
                        </select>
                    </div>
                    <div class="if-field">
                        <label>Quantidade</label>
                        <input type="number" id="addVendaQtd" value="100" min="1" step="1" />
                    </div>
                    <div class="if-field">
                        <label>Receita Bruta (R$)</label>
                        <input type="number" id="addVendaRecBruta" value="15000.00" min="0.01" step="0.01" />
                    </div>
                    <div class="if-field">
                        <label>Descontos (R$)</label>
                        <input type="number" id="addVendaDesc" value="300.00" min="0" step="0.01" />
                    </div>
                    <div class="if-field">
                        <label>Devoluções (R$)</label>
                        <input type="number" id="addVendaDev" value="0.00" min="0" step="0.01" />
                    </div>
                    <div class="if-field">
                        <label>CMV Bruto (R$)</label>
                        <input type="number" id="addVendaCmv" value="9500.00" min="0" step="0.01" />
                    </div>
                    <div class="if-field">
                        <button type="button" class="if-btn if-btn-green" id="btnSubmitAddVenda">
                            ➕ Incluir Venda
                        </button>
                    </div>
                </div>
            `;
            const btn = document.getElementById("btnSubmitAddVenda");
            if (btn) btn.addEventListener("click", handleAddVenda);
        } else if (tab === "despesas") {
            const deps = dims.departamentos || [];
            const contas = (dims.plano_contas || []).filter((c) => c.tipo === "DESPESA");
            container.innerHTML = `
                <div class="if-form-title">➕ Adicionar Nova Despesa Operacional (SG&A)</div>
                <div class="if-form-grid">
                    <div class="if-field">
                        <label>Data (YYYY-MM-DD)</label>
                        <input type="date" id="addDespData" value="2024-12-01" />
                    </div>
                    <div class="if-field">
                        <label>Departamento</label>
                        <select id="addDespDep">
                            ${deps
                                .map(
                                    (d) =>
                                        `<option value="${escapeHtml(d.departamento_id)}">${escapeHtml(
                                            d.departamento_id
                                        )} — ${escapeHtml(d.nome)}</option>`
                                )
                                .join("")}
                        </select>
                    </div>
                    <div class="if-field">
                        <label>Conta Contábil</label>
                        <select id="addDespConta">
                            ${contas
                                .map(
                                    (c) =>
                                        `<option value="${escapeHtml(c.conta_id)}">${escapeHtml(
                                            c.conta_id
                                        )} — ${escapeHtml(c.descricao)} (${escapeHtml(c.natureza)})</option>`
                                )
                                .join("")}
                        </select>
                    </div>
                    <div class="if-field">
                        <label>Descrição do Lançamento</label>
                        <input type="text" id="addDespDesc" value="Despesa operacional suplementar" />
                    </div>
                    <div class="if-field">
                        <label>Valor (R$)</label>
                        <input type="number" id="addDespValor" value="12500.00" min="0.01" step="0.01" />
                    </div>
                    <div class="if-field">
                        <label>Natureza</label>
                        <select id="addDespTipo">
                            <option value="FIXA">FIXA</option>
                            <option value="VARIAVEL">VARIAVEL</option>
                        </select>
                    </div>
                    <div class="if-field">
                        <button type="button" class="if-btn if-btn-green" id="btnSubmitAddDesp">
                            ➕ Incluir Despesa
                        </button>
                    </div>
                </div>
            `;
            const btn = document.getElementById("btnSubmitAddDesp");
            if (btn) btn.addEventListener("click", handleAddDespesa);
        } else if (tab === "orcamento") {
            const deps = dims.departamentos || [];
            const contas = dims.plano_contas || [];
            container.innerHTML = `
                <div class="if-form-title">➕ Adicionar Registro de Orçamento (Budget)</div>
                <div class="if-form-grid">
                    <div class="if-field">
                        <label>Ano</label>
                        <input type="number" id="addOrcAno" value="2024" min="2020" max="2030" />
                    </div>
                    <div class="if-field">
                        <label>Mês (1–12)</label>
                        <input type="number" id="addOrcMes" value="12" min="1" max="12" />
                    </div>
                    <div class="if-field">
                        <label>Departamento</label>
                        <select id="addOrcDep">
                            ${deps
                                .map(
                                    (d) =>
                                        `<option value="${escapeHtml(d.departamento_id)}">${escapeHtml(
                                            d.departamento_id
                                        )} — ${escapeHtml(d.nome)}</option>`
                                )
                                .join("")}
                        </select>
                    </div>
                    <div class="if-field">
                        <label>Conta Orçamentária</label>
                        <select id="addOrcConta">
                            ${contas
                                .map(
                                    (c) =>
                                        `<option value="${escapeHtml(c.conta_id)}">${escapeHtml(
                                            c.conta_id
                                        )} — ${escapeHtml(c.descricao)} (${escapeHtml(c.tipo)})</option>`
                                )
                                .join("")}
                        </select>
                    </div>
                    <div class="if-field">
                        <label>Valor Orçado (R$)</label>
                        <input type="number" id="addOrcValor" value="25000.00" min="0" step="0.01" />
                    </div>
                    <div class="if-field">
                        <button type="button" class="if-btn if-btn-green" id="btnSubmitAddOrc">
                            ➕ Incluir Orçamento
                        </button>
                    </div>
                </div>
            `;
            const btn = document.getElementById("btnSubmitAddOrc");
            if (btn) btn.addEventListener("click", handleAddOrcamento);
        } else {
            container.innerHTML = "";
        }
    }

    function handleAddVenda() {
        const dt = document.getElementById("addVendaData").value;
        const prodId = document.getElementById("addVendaProduto").value;
        const cliId = document.getElementById("addVendaCliente").value;
        const qtd = Number(document.getElementById("addVendaQtd").value);
        const recBruta = Number(document.getElementById("addVendaRecBruta").value);
        const desc = Number(document.getElementById("addVendaDesc").value || 0);
        const dev = Number(document.getElementById("addVendaDev").value || 0);
        const cmv = Number(document.getElementById("addVendaCmv").value);

        const dims = AppState.dataset.dimensoes || {};
        const prod = (dims.produtos || []).find((p) => p.produto_id === prodId) || {};
        const cli = (dims.clientes || []).find((c) => c.cliente_id === cliId) || {};
        const [anoStr, mesStr] = (dt || "").split("-");

        const newRecord = {
            id: `VND-NEW-${Date.now()}`,
            data: dt,
            ano: Number(anoStr),
            mes: Number(mesStr),
            produto_id: prodId,
            sku: prod.sku || prodId,
            produto_nome: prod.nome || prodId,
            categoria: prod.categoria || "Laticínios",
            cliente_id: cliId,
            cliente_nome: cli.razao_social || cliId,
            cliente_segmento: cli.segmento || "Atacado",
            estado: cli.estado || "SP",
            regiao: cli.regiao || "Sudeste",
            pedidos_item: 1,
            quantidade: qtd,
            receita_bruta: Engine.round2(recBruta),
            descontos: Engine.round2(desc),
            devolucoes: Engine.round2(dev),
            cmv_bruto: Engine.round2(cmv),
            cmv_revertido: dev > 0 && recBruta > 0 ? Engine.round2(cmv * (dev / recBruta)) : 0.0,
        };

        const validation = Engine.validateRecord("vendas", newRecord, AppState.dataset);
        if (!validation.valid) {
            showToast("error", "Erro de Validação na Venda", validation.errors.join(" "));
            return;
        }

        AppState.dataset.vendas.unshift(newRecord);
        persistCurrentState(`Venda ${newRecord.id} (${Engine.formatBRL(newRecord.receita_bruta)}) adicionada.`);
        recalculateAndRenderAll();
    }

    function handleAddDespesa() {
        const dt = document.getElementById("addDespData").value;
        const depId = document.getElementById("addDespDep").value;
        const contaId = document.getElementById("addDespConta").value;
        const desc = document.getElementById("addDespDesc").value.trim();
        const valor = Number(document.getElementById("addDespValor").value);
        const tipo = document.getElementById("addDespTipo").value;

        const dims = AppState.dataset.dimensoes || {};
        const dep = (dims.departamentos || []).find((d) => d.departamento_id === depId) || {};
        const pc = (dims.plano_contas || []).find((c) => c.conta_id === contaId) || {};
        const [anoStr, mesStr] = (dt || "").split("-");

        const newRecord = {
            id: `DSP-NEW-${Date.now()}`,
            data: dt,
            ano: Number(anoStr),
            mes: Number(mesStr),
            departamento_id: depId,
            departamento_nome: dep.nome || depId,
            conta_id: contaId,
            conta_nome: pc.descricao || contaId,
            descricao: desc,
            valor: Engine.round2(valor),
            tipo: tipo === "VARIAVEL" ? "VARIAVEL" : "FIXA",
        };

        const validation = Engine.validateRecord("despesas", newRecord, AppState.dataset);
        if (!validation.valid) {
            showToast("error", "Erro de Validação na Despesa", validation.errors.join(" "));
            return;
        }

        AppState.dataset.despesas.unshift(newRecord);
        persistCurrentState(`Despesa ${newRecord.id} (${Engine.formatBRL(newRecord.valor)}) adicionada.`);
        recalculateAndRenderAll();
    }

    function handleAddOrcamento() {
        const ano = Number(document.getElementById("addOrcAno").value);
        const mes = Number(document.getElementById("addOrcMes").value);
        const depId = document.getElementById("addOrcDep").value;
        const contaId = document.getElementById("addOrcConta").value;
        const valorOrcado = Number(document.getElementById("addOrcValor").value);

        const dims = AppState.dataset.dimensoes || {};
        const dep = (dims.departamentos || []).find((d) => d.departamento_id === depId) || {};
        const pc = (dims.plano_contas || []).find((c) => c.conta_id === contaId) || {};

        const newRecord = {
            id: `ORC-NEW-${Date.now()}`,
            data: `${ano}-${String(mes).padStart(2, "0")}-01`,
            ano,
            mes,
            departamento_id: depId,
            departamento_nome: dep.nome || depId,
            conta_id: contaId,
            conta_nome: pc.descricao || contaId,
            tipo_conta: pc.tipo || (contaId === "PC002" ? "RECEITA" : contaId === "PC011" ? "CUSTO" : "DESPESA"),
            descricao: `Orçamento ${pc.descricao || contaId} - ${String(mes).padStart(2, "0")}/${ano}`,
            valor_orcado: Engine.round2(valorOrcado),
        };

        const validation = Engine.validateRecord("orcamento", newRecord, AppState.dataset);
        if (!validation.valid) {
            showToast("error", "Erro de Validação no Orçamento", validation.errors.join(" "));
            return;
        }

        AppState.dataset.orcamento.unshift(newRecord);
        persistCurrentState(`Item de Orçamento ${newRecord.id} (${Engine.formatBRL(newRecord.valor_orcado)}) adicionado.`);
        recalculateAndRenderAll();
    }

    function renderGestaoTableContent() {
        const thead = document.getElementById("theadGestao");
        const tbody = document.getElementById("tbodyGestao");
        const pageInfo = document.getElementById("gestaoPageInfo");
        const paginationBar = document.getElementById("gestaoPaginationBar");
        if (!thead || !tbody || !AppState.dataset) return;

        const tab = AppState.gestaoTab;

        if (tab === "parametros") {
            if (paginationBar) paginationBar.style.display = "none";
            renderParametrosEditor(thead, tbody);
            return;
        }

        if (paginationBar) paginationBar.style.display = "flex";

        const rawList = AppState.dataset[tab] || [];
        // Aplicar filtro de busca + filtros globais de ano/mês se ativos
        const q = AppState.gestaoSearch;
        const f = AppState.computed ? AppState.computed.filters : AppState.filters;

        const filteredList = rawList.filter((item) => {
            if (f.ano !== "TODOS" && Number(item.ano) !== Number(f.ano)) return false;
            if (f.mes !== "TODOS" && Number(item.mes) !== Number(f.mes)) return false;
            if (tab === "vendas") {
                if (f.categoria !== "TODAS" && item.categoria !== f.categoria) return false;
                if (f.produtoId !== "TODOS" && item.produto_id !== f.produtoId) return false;
                if (f.regiao !== "TODAS" && item.regiao !== f.regiao) return false;
                if (f.clienteId !== "TODOS" && item.cliente_id !== f.clienteId) return false;
            }
            if (!q) return true;
            return JSON.stringify(item).toLowerCase().includes(q);
        });

        const totalItems = filteredList.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / AppState.gestaoPageSize));
        if (AppState.gestaoPage > totalPages) AppState.gestaoPage = totalPages;

        const startIdx = (AppState.gestaoPage - 1) * AppState.gestaoPageSize;
        const pageItems = filteredList.slice(startIdx, startIdx + AppState.gestaoPageSize);

        if (pageInfo) {
            pageInfo.textContent = `Exibindo ${pageItems.length} de ${Engine.formatInt(
                totalItems
            )} registros (Página ${AppState.gestaoPage} de ${totalPages})`;
        }

        if (tab === "vendas") {
            thead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Produto / Categoria</th>
                    <th>Cliente / Região</th>
                    <th class="num">Qtd</th>
                    <th class="num">Receita Bruta (R$)</th>
                    <th class="num">Descontos (R$)</th>
                    <th class="num">Devoluções (R$)</th>
                    <th class="num">CMV Bruto (R$)</th>
                    <th>Ações</th>
                </tr>
            `;
            tbody.innerHTML = pageItems
                .map(
                    (v) => `
                <tr data-row-id="${escapeHtml(v.id)}">
                    <td><code>${escapeHtml(v.id)}</code></td>
                    <td>
                        <input type="date" class="if-inline-input" style="width:128px;text-align:left;" data-field="data" value="${escapeHtml(
                            v.data
                        )}" />
                    </td>
                    <td>
                        <strong>${escapeHtml(v.produto_id)}</strong> — ${escapeHtml(v.produto_nome)}<br>
                        <small style="color:#64748B;">${escapeHtml(v.categoria)}</small>
                    </td>
                    <td>
                        <strong>${escapeHtml(v.cliente_id)}</strong> — ${escapeHtml(v.cliente_nome)}<br>
                        <small style="color:#64748B;">${escapeHtml(v.regiao)} (${escapeHtml(v.estado)})</small>
                    </td>
                    <td class="num">
                        <input type="number" class="if-inline-input" style="width:82px;" data-field="quantidade" value="${
                            v.quantidade
                        }" min="1" step="1" />
                    </td>
                    <td class="num">
                        <input type="number" class="if-inline-input" data-field="receita_bruta" value="${Number(
                            v.receita_bruta
                        ).toFixed(2)}" min="0.01" step="0.01" />
                    </td>
                    <td class="num">
                        <input type="number" class="if-inline-input" style="width:95px;" data-field="descontos" value="${Number(
                            v.descontos
                        ).toFixed(2)}" min="0" step="0.01" />
                    </td>
                    <td class="num">
                        <input type="number" class="if-inline-input" style="width:95px;" data-field="devolucoes" value="${Number(
                            v.devolucoes
                        ).toFixed(2)}" min="0" step="0.01" />
                    </td>
                    <td class="num">
                        <input type="number" class="if-inline-input" data-field="cmv_bruto" value="${Number(
                            v.cmv_bruto
                        ).toFixed(2)}" min="0" step="0.01" />
                    </td>
                    <td style="white-space:nowrap;">
                        <button type="button" class="if-btn if-btn-green if-btn-sm" data-action="save-row" data-entity="vendas" data-id="${escapeHtml(
                            v.id
                        )}">💾 Salvar</button>
                        <button type="button" class="if-btn if-btn-danger if-btn-sm" data-action="delete-row" data-entity="vendas" data-id="${escapeHtml(
                            v.id
                        )}">🗑</button>
                    </td>
                </tr>
            `
                )
                .join("");
        } else if (tab === "despesas") {
            thead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Departamento</th>
                    <th>Conta Contábil</th>
                    <th>Descrição</th>
                    <th>Natureza</th>
                    <th class="num">Valor (R$)</th>
                    <th>Ações</th>
                </tr>
            `;
            tbody.innerHTML = pageItems
                .map(
                    (d) => `
                <tr data-row-id="${escapeHtml(d.id)}">
                    <td><code>${escapeHtml(d.id)}</code></td>
                    <td>
                        <input type="date" class="if-inline-input" style="width:128px;text-align:left;" data-field="data" value="${escapeHtml(
                            d.data
                        )}" />
                    </td>
                    <td><strong>${escapeHtml(d.departamento_id)}</strong> — ${escapeHtml(d.departamento_nome)}</td>
                    <td><code>${escapeHtml(d.conta_id)}</code> — ${escapeHtml(d.conta_nome)}</td>
                    <td>
                        <input type="text" class="if-inline-input text-left" style="width:210px;" data-field="descricao" value="${escapeHtml(
                            d.descricao
                        )}" />
                    </td>
                    <td>
                        <select class="if-inline-input text-left" style="width:105px;" data-field="tipo">
                            <option value="FIXA" ${d.tipo === "FIXA" ? "selected" : ""}>FIXA</option>
                            <option value="VARIAVEL" ${d.tipo === "VARIAVEL" ? "selected" : ""}>VARIAVEL</option>
                        </select>
                    </td>
                    <td class="num">
                        <input type="number" class="if-inline-input" data-field="valor" value="${Number(
                            d.valor
                        ).toFixed(2)}" min="0.01" step="0.01" />
                    </td>
                    <td style="white-space:nowrap;">
                        <button type="button" class="if-btn if-btn-green if-btn-sm" data-action="save-row" data-entity="despesas" data-id="${escapeHtml(
                            d.id
                        )}">💾 Salvar</button>
                        <button type="button" class="if-btn if-btn-danger if-btn-sm" data-action="delete-row" data-entity="despesas" data-id="${escapeHtml(
                            d.id
                        )}">🗑</button>
                    </td>
                </tr>
            `
                )
                .join("");
        } else if (tab === "orcamento") {
            thead.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Ano</th>
                    <th>Mês</th>
                    <th>Departamento</th>
                    <th>Conta Orçamentária</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th class="num">Valor Orçado (R$)</th>
                    <th>Ações</th>
                </tr>
            `;
            tbody.innerHTML = pageItems
                .map(
                    (o) => `
                <tr data-row-id="${escapeHtml(o.id)}">
                    <td><code>${escapeHtml(o.id)}</code></td>
                    <td>
                        <input type="number" class="if-inline-input" style="width:76px;" data-field="ano" value="${
                            o.ano
                        }" min="2020" max="2030" />
                    </td>
                    <td>
                        <input type="number" class="if-inline-input" style="width:64px;" data-field="mes" value="${
                            o.mes
                        }" min="1" max="12" />
                    </td>
                    <td><strong>${escapeHtml(o.departamento_id)}</strong> — ${escapeHtml(o.departamento_nome)}</td>
                    <td><code>${escapeHtml(o.conta_id)}</code> — ${escapeHtml(o.conta_nome)}</td>
                    <td>${escapeHtml(o.tipo_conta)}</td>
                    <td>
                        <input type="text" class="if-inline-input text-left" style="width:200px;" data-field="descricao" value="${escapeHtml(
                            o.descricao
                        )}" />
                    </td>
                    <td class="num">
                        <input type="number" class="if-inline-input" data-field="valor_orcado" value="${Number(
                            o.valor_orcado
                        ).toFixed(2)}" min="0" step="0.01" />
                    </td>
                    <td style="white-space:nowrap;">
                        <button type="button" class="if-btn if-btn-green if-btn-sm" data-action="save-row" data-entity="orcamento" data-id="${escapeHtml(
                            o.id
                        )}">💾 Salvar</button>
                        <button type="button" class="if-btn if-btn-danger if-btn-sm" data-action="delete-row" data-entity="orcamento" data-id="${escapeHtml(
                            o.id
                        )}">🗑</button>
                    </td>
                </tr>
            `
                )
                .join("");
        }

        // Bind botões de salvar e excluir linha
        tbody.querySelectorAll("[data-action='save-row']").forEach((btn) => {
            btn.addEventListener("click", () => {
                const entity = btn.getAttribute("data-entity");
                const id = btn.getAttribute("data-id");
                const tr = btn.closest("tr");
                handleSaveInlineRow(entity, id, tr);
            });
        });

        tbody.querySelectorAll("[data-action='delete-row']").forEach((btn) => {
            btn.addEventListener("click", () => {
                const entity = btn.getAttribute("data-entity");
                const id = btn.getAttribute("data-id");
                handleDeleteRow(entity, id);
            });
        });
    }

    function renderParametrosEditor(thead, tbody) {
        const p = (AppState.dataset && AppState.dataset.parametros_metas) || {};
        thead.innerHTML = `
            <tr>
                <th>Parâmetro / Meta Corporativa</th>
                <th>Descrição e Impacto no Motor Financeiro</th>
                <th class="num">Valor Atual</th>
            </tr>
        `;
        tbody.innerHTML = `
            <tr>
                <td><strong>Alíquota Média de Impostos s/ Vendas (%)</strong></td>
                <td>Incide sobre (Receita Bruta - Descontos - Devoluções) na apuração da Receita Líquida da DRE.</td>
                <td class="num"><input type="number" class="if-inline-input" id="paramImpostos" value="${
                    p.aliquota_impostos_perc ?? 12.0
                }" min="0" max="50" step="0.1" /></td>
            </tr>
            <tr>
                <td><strong>Depreciação e Amortização Mensal (R$)</strong></td>
                <td>Deduzida do EBITDA mensal para apuração do EBIT (Lucro Operacional).</td>
                <td class="num"><input type="number" class="if-inline-input" id="paramDepreciacao" value="${
                    p.depreciacao_mensal ?? 35000.0
                }" min="0" step="100" /></td>
            </tr>
            <tr>
                <td><strong>Resultado Financeiro s/ Receita Líquida (%)</strong></td>
                <td>Percentual sobre a Receita Líquida mensal para apuração do LAIR / EBT (ex: -0.5%).</td>
                <td class="num"><input type="number" class="if-inline-input" id="paramFinanceiro" value="${
                    p.resultado_financeiro_perc ?? -0.5
                }" min="-25" max="25" step="0.1" /></td>
            </tr>
            <tr>
                <td><strong>Alíquota Efetiva IRPJ + CSLL (%)</strong></td>
                <td>Incide sobre o LAIR positivo para apuração do Lucro Líquido.</td>
                <td class="num"><input type="number" class="if-inline-input" id="paramIrpj" value="${
                    p.aliquota_ir_csll_perc ?? 24.0
                }" min="0" max="50" step="0.1" /></td>
            </tr>
            <tr>
                <td><strong>Meta de Margem Bruta Mínima (%)</strong></td>
                <td>Referência para o Semáforo de Governança da Controladoria.</td>
                <td class="num"><input type="number" class="if-inline-input" id="paramMetaMB" value="${
                    p.meta_margem_bruta_perc ?? 28.0
                }" min="0" max="100" step="0.1" /></td>
            </tr>
            <tr>
                <td><strong>Meta de Margem EBITDA Mínima (%)</strong></td>
                <td>Referência para o Semáforo de Governança Operacional.</td>
                <td class="num"><input type="number" class="if-inline-input" id="paramMetaEBITDA" value="${
                    p.meta_margem_ebitda_perc ?? 10.0
                }" min="0" max="100" step="0.1" /></td>
            </tr>
            <tr>
                <td><strong>Meta de Margem Líquida Mínima (%)</strong></td>
                <td>Referência para o Semáforo de Resultado Final.</td>
                <td class="num"><input type="number" class="if-inline-input" id="paramMetaML" value="${
                    p.meta_margem_liquida_perc ?? 6.0
                }" min="0" max="100" step="0.1" /></td>
            </tr>
            <tr>
                <td><strong>Teto Máximo de Índice de Devolução (%)</strong></td>
                <td>Limite tolerável de devoluções logísticas sobre a Receita Bruta.</td>
                <td class="num"><input type="number" class="if-inline-input" id="paramMetaDev" value="${
                    p.meta_indice_devolucao_max_perc ?? 3.5
                }" min="0" max="100" step="0.1" /></td>
            </tr>
            <tr>
                <td><strong>Teto Máximo de CMV / Receita Líquida (%)</strong></td>
                <td>Limite máximo de custo de mercadoria sobre a Receita Líquida.</td>
                <td class="num"><input type="number" class="if-inline-input" id="paramMetaCMV" value="${
                    p.meta_cmv_sobre_rl_max_perc ?? 72.0
                }" min="0" max="100" step="0.1" /></td>
            </tr>
            <tr>
                <td colspan="3" style="text-align:right;padding:12px;">
                    <button type="button" class="if-btn if-btn-green" id="btnSaveParametros">
                        💾 Salvar Parâmetros e Recalcular DRE & Metas
                    </button>
                </td>
            </tr>
        `;

        const btnSave = document.getElementById("btnSaveParametros");
        if (btnSave) {
            btnSave.addEventListener("click", () => {
                const candidate = {
                    aliquota_impostos_perc: Number(document.getElementById("paramImpostos").value),
                    depreciacao_mensal: Number(document.getElementById("paramDepreciacao").value),
                    resultado_financeiro_perc: Number(document.getElementById("paramFinanceiro").value),
                    aliquota_ir_csll_perc: Number(document.getElementById("paramIrpj").value),
                    meta_margem_bruta_perc: Number(document.getElementById("paramMetaMB").value),
                    meta_margem_ebitda_perc: Number(document.getElementById("paramMetaEBITDA").value),
                    meta_margem_liquida_perc: Number(document.getElementById("paramMetaML").value),
                    meta_indice_devolucao_max_perc: Number(document.getElementById("paramMetaDev").value),
                    meta_cmv_sobre_rl_max_perc: Number(document.getElementById("paramMetaCMV").value),
                };
                const check = Engine.validateRecord("parametros_metas", candidate, AppState.dataset);
                if (!check.valid) {
                    showToast("error", "Parâmetros Inválidos", check.errors.join(" "));
                    return;
                }
                AppState.dataset.parametros_metas = candidate;
                persistCurrentState("Parâmetros fiscais e metas da DRE atualizados e recalculados.");
                recalculateAndRenderAll();
            });
        }
    }

    function handleSaveInlineRow(entity, id, tr) {
        if (!tr || !AppState.dataset || !AppState.dataset[entity]) return;
        const list = AppState.dataset[entity];
        const idx = list.findIndex((item) => String(item.id) === String(id));
        if (idx === -1) return;

        const updated = { ...list[idx] };
        const inputs = tr.querySelectorAll("[data-field]");
        inputs.forEach((inp) => {
            const field = inp.getAttribute("data-field");
            if (inp.type === "number") {
                updated[field] = Number(inp.value);
            } else {
                updated[field] = inp.value;
            }
        });

        if (entity === "vendas" || entity === "despesas") {
            const [aStr, mStr] = String(updated.data || "").split("-");
            if (aStr && mStr) {
                updated.ano = Number(aStr);
                updated.mes = Number(mStr);
            }
        }
        if (entity === "vendas") {
            updated.receita_bruta = Engine.round2(updated.receita_bruta);
            updated.descontos = Engine.round2(updated.descontos);
            updated.devolucoes = Engine.round2(updated.devolucoes);
            updated.cmv_bruto = Engine.round2(updated.cmv_bruto);
            updated.cmv_revertido =
                updated.devolucoes > 0 && updated.receita_bruta > 0
                    ? Engine.round2(updated.cmv_bruto * (updated.devolucoes / updated.receita_bruta))
                    : 0.0;
        } else if (entity === "despesas") {
            updated.valor = Engine.round2(updated.valor);
        } else if (entity === "orcamento") {
            updated.valor_orcado = Engine.round2(updated.valor_orcado);
            updated.data = `${updated.ano}-${String(updated.mes).padStart(2, "0")}-01`;
        }

        const validation = Engine.validateRecord(entity, updated, AppState.dataset);
        if (!validation.valid) {
            inputs.forEach((inp) => inp.classList.add("invalid"));
            showToast("error", `Valor Inválido no Registro ${id}`, validation.errors.join(" "));
            return;
        }

        inputs.forEach((inp) => inp.classList.remove("invalid"));
        list[idx] = updated;
        persistCurrentState(`Registro ${id} atualizado com recálculo imediato de KPIs e DRE.`);
        recalculateAndRenderAll();
    }

    function handleDeleteRow(entity, id) {
        if (!AppState.dataset || !AppState.dataset[entity]) return;
        const list = AppState.dataset[entity];
        const item = list.find((r) => String(r.id) === String(id));
        if (!item) return;

        showConfirmModal({
            title: `Excluir Registro ${id}?`,
            message: `Tem certeza de que deseja excluir o registro "${id}" da tabela "${entity}"? Todos os indicadores financeiros, DRE e gráficos serão recalculados imediatamente.`,
            confirmLabel: "Sim, Excluir Registro",
            danger: true,
            onConfirm: () => {
                AppState.dataset[entity] = list.filter((r) => String(r.id) !== String(id));
                persistCurrentState(`Registro ${id} excluído de "${entity}". Indicadores recalculados.`);
                recalculateAndRenderAll();
            },
        });
    }

    // =========================================================================
    // 10. MODO DE APRESENTAÇÃO EXECUTIVA (BOARDROOM MODE)
    // =========================================================================
    function bindPresentationEvents() {
        const btnOpen = document.getElementById("btnPresentationMode");
        const btnClose = document.getElementById("btnPresClose");
        const btnPrev = document.getElementById("btnPresPrev");
        const btnNext = document.getElementById("btnPresNext");
        const btnFullscreen = document.getElementById("btnPresFullscreen");

        if (btnOpen) {
            btnOpen.addEventListener("click", () => {
                AppState.presentationActive = true;
                AppState.presentationSlide = 1;
                const overlay = document.getElementById("presentationOverlay");
                if (overlay) overlay.classList.add("active");
                renderPresentationSlide();
            });
        }

        if (btnClose) {
            btnClose.addEventListener("click", closePresentationMode);
        }

        if (btnPrev) {
            btnPrev.addEventListener("click", () => {
                if (AppState.presentationSlide > 1) {
                    AppState.presentationSlide--;
                    renderPresentationSlide();
                }
            });
        }

        if (btnNext) {
            btnNext.addEventListener("click", () => {
                if (AppState.presentationSlide < AppState.totalSlides) {
                    AppState.presentationSlide++;
                    renderPresentationSlide();
                }
            });
        }

        if (btnFullscreen) {
            btnFullscreen.addEventListener("click", () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }

        document.querySelectorAll("[data-pres-slide]").forEach((dot) => {
            dot.addEventListener("click", () => {
                AppState.presentationSlide = Number(dot.getAttribute("data-pres-slide"));
                renderPresentationSlide();
            });
        });

        window.addEventListener("keydown", (e) => {
            if (!AppState.presentationActive) return;
            if (e.key === "Escape") {
                closePresentationMode();
            } else if (e.key === "ArrowRight") {
                if (AppState.presentationSlide < AppState.totalSlides) {
                    AppState.presentationSlide++;
                    renderPresentationSlide();
                }
            } else if (e.key === "ArrowLeft") {
                if (AppState.presentationSlide > 1) {
                    AppState.presentationSlide--;
                    renderPresentationSlide();
                }
            }
        });
    }

    function closePresentationMode() {
        AppState.presentationActive = false;
        const overlay = document.getElementById("presentationOverlay");
        if (overlay) overlay.classList.remove("active");
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    }

    function renderPresentationSlide() {
        const body = document.getElementById("presentationSlideBody");
        const slideCounter = document.getElementById("presSlideCounter");
        if (!body || !AppState.computed) return;

        const s = AppState.presentationSlide;
        const c = AppState.computed;
        const k = c.kpis;
        const b = c.budgetSummary;

        document.querySelectorAll("[data-pres-slide]").forEach((dot) => {
            dot.classList.toggle("active", Number(dot.getAttribute("data-pres-slide")) === s);
        });
        if (slideCounter) {
            slideCounter.textContent = `Slide ${s} de ${AppState.totalSlides}`;
        }

        const kpiHeaderHtml = `
            <div class="if-pres-kpi-row">
                <div class="if-pres-kpi">
                    <div class="if-pres-kpi-label">Receita Bruta</div>
                    <div class="if-pres-kpi-val">${Engine.formatBRL(k.receita_bruta)}</div>
                    <div class="if-pres-kpi-sub">Aderência Budget: ${Engine.formatPct(b.receita.aderencia_perc)}</div>
                </div>
                <div class="if-pres-kpi">
                    <div class="if-pres-kpi-label">Receita Líquida</div>
                    <div class="if-pres-kpi-val">${Engine.formatBRL(k.receita_liquida)}</div>
                    <div class="if-pres-kpi-sub">Deduções: ${Engine.formatBRL(k.deducoes_totais)}</div>
                </div>
                <div class="if-pres-kpi">
                    <div class="if-pres-kpi-label">Lucro Bruto & Margem</div>
                    <div class="if-pres-kpi-val">${Engine.formatBRL(k.lucro_bruto)}</div>
                    <div class="if-pres-kpi-sub">Margem Bruta: ${Engine.formatPct(k.margem_bruta_perc)}</div>
                </div>
                <div class="if-pres-kpi">
                    <div class="if-pres-kpi-label">EBITDA & Margem</div>
                    <div class="if-pres-kpi-val">${Engine.formatBRL(k.ebitda)}</div>
                    <div class="if-pres-kpi-sub">Margem EBITDA: ${Engine.formatPct(k.margem_ebitda_perc)}</div>
                </div>
            </div>
        `;

        if (s === 1) {
            body.innerHTML = `
                <h2 class="if-pres-slide-title">1. Sumário Executivo & Governança de Metas (Semáforo)</h2>
                ${kpiHeaderHtml}
                <div class="if-pres-chart-box" style="padding:24px;">
                    <h3 style="margin:0 0 14px 0;color:#0A1628;font-size:1rem;">Painel de Controle de Metas Corporativas e Indicadores Chave</h3>
                    <table class="if-table">
                        <thead>
                            <tr>
                                <th>Indicador Estratégico (KPI)</th>
                                <th class="num">Resultado Realizado</th>
                                <th class="num">Meta Corporativa</th>
                                <th>Status de Governança</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${c.semaforo
                                .map(
                                    (sm) => `
                                <tr>
                                    <td><strong>${escapeHtml(sm.kpi)}</strong></td>
                                    <td class="num"><strong>${escapeHtml(sm.valorFormatado)}</strong></td>
                                    <td class="num">${escapeHtml(sm.metaFormatada)}</td>
                                    <td><span class="if-status-badge status-${escapeHtml(sm.status)}">● ${escapeHtml(
                                        sm.status
                                    )}</span></td>
                                </tr>
                            `
                                )
                                .join("")}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (s === 2) {
            body.innerHTML = `
                <h2 class="if-pres-slide-title">2. Evolução Mensal de Receita Líquida, Lucro Bruto e EBITDA</h2>
                ${kpiHeaderHtml}
                <div class="if-pres-chart-box" id="presChartEvolution"></div>
            `;
            Charts.renderEvolutionChart(document.getElementById("presChartEvolution"), c.dreMensal, {
                width: 980,
                height: 360,
            });
        } else if (s === 3) {
            body.innerHTML = `
                <h2 class="if-pres-slide-title">3. Ponte de Resultado (DRE Waterfall) — Da Receita Bruta ao Lucro Líquido</h2>
                ${kpiHeaderHtml}
                <div class="if-pres-chart-box" id="presChartWaterfall"></div>
            `;
            Charts.renderDREWaterfallChart(document.getElementById("presChartWaterfall"), c.kpis, {
                width: 920,
                height: 360,
            });
        } else if (s === 4) {
            body.innerHTML = `
                <h2 class="if-pres-slide-title">4. Aderência Orçamentária — Budget x Actual Consolidado</h2>
                ${kpiHeaderHtml}
                <div class="if-pres-chart-box" id="presChartBudget"></div>
            `;
            Charts.renderBudgetComparisonChart(document.getElementById("presChartBudget"), c.budgetSummary, {
                width: 900,
                height: 350,
            });
        } else if (s === 5) {
            body.innerHTML = `
                <h2 class="if-pres-slide-title">5. Rentabilidade Comercial por Categoria de Produto</h2>
                ${kpiHeaderHtml}
                <div class="if-pres-chart-box" id="presChartCategory" style="width:100%;"></div>
            `;
            Charts.renderCategoryProfitabilityChart(
                document.getElementById("presChartCategory"),
                c.rentabilidadePorCategoria
            );
        }
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initApp);
    } else {
        initApp();
    }
})();
