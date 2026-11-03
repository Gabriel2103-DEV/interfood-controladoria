"""Configurações centralizadas do projeto INTERFOOD FINANCIAL INTELLIGENCE.

ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS - Uso exclusivo para demonstração
de Controladoria e Ciência de Dados. Nenhuma relação com dados reais da Interfood.
"""
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = ROOT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
EXPORTS_DIR = DATA_DIR / "exports"
LOGS_DIR = ROOT_DIR / "logs"
DB_PATH = DATA_DIR / "interfood.duckdb"

SEED = 42
START_DATE = "2022-01-01"
END_DATE = "2024-12-31"
N_MONTHS = 36

# Garantir que os diretórios existam
for _d in [DATA_DIR, RAW_DIR, PROCESSED_DIR, EXPORTS_DIR, LOGS_DIR]:
    _d.mkdir(parents=True, exist_ok=True)

# Identidade visual executiva (Azul-marinho, Branco e Verde)
COLORS = {
    "azul_marinho": "#0A1628",
    "branco": "#FFFFFF",
    "verde": "#00A86B",
    "cinza_claro": "#F4F6F9",
    "alerta_amarelo": "#F59E0B",
    "alerta_vermelho": "#EF4444",
}

# Sazonalidade mensal (multiplicadores de demanda)
SAZONALIDADE = {
    1: 0.72,   # Janeiro - retração pós-festas
    2: 0.75,   # Fevereiro - baixa sazonal
    3: 0.88,   # Março - retomada
    4: 0.90,   # Abril - Páscoa / outono
    5: 0.95,   # Maio - Dia das Mães
    6: 1.15,   # Junho - pico (festas juninas / inverno)
    7: 0.92,   # Julho - férias escolares
    8: 0.93,   # Agosto - Dia dos Pais
    9: 0.97,   # Setembro - início primavera
    10: 1.02,  # Outubro - aquecimento 4T
    11: 1.18,  # Novembro - Black Friday / abastecimento pré-natal
    12: 1.35,  # Dezembro - pico máximo (Natal e Réveillon)
}

# Crescimento anual composto (base 2022 = 1.00)
CRESCIMENTO_ANUAL = {
    2022: 1.00,
    2023: 1.12,         # +12% vs 2022
    2024: 1.12 * 1.15,  # +15% vs 2023 (1.288 acumulado)
}


def format_brl(valor: float, simbolo: bool = True) -> str:
    """Formata um valor numérico no padrão monetário brasileiro (R$ 1.234.567,89)."""
    if valor is None:
        return "R$ 0,00" if simbolo else "0,00"
    negativo = valor < 0
    val_abs = abs(float(valor))
    inteiro = int(val_abs)
    centavos = int(round((val_abs - inteiro) * 100))
    if centavos == 100:
        inteiro += 1
        centavos = 0
    str_inteiro = f"{inteiro:,}".replace(",", ".")
    prefixo = "R$ " if simbolo else ""
    sinal = "-" if negativo else ""
    return f"{sinal}{prefixo}{str_inteiro},{centavos:02d}"


def format_pct(valor: float, casas: int = 2) -> str:
    """Formata um percentual no padrão brasileiro (ex: 12,34%)."""
    if valor is None:
        return "0,00%"
    formato = f"{float(valor):.{casas}f}".replace(".", ",")
    return f"{formato}%"


def format_int(valor: int | float) -> str:
    """Formata um número inteiro com separador de milhar brasileiro (ex: 15.420)."""
    if valor is None:
        return "0"
    return f"{int(round(valor)):,}".replace(",", ".")
