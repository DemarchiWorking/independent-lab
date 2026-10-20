# independent-lab: worker de IA (único componente com a credencial da Anthropic).
#
#   docker build -f ia-worker/Dockerfile -t independent-lab-ia-worker .
#   docker build -f ia-worker/Dockerfile --build-arg INSTALAR_CLAUDE_CLI=1 -t independent-lab-ia-worker .
#
# Por padrão a imagem é mínima (só Node e um arquivo): serve ao modo API.
# INSTALAR_CLAUDE_CLI=1 acrescenta a CLI do Claude Code para o modo assinatura
# (opcional, por conta e risco do operador: ver docs/equipe-ia/IA-OPERACAO.md).
# A versão da CLI é fixada: é a que foi testada com as flags do worker.
FROM node:24-bookworm-slim

ARG INSTALAR_CLAUDE_CLI=0
ARG CLAUDE_CODE_VERSAO=2.1.226

# Mesmo uid do app (10001): os dois leem e gravam os arquivos da pasta de troca.
RUN groupadd -r -g 10001 ia && useradd -r -u 10001 -g ia -m -d /home/ia -s /usr/sbin/nologin ia \
    && mkdir -p /spool /app && chown ia:ia /spool

RUN if [ "$INSTALAR_CLAUDE_CLI" = "1" ]; then \
      npm install -g --no-audit --no-fund "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSAO}"; \
    fi

COPY --chown=ia:ia ia-worker/worker.mjs /app/worker.mjs

USER ia
WORKDIR /app
ENV NODE_ENV=production \
    IA_SPOOL_DIR=/spool

# Saudável = bateu o coração (worker.json) nos últimos 2 minutos.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "const j=JSON.parse(require('fs').readFileSync('/spool/worker.json','utf8'));process.exit(Date.now()-new Date(j.batimentoEm).getTime()<120000?0:1)" || exit 1

CMD ["node", "/app/worker.mjs"]
