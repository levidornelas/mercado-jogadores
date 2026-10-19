from fastapi import APIRouter, status

router = APIRouter(tags=["saúde"])


@router.get("/health", status_code=status.HTTP_200_OK)
def verificar_saude() -> dict[str, str]:
    return {"status": "ok"}
