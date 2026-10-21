import re
import unicodedata

from app.core.errors import DomainError


def normalize_text(value: str) -> str:
    if any(unicodedata.category(character).startswith("C") for character in value):
        raise DomainError("O texto não pode conter caracteres de controle.", 400)
    return " ".join(value.strip().split(" "))


def remove_accents(value: str) -> str:
    decomposition = unicodedata.normalize("NFD", value)
    return "".join(
        character
        for character in decomposition
        if unicodedata.category(character) != "Mn"
    )


def alphabetical_key(value: str) -> str:
    return remove_accents(value).lower()


def validate_player_name(value: str) -> str:
    normalized_name = normalize_text(value)
    words = normalized_name.split(" ")
    if not 3 <= len(normalized_name) <= 100:
        raise DomainError("O nome deve ter entre 3 e 100 caracteres.", 400)
    if len(words) < 2 or any(
        not any(letter.isalpha() for letter in word) for word in words
    ):
        raise DomainError("O nome deve ter pelo menos duas palavras.", 400)
    if any(character.isdigit() for character in normalized_name):
        raise DomainError("O nome não pode conter dígitos.", 400)
    return normalized_name


def validate_search(value: str) -> str:
    normalized_search = normalize_text(value)
    if not 2 <= len(normalized_search) <= 100:
        raise DomainError("A busca deve ter entre 2 e 100 caracteres.", 400)
    return normalized_search


def validate_club_name(value: str) -> str:
    normalized_name = normalize_text(value)
    words = normalized_name.split(" ")
    if not 3 <= len(normalized_name) <= 60 or not 2 <= len(words) <= 5:
        raise DomainError("Nome de clube inválido.", 400)
    if any(
        not (character.isalpha() or character in " -.") for character in normalized_name
    ):
        raise DomainError("Nome de clube inválido.", 400)
    return normalized_name


def validate_club_acronym(value: str) -> str:
    if not re.fullmatch(r"[A-Z]{3}", value):
        raise DomainError("Sigla de clube inválida.", 400)
    return value


def is_positive_integer(value: str) -> bool:
    return bool(re.fullmatch(r"[1-9][0-9]*", value))
