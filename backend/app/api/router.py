from fastapi import APIRouter

from app.api.routes import clube, jogador, liga, saude

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(saude.router)
api_router.include_router(jogador.router)
api_router.include_router(clube.router)
api_router.include_router(liga.router)
