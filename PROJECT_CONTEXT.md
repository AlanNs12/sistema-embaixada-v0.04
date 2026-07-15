# PROJECT CONTEXT — Sistema de Gestão da Portaria da Embaixada

> **Documento de contexto completo para modelos de IA.**
> Leia este documento antes de fazer qualquer alteração no código.
> Versão do projeto: v0.04 | Gerado em: 2026-07-15

---

## 1. Visão Geral

### 1.1 O que é o sistema

Sistema full-stack de gestão de portaria para a Embaixada das Filipinas no Brasil. Controla entrada/saída de funcionários, terceirizados, veículos, prestadores de serviço, visitantes, atendimentos consulares e encomendas. Possui dashboard em tempo real, relatórios em PDF/CSV, auditoria completa e controle de acesso por perfis.

### 1.2 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React (SPA) | 18.3.1 |
| **Bundler** | Vite | 7.0.0 |
| **Roteamento** | react-router-dom | 6.23.1 |
| **Estilização** | Tailwind CSS | 3.4.4 |
| **HTTP Client** | axios | 1.7.2 |
| **Ícones** | lucide-react | 0.383.0 |
| **Datas** | date-fns | 3.6.0 |
| **Toasts** | react-hot-toast | 2.4.1 |
| **PDF** | jspdf + jspdf-autotable | 4.2.1 / 5.0.7 |
| **Scanner código barras** | @zxing/browser + @zxing/library | 0.2.0 / 0.22.0 |
| **Backend** | Express.js | 4.19.2 |
| **Banco de Dados** | PostgreSQL | 14+ |
| **Autenticação** | bcrypt + jsonwebtoken | 6.0.0 / 9.0.2 |
| **Validação** | express-validator | 7.3.2 |
| **Upload** | multer (memoryStorage) | 1.4.5 |
| **Segurança** | helmet + cors + express-rate-limit | — |
| **Deploy** | PM2 + Nginx (Linux VPS) | — |

### 1.3 Idiomas

Todo o sistema está em **português brasileiro (pt-BR)**. Não há i18n implementado. O arquivo `I18N_CONTEXT.md` contém o levantamento completo para futura internacionalização.

---

## 2. Estrutura de Pastas (Completa)

