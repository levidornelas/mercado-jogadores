import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import DomainError
from app.core.logging import configure_logging

configure_logging()
logger = logging.getLogger("mercado_jogadores.access")
settings = get_settings()

app = FastAPI(
    title="Mercado de Jogadores API",
    version="0.1.0",
    description="API REST do mercado de jogadores da liga fictícia.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def registrar_requisicao(
    requisicao: Request,
    proximo: Callable[[Request], Awaitable[Response]],
) -> Response:
    inicio = time.perf_counter()
    resposta = await proximo(requisicao)
    duracao_ms = (time.perf_counter() - inicio) * 1000
    logger.info(
        "%s %s %s %.2fms",
        requisicao.method,
        requisicao.url.path,
        resposta.status_code,
        duracao_ms,
    )
    return resposta


@app.exception_handler(RequestValidationError)
async def tratar_erro_validacao(
    _: Request, erro: RequestValidationError
) -> JSONResponse:
    mensagem = "Dados da requisição são inválidos."
    if erro.errors():
        localizacao = ".".join(
            str(parte) for parte in erro.errors()[0]["loc"] if parte != "body"
        )
        mensagem = f"Campo inválido: {localizacao or 'corpo da requisição'}."
    return JSONResponse(status_code=400, content={"message": mensagem})


@app.exception_handler(DomainError)
async def tratar_erro_dominio(_: Request, erro: DomainError) -> JSONResponse:
    return JSONResponse(status_code=erro.status_code, content={"message": erro.message})


@app.exception_handler(StarletteHTTPException)
async def tratar_erro_http(_: Request, erro: StarletteHTTPException) -> JSONResponse:
    detalhe = erro.detail if isinstance(erro.detail, str) else "Recurso não encontrado."
    return JSONResponse(status_code=erro.status_code, content={"message": detalhe})


@app.exception_handler(Exception)
async def tratar_erro_inesperado(_: Request, erro: Exception) -> JSONResponse:
    logger.exception("Erro inesperado ao processar requisição", exc_info=erro)
    return JSONResponse(
        status_code=500,
        content={"message": "Ocorreu um erro interno ao processar a requisição."},
    )


app.include_router(api_router)
