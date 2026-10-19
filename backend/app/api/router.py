from fastapi import APIRouter

from app.api.routes import saude

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(saude.router)