```
sistema-embaixada-v0.04/
│
├── .gitignore
├── ecosystem.config.js          # Configuração do PM2 para produção
│
├── database/
│   └── schema.sql               # Schema completo do PostgreSQL (15 tabelas + índices + seed)
│
├── scripts/                     # Scripts de infraestrutura (bash)
│   ├── setup.sh                 # Setup inicial do servidor (Node, PM2, Nginx, DB)
│   ├── deploy.sh                # Deploy completo (git pull + npm install + build + PM2 restart)
│   ├── backup-db.sh             # Backup do banco (pg_dump)
│   ├── restore-db.sh            # Restauração do banco
│   └── status.sh                # Health check do sistema
│
├── backend/                     # Servidor Express.js (API REST)
│   ├── .env                     # Variáveis de ambiente (NÃO gitignored — contém secrets)
│   ├── .env.example             # Template das variáveis de ambiente
│   ├── package.json
│   └── src/
│       ├── index.js             # Ponto de entrada: Express app, middlewares globais, rotas
│       ├── config/
│       │   ├── database.js      # Pool de conexão PostgreSQL (pg)
│       │   └── upload.js        # Configuração do multer + helpers de imagem para DB
│       ├── middleware/
│       │   ├── auth.js          # JWT authenticate + authorize(roles) + blockViewer
│       │   ├── audit.js         # Middleware de auditoria automática (intercepta res.json)
│       │   └── validate.js      # Handler de erros do express-validator
│       ├── migrations/
│       │   └── 001_sort_order_return_date.sql  # Migração: sort_order + return_date
│       └── routes/
│           ├── auth.js          # POST /login, GET /me, PUT /password
│           ├── users.js         # CRUD usuários + GET /audit-logs
│           ├── employees.js     # CRUD funcionários + reorder + attendance (CRUD ponto)
│           ├── outsourced.js    # CRUD terceirizados + attendance (ponto)
│           ├── vehicles.js      # CRUD veículos + logs (saída/retorno)
│           ├── serviceProviders.js  # CRUD prestadores + visits (entrada/saída)
│           ├── consular.js      # Atendimentos consulares (entrada/saída + busca)
│           ├── packages.js      # Encomendas (receber/entregar/editar)
│           ├── visitors.js      # Visitantes (entrada/saída + busca)
│           ├── images.js        # Servir imagens do banco como data-URL JSON
│           └── dashboard.js     # Dashboard stats + GET /reports/:type + embassy_info CRUD
│
├── frontend/                    # SPA React + Vite
│   ├── index.html               # Entry HTML (lang="pt-BR", title="Gestão Portaria")
│   ├── vite.config.js           # Proxy /api -> backend, allowedHosts
│   ├── postcss.config.js
│   ├── tailwind.config.js       # darkMode: 'class'
│   ├── package.json
│   ├── public/
│   │   └── images/
│   │       ├── logo-circle.png  # Logo circular (favicon)
│   │       └── logo-emblem.png  # Logo emblema (sidebar + login + PDF header)
│   └── src/
│       ├── main.jsx             # Entry React: BrowserRouter + ThemeProvider + App + Toaster
│       ├── App.jsx              # Definição de rotas + auth guards (PrivateRoute)
│       ├── api.js               # Instância axios: baseURL, token interceptor, 401 redirect
│       ├── index.css            # Tailwind directives + componentes customizados (@layer)
│       ├── components/
│       │   ├── Layout.jsx       # Shell da aplicação: sidebar + mobile header + <Outlet/>
│       │   ├── Modal.jsx        # Modal genérico (overlay + header + body + footer)
│       │   ├── DetailModal.jsx  # Modal de detalhes para 6 tipos de entidade
│       │   ├── ChangePasswordModal.jsx  # Modal de alteração de senha
│       │   ├── BarcodeScanner.jsx       # Scanner de código de barras (ZXing, portal)
│       │   ├── CameraCapture.jsx        # Captura de foto via câmera (portal)
│       │   └── DocImage.jsx            # Botão "Ver doc." que exibe imagem do banco
│       ├── contexts/
│       │   ├── AuthContext.jsx   # Provedor de autenticação (user, login, logout, roles)
│       │   └── ThemeContext.jsx  # Provedor de tema dark/light (persiste em localStorage)
│       └── pages/
│           ├── Login.jsx                 # Tela de login
│           ├── Dashboard.jsx             # Dashboard com cards resumo + listas colapsáveis
│           ├── EmployeeAttendance.jsx    # Ponto de funcionários (entrada/almoço/saída)
│           ├── OutsourcedAttendance.jsx  # Ponto de terceirizados
│           ├── Vehicles.jsx              # Controle de saída/retorno de veículos
│           ├── ServiceProviders.jsx      # Entrada/saída de prestadores de serviço
│           ├── Consular.jsx              # Atendimentos consulares
│           ├── Packages.jsx              # Controle de encomendas
│           ├── Visitors.jsx              # Controle de visitantes
│           ├── Reports.jsx               # Geração de relatórios CSV + PDF
│           ├── EmbassyInfo.jsx           # Informações de contato da embaixada
│           └── admin/
│               ├── AdminEmployees.jsx    # CRUD de funcionários + drag-and-drop reorder
│               ├── AdminUsers.jsx        # CRUD de usuários do sistema
│               ├── AdminVehicles.jsx     # CRUD de veículos (cards)
│               ├── AdminOutsourced.jsx   # CRUD de terceirizados + prestadores (2 tabs)
│               └── AuditLogs.jsx         # Visualização de logs de auditoria
```

---

## 3. Domínio e Regras de Negócio

### 3.1 Entidades Principais

| Entidade | Tabela(s) | Descrição |
|----------|----------|-----------|
| **Usuários** | `users` | Quem opera o sistema. Perfis: `super_admin`, `admin`, `porteiro`, `viewer` |
| **Funcionários** | `employees`, `employee_attendance` | Funcionários da embaixada + registro de ponto diário (4 horários) |
| **Terceirizados** | `outsourced_workers`, `outsourced_attendance` | Jardineiros/limpeza + ponto diário (entrada/saída) |
| **Veículos** | `vehicles`, `vehicle_logs` | Frota da embaixada + registros de saída/retorno |
| **Prestadores** | `service_providers`, `service_provider_visits` | Empresas/pessoas que prestam serviço + registro de visitas |
| **Atendimentos Consulares** | `consular_appointments` | Visitantes para serviços consulares (agendamento, entrada, saída) |
| **Encomendas** | `packages` | Pacotes recebidos na portaria (status: pending/delivered) |
| **Visitantes** | `visitor_logs` | Visitantes gerais da embaixada (entrada, documento, saída) |
| **Documentos** | `document_images` | Fotos de documentos (RG, etc.) armazenadas como base64 |
| **Auditoria** | `audit_logs` | Log automático de toda ação de criação/edição/remoção |
| **Embaixada** | `embassy_info` | Contatos, telefones e informações úteis da embaixada |

### 3.2 Fluxo de Ponto de Funcionários

