require('dotenv').config();
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'flipkart-redis',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

const CHANNELS = [
  'flipkart:events:order_placed',
  'flipkart:events:payment_success',
  'flipkart:events:shipment_dispatched',
  'flipkart:events:otp_requested',
];

redis.on('ready', () => {
  console.log('[notification-service] Connected and ready for Pub/Sub.');
  redis.subscribe(CHANNELS, (err, count) => {
    if (err) {
      console.error('[notification-service] Subscription error:', err);
    } else {
      console.log(`[notification-service] Subscribed to ${count} notification channels.`);
    }
  });
});

redis.on('message', (channel, message) => {
  try {
    const payload = JSON.parse(message);
    console.log(`\n================== [NOTIFICATION EVENT] ==================`);
    console.log(`Channel: ${channel}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    switch (channel) {
      case 'flipkart:events:order_placed':
        console.log(`📧 [EMAIL] Order Confirmation sent to user: ${payload.userId || payload.email}`);
        console.log(`   Order ID: ${payload.orderId}, Total: ₹${payload.totalAmount}`);
        break;

      case 'flipkart:events:payment_success':
        console.log(`💳 [SMS] Payment of ₹${payload.amount} confirmed for Order: ${payload.orderId}`);
        break;

      case 'flipkart:events:shipment_dispatched':
        console.log(`🚚 [PUSH] Ekart update: Your package #${payload.trackingNumber} is out for delivery!`);
        break;

      case 'flipkart:events:otp_requested':
        const recipientPhone = (payload.phone || '').startsWith('+91') ? payload.phone : `+91${payload.phone}`;
        const smsUri = `sms:${recipientPhone}?&body=VK-FLPKRT:%20Your%20Flipkart%20verification%20code%20is%20${payload.otp}%20(Ref%20ID:%20%23${payload.ref_id}).%20Valid%20for%205%20mins.`;
        console.log(`📱 [TELECOM SMS PROTOCOL DISPATCH]`);
        console.log(`   Carrier Protocol: GSM Short Message Service / SMPP Protocol (RFC 5724)`);
        console.log(`   Recipient Personal Number: ${recipientPhone}`);
        console.log(`   Sender: VK-FLPKRT`);
        console.log(`   Transaction Ref ID: #${payload.ref_id}`);
        console.log(`   Verification OTP: ${payload.otp}`);
        console.log(`   SMS Protocol URI: ${smsUri}`);
        console.log(`   Status: Handed over to Carrier SMS Gateway (200 OK Delivered)`);
        break;

      default:
        console.log(`ℹ️ [GENERIC NOTIFICATION]:`, payload);
    }
    console.log(`==========================================================\n`);
  } catch (e) {
    console.log(`[notification-service] Message on ${channel}: ${message}`);
  }
});

redis.on('error', (err) => {
  console.error('[notification-service] Redis error:', err.message);
});

console.log('[notification-service] Worker process active and listening for events...');
