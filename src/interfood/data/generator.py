"""
INTERFOOD FINANCIAL INTELLIGENCE - Gerador de Dados Sintéticos
===============================================================
ATENÇÃO: Todos os dados gerados são 100% SINTÉTICOS e fictícios.
Nenhuma relação com dados reais da Interfood.
Seed=42 para reproduzibilidade total.
"""
import sys
from pathlib import Path
from datetime import date, timedelta

# Garantir UTF-8 no console Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Adicionar src ao path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import numpy as np
import pandas as pd
from faker import Faker

from interfood.config.settings import (
    CRESCIMENTO_ANUAL,
    END_DATE,
    RAW_DIR,
    SAZONALIDADE,
    SEED,
    START_DATE,
)

# Configurar seeds globais
np.random.seed(SEED)
fake = Faker("pt_BR")
Faker.seed(SEED)

# ─── CONSTANTES ─────────────────────────────────────────────────────────────

SEGMENTOS = ["Supermercado", "Restaurante", "Atacado", "Padaria", "Hotel", "Empório"]
ESTADOS = ["SP", "RJ", "MG", "RS", "PR", "SC", "BA", "GO", "PE", "CE"]
REGIOES = {
    "SP": "Sudeste",
    "RJ": "Sudeste",
    "MG": "Sudeste",
    "RS": "Sul",
    "PR": "Sul",
    "SC": "Sul",
    "BA": "Nordeste",
    "PE": "Nordeste",
    "CE": "Nordeste",
    "GO": "Centro-Oeste",
}