O ponto diário de cada funcionário registra até 4 eventos temporais:
1. **Entrada** (`entry_time`)
2. **Saída para almoço** (`lunch_out_time`)
3. **Retorno do almoço** (`lunch_return_time`)
4. **Saída** (`exit_time`)

Regra: só é possível editar o ponto do **dia atual**. Datas passadas são somente leitura.
O registro usa UPSERT (ON CONFLICT) — se já existe um registro para aquele funcionário naquela data, os campos são atualizados incrementalmente.

### 3.3 Fluxo de Veículos

1. **Registrar saída:** porteiro seleciona veículo, informa horário de saída, condutor, motivo, passageiros
2. **Registrar retorno:** porteiro informa data e horário de retorno
3. **Validação:** o horário de retorno não pode ser anterior ao horário de saída
4. **Suporte multi-day:** o veículo pode sair em um dia e retornar em outro (`return_date`)
5. **Bloqueio:** um veículo com saída em aberto não pode ter nova saída registrada

### 3.4 Fluxo de Encomendas

1. **Receber:** porteiro registra empresa entregadora, código de rastreio, destinatário
2. **Entregar:** porteiro registra quem recebeu a encomenda (funcionário ou nome)
3. **Status:** `pending` → `delivered`
4. **Scanner:** suporte a leitura de código de barras via câmera (ZXing)

### 3.5 Fluxo de Visitantes e Consulares

Ambos seguem o mesmo padrão:
1. **Registrar entrada:** nome, documento (visitantes), motivo, funcionário a visitar, foto do documento (opcional)
2. **Busca histórica:** pesquisa visitantes/atendimentos anteriores para preencher formulário automaticamente
3. **Registrar saída:** botão "Saída" ou "Reg. saída" no registro ativo
4. **Foto anterior:** ao selecionar registro histórico, a foto do documento é reaproveitada

### 3.6 Dashboard

O dashboard mostra em tempo real:
- 4 cards resumo: funcionários presentes, veículos na rua, prestadores dentro, encomendas pendentes
- Listas colapsáveis com preview de 2 itens + botão "Ver todos"
- Data formatada por extenso com locale pt-BR
- Terceirizados presentes em seção separada

### 3.7 Relatórios

- 7 tipos de relatórios por período (data inicial/final)
- Filtro por funcionário específico (apenas no tipo `employee_attendance`)
- Exportação CSV (UTF-8 BOM) e PDF (jspdf + autotable)
- PDF gera uma página por funcionário quando nenhum filtro é aplicado
- PDF inclui logo, título, subtítulo, período, total de registros, rodapé com numeração

---

## 4. Banco de Dados

### 4.1 Schema Completo (15 Tabelas)

