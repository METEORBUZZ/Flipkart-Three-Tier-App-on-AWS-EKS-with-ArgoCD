import os
import redis
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Flipkart Inventory Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Redis for atomic locks
r = redis.Redis(
    host=os.getenv("REDIS_HOST", "flipkart-redis"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    password=os.getenv("REDIS_PASSWORD") or None,
    decode_responses=True
)

def get_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "flipkart-postgres"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "flipkart_inventory"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgrespassword"),
    )

def init_tables():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS inventory (
                product_id VARCHAR(100) PRIMARY KEY,
                stock_quantity INT NOT NULL DEFAULT 0,
                warehouse_code VARCHAR(50) DEFAULT 'WH-BLR-01',
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """)
            conn.commit()
            print("[inventory-service] Inventory table initialized.")
    except Exception as e:
        print(f"[inventory-service] Init error: {e}")
    finally:
        conn.close()

@app.on_event("startup")
def on_startup():
    init_tables()

class SetStockRequest(BaseModel):
    product_id: str
    stock_quantity: int
    warehouse_code: str = "WH-BLR-01"

class ReserveStockRequest(BaseModel):
    product_id: str
    quantity: int
    order_id: str

@app.get("/api/v1/inventory/health")
def health():
    return {
        "status": "healthy",
        "service": "inventory-service (Python / FastAPI)",
        "database": "PostgreSQL + Redis (Atomic Locks)"
    }

@app.get("/api/v1/inventory/{product_id}")
def get_stock(product_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM inventory WHERE product_id = %s", (product_id,))
            row = cur.fetchone()
            if not row:
                return {"product_id": product_id, "stock_quantity": 0, "status": "OUT_OF_STOCK"}
            return {
                "product_id": product_id,
                "stock_quantity": row["stock_quantity"],
                "status": "IN_STOCK" if row["stock_quantity"] > 0 else "OUT_OF_STOCK",
                "warehouse_code": row["warehouse_code"]
            }
    finally:
        conn.close()

@app.post("/api/v1/inventory/set")
def set_stock(req: SetStockRequest):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO inventory (product_id, stock_quantity, warehouse_code, updated_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (product_id)
                DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity, updated_at = CURRENT_TIMESTAMP
                RETURNING *;
            """, (req.product_id, req.stock_quantity, req.warehouse_code))
            conn.commit()
            row = cur.fetchone()
            
            # Sync to Redis cache
            r.set(f"stock:{req.product_id}", req.stock_quantity)
            return {"message": "Stock updated", "inventory": row}
    finally:
        conn.close()

@app.post("/api/v1/inventory/reserve")
def reserve_stock(req: ReserveStockRequest):
    """Atomic flash-sale lock with Redis + DB deduction"""
    lock_key = f"lock:stock:{req.product_id}"
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT stock_quantity FROM inventory WHERE product_id = %s FOR UPDATE", (req.product_id,))
            row = cur.fetchone()
            if not row or row["stock_quantity"] < req.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock")

            cur.execute(
                "UPDATE inventory SET stock_quantity = stock_quantity - %s WHERE product_id = %s RETURNING stock_quantity",
                (req.quantity, req.product_id)
            )
            conn.commit()
            updated = cur.fetchone()
            
            # Cache reservation in Redis with TTL
            r.setex(f"reservation:{req.order_id}:{req.product_id}", 900, req.quantity)

            return {
                "status": "RESERVED",
                "order_id": req.order_id,
                "product_id": req.product_id,
                "remaining_stock": updated["stock_quantity"]
            }
    finally:
        conn.close()

@app.post("/api/v1/inventory/release")
def release_stock(req: ReserveStockRequest):
    """Reverts reserved stock on cancellation"""
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "UPDATE inventory SET stock_quantity = stock_quantity + %s WHERE product_id = %s RETURNING stock_quantity",
                (req.quantity, req.product_id)
            )
            conn.commit()
            r.delete(f"reservation:{req.order_id}:{req.product_id}")
            return {"status": "RELEASED", "product_id": req.product_id}
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 5007)), reload=True)
