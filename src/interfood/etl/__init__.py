"""Módulo de pipeline ETL (Extração, Transformação e Carga) - DADOS SINTÉTICOS."""
from interfood.etl.extract import extract_all, extract_dataset, validate_schema
from interfood.etl.load import load_all_to_duckdb
from interfood.etl.pipeline import ETLPipeline
from interfood.etl.transform import build_dim_tempo, transform_all, validate_financial_consistency

__all__ = [
    "ETLPipeline",
    "build_dim_tempo",
    "extract_all",
    "extract_dataset",
    "load_all_to_duckdb",
    "transform_all",
    "validate_financial_consistency",
    "validate_schema",
]