```
┌──────────────────────────────────────────────────────────────────┐
│                           users                                   │
│  id | name | email (unique) | password_hash | role | active       │
│  role: super_admin | admin | porteiro | viewer                    │
└────────────┬─────────────────────────────────────────────────────┘
             │ user_id (FK)
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                         audit_logs                                │
│  id | user_id | user_name | action | entity | entity_id | details │
│  action: LOGIN | CREATE | UPDATE | UPSERT | DELETE               │
│  entity: auth | user | employee | vehicle | package | visitor ... │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       embassy_info                               │
│  id | category | label | value | description | sort_order | active│
│  category: telefone | email | site | outro                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         employees                                 │
│  id | name | position | department | email | phone | sort_order   │
│  active: boolean                                                 │
└────────────┬─────────────────────────────────────────────────────┘
             │ employee_id (FK)
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    employee_attendance                            │
│  id | employee_id | date | entry_time | lunch_out_time            │
│  lunch_return_time | exit_time | notes | created_by              │
│  UNIQUE (employee_id, date) — UPSERT                             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     outsourced_workers                            │
│  id | name | role | company | active                             │
│  role: jardineiro | limpeza                                      │
└────────────┬─────────────────────────────────────────────────────┘
             │ worker_id (FK)
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   outsourced_attendance                           │
│  id | worker_id | date | entry_time | exit_time | notes           │
│  UNIQUE (worker_id, date) — UPSERT                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         vehicles                                  │
│  id | plate (unique) | model | description | active              │
└────────────┬─────────────────────────────────────────────────────┘
             │ vehicle_id (FK)
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                       vehicle_logs                                │
│  id | vehicle_id | date | departure_time | return_time            │
│  return_date | driver | passengers | reason | observations        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    service_providers                              │
│  id | name | company | notes | active                            │
└────────────┬─────────────────────────────────────────────────────┘
             │ provider_id (FK, nullable)
             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  service_provider_visits                          │
│  id | provider_id | visitor_name | company | reason               │
│  employee_id | entry_time | exit_time | notes                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                   consular_appointments                           │
│  id | date | visitor_name | visit_reason | employee_id            │
│  scheduled_time | entry_time | exit_time | notes                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         packages                                  │
│  id | delivery_company | tracking_code | recipient_employee_id    │
│  recipient_name | received_at | delivered_to_id                  │
│  delivered_to_name | delivered_at | status | notes               │
│  status: pending | delivered                                      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       visitor_logs                                │
│  id | date | visitor_name | document_number | reason              │
│  employee_id | entry_time | exit_time | notes                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      document_images                              │
│  id | entity_type | entity_id | image_data (base64 TEXT)          │
│  mime_type | original_name | file_size                           │
│  entity_type: provider | provider_visit | consular | visitor     │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Relacionamentos Chave

```
users ──FK──> todos os created_by
employees ──FK──> employee_attendance.employee_id
employees ──FK──> service_provider_visits.employee_id
employees ──FK──> consular_appointments.employee_id
employees ──FK──> packages.recipient_employee_id
employees ──FK──> packages.delivered_to_id
employees ──FK──> visitor_logs.employee_id
vehicles ──FK──> vehicle_logs.vehicle_id (RESTRICT delete)
service_providers ──FK──> service_provider_visits.provider_id (SET NULL)
```

### 4.3 Timezone

O servidor usa `America/Sao_Paulo` (UTC-3). Nas queries de inserção de visitantes e atendimentos consulares, a data é calculada com `(NOW() AT TIME ZONE 'America/Sao_Paulo')::date` para garantir que o dia local brasileiro seja usado, não o dia UTC.

### 4.4 Usuário Padrão (Seed)

```sql
email: admin@embaixada.gov
senha: Admin@123
role: super_admin
```

O hash bcrypt está hardcoded no `schema.sql:28`.

---

## 5. API REST — Rotas Completas

### 5.1 Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/auth/login` | Não (rate limited: 10/15min) | Login: recebe `{email, password}`, retorna `{token, user}` |
| `GET` | `/api/auth/me` | Sim (JWT) | Retorna dados do usuário logado |
| `PUT` | `/api/auth/password` | Sim (JWT) | Altera senha: `{currentPassword, newPassword, confirmPassword}` |

### 5.2 Usuários (admin+)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/users` | admin, super_admin | Listar usuários |
| `POST` | `/api/users` | super_admin | Criar usuário |
| `PUT` | `/api/users/:id` | super_admin | Atualizar usuário |
| `GET` | `/api/users/audit-logs` | admin, super_admin | Listar logs de auditoria (query: page, limit, user_id) |

### 5.3 Funcionários

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/employees` | Autenticado | Listar funcionários ativos (ordenado por sort_order) |
| `POST` | `/api/employees` | admin, super_admin | Criar funcionário |
| `PUT` | `/api/employees/:id` | admin, super_admin | Atualizar funcionário |
| `PUT` | `/api/employees/reorder` | admin, super_admin | Reordenar (drag-and-drop): `{order: [{id, sort_order}]}` |
| `GET` | `/api/employees/attendance?date=` | Autenticado | Ponto do dia: retorna `{present: [], absent: []}` |
| `POST` | `/api/employees/attendance` | Autenticado | UPSERT de ponto: `{employee_id, date, entry_time, lunch_out_time, lunch_return_time, exit_time, notes}` |
| `PUT` | `/api/employees/attendance/:id` | Autenticado | Atualizar campos específicos do ponto |

### 5.4 Terceirizados

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/outsourced` | Autenticado | Listar terceirizados ativos |
| `POST` | `/api/outsourced` | admin, super_admin | Criar terceirizado |
| `PUT` | `/api/outsourced/:id` | admin, super_admin | Atualizar terceirizado |
| `GET` | `/api/outsourced/attendance?date=` | Autenticado | Ponto do dia: `{present: [], absent: []}` |
| `POST` | `/api/outsourced/attendance` | admin, super_admin, porteiro | UPSERT de ponto |
| `PUT` | `/api/outsourced/attendance/:id` | admin, super_admin, porteiro | Atualizar campos do ponto |

