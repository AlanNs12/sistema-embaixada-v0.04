#!/bin/bash
# =============================================================
# EMBASSY SYSTEM — SETUP INICIAL DO SERVIDOR
# Execute UMA VEZ no primeiro deploy
# Uso: bash scripts/setup.sh
# =============================================================

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log()  { echo -e "$1"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

log "${BLUE}"
log "================================================="
log "   EMBASSY SYSTEM — CONFIGURAÇÃO DO SERVIDOR"
log "================================================="
log "${NC}"

[ ! -f "backend/package.json" ] && err "Execute na raiz do projeto"

# ── 1. Dependências do sistema ────────────────────────────────
log "\n${YELLOW}[1/7] Verificando dependências do sistema...${NC}"

if ! command -v node &>/dev/null; then
  log "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  ok "Node.js $(node -v)"
fi

if ! command -v pm2 &>/dev/null; then
  log "Instalando PM2..."; sudo npm install -g pm2
else
  ok "PM2 já instalado"
fi

if ! command -v nginx &>/dev/null; then
  log "Instalando Nginx..."; sudo apt-get update && sudo apt-get install -y nginx
else
  ok "Nginx já instalado"
fi

# ── 2. Backend dependências ───────────────────────────────────
log "\n${YELLOW}[2/7] Instalando dependências do backend...${NC}"
cd backend && npm install --production && cd ..
ok "Backend: dependências instaladas"

# ── 3. Criar .env se não existir ─────────────────────────────
log "\n${YELLOW}[3/7] Verificando arquivo de configuração...${NC}"
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  warn "Arquivo backend/.env criado."
  log ""
  log "  ${CYAN}PREENCHA AGORA com suas credenciais reais:${NC}"
  log "  ${BLUE}nano backend/.env${NC}"
  log ""
  log "  Depois execute novamente: ${BLUE}bash scripts/setup.sh${NC}"
  exit 0
fi
ok "backend/.env encontrado"

# ── Carrega variáveis do .env ─────────────────────────────────
set -a; source backend/.env; set +a

# Valida variáveis obrigatórias
for VAR in DB_HOST DB_USER DB_PASSWORD DB_NAME JWT_SECRET BACKEND_PORT FRONTEND_URL; do
  if [ -z "${!VAR}" ]; then
    err "Variável ${VAR} não definida no backend/.env"
  fi
done
ok "Todas as variáveis obrigatórias estão definidas"

# ── 4. Schema do banco ────────────────────────────────────────
log "\n${YELLOW}[4/7] Aplicando schema do banco de dados...${NC}"
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" -p "${DB_PORT:-5432}" \
  -U "$DB_USER" -d "$DB_NAME" \
  -f database/schema.sql 2>&1 | tail -3
ok "Schema aplicado"

# ── 5. Build do frontend ──────────────────────────────────────
log "\n${YELLOW}[5/7] Compilando o frontend...${NC}"
cd frontend

# Gera .env.local usando variáveis do backend/.env
# Em produção com Nginx no mesmo servidor, VITE_API_URL usa URL relativa /api
# Se APP_PUBLIC_URL estiver definido, usa ela; senão usa /api
if [ -n "$APP_PUBLIC_URL" ]; then
  VITE_API_URL_VALUE="${APP_PUBLIC_URL}/api"
else
  VITE_API_URL_VALUE="/api"
fi

cat > .env.local << ENVEOF
# Gerado automaticamente pelo setup.sh — não edite manualmente
# Para alterar, edite backend/.env e rode setup.sh novamente
VITE_API_URL=${VITE_API_URL_VALUE}
VITE_APP_ENV=production
ENVEOF

log "  VITE_API_URL=${VITE_API_URL_VALUE}"
npm install
npm run build
cd ..
ok "Frontend compilado (frontend/dist/)"

# ── 6. Configurar Nginx ───────────────────────────────────────
log "\n${YELLOW}[6/7] Configurando Nginx...${NC}"

PROJECT_DIR="$(pwd)"
# Lê porta e server_name do .env — sem hardcode
NGINX_LISTEN="${NGINX_PORT:-80}"
NGINX_SRV="${NGINX_SERVER_NAME:-_}"
BACKEND_PROXY="http://${BACKEND_HOST:-127.0.0.1}:${BACKEND_PORT:-3001}"

log "  Porta Nginx: ${NGINX_LISTEN}"
log "  Server name: ${NGINX_SRV}"
log "  Proxy para:  ${BACKEND_PROXY}"

sudo tee /etc/nginx/sites-available/embassy > /dev/null << NGINX_EOF
server {
    listen ${NGINX_LISTEN};
    server_name ${NGINX_SRV};

    # Frontend
    location / {
        root ${PROJECT_DIR}/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }

    # Backend API (proxy reverso — o IP interno NUNCA fica exposto)
    location /api {
        proxy_pass ${BACKEND_PROXY};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 10M;
    }
}
NGINX_EOF

sudo ln -sf /etc/nginx/sites-available/embassy /etc/nginx/sites-enabled/embassy
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
ok "Nginx configurado"

# ── 7. PM2 ───────────────────────────────────────────────────
log "\n${YELLOW}[7/7] Iniciando backend com PM2...${NC}"
pm2 delete embassy-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true
ok "Backend rodando com PM2"

# ── Resumo ────────────────────────────────────────────────────
log "\n${GREEN}"
log "================================================="
log "   ✅ SETUP CONCLUÍDO!"
log "================================================="
log "${NC}"

# Exibe URL final a partir da variável — sem descoberta de IP
if [ -n "$APP_PUBLIC_URL" ]; then
  log "Sistema disponível em: ${APP_PUBLIC_URL}"
else
  log "Sistema disponível em: http://$(hostname -I | awk '{print $1}'):${NGINX_LISTEN}"
  log "${YELLOW}Dica: defina APP_PUBLIC_URL no .env para fixar a URL exibida${NC}"
fi
log ""
log "Login padrão: admin@embaixada.gov / Admin@123"