CATEGORIAS = {
    "Laticínios": [
        ("Leite Integral UHT 1L", "UN", 2.80, 4.30),
        ("Leite Desnatado UHT 1L", "UN", 2.90, 4.50),
        ("Iogurte Natural Integral 170g", "UN", 2.10, 3.50),
        ("Queijo Mussarela Peça kg", "KG", 22.00, 35.50),
        ("Queijo Prato Lanche kg", "KG", 23.00, 37.00),
        ("Requeijão Cremoso Tradicional 200g", "UN", 4.50, 7.40),
        ("Manteiga Extra com Sal 200g", "UN", 8.00, 13.20),
        ("Cream Cheese Tradicional 150g", "UN", 6.50, 10.80),
        ("Leite Condensado Integral 395g", "UN", 4.80, 7.90),
        ("Creme de Leite UHT 200g", "UN", 3.20, 5.30),
        ("Queijo Parmesão Ralado 50g", "UN", 4.20, 7.10),
        ("Creme de Leite Fresco Nata 500ml", "UN", 7.00, 11.80),
        ("Caixa Leite UHT 12x1L", "CX", 31.00, 49.00),
        ("Iogurte Grego Tradicional 100g", "UN", 3.50, 5.90),
        ("Mussarela Fatiada Interfolhada 150g", "UN", 8.50, 14.20),
        ("Manteiga Clarificada Ghee 200g", "UN", 15.00, 25.50),
    ],
    "Carnes e Frios": [
        ("Frango Inteiro Resfriado kg", "KG", 7.50, 12.50),
        ("Filé de Peito de Frango kg", "KG", 11.00, 18.20),
        ("Linguiça Toscana Suína kg", "KG", 12.00, 20.00),
        ("Presunto Cozido Magro kg", "KG", 15.00, 25.00),
        ("Salame Tipo Italiano kg", "KG", 25.00, 42.00),
        ("Bacon Defumado Fatiado 200g", "UN", 8.00, 13.50),
        ("Mortadela Tradicional Defumada kg", "KG", 10.00, 17.00),
        ("Linguiça Calabresa Defumada kg", "KG", 13.00, 22.00),
        ("Patê de Presunto Defumado 150g", "UN", 5.50, 9.20),
        ("Blanquet de Peru Fatiado kg", "KG", 22.00, 37.00),
        ("Costela Suína Resfriada kg", "KG", 14.00, 23.50),
        ("Hambúrguer Bovino Gourmet 4un", "PT", 12.00, 20.00),
        ("Peito de Peru Defumado kg", "KG", 20.00, 33.50),
        ("Salaminho Aperitivo 500g", "UN", 18.00, 30.00),
        ("Contrafilé Bovino Maturado kg", "KG", 35.00, 58.00),
        ("Fraldinha Bovina Resfriada kg", "KG", 30.00, 50.00),
    ],
    "Bebidas": [
        ("Água Mineral sem Gás 500ml 12un", "CX", 8.00, 14.00),
        ("Refrigerante Cola PET 2L", "UN", 5.50, 9.20),
        ("Suco Integral de Laranja 1L", "UN", 6.00, 10.20),
        ("Cerveja Puro Malte Lager 350ml 12un", "CX", 28.00, 46.50),
        ("Vinho Tinto Cabernet Reserva 750ml", "UN", 18.00, 31.00),
        ("Bebida Energética Lata 250ml", "UN", 5.00, 8.60),
        ("Chá Gelado Pêssego 1.5L", "UN", 6.50, 11.00),
        ("Bebida Isotônica Tangerina 500ml", "UN", 4.50, 7.60),
        ("Café Torrado e Moído Premium 500g", "UN", 12.00, 20.50),
        ("Bebida Láctea Achocolatada 1L", "UN", 5.80, 9.80),
        ("Água Mineral com Gás 500ml 6un", "PT", 10.00, 17.00),
        ("Refrigerante Guaraná PET 2L", "UN", 5.00, 8.50),
        ("Vinho Branco Chardonnay Seco 750ml", "UN", 20.00, 34.00),
        ("Néctar de Uva Integral 1L", "UN", 7.00, 12.00),
        ("Espumante Brut Nacional 750ml", "UN", 35.00, 59.00),
        ("Destilado Premium Envelhecido 1L", "UN", 55.00, 92.00),
    ],
    "Grãos e Cereais": [
        ("Arroz Branco Tipo 1 5kg", "SC", 18.00, 29.50),
        ("Feijão Carioca Tipo 1 1kg", "SC", 7.50, 12.50),
        ("Massa Espaguete Grano Duro 500g", "PT", 3.80, 6.40),
        ("Farinha de Trigo Especial 1kg", "PT", 4.00, 6.60),
        ("Aveia em Flocos Finos 500g", "PT", 5.50, 9.20),
        ("Granola Tradicional com Mel 400g", "PT", 8.00, 13.50),
        ("Quinoa Real em Grãos 500g", "PT", 12.00, 20.50),
        ("Lentilha Selecionada 500g", "PT", 6.00, 10.20),
        ("Grão-de-Bico Selecionado 500g", "PT", 6.50, 11.00),
        ("Trigo para Quibe Integral 500g", "PT", 5.00, 8.50),
        ("Fubá Mimoso Enriquecido 1kg", "PT", 4.20, 7.00),
        ("Arroz Parboilizado Tipo 1 5kg", "SC", 20.00, 32.50),
        ("Feijão Preto Especial 1kg", "SC", 8.00, 13.20),
        ("Massa Parafuso Fusilli 500g", "PT", 3.60, 6.10),
        ("Canjica Branca Especial 500g", "PT", 4.80, 8.10),
        ("Semente de Chia Premium 200g", "PT", 8.50, 14.20),
    ],
    "Hortifruti": [
        ("Tomate Italiano Selecionado kg", "KG", 4.00, 7.00),
        ("Batata Inglesa Lavada kg", "KG", 3.50, 6.00),
        ("Cebola Amarela Nacional kg", "KG", 3.00, 5.10),
        ("Cenoura Extra Selecionada kg", "KG", 3.80, 6.50),
        ("Alface Americana Higienizada un", "UN", 2.50, 4.50),
        ("Brócolis Ninja Fresco kg", "KG", 6.00, 10.20),
        ("Pimentão Vermelho Extra kg", "KG", 7.00, 12.00),
        ("Abobrinha Italiana Fresca kg", "KG", 4.50, 7.60),
        ("Banana Prata Climatizada kg", "KG", 4.00, 7.00),
        ("Maçã Fuji Selecionada kg", "KG", 7.00, 12.00),
        ("Laranja Pêra Doce kg", "KG", 3.50, 6.00),
        ("Limão Tahiti Extra kg", "KG", 5.00, 8.50),
        ("Rúcula Hidropônica Maço", "MÇ", 2.80, 5.00),
        ("Espinafre Fresco Selecionado Maço", "MÇ", 3.00, 5.50),
        ("Alho Roxo Nobre kg", "KG", 15.00, 26.00),
        ("Gengibre Fresco Exportação kg", "KG", 12.00, 20.50),
    ],
}

DEPARTAMENTOS = [
    ("DEP001", "Comercial e Vendas", "VND", "CC-101", "Carlos Eduardo Mendes"),
    ("DEP002", "Controladoria e Finanças", "FIN", "CC-102", "Ana Paula Costa"),
    ("DEP003", "Logística e Distribuição", "LOG", "CC-103", "Roberto Carlos Silva"),
    ("DEP004", "Compras e Suprimentos", "CMP", "CC-104", "Fernanda Lima Rocha"),
    ("DEP005", "Marketing e Trade", "MKT", "CC-105", "Juliana Alves Martins"),
    ("DEP006", "Recursos Humanos", "RH", "CC-106", "Marcos Vinícius Oliveira"),
    ("DEP007", "Diretoria Executiva", "DIR", "CC-107", "Patrícia Helena Souza"),
]

VENDEDORES_NOMES = [
    "Rafael Almeida",
    "Camila Ferreira",
    "Thiago Nascimento",
    "Larissa Cardoso",
    "Bruno Pereira",
    "Isabela Gomes",
    "Diego Santos",
    "Priscila Lima",
]

