import re
import unicodedata

from app.core.errors import DomainError


def normalizar_texto(valor: str) -> str:
    if any(unicodedata.category(caractere).startswith("C") for caractere in valor):
        raise DomainError("O texto não pode conter caracteres de controle.", 400)
    return " ".join(valor.strip().split(" "))


def remover_acentos(valor: str) -> str:
    decomposicao = unicodedata.normalize("NFD", valor)
    return "".join(
        caractere
        for caractere in decomposicao
        if unicodedata.category(caractere) != "Mn"
    )


def chave_alfabetica(valor: str) -> str:
    return remover_acentos(valor).lower()


def validar_nome_jogador(valor: str) -> str:
    nome = normalizar_texto(valor)
    palavras = nome.split(" ")
    if not 3 <= len(nome) <= 100:
        raise DomainError("O nome deve ter entre 3 e 100 caracteres.", 400)
    if len(palavras) < 2 or any(
        not any(letra.isalpha() for letra in palavra) for palavra in palavras
    ):
        raise DomainError("O nome deve ter pelo menos duas palavras.", 400)
    if any(caractere.isdigit() for caractere in nome):
        raise DomainError("O nome não pode conter dígitos.", 400)
    return nome


def validar_busca(valor: str) -> str:
    busca = normalizar_texto(valor)
    if not 2 <= len(busca) <= 100:
        raise DomainError("A busca deve ter entre 2 e 100 caracteres.", 400)
    return busca


def is_integer(valor: str) -> bool:
    return bool(re.fullmatch(r"[1-9][0-9]*", valor))
