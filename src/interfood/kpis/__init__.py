"""Módulo de cálculo de KPIs financeiros e indicadores de Controladoria (DADOS SINTÉTICOS)."""
from interfood.kpis.calculators import (
    avaliar_semaforo_kpis,
    calcular_aderencia_orcamentaria,
    calcular_crescimento_yoy,
    calcular_kpis_consolidados,
)

__all__ = [
    "avaliar_semaforo_kpis",
    "calcular_aderencia_orcamentaria",
    "calcular_crescimento_yoy",
    "calcular_kpis_consolidados",
]
