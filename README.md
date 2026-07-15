# Sistema de Gestão — Portaria da Embaixada

Sistema web completo para digitalização dos controles diários da portaria: ponto de funcionários, frota de veículos, prestadores, visitantes, encomendas e atendimentos consulares.

---

## Estrutura do Projeto

```
sistema-embaixada/
├── backend/                  # API REST — Node.js + Express + PostgreSQL
│   └── src/
│       ├── routes/           # Endpoints da API
│       ├── middleware/       # Autenticação JWT e auditoria
│       ├── config/           # Banco de dados e upload
│       └── migrations/       # Scripts SQL incrementais
├── frontend/                 # SPA — React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/            # Telas do sistema
│       ├── components/       # Componentes reutilizáveis
│       └── contexts/         # Auth e Theme
└── database/
    └── schema.sql            # Schema completo do PostgreSQL
```

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Node.js    | 18+           |
| npm        | 9+            |
| PostgreSQL | 14+           |

---

## Instalação e execução local

### 1. Banco de dados

Crie o banco e aplique o schema:

```bash
psql -U postgres -c "CREATE DATABASE embassy_db;"
psql -U postgres -d embassy_db -f database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # edite com suas credenciais
npm install
npm run dev            # http://localhost:3001
```

`.env` mínimo:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=embassy_db
DB_USER=postgres
DB_PASSWORD=sua_senha

