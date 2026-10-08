# Flipkart Shopping App Clone 🛒

An enterprise-grade, polyglot microservices clone of Flipkart built with **Next.js**, **Angular**, **Node.js/Express**, **Python (Django, Flask, FastAPI)**, **Go (Gin)**, **Java (Spring Boot)**, **PostgreSQL 16**, and **Redis 7**, orchestrated seamlessly via **Docker Compose**.

---

## 📱 How to View This Website on Your Mobile Phone

You can browse this shopping app directly on your smartphone (iPhone or Android) as long as your phone is on the **same Wi-Fi network** or personal hotspot as this Mac.

### Your Direct Mobile URLs:
* **Flipkart Customer Storefront:**  
  👉 **`http://10.195.18.98:3000`**
* **Seller & Admin Portal:**  
  👉 **`http://10.195.18.98:4200`**
* **API Gateway & Health Status:**  
  👉 **`http://10.195.18.98:8000/health`**

### Steps to Open on Mobile:
1. **Connect Wi-Fi**: Make sure your phone is connected to the **same Wi-Fi** network (or Mac hotspot) as your Mac.
2. **Open Browser**: Open Safari, Chrome, or any mobile browser on your phone.
3. **Type the URL**: Type `http://10.195.18.98:3000` into your mobile browser and hit Enter.
4. *(Troubleshooting)*: If the page doesn't load immediately, ensure macOS Firewall isn't blocking incoming connections (`System Settings` > `Network` > `Firewall`).

---

## 🏛️ System Architecture

```text
               +---------------------------------------------+
               |             Client Applications             |
               |  (Next.js Web Store)   (Angular Admin Hub)  |
               +----------------------+----------------------+
                                      |
                                      v
               +---------------------------------------------+
               |          API Gateway (Express.js)           |
               |            Port: 8000 / Reverse Proxy       |
               +----------------------+----------------------+
                                      |
         +----------------------------+----------------------------+
         |                            |                            |
         v                            v                            v
  [user-service]              [catalog-service]             [cart-service]
  Django REST / Py            Express.js / Node             Express / Redis
         |                            |                            |
         v                            v                            v
  [search-service]            [inventory-service]           [order-service]
   Flask / Python               FastAPI / Python             Spring Boot / Java
         |                            |                            |
         v                            v                            v
  [delivery-service]          [payment-service]          [notification-service]
   Flask / Ekart Logistics       Gin / Go                  Node.js Redis Worker
                                      |
                              [review-service]
                               FastAPI / Python
                                      |
                     +----------------+----------------+
                     |                                 |
                     v                                 v
        +-------------------------+       +-------------------------+
        |      PostgreSQL 16      |       |         Redis 7         |
        |  (Relational + JSONB)   |       |   (In-Memory + Cache)   |
        +-------------------------+       +-------------------------+
```

---

## 🔒 Security & Environment Architecture

* **Frontend Security (Strict Rule)**:  
  **Zero `.env` files** exist in frontend applications (`web-store` or `admin-portal`). This completely prevents leaking any database passwords, secret keys, or private salts into browser JavaScript bundles.
* **Backend Isolation**:  
  Every backend microservice has its own isolated `.env` file for private credentials.
* **Git Safe**:  
  All `*.env` files are ignored by git; only `.env.example` templates are committed.

---

## 🗄️ Strict Dual-Database Strategy

1. **PostgreSQL 16 (`5432`)**:
   * Uses **`JSONB`** columns for dynamic product specifications (RAM, screen size, clothing sizes) without needing MongoDB.
   * Uses **`pg_trgm`** & **`tsvector`** for full-text search and typo tolerance without needing Elasticsearch.
   * Provides ACID transactional safety for orders, users, reviews, inventory, and payments.

2. **Redis 7 (`6379`)**:
   * Sub-millisecond in-memory shopping carts with 30-day automatic TTL expiration.
   * Atomic stock reservation locks during flash-sales.
   * Pub/Sub messaging broker for background notifications.

---

## 🚀 Running the Project

### Start Everything:
```bash
docker compose up -d
```

### View Live Logs:
```bash
docker compose logs -f
```

### Check Container Status:
```bash
docker compose ps
```

### Stop Everything:
```bash
docker compose down
```

---

## 🌐 Microservice Endpoints Reference

| Service | Port | Language & Framework | Primary Storage |
| :--- | :---: | :--- | :--- |
| **API Gateway** | `8000` | JavaScript (Express.js) | Redis Rate Limiter |
| **Customer Storefront** | `3000` | TypeScript (Next.js) | Client SSR |
| **Seller & Admin Portal** | `4200` | TypeScript (Angular / Nginx) | Client SPA |
| **User & Auth** | `5001` | Python (Django REST) | PostgreSQL |
| **Product Catalog** | `5002` | JavaScript (Express.js) | PostgreSQL (`JSONB`) |
| **Search & Filters** | `5003` | Python (Flask) | PostgreSQL (`pg_trgm`) |
| **Cart & Wishlist** | `5004` | JavaScript (Express.js) | **Redis** |
| **Order Management** | `5005` | Java (Spring Boot) | PostgreSQL |
| **Payment Service** | `5006` | Go (Gin) | PostgreSQL |
| **Inventory Service** | `5007` | Python (FastAPI) | PostgreSQL + Redis |
| **Delivery (Ekart)** | `5008` | Python (Flask) | PostgreSQL |
| **Notification Worker**| - | JavaScript (Node.js) | Redis Pub/Sub |
| **Reviews & Ratings** | `5009` | Python (FastAPI) | PostgreSQL |

---

## 🧪 Quick Test Commands

```bash
# 1. Check Gateway Health
curl http://localhost:8000/health

# 2. Check Ekart Pincode Serviceability
curl "http://localhost:8000/api/v1/delivery/check-pincode?pincode=560001"

# 3. Add Item to In-Memory Redis Cart
curl -X POST -H "Content-Type: application/json" \
  -d '{"productId":"p1","title":"iPhone 15","price":71999,"quantity":1}' \
  http://localhost:8000/api/v1/cart/user-1/items

# 4. View User Cart
curl http://localhost:8000/api/v1/cart/user-1

# 5. Initiate Payment Intent in Go/Gin
curl -X POST -H "Content-Type: application/json" \
  -d '{"order_id":"ORD-101","user_id":"user-1","amount":71999}' \
  http://localhost:8000/api/v1/payments/initiate
```
# Flipkart-Three-Tier-App-on-AWS-EKS-with-ArgoCD
