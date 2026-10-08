import os
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Flipkart Review, Q&A and Chat Service")

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
            # Reviews table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                id UUID PRIMARY KEY,
                product_id VARCHAR(100) NOT NULL,
                user_id VARCHAR(100) NOT NULL,
                user_name VARCHAR(100) NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                title VARCHAR(255),
                comment TEXT,
                helpful_count INT DEFAULT 0,
                is_verified_buyer BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

            -- Add helpful_count column if it didn't exist before
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='helpful_count') THEN
                    ALTER TABLE reviews ADD COLUMN helpful_count INT DEFAULT 0;
                END IF;
            END $$;

            -- Product Questions Table (Customer Q&A)
            CREATE TABLE IF NOT EXISTS product_questions (
                id UUID PRIMARY KEY,
                product_id VARCHAR(100) NOT NULL,
                user_id VARCHAR(100) NOT NULL,
                user_name VARCHAR(100) NOT NULL,
                question TEXT NOT NULL,
                upvotes INT DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_questions_product_id ON product_questions(product_id);

            -- Product Answers Table
            CREATE TABLE IF NOT EXISTS product_answers (
                id UUID PRIMARY KEY,
                question_id UUID NOT NULL REFERENCES product_questions(id) ON DELETE CASCADE,
                user_id VARCHAR(100) NOT NULL,
                user_name VARCHAR(100) NOT NULL,
                is_seller BOOLEAN DEFAULT FALSE,
                answer TEXT NOT NULL,
                upvotes INT DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_answers_question_id ON product_answers(question_id);

            -- Buyer to Seller Live Chat Messages Table
            CREATE TABLE IF NOT EXISTS seller_chats (
                id UUID PRIMARY KEY,
                product_id VARCHAR(100) NOT NULL,
                user_id VARCHAR(100) NOT NULL,
                sender_type VARCHAR(20) NOT NULL, -- 'buyer' or 'seller'
                sender_name VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_seller_chats ON seller_chats(product_id, user_id);
            """)
            conn.commit()
            print("[review-service] Tables initialized for Reviews, Q&A, and Seller Chat.")
    except Exception as e:
        print(f"[review-service] Table initialization error: {e}")
    finally:
        conn.close()

@app.on_event("startup")
def on_startup():
    init_tables()

# ==========================================
# REVIEWS ENDPOINTS
# ==========================================
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
        "features": ["reviews", "qa", "seller_chat"],
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
                INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, comment, is_verified_buyer, helpful_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0)
                RETURNING *;
            """, (review_id, req.product_id, req.user_id, req.user_name, req.rating, req.title, req.comment, req.is_verified_buyer))
            conn.commit()
            return cur.fetchone()
    finally:
        conn.close()

@app.post("/api/v1/reviews/{review_id}/helpful")
def mark_helpful(review_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE reviews 
                SET helpful_count = helpful_count + 1 
                WHERE id = %s 
                RETURNING *;
            """, (review_id,))
            conn.commit()
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(status_code=404, detail="Review not found")
            return updated
    finally:
        conn.close()

# ==========================================
# CUSTOMER Q&A (User-to-User & Seller Q&A)
# ==========================================
class QuestionCreateRequest(BaseModel):
    product_id: str
    user_id: str
    user_name: str
    question: str

class AnswerCreateRequest(BaseModel):
    question_id: str
    user_id: str
    user_name: str
    is_seller: bool = False
    answer: str

@app.get("/api/v1/reviews/qa/product/{product_id}")
def get_product_qa(product_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT q.*, 
                       COALESCE(
                           json_agg(
                               json_build_object(
                                   'id', a.id,
                                   'user_id', a.user_id,
                                   'user_name', a.user_name,
                                   'is_seller', a.is_seller,
                                   'answer', a.answer,
                                   'upvotes', a.upvotes,
                                   'created_at', a.created_at
                               ) ORDER BY a.created_at ASC
                           ) FILTER (WHERE a.id IS NOT NULL), '[]'::json
                       ) as answers
                FROM product_questions q
                LEFT JOIN product_answers a ON q.id = a.question_id
                WHERE q.product_id = %s
                GROUP BY q.id
                ORDER BY q.created_at DESC;
            """, (product_id,))
            questions = cur.fetchall()
            return {"product_id": product_id, "questions": questions}
    finally:
        conn.close()

@app.post("/api/v1/reviews/qa/question", status_code=201)
def post_question(req: QuestionCreateRequest):
    conn = get_db()
    qid = str(uuid.uuid4())
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO product_questions (id, product_id, user_id, user_name, question, upvotes)
                VALUES (%s, %s, %s, %s, %s, 0)
                RETURNING *;
            """, (qid, req.product_id, req.user_id, req.user_name, req.question))
            conn.commit()
            created = cur.fetchone()
            created['answers'] = []
            return created
    finally:
        conn.close()

@app.post("/api/v1/reviews/qa/answer", status_code=201)
def post_answer(req: AnswerCreateRequest):
    conn = get_db()
    aid = str(uuid.uuid4())
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO product_answers (id, question_id, user_id, user_name, is_seller, answer, upvotes)
                VALUES (%s, %s, %s, %s, %s, %s, 0)
                RETURNING *;
            """, (aid, req.question_id, req.user_id, req.user_name, req.is_seller, req.answer))
            conn.commit()
            return cur.fetchone()
    finally:
        conn.close()

# ==========================================
# BUYER-TO-SELLER REAL-TIME CHAT
# ==========================================
class ChatMessageRequest(BaseModel):
    product_id: str
    user_id: str
    sender_type: str  # 'buyer' or 'seller'
    sender_name: str
    message: str

@app.get("/api/v1/reviews/chat/{product_id}/{user_id}")
def get_chat_history(product_id: str, user_id: str):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM seller_chats
                WHERE product_id = %s AND user_id = %s
                ORDER BY created_at ASC;
            """, (product_id, user_id))
            messages = cur.fetchall()
            return {"product_id": product_id, "user_id": user_id, "messages": messages}
    finally:
        conn.close()

@app.post("/api/v1/reviews/chat/send", status_code=201)
def send_chat_message(req: ChatMessageRequest):
    conn = get_db()
    msg_id = str(uuid.uuid4())
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO seller_chats (id, product_id, user_id, sender_type, sender_name, message)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (msg_id, req.product_id, req.user_id, req.sender_type, req.sender_name, req.message))
            conn.commit()
            buyer_msg = cur.fetchone()

            # Automatic smart seller reply if message is from buyer
            seller_reply = None
            if req.sender_type == 'buyer':
                auto_reply_text = "Hello! Thanks for reaching out to the official brand store. Your inquiry regarding warranty, dispatch, and authenticity has been noted. Our team ships orders within 24 hours via Ekart Logistics with standard 1-year brand warranty."
                if "discount" in req.message.lower() or "price" in req.message.lower():
                    auto_reply_text = "We currently have active bank offers with HDFC Bank (10% instant discount) and special Big Billion Days promotional coupons applied at checkout!"
                elif "stock" in req.message.lower() or "available" in req.message.lower():
                    auto_reply_text = "Yes, this unit is 100% genuine and currently in stock in our central warehouse ready for same-day dispatch!"

                reply_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO seller_chats (id, product_id, user_id, sender_type, sender_name, message)
                    VALUES (%s, %s, %s, 'seller', 'Verified Seller Support', %s)
                    RETURNING *;
                """, (reply_id, req.product_id, req.user_id, auto_reply_text))
                conn.commit()
                seller_reply = cur.fetchone()

            return {
                "message": buyer_msg,
                "auto_reply": seller_reply
            }
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 5009)), reload=True)
