FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOST=0.0.0.0 \
    PORT=7860

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY --chown=app:app requirements.txt ./
RUN python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt \
    && python -m pip install "gunicorn>=22,<24"

COPY --chown=app:app . ./
RUN mkdir -p outputs && chown -R app:app /app

USER app

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.getenv(\"PORT\", \"7860\")}/', timeout=3)"

# Current app.py is Flask/WSGI. Keep PORT/env/outputs stable so a future
# FastAPI app can swap this command to uvicorn without changing deployment shape.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-7860} --workers ${WEB_CONCURRENCY:-2} --timeout ${WEB_TIMEOUT:-180} app:app"]
