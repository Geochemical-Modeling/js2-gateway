FROM ghcr.io/astral-sh/uv:python3.9-alpine

RUN apk add curl
RUN apk add libgcc libgfortran gcompat

WORKDIR /app

ADD backend/pyproject.toml .
COPY --chmod=755 backend/app/ ./app
COPY frontend/dist ./dist

# RUN chmod +x /app/app/routes/co2/main
RUN uv sync

CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0"]