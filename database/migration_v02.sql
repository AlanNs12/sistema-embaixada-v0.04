-- ============================================================
-- MIGRATION v0.2 — Novas funcionalidades
-- Execute este arquivo no banco para atualizar o schema
-- ============================================================

-- 1. Campo de observações no ponto de funcionários (já existe na coluna notes)
-- (sem alteração necessária)

-- 2. Tabela de visitantes gerais
CREATE TABLE IF NOT EXISTS visitor_logs (
  id SERIAL PRIMARY KEY,
  visitor_name VARCHAR(100) NOT NULL,
  document_photo VARCHAR(255),
  document_number VARCHAR(50),
  reason TEXT,
  employee_id INTEGER REFERENCES employees(id),
  entry_time TIMESTAMP DEFAULT NOW(),
  exit_time TIMESTAMP,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Adicionar role "viewer" e "porteiro" à constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'admin', 'porteiro', 'viewer'));

-- 4. Confirma tabelas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
