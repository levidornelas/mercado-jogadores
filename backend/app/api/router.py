from fastapi import APIRouter

from app.api.routes import jogador, saude

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(saude.router)
api_router.include_router(jogador.router)
