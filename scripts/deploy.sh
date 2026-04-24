#!/bin/bash
# =============================================================
# EMBASSY SYSTEM — SCRIPT DE ATUALIZAÇÃO
# Uso: bash scripts/deploy.sh
# =============================================================

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p scripts/logs
LOG="scripts/logs/deploy_${TIMESTAMP}.log"

log()  { echo -e "$1" | tee -a "$LOG"; }
ok()   { log "${GREEN}✓ $1${NC}"; }
warn() { log "${YELLOW}⚠️  $1${NC}"; }
err()  { log "${RED}❌ $1${NC}"; exit 1; }

log "${BLUE}"
log "================================================="
log "   EMBASSY SYSTEM — ATUALIZAÇÃO  ${TIMESTAMP}"
log "================================================="
log "${NC}"

[ ! -f "backend/package.json" ] && err "Execute na raiz do projeto"
[ ! -f "backend/.env" ]         && err "backend/.env não encontrado. Execute setup.sh primeiro."

# Carrega TODAS as variáveis do .env — sem nenhum IP hardcoded aqui
set -a; source backend/.env; set +a

# Valida variáveis críticas
for VAR in DB_HOST DB_USER DB_PASSWORD DB_NAME BACKEND_PORT; do
  [ -z "${!VAR}" ] && err "Variável ${VAR} não definida no backend/.env"
done

BACKEND_INTERNAL="http://${BACKEND_HOST:-127.0.0.1}:${BACKEND_PORT}"

# ── 1. Backup ─────────────────────────────────────────────────
log "\n${YELLOW}[1/6] 💾 Backup do banco de dados...${NC}"
bash scripts/backup-db.sh 2>&1 | tee -a "$LOG"
ok "Backup realizado"

# ── 2. Git pull ───────────────────────────────────────────────
log "\n${YELLOW}[2/6] 📥 Baixando atualizações...${NC}"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT_ANTES=$(git rev-parse --short HEAD)

if ! git diff --quiet; then
  warn "Mudanças locais detectadas — guardando no stash"
  git stash push -m "deploy-stash-${TIMESTAMP}" >> "$LOG" 2>&1
  STASHED=true
fi

git pull origin "$BRANCH" 2>&1 | tee -a "$LOG"
COMMIT_DEPOIS=$(git rev-parse --short HEAD)
ok "Repositório: ${COMMIT_ANTES} → ${COMMIT_DEPOIS}"

[ "$COMMIT_ANTES" = "$COMMIT_DEPOIS" ] && log "${CYAN}ℹ️  Sem novas mudanças de código${NC}"

# ── 3. Migrations ─────────────────────────────────────────────
log "\n${YELLOW}[3/6] 🗄️  Verificando migrações...${NC}"
for migration in database/migration_*.sql; do
  NAME=$(basename "$migration")
  DONE_FLAG="scripts/logs/applied_${NAME}.done"
  if [ ! -f "$DONE_FLAG" ]; then
    log "  Aplicando: ${NAME}"
    PGPASSWORD="$DB_PASSWORD" psql \
      -h "$DB_HOST" -p "${DB_PORT:-5432}" \
      -U "$DB_USER" -d "$DB_NAME" \
      -f "$migration" 2>&1 | tee -a "$LOG"
    touch "$DONE_FLAG"
    ok "${NAME} aplicada"
  else
    log "  ${CYAN}↳ ${NAME} já aplicada${NC}"
  fi
done

# ── 4. Backend ────────────────────────────────────────────────
log "\n${YELLOW}[4/6] 📦 Atualizando dependências do backend...${NC}"
cd backend && npm install --production 2>&1 | tail -4 | tee -a "../$LOG" && cd ..
ok "Dependências do backend atualizadas"

# ── 5. Frontend ───────────────────────────────────────────────
log "\n${YELLOW}[5/6] 🔨 Recompilando o frontend...${NC}"
cd frontend

# Reconstrói .env.local a partir das vars do backend/.env
# (garante que o build nunca usa IPs hardcoded)
if [ -n "$APP_PUBLIC_URL" ]; then
  VITE_API_URL_VALUE="${APP_PUBLIC_URL}/api"
else
  VITE_API_URL_VALUE="/api"
fi

cat > .env.local << ENVEOF
# Gerado automaticamente pelo deploy.sh em ${TIMESTAMP}
VITE_API_URL=${VITE_API_URL_VALUE}
VITE_APP_ENV=production
ENVEOF

log "  VITE_API_URL=${VITE_API_URL_VALUE}"
npm install 2>&1 | tail -4 | tee -a "../$LOG"
npm run build 2>&1 | tee -a "../$LOG"
cd ..
ok "Frontend recompilado"

# ── 6. Reiniciar serviços ─────────────────────────────────────
log "\n${YELLOW}[6/6] 🔄 Reiniciando serviços...${NC}"

if pm2 list | grep -q "embassy-api"; then
  pm2 restart embassy-api 2>&1 | tee -a "$LOG"
  ok "Backend reiniciado via PM2"
else
  warn "Processo PM2 não encontrado — iniciando..."
  pm2 start ecosystem.config.js --env production
  pm2 save
  ok "Backend iniciado via PM2"
fi

sudo nginx -t 2>&1 | tee -a "$LOG" && \
  sudo systemctl reload nginx 2>&1 | tee -a "$LOG"
ok "Nginx recarregado"

[ "${STASHED:-false}" = "true" ] && { git stash pop 2>/dev/null || warn "Não foi possível restaurar stash automaticamente"; }

# ── Resumo ────────────────────────────────────────────────────
log "\n${GREEN}"
log "================================================="
log "   ✅ ATUALIZAÇÃO CONCLUÍDA!"
log "================================================="
log "${NC}"
log "Commits: ${COMMIT_ANTES} → ${COMMIT_DEPOIS}"
log "Log:     ${LOG}"
log ""
log "Status do backend:"
pm2 show embassy-api 2>/dev/null | grep -E "status|uptime|restarts|memory" | sed 's/^/  /' || true
log ""

if [ -n "$APP_PUBLIC_URL" ]; then
  log "Acesse: ${APP_PUBLIC_URL}"
else
  log "Acesse: http://$(hostname -I | awk '{print $1}'):${NGINX_PORT:-80}"
  log "${YELLOW}Dica: defina APP_PUBLIC_URL no .env para fixar a URL${NC}"
fi
