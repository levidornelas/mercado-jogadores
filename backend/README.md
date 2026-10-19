# Backend — Mercado de Jogadores

API REST construída com Python 3.13, FastAPI, SQLAlchemy 2, Alembic e PostgreSQL 16.

## Pré-requisitos

- Python 3.13
- Docker Engine com Docker Compose v2

## Configuração local

Na raiz do repositório, copie o arquivo de variáveis:

```bash
cp .env.example .env
```

Suba somente o banco de dados:

```bash
docker compose up -d db
```

No diretório `backend/`, crie e ative um ambiente virtual, instale as dependências e aplique a migration:

```bash
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
alembic upgrade head
```

Execute a API:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

A API estará em `http://localhost:8000`, a documentação interativa em `http://localhost:8000/docs` e a rota de saúde em `http://localhost:8000/api/v1/health`.

## Jogadores

O módulo de jogadores está disponível em `/api/v1/players` e oferece cadastro, consulta individual, edição, alteração de condição, exclusão lógica e listagem paginada. A listagem aceita `search`, `position`, `condition`, `free`, `club_id`, `min_age`, `max_age`, `min_value`, `max_value`, `sort`, `page` e `limit`.

Os cálculos de overall, valor base e valor de mercado estão centralizados em `app/services/calculos_jogador.py`.

## Banco de dados

As migrations versionadas em `alembic/versions/` criam as sete tabelas obrigatórias: `jogadores`, `clubes`, `contratos`, `transacoes`, `escalacoes`, `partidas` e `duelos_partida`.

Para recriar o banco local do zero, com a API parada, execute no diretório `backend/`:

```bash
alembic downgrade base
alembic upgrade head
```

## Verificação

No diretório `backend/`:

```bash
pytest
ruff check app alembic tests
ruff format --check app alembic tests
```

## Variáveis de ambiente

O arquivo `.env.example` documenta todas as variáveis. `FRONTEND_ORIGIN` deve conter a origem do Next.js e é usada para restringir CORS. Em desenvolvimento, o padrão é `http://localhost:3000`.

## Estrutura

- `app/api`: routers HTTP
- `app/core`: configuração, banco, logs e erros
- `app/models`: mapeamentos SQLAlchemy, um por tabela
- `app/repositories`: acesso a dados
- `app/schemas`: contratos Pydantic
- `app/services`: regras de negócio
- `app/utils`: funções auxiliares
- `alembic`: migrations do PostgreSQL
- `tests`: testes automatizados

## Bibliotecas

- FastAPI: camada HTTP e OpenAPI.
- SQLAlchemy: mapeamento e consultas parametrizadas ao PostgreSQL.
- Alembic: versionamento e recriação do esquema.
- Pydantic Settings: variáveis de ambiente tipadas.
- Psycopg: driver PostgreSQL.
- Pytest e HTTPX: testes automatizados.
- Ruff: lint e verificação de formatação.
