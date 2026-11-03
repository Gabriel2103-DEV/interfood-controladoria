"""
Script: 04_relatorio_executivo.py
Descrição: Gera o Relatório Executivo de Controladoria no terminal (Rich) e exporta
o Dashboard Executivo HTML e CSVs analíticos em data/exports/ com identidade visual
azul-marinho (#0A1628), branco (#FFFFFF) e verde (#00A86B), valores em R$ e formatação pt-BR.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
import os
import sys
from pathlib import Path

os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

import pandas as pd
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from interfood.config.settings import (
    DB_PATH,
    EXPORTS_DIR,
    format_brl,
    format_int,
    format_pct,
)
from interfood.database.queries import (
    get_desempenho_categorias,
    get_dre_anual,
    get_resumo_orcado_vs_realizado,
    get_top_clientes,
    get_top_produtos_margem,
)
from interfood.etl.pipeline import ETLPipeline
from interfood.kpis.calculators import (
    avaliar_semaforo_kpis,
    calcular_aderencia_orcamentaria,
    calcular_crescimento_yoy,
    calcular_kpis_consolidados,
)

console = Console(force_terminal=True, legacy_windows=False)


def gerar_html_executivo(
    kpis_global: dict[str, float],
    yoy: dict[str, float],
    dre_anual: pd.DataFrame,
    top_clientes: pd.DataFrame,
    top_produtos: pd.DataFrame,
    categorias_df: pd.DataFrame,
    semaforo: list[dict[str, str]],
) -> Path:
    """Exporta um Dashboard HTML executivo auto-contido com paleta Azul-Marinho, Branco e Verde."""
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    html_path = EXPORTS_DIR / "relatorio_executivo_interfood.html"

    linhas_dre = ""
    for _, r in dre_anual.iterrows():
        linhas_dre += f"""
        <tr>
            <td><strong>{int(r['ano'])}</strong></td>
            <td class="num">{format_int(r['qtd_pedidos'])}</td>
            <td class="num">{format_brl(r['receita_bruta'])}</td>
            <td class="num">{format_brl(r['deducoes_totais'])}</td>
            <td class="num"><strong>{format_brl(r['receita_liquida'])}</strong></td>
            <td class="num">{format_brl(r['cmv_liquido'])}</td>
            <td class="num">{format_brl(r['lucro_bruto'])} ({format_pct(r['margem_bruta_perc'])})</td>
            <td class="num">{format_brl(r['despesas_operacionais_totais'])}</td>
            <td class="num highlight">{format_brl(r['ebitda'])} ({format_pct(r['margem_ebitda_perc'])})</td>
            <td class="num highlight">{format_brl(r['lucro_liquido'])} ({format_pct(r['margem_liquida_perc'])})</td>
        </tr>
        """

    linhas_semaforo = ""
    for s in semaforo:
        badge_color = "#00A86B" if s["status"] == "VERDE" else ("#F59E0B" if s["status"] == "AMARELO" else "#EF4444")
        linhas_semaforo += f"""
        <tr>
            <td><strong>{s['kpi']}</strong></td>
            <td class="num">{s['valor']}</td>
            <td class="num">{s['meta']}</td>
            <td style="text-align:center;"><span style="background:{badge_color};color:#FFFFFF;padding:4px 12px;border-radius:12px;font-weight:bold;font-size:12px;">{s['status']}</span></td>
        </tr>
        """

    linhas_clientes = ""
    for idx, (_, c) in enumerate(top_clientes.iterrows(), 1):
        linhas_clientes += f"""
        <tr>
            <td>{idx}º</td>
            <td>{c['razao_social']}</td>
            <td>{c['segmento']}</td>
            <td>{c['estado']}</td>
            <td class="num">{format_int(c['total_pedidos'])}</td>
            <td class="num"><strong>{format_brl(c['receita_bruta'])}</strong></td>
            <td class="num">{format_pct(c['margem_bruta_perc'])}</td>
        </tr>
        """

    linhas_produtos = ""
    for idx, (_, p) in enumerate(top_produtos.iterrows(), 1):
        linhas_produtos += f"""
        <tr>
            <td>{idx}º</td>
            <td><code>{p['sku']}</code></td>
            <td>{p['produto_nome']}</td>
            <td>{p['categoria']}</td>
            <td class="num">{format_int(p['quantidade_vendida'])}</td>
            <td class="num">{format_brl(p['receita_bruta'])}</td>
            <td class="num highlight">{format_brl(p['margem_bruta_valor'])} ({format_pct(p['margem_bruta_perc'])})</td>
        </tr>
        """

    html_content = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>INTERFOOD FINANCIAL INTELLIGENCE — Relatório Executivo (Dados Sintéticos)</title>
    <style>
        body {{
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #F4F6F9;
            color: #0A1628;
            margin: 0;
            padding: 0;
        }}
        header {{
            background-color: #0A1628;
            color: #FFFFFF;
            padding: 28px 40px;
            border-bottom: 5px solid #00A86B;
        }}
        header h1 {{
            margin: 0;
            font-size: 26px;
            letter-spacing: 0.5px;
        }}
        header p {{
            margin: 8px 0 0 0;
            color: #00A86B;
            font-weight: 600;
            font-size: 14px;
        }}
        .container {{
            max-width: 1280px;
            margin: 28px auto;
            padding: 0 24px 40px 24px;
        }}
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 18px;
            margin-bottom: 30px;
        }}
        .kpi-card {{
            background: #FFFFFF;
            border-top: 4px solid #00A86B;
            border-radius: 8px;
            padding: 18px 20px;
            box-shadow: 0 2px 8px rgba(10, 22, 40, 0.08);
        }}
        .kpi-card .label {{
            font-size: 12px;
            text-transform: uppercase;
            color: #4A5568;
            font-weight: 700;
        }}
        .kpi-card .value {{
            font-size: 22px;
            font-weight: 800;
            color: #0A1628;
            margin-top: 6px;
        }}
        .kpi-card .sub {{
            font-size: 12px;
            color: #00A86B;
            font-weight: 600;
            margin-top: 4px;
        }}
        .section-card {{
            background: #FFFFFF;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 28px;
            box-shadow: 0 2px 8px rgba(10, 22, 40, 0.08);
        }}
        .section-card h2 {{
            margin-top: 0;
            font-size: 18px;
            color: #0A1628;
            border-left: 4px solid #00A86B;
            padding-left: 12px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
            margin-top: 12px;
        }}
        th {{
            background-color: #0A1628;
            color: #FFFFFF;
            text-align: left;
            padding: 10px 12px;
            font-weight: 600;
        }}
        td {{
            padding: 9px 12px;
            border-bottom: 1px solid #E2E8F0;
        }}
        tr:nth-child(even) {{
            background-color: #F8FAFC;
        }}
        .num {{
            text-align: right;
            font-variant-numeric: tabular-nums;
        }}
        .highlight {{
            color: #00A86B;
            font-weight: 700;
        }}
        footer {{
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #4A5568;
            background: #FFFFFF;
            border-top: 2px solid #00A86B;
        }}
    </style>
</head>
<body>
    <header>
        <h1>INTERFOOD FINANCIAL INTELLIGENCE — PAINEL EXECUTIVO DE CONTROLADORIA</h1>
        <p>AVISO LEGAL: DADOS 100% SINTÉTICOS E FICTÍCIOS (SEED=42) | PERÍODO: JAN/2022 A DEZ/2024 (36 MESES)</p>
    </header>
    <div class="container">
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="label">Receita Bruta (36M)</div>
                <div class="value">{format_brl(kpis_global['receita_bruta'])}</div>
                <div class="sub">YoY 2024 vs 2023: +{format_pct(yoy['crescimento_receita_bruta_2024_vs_2023_perc'])}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Receita Líquida (36M)</div>
                <div class="value">{format_brl(kpis_global['receita_liquida'])}</div>
                <div class="sub">{format_int(kpis_global['total_pedidos'])} pedidos faturados</div>
            </div>
            <div class="kpi-card">
                <div class="label">Lucro Bruto (36M)</div>
                <div class="value">{format_brl(kpis_global['lucro_bruto'])}</div>
                <div class="sub">Margem Bruta: {format_pct(kpis_global['margem_bruta_perc'])}</div>
            </div>
            <div class="kpi-card">
                <div class="label">EBITDA Operacional (36M)</div>
                <div class="value">{format_brl(kpis_global['ebitda'])}</div>
                <div class="sub">Margem EBITDA: {format_pct(kpis_global['margem_ebitda_perc'])}</div>
            </div>
            <div class="kpi-card">
                <div class="label">Lucro Líquido (36M)</div>
                <div class="value">{format_brl(kpis_global['lucro_liquido'])}</div>
                <div class="sub">Margem Líquida: {format_pct(kpis_global['margem_liquida_perc'])}</div>
            </div>
        </div>

        <div class="section-card">
            <h2>1. Demonstração do Resultado do Exercício Consolidada (DRE 2022–2024) — Dados Sintéticos</h2>
            <table>
                <thead>
                    <tr>
                        <th>Ano</th>
                        <th class="num">Pedidos</th>
                        <th class="num">Receita Bruta</th>
                        <th class="num">(-) Deduções</th>
                        <th class="num">(=) Receita Líquida</th>
                        <th class="num">(-) CMV Líquido</th>
                        <th class="num">(=) Lucro Bruto</th>
                        <th class="num">(-) Despesas SG&A</th>
                        <th class="num">(=) EBITDA</th>
                        <th class="num">(=) Lucro Líquido</th>
                    </tr>
                </thead>
                <tbody>
                    {linhas_dre}
                </tbody>
            </table>
        </div>

        <div class="section-card">
            <h2>2. Semáforo de Metas de Controladoria (36 Meses)</h2>
            <table>
                <thead>
                    <tr>
                        <th>Indicador Chave (KPI)</th>
                        <th class="num">Realizado</th>
                        <th class="num">Meta Corporativa</th>
                        <th style="text-align:center;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {linhas_semaforo}
                </tbody>
            </table>
        </div>

        <div class="section-card">
            <h2>3. Top 10 Clientes por Receita Bruta (Dados Sintéticos)</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Cliente (Fictício)</th>
                        <th>Segmento</th>
                        <th>UF</th>
                        <th class="num">Pedidos</th>
                        <th class="num">Receita Bruta</th>
                        <th class="num">Margem Bruta %</th>
                    </tr>
                </thead>
                <tbody>
                    {linhas_clientes}
                </tbody>
            </table>
        </div>

        <div class="section-card">
            <h2>4. Top 10 Produtos por Geração de Margem Bruta (Dados Sintéticos)</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>SKU</th>
                        <th>Produto</th>
                        <th>Categoria</th>
                        <th class="num">Qtd. Vendida</th>
                        <th class="num">Receita Bruta</th>
                        <th class="num">Margem Bruta (R$ / %)</th>
                    </tr>
                </thead>
                <tbody>
                    {linhas_produtos}
                </tbody>
            </table>
        </div>
    </div>
    <footer>
        INTERFOOD FINANCIAL INTELLIGENCE v1.0.0 | Case Fictício de Controladoria e Ciência de Dados | Dados 100% Sintéticos (Seed=42)
    </footer>
</body>
</html>
"""
    html_path.write_text(html_content, encoding="utf-8")
    return html_path