### 5.5 Veículos

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/vehicles` | Autenticado | Listar veículos ativos |
| `POST` | `/api/vehicles` | admin, super_admin | Criar veículo |
| `PUT` | `/api/vehicles/:id` | admin, super_admin | Atualizar veículo |
| `GET` | `/api/vehicles/logs?date=&vehicle_id=` | Autenticado | Logs do dia + veículos na rua: `{logs: [], vehicles_out: []}` |
| `POST` | `/api/vehicles/logs` | admin, super_admin, porteiro | Registrar saída |
| `PUT` | `/api/vehicles/logs/:id` | admin, super_admin, porteiro | Registrar retorno ou editar observações |

### 5.6 Prestadores

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/providers` | Autenticado | Listar prestadores ativos (com image_id) |
| `POST` | `/api/providers` | admin, super_admin | Criar prestador (multipart: document_photo opcional) |
| `PUT` | `/api/providers/:id` | admin, super_admin | Atualizar prestador (multipart) |
| `GET` | `/api/providers/visits?date=` | Autenticado | Visitas do dia + dentro da embaixada: `{visits: [], currently_inside: []}` |
| `POST` | `/api/providers/visits` | Autenticado | Registrar entrada (multipart: document_photo opcional) |
| `PUT` | `/api/providers/visits/:id` | Autenticado | Registrar saída |

### 5.7 Atendimentos Consulares

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/consular/search?q=` | Autenticado | Buscar atendimentos anteriores (mín 2 chars) |
| `GET` | `/api/consular?date=` | Autenticado | Atendimentos do dia + dentro: `{appointments: [], currently_inside: []}` |
| `POST` | `/api/consular` | Autenticado | Registrar atendimento (multipart) |
| `PUT` | `/api/consular/:id` | Autenticado | Registrar saída |

### 5.8 Encomendas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/packages?status=&date=` | Autenticado | Listar encomendas (filtro por status e data) |
| `POST` | `/api/packages` | admin, super_admin, porteiro | Registrar recebimento |
| `PUT` | `/api/packages/:id` | admin, super_admin, porteiro | Editar ou entregar (`action: 'deliver'` para entrega) |

### 5.9 Visitantes

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/visitors/search?q=` | Autenticado | Buscar visitas anteriores |
| `GET` | `/api/visitors?date=` | Autenticado | Visitantes do dia + dentro: `{visitors: [], currently_inside: []}` |
| `POST` | `/api/visitors` | admin, super_admin, porteiro | Registrar entrada (multipart) |
| `PUT` | `/api/visitors/:id` | admin, super_admin, porteiro | Registrar saída |

### 5.10 Imagens

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/images/id/:id` | Autenticado | Buscar imagem por ID |
| `GET` | `/api/images/:entityType/:entityId` | Autenticado | Buscar imagem mais recente da entidade |

### 5.11 Dashboard & Relatórios & Info

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/dashboard` | Autenticado | Dados do dashboard (resumo + listas) |
| `GET` | `/api/reports/:type?start=&end=` | Autenticado | Dados para relatório (7 tipos) |
| `GET` | `/api/info` | Autenticado | Listar informações da embaixada |
| `POST` | `/api/info` | admin, super_admin | Criar informação |
| `PUT` | `/api/info/:id` | admin, super_admin | Atualizar informação |
| `DELETE` | `/api/info/:id` | super_admin | Soft-delete informação |

### 5.12 Health

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/health` | Não | `{status: 'ok', timestamp: ...}` |

---

## 6. Frontend — Arquitetura

### 6.1 Roteamento (react-router-dom v6)

```
/login                                     → Login.jsx (público)
/                                          → Layout.jsx (shell) + Dashboard.jsx (index)
/funcionarios                              → EmployeeAttendance.jsx
/terceirizados                             → OutsourcedAttendance.jsx
/veiculos                                  → Vehicles.jsx
/prestadores                               → ServiceProviders.jsx
/consular                                  → Consular.jsx
/visitantes                                → Visitors.jsx
/encomendas                                → Packages.jsx
/relatorios                                → Reports.jsx
/informacoes                               → EmbassyInfo.jsx
/admin/funcionarios                        → AdminEmployees.jsx   (admin+)
/admin/usuarios                            → AdminUsers.jsx       (admin+)
/admin/veiculos                            → AdminVehicles.jsx    (admin+)
/admin/terceirizados                       → AdminOutsourced.jsx  (admin+)
/admin/auditoria                           → AuditLogs.jsx        (admin+)
```

**Todas as rotas exceto `/login` são protegidas** pelo componente `PrivateRoute` que:
1. Redireciona para `/login` se não autenticado
2. Redireciona para `/` se não for admin e a rota exigir admin

### 6.2 Estrutura de Contextos

```
<BrowserRouter>
  <ThemeProvider>        ← Gerencia tema dark/light, persiste em localStorage
    <AuthProvider>       ← Gerencia user, login(), logout(), isAdmin, canEdit
      <App />
      <Toaster />        ← react-hot-toast (posição top-right, 3s)
    </AuthProvider>
  </ThemeProvider>
</BrowserRouter>
```

### 6.3 AuthContext — Perfis e Permissões

