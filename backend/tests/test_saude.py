from fastapi.testclient import TestClient

from app.main import app

cliente = TestClient(app)


def test_verificar_saude() -> None:
    resposta = cliente.get("/api/v1/health")

    assert resposta.status_code == 200
    assert resposta.json() == {"status": "ok"}


def test_rota_inexistente_retorna_message() -> None:
    resposta = cliente.get("/api/v1/nao-existe")

    assert resposta.status_code == 404
    assert resposta.json()["message"]


def test_cors_aceita_somente_origem_configurada() -> None:
    resposta = cliente.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert resposta.status_code == 200
    assert resposta.headers["access-control-allow-origin"] == "http://localhost:3000"