def main() -> None:
    if not DB_PATH.exists():
        ETLPipeline(db_path=DB_PATH, auto_generate_if_missing=True).run()

    kpis_global = calcular_kpis_consolidados()
    yoy = calcular_crescimento_yoy()
    orc_aderencia = calcular_aderencia_orcamentaria()
    semaforo = avaliar_semaforo_kpis(kpis_global)
    dre_anual = get_dre_anual()
    top_clientes = get_top_clientes(10)
    top_produtos = get_top_produtos_margem(10)
    categorias_df = get_desempenho_categorias()
    orc_resumo = get_resumo_orcado_vs_realizado()

    console.print(
        Panel.fit(
            "[bold white]INTERFOOD FINANCIAL INTELLIGENCE — RELATÓRIO EXECUTIVO DE CONTROLADORIA[/bold white]\n"
            "[bold #00A86B]Período Analisado: Janeiro/2022 a Dezembro/2024 (36 Meses) | DADOS 100% SINTÉTICOS[/bold #00A86B]",
            style="white on #0A1628",
            border_style="#00A86B",
        )
    )

    # 1. Tabela DRE Anual
    tbl_dre = Table(
        title="[bold white]1. DRE Consolidada Anual (2022 - 2024) — Valores em R$[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl_dre.add_column("Ano", style="bold white", justify="center")
    tbl_dre.add_column("Receita Bruta", style="white", justify="right")
    tbl_dre.add_column("Receita Líquida", style="bold white", justify="right")
    tbl_dre.add_column("CMV Líquido", style="white", justify="right")
    tbl_dre.add_column("Lucro Bruto", style="bold #00A86B", justify="right")
    tbl_dre.add_column("MB %", style="white", justify="right")
    tbl_dre.add_column("Despesas SG&A", style="white", justify="right")
    tbl_dre.add_column("EBITDA", style="bold #00A86B", justify="right")
    tbl_dre.add_column("EBITDA %", style="white", justify="right")
    tbl_dre.add_column("Lucro Líquido", style="bold #00A86B", justify="right")
    tbl_dre.add_column("ML %", style="bold white", justify="right")

    for _, r in dre_anual.iterrows():
        tbl_dre.add_row(
            str(int(r["ano"])),
            format_brl(r["receita_bruta"]),
            format_brl(r["receita_liquida"]),
            format_brl(r["cmv_liquido"]),
            format_brl(r["lucro_bruto"]),
            format_pct(r["margem_bruta_perc"]),
            format_brl(r["despesas_operacionais_totais"]),
            format_brl(r["ebitda"]),
            format_pct(r["margem_ebitda_perc"]),
            format_brl(r["lucro_liquido"]),
            format_pct(r["margem_liquida_perc"]),
        )
    console.print(tbl_dre)

    # 2. Tabela Semáforo de KPIs
    tbl_sem = Table(
        title="[bold white]2. Semáforo de KPIs Estratégicos (Consolidado 36 Meses)[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl_sem.add_column("Indicador (KPI)", style="bold white")
    tbl_sem.add_column("Valor Apurado", style="bold #00A86B", justify="right")
    tbl_sem.add_column("Meta Controladoria", style="white", justify="right")
    tbl_sem.add_column("Semáforo", style="bold white", justify="center")

    for item in semaforo:
        cor = "#00A86B" if item["status"] == "VERDE" else ("yellow" if item["status"] == "AMARELO" else "red")
        tbl_sem.add_row(item["kpi"], item["valor"], item["meta"], f"[bold {cor}]{item['status']}[/bold {cor}]")
    console.print(tbl_sem)

    # 3. Top 10 Clientes
    tbl_cli = Table(
        title="[bold white]3. Top 10 Clientes por Receita Bruta (Dados Sintéticos)[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl_cli.add_column("#", justify="right", style="white")
    tbl_cli.add_column("Cliente ID", style="white")
    tbl_cli.add_column("Razão Social Fictícia", style="bold white")
    tbl_cli.add_column("Segmento", style="white")
    tbl_cli.add_column("UF", justify="center", style="white")
    tbl_cli.add_column("Pedidos", justify="right", style="white")
    tbl_cli.add_column("Receita Bruta", justify="right", style="bold #00A86B")
    tbl_cli.add_column("Margem %", justify="right", style="white")

    for idx, (_, c) in enumerate(top_clientes.iterrows(), 1):
        tbl_cli.add_row(
            f"{idx}º",
            str(c["cliente_id"]),
            str(c["razao_social"]),
            str(c["segmento"]),
            str(c["estado"]),
            format_int(c["total_pedidos"]),
            format_brl(c["receita_bruta"]),
            format_pct(c["margem_bruta_perc"]),
        )
    console.print(tbl_cli)

    # 4. Top 10 Produtos por Margem
    tbl_prd = Table(
        title="[bold white]4. Top 10 Produtos por Margem Bruta Acumulada (Dados Sintéticos)[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl_prd.add_column("#", justify="right", style="white")
    tbl_prd.add_column("SKU", style="white")
    tbl_prd.add_column("Produto", style="bold white")
    tbl_prd.add_column("Categoria", style="white")
    tbl_prd.add_column("Qtd. Vendida", justify="right", style="white")
    tbl_prd.add_column("Receita Bruta", justify="right", style="white")
    tbl_prd.add_column("Margem Bruta (R$)", justify="right", style="bold #00A86B")
    tbl_prd.add_column("Margem %", justify="right", style="bold white")

    for idx, (_, p) in enumerate(top_produtos.iterrows(), 1):
        tbl_prd.add_row(
            f"{idx}º",
            str(p["sku"]),
            str(p["produto_nome"]),
            str(p["categoria"]),
            format_int(p["quantidade_vendida"]),
            format_brl(p["receita_bruta"]),
            format_brl(p["margem_bruta_valor"]),
            format_pct(p["margem_bruta_perc"]),
        )
    console.print(tbl_prd)

    # 5. Aderência Orçamentária
    tbl_orc = Table(
        title="[bold white]5. Resumo Orçado vs Realizado (36 Meses Consolidado)[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl_orc.add_column("Grupo Contábil", style="bold white")
    tbl_orc.add_column("Orçado (Budget)", justify="right", style="white")
    tbl_orc.add_column("Realizado (Actual)", justify="right", style="bold #00A86B")
    tbl_orc.add_column("Variação (%)", justify="right", style="white")
    tbl_orc.add_column("Aderência (%)", justify="right", style="bold white")

    for grp, label in [("receita", "Receita Bruta"), ("custo", "CMV Direto"), ("despesa", "Despesas Operacionais (SG&A)")]:
        tbl_orc.add_row(
            label,
            format_brl(orc_aderencia.get(f"{grp}_orcado", 0.0)),
            format_brl(orc_aderencia.get(f"{grp}_realizado", 0.0)),
            format_pct(orc_aderencia.get(f"{grp}_variacao_perc", 0.0)),
            format_pct(orc_aderencia.get(f"{grp}_aderencia_perc", 0.0)),
        )
    console.print(tbl_orc)

    # Exportar artefatos executivos
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    dre_anual.to_csv(EXPORTS_DIR / "dre_anual_sintetica.csv", index=False, encoding="utf-8")
    orc_resumo.to_csv(EXPORTS_DIR / "orcado_vs_realizado_anual.csv", index=False, encoding="utf-8")
    html_file = gerar_html_executivo(
        kpis_global, yoy, dre_anual, top_clientes, top_produtos, categorias_df, semaforo
    )

    console.print(
        Panel(
            f"[bold white]Artefatos Executivos Exportados:[/bold white]\n"
            f"  • Dashboard HTML: [bold #00A86B]{html_file}[/bold #00A86B]\n"
            f"  • DRE Anual CSV:  [bold #00A86B]{EXPORTS_DIR / 'dre_anual_sintetica.csv'}[/bold #00A86B]\n"
            f"  • Budget CSV:     [bold #00A86B]{EXPORTS_DIR / 'orcado_vs_realizado_anual.csv'}[/bold #00A86B]",
            style="white on #0A1628",
            border_style="#00A86B",
        )
    )


if __name__ == "__main__":
    main()
