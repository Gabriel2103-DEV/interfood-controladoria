"""
Orquestrador do Pipeline ETL do INTERFOOD FINANCIAL INTELLIGENCE.
Executa Extract -> Transform -> Validate -> Load -> Report com logs estruturados,
tratamento de exceções e idempotência.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from pathlib import Path
import time
import pandas as pd
from loguru import logger

from interfood.config.settings import DB_PATH, LOGS_DIR, PROCESSED_DIR, RAW_DIR
from interfood.data.generator import gerar_todos_dados, salvar_csvs
from interfood.etl.extract import extract_all
from interfood.etl.load import load_all_to_duckdb
from interfood.etl.transform import transform_all

LOG_FILE = LOGS_DIR / "etl_pipeline.log"
logger.add(
    LOG_FILE,
    rotation="5 MB",
    retention="10 days",
    level="INFO",
    encoding="utf-8",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {message}",
)


class ETLPipeline:
    """Pipeline ETL corporativo idempotente para o Data Mart de Controladoria."""

    def __init__(
        self,
        raw_dir: Path = RAW_DIR,
        processed_dir: Path = PROCESSED_DIR,
        db_path: Path = DB_PATH,
        auto_generate_if_missing: bool = True,
    ) -> None:
        self.raw_dir = Path(raw_dir)
        self.processed_dir = Path(processed_dir)
        self.db_path = Path(db_path)
        self.auto_generate_if_missing = auto_generate_if_missing
        self.raw_data: dict[str, pd.DataFrame] = {}
        self.transformed_data: dict[str, pd.DataFrame] = {}
        self.loaded_counts: dict[str, int] = {}
        self.metrics: dict[str, float] = {}

    def ensure_raw_data(self) -> None:
        """Verifica se os CSVs brutos existem; se não existirem e auto_generate=True, gera-os."""
        pedidos_csv = self.raw_dir / "pedidos.csv"
        if not pedidos_csv.exists() and self.auto_generate_if_missing:
            logger.warning("[PIPELINE] CSVs brutos ausentes em data/raw/. Gerando dados sintéticos automaticamente...")
            dados = gerar_todos_dados()
            salvar_csvs(dados, diretorio=self.raw_dir)

    def extract(self) -> None:
        t0 = time.perf_counter()
        self.ensure_raw_data()
        self.raw_data = extract_all(self.raw_dir)
        self.metrics["extract_sec"] = round(time.perf_counter() - t0, 3)

    def transform(self) -> None:
        t0 = time.perf_counter()
        self.transformed_data = transform_all(self.raw_data, self.processed_dir)
        self.metrics["transform_sec"] = round(time.perf_counter() - t0, 3)

    def load(self) -> None:
        t0 = time.perf_counter()
        self.loaded_counts = load_all_to_duckdb(self.transformed_data, self.db_path)
        self.metrics["load_sec"] = round(time.perf_counter() - t0, 3)

    def run(self) -> dict[str, int]:
        """Executa o pipeline ETL de ponta a ponta com tratamento de erros."""
        start_total = time.perf_counter()
        logger.info("=" * 70)
        logger.info("INICIANDO PIPELINE ETL - INTERFOOD FINANCIAL INTELLIGENCE (SINTÉTICO)")
        logger.info("=" * 70)
        try:
            self.extract()
            self.transform()
            self.load()
            self.metrics["total_sec"] = round(time.perf_counter() - start_total, 3)
            logger.info(
                f"PIPELINE ETL CONCLUÍDO COM SUCESSO em {self.metrics['total_sec']}s | "
                f"Total registros carregados: {sum(self.loaded_counts.values()):,}"
            )
            return self.loaded_counts
        except Exception as exc:
            logger.exception(f"FALHA CRÍTICA NO PIPELINE ETL: {exc}")
            raise
