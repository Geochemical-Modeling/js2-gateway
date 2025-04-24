# Good setup that supports co2 and phreeqc, and hopefully future binaries
FROM ghcr.io/astral-sh/uv:debian-slim
RUN apt-get update && apt-get install -y \
  curl \ 
  libgfortran5


WORKDIR /app

ADD backend/pyproject.toml .
COPY --chmod=755 backend/app/ ./app
COPY frontend/dist ./dist

RUN uv sync

CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0"]