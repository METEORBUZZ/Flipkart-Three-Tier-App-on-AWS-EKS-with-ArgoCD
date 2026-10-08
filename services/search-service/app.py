import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv('PORT', 5003))

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'flipkart-postgres'),
        port=int(os.getenv('DB_PORT', 5432)),
        dbname=os.getenv('DB_NAME', 'flipkart_catalog'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'postgrespassword'),
    )

@app.route('/api/v1/search/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'search-service (Flask / Python)',
        'search_engine': 'PostgreSQL Full-Text & Trigrams (pg_trgm)',
    })

@app.route('/api/v1/search/query', methods=['GET'])
def search_products():
    query_str = request.args.get('q', '').strip()
    brand = request.args.get('brand')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    sort_by = request.args.get('sort', 'relevance') # relevance, price_asc, price_desc, rating
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))

    if not query_str:
        return jsonify({'results': [], 'total': 0, 'query': ''})

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Build search with similarity & ILIKE pattern matching
            sql = """
                SELECT id, title, brand, price, discount_percentage, images, rating, rating_count, is_assured,
                       similarity(title, %s) AS score
                FROM products
                WHERE is_active = TRUE
                  AND (title ILIKE %s OR brand ILIKE %s OR description ILIKE %s OR similarity(title, %s) > 0.15)
            """
            search_param = f"%{query_str}%"
            params = [query_str, search_param, search_param, search_param, query_str]

            if brand:
                sql += " AND brand ILIKE %s"
                params.append(brand)
            if min_price:
                sql += " AND price >= %s"
                params.append(float(min_price))
            if max_price:
                sql += " AND price <= %s"
                params.append(float(max_price))

            # Ordering
            if sort_by == 'price_asc':
                sql += " ORDER BY price ASC"
            elif sort_by == 'price_desc':
                sql += " ORDER BY price DESC"
            elif sort_by == 'rating':
                sql += " ORDER BY rating DESC"
            else:
                sql += " ORDER BY score DESC, rating DESC"

            sql += " LIMIT %s OFFSET %s"
            params.extend([limit, offset])

            cur.execute(sql, tuple(params))
            results = cur.fetchall()

            return jsonify({
                'query': query_str,
                'count': len(results),
                'results': results,
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/v1/search/suggestions', methods=['GET'])
def auto_suggestions():
    prefix = request.args.get('q', '').strip()
    if not prefix or len(prefix) < 2:
        return jsonify({'suggestions': []})

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT DISTINCT title
                FROM products
                WHERE title ILIKE %s
                LIMIT 8
                """,
                (f"%{prefix}%",)
            )
            rows = cur.fetchall()
            suggestions = [r['title'] for r in rows]
            return jsonify({'query': prefix, 'suggestions': suggestions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)
