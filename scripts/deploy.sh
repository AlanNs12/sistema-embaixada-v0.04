#!/bin/bash

set -e

echo "🚀 Iniciando deploy completo do Sistema Embaixada..."

PROJECT_DIR="/home/alan/sistema-embaixada-v0.04"
FRONT_DIR="$PROJECT_DIR/frontend"
BACK_DIR="$PROJECT_DIR/backend"

FRONT_APP_NAME="EmbaixadaFront"
BACK_APP_NAME="EmbaixadaBack"

FRONT_PORT="4173"

echo "======================================"
echo "📦 Deploy do Backend"
echo "======================================"

if [ -d "$BACK_DIR" ]; then
    cd "$BACK_DIR"

    echo "📁 Diretório backend encontrado: $BACK_DIR"

    echo "📦 Instalando dependências do backend..."
    npm install

    echo "🛑 Removendo processo antigo do backend, se existir..."
    pm2 delete "$BACK_APP_NAME" || true

    echo "▶️ Iniciando backend..."
    pm2 start npm --name "$BACK_APP_NAME" -- start
else
    echo "⚠️ Diretório backend não encontrado em $BACK_DIR"
    echo "➡️ Pulando deploy do backend."
fi

echo "======================================"
echo "🎨 Deploy do Frontend"
echo "======================================"

cd "$FRONT_DIR"

echo "📁 Diretório frontend: $FRONT_DIR"

echo "📦 Instalando dependências do frontend..."
npm install

echo "🏗️ Gerando build do frontend..."
npm run build

echo "🛑 Removendo processo antigo do frontend, se existir..."
pm2 delete "$FRONT_APP_NAME" || true

echo "▶️ Iniciando frontend em modo preview na porta $FRONT_PORT..."
pm2 start npm --name "$FRONT_APP_NAME" -- run preview -- --host 0.0.0.0 --port "$FRONT_PORT"

echo "💾 Salvando processos no PM2..."
pm2 save

echo "🔎 Testando frontend..."
sleep 3

if curl -I "http://localhost:$FRONT_PORT" | grep -q "200"; then
    echo "✅ Frontend online em http://localhost:$FRONT_PORT"
else
    echo "⚠️ Frontend não retornou 200. Verifique:"
    echo "pm2 logs $FRONT_APP_NAME --lines 100"
fi

echo "📊 Status atual do PM2:"
pm2 status

echo "✅ Deploy completo finalizado."