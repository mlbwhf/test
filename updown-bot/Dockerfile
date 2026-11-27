FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY requirements.txt requirements-live.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-live.txt
COPY updown ./updown
COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && useradd -u 10001 -m bot && mkdir -p /app/state && chown bot /app/state
USER bot
VOLUME /app/state
HEALTHCHECK --interval=60s --timeout=5s --start-period=600s \
  CMD python -c "import time,sys;sys.exit(time.time()-float(open('/app/state/heartbeat').read())>120)"
ENTRYPOINT ["/entrypoint.sh"]
CMD ["run"]