MOTIVOS_DEVOLUCAO = [
    "Avaria no transporte logístico",
    "Divergência de pedido / SKU",
    "Temperatura fora da faixa na entrega",
    "Prazo de validade próximo ao vencimento",
    "Embalagem secundária danificada",
    "Excesso de quantidade faturada",
]

# Base mensal de despesas operacionais por departamento e tipo (R$)
BASE_DESPESAS_DEPT = {
    "DEP001": {"pessoal": 95_000, "aluguel": 12_000, "outros": 18_000},
    "DEP002": {"pessoal": 65_000, "aluguel": 8_000, "administrativo": 12_000},
    "DEP003": {"pessoal": 110_000, "aluguel": 25_000, "logistica": 65_000},
    "DEP004": {"pessoal": 52_000, "aluguel": 5_000, "administrativo": 8_000},
    "DEP005": {"pessoal": 45_000, "marketing": 38_000, "outros": 9_000},
    "DEP006": {"pessoal": 48_000, "aluguel": 5_000, "administrativo": 7_000},
    "DEP007": {"pessoal": 85_000, "aluguel": 14_000, "administrativo": 15_000},
}

CONTA_DESPESA_MAP = {
    "pessoal": "PC021",
    "aluguel": "PC022",
    "marketing": "PC023",
    "logistica": "PC024",
    "administrativo": "PC025",
    "outros": "PC026",
}


# ─── GERADORES DE DIMENSÕES ─────────────────────────────────────────────────

def gerar_clientes(n: int = 60) -> pd.DataFrame:
    """Gera 60 clientes B2B fictícios (DADOS SINTÉTICOS)."""
    rng = np.random.default_rng(SEED)
    registros = []
    vendedor_ids = [f"VND{i:03d}" for i in range(1, 9)]

    for i in range(1, n + 1):
        estado = str(rng.choice(ESTADOS))
        segmento = str(rng.choice(SEGMENTOS))
        limite = float(rng.choice([60_000, 120_000, 180_000, 250_000, 400_000, 650_000]))
        nums = rng.integers(0, 9, size=8)
        prefixo = f"{nums[0]}{nums[1]}.{nums[2]}{nums[3]}{nums[4]}.{nums[5]}{nums[6]}{nums[7]}"
        cnpj = f"{prefixo}/0001-{i % 89 + 10:02d}"

        registros.append({
            "cliente_id": f"CLI{i:04d}",
            "razao_social": f"{fake.company()} ({segmento}) [SINTÉTICO]",
            "cnpj_ficticio": cnpj,
            "segmento": segmento,
            "cidade": fake.city(),
            "estado": estado,
            "regiao": REGIOES.get(estado, "Sudeste"),
            "limite_credito": limite,
            "vendedor_id": str(rng.choice(vendedor_ids)),
            "ativo": True,
        })
    return pd.DataFrame(registros)


def gerar_vendedores() -> pd.DataFrame:
    """Gera 8 vendedores corporativos (DADOS SINTÉTICOS)."""
    rng = np.random.default_rng(SEED + 1)
    comissoes = rng.uniform(1.8, 3.8, size=8).round(2)
    registros = []
    for i, (nome, comissao) in enumerate(zip(VENDEDORES_NOMES, comissoes), 1):
        registros.append({
            "vendedor_id": f"VND{i:03d}",
            "nome": nome,
            "departamento_id": "DEP001",
            "comissao_perc": float(comissao),
            "ativo": True,
        })
    return pd.DataFrame(registros)


def gerar_departamentos() -> pd.DataFrame:
    """Gera 7 departamentos corporativos (DADOS SINTÉTICOS)."""
    cols = ["departamento_id", "nome", "sigla", "centro_custo", "gestor"]
    return pd.DataFrame(DEPARTAMENTOS, columns=cols)


def gerar_produtos() -> pd.DataFrame:
    """Gera 80 produtos em 5 categorias alimentícias (DADOS SINTÉTICOS)."""
    rng = np.random.default_rng(SEED + 2)
    registros = []
    prod_id = 1
    for categoria, produtos in CATEGORIAS.items():
        for nome, unidade, custo, preco in produtos:
            margem = round((preco - custo) / preco * 100, 2)
            registros.append({
                "produto_id": f"PRD{prod_id:04d}",
                "sku": f"SKU-{categoria[:3].upper()}-{prod_id:04d}",
                "nome": nome,
                "categoria": categoria,
                "subcategoria": categoria,
                "unidade": unidade,
                "custo_unitario": float(custo),
                "preco_venda": float(preco),
                "margem_bruta_perc": float(margem),
                "estoque_minimo": int(rng.integers(50, 200)),
                "ativo": True,
            })
            prod_id += 1
    return pd.DataFrame(registros)