```javascript
user.role ∈ { 'super_admin', 'admin', 'porteiro', 'viewer' }

// Derivados:
isAdmin      = role === 'super_admin' || role === 'admin'
isSuperAdmin = role === 'super_admin'
isViewer     = role === 'viewer'
canEdit      = !isViewer  // porteiro, admin, super_admin podem editar
```

**Regra de acesso:**
| Ação | super_admin | admin | porteiro | viewer |
|------|:--:|:--:|:--:|:--:|
| Ver dashboard e listas | ✅ | ✅ | ✅ | ✅ |
| Registrar entradas/saídas (ponto, veículos, visitantes, etc.) | ✅ | ✅ | ✅ | ❌ |
| CRUD de funcionários/veículos/terceirizados/prestadores | ✅ | ✅ | ❌ | ❌ |
| CRUD de usuários | ✅ | ❌ | ❌ | ❌ |
| Ver logs de auditoria | ✅ | ✅ | ❌ | ❌ |

### 6.4 API Client (axios)

Arquivo: `frontend/src/api.js`

```javascript
baseURL: import.meta.env.VITE_API_URL || '/api'
timeout: 15000

// Interceptor de request:
// Anexa token JWT do localStorage no header Authorization: Bearer {token}

// Interceptor de response:
// Se status 401: limpa localStorage (token + user) e redireciona para /login
```

### 6.5 Tailwind CSS — Design System

O projeto define classes customizadas no `index.css` (layer `@components`):

| Classe | Descrição |
|--------|-----------|
| `.btn` | Base de botão com flex, gap, padding, transições |
| `.btn-primary` | Fundo azul, texto branco |
| `.btn-secondary` | Fundo cinza, borda |
| `.btn-danger` | Fundo vermelho |
| `.btn-success` | Fundo verde |
| `.btn-sm` | Botão pequeno (px-3 py-1.5 text-xs) |
| `.input` | Campo de formulário estilizado |
| `.label` | Label de campo |
| `.form-group` | Agrupamento de label + input |
| `.card` | Card com borda, sombra, cantos arredondados |
| `.card-header` | Cabeçalho do card com borda inferior |
| `.card-body` | Corpo do card com padding |
| `.badge` | Base de badge |
| `.badge-green`, `.badge-red`, `.badge-yellow`, `.badge-blue`, `.badge-gray`, `.badge-purple` | Variantes de badge |
| `.table-container` | Container de tabela com scroll horizontal |
| `.table` | Tabela estilizada |
| `.modal-overlay`, `.modal`, `.modal-header`, `.modal-body`, `.modal-footer` | Sistema de modal |
| `.sidebar-link`, `.sidebar-link-active`, `.sidebar-link-inactive` | Links da sidebar |

### 6.6 Layout — Sidebar

O `Layout.jsx` renderiza:
- **Desktop:** sidebar fixa (260px) com logo, navegação, admin dropdown, user footer
- **Mobile:** header com botão hamburger + sidebar em drawer (overlay)

A sidebar contém:
- Logo + nome do sistema + subtítulo
- Botão toggle tema (dark/light)
- Links de navegação principais (9 itens)
- Seção "Administração" colapsável (5 itens, visível apenas para admin)
- User footer: avatar (inicial), nome, role, botão alterar senha, botão sair

### 6.7 Componentes Compartilhados

| Componente | Props | Uso |
|-----------|-------|-----|
| `Modal` | `open, onClose, title, children, footer` | Modal genérico usado em toda a aplicação |
| `DetailModal` | `open, onClose, type, record` | Detalhes de 6 entidades (consular, provider_visit, visitor, vehicle_log, employee_attendance, outsourced_attendance, package) |
| `ChangePasswordModal` | `open, onClose` | Alterar senha do usuário logado |
| `BarcodeScanner` | `onScan(code), onClose` | Scanner via portal (renderiza no document.body) |
| `CameraCapture` | `onCapture(file), onClose` | Câmera via portal |
| `DocImage` | `entityType, entityId, imageId` | Botão/badge para ver foto do documento |

### 6.8 Padrões de Código Comuns

**Formulários:**
```jsx
const [form, setForm] = useState({ campo1: '', campo2: '' })
// Atualização: setForm({ ...form, campo1: valor })
// Submissão: api.post('/rota', form) ou FormData com multipart
```

**Toasts:**
```javascript
import toast from 'react-hot-toast'
toast.success('Mensagem de sucesso')
toast.error(err.response?.data?.error || 'Mensagem padrão')
```

**Busca com debounce (300ms) em Consular e Visitors:**
```javascript
const searchTimeout = useRef(null)
clearTimeout(searchTimeout.current)
searchTimeout.current = setTimeout(async () => { ... }, 300)
```

