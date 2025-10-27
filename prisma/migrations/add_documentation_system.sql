-- Documentation and Content Management System Tables

-- Device Documentation - Stores extracted and user-contributed documentation
CREATE TABLE IF NOT EXISTS device_documentation (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500),
    source_type VARCHAR(50) NOT NULL,
    source_url TEXT,
    original_file_url TEXT,
    extraction_method VARCHAR(50),
    confidence_score DECIMAL(3,2),
    verified BOOLEAN DEFAULT FALSE,
    helpful_votes INTEGER DEFAULT 0,
    not_helpful_votes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    cache_status VARCHAR(20) DEFAULT 'hot',
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_device_documentation_device_id ON device_documentation(device_id);
CREATE INDEX idx_device_documentation_content_type ON device_documentation(content_type);
CREATE INDEX idx_device_documentation_source_type ON device_documentation(source_type);
CREATE INDEX idx_device_documentation_verified ON device_documentation(verified);
CREATE INDEX idx_device_documentation_cache_status ON device_documentation(cache_status);
CREATE INDEX idx_device_documentation_last_accessed_at ON device_documentation(last_accessed_at);
CREATE INDEX idx_device_documentation_created_at ON device_documentation(created_at);

-- Documentation Extraction - Schema-aware AI extraction results
CREATE TABLE IF NOT EXISTS documentation_extractions (
    id TEXT PRIMARY KEY,
    documentation_id TEXT NOT NULL REFERENCES device_documentation(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES device_categories(id),
    schema_version VARCHAR(20) NOT NULL,
    extracted_fields JSONB NOT NULL,
    field_confidence JSONB NOT NULL,
    missing_fields TEXT[] NOT NULL,
    validation_errors JSONB,
    extraction_context JSONB,
    ai_model VARCHAR(100) NOT NULL,
    processing_time INTEGER NOT NULL,
    review_status VARCHAR(20) DEFAULT 'pending',
    reviewed_at TIMESTAMP,
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (category_id, schema_version) REFERENCES device_category_schemas(category_id, version)
);

CREATE INDEX idx_documentation_extractions_documentation_id ON documentation_extractions(documentation_id);
CREATE INDEX idx_documentation_extractions_device_id ON documentation_extractions(device_id);
CREATE INDEX idx_documentation_extractions_category_id ON documentation_extractions(category_id);
CREATE INDEX idx_documentation_extractions_review_status ON documentation_extractions(review_status);
CREATE INDEX idx_documentation_extractions_created_at ON documentation_extractions(created_at);

-- Content Rating - User ratings for documentation helpfulness
CREATE TABLE IF NOT EXISTS content_ratings (
    id TEXT PRIMARY KEY,
    documentation_id TEXT NOT NULL REFERENCES device_documentation(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating VARCHAR(20) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(documentation_id, user_id)
);

CREATE INDEX idx_content_ratings_documentation_id ON content_ratings(documentation_id);
CREATE INDEX idx_content_ratings_user_id ON content_ratings(user_id);

-- Documentation Tags - Categorization and search optimization
CREATE TABLE IF NOT EXISTS documentation_tags (
    id TEXT PRIMARY KEY,
    documentation_id TEXT NOT NULL REFERENCES device_documentation(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(documentation_id, tag)
);

CREATE INDEX idx_documentation_tags_tag ON documentation_tags(tag);

-- Software Compatibility - Track OS, driver, and software requirements
CREATE TABLE IF NOT EXISTS software_compatibility (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    software_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(50),
    min_version VARCHAR(50),
    max_version VARCHAR(50),
    platform VARCHAR(50),
    architecture VARCHAR(20),
    required BOOLEAN DEFAULT TRUE,
    download_url TEXT,
    notes TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_software_compatibility_device_id ON software_compatibility(device_id);
CREATE INDEX idx_software_compatibility_software_type ON software_compatibility(software_type);
CREATE INDEX idx_software_compatibility_platform ON software_compatibility(platform);

-- Content Moderation Queue - Track content requiring moderation
CREATE TABLE IF NOT EXISTS content_moderation_queue (
    id TEXT PRIMARY KEY,
    content_type VARCHAR(50) NOT NULL,
    content_id TEXT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    reported_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    moderator_notes TEXT,
    moderated_at TIMESTAMP,
    moderated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_moderation_queue_content ON content_moderation_queue(content_type, content_id);
CREATE INDEX idx_content_moderation_queue_status ON content_moderation_queue(status);
CREATE INDEX idx_content_moderation_queue_created_at ON content_moderation_queue(created_at);
