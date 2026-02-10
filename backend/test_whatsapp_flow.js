const axios = require('axios');

async function testOrder() {
    const API_URL = 'http://localhost:4000/api';

    const orderData = {
        customer: {
            name: 'Test User WhatsApp',
            email: 'test@whatsapp.com',
            phone: '5551234567'
        },
        items: [
            {
                name: 'Cadena Cubana',
                quantity: 1,
                price: 2500,
                options: { largo: '50cm', material: 'Oro 14k' }
            }
        ],
        subtotal: 2500,
        shipping_cost: 150,
        total: 2650,
        payment_method: 'whatsapp_pending',
        whatsapp_message: 'Hola, quiero confirmar este pedido:\n\n🧾 *Pedido Web*\n...'
    };

    try {
        console.log('Creating order...');
        const res = await axios.post(`${API_URL}/orders`, orderData);

        if (res.status === 201) {
            console.log('✅ Order created successfully');
            console.log('Order ID:', res.data.order.id);
            console.log('Order Number:', res.data.order.order_number);
            console.log('Status:', res.data.order.status);
            console.log('Source:', res.data.order.source);
            console.log('WhatsApp Message Saved:', !!res.data.order.whatsapp_message);

            if (res.data.order.status === 'sent_to_whatsapp') {
                console.log('✅ Status is correct: sent_to_whatsapp');
            } else {
                console.error('❌ Status is incorrect:', res.data.order.status);
            }
        } else {
            console.error('❌ Failed to create order:', res.status, res.data);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.response) console.error(err.response.data);
    }
}

testOrder();
