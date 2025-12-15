const axios = require('axios');
const fs = require('fs');

async function seedData() {
    const API_URL = 'http://localhost:3001/api';
    const TEST_PHONE = '+918275566293';
    let user;

    // 1. Get or Create User
    try {
        console.log('Creating User...');
        const userRes = await axios.post(`${API_URL}/users`, {
            phoneNumber: TEST_PHONE,
            whatsappId: TEST_PHONE,
            name: 'Live Test User',
            age: 65,
            language: 'en'
        });
        user = userRes.data;
        console.log('User created:', user.id);
    } catch (error) {
        console.log('User creation failed, checking if exists...');
        try {
            const all = await axios.get(`${API_URL}/users`);
            user = all.data.find(u => u.phoneNumber === TEST_PHONE);
            if (user) console.log('Found existing user:', user.id);
            else {
                console.error('User not found and creation failed:', error.message);
                if (error.response) console.error(error.response.data);
                return;
            }
        } catch (e) { console.error('Failed to fetch users', e.message); return; }
    }

    if (!user) return;

    // 2. Create Medicine (Metformin)
    let medicine;
    try {
        console.log('Creating Medicine...');
        const medRes = await axios.post(`${API_URL}/medicines`, {
            userId: user.id,
            name: 'Metformin',
            dosage: '500mg',
            stockQuantity: 50
        });
        medicine = medRes.data;
        console.log('Medicine created:', medicine.id);
    } catch (error) {
        console.log('Medicine creation failed, checking existing...');
        // Try to find any medicine for user
        try {
            const meds = await axios.get(`${API_URL}/medicines?userId=${user.id}`);
            if (meds.data.length > 0) {
                medicine = meds.data[0];
                console.log('Using existing medicine:', medicine.id);
            } else {
                console.error('No medicine found/created');
            }
        } catch (e) { console.error('Failed to fetch meds'); }
    }

    // 3. Save IDs
    if (user && medicine) {
        const ids = { userId: user.id, medicineId: medicine.id };
        fs.writeFileSync('../frontend/lib/ids.json', JSON.stringify(ids, null, 2));
        console.log('✅ Setup Complete. IDs saved to frontend/lib/ids.json');
        console.log(ids);
    }
}

seedData();
