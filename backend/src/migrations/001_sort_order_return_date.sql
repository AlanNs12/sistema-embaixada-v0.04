-- Migração 001: ordem manual de funcionários + data de retorno em veículos
-- Execute uma única vez no banco de dados.

-- 1. Adiciona coluna de ordem manual nos funcionários
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Inicializa a ordem pela ordem alfabética atual
UPDATE employees
SET sort_order = sub.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS rn
  FROM employees
) sub
WHERE employees.id = sub.id;

-- 2. Adiciona coluna de data de retorno nos logs de veículos
ALTER TABLE vehicle_logs ADD COLUMN IF NOT EXISTS return_date DATE;

-- Para registros existentes, assume que a data de retorno é a mesma de saída
UPDATE vehicle_logs SET return_date = date WHERE return_time IS NOT NULL AND return_date IS NULL;
