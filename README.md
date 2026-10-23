# Passe — Mercado de Jogadores

Aplicação web fullstack para administrar uma liga de futebol fictícia. Permite
cadastrar jogadores e clubes, negociar contratos, consultar transações,
escalar titulares, jogar partidas e acompanhar a classificação.

## Pré-requisitos

O caminho recomendado usa containers. Em Ubuntu 24.04, instale:

- Docker Engine 24 ou superior, com Docker Compose v2;
- Git 2.40 ou superior, para obter o repositório.

Para executar sem containers, são necessários também:

- Python 3.14 e pip;
- Node.js 22 LTS e npm;
- PostgreSQL 16.

## Execução com Docker Compose

Este é o modo recomendado e sobe banco, API e interface com um único comando.
Na raiz do repositório:

~~~bash
cp .env.example .env
docker compose up -d --build
~~~

Após os serviços ficarem saudáveis:

- Interface: http://localhost:3000
- Origem da API: http://localhost:8000
- Documentação OpenAPI: http://localhost:8000/docs

O frontend aguarda a verificação de saúde da API. A API aplica as migrations
Alembic automaticamente antes de iniciar.

Para acompanhar os serviços:

~~~bash
docker compose logs -f
~~~

Para pará-los, preservando os dados:

~~~bash
docker compose down
~~~

## Criar e recriar o banco de dados

Na primeira execução com Docker Compose, as migrations criam um banco
PostgreSQL vazio automaticamente.

Para apagar completamente o volume, recriar o banco vazio e aplicar as
migrations outra vez, execute na raiz:

~~~bash
docker compose down -v
docker compose up -d --build
~~~

O processo acima não insere clubes, jogadores, transações ou partidas.

Há um script opcional apenas para demonstração local, executado depois de
existirem clubes. Ele acrescenta jogadores para completar posições ausentes;
não é executado pelo Docker Compose nem pelas migrations:

~~~bash
docker compose exec backend python -m app.seed
~~~

## Execução local para desenvolvimento

Abra três terminais a partir da raiz do repositório.

### Banco de dados

~~~bash
cp .env.example .env
docker compose up -d db
~~~

### Backend

~~~bash
cd backend
cp .env.example .env
python3.14 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
~~~

A API estará disponível em http://localhost:8000; consumidores da API devem
usar o prefixo http://localhost:8000/api/v1.

### Frontend

~~~bash
cd frontend
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
~~~

A interface estará disponível em http://localhost:3000.

## Variáveis de ambiente

O arquivo .env.example contém valores seguros para desenvolvimento. Copie-o
para .env antes de iniciar via Docker Compose.

| Variável | Uso |
| --- | --- |
| POSTGRES_DB | Nome do banco PostgreSQL. |
| POSTGRES_USER | Usuário do banco. |
| POSTGRES_PASSWORD | Senha do banco. |
| POSTGRES_HOST | Host do banco; no Compose é db. |
| POSTGRES_PORT | Porta do PostgreSQL. |
| FRONTEND_ORIGIN | Origem liberada pelo CORS da API. |
| NEXT_PUBLIC_API_URL | Origem pública da API usada pelo navegador, sem /api/v1. |
| API_HOST / API_PORT | Host e porta da API FastAPI. |

Para desenvolvimento local do backend, use também backend/.env.example, que
aponta POSTGRES_HOST para localhost.

## Verificações

Os comandos abaixo são executados a partir de backend/:

~~~bash
python -m pytest -q
ruff check app alembic tests
ruff format --check app alembic tests
~~~

Para verificar o TypeScript do frontend, a partir de frontend/:

~~~bash
npx tsc --noEmit
~~~

## Estrutura do projeto

~~~text
.
├── backend/
│   ├── alembic/          # migrations versionadas
│   ├── app/
│   │   ├── api/          # rotas HTTP
│   │   ├── core/         # configuração, erros, banco e logs
│   │   ├── models/       # modelos SQLAlchemy
│   │   ├── repositories/ # consultas e persistência
│   │   ├── schemas/      # contratos Pydantic
│   │   ├── services/     # regras de negócio e cálculos
│   │   └── utils/        # datas e normalização de texto
│   └── tests/            # testes automatizados do backend
├── frontend/
│   ├── app/              # rotas e telas Next.js
│   ├── components/       # componentes reutilizáveis e diálogos
│   ├── assets/           # formações e identidade visual
│   └── lib/              # cliente HTTP, tipos e formatação
├── docker-compose.yml    # banco, API e interface
└── .env.example          # configuração de ambiente do Compose
~~~

## Bibliotecas e ferramentas

### Backend

- FastAPI: API REST, OpenAPI e tratamento HTTP.
- SQLAlchemy: mapeamento e acesso ao PostgreSQL.
- Alembic: migrations versionadas do esquema.
- Pydantic Settings: leitura e tipagem de variáveis de ambiente.
- Psycopg: driver PostgreSQL.
- Uvicorn: servidor ASGI.
- Pytest e HTTPX: testes automatizados.
- Ruff: lint e verificação de formatação.

### Frontend

- Next.js, React e TypeScript: interface, rotas e segurança de tipos.
- Radix UI: primitivas acessíveis para diálogos, selects e abas.
- Lucide React: ícones da interface.
- Class Variance Authority, clsx e tailwind-merge: composição de classes e
  variantes dos componentes de UI.

### Infraestrutura

- PostgreSQL 16: banco relacional da aplicação.
- Docker Compose: execução integrada da interface, API e banco.

## Decisões e premissas

- Não há autenticação: a aplicação administra uma única liga, conforme o
  enunciado.
- A API é a fonte de verdade para regras e valores derivados. O frontend nunca
  recalcula valor de mercado, taxas, multa, comissão, placar ou classificação.
- Datas de contrato e transações usam o fuso fixo de Brasília (UTC−03:00).
- A interface consome a origem configurada em NEXT_PUBLIC_API_URL; o prefixo
  /api/v1 é acrescentado pelo cliente HTTP.
- O banco inicia vazio. Dados de demonstração só são inseridos mediante o
  comando opcional de seed.
- As respostas de erro da API têm o formato message, para que a interface
  possa apresentar feedback uniforme.

## Funcionalidades não implementadas

Nenhuma funcionalidade obrigatória conhecida está pendente.

Como diferenciais ainda não foram adicionados testes automatizados nem uma
configuração de lint específica para o frontend.

## Uso de inteligência artificial

O OpenAI Codex foi utilizado pontualmente como apoio para esclarecimentos,
revisão de código e documentação. As sugestões aproveitadas foram adaptadas e
validadas no projeto.
