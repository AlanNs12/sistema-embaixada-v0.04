#!/bin/bash
# =============================================================
# EMBASSY SYSTEM — STATUS DO SISTEMA
# Uso: bash scripts/status.sh
# =============================================================

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

# Carrega variáveis do .env — endereço/porta do backend vêm daqui
if [ -f "backend/.env" ]; then
  set -a; source backend/.env; set +a
else
  echo -e "${RED}❌ backend/.env não encontrado${NC}"
  exit 1
fi

# Endereço interno do backend lido do .env
BACKEND_INTERNAL="http://${BACKEND_HOST:-127.0.0.1}:${BACKEND_PORT:-3001}"

echo -e "${BLUE}"
echo "================================================="
echo "   EMBASSY SYSTEM — STATUS"
echo "   $(date '+%d/%m/%Y %H:%M:%S')"
echo -e "=================================================${NC}"

# ── Backend PM2 ───────────────────────────────────────────────
echo -e "\n${CYAN}▸ BACKEND (PM2)${NC}"
if pm2 list | grep -q "embassy-api"; then
  if pm2 list | grep embassy-api | grep -q "online"; then
    echo -e "  Status: ${GREEN}● Online${NC}"
  else
    echo -e "  Status: ${RED}● Offline${NC}"
  fi
  pm2 show embassy-api 2>/dev/null \
    | grep -E "uptime|memory|restarts" \
    | awk '{printf "  %-12s %s\n", $3, $4}' \
    || true
else
  echo -e "  ${RED}Processo não encontrado no PM2${NC}"
fi

# ── Health check — usa variável, sem IP hardcoded ─────────────
echo -e "\n${CYAN}▸ API (${BACKEND_INTERNAL}/api/health)${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${BACKEND_INTERNAL}/api/health" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "  ${GREEN}✓ API respondendo (HTTP 200)${NC}"
  curl -s "${BACKEND_INTERNAL}/api/health" 2>/dev/null \
    | python3 -m json.tool 2>/dev/null \
    | sed 's/^/    /'
else
  echo -e "  ${RED}❌ API não responde (HTTP ${HTTP_CODE})${NC}"
  echo -e "  Verifique: pm2 logs embassy-api"
fi

# ── Nginx ─────────────────────────────────────────────────────
echo -e "\n${CYAN}▸ NGINX (porta ${NGINX_PORT:-80})${NC}"
if systemctl is-active --quiet nginx; then
  echo -e "  ${GREEN}✓ Nginx rodando${NC}"
else
  echo -e "  ${RED}❌ Nginx parado${NC}"
fi

# ── Banco de dados — host/credenciais do .env ─────────────────
echo -e "\n${CYAN}▸ BANCO DE DADOS (${DB_HOST}:${DB_PORT:-5432}/${DB_NAME})${NC}"
COUNT=$(PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" -p "${DB_PORT:-5432}" \
  -U "$DB_USER" -d "$DB_NAME" \
  -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
if [ -n "$COUNT" ]; then
  echo -e "  ${GREEN}✓ PostgreSQL conectado${NC}"
  echo -e "  Usuários: ${COUNT}"
else
  echo -e "  ${RED}❌ Falha na conexão com PostgreSQL${NC}"
fi

# ── Git ───────────────────────────────────────────────────────
echo -e "\n${CYAN}▸ REPOSITÓRIO${NC}"
echo -e "  Branch:  $(git rev-parse --abbrev-ref HEAD)"
echo -e "  Commit:  $(git rev-parse --short HEAD)"
echo -e "  Último:  $(git log -1 --format='%cd' --date=format:'%d/%m/%Y %H:%M')"

# ── Disco ─────────────────────────────────────────────────────
echo -e "\n${CYAN}▸ DISCO${NC}"
df -h / | awk 'NR==2{printf "  Usado: %s de %s (%s)\n", $3, $2, $5}'

# ── Backups ───────────────────────────────────────────────────
echo -e "\n${CYAN}▸ BACKUPS${NC}"
COUNT_BK=$(ls -1 scripts/backups/backup_*.sql.gz 2>/dev/null | wc -l)
if [ "$COUNT_BK" -gt 0 ]; then
  LATEST=$(ls -1t scripts/backups/backup_*.sql.gz | head -1)
  SIZE=$(du -sh "$LATEST" | cut -f1)
  echo -e "  ${GREEN}✓ ${COUNT_BK} backup(s)${NC}"
  echo -e "  Mais recente: $(basename $LATEST) (${SIZE})"
else
  echo -e "  ${YELLOW}Nenhum backup encontrado${NC}"
fi

# ── Logs recentes ─────────────────────────────────────────────
echo -e "\n${CYAN}▸ ÚLTIMAS LINHAS DO LOG${NC}"
pm2 logs embassy-api --nostream --lines 5 2>/dev/null | tail -5 | sed 's/^/  /'

# ── URL pública ───────────────────────────────────────────────
echo -e "\n${CYAN}▸ ACESSO${NC}"
if [ -n "$APP_PUBLIC_URL" ]; then
  echo -e "  URL: ${GREEN}${APP_PUBLIC_URL}${NC}"
else
  echo -e "  URL: http://$(hostname -I | awk '{print $1}'):${NGINX_PORT:-80}"
  echo -e "  ${YELLOW}Dica: defina APP_PUBLIC_URL no .env para fixar a URL${NC}"
fi

echo -e "\n${BLUE}=================================================${NC}\n"