**FormData para upload de foto:**
```javascript
const fd = new FormData()
Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
if (photo) fd.append('document_photo', photo)
await api.post('/rota', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
```

**Blob URL para preview de foto:**
```javascript
const file = e.target.files[0]
setPhoto(file)
setPhotoPreview(URL.createObjectURL(file))
```

---

## 7. Backend — Arquitetura

### 7.1 Middleware Global (ordem de aplicação)

1. `helmet()` — Security headers
2. `Permissions-Policy: camera=*` — Permite acesso à câmera
3. `rateLimit` (apenas na rota `/api/auth/login`) — 10 tentativas / 15 minutos
4. `cors()` — Origens configuradas via `FRONTEND_URL` no `.env`
5. `express.json({ limit: '10mb' })` — Body parser (10MB para imagens base64)
6. JWT `authenticate` — Em todas as rotas exceto login e health
7. `authorize(roles)` — Em rotas específicas que exigem perfil
8. `blockViewer` — Em rotas de mutação (viewers não podem escrever)
9. `audit(action, entity)` — Em rotas de criação/edição/remoção (ver 7.2)

### 7.2 Middleware de Auditoria (audit.js)

Intercepta `res.json()` e, se a resposta for bem-sucedida (status < 400), insere automaticamente um registro em `audit_logs` com:
- `user_id`, `user_name` — do token JWT
- `action` — CREATE, UPDATE, DELETE, UPSERT, LOGIN
- `entity` — nome da entidade (ex: 'employee', 'vehicle_log', 'package')
- `entity_id` — do `req.params.id` ou do `data.id` da resposta
- `details` — JSON.stringify do body e params da requisição
- `ip_address` — IP do cliente

### 7.3 Validação (express-validator)

Todas as rotas de criação/edição usam `body()` com `.withMessage()` para validação.
O middleware `validate.js` coleta erros do `validationResult` e retorna o primeiro erro com status 400.

### 7.4 Armazenamento de Imagens

Imagens de documentos são armazenadas como **base64 no banco de dados** (tabela `document_images`, coluna `image_data` tipo TEXT). O multer usa `memoryStorage` (sem disco). As imagens são servidas como JSON com data-URL:

```json
{
  "id": 1,
  "src": "data:image/jpeg;base64,/9j/4AAQ...",
  "mime_type": "image/jpeg",
  "original_name": "documento.jpg"
}
```

### 7.5 Variáveis de Ambiente (.env)

```env
# Backend
BACKEND_PORT=3001
BACKEND_HOST=127.0.0.1
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=***
DB_NAME=dbEmbaixadaDev

# JWT
JWT_SECRET=***
JWT_EXPIRES_IN=8h
```

---

## 8. Padrões e Convenções de Código

### 8.1 Frontend

- **Nomenclatura:** PascalCase para componentes, camelCase para funções/variáveis
- **Estado local:** `useState` — sem gerenciador de estado global além dos contexts
- **Estilização condicional:** template literals com classes Tailwind
- **Dark mode:** prefixo `dark:` em todas as classes de cor
- **Ícones:** lucide-react importados individualmente (não usa barrel imports)
- **Formatação de data:** `date-fns` com locale `ptBR` para nomes de dias/meses; split manual para `dd/MM/yyyy` em vários locais
- **Valores nulos/vazios:** representados como `"—"` (em dash)

### 8.2 Backend

- **Nomenclatura:** snake_case para colunas do banco, camelCase para variáveis JS
- **Rotas:** Express Router modular, um arquivo por domínio
- **Queries:** SQL raw com `pg` (sem ORM)
- **Tratamento de erros:** try/catch com `res.status(500).json({ error: err.message })`
- **Padrão UPSERT:** `INSERT ... ON CONFLICT ... DO UPDATE SET ... COALESCE(...)` — usado em employee_attendance e outsourced_attendance
- **Auditoria:** Middleware que intercepta `res.json`

### 8.3 Banco de Dados

- **PK:** SERIAL (auto-increment)
- **Timestamps:** `created_at` e `updated_at` com default `NOW()`
- **Soft delete:** `active` boolean (não remove registros)
- **Índices:** Em colunas de data, status e chaves estrangeiras frequentes
- **Constraints:** UNIQUE em (employee_id, date) e (worker_id, date) para ponto; UNIQUE em plate para veículos

---

## 9. Deploy e Infraestrutura

### 9.1 Arquitetura de Produção