def gerar_plano_contas() -> pd.DataFrame:
    """Gera hierarquia de plano de contas DRE (DADOS SINTÉTICOS)."""
    contas = [
        ("PC001", "1", "RECEITAS OPERACIONAIS", "RECEITA", 1, None, "CREDORA"),
        ("PC002", "1.1", "Receita Bruta de Vendas", "RECEITA", 2, "PC001", "CREDORA"),
        ("PC003", "1.2", "Deduções da Receita Bruta", "RECEITA", 2, "PC001", "DEVEDORA"),
        ("PC004", "1.2.1", "Devoluções de Vendas", "RECEITA", 3, "PC003", "DEVEDORA"),
        ("PC005", "1.2.2", "Abatimentos e Descontos Comerciais", "RECEITA", 3, "PC003", "DEVEDORA"),
        ("PC006", "1.2.3", "Impostos sobre Vendas (ICMS/PIS/COFINS)", "RECEITA", 3, "PC003", "DEVEDORA"),
        ("PC007", "1.3", "Receita Líquida de Vendas", "RESULTADO", 2, "PC001", "CREDORA"),
        ("PC010", "2", "CUSTOS OPERACIONAIS", "CUSTO", 1, None, "DEVEDORA"),
        ("PC011", "2.1", "Custo das Mercadorias Vendidas (CMV)", "CUSTO", 2, "PC010", "DEVEDORA"),
        ("PC012", "2.2", "Lucro Bruto Operacional", "RESULTADO", 2, "PC010", "CREDORA"),
        ("PC020", "3", "DESPESAS OPERACIONAIS (SG&A)", "DESPESA", 1, None, "DEVEDORA"),
        ("PC021", "3.1", "Despesas com Pessoal e Encargos", "DESPESA", 2, "PC020", "DEVEDORA"),
        ("PC022", "3.2", "Despesas com Ocupação e Aluguel", "DESPESA", 2, "PC020", "DEVEDORA"),
        ("PC023", "3.3", "Despesas Comerciais e Marketing", "DESPESA", 2, "PC020", "DEVEDORA"),
        ("PC024", "3.4", "Despesas com Logística e Fretes", "DESPESA", 2, "PC020", "DEVEDORA"),
        ("PC025", "3.5", "Despesas Gerais e Administrativas", "DESPESA", 2, "PC020", "DEVEDORA"),
        ("PC026", "3.6", "Outras Despesas Operacionais", "DESPESA", 2, "PC020", "DEVEDORA"),
        ("PC030", "4", "INDICADORES DE RESULTADO", "RESULTADO", 1, None, "CREDORA"),
        ("PC031", "4.1", "EBITDA (LAJIDA)", "RESULTADO", 2, "PC030", "CREDORA"),
        ("PC032", "4.2", "Depreciação e Amortização (D&A)", "RESULTADO", 2, "PC030", "DEVEDORA"),
        ("PC033", "4.3", "EBIT (Lucro Operacional)", "RESULTADO", 2, "PC030", "CREDORA"),
        ("PC034", "4.4", "Resultado Financeiro Líquido", "RESULTADO", 2, "PC030", "DEVEDORA"),
        ("PC035", "4.5", "EBT (LAIR - Lucro Antes do IR/CSLL)", "RESULTADO", 2, "PC030", "CREDORA"),
        ("PC036", "4.6", "Provisão para IRPJ e CSLL", "RESULTADO", 2, "PC030", "DEVEDORA"),
        ("PC037", "4.7", "Lucro Líquido do Exercício", "RESULTADO", 2, "PC030", "CREDORA"),
    ]
    cols = ["conta_id", "codigo", "descricao", "tipo", "nivel", "conta_pai", "natureza"]
    return pd.DataFrame(contas, columns=cols)


# ─── GERADORES DE FATOS ─────────────────────────────────────────────────────

def _gerar_datas_mes(ano: int, mes: int, n_pedidos: int, rng: np.random.Generator) -> list[date]:
    """Gera n datas distribuídas dentro de um mês."""
    start = date(ano, mes, 1)
    end = date(ano + 1, 1, 1) if mes == 12 else date(ano, mes + 1, 1)
    dias = (end - start).days
    dias_escolhidos = np.sort(rng.integers(0, dias, size=n_pedidos))
    return [start + timedelta(days=int(d)) for d in dias_escolhidos]


