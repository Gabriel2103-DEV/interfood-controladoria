"""
Testes dos KPIs Financeiros, Metas de Controladoria e Crescimento (ETAPA 5).
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from pathlib import Path
from interfood.kpis.calculators import (
    avaliar_semaforo_kpis,
    calcular_aderencia_orcamentaria,
    calcular_crescimento_yoy,
    calcular_kpis_consolidados,
)


def test_margens_em_intervalos_realistas(ensure_database_populated: Path) -> None:
    """Verifica se Margem Bruta, EBITDA e Líquida estão em faixas realistas do setor atacadista."""
    kpis = calcular_kpis_consolidados(db_path=ensure_database_populated)
    assert 20.0 <= kpis["margem_bruta_perc"] <= 45.0
    assert 5.0 <= kpis["margem_ebitda_perc"] <= 35.0
    assert 2.0 <= kpis["margem_liquida_perc"] <= 28.0


def test_ticket_medio_e_indice_devolucao(ensure_database_populated: Path) -> None:
    """Verifica se o ticket médio é positivo e o índice de devolução é controlado (< 5%)."""
    kpis = calcular_kpis_consolidados(db_path=ensure_database_populated)
    assert kpis["ticket_medio"] > 500.0
    assert 0.5 <= kpis["indice_devolucao_perc"] <= 5.0


def test_crescimento_anual_positivo_2023_e_2024(ensure_database_populated: Path) -> None:
    """Garante crescimento YoY positivo tanto em 2023 vs 2022 quanto em 2024 vs 2023."""
    yoy = calcular_crescimento_yoy(db_path=ensure_database_populated)
    assert yoy["crescimento_receita_bruta_2023_vs_2022_perc"] > 5.0
    assert yoy["crescimento_receita_bruta_2024_vs_2023_perc"] > 8.0
    assert yoy["crescimento_ebitda_2023_vs_2022_perc"] > 5.0
    assert yoy["crescimento_ebitda_2024_vs_2023_perc"] > 8.0


def test_aderencia_orcamentaria_dentro_da_banda(ensure_database_populated: Path) -> None:
    """Verifica se a aderência ao orçamento (Realizado / Orçado) está entre 90% e 110%."""
    orc = calcular_aderencia_orcamentaria(db_path=ensure_database_populated)
    assert 90.0 <= orc["receita_aderencia_perc"] <= 110.0
    assert 90.0 <= orc["custo_aderencia_perc"] <= 110.0
    assert 90.0 <= orc["despesa_aderencia_perc"] <= 110.0


def test_semaforo_kpis_estrutura(ensure_database_populated: Path) -> None:
    """Verifica se o avaliador de semáforo retorna status válidos para os 5 KPIs chave."""
    kpis = calcular_kpis_consolidados(db_path=ensure_database_populated)
    semaforo = avaliar_semaforo_kpis(kpis)
    assert len(semaforo) == 5
    for item in semaforo:
        assert item["status"] in ("VERDE", "AMARELO", "VERMELHO")
