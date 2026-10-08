import os
import uuid
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv('PORT', 5008))

def get_db():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'flipkart-postgres'),
        port=int(os.getenv('DB_PORT', 5432)),
        dbname=os.getenv('DB_NAME', 'flipkart_delivery'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'postgrespassword'),
    )

def init_tables():
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS shipments (
                id UUID PRIMARY KEY,
                tracking_number VARCHAR(100) UNIQUE NOT NULL,
                order_id VARCHAR(100) NOT NULL,
                destination_pincode VARCHAR(10) NOT NULL,
                status VARCHAR(50) NOT NULL, -- CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED
                courier_partner VARCHAR(50) DEFAULT 'Ekart Logistics',
                estimated_delivery DATE NOT NULL,
                current_hub VARCHAR(100) DEFAULT 'Bangalore Hub',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """)
            conn.commit()
            print("[delivery-service] Shipments table initialized.")
    except Exception as e:
        print(f"[delivery-service] Table error: {e}")
    finally:
        conn.close()

with app.app_context():
    init_tables()

@app.route('/api/v1/delivery/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'delivery-service (Flask / Ekart Logistics)',
        'database': 'PostgreSQL'
    })

@app.route('/api/v1/delivery/check-pincode', methods=['GET'])
def check_pincode():
    pincode = request.args.get('pincode', '').strip()
    if not pincode or len(pincode) != 6:
        return jsonify({'serviceable': False, 'message': 'Please provide a valid 6-digit Indian PIN code.'}), 400

    # Mock serviceability logic
    est_days = 2 if pincode.startswith('56') or pincode.startswith('11') or pincode.startswith('40') else 4
    est_date = (datetime.utcnow() + timedelta(days=est_days)).strftime('%A, %b %d')

    return jsonify({
        'pincode': pincode,
        'serviceable': True,
        'courier': 'Ekart Logistics',
        'delivery_speed': 'Fast Delivery Available (F-Assured)',
        'estimated_delivery': est_date,
        'cod_available': True
    })

@app.route('/api/v1/delivery/shipments', methods=['POST'])
def create_shipment():
    data = request.get_json() or {}
    order_id = data.get('order_id')
    destination_pincode = data.get('destination_pincode', '560001')

    if not order_id:
        return jsonify({'error': 'order_id is required'}), 400

    shipment_id = str(uuid.uuid4())
    tracking_number = f"FMPL{uuid.uuid4().hex[:10].upper()}"
    est_date = (datetime.utcnow() + timedelta(days=3)).date()

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                INSERT INTO shipments (id, tracking_number, order_id, destination_pincode, status, estimated_delivery)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (shipment_id, tracking_number, order_id, destination_pincode, 'CREATED', est_date))
            conn.commit()
            created = cur.fetchone()
            return jsonify(created), 201
    finally:
        conn.close()

@app.route('/api/v1/delivery/track/<tracking_number>', methods=['GET'])
def track_shipment(tracking_number):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM shipments WHERE tracking_number = %s", (tracking_number,))
            row = cur.fetchone()
            if not row:
                return jsonify({'error': 'Tracking number not found'}), 404
            return jsonify(row)
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)
