FROM ghcr.io/astral-sh/uv:python3.9-alpine

RUN apk add curl

ADD backend/pyproject.toml /app/
COPY backend/app/ /app/app/

WORKDIR /app
RUN uv sync

COPY frontend/dist /app/dist

CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0"]