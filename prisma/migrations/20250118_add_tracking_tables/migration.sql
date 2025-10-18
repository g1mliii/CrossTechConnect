-- Add Search Tracking Table
CREATE TABLE IF NOT EXISTS "search_tracking" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT,
  "query" TEXT NOT NULL,
  "filters" JSONB,
  "results_count" INTEGER NOT NULL DEFAULT 0,
  "category_id" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "search_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "search_tracking_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "device_categories"("id") ON DELETE SET NULL
);

CREATE INDEX "idx_search_tracking_user" ON "search_tracking"("user_id");
CREATE INDEX "idx_search_tracking_category" ON "search_tracking"("category_id");
CREATE INDEX "idx_search_tracking_created" ON "search_tracking"("created_at");

-- Add User Activity Tracking Table
CREATE TABLE IF NOT EXISTS "user_activity" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT,
  "activity_type" VARCHAR(50) NOT NULL,
  "entity_type" VARCHAR(50),
  "entity_id" TEXT,
  "metadata" JSONB,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_user_activity_user" ON "user_activity"("user_id");
CREATE INDEX "idx_user_activity_type" ON "user_activity"("activity_type");
CREATE INDEX "idx_user_activity_entity" ON "user_activity"("entity_type", "entity_id");
CREATE INDEX "idx_user_activity_created" ON "user_activity"("created_at");

-- Add Admin Audit Log Table
CREATE TABLE IF NOT EXISTS "admin_audit_log" (
  "id" TEXT PRIMARY KEY,
  "admin_id" TEXT NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" TEXT NOT NULL,
  "changes" JSONB,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "error_message" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "admin_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_admin_audit_admin" ON "admin_audit_log"("admin_id");
CREATE INDEX "idx_admin_audit_action" ON "admin_audit_log"("action");
CREATE INDEX "idx_admin_audit_entity" ON "admin_audit_log"("entity_type", "entity_id");
CREATE INDEX "idx_admin_audit_created" ON "admin_audit_log"("created_at");

-- Add Performance Metrics Table
CREATE TABLE IF NOT EXISTS "performance_metrics" (
  "id" TEXT PRIMARY KEY,
  "metric_type" VARCHAR(50) NOT NULL,
  "metric_name" VARCHAR(100) NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "unit" VARCHAR(20),
  "metadata" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_performance_metrics_type" ON "performance_metrics"("metric_type");
CREATE INDEX "idx_performance_metrics_name" ON "performance_metrics"("metric_name");
CREATE INDEX "idx_performance_metrics_created" ON "performance_metrics"("created_at");
