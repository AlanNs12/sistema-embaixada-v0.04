# 🚀 Guia de Deploy — Embassy System

## Estrutura dos Scripts

```
scripts/
├── setup.sh        → Configuração inicial (roda UMA VEZ)
├── deploy.sh       → Atualização do sistema (roda a cada update)
├── backup-db.sh    → Backup manual do banco
├── restore-db.sh   → Restaurar um backup
├── status.sh       → Ver status de todos os serviços
├── logs/           → Logs de deploy e do backend (criado automaticamente)
└── backups/        → Backups do banco (criado automaticamente)
```

---

## 📋 Primeiro Deploy (setup inicial)

### 1. No seu computador — suba o código para o GitHub

```bash
git add .
git commit -m "versão inicial"
git push origin main
```

### 2. No servidor via PuTTY

```bash
# Clone o repositório (só na primeira vez)
git clone https://github.com/SEU_USUARIO/SEU_REPO.git embassy
cd embassy

# Dê permissão de execução para os scripts
chmod +x scripts/*.sh

# Rode o setup
bash scripts/setup.sh
```

O setup vai parar quando criar o `.env` e pedir para você preenchê-lo:

```bash
nano backend/.env
```

Preencha com seus dados reais:
```env
DB_HOST=IP_DA_SUA_VPS
DB_PORT=5432
DB_NAME=embassy_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
JWT_SECRET=uma_chave_aleatoria_longa_aqui_minimo_32_caracteres
JWT_EXPIRES_IN=8h
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://IP_DO_SEU_SERVIDOR
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`, e rode o setup novamente:

```bash
bash scripts/setup.sh
```

---

## 🔄 Atualizando o Sistema

### Fluxo normal de atualização:

**1. No seu computador** — commite e suba as mudanças:
```bash
git add .
git commit -m "descrição das mudanças"
git push origin main
```

**2. No servidor via PuTTY** — um único comando faz tudo:
```bash
cd embassy
bash scripts/deploy.sh
```

O script `deploy.sh` faz automaticamente:
- ✅ Backup do banco antes de qualquer mudança
- ✅ `git pull` para baixar o código novo
- ✅ Aplica novas migrations do banco (sem reaplicar as já feitas)
- ✅ `npm install` para instalar novas dependências
- ✅ `npm run build` para recompilar o frontend
- ✅ `pm2 restart` para reiniciar o backend
- ✅ `nginx reload` para recarregar o servidor web
- ✅ Salva log completo do deploy em `scripts/logs/`

---

## 📊 Verificar Status do Sistema

```bash
bash scripts/status.sh
```

Mostra:
- Status do backend (PM2)
- Se a API está respondendo
- Status do Nginx
- Conexão com o banco
- Último commit do repositório
- Espaço em disco
- Backups disponíveis
- Últimas linhas do log

---

## 💾 Backup Manual do Banco

```bash
bash scripts/backup-db.sh
```

Os backups ficam em `scripts/backups/` e são mantidos os **10 mais recentes** (os mais antigos são removidos automaticamente).

---

## 🔙 Restaurar um Backup

```bash
bash scripts/restore-db.sh
```

Ou para restaurar um arquivo específico:
```bash
bash scripts/restore-db.sh scripts/backups/backup_20260424_093000.sql.gz
```

---

## 🛠️ Comandos PM2 Úteis

```bash
pm2 status                    # Ver todos os processos
pm2 logs embassy-api          # Ver logs em tempo real
pm2 logs embassy-api --lines 50  # Ver últimas 50 linhas
pm2 restart embassy-api       # Reiniciar backend
pm2 stop embassy-api          # Parar backend
pm2 start ecosystem.config.js --env production  # Iniciar com config
```

---

## 📝 Comandos Nginx Úteis

```bash
sudo nginx -t                  # Verificar configuração
sudo systemctl reload nginx    # Recarregar sem downtime
sudo systemctl restart nginx   # Reiniciar completamente
sudo tail -f /var/log/nginx/error.log  # Ver erros
```

---

## 🔥 Resolução de Problemas

### Backend não responde
```bash
pm2 logs embassy-api --lines 30   # Ver erros
pm2 restart embassy-api           # Tentar reiniciar
```

### Frontend mostra página em branco
```bash
cd embassy && cd frontend && npm run build  # Recompilar manualmente
sudo systemctl reload nginx
```

### Erro de conexão com banco
```bash
# Verificar variáveis do .env
cat backend/.env

# Testar conexão manualmente
source backend/.env
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT NOW();"
```

### Rollback de emergência
```bash
# Voltar para commit anterior
git log --oneline -10         # Ver commits
git checkout HASH_DO_COMMIT   # Voltar para commit específico
bash scripts/deploy.sh        # Re-deployar
```
