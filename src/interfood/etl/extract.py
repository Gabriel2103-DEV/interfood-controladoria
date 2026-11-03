"""
Módulo de Extração (Extract) do Pipeline ETL.
Lê os arquivos CSV brutos de data/raw/ e valida schemas e colunas obrigatórias.
ATENÇÃO: DADOS 100% SINTÉTICOS E FICTÍCIOS.
"""
from pathlib import Path
import pandas as pd
from loguru import logger

from interfood.config.settings import RAW_DIR

EXPECTED_SCHEMAS: dict[str, list[str]] = {
    "clientes": [
        "cliente_id", "razao_social", "cnpj_ficticio", "segmento",
        "cidade", "estado", "regiao", "limite_credito", "vendedor_id", "ativo",
    ],
    "produtos": [
        "produto_id", "sku", "nome", "categoria", "subcategoria",
        "unidade", "custo_unitario", "preco_venda", "margem_bruta_perc",
        "estoque_minimo", "ativo",
    ],
    "departamentos": ["departamento_id", "nome", "sigla", "centro_custo", "gestor"],
    "vendedores": ["vendedor_id", "nome", "departamento_id", "comissao_perc", "ativo"],
    "plano_contas": ["conta_id", "codigo", "descricao", "tipo", "nivel", "conta_pai", "natureza"],
    "pedidos": [
        "pedido_id", "data_pedido", "ano", "mes", "cliente_id", "vendedor_id",
        "status", "valor_bruto", "valor_desconto", "valor_liquido", "cmv_total", "lucro_bruto",
    ],
    "itens_pedido": [
        "item_id", "pedido_id", "produto_id", "quantidade", "preco_unitario",
        "custo_unitario", "valor_bruto", "valor_desconto", "valor_liquido", "cmv", "margem_bruta",
    ],
    "devolucoes": [
        "devolucao_id", "pedido_origem_id", "produto_id", "data_devolucao",
        "ano", "mes", "quantidade", "valor_devolucao", "cmv_revertido", "motivo",
    ],
    "despesas": [
        "despesa_id", "data_despesa", "ano", "mes", "departamento_id",
        "conta_id", "descricao", "valor", "tipo",
    ],
    "orcamento": [
        "orcamento_id", "ano", "mes", "departamento_id",
        "conta_id", "descricao", "valor_orcado",
    ],
    "movimentacao_estoque": [
        "movimentacao_id", "data_movimentacao", "ano", "mes", "produto_id",
        "tipo_mov", "quantidade", "custo_unitario", "valor_total",
        "saldo_quantidade", "saldo_valor",
    ],
}


def validate_schema(df: pd.DataFrame, dataset_name: str) -> None:
    """Valida se o DataFrame possui todas as colunas esperadas e não está vazio."""
    if df is None or df.empty:
        raise ValueError(f"Dataset '{dataset_name}' está vazio.")
    expected_cols = EXPECTED_SCHEMAS.get(dataset_name, [])
    missing = [c for c in expected_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset '{dataset_name}' não possui as colunas obrigatórias: {missing}")


def extract_dataset(dataset_name: str, raw_dir: Path = RAW_DIR) -> pd.DataFrame:
    """Lê um dataset CSV de data/raw/ e valida seu schema."""
    csv_path = raw_dir / f"{dataset_name}.csv"
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Arquivo CSV bruto não encontrado: {csv_path}. Execute scripts/01_generate_data.py primeiro."
        )
    df = pd.read_csv(csv_path, encoding="utf-8")
    validate_schema(df, dataset_name)
    logger.info(f"[EXTRACT] {dataset_name}.csv lido com sucesso ({len(df):,} linhas)")
    return df


def extract_all(raw_dir: Path = RAW_DIR) -> dict[str, pd.DataFrame]:
    """Extrai todos os 11 datasets brutos e valida cada um."""
    raw_data: dict[str, pd.DataFrame] = {}
    for name in EXPECTED_SCHEMAS:
        raw_data[name] = extract_dataset(name, raw_dir=raw_dir)
    return raw_data
