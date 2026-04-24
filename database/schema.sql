-- ============================================================
-- EMBASSY CONTROL SYSTEM - DATABASE SCHEMA
-- ============================================================

-- USERS (porteiros, admin, super_admin)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'porteiro')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOG (every action by every user)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- EMBASSY EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  department VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(30),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- EMPLOYEE ATTENDANCE (daily control)
CREATE TABLE IF NOT EXISTS employee_attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME,
  lunch_out_time TIME,
  lunch_return_time TIME,
  exit_time TIME,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- OUTSOURCED WORKERS (jardineiros, limpeza)
CREATE TABLE IF NOT EXISTS outsourced_workers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('jardineiro', 'limpeza')),
  company VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OUTSOURCED ATTENDANCE
CREATE TABLE IF NOT EXISTS outsourced_attendance (
  id SERIAL PRIMARY KEY,
  worker_id INTEGER NOT NULL REFERENCES outsourced_workers(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME,
  exit_time TIME,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(worker_id, date)
);

-- VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  plate VARCHAR(20) NOT NULL UNIQUE,
  model VARCHAR(100),
  description VARCHAR(200),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- VEHICLE LOGS
CREATE TABLE IF NOT EXISTS vehicle_logs (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  departure_time TIME NOT NULL,
  return_time TIME,
  driver VARCHAR(100),
  passengers TEXT,
  reason VARCHAR(255),
  observations TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SERVICE PROVIDERS (cadastro)
CREATE TABLE IF NOT EXISTS service_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  company VARCHAR(100),
  document_photo VARCHAR(255),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SERVICE PROVIDER VISITS
CREATE TABLE IF NOT EXISTS service_provider_visits (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES service_providers(id),
  visitor_name VARCHAR(100),
  company VARCHAR(100),
  document_photo VARCHAR(255),
  entry_time TIMESTAMP DEFAULT NOW(),
  exit_time TIMESTAMP,
  reason TEXT,
  employee_id INTEGER REFERENCES employees(id),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CONSULAR APPOINTMENTS
CREATE TABLE IF NOT EXISTS consular_appointments (
  id SERIAL PRIMARY KEY,
  visitor_name VARCHAR(100) NOT NULL,
  document_photo VARCHAR(255),
  visit_reason TEXT,
  employee_id INTEGER REFERENCES employees(id),
  scheduled_time TIME,
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PACKAGES
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  delivery_company VARCHAR(100) NOT NULL,
  tracking_code VARCHAR(100),
  recipient_employee_id INTEGER REFERENCES employees(id),
  recipient_name VARCHAR(100),
  received_at TIMESTAMP DEFAULT NOW(),
  delivered_to_id INTEGER REFERENCES employees(id),
  delivered_to_name VARCHAR(100),
  delivered_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- EMBASSY INFO (contacts, useful phones)
CREATE TABLE IF NOT EXISTS embassy_info (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  label VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Default super_admin user (password: Admin@123)
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Super Admin',
  'admin@embaixada.gov',
  '$2b$10$Fut0b7vLe0TV7EOj5a03Y.W6git.sJptGLuDWZG/2xswgwwChWMRC',
  'super_admin'
) ON CONFLICT DO NOTHING;
