-- =============================================================================
-- ER-модель: учёт ВТ (вычислительная техника), заявки, мониторинг, нечёткая логика
-- Реализация: PostgreSQL, схема vt — не смешивается с таблицами ЭкваЛайн в public
--
-- Применение:
--   psql "$DATABASE_URL" -f scripts/schema-vt-equipment-er.sql
--   или pgAdmin → Query Tool → Открыть файл → Execute (F5)
--
-- Просмотр ERD в pgAdmin 4:
--   Schemas → vt → ПКМ → ERD For Schema / Generate ERD (зависит от версии)
-- Если пункта нет: установить расширение pgAdmin или экспортировать в DBeaver,
-- IntelliJ IDEA (Database Diagram) после подключения к БД.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS vt;

COMMENT ON SCHEMA vt IS 'Учёт ВТ по ER: типы, кабинеты, работы, мониторинг, заявки, отчёты, нечёткие правила';

-- УРОВЕНЬ ДОСТУПА ПОЛЬЗОВАТЕЛЕЙ
CREATE TABLE IF NOT EXISTS vt.access_levels (
  id SERIAL PRIMARY KEY,
  level_name TEXT NOT NULL
);

-- ПОЛЬЗОВАТЕЛЬ (домена ВТ — не таблица public.users приложения ЭкваЛайн)
CREATE TABLE IF NOT EXISTS vt.accounts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  access_level_id INTEGER NOT NULL REFERENCES vt.access_levels (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vt_accounts_access_level ON vt.accounts (access_level_id);

-- КАТЕГОРИЯ ПРОБЛЕМ
CREATE TABLE IF NOT EXISTS vt.problem_categories (
  id SERIAL PRIMARY KEY,
  category_name TEXT NOT NULL,
  short_name TEXT
);

-- ТИП ВТ
CREATE TABLE IF NOT EXISTS vt.equipment_types (
  id SERIAL PRIMARY KEY,
  type_name TEXT NOT NULL,
  short_name TEXT
);

-- КАБИНЕТ
CREATE TABLE IF NOT EXISTS vt.cabinets (
  id SERIAL PRIMARY KEY,
  floor SMALLINT NOT NULL,
  building_no TEXT NOT NULL,
  cabinet_name TEXT NOT NULL
);

-- СОСТОЯНИЕ ВТ
CREATE TABLE IF NOT EXISTS vt.equipment_states (
  id SERIAL PRIMARY KEY,
  state_name TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  short_name TEXT
);

-- ДЕЙСТВИЕ С ВТ
CREATE TABLE IF NOT EXISTS vt.action_types (
  id SERIAL PRIMARY KEY,
  action_name TEXT NOT NULL,
  description_short TEXT NOT NULL
);

-- ВЫЧИСЛИТЕЛЬНАЯ ТЕХНИКА (центр модели)
CREATE TABLE IF NOT EXISTS vt.equipment (
  id SERIAL PRIMARY KEY,
  equipment_name TEXT NOT NULL,
  inventory_number TEXT NOT NULL UNIQUE,
  year_in_service SMALLINT,
  decommission_date DATE,
  equipment_description TEXT,
  equipment_type_id INTEGER NOT NULL REFERENCES vt.equipment_types (id) ON DELETE RESTRICT,
  cabinet_id INTEGER NOT NULL REFERENCES vt.cabinets (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vt_equipment_type ON vt.equipment (equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_vt_equipment_cabinet ON vt.equipment (cabinet_id);

-- ВЫПОЛНЕНИЕ РАБОТЫ С ВТ
CREATE TABLE IF NOT EXISTS vt.work_performance (
  id SERIAL PRIMARY KEY,
  reason_description TEXT NOT NULL,
  work_date DATE NOT NULL,
  action_type_id INTEGER NOT NULL REFERENCES vt.action_types (id) ON DELETE RESTRICT,
  equipment_id INTEGER NOT NULL REFERENCES vt.equipment (id) ON DELETE CASCADE,
  state_id INTEGER NOT NULL REFERENCES vt.equipment_states (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vt_work_equipment ON vt.work_performance (equipment_id);
CREATE INDEX IF NOT EXISTS idx_vt_work_state ON vt.work_performance (state_id);

-- МОНИТОРИНГ ВТ
CREATE TABLE IF NOT EXISTS vt.equipment_monitoring (
  id SERIAL PRIMARY KEY,
  monitoring_date DATE NOT NULL,
  equipment_id INTEGER NOT NULL REFERENCES vt.equipment (id) ON DELETE CASCADE,
  state_id INTEGER NOT NULL REFERENCES vt.equipment_states (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vt_mon_equipment ON vt.equipment_monitoring (equipment_id);

-- ЗАЯВКА ПОЛЬЗОВАТЕЛЕЙ
CREATE TABLE IF NOT EXISTS vt.user_requests (
  id SERIAL PRIMARY KEY,
  request_description TEXT NOT NULL,
  request_date DATE NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  equipment_id INTEGER NOT NULL REFERENCES vt.equipment (id) ON DELETE RESTRICT,
  problem_category_id INTEGER NOT NULL REFERENCES vt.problem_categories (id) ON DELETE RESTRICT,
  account_id INTEGER NOT NULL REFERENCES vt.accounts (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vt_requests_equipment ON vt.user_requests (equipment_id);
CREATE INDEX IF NOT EXISTS idx_vt_requests_account ON vt.user_requests (account_id);

-- ОТЧЁТ О СОСТОЯНИИ УСТРОЙСТВА
CREATE TABLE IF NOT EXISTS vt.device_state_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  age_value NUMERIC NOT NULL,
  repairs_count_value NUMERIC NOT NULL,
  requests_count_value NUMERIC NOT NULL,
  device_state_value NUMERIC NOT NULL,
  user_request_id INTEGER NOT NULL REFERENCES vt.user_requests (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vt_reports_request ON vt.device_state_reports (user_request_id);

-- КРИТЕРИЙ НЕЧЁТКОЙ ЛОГИКИ
CREATE TABLE IF NOT EXISTS vt.fuzzy_criteria (
  id SERIAL PRIMARY KEY,
  criterion_name TEXT NOT NULL,
  membership_function TEXT NOT NULL,
  membership_function_params TEXT NOT NULL,
  lower_bound NUMERIC NOT NULL,
  upper_bound NUMERIC NOT NULL
);

-- НЕЧЁТКОЕ ПРАВИЛО
CREATE TABLE IF NOT EXISTS vt.fuzzy_rules (
  id SERIAL PRIMARY KEY,
  output_recommendations TEXT NOT NULL,
  fuzzy_criterion_id INTEGER NOT NULL REFERENCES vt.fuzzy_criteria (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vt_rules_criterion ON vt.fuzzy_rules (fuzzy_criterion_id);

-- ЗАКЛЮЧЕНИЕ (дефаззификация + график)
CREATE TABLE IF NOT EXISTS vt.conclusions (
  id SERIAL PRIMARY KEY,
  defuzzification_result TEXT NOT NULL,
  chart_path TEXT NOT NULL,
  device_report_id INTEGER NOT NULL REFERENCES vt.device_state_reports (id) ON DELETE CASCADE,
  fuzzy_rule_id INTEGER NOT NULL REFERENCES vt.fuzzy_rules (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vt_conclusions_report ON vt.conclusions (device_report_id);
CREATE INDEX IF NOT EXISTS idx_vt_conclusions_rule ON vt.conclusions (fuzzy_rule_id);
