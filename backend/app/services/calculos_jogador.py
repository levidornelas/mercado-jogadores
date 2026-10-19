from decimal import ROUND_HALF_UP, Decimal

PESOS_POR_POSICAO = {
    "GOL": (10, 0, 20, 0, 40, 30),
    "ZAG": (10, 0, 15, 0, 45, 30),
    "LAT": (25, 0, 20, 15, 25, 15),
    "MEI": (10, 15, 35, 25, 5, 10),
    "ATA": (20, 40, 10, 20, 0, 10),
}
CASAS_MOEDA = Decimal("0.01")


def arredondar_moeda(valor: Decimal) -> Decimal:
    return valor.quantize(CASAS_MOEDA, rounding=ROUND_HALF_UP)


def arredondar_inteiro(valor: Decimal) -> int:
    return int(valor.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def calcular_overall(
    posicao: str,
    velocidade: int,
    finalizacao: int,
    passe: int,
    drible: int,
    defesa: int,
    fisico: int,
) -> int:
    atributos = (velocidade, finalizacao, passe, drible, defesa, fisico)
    soma = sum(
        atributo * peso
        for atributo, peso in zip(atributos, PESOS_POR_POSICAO[posicao], strict=True)
    )
    return arredondar_inteiro(Decimal(soma) / Decimal("100"))


def calcular_valor_base(overall: int, potencial: int, idade: int) -> Decimal:
    parte_overall = Decimal("0")
    parte_overall += Decimal(max(min(overall, 60) - 40, 0)) * Decimal("0.50")
    parte_overall += Decimal(max(min(overall, 75) - 60, 0)) * Decimal("2.00")
    parte_overall += Decimal(max(overall - 75, 0)) * Decimal("6.00")
    if idade <= 21:
        parte_overall *= Decimal(100 + potencial - overall) / Decimal("100")
    return max(arredondar_moeda(parte_overall), Decimal("1.00"))


def calcular_valor_mercado(
    valor_base: Decimal, condicao: str, agilidade: int, idade: int
) -> Decimal:
    desconto_por_condicao = {
        "APTO": Decimal("0"),
        "MAL_CONDICIONADO": Decimal("15"),
        "DOENTE": Decimal("30"),
    }[condicao]
    if condicao != "APTO":
        if agilidade >= 80:
            desconto_por_condicao /= Decimal("2")
        elif agilidade <= 30:
            desconto_por_condicao += Decimal("10")
    ajuste_idade = (
        Decimal("10")
        if idade <= 21
        else Decimal("-10")
        if idade >= 32
        else Decimal("0")
    )
    percentual_total = max(ajuste_idade - desconto_por_condicao, Decimal("-40"))
    valor = arredondar_moeda(
        valor_base * (Decimal("100") + percentual_total) / Decimal("100")
    )
    return max(valor, Decimal("1.00"))
