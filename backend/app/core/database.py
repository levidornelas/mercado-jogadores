from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

configuracoes = get_settings()
mecanismo = create_engine(str(configuracoes.database_url), pool_pre_ping=True)
FabricaSessoes = sessionmaker(bind=mecanismo, autocommit=False, autoflush=False)


def get_session() -> Generator[Session]:
    session = FabricaSessoes()
    try:
        yield session
    finally:
        session.close()
