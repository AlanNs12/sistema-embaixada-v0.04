#!/bin/bash
# =============================================================
# EMBASSY SYSTEM — BACKUP DO BANCO
# Uso: bash scripts/backup-db.sh
# =============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

[ ! -f "backend/.env" ] && echo -e "${RED}❌ backend/.env não encontrado${NC}" && exit 1

# Credenciais e host vêm exclusivamente do .env
set -a; source backend/.env; set +a

BACKUP_DIR="scripts/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"

echo -e "${YELLOW}Backup: ${DB_NAME} @ ${DB_HOST}:${DB_PORT:-5432}...${NC}"

PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "${DB_PORT:-5432}" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  2>/dev/null | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✓ Backup: ${BACKUP_FILE} (${SIZE})${NC}"

# Mantém apenas os 10 mais recentes
COUNT=$(ls -1 "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | wc -l)
if [ "$COUNT" -gt 10 ]; then
  echo "Removendo backups antigos..."
  ls -1t "${BACKUP_DIR}"/backup_*.sql.gz | tail -n +11 | xargs rm -f
fi

echo "Backups disponíveis:"
ls -lh "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | awk '{printf "  %s  %s\n", $5, $9}'
