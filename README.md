# 🏛️ Sistema de Controle — Portaria da Embaixada

Sistema completo para digitalização dos controles e registros da portaria.

---

## 🗂️ Estrutura do Projeto

```
embassy-system/
├── backend/          # API Node.js + Express
├── frontend/         # React + Vite + Tailwind
└── database/
    └── schema.sql    # Schema completo do PostgreSQL
```

---

## 🚀 Passo a Passo para Rodar

### 1. Preparar o banco de dados (na sua VPS)

Conecte ao seu PostgreSQL e crie o banco:

```sql
CREATE DATABASE embassy_db;
```

Depois rode o schema:

```bash
psql -h SEU_IP_VPS -U SEU_USUARIO -d embassy_db -f database/schema.sql
```

---

### 2. Configurar o Backend

```bash
cd backend
cp .env.example .env
```

Edite o `.env` com suas credenciais reais:

```env
DB_HOST=SEU_IP_VPS
DB_PORT=5432
DB_NAME=embassy_db
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

JWT_SECRET=uma_chave_muito_longa_e_aleatoria_aqui_123456
JWT_EXPIRES_IN=8h

PORT=3001
FRONTEND_URL=http://localhost:5173
```

Instale as dependências e rode:

```bash
npm install
npm run dev
```

O backend estará em: `http://localhost:3001`

---

### 3. Configurar o Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará em: `http://localhost:5173`

---

## 🔑 Login Padrão (Super Admin)

| Campo | Valor |
|-------|-------|
| Email | `admin@embaixada.gov` |
| Senha | `Admin@123` |

> ⚠️ **Troque a senha imediatamente após o primeiro acesso!**

Para gerar um novo hash de senha use:
```js
const bcrypt = require('bcrypt')
bcrypt.hash('SuaNovaSenha', 10).then(console.log)
```

---

## 👥 Perfis de Acesso

| Perfil | Permissões |
|--------|-----------|
| `porteiro` | Registra todos os controles diários |
| `admin` | Porteiro + cadastros + relatórios |
| `super_admin` | Acesso total + usuários + auditoria |

---

## 📋 Módulos do Sistema

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/` | Visão em tempo real da embaixada |
| Funcionários | `/funcionarios` | Ponto diário (entrada/almoço/saída) |
| Terceirizados | `/terceirizados` | Ponto de jardineiros e limpeza |
| Veículos | `/veiculos` | Saídas e retornos da frota |
| Prestadores | `/prestadores` | Controle de acesso + foto do doc |
| Atend. Consular | `/consular` | Visitantes consulares + foto do doc |
| Encomendas | `/encomendas` | Recebimento e entrega de pacotes |
| Relatórios | `/relatorios` | Exportação CSV por período |
| Informações | `/informacoes` | Contatos e telefones úteis |
| Admin | `/admin/*` | Cadastros, usuários, auditoria |

---

## 🗄️ API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Usuário logado

### Funcionários
- `GET /api/employees` — Lista
- `POST /api/employees` — Criar (admin)
- `GET /api/employees/attendance?date=` — Ponto do dia
- `POST /api/employees/attendance` — Registrar ponto

### Veículos
- `GET /api/vehicles/logs?date=` — Logs do dia + veículos fora
- `POST /api/vehicles/logs` — Registrar saída
- `PUT /api/vehicles/logs/:id` — Registrar retorno

### Dashboard
- `GET /api/dashboard` — Situação em tempo real

### Relatórios
- `GET /api/reports/:type?start=&end=` — Tipos: employee_attendance, outsourced_attendance, vehicles, providers, consular, packages

---

## 🛠️ Para Produção (deploy)

### Backend
```bash
# Build
cd backend
NODE_ENV=production npm start

# Recomendado: usar PM2
npm install -g pm2
pm2 start src/index.js --name embassy-api
pm2 save
```

### Frontend
```bash
cd frontend
npm run build
# Os arquivos ficam em dist/
# Sirva com nginx ou copie para o servidor
```

### Nginx (exemplo)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location /api {
        proxy_pass http://localhost:3001;
    }

    location /uploads {
        proxy_pass http://localhost:3001;
    }

    location / {
        root /caminho/para/frontend/dist;
        try_files $uri /index.html;
    }
}
```

---

## 📦 Dependências Principais

### Backend
- `express` — Servidor HTTP
- `pg` — Cliente PostgreSQL
- `jsonwebtoken` — Autenticação JWT
- `bcrypt` — Hash de senhas
- `multer` — Upload de fotos
- `cors` — Cross-Origin

### Frontend
- `react` + `react-router-dom` — SPA
- `tailwindcss` — Estilização
- `axios` — Requisições HTTP
- `lucide-react` — Ícones
- `date-fns` — Manipulação de datas
- `react-hot-toast` — Notificações
