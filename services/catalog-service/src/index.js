require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Initialize Database Tables
initDb();

// Health Check
app.get('/api/v1/catalog/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'catalog-service (Express.js / Node.js)',
    database: 'PostgreSQL (JSONB)',
  });
});

// Categories Endpoints
app.get('/api/v1/catalog/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/catalog/categories', async (req, res) => {
  try {
    const { name, slug, parent_id, icon_url } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, slug, parent_id, icon_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, parent_id || null, icon_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Products Endpoints
app.get('/api/v1/catalog/products', async (req, res) => {
  try {
    const { category_id, brand, min_price, max_price, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM products WHERE is_active = TRUE';
    const params = [];

    if (category_id) {
      params.push(category_id);
      query += ` AND category_id = $${params.length}`;
    }
    if (brand) {
      params.push(brand);
      query += ` AND brand ILIKE $${params.length}`;
    }
    if (min_price) {
      params.push(min_price);
      query += ` AND price >= $${params.length}`;
    }
    if (max_price) {
      params.push(max_price);
      query += ` AND price <= $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/catalog/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/catalog/products', async (req, res) => {
  try {
    const {
      seller_id,
      category_id,
      title,
      brand,
      description,
      price,
      discount_percentage,
      images,
      specifications,
      is_assured,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products 
      (seller_id, category_id, title, brand, description, price, discount_percentage, images, specifications, is_assured) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        seller_id,
        category_id || null,
        title,
        brand,
        description,
        price,
        discount_percentage || 0,
        JSON.stringify(images || []),
        JSON.stringify(specifications || {}),
        is_assured !== undefined ? is_assured : true,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Flipkart Catalog Service running on port ${PORT}`);
});
