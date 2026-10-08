require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

const redis = new Redis({
  host: process.env.REDIS_HOST || 'flipkart-redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('connect', () => {
  console.log('[cart-service] Connected to Redis successfully.');
});

redis.on('error', (err) => {
  console.error('[cart-service] Redis connection error:', err.message);
});

const CART_TTL = parseInt(process.env.CART_TTL_SECONDS || '2592000', 10);

// Health check
app.get('/api/v1/cart/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cart-service (Express.js / Node.js)',
    database: 'Redis (In-Memory)',
  });
});

// Helper key generators
const cartKey = (userId) => `cart:${userId}`;
const wishlistKey = (userId) => `wishlist:${userId}`;

// GET user cart
app.get('/api/v1/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const itemsRaw = await redis.hgetall(cartKey(userId));
    
    const items = Object.entries(itemsRaw).map(([productId, payload]) => {
      try {
        return JSON.parse(payload);
      } catch {
        return { productId, quantity: 1 };
      }
    });

    const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalPrice = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

    res.json({
      userId,
      items,
      totalItems,
      totalPrice,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / PUT add or update item in cart
app.post('/api/v1/cart/:userId/items', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, title, price, image, quantity = 1, sellerId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const itemPayload = JSON.stringify({
      productId,
      title,
      price: Number(price) || 0,
      image,
      quantity: Number(quantity) || 1,
      sellerId,
      updatedAt: new Date().toISOString(),
    });

    await redis.hset(cartKey(userId), productId, itemPayload);
    await redis.expire(cartKey(userId), CART_TTL);

    res.status(200).json({ message: 'Item added/updated in cart', productId, quantity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove single item from cart
app.delete('/api/v1/cart/:userId/items/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    await redis.hdel(cartKey(userId), productId);
    res.json({ message: 'Item removed from cart', productId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE clear full cart (e.g. after order placement)
app.delete('/api/v1/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await redis.del(cartKey(userId));
    res.json({ message: 'Cart cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wishlist Endpoints
app.get('/api/v1/cart/:userId/wishlist', async (req, res) => {
  try {
    const { userId } = req.params;
    const productIds = await redis.smembers(wishlistKey(userId));
    res.json({ userId, wishlist: productIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/cart/:userId/wishlist', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;
    await redis.sadd(wishlistKey(userId), productId);
    res.json({ message: 'Added to wishlist', productId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/cart/:userId/wishlist/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    await redis.srem(wishlistKey(userId), productId);
    res.json({ message: 'Removed from wishlist', productId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Flipkart Cart & Wishlist Service running on port ${PORT}`);
});