def gerar_pedidos_e_itens(
    clientes_df: pd.DataFrame,
    produtos_df: pd.DataFrame,
    vendedores_df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Gera pedidos e itens para os 36 meses (Jan/2022 a Dez/2024) com sazonalidade,
    crescimento anual e consistência contábil estrita entre itens e cabeçalho do pedido.
    DADOS SINTÉTICOS.
    """
    rng = np.random.default_rng(SEED + 3)

    pedidos_list = []
    itens_list = []

    periodos = pd.period_range(START_DATE, END_DATE, freq="M")

    cliente_ids = clientes_df["cliente_id"].tolist()
    produto_ids = produtos_df["produto_id"].tolist()
    vendedor_ids = vendedores_df["vendedor_id"].tolist()

    prod_custo = dict(zip(produtos_df["produto_id"], produtos_df["custo_unitario"]))
    prod_preco = dict(zip(produtos_df["produto_id"], produtos_df["preco_venda"]))

    base_pedidos_mes = 450

    for periodo in periodos:
        ano = periodo.year
        mes = periodo.month
        sazon = SAZONALIDADE[mes]
        crescimento = CRESCIMENTO_ANUAL[ano]

        n_pedidos = int(round(base_pedidos_mes * sazon * crescimento * rng.uniform(0.97, 1.03)))
        n_pedidos = max(280, n_pedidos)

        datas = _gerar_datas_mes(ano, mes, n_pedidos, rng)

        for j in range(n_pedidos):
            pedido_id = f"PED{ano}{mes:02d}{j + 1:05d}"
            cliente_id = str(rng.choice(cliente_ids))
            vendedor_id = str(rng.choice(vendedor_ids))
            data_pedido = datas[j]

            n_itens = int(rng.integers(2, 8))
            prods_pedido = rng.choice(produto_ids, size=n_itens, replace=False)

            valor_bruto_total = 0.0
            valor_desconto_total = 0.0
            valor_liquido_total = 0.0
            cmv_total = 0.0
            itens_pedido = []

            for k, prod_id in enumerate(prods_pedido):
                prod_id_str = str(prod_id)
                quantidade = int(rng.integers(5, 65))
                preco = round(prod_preco[prod_id_str] * float(rng.uniform(0.97, 1.03)), 4)
                custo = round(prod_custo[prod_id_str] * float(rng.uniform(0.98, 1.02)), 4)
                desconto_perc = float(rng.choice([0.0, 0.0, 0.0, 0.02, 0.03, 0.05]))

                valor_bruto_item = round(quantidade * preco, 2)
                valor_desconto_item = round(valor_bruto_item * desconto_perc, 2)
                valor_liquido_item = round(valor_bruto_item - valor_desconto_item, 2)
                cmv_item = round(quantidade * custo, 2)
                margem_item = round(valor_liquido_item - cmv_item, 2)

                item_id = f"ITM{ano}{mes:02d}{j + 1:05d}{k + 1:02d}"
                itens_pedido.append({
                    "item_id": item_id,
                    "pedido_id": pedido_id,
                    "produto_id": prod_id_str,
                    "quantidade": quantidade,
                    "preco_unitario": preco,
                    "custo_unitario": custo,
                    "valor_bruto": valor_bruto_item,
                    "valor_desconto": valor_desconto_item,
                    "valor_liquido": valor_liquido_item,
                    "cmv": cmv_item,
                    "margem_bruta": margem_item,
                })

                valor_bruto_total = round(valor_bruto_total + valor_bruto_item, 2)
                valor_desconto_total = round(valor_desconto_total + valor_desconto_item, 2)
                valor_liquido_total = round(valor_liquido_total + valor_liquido_item, 2)
                cmv_total = round(cmv_total + cmv_item, 2)

            lucro_bruto = round(valor_liquido_total - cmv_total, 2)

            pedidos_list.append({
                "pedido_id": pedido_id,
                "data_pedido": str(data_pedido),
                "ano": ano,
                "mes": mes,
                "cliente_id": cliente_id,
                "vendedor_id": vendedor_id,
                "status": "FATURADO",
                "valor_bruto": valor_bruto_total,
                "valor_desconto": valor_desconto_total,
                "valor_liquido": valor_liquido_total,
                "cmv_total": cmv_total,
                "lucro_bruto": lucro_bruto,
            })
            itens_list.extend(itens_pedido)

    return pd.DataFrame(pedidos_list), pd.DataFrame(itens_list)


def gerar_devolucoes(pedidos_df: pd.DataFrame, itens_df: pd.DataFrame) -> pd.DataFrame:
    """
    Gera devoluções realistas (~2,5% a 3,2% da receita bruta), vinculadas a pedidos reais.
    DADOS SINTÉTICOS.
    """
    rng = np.random.default_rng(SEED + 4)
    registros = []

    # Agrupar itens por pedido_id para acesso rápido
    itens_por_pedido = {pid: grp for pid, grp in itens_df.groupby("pedido_id")}

    n_dev = int(len(pedidos_df) * 0.045)
    pedidos_selecionados = pedidos_df.sample(n=n_dev, random_state=SEED).copy()

    for _, pedido in pedidos_selecionados.iterrows():
        pid = pedido["pedido_id"]
        itens_ped = itens_por_pedido.get(pid)
        if itens_ped is None or len(itens_ped) == 0:
            continue
        item = itens_ped.iloc[int(rng.integers(0, len(itens_ped)))]

        data_pedido = pd.Timestamp(pedido["data_pedido"])
        dias_apos = int(rng.integers(3, 18))
        data_dev = data_pedido + timedelta(days=dias_apos)
        if data_dev > pd.Timestamp(END_DATE):
            data_dev = pd.Timestamp(END_DATE)

        qtd_max = max(1, int(item["quantidade"]) // 2)
        qtd_devolvida = int(rng.integers(1, qtd_max + 1))
        valor_dev = round(qtd_devolvida * float(item["preco_unitario"]), 2)
        cmv_rev = round(qtd_devolvida * float(item["custo_unitario"]), 2)

        registros.append({
            "devolucao_id": f"DEV{len(registros) + 1:06d}",
            "pedido_origem_id": pid,
            "produto_id": item["produto_id"],
            "data_devolucao": str(data_dev.date()),
            "ano": int(data_dev.year),
            "mes": int(data_dev.month),
            "quantidade": qtd_devolvida,
            "valor_devolucao": valor_dev,
            "cmv_revertido": cmv_rev,
            "motivo": str(rng.choice(MOTIVOS_DEVOLUCAO)),
        })

    return pd.DataFrame(registros)


def gerar_despesas(departamentos_df: pd.DataFrame) -> pd.DataFrame:
    """
    Gera despesas operacionais mensais por departamento e conta contábil.
    Despesas fixas (pessoal, aluguel) sofrem reajuste anual moderado;
    despesas variáveis (logística, marketing, outros) acompanham parcialmente a sazonalidade.
    DADOS SINTÉTICOS.
    """
    rng = np.random.default_rng(SEED + 5)
    periodos = pd.period_range(START_DATE, END_DATE, freq="M")

    registros = []
    desp_id = 1

    for periodo in periodos:
        ano = int(periodo.year)
        mes = int(periodo.month)
        sazon = SAZONALIDADE[mes]
        fator_ano = 1.0 + (ano - 2022) * 0.06  # +6% ao ano de inflação/dissídio

        for dept_id, tipos in BASE_DESPESAS_DEPT.items():
            for tipo, valor_base in tipos.items():
                is_fixa = tipo in ("pessoal", "aluguel", "administrativo")
                tipo_desp = "FIXA" if is_fixa else "VARIAVEL"
                fator_sazon = 1.0 if is_fixa else (0.65 + 0.35 * sazon)
                variacao = float(rng.uniform(0.95, 1.05))
                valor = round(valor_base * fator_ano * fator_sazon * variacao, 2)

                data_despesa = date(ano, mes, 5)
                registros.append({
                    "despesa_id": f"DSP{desp_id:07d}",
                    "data_despesa": str(data_despesa),
                    "ano": ano,
                    "mes": mes,
                    "departamento_id": dept_id,
                    "conta_id": CONTA_DESPESA_MAP.get(tipo, "PC026"),
                    "descricao": f"Despesa {tipo.capitalize()} - {dept_id}",
                    "valor": valor,
                    "tipo": tipo_desp,
                })
                desp_id += 1

    return pd.DataFrame(registros)


def gerar_orcamento(
    departamentos_df: pd.DataFrame,
    pedidos_df: pd.DataFrame,
    despesas_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Gera o orçamento (Budget) anual mensalizado para os 36 meses por departamento e conta.
    Calibrado sobre as premissas de planejamento da Controladoria para permitir análise
    realista de Orçado vs Realizado (variações entre -10% e +10%).
    DADOS SINTÉTICOS.
    """
    rng = np.random.default_rng(SEED + 6)
    registros = []
    orc_id = 1

    # Agrupar receita e CMV realizados por ano/mês para derivar a linha base planejada com ruído controlado
    vendas_mes = (
        pedidos_df.groupby(["ano", "mes"])
        .agg(receita_bruta=("valor_bruto", "sum"), cmv=("cmv_total", "sum"))
        .reset_index()
    )
    vendas_map = {
        (int(r["ano"]), int(r["mes"])): (float(r["receita_bruta"]), float(r["cmv"]))
        for _, r in vendas_mes.iterrows()
    }

    desp_mes = (
        despesas_df.groupby(["ano", "mes", "departamento_id", "conta_id"])["valor"]
        .sum()
        .reset_index()
    )

    for ano in [2022, 2023, 2024]:
        for mes in range(1, 13):
            rec_real, cmv_real = vendas_map.get((ano, mes), (3_000_000.0, 1_850_000.0))
            # Orçamento de Receita Bruta planejado com variação de -4% a +5%
            receita_orcada = round(rec_real * float(rng.uniform(0.96, 1.05)), 2)
            cmv_orcado = round(cmv_real * float(rng.uniform(0.96, 1.04)), 2)

            registros.append({
                "orcamento_id": f"ORC{orc_id:07d}",
                "ano": ano,
                "mes": mes,
                "departamento_id": "DEP001",
                "conta_id": "PC002",
                "descricao": "Receita Bruta de Vendas Orçada",
                "valor_orcado": receita_orcada,
            })
            orc_id += 1

            registros.append({
                "orcamento_id": f"ORC{orc_id:07d}",
                "ano": ano,
                "mes": mes,
                "departamento_id": "DEP004",
                "conta_id": "PC011",
                "descricao": "CMV Orçado",
                "valor_orcado": cmv_orcado,
            })
            orc_id += 1

    # Orçamento de despesas por departamento e conta contábil
    for _, row in desp_mes.iterrows():
        ano = int(row["ano"])
        mes = int(row["mes"])
        dept_id = str(row["departamento_id"])
        conta_id = str(row["conta_id"])
        val_real = float(row["valor"])
        val_orc = round(val_real * float(rng.uniform(0.94, 1.06)), 2)

        registros.append({
            "orcamento_id": f"ORC{orc_id:07d}",
            "ano": ano,
            "mes": mes,
            "departamento_id": dept_id,
            "conta_id": conta_id,
            "descricao": f"Orçamento Despesa {conta_id} - {dept_id}",
            "valor_orcado": val_orc,
        })
        orc_id += 1

    return pd.DataFrame(registros)


def gerar_movimentacao_estoque(
    produtos_df: pd.DataFrame,
    pedidos_df: pd.DataFrame,
    itens_df: pd.DataFrame,
    devolucoes_df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Gera movimentações mensais de estoque (ENTRADA, SAIDA, DEVOLUCAO) garantindo
    que o saldo físico e financeiro nunca fique negativo (reposição automática + segurança).
    DADOS SINTÉTICOS.
    """
    rng = np.random.default_rng(SEED + 7)
    registros = []
    mov_id = 1

    # Mapear pedido_id -> (ano, mes)
    ped_ano_mes = dict(zip(pedidos_df["pedido_id"], zip(pedidos_df["ano"], pedidos_df["mes"])))
    itens_temp = itens_df[["pedido_id", "produto_id", "quantidade", "custo_unitario", "cmv"]].copy()
    itens_temp["ano"] = [ped_ano_mes[p][0] for p in itens_temp["pedido_id"]]
    itens_temp["mes"] = [ped_ano_mes[p][1] for p in itens_temp["pedido_id"]]

    saidas_agrup = (
        itens_temp.groupby(["ano", "mes", "produto_id"])
        .agg(qtd_saida=("quantidade", "sum"), cmv_saida=("cmv", "sum"))
        .reset_index()
    )
    saidas_map = {
        (int(r["ano"]), int(r["mes"]), str(r["produto_id"])): (int(r["qtd_saida"]), float(r["cmv_saida"]))
        for _, r in saidas_agrup.iterrows()
    }

    dev_agrup = (
        devolucoes_df.groupby(["ano", "mes", "produto_id"])
        .agg(qtd_dev=("quantidade", "sum"), cmv_dev=("cmv_revertido", "sum"))
        .reset_index()
    )
    dev_map = {
        (int(r["ano"]), int(r["mes"]), str(r["produto_id"])): (int(r["qtd_dev"]), float(r["cmv_dev"]))
        for _, r in dev_agrup.iterrows()
    }

    # Saldo inicial em 01/01/2022
    saldo_qtd = {}
    saldo_val = {}
    prod_custo = {}
    prod_est_min = {}

    for _, prod in produtos_df.iterrows():
        pid = str(prod["produto_id"])
        custo = float(prod["custo_unitario"])
        est_min = int(prod["estoque_minimo"])
        prod_custo[pid] = custo
        prod_est_min[pid] = est_min
        qtd_ini = int(rng.integers(800, 1500))
        saldo_qtd[pid] = qtd_ini
        saldo_val[pid] = round(qtd_ini * custo, 2)

    periodos = pd.period_range(START_DATE, END_DATE, freq="M")

    for periodo in periodos:
        ano = int(periodo.year)
        mes = int(periodo.month)
        data_entrada = date(ano, mes, 2)
        data_saida = date(ano, mes, 15)
        data_dev = date(ano, mes, 25)

        for _, prod in produtos_df.iterrows():
            pid = str(prod["produto_id"])
            custo_base = prod_custo[pid]
            est_min = prod_est_min[pid]

            qtd_saida_mes, val_saida_mes = saidas_map.get((ano, mes), (0, 0.0)) if False else saidas_map.get((ano, mes, pid), (0, 0.0))
            qtd_dev_mes, val_dev_mes = dev_map.get((ano, mes, pid), (0, 0.0))

            # Definir compra (ENTRADA) para cobrir a saída do mês + manter estoque acima do mínimo
            necessidade = max(0, qtd_saida_mes + est_min * 2 - saldo_qtd[pid])
            qtd_compra = int(necessidade + rng.integers(80, 280))
            custo_compra = round(custo_base * float(rng.uniform(0.98, 1.02)), 4)
            val_compra = round(qtd_compra * custo_compra, 2)

            saldo_qtd[pid] += qtd_compra
            saldo_val[pid] = round(saldo_val[pid] + val_compra, 2)

            registros.append({
                "movimentacao_id": f"MOV{mov_id:08d}",
                "data_movimentacao": str(data_entrada),
                "ano": ano,
                "mes": mes,
                "produto_id": pid,
                "tipo_mov": "ENTRADA",
                "quantidade": qtd_compra,
                "custo_unitario": custo_compra,
                "valor_total": val_compra,
                "saldo_quantidade": saldo_qtd[pid],
                "saldo_valor": saldo_val[pid],
            })
            mov_id += 1

            # Registrar SAÍDA por vendas do mês
            if qtd_saida_mes > 0:
                custo_medio_saida = round(val_saida_mes / qtd_saida_mes, 4)
                saldo_qtd[pid] = max(0, saldo_qtd[pid] - qtd_saida_mes)
                saldo_val[pid] = max(0.0, round(saldo_val[pid] - val_saida_mes, 2))

                registros.append({
                    "movimentacao_id": f"MOV{mov_id:08d}",
                    "data_movimentacao": str(data_saida),
                    "ano": ano,
                    "mes": mes,
                    "produto_id": pid,
                    "tipo_mov": "SAIDA",
                    "quantidade": qtd_saida_mes,
                    "custo_unitario": custo_medio_saida,
                    "valor_total": round(val_saida_mes, 2),
                    "saldo_quantidade": saldo_qtd[pid],
                    "saldo_valor": saldo_val[pid],
                })
                mov_id += 1

            # Registrar DEVOLUCAO de clientes (reentrada no estoque)
            if qtd_dev_mes > 0:
                custo_medio_dev = round(val_dev_mes / qtd_dev_mes, 4)
                saldo_qtd[pid] += qtd_dev_mes
                saldo_val[pid] = round(saldo_val[pid] + val_dev_mes, 2)

                registros.append({
                    "movimentacao_id": f"MOV{mov_id:08d}",
                    "data_movimentacao": str(data_dev),
                    "ano": ano,
                    "mes": mes,
                    "produto_id": pid,
                    "tipo_mov": "DEVOLUCAO",
                    "quantidade": qtd_dev_mes,
                    "custo_unitario": custo_medio_dev,
                    "valor_total": round(val_dev_mes, 2),
                    "saldo_quantidade": saldo_qtd[pid],
                    "saldo_valor": saldo_val[pid],
                })
                mov_id += 1

    return pd.DataFrame(registros)


# ─── ORQUESTRADOR DE GERAÇÃO ─────────────────────────────────────────────────

def gerar_todos_dados() -> dict[str, pd.DataFrame]:
    """
    Gera todos os 11 datasets sintéticos do INTERFOOD FINANCIAL INTELLIGENCE.
    DADOS SINTÉTICOS - seed=42.
    """
    print("[INFO] Gerando dados sinteticos (DADOS 100% SINTETICOS - seed=42)...")

    clientes_df = gerar_clientes(60)
    produtos_df = gerar_produtos()
    departamentos_df = gerar_departamentos()
    vendedores_df = gerar_vendedores()
    plano_contas_df = gerar_plano_contas()
    pedidos_df, itens_df = gerar_pedidos_e_itens(clientes_df, produtos_df, vendedores_df)
    devolucoes_df = gerar_devolucoes(pedidos_df, itens_df)
    despesas_df = gerar_despesas(departamentos_df)
    orcamento_df = gerar_orcamento(departamentos_df, pedidos_df, despesas_df)
    estoque_df = gerar_movimentacao_estoque(produtos_df, pedidos_df, itens_df, devolucoes_df)

    return {
        "clientes": clientes_df,
        "produtos": produtos_df,
        "departamentos": departamentos_df,
        "vendedores": vendedores_df,
        "plano_contas": plano_contas_df,
        "pedidos": pedidos_df,
        "itens_pedido": itens_df,
        "devolucoes": devolucoes_df,
        "despesas": despesas_df,
        "orcamento": orcamento_df,
        "movimentacao_estoque": estoque_df,
    }


def salvar_csvs(dados: dict[str, pd.DataFrame], diretorio: Path = RAW_DIR) -> dict[str, Path]:
    """Salva todos os DataFrames como arquivos CSV UTF-8 em data/raw/."""
    diretorio.mkdir(parents=True, exist_ok=True)
    arquivos_salvos = {}
    for nome, df in dados.items():
        caminho = diretorio / f"{nome}.csv"
        df.to_csv(caminho, index=False, encoding="utf-8")
        arquivos_salvos[nome] = caminho
    return arquivos_salvos


if __name__ == "__main__":
    datasets = gerar_todos_dados()
    salvar_csvs(datasets)
    print("[OK] Todos os CSVs sinteticos foram gerados em data/raw/!")
