-- Migração 002: impede duplicidade de logs abertos para o mesmo veículo
-- Execute uma única vez no banco de dados.

-- Índice único parcial: garante que cada veículo tenha no máximo 1 log com return_time IS NULL
-- Isso impede a criação de duas saídas abertas para o mesmo veículo,
-- mesmo em cenários de concorrência (race condition).
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_logs_one_open_per_vehicle
ON vehicle_logs (vehicle_id) WHERE return_time IS NULL;
