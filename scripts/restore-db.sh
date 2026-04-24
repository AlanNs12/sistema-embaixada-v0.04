#!/bin/bash
# =============================================================
# EMBASSY SYSTEM — RESTAURAR BACKUP
# Uso: bash scripts/restore-db.sh [arquivo.sql.gz]
# =============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

[ ! -f "backend/.env" ] && echo -e "${RED}❌ backend/.env não encontrado${NC}" && exit 1

# Credenciais e host vêm exclusivamente do .env
set -a; source backend/.env; set +a

BACKUP_DIR="scripts/backups"

echo -e "${BLUE}================================================="
echo "   EMBASSY SYSTEM — RESTAURAR BANCO"
echo -e "=================================================${NC}"

if [ -z "$1" ]; then
  echo ""; echo "Backups disponíveis:"
  mapfile -t BACKUPS < <(ls -1t "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null)
  [ ${#BACKUPS[@]} -eq 0 ] && echo -e "${RED}Nenhum backup encontrado${NC}" && exit 1

  for i in "${!BACKUPS[@]}"; do
    SIZE=$(du -sh "${BACKUPS[$i]}" | cut -f1)
    echo "  [$((i+1))] $(basename ${BACKUPS[$i]})  (${SIZE})"
  done
  echo ""; read -rp "Número do backup (ENTER para cancelar): " CHOICE
  [ -z "$CHOICE" ] && echo "Cancelado." && exit 0
  BACKUP_FILE="${BACKUPS[$((CHOICE-1))]}"
else
  BACKUP_FILE="$1"
fi

[ ! -f "$BACKUP_FILE" ] && echo -e "${RED}❌ Arquivo não encontrado: ${BACKUP_FILE}${NC}" && exit 1

echo ""
echo -e "${RED}⚠️  ATENÇÃO: sobrescreverá o banco ${DB_NAME} @ ${DB_HOST}${NC}"
read -rp "Digite 'SIM' para confirmar: " CONFIRM
[ "$CONFIRM" != "SIM" ] && echo "Cancelado." && exit 0

echo ""
echo -e "${YELLOW}Restaurando...${NC}"
pm2 stop embassy-api 2>/dev/null && echo "Backend pausado."

gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" -p "${DB_PORT:-5432}" \
  -U "$DB_USER" -d "$DB_NAME"

pm2 restart embassy-api 2>/dev/null
echo -e "\n${GREEN}✅ Banco restaurado com sucesso!${NC}"
