from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_session
from app.main import app
from app.models import Base


@pytest.fixture
def cliente() -> Generator[TestClient]:
    mecanismo = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(mecanismo)
    fabrica_sessao = sessionmaker(bind=mecanismo, autocommit=False, autoflush=False)

    def obter_sessao_teste() -> Generator[Session]:
        sessao = fabrica_sessao()
        try:
            yield sessao
        finally:
            sessao.close()

    app.dependency_overrides[get_session] = obter_sessao_teste
    with TestClient(app) as cliente_teste:
        yield cliente_teste
    app.dependency_overrides.clear()
    Base.metadata.drop_all(mecanismo)


def dados_jogador(**sobrescritas: object) -> dict[str, object]:
    dados: dict[str, object] = {
        "name": "Meia Lua",
        "position": "MEI",
        "agility": 85,
        "age": 25,
        "pace": 70,
        "shooting": 68,
        "passing": 82,
        "dribbling": 79,
        "defending": 55,
        "physical": 64,
        "potential": 86,
    }
    dados.update(sobrescritas)
    return dados


def test_cria_jogador_com_indicadores_calculados(cliente: TestClient) -> None:
    resposta = cliente.post("/api/v1/players", json=dados_jogador())

    assert resposta.status_code == 201
    assert resposta.headers["location"] == "/api/v1/players/1"
    assert resposta.json()["overall"] == 75
    assert resposta.json()["base_value"] == 40.0
    assert resposta.json()["market_value"] == 40.0
    assert resposta.json()["condition"] == "APTO"


def test_filtra_ordena_e_calcula_valor_de_mercado(cliente: TestClient) -> None:
    primeiro = cliente.post("/api/v1/players", json=dados_jogador()).json()
    cliente.patch(
        f"/api/v1/players/{primeiro['id']}/condition",
        json={"condition": "MAL_CONDICIONADO"},
    )
    cliente.post(
        "/api/v1/players",
        json=dados_jogador(name="Ataque Solar", position="ATA", age=21),
    )

    resposta = cliente.get("/api/v1/players?condition=MAL_CONDICIONADO&sort=value_asc")

    assert resposta.status_code == 200
    assert resposta.json()["meta"] == {
        "page": 1,
        "limit": 10,
        "total_items": 1,
        "total_pages": 1,
    }
    assert resposta.json()["data"][0]["market_value"] == 37.0


def test_recusa_corpo_e_regra_invalidos(cliente: TestClient) -> None:
    resposta_corpo = cliente.post("/api/v1/players", json=[])
    resposta_regra = cliente.post(
        "/api/v1/players", json=dados_jogador(age=35, agility=86)
    )

    assert resposta_corpo.status_code == 400
    assert resposta_corpo.json()["message"]
    assert resposta_regra.status_code == 400
    assert resposta_regra.json()["message"]


def test_edita_e_exclui_jogador_livre(cliente: TestClient) -> None:
    jogador = cliente.post("/api/v1/players", json=dados_jogador()).json()

    atualizacao = cliente.put(
        f"/api/v1/players/{jogador['id']}",
        json={"name": "Meia Aurora", "position": "ATA", "agility": 70, "age": 26},
    )
    exclusao = cliente.delete(f"/api/v1/players/{jogador['id']}")
    busca = cliente.get(f"/api/v1/players/{jogador['id']}")

    assert atualizacao.status_code == 200
    assert atualizacao.json()["base_value"] == 40.0
    assert atualizacao.json()["overall"] != 75
    assert exclusao.status_code == 204
    assert exclusao.content == b""
    assert busca.status_code == 404
