"""
Script: 01_generate_data.py
Descrição: Gera todos os dados sintéticos do projeto INTERFOOD FINANCIAL INTELLIGENCE.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS - Uso exclusivo para demonstração.
"""
import os
import sys
import time
from pathlib import Path

os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Adicionar src ao path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

import pandas as pd
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from interfood.config.settings import format_brl, format_int, format_pct
from interfood.data.generator import gerar_todos_dados, salvar_csvs

console = Console(force_terminal=True, legacy_windows=False)


def exibir_estatisticas(dados: dict[str, pd.DataFrame]) -> None:
    """Exibe painel executivo (Azul-marinho, Branco e Verde) com estatísticas dos dados sintéticos."""
    console.print(
        Panel.fit(
            "[bold white]INTERFOOD FINANCIAL INTELLIGENCE - GERAÇÃO DE DADOS SINTÉTICOS[/bold white]\n"
            "[bold green]AVISO: Todos os dados são 100% SINTÉTICOS e fictícios (Seed=42)[/bold green]",
            style="white on #0A1628",
            border_style="#00A86B",
        )
    )

    tbl_dim = Table(
        title="[bold white]Dimensões Cadastrais (Dados Sintéticos)[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl_dim.add_column("Tabela", style="bold white", justify="left")
    tbl_dim.add_column("Registros", style="bold #00A86B", justify="right")

    for d in ["clientes", "produtos", "departamentos", "vendedores", "plano_contas"]:
        if d in dados:
            tbl_dim.add_row(d, format_int(len(dados[d])))
    console.print(tbl_dim)

    tbl_fat = Table(
        title="[bold white]Tabelas Fato - Histórico 36 Meses (Jan/2022 a Dez/2024)[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl_fat.add_column("Tabela", style="bold white", justify="left")
    tbl_fat.add_column("Registros", style="bold #00A86B", justify="right")
    tbl_fat.add_column("Resumo Financeiro (R$)", style="white", justify="left")

    pedidos = dados["pedidos"]
    itens = dados["itens_pedido"]
    devol = dados["devolucoes"]
    despesas = dados["despesas"]
    orcamento = dados["orcamento"]
    estoque = dados["movimentacao_estoque"]

    tbl_fat.add_row(
        "pedidos",
        format_int(len(pedidos)),
        f"Receita Bruta: {format_brl(pedidos['valor_bruto'].sum())} | Receita Líquida: {format_brl(pedidos['valor_liquido'].sum())}",
    )
    tbl_fat.add_row(
        "itens_pedido",
        format_int(len(itens)),
        f"CMV Total: {format_brl(itens['cmv'].sum())} | Margem Bruta: {format_brl(itens['margem_bruta'].sum())}",
    )
    tbl_fat.add_row(
        "devolucoes",
        format_int(len(devol)),
        f"Devoluções: {format_brl(devol['valor_devolucao'].sum())} ({format_pct(devol['valor_devolucao'].sum() / pedidos['valor_bruto'].sum() * 100)})",
    )
    tbl_fat.add_row(
        "despesas",
        format_int(len(despesas)),
        f"Despesas Operacionais: {format_brl(despesas['valor'].sum())}",
    )
    tbl_fat.add_row(
        "orcamento",
        format_int(len(orcamento)),
        f"Linhas de Budget Mensalizadas (2022-2024)",
    )
    tbl_fat.add_row(
        "movimentacao_estoque",
        format_int(len(estoque)),
        f"Entradas, Saídas e Devoluções de Estoque",
    )
    console.print(tbl_fat)

    tbl_fin = Table(
        title="[bold white]Evolução Anual Sintética (2022 - 2024)[/bold white]",
        box=box.ROUNDED,
        header_style="bold white on #0A1628",
        border_style="#00A86B",
    )
    tbl_fin.add_column("Ano", style="bold white", justify="center")
    tbl_fin.add_column("Pedidos", style="white", justify="right")
    tbl_fin.add_column("Receita Bruta", style="bold #00A86B", justify="right")
    tbl_fin.add_column("Receita Líquida", style="bold #00A86B", justify="right")
    tbl_fin.add_column("CMV", style="white", justify="right")
    tbl_fin.add_column("Lucro Bruto", style="bold #00A86B", justify="right")
    tbl_fin.add_column("Margem Bruta %", style="bold white", justify="right")

    for ano in sorted(pedidos["ano"].unique()):
        df_ano = pedidos[pedidos["ano"] == ano]
        rec_bruta = df_ano["valor_bruto"].sum()
        rec_liq = df_ano["valor_liquido"].sum()
        cmv = df_ano["cmv_total"].sum()
        lucro_b = df_ano["lucro_bruto"].sum()
        mb_perc = (lucro_b / rec_liq * 100) if rec_liq > 0 else 0.0
        tbl_fin.add_row(
            str(ano),
            format_int(len(df_ano)),
            format_brl(rec_bruta),
            format_brl(rec_liq),
            format_brl(cmv),
            format_brl(lucro_b),
            format_pct(mb_perc),
        )
    console.print(tbl_fin)


def main() -> None:
    start_time = time.time()
    dados = gerar_todos_dados()
    salvar_csvs(dados)
    exibir_estatisticas(dados)
    elapsed = time.time() - start_time
    console.print(f"\n[bold #00A86B][OK] Geração concluída com sucesso em {elapsed:.2f}s![/bold #00A86B]\n")


if __name__ == "__main__":
    main()
