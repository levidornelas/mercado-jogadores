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
async def log_request(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    started_at = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - started_at) * 1000
    logger.info(
        "%s %s %s %.2fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.exception_handler(RequestValidationError)
async def handle_validation_error(
    _: Request, error: RequestValidationError
) -> JSONResponse:
    message = "Dados da requisição são inválidos."
    if error.errors():
        location = ".".join(
            str(part) for part in error.errors()[0]["loc"] if part != "body"
        )
        message = f"Campo inválido: {location or 'corpo da requisição'}."
    return JSONResponse(status_code=400, content={"message": message})


@app.exception_handler(DomainError)
async def handle_domain_error(_: Request, error: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code, content={"message": error.message}
    )


@app.exception_handler(StarletteHTTPException)
async def handle_http_error(_: Request, error: StarletteHTTPException) -> JSONResponse:
    detail = (
        error.detail if isinstance(error.detail, str) else "Recurso não encontrado."
    )
    return JSONResponse(status_code=error.status_code, content={"message": detail})


@app.exception_handler(Exception)
async def handle_unexpected_error(_: Request, error: Exception) -> JSONResponse:
    logger.exception("Erro inesperado ao processar requisição", exc_info=error)
    return JSONResponse(
        status_code=500,
        content={"message": "Ocorreu um erro interno ao processar a requisição."},
    )


app.include_router(api_router)
