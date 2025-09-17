-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" VARCHAR(100),
    "reputation_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."device_categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parent_id" TEXT,
    "attributes" JSONB,

    CONSTRAINT "device_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."standards" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "version" VARCHAR(20),
    "specifications" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."devices" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100),
    "category_id" TEXT NOT NULL,
    "width_cm" DECIMAL(6,2),
    "height_cm" DECIMAL(6,2),
    "depth_cm" DECIMAL(6,2),
    "weight_kg" DECIMAL(6,3),
    "power_watts" INTEGER,
    "power_type" VARCHAR(50),
    "manual_url" TEXT,
    "image_urls" TEXT[],
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "confidence_score" DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    "source_url" TEXT,
    "extraction_method" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."device_standards" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "standard_id" TEXT NOT NULL,
    "port_count" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compatibility_rules" (
    "id" TEXT NOT NULL,
    "standard_a_id" TEXT NOT NULL,
    "standard_b_id" TEXT NOT NULL,
    "compatibility_type" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "limitations" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compatibility_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "nickname" VARCHAR(100),
    "notes" TEXT,
    "purchase_date" DATE,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_items" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "current_value" TEXT,
    "proposed_value" TEXT,
    "source_type" VARCHAR(50),
    "confidence_score" DECIMAL(3,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_votes" (
    "id" TEXT NOT NULL,
    "verification_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vote" VARCHAR(10) NOT NULL,
    "suggested_value" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "devices_category_id_idx" ON "public"."devices"("category_id");

-- CreateIndex
CREATE INDEX "devices_brand_idx" ON "public"."devices"("brand");

-- CreateIndex
CREATE INDEX "devices_width_cm_height_cm_depth_cm_idx" ON "public"."devices"("width_cm", "height_cm", "depth_cm");

-- CreateIndex
CREATE INDEX "devices_power_watts_idx" ON "public"."devices"("power_watts");

-- CreateIndex
CREATE INDEX "devices_verified_idx" ON "public"."devices"("verified");

-- CreateIndex
CREATE INDEX "device_standards_device_id_idx" ON "public"."device_standards"("device_id");

-- CreateIndex
CREATE INDEX "device_standards_standard_id_idx" ON "public"."device_standards"("standard_id");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "public"."user_devices"("user_id");

-- AddForeignKey
ALTER TABLE "public"."device_categories" ADD CONSTRAINT "device_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."device_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."device_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."device_standards" ADD CONSTRAINT "device_standards_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."device_standards" ADD CONSTRAINT "device_standards_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "public"."standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compatibility_rules" ADD CONSTRAINT "compatibility_rules_standard_a_id_fkey" FOREIGN KEY ("standard_a_id") REFERENCES "public"."standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compatibility_rules" ADD CONSTRAINT "compatibility_rules_standard_b_id_fkey" FOREIGN KEY ("standard_b_id") REFERENCES "public"."standards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_devices" ADD CONSTRAINT "user_devices_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_items" ADD CONSTRAINT "verification_items_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_votes" ADD CONSTRAINT "verification_votes_verification_item_id_fkey" FOREIGN KEY ("verification_item_id") REFERENCES "public"."verification_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_votes" ADD CONSTRAINT "verification_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