JWT_SECRET=chave_aleatoria_longa_minimo_32_caracteres
JWT_EXPIRES_IN=8h

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local   # ou crie manualmente
npm install
npm run dev                  # http://localhost:5173
```

`.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
```

---

## Login padrão

| Campo | Valor            |
|-------|------------------|
| Email | `admin@embaixada.gov` |
| Senha | `Admin@123`      |

> **Troque a senha após o primeiro acesso.**

Para gerar um novo hash:
```bash
node -e "require('bcrypt').hash('NovaSenha', 10).then(console.log)"
```

---

## Perfis de acesso

| Perfil        | O que pode fazer |
|---------------|------------------|
| `viewer`      | Somente leitura — sem alterações |
| `porteiro`    | Registra todos os controles diários |
| `admin`       | Porteiro + cadastros + relatórios |
| `super_admin` | Acesso total + usuários + auditoria |

---

## Módulos

| Módulo               | Rota                    | Descrição |
|----------------------|-------------------------|-----------|
| Dashboard            | `/`                     | Situação em tempo real da embaixada |
| Funcionários         | `/funcionarios`         | Ponto diário — entrada, almoço e saída |
| Terceirizados        | `/terceirizados`        | Ponto de jardineiros, limpeza, etc. |
| Veículos             | `/veiculos`             | Saídas e retornos da frota com data/hora |
| Prestadores          | `/prestadores`          | Acesso de prestadores de serviço |
| Visitantes           | `/visitantes`           | Registro de visitantes com documento |
| Atend. Consular      | `/consular`             | Agendamentos e atendimentos consulares |
| Encomendas           | `/encomendas`           | Recebimento e entrega de pacotes (+ leitor de código de barras) |
| Relatórios           | `/relatorios`           | Exportação CSV e PDF por período |
| Informações          | `/informacoes`          | Contatos e telefones úteis da embaixada |
| Admin — Funcionários | `/admin/funcionarios`   | Cadastro com ordenação manual (drag-and-drop) |
| Admin — Usuários     | `/admin/usuarios`       | Gerenciamento de usuários do sistema |
| Admin — Veículos     | `/admin/veiculos`       | Cadastro de veículos da frota |
| Admin — Terceirizados| `/admin/terceirizados`  | Cadastro de trabalhadores terceirizados |
| Admin — Auditoria    | `/admin/auditoria`      | Log de todas as ações no sistema |

---

## API — Endpoints principais

### Autenticação
```
POST   /api/auth/login          Login (retorna JWT)
GET    /api/auth/me             Usuário autenticado
```

### Funcionários
```
GET    /api/employees                    Lista (ordem sort_order)
POST   /api/employees                    Criar (admin)
PUT    /api/employees/reorder            Reordenar (admin) — body: { order: [{id, sort_order}] }
PUT    /api/employees/:id                Editar (admin)
GET    /api/employees/attendance?date=   Ponto do dia
POST   /api/employees/attendance         Registrar/atualizar ponto
PUT    /api/employees/attendance/:id     Atualizar campo específico
```

### Veículos
```
GET    /api/vehicles                     Lista veículos cadastrados
GET    /api/vehicles/logs?date=          Logs do dia + veículos fora
POST   /api/vehicles/logs                Registrar saída
PUT    /api/vehicles/logs/:id            Registrar retorno (aceita return_date)
```

### Encomendas
```
GET    /api/packages?status=             Lista (pending | delivered | "")
POST   /api/packages                     Registrar encomenda recebida
PUT    /api/packages/:id                 Editar ou registrar entrega
```

### Relatórios
```
GET    /api/reports/:type?start=&end=
```
Tipos disponíveis: `employee_attendance`, `outsourced_attendance`, `vehicles`, `providers`, `consular`, `packages`, `visitors`

### Dashboard
```
GET    /api/dashboard                    Situação atual em tempo real
```

---

## Banco de dados

O arquivo [database/schema.sql](database/schema.sql) contém o schema completo com todas as tabelas e índices. Execute-o uma única vez para criar a estrutura do banco.

### Tabelas

| Tabela                    | Descrição |
|---------------------------|-----------|
| `users`                   | Usuários do sistema |
| `audit_logs`              | Registro de todas as ações |
| `embassy_info`            | Informações e contatos da embaixada |
| `employees`               | Funcionários (com `sort_order` para ordenação manual) |
| `employee_attendance`     | Ponto diário dos funcionários |
| `outsourced_workers`      | Cadastro de terceirizados |
| `outsourced_attendance`   | Ponto diário dos terceirizados |
| `vehicles`                | Frota de veículos |
| `vehicle_logs`            | Registros de saída/retorno (com `return_date` para viagens multi-dia) |
| `service_providers`       | Cadastro de prestadores de serviço |
| `service_provider_visits` | Visitas de prestadores |
| `consular_appointments`   | Atendimentos consulares |
| `packages`                | Encomendas recebidas |
| `visitor_logs`            | Registros de visitantes |
| `document_images`         | Fotos de documentos (base64) |

### Migrações incrementais

Scripts para atualizar bancos já existentes:

```bash
# Executar migrações pendentes em ordem numérica
psql -U postgres -d embassy_db -f backend/src/migrations/001_sort_order_return_date.sql
psql -U postgres -d embassy_db -f backend/src/migrations/002_prevent_duplicate_open_vehicle_logs.sql
```

| Arquivo | O que faz |
|---------|-----------|
| `001_sort_order_return_date.sql` | Adiciona `sort_order` em `employees` e `return_date` em `vehicle_logs` |
| `002_prevent_duplicate_open_vehicle_logs.sql` | Adiciona índice único parcial para impedir dois logs abertos para o mesmo veículo |

---

## Stack tecnológica

### Backend
| Pacote           | Versão   | Uso |
|------------------|----------|-----|
| express          | ^4.19    | Servidor HTTP |
| pg               | ^8.11    | Cliente PostgreSQL |
| jsonwebtoken     | ^9.0     | Autenticação JWT |
| bcrypt           | ^5.1     | Hash de senhas |
| multer           | ^1.4     | Upload de imagens |
| cors             | ^2.8     | Cross-Origin |
| dotenv           | ^16.4    | Variáveis de ambiente |

### Frontend
| Pacote              | Versão   | Uso |
|---------------------|----------|-----|
| react               | ^18.3    | UI |
| react-router-dom    | ^6.23    | Roteamento SPA |
| vite                | ^5.2     | Build |
| tailwindcss         | ^3.4     | Estilização |
| axios               | ^1.7     | Requisições HTTP |
| date-fns            | ^3.6     | Manipulação de datas |
| jspdf + autotable   | ^2.5     | Geração de PDFs |
| lucide-react        | ^0.383   | Ícones |
| react-hot-toast     | ^2.4     | Notificações |
| @zxing/browser      | ^0.2     | Leitura de código de barras via câmera |

---

## Deploy em produção

Consulte o [DEPLOY.md](DEPLOY.md) para o guia completo de deploy em VPS com PM2 e Nginx, incluindo scripts automáticos de setup, atualização e backup.

Resumo rápido:

```bash
# No servidor — primeira vez
git clone <repo> embassy && cd embassy
bash scripts/setup.sh

# Atualizações
bash scripts/deploy.sh

# Verificar status
bash scripts/status.sh
```

---

## Funcionalidades principais

- **Dashboard em tempo real** — cards com glass effect, fechados/abertos com 1 item de preview
- **Ponto eletrônico** — funcionários e terceirizados, bloqueio de edição em datas passadas
- **Frota de veículos** — suporte a viagens multi-dia (saída e retorno em datas diferentes)
- **Encomendas** — leitor de código de barras via câmera (suporta Code 128, EAN, QR Code e outros)
- **Relatórios em PDF e CSV** — por período, com uma página por funcionário no PDF de ponto
- **Ordenação manual** — admin arrasta para reordenar funcionários (drag-and-drop); ordem reflete em todas as telas e PDFs
- **Fotos de documentos** — captura de documento de prestadores, visitantes e consulares
- **Auditoria completa** — log de criação, edição e exclusão com usuário e IP
- **Tema claro/escuro** — persistido por usuário no localStorage
- **Responsivo** — funciona em desktop e mobile
