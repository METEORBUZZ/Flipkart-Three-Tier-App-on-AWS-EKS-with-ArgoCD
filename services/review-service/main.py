import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Flipkart Review & Ratings Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "flipkart-postgres"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "flipkart_reviews"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgrespassword"),
    )

def init_tables():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                id UUID PRIMARY KEY,
                product_id VARCHAR(100) NOT NULL,
                user_id VARCHAR(100) NOT NULL,
                user_name VARCHAR(100) NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                title VARCHAR(255),
                comment TEXT,
                is_verified_buyer BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
            """)
            conn.commit()
            print("[review-service] Reviews table initialized.")
    except Exception as e:
        print(f"[review-service] Table error: {e}")
    finally:
        conn.close()

@app.on_event("startup")
def on_startup():
    init_tables()

class ReviewCreateRequest(BaseModel):
    product_id: str
    user_id: str
    user_name: str
    rating: int = Field(..., ge=1, le=5)
    title: str = ""
    comment: str = ""
    is_verified_buyer: bool = True

@app.get("/api/v1/reviews/health")
def health():
    return {
        "status": "healthy",
        "service": "review-service (Python / FastAPI)",
        "database": "PostgreSQL"
    }

@app.get("/api/v1/reviews/product/{product_id}")
def get_product_reviews(product_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM reviews 
                WHERE product_id = %s 
                ORDER BY created_at DESC
            """, (product_id,))
            reviews = cur.fetchall()

            # Calculate stats
            total_reviews = len(reviews)
            avg_rating = round(sum(r["rating"] for r in reviews) / total_reviews, 1) if total_reviews > 0 else 0.0

            return {
                "product_id": product_id,
                "total_reviews": total_reviews,
                "average_rating": avg_rating,
                "reviews": reviews
            }
    finally:
        conn.close()

@app.post("/api/v1/reviews", status_code=201)
def add_review(req: ReviewCreateRequest):
    conn = get_db()
    review_id = str(uuid.uuid4())
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, comment, is_verified_buyer)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (review_id, req.product_id, req.user_id, req.user_name, req.rating, req.title, req.comment, req.is_verified_buyer))
            conn.commit()
            return cur.fetchone()
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 5009)), reload=True)
