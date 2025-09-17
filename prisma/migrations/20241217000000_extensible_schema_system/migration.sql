-- CreateTable
CREATE TABLE "device_category_schemas" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "fields" JSONB NOT NULL,
    "required_fields" TEXT[],
    "inherited_fields" TEXT[],
    "computed_fields" JSONB,
    "validation_rules" JSONB,
    "compatibility_rules" JSONB,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "deprecation_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "device_category_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_specifications" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "schema_version" VARCHAR(20) NOT NULL,
    "specifications" JSONB NOT NULL,
    "computed_values" JSONB,
    "validation_errors" JSONB,
    "confidence_scores" JSONB,
    "sources" JSONB,
    "verification_status" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_migrations" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "from_version" VARCHAR(20) NOT NULL,
    "to_version" VARCHAR(20) NOT NULL,
    "operations" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMP(3),

    CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "base_schema" JSONB NOT NULL,
    "example_devices" TEXT[],
    "tags" TEXT[],
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_indexes" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "index_type" VARCHAR(20) NOT NULL,
    "index_name" VARCHAR(100) NOT NULL,
    "unique_constraint" BOOLEAN NOT NULL DEFAULT false,
    "partial_condition" TEXT,
    "expression" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dynamic_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_results" (
    "id" TEXT NOT NULL,
    "source_device_id" TEXT NOT NULL,
    "target_device_id" TEXT NOT NULL,
    "compatibility_type" VARCHAR(20) NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "details" TEXT NOT NULL,
    "limitations" TEXT[],
    "recommendations" TEXT[],
    "matched_rules" TEXT[],
    "field_compatibility" JSONB,
    "context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "compatibility_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_category_schemas_category_id_idx" ON "device_category_schemas"("category_id");

-- CreateIndex
CREATE INDEX "device_category_schemas_version_idx" ON "device_category_schemas"("version");

-- CreateIndex
CREATE INDEX "device_category_schemas_parent_id_idx" ON "device_category_schemas"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_category_schemas_category_id_version_key" ON "device_category_schemas"("category_id", "version");

-- CreateIndex
CREATE INDEX "device_specifications_device_id_idx" ON "device_specifications"("device_id");

-- CreateIndex
CREATE INDEX "device_specifications_category_id_idx" ON "device_specifications"("category_id");

-- CreateIndex
CREATE INDEX "device_specifications_schema_version_idx" ON "device_specifications"("schema_version");

-- CreateIndex
CREATE UNIQUE INDEX "device_specifications_device_id_key" ON "device_specifications"("device_id");

-- CreateIndex
CREATE INDEX "schema_migrations_category_id_idx" ON "schema_migrations"("category_id");

-- CreateIndex
CREATE INDEX "schema_migrations_from_version_idx" ON "schema_migrations"("from_version");

-- CreateIndex
CREATE INDEX "schema_migrations_to_version_idx" ON "schema_migrations"("to_version");

-- CreateIndex
CREATE INDEX "category_templates_tags_idx" ON "category_templates" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "category_templates_popularity_idx" ON "category_templates"("popularity");

-- CreateIndex
CREATE INDEX "dynamic_indexes_category_id_idx" ON "dynamic_indexes"("category_id");

-- CreateIndex
CREATE INDEX "dynamic_indexes_field_name_idx" ON "dynamic_indexes"("field_name");

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_indexes_category_id_field_name_key" ON "dynamic_indexes"("category_id", "field_name");

-- CreateIndex
CREATE INDEX "compatibility_results_source_device_id_idx" ON "compatibility_results"("source_device_id");

-- CreateIndex
CREATE INDEX "compatibility_results_target_device_id_idx" ON "compatibility_results"("target_device_id");

-- CreateIndex
CREATE INDEX "compatibility_results_compatibility_type_idx" ON "compatibility_results"("compatibility_type");

-- CreateIndex
CREATE INDEX "compatibility_results_expires_at_idx" ON "compatibility_results"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "compatibility_results_source_device_id_target_device_id_key" ON "compatibility_results"("source_device_id", "target_device_id");

-- AddForeignKey
ALTER TABLE "device_category_schemas" ADD CONSTRAINT "device_category_schemas_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "device_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_category_schemas" ADD CONSTRAINT "device_category_schemas_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "device_category_schemas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_category_schemas" ADD CONSTRAINT "device_category_schemas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_specifications" ADD CONSTRAINT "device_specifications_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_specifications" ADD CONSTRAINT "device_specifications_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "device_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema_migrations" ADD CONSTRAINT "schema_migrations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "device_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dynamic_indexes" ADD CONSTRAINT "dynamic_indexes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "device_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_results" ADD CONSTRAINT "compatibility_results_source_device_id_fkey" FOREIGN KEY ("source_device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_results" ADD CONSTRAINT "compatibility_results_target_device_id_fkey" FOREIGN KEY ("target_device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create GIN indexes for JSONB fields to enable efficient querying
CREATE INDEX "device_specifications_specifications_gin_idx" ON "device_specifications" USING GIN ("specifications");
CREATE INDEX "device_specifications_computed_values_gin_idx" ON "device_specifications" USING GIN ("computed_values");
CREATE INDEX "device_category_schemas_fields_gin_idx" ON "device_category_schemas" USING GIN ("fields");
CREATE INDEX "compatibility_results_field_compatibility_gin_idx" ON "compatibility_results" USING GIN ("field_compatibility");

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_device_category_schemas_updated_at BEFORE UPDATE ON device_category_schemas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_specifications_updated_at BEFORE UPDATE ON device_specifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_category_templates_updated_at BEFORE UPDATE ON category_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();