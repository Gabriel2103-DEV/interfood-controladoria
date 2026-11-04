/**
 * INTERFOOD FINANCIAL INTELLIGENCE — Motor de Gráficos SVG Interativos Offline
 * ============================================================================
 * Renderiza gráficos executivos vetoriais (SVG) responsivos com tooltips em R$ (pt-BR),
 * zero dependência de CDNs externos (100% funcional offline e no GitHub Pages).
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        const engine = require("./financial-engine.js");
        module.exports = factory(engine);
    } else {
        root.InterfoodCharts = factory(root.InterfoodFinancialEngine);
    }
})(typeof self !== "undefined" ? self : this, function (Engine) {
    "use strict";

    const PALETTE = {
        navy: "#0A1628",
        navyLight: "#1E3A5F",
        green: "#00A86B",
        greenLight: "#10B981",
        blue: "#2563EB",
        amber: "#F59E0B",
        red: "#EF4444",
        slate: "#64748B",
        grid: "#E2E8F0",
        white: "#FFFFFF",
    };

    const CATEGORY_COLORS = [
        "#0A1628",
        "#00A86B",
        "#1E40AF",
        "#0D9488",
        "#F59E0B",
        "#6366F1",
    ];

    function formatCompactBRL(val) {
        const n = Number(val) || 0;
        const abs = Math.abs(n);
        const sign = n < 0 ? "-" : "";
        if (abs >= 1_000_000) {
            return `${sign}R$ ${(abs / 1_000_000).toFixed(2).replace(".", ",")}M`;
        }
        if (abs >= 1_000) {
            return `${sign}R$ ${(abs / 1_000).toFixed(0).replace(".", ",")}k`;
        }
        return Engine.formatBRL(n);
    }

    function ensureTooltipElement() {
        if (typeof document === "undefined") return null;
        let el = document.getElementById("interfood-chart-tooltip");
        if (!el) {
            el = document.createElement("div");
            el.id = "interfood-chart-tooltip";
            el.className = "if-chart-tooltip";
            el.style.display = "none";
            document.body.appendChild(el);
        }
        return el;
    }

    function attachTooltips(container) {
        if (typeof document === "undefined" || !container) return;
        const tooltip = ensureTooltipElement();
        if (!tooltip) return;

        const targets = container.querySelectorAll("[data-tooltip]");
        targets.forEach((t) => {
            t.addEventListener("mouseenter", (e) => {
                const html = t.getAttribute("data-tooltip");
                if (!html) return;
                tooltip.innerHTML = html;
                tooltip.style.display = "block";
                const rect = t.getBoundingClientRect();
                const top = Math.max(10, rect.top + window.scrollY - tooltip.offsetHeight - 10);
                const left = Math.min(
                    window.innerWidth - tooltip.offsetWidth - 16,
                    Math.max(10, rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2)
                );
                tooltip.style.top = `${top}px`;
                tooltip.style.left = `${left}px`;
            });
            t.addEventListener("mousemove", (e) => {
                const top = Math.max(10, e.pageY - tooltip.offsetHeight - 14);
                const left = Math.min(
                    window.innerWidth - tooltip.offsetWidth - 16,
                    Math.max(10, e.pageX - tooltip.offsetWidth / 2)
                );
                tooltip.style.top = `${top}px`;
                tooltip.style.left = `${left}px`;
            });
            t.addEventListener("mouseleave", () => {
                tooltip.style.display = "none";
            });
        });
    }

    /**
     * 1. Gráfico Combinado de Evolução Mensal (Receita Líquida em Barras + Lucro Bruto e EBITDA em Linhas)
     */
    function renderEvolutionChart(container, dreMensal, options = {}) {
        if (!container) return;
        if (!Array.isArray(dreMensal) || dreMensal.length === 0) {
            container.innerHTML = `<div class="if-empty-chart">Nenhum dado disponível para os filtros selecionados.</div>`;
            return;
        }

        const width = options.width || 860;
        const height = options.height || 320;
        const padLeft = 78;
        const padRight = 28;
        const padTop = 34;
        const padBottom = 52;
        const plotW = width - padLeft - padRight;
        const plotH = height - padTop - padBottom;

        const maxVal = Math.max(
            1,
            ...dreMensal.map((d) => Math.max(d.receita_liquida, d.lucro_bruto, d.ebitda))
        );
        const minVal = Math.min(0, ...dreMensal.map((d) => Math.min(0, d.ebitda, d.lucro_liquido)));
        const range = maxVal - minVal || 1;

        const yPos = (val) => padTop + plotH - ((val - minVal) / range) * plotH;
        const zeroY = yPos(0);

        const n = dreMensal.length;
        const stepX = plotW / n;
        const barW = Math.max(6, Math.min(28, stepX * 0.56));

        // Linhas de grade horizontais (5 níveis)
        let gridSvg = "";
        for (let i = 0; i <= 4; i++) {
            const val = minVal + (range * i) / 4;
            const y = yPos(val);
            gridSvg += `
                <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" stroke="${PALETTE.grid}" stroke-dasharray="3,3" />
                <text x="${padLeft - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${PALETTE.slate}">${formatCompactBRL(val)}</text>
            `;
        }

        let barsSvg = "";
        let lbPoints = [];
        let ebitdaPoints = [];
        let dotsSvg = "";
        let xLabelsSvg = "";

        const labelModulo = n > 24 ? 3 : n > 12 ? 2 : 1;

        dreMensal.forEach((d, idx) => {
            const cx = padLeft + idx * stepX + stepX / 2;
            const bx = cx - barW / 2;
            const rlY = yPos(Math.max(0, d.receita_liquida));
            const rlH = Math.max(2, Math.abs(zeroY - rlY));

            const tipHtml =
                `<strong>${d.competenciaLabel} (${d.competencia})</strong><br>` +
                `Receita Bruta: ${Engine.formatBRL(d.receita_bruta)}<br>` +
                `Receita Líquida: <strong>${Engine.formatBRL(d.receita_liquida)}</strong><br>` +
                `Lucro Bruto: ${Engine.formatBRL(d.lucro_bruto)} (${Engine.formatPct(d.margem_bruta_perc)})<br>` +
                `EBITDA: <span style='color:#00A86B;font-weight:bold'>${Engine.formatBRL(d.ebitda)} (${Engine.formatPct(d.margem_ebitda_perc)})</span><br>` +
                `Lucro Líquido: ${Engine.formatBRL(d.lucro_liquido)} (${Engine.formatPct(d.margem_liquida_perc)})`;

            barsSvg += `<rect x="${bx.toFixed(1)}" y="${Math.min(rlY, zeroY).toFixed(1)}" width="${barW.toFixed(1)}" height="${rlH.toFixed(1)}" rx="3" fill="${PALETTE.navy}" opacity="0.88" class="if-svg-interactive" data-tooltip="${tipHtml.replace(/"/g, "&quot;")}" />`;

            const lbY = yPos(d.lucro_bruto);
            const ebY = yPos(d.ebitda);
            lbPoints.push(`${cx.toFixed(1)},${lbY.toFixed(1)}`);
            ebitdaPoints.push(`${cx.toFixed(1)},${ebY.toFixed(1)}`);

            dotsSvg += `
                <circle cx="${cx.toFixed(1)}" cy="${lbY.toFixed(1)}" r="3.5" fill="${PALETTE.blue}" stroke="#fff" stroke-width="1.2" class="if-svg-interactive" data-tooltip="${tipHtml.replace(/"/g, "&quot;")}" />
                <circle cx="${cx.toFixed(1)}" cy="${ebY.toFixed(1)}" r="4" fill="${PALETTE.green}" stroke="#fff" stroke-width="1.5" class="if-svg-interactive" data-tooltip="${tipHtml.replace(/"/g, "&quot;")}" />
            `;

            if (idx % labelModulo === 0 || idx === n - 1) {
                xLabelsSvg += `<text x="${cx.toFixed(1)}" y="${height - 18}" text-anchor="middle" font-size="10.5" fill="${PALETTE.navy}" font-weight="600">${d.competenciaLabel}</text>`;
            }
        });

        const lbPolyline =
            lbPoints.length > 1
                ? `<polyline fill="none" stroke="${PALETTE.blue}" stroke-width="2.4" points="${lbPoints.join(" ")}" />`
                : "";
        const ebPolyline =
            ebitdaPoints.length > 1
                ? `<polyline fill="none" stroke="${PALETTE.green}" stroke-width="2.8" points="${ebitdaPoints.join(" ")}" />`
                : "";

        const legendSvg = `
            <g transform="translate(${padLeft}, 14)">
                <rect x="0" y="-9" width="12" height="12" rx="2" fill="${PALETTE.navy}" />
                <text x="17" y="1" font-size="11.5" fill="${PALETTE.navy}" font-weight="600">Receita Líquida</text>
                <line x1="130" y1="-3" x2="148" y2="-3" stroke="${PALETTE.blue}" stroke-width="2.5" />
                <circle cx="139" cy="-3" r="3.5" fill="${PALETTE.blue}" />
                <text x="154" y="1" font-size="11.5" fill="${PALETTE.navy}" font-weight="600">Lucro Bruto</text>
                <line x1="250" y1="-3" x2="268" y2="-3" stroke="${PALETTE.green}" stroke-width="2.8" />
                <circle cx="259" cy="-3" r="4" fill="${PALETTE.green}" />
                <text x="274" y="1" font-size="11.5" fill="${PALETTE.navy}" font-weight="600">EBITDA</text>
            </g>
        `;

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="if-svg-chart" role="img" aria-label="Evolução Mensal de Receita Líquida, Lucro Bruto e EBITDA">
                ${legendSvg}
                ${gridSvg}
                ${barsSvg}
                ${lbPolyline}
                ${ebPolyline}
                ${dotsSvg}
                ${xLabelsSvg}
            </svg>
        `;
        attachTooltips(container);
    }

    /**
     * 2. Gráfico Waterfall (Bridge) da Estrutura DRE
     */
    function renderDREWaterfallChart(container, kpis, options = {}) {
        if (!container || !kpis) return;
        const width = options.width || 780;
        const height = options.height || 310;
        const padLeft = 78;
        const padRight = 24;
        const padTop = 30;
        const padBottom = 56;
        const plotW = width - padLeft - padRight;
        const plotH = height - padTop - padBottom;

        const steps = [
            { label: "Rec. Bruta", val: kpis.receita_bruta, type: "total", color: PALETTE.navy },
            { label: "(-) Deduções", val: -kpis.deducoes_totais, type: "step", color: PALETTE.amber },
            { label: "Rec. Líquida", val: kpis.receita_liquida, type: "total", color: PALETTE.navyLight },
            { label: "(-) CMV Líq.", val: -kpis.cmv_liquido, type: "step", color: PALETTE.red },
            { label: "Lucro Bruto", val: kpis.lucro_bruto, type: "total", color: PALETTE.blue },
            { label: "(-) SG&A", val: -kpis.despesas_operacionais_totais, type: "step", color: PALETTE.amber },
            { label: "EBITDA", val: kpis.ebitda, type: "total", color: PALETTE.green },
            {
                label: "(-) D&A/Fin/IR",
                val: -(kpis.ebitda - kpis.lucro_liquido),
                type: "step",
                color: PALETTE.slate,
            },
            { label: "Lucro Líq.", val: kpis.lucro_liquido, type: "total", color: PALETTE.green },
        ];

        const maxVal = Math.max(1, kpis.receita_bruta * 1.05);
        const minVal = Math.min(0, kpis.ebitda, kpis.lucro_liquido);
        const range = maxVal - minVal || 1;
        const yPos = (v) => padTop + plotH - ((v - minVal) / range) * plotH;

        let gridSvg = "";
        for (let i = 0; i <= 4; i++) {
            const v = minVal + (range * i) / 4;
            const y = yPos(v);
            gridSvg += `
                <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" stroke="${PALETTE.grid}" stroke-dasharray="3,3" />
                <text x="${padLeft - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${PALETTE.slate}">${formatCompactBRL(v)}</text>
            `;
        }

        const stepX = plotW / steps.length;
        const barW = Math.min(44, stepX * 0.62);
        let running = 0;
        let barsSvg = "";

        steps.forEach((s, idx) => {
            const cx = padLeft + idx * stepX + stepX / 2;
            const bx = cx - barW / 2;
            let topVal, botVal;
            if (s.type === "total") {
                topVal = Math.max(0, s.val);
                botVal = Math.min(0, s.val);
                running = s.val;
            } else {
                const start = running;
                const end = running + s.val;
                topVal = Math.max(start, end);
                botVal = Math.min(start, end);
                running = end;
            }

            const yTop = yPos(topVal);
            const yBot = yPos(botVal);
            const h = Math.max(3, Math.abs(yBot - yTop));
            const pctRL =
                kpis.receita_liquida > 0
                    ? Engine.formatPct((Math.abs(s.val) / kpis.receita_liquida) * 100)
                    : "0,00%";

            const tip =
                `<strong>${s.label}</strong><br>` +
                `Valor: <strong>${Engine.formatBRL(s.val)}</strong><br>` +
                `Representatividade s/ RL: ${pctRL}`;

            barsSvg += `
                <rect x="${bx.toFixed(1)}" y="${Math.min(yTop, yBot).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${s.color}" class="if-svg-interactive" data-tooltip="${tip.replace(/"/g, "&quot;")}" />
                <text x="${cx.toFixed(1)}" y="${(Math.min(yTop, yBot) - 6).toFixed(1)}" text-anchor="middle" font-size="10" fill="${PALETTE.navy}" font-weight="700">${formatCompactBRL(s.val)}</text>
                <text x="${cx.toFixed(1)}" y="${height - 20}" text-anchor="middle" font-size="10.5" fill="${PALETTE.navy}" font-weight="600">${s.label}</text>
            `;
        });

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="if-svg-chart" role="img" aria-label="Ponte Waterfall da DRE">
                ${gridSvg}
                ${barsSvg}
            </svg>
        `;
        attachTooltips(container);
    }

    /**
     * 3. Gráfico Comparativo Budget x Actual (Orçado vs Realizado por Rubrica)
     */
    function renderBudgetComparisonChart(container, budgetSummary, options = {}) {
        if (!container || !budgetSummary) return;
        const width = options.width || 620;
        const height = options.height || 300;
        const padLeft = 78;
        const padRight = 24;
        const padTop = 34;
        const padBottom = 50;
        const plotW = width - padLeft - padRight;
        const plotH = height - padTop - padBottom;

        const groups = [
            {
                label: "Receita Bruta",
                orcado: budgetSummary.receita.orcado,
                realizado: budgetSummary.receita.realizado,
                varPerc: budgetSummary.receita.variacao_perc,
                aderencia: budgetSummary.receita.aderencia_perc,
            },
            {
                label: "CMV Direto",
                orcado: budgetSummary.cmv.orcado,
                realizado: budgetSummary.cmv.realizado,
                varPerc: budgetSummary.cmv.variacao_perc,
                aderencia: budgetSummary.cmv.aderencia_perc,
            },
            {
                label: "Despesas SG&A",
                orcado: budgetSummary.despesas.orcado,
                realizado: budgetSummary.despesas.realizado,
                varPerc: budgetSummary.despesas.variacao_perc,
                aderencia: budgetSummary.despesas.aderencia_perc,
            },
        ];

        const maxVal = Math.max(
            1,
            ...groups.map((g) => Math.max(g.orcado, g.realizado) * 1.12)
        );
        const yPos = (v) => padTop + plotH - (v / maxVal) * plotH;

        let gridSvg = "";
        for (let i = 0; i <= 4; i++) {
            const v = (maxVal * i) / 4;
            const y = yPos(v);
            gridSvg += `
                <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" stroke="${PALETTE.grid}" stroke-dasharray="3,3" />
                <text x="${padLeft - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="${PALETTE.slate}">${formatCompactBRL(v)}</text>
            `;
        }

        const stepX = plotW / groups.length;
        const barW = 36;
        let barsSvg = "";

        groups.forEach((g, idx) => {
            const cx = padLeft + idx * stepX + stepX / 2;
            const yOrc = yPos(g.orcado);
            const hOrc = Math.max(2, padTop + plotH - yOrc);
            const yReal = yPos(g.realizado);
            const hReal = Math.max(2, padTop + plotH - yReal);

            const tip =
                `<strong>${g.label}</strong><br>` +
                `Orçado (Budget): ${Engine.formatBRL(g.orcado)}<br>` +
                `Realizado (Actual): <strong>${Engine.formatBRL(g.realizado)}</strong><br>` +
                `Variação: ${Engine.formatPct(g.varPerc)} | Aderência: ${Engine.formatPct(g.aderencia)}`;

            barsSvg += `
                <rect x="${(cx - barW - 4).toFixed(1)}" y="${yOrc.toFixed(1)}" width="${barW}" height="${hOrc.toFixed(1)}" rx="3" fill="${PALETTE.navy}" class="if-svg-interactive" data-tooltip="${tip.replace(/"/g, "&quot;")}" />
                <text x="${(cx - barW / 2 - 4).toFixed(1)}" y="${(yOrc - 6).toFixed(1)}" text-anchor="middle" font-size="10" fill="${PALETTE.navy}" font-weight="600">${formatCompactBRL(g.orcado)}</text>

                <rect x="${(cx + 4).toFixed(1)}" y="${yReal.toFixed(1)}" width="${barW}" height="${hReal.toFixed(1)}" rx="3" fill="${PALETTE.green}" class="if-svg-interactive" data-tooltip="${tip.replace(/"/g, "&quot;")}" />
                <text x="${(cx + barW / 2 + 4).toFixed(1)}" y="${(yReal - 6).toFixed(1)}" text-anchor="middle" font-size="10" fill="${PALETTE.green}" font-weight="700">${formatCompactBRL(g.realizado)}</text>

                <text x="${cx.toFixed(1)}" y="${height - 22}" text-anchor="middle" font-size="11.5" fill="${PALETTE.navy}" font-weight="700">${g.label}</text>
                <text x="${cx.toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="10" fill="${PALETTE.slate}">Aderência: ${Engine.formatPct(g.aderencia)}</text>
            `;
        });

        const legendSvg = `
            <g transform="translate(${padLeft}, 14)">
                <rect x="0" y="-9" width="12" height="12" rx="2" fill="${PALETTE.navy}" />
                <text x="17" y="1" font-size="11.5" fill="${PALETTE.navy}" font-weight="600">Orçado (Budget)</text>
                <rect x="135" y="-9" width="12" height="12" rx="2" fill="${PALETTE.green}" />
                <text x="152" y="1" font-size="11.5" fill="${PALETTE.navy}" font-weight="600">Realizado (Actual)</text>
            </g>
        `;

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="if-svg-chart" role="img" aria-label="Comparativo Budget vs Actual">
                ${legendSvg}
                ${gridSvg}
                ${barsSvg}
            </svg>
        `;
        attachTooltips(container);
    }

    /**
     * 4. Gráfico Horizontal de Rentabilidade por Categoria
     */
    function renderCategoryProfitabilityChart(container, categoriasList) {
        if (!container) return;
        if (!Array.isArray(categoriasList) || categoriasList.length === 0) {
            container.innerHTML = `<div class="if-empty-chart">Sem categorias para exibir.</div>`;
            return;
        }

        const maxRec = Math.max(1, ...categoriasList.map((c) => c.receita_bruta));
        let html = `<div class="if-horiz-bars">`;

        categoriasList.forEach((c, idx) => {
            const pctWidth = Math.max(4, (c.receita_bruta / maxRec) * 100);
            const margWidth = Math.max(2, (c.margem_bruta_valor / maxRec) * 100);
            const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
            const tip =
                `<strong>${c.categoria}</strong><br>` +
                `Receita Bruta: ${Engine.formatBRL(c.receita_bruta)} (${Engine.formatPct(c.share_receita_perc)} do total)<br>` +
                `CMV Líquido: ${Engine.formatBRL(c.cmv_liquido)}<br>` +
                `Margem Bruta Comercial: <strong>${Engine.formatBRL(c.margem_bruta_valor)} (${Engine.formatPct(c.margem_bruta_perc)})</strong>`;

            html += `
                <div class="if-hbar-row if-svg-interactive" data-tooltip="${tip.replace(/"/g, "&quot;")}">
                    <div class="if-hbar-header">
                        <span class="if-hbar-title"><span class="if-dot" style="background:${color}"></span>${c.categoria}</span>
                        <span class="if-hbar-meta">
                            <strong>${Engine.formatBRL(c.receita_bruta)}</strong>
                            <span class="if-badge-green">MB: ${Engine.formatPct(c.margem_bruta_perc)}</span>
                        </span>
                    </div>
                    <div class="if-hbar-track">
                        <div class="if-hbar-fill-rec" style="width:${pctWidth.toFixed(1)}%;background:${PALETTE.navy}"></div>
                        <div class="if-hbar-fill-marg" style="width:${margWidth.toFixed(1)}%;background:${PALETTE.green}"></div>
                    </div>
                    <div class="if-hbar-sub">
                        <span>Margem Bruta: <strong>${Engine.formatBRL(c.margem_bruta_valor)}</strong></span>
                        <span>Share Receita: ${Engine.formatPct(c.share_receita_perc)}</span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
        attachTooltips(container);
    }

    return {
        renderEvolutionChart,
        renderDREWaterfallChart,
        renderBudgetComparisonChart,
        renderCategoryProfitabilityChart,
    };
});