```
Internet (HTTPS)
    │
    ▼
┌──────────┐       ┌──────────────────┐       ┌────────────┐
│  Nginx   │ ────► │  Frontend (Vite)  │       │ PostgreSQL │
│  :80/443 │       │  Arquivos estáticos│      │   :5432    │
│          │       └──────────────────┘       └────────────┘
│          │       ┌──────────────────┐
│  /api    │ ────► │  Backend (Express)│
│  proxy   │       │  PM2 :3001        │
└──────────┘       └──────────────────┘
```

### 9.2 PM2 (ecosystem.config.js)

```javascript
{
  apps: [{
    name: 'embassy-backend',
    script: 'src/index.js',
    cwd: './backend',
    env: { NODE_ENV: 'production' }
  }]
}
```

### 9.3 Scripts de Deploy

- `setup.sh`: Instala Node.js 20+, PM2, Nginx, PostgreSQL, cria banco, executa schema.sql
- `deploy.sh`: git pull, npm install (backend + frontend), npm run build (frontend), PM2 restart
- `backup-db.sh` / `restore-db.sh`: pg_dump / pg_restore

---

## 10. Guia Rápido — Como Fazer Alterações

### 10.1 Adicionar uma nova página

1. Criar arquivo em `frontend/src/pages/NovaPagina.jsx`
2. Importar em `App.jsx`
3. Adicionar `<Route path="nova-rota" element={<NovaPagina />} />` dentro do `<Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>`
4. (Opcional) Adicionar link em `navItems` no `Layout.jsx`

### 10.2 Adicionar um novo endpoint

1. Criar arquivo em `backend/src/routes/novaRota.js`
2. Exportar `router` com `module.exports = router`
3. Registrar em `backend/src/index.js`: `app.use('/api/nova-rota', require('./routes/novaRota'))`

### 10.3 Adicionar uma nova tabela

1. Adicionar `CREATE TABLE` em `database/schema.sql`
2. Criar migration SQL separada em `backend/src/migrations/`
3. Atualizar o seed ou dados existentes conforme necessário

### 10.4 Modificar permissões

- Backend: alterar array de roles em `authorize('super_admin', 'admin')` nas rotas
- Frontend: usar `useAuth()` → `isAdmin`, `isSuperAdmin`, `canEdit`, `isViewer`

### 10.5 Adicionar foto de documento a uma nova entidade

1. Adicionar entity_type na tabela `document_images` (via INSERT com novo tipo)
2. No frontend: usar `CameraCapture` + `galleryInputRef` (padrão existente em `ServiceProviders.jsx`, `Consular.jsx`, `Visitors.jsx`)
3. No backend: usar `upload.single('document_photo')` + `saveImageToDB(file, entityType, entityId)`

---

## 11. Checklist de Arquivos por Responsabilidade

### Frontend — 29 arquivos fonte

| Responsabilidade | Arquivo |
|-----------------|---------|
| Entry point | `index.html`, `main.jsx`, `App.jsx` |
| Config | `vite.config.js`, `tailwind.config.js`, `postcss.config.js` |
| API client | `api.js` |
| Estilos | `index.css` |
| Contextos | `AuthContext.jsx`, `ThemeContext.jsx` |
| Layout | `Layout.jsx` |
| Modais | `Modal.jsx`, `DetailModal.jsx`, `ChangePasswordModal.jsx` |
| Câmera/Scanner | `BarcodeScanner.jsx`, `CameraCapture.jsx` |
| Imagens | `DocImage.jsx` |
| Páginas (13) | `Login.jsx`, `Dashboard.jsx`, `EmployeeAttendance.jsx`, `OutsourcedAttendance.jsx`, `Vehicles.jsx`, `ServiceProviders.jsx`, `Consular.jsx`, `Packages.jsx`, `Visitors.jsx`, `Reports.jsx`, `EmbassyInfo.jsx` |
| Admin (5) | `AdminEmployees.jsx`, `AdminUsers.jsx`, `AdminVehicles.jsx`, `AdminOutsourced.jsx`, `AuditLogs.jsx` |

### Backend — 15 arquivos fonte

| Responsabilidade | Arquivo |
|-----------------|---------|
| Entry point | `index.js` |
| Config | `database.js`, `upload.js` |
| Middleware | `auth.js`, `audit.js`, `validate.js` |
| Routes | `auth.js`, `users.js`, `employees.js`, `outsourced.js`, `vehicles.js`, `serviceProviders.js`, `consular.js`, `packages.js`, `visitors.js`, `images.js`, `dashboard.js` |
| Migration | `001_sort_order_return_date.sql` |

---

> **Este documento deve ser lido por qualquer modelo de IA antes de fazer alterações neste projeto.**
> Ele contém toda a arquitetura, padrões, convenções e regras de negócio necessárias para entender o sistema completamente.
