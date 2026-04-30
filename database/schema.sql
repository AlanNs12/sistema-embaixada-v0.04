-- =============================================================
--  SCHEMA COMPLETO — Sistema de Gestão da Portaria da Embaixada
--  PostgreSQL 14+
--  Execute: psql -U <user> -d <database> -f schema.sql
-- =============================================================

-- ─────────────────────────────────────────────────────────────
--  1. USUÁRIOS DO SISTEMA
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'porteiro'
                  CHECK (role IN ('super_admin', 'admin', 'porteiro', 'viewer')),
  active        BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Usuário padrão super_admin (senha: Admin@123)
-- Gere um novo hash com: node -e "require('bcrypt').hash('SuaSenha',10).then(console.log)"
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Super Admin',
  'admin@embaixada.gov',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- Admin@123
  'super_admin'
) ON CONFLICT (email) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
--  2. AUDITORIA
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  user_name  VARCHAR(100),
  action     VARCHAR(50)  NOT NULL,   -- CREATE | UPDATE | DELETE | UPSERT
  entity     VARCHAR(50)  NOT NULL,   -- employee | vehicle_log | package | etc.
  entity_id  INTEGER,
  details    TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
--  3. INFORMAÇÕES DA EMBAIXADA
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS embassy_info (
  id          SERIAL PRIMARY KEY,
  category    VARCHAR(50)  NOT NULL,   -- ex: 'contato', 'emergencia', 'interno'
  label       VARCHAR(100) NOT NULL,
  value       VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  active      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
--  4. FUNCIONÁRIOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  position    VARCHAR(100),
  department  VARCHAR(100),
  email       VARCHAR(100),
  phone       VARCHAR(30),
  sort_order  INTEGER      NOT NULL DEFAULT 0,   -- ordem manual (drag-and-drop)
  active      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_active_sort ON employees (active, sort_order);


-- ─────────────────────────────────────────────────────────────
--  5. PONTO DE FUNCIONÁRIOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_attendance (
  id                SERIAL PRIMARY KEY,
  employee_id       INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date              DATE    NOT NULL DEFAULT CURRENT_DATE,
  entry_time        TIME,
  lunch_out_time    TIME,
  lunch_return_time TIME,
  exit_time         TIME,
  notes             TEXT,
  created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_emp_att_date ON employee_attendance (date);


-- ─────────────────────────────────────────────────────────────
--  6. TRABALHADORES TERCEIRIZADOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outsourced_workers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  role       VARCHAR(50)  NOT NULL,   -- ex: 'Jardineiro', 'Limpeza'
  company    VARCHAR(100),
  active     BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
--  7. PONTO DE TERCEIRIZADOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outsourced_attendance (
  id         SERIAL PRIMARY KEY,
  worker_id  INTEGER NOT NULL REFERENCES outsourced_workers(id) ON DELETE CASCADE,
  date       DATE    NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME,
  exit_time  TIME,
  notes      TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (worker_id, date)
);

CREATE INDEX IF NOT EXISTS idx_out_att_date ON outsourced_attendance (date);


-- ─────────────────────────────────────────────────────────────
--  8. VEÍCULOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id          SERIAL PRIMARY KEY,
  plate       VARCHAR(20)  NOT NULL UNIQUE,
  model       VARCHAR(100),
  description VARCHAR(255),
  active      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
--  9. REGISTROS DE USO DE VEÍCULOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicle_logs (
  id             SERIAL PRIMARY KEY,
  vehicle_id     INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  date           DATE    NOT NULL DEFAULT CURRENT_DATE,  -- data de saída
  departure_time TIME    NOT NULL,
  return_time    TIME,
  return_date    DATE,                                   -- data de retorno (pode ser diferente de date)
  driver         VARCHAR(100),
  passengers     TEXT,
  reason         VARCHAR(255),
  observations   TEXT,
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vlog_date       ON vehicle_logs (date);
CREATE INDEX IF NOT EXISTS idx_vlog_return_null ON vehicle_logs (return_time) WHERE return_time IS NULL;


-- ─────────────────────────────────────────────────────────────
--  10. PRESTADORES DE SERVIÇO (cadastro)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_providers (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  company    VARCHAR(100),
  notes      TEXT,
  active     BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────
--  11. VISITAS DE PRESTADORES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_provider_visits (
  id           SERIAL PRIMARY KEY,
  provider_id  INTEGER REFERENCES service_providers(id) ON DELETE SET NULL,
  visitor_name VARCHAR(100),   -- nome avulso quando não cadastrado
  company      VARCHAR(100),
  reason       TEXT,
  employee_id  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  entry_time   TIMESTAMP NOT NULL DEFAULT NOW(),
  exit_time    TIMESTAMP,
  notes        TEXT,
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spv_exit_null ON service_provider_visits (exit_time) WHERE exit_time IS NULL;


-- ─────────────────────────────────────────────────────────────
--  12. ATENDIMENTOS CONSULARES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consular_appointments (
  id             SERIAL PRIMARY KEY,
  date           DATE    NOT NULL DEFAULT CURRENT_DATE,
  visitor_name   VARCHAR(100) NOT NULL,
  visit_reason   TEXT,
  employee_id    INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  scheduled_time TIME,
  entry_time     TIMESTAMP,
  exit_time      TIMESTAMP,
  notes          TEXT,
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_date ON consular_appointments (date);


-- ─────────────────────────────────────────────────────────────
--  13. ENCOMENDAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packages (
  id                    SERIAL PRIMARY KEY,
  delivery_company      VARCHAR(100) NOT NULL,
  tracking_code         VARCHAR(100),
  recipient_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  recipient_name        VARCHAR(100),
  received_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  delivered_to_id       INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  delivered_to_name     VARCHAR(100),
  delivered_at          TIMESTAMP,
  status                VARCHAR(20)  NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'delivered')),
  notes                 TEXT,
  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_status ON packages (status);


-- ─────────────────────────────────────────────────────────────
--  14. VISITANTES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitor_logs (
  id              SERIAL PRIMARY KEY,
  date            DATE         NOT NULL DEFAULT CURRENT_DATE,
  visitor_name    VARCHAR(100) NOT NULL,
  document_number VARCHAR(50),
  reason          TEXT,
  employee_id     INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  entry_time      TIMESTAMP,
  exit_time       TIMESTAMP,
  notes           TEXT,
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vl_date     ON visitor_logs (date);
CREATE INDEX IF NOT EXISTS idx_vl_exit_null ON visitor_logs (exit_time) WHERE exit_time IS NULL;


-- ─────────────────────────────────────────────────────────────
--  15. IMAGENS DE DOCUMENTOS
--  Armazenadas como base64 no banco (sem arquivos em disco)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_images (
  id            SERIAL PRIMARY KEY,
  entity_type   VARCHAR(50)  NOT NULL,   -- 'provider_visit' | 'consular' | 'visitor'
  entity_id     INTEGER      NOT NULL,
  image_data    TEXT         NOT NULL,   -- base64
  mime_type     VARCHAR(50)  NOT NULL DEFAULT 'image/jpeg',
  original_name VARCHAR(255),
  file_size     INTEGER,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docimg_entity ON document_images (entity_type, entity_id);


-- =============================================================
--  MIGRAÇÕES INCREMENTAIS
--  (já incluídas no schema acima; listadas aqui para referência)
-- =============================================================

-- 001 — Ordem manual de funcionários + data de retorno de veículos
-- ALTER TABLE employees     ADD COLUMN IF NOT EXISTS sort_order  INTEGER DEFAULT 0;
-- ALTER TABLE vehicle_logs  ADD COLUMN IF NOT EXISTS return_date DATE;
-- UPDATE employees SET sort_order = sub.rn - 1
--   FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS rn FROM employees) sub
--   WHERE employees.id = sub.id;
-- UPDATE vehicle_logs SET return_date = date WHERE return_time IS NOT NULL AND return_date IS NULL;
