-- 02-seed-data.sql
-- Seed Categories and Real Products into flipkart_catalog

\c flipkart_catalog;

INSERT INTO categories (id, name, slug, icon_url) VALUES 
('a0000000-0000-0000-0000-000000000001', 'Mobiles & Tablets', 'mobiles', 'https://rukminim2.flixcart.com/flap/128/128/image/22fddf3c7da4c4f4.png'),
('a0000000-0000-0000-0000-000000000002', 'Electronics', 'electronics', 'https://rukminim2.flixcart.com/flap/128/128/image/69c6589653afdb9a.png'),
('a0000000-0000-0000-0000-000000000003', 'Fashion', 'fashion', 'https://rukminim2.flixcart.com/flap/128/128/image/82b3ca5fb2301045.png'),
('a0000000-0000-0000-0000-000000000004', 'Appliances', 'appliances', 'https://rukminim2.flixcart.com/flap/128/128/image/0ff199d1bd27eb98.png')
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (
    id, seller_id, category_id, title, brand, description, price, discount_percentage, images, specifications, rating, rating_count, is_assured, is_active
) VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Apple iPhone 15 (Blue, 128 GB)',
    'Apple',
    'Dynamic Island, 48MP main camera, USB-C, Super Retina XDR display with Ceramic Shield protection.',
    71999.00,
    10.00,
    '["https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/k/l/l/-original-imagtc5fz9spysyk.jpeg"]'::jsonb,
    '{"RAM": "6 GB", "Storage": "128 GB", "Color": "Blue", "Display": "6.1 inch OLED", "Processor": "A16 Bionic"}'::jsonb,
    4.6,
    1420,
    TRUE,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256 GB)',
    'Samsung',
    'Galaxy AI is here. 200MP camera, built-in S Pen, Titanium frame, Snapdragon 8 Gen 3 for Galaxy.',
    129999.00,
    14.00,
    '["https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/5/r/x/-original-imagx9egzf3hgygh.jpeg"]'::jsonb,
    '{"RAM": "12 GB", "Storage": "256 GB", "Color": "Titanium Gray", "Display": "6.8 inch QHD+ AMOLED", "Battery": "5000 mAh"}'::jsonb,
    4.8,
    890,
    TRUE,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones',
    'Sony',
    'Industry-leading noise cancellation with 8 microphones, Auto NC Optimizer, 30-hour battery life.',
    29990.00,
    18.00,
    '["https://rukminim2.flixcart.com/image/612/612/l31x2fk0/headphone/a/s/h/-original-image9e4ggz4phgf.jpeg"]'::jsonb,
    '{"Type": "Over-Ear", "Battery": "30 Hours", "Bluetooth": "v5.2", "Color": "Black", "Noise Cancellation": "Dual Processor V1"}'::jsonb,
    4.7,
    3120,
    TRUE,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Apple MacBook Air M2 (13.6-inch, 8GB RAM, 256GB SSD, Midnight)',
    'Apple',
    'Strikingly thin design, 13.6-inch Liquid Retina display, M2 chip, 18-hour battery life, 1080p FaceTime camera.',
    89990.00,
    12.00,
    '["https://rukminim2.flixcart.com/image/312/312/xif0q/computer/2/v/v/-original-imagfdeqter4sj2j.jpeg"]'::jsonb,
    '{"Chip": "Apple M2 8-core", "RAM": "8 GB Unified", "SSD": "256 GB", "Weight": "1.24 kg"}'::jsonb,
    4.8,
    2150,
    TRUE,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'OnePlus 12R (Cool Blue, 128 GB)',
    'OnePlus',
    'Snapdragon 8 Gen 2, 4th Gen LTPO 120Hz ProXDR display, 5500 mAh battery with 100W SUPERVOOC charging.',
    39999.00,
    8.00,
    '["https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/a/b/k/-original-imagx74ff9gzc93h.jpeg"]'::jsonb,
    '{"RAM": "8 GB", "Storage": "128 GB", "Charging": "100W Wired", "Battery": "5500 mAh"}'::jsonb,
    4.5,
    640,
    TRUE,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'Nike Air Force 1 07 Casual Sneakers For Men (White)',
    'Nike',
    'Classic low-cut silhouette with stitched overlays, clean white leather finish and Nike Air cushioning.',
    7495.00,
    15.00,
    '["https://rukminim2.flixcart.com/image/612/612/xif0q/shoe/m/o/4/-original-imagzgvfgv65bxhv.jpeg"]'::jsonb,
    '{"Color": "Triple White", "Material": "Genuine Leather", "Sole": "Rubber Cupsole"}'::jsonb,
    4.4,
    1840,
    TRUE,
    TRUE
)
ON CONFLICT (id) DO NOTHING;
