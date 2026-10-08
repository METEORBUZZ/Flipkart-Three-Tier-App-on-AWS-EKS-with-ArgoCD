const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  host: process.env.DB_HOST || 'flipkart-postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'flipkart_catalog',
});

// Auto-initialize schema for Catalog Service
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        icon_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID NOT NULL,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        discount_percentage NUMERIC(5, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'INR',
        images JSONB DEFAULT '[]'::jsonb,
        specifications JSONB DEFAULT '{}'::jsonb,  -- RAM, Storage, Color, Size, etc.
        rating NUMERIC(3, 2) DEFAULT 0.0,
        rating_count INT DEFAULT 0,
        is_assured BOOLEAN DEFAULT TRUE,          -- F-Assured Flipkart badge
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
      CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
      CREATE INDEX IF NOT EXISTS idx_products_specs ON products USING gin(specifications);
    `);
    console.log('[catalog-service] PostgreSQL tables initialized successfully with JSONB support.');
  } catch (err) {
    console.error('[catalog-service] Failed to initialize PostgreSQL tables:', err.message);
  }
};

module.exports = { pool, initDb };
