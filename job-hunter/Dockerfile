# Job Hunter web app. Chromium is only used to print resumes to PDF.
FROM python:3.12-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium fonts-liberation fonts-noto-core \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --uid 10001 app && mkdir /data && chown app /data
ENV CHROME_BIN=/usr/bin/chromium JOBHUNTER_DATA=/data PYTHONUNBUFFERED=1
WORKDIR /app
COPY jobhunter ./jobhunter
COPY config.json resume.example.json ./
USER app
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=4)"
CMD ["python", "-m", "jobhunter", "serve", "--host", "0.0.0.0", "--port", "8080"]
