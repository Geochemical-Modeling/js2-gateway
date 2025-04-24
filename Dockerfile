# Good setup that supports co2 and phreeqc, and hopefully future binaries
FROM ghcr.io/astral-sh/uv:debian-slim
RUN apt-get update && apt-get install -y \
  curl \ 
  libgfortran5


WORKDIR /app

ADD backend/pyproject.toml .
RUN uv sync

COPY backend/app/ ./app
COPY frontend/dist ./dist

# Giving execution permissions for binaries
RUN chmod +x /app/app/routes/co2/main
RUN chmod +x /app/app/routes/phreeqc/phreeqc

CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0"]