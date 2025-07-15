import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 1,        // 1 virtual user
    iterations: 1, // 1 appointment creation attempt
};

function getRandomDate(): string {
    const today = new Date();
    today.setDate(today.getDate() + 1); // tomorrow
    return today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function getRandomTime(): string {
    const hours = Math.floor(Math.random() * 8) + 9; // 9 AM to 4 PM
    return `${hours.toString().padStart(2, '0')}:00:00`; // 'HH:00:00'
}

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/appointment/register';

    // Replace with valid values from your DB or seed data
    const doctorId = 243;
    const userId = 245;

    const payload = JSON.stringify({
        userId,
        doctorId,
        appointmentDate: getRandomDate(),
        timeSlot: getRandomTime()
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI0NSwidXNlcl9pZCI6MjQ1LCJmaXJzdF9uYW1lIjoiTmFhbWFuIiwibGFzdF9uYW1lIjoiT21hcmUiLCJyb2xlIjoidXNlciIsImlzVmVyaWZpZWQiOmZhbHNlLCJleHAiOjE3NTI4Mjk2OTksImlhdCI6MTc1MjU3MDQ5OX0.HwQZTQgnJRE2BuyFrzG5KI7x0y93S7SG7Iddjidt8AE`
        },
    };

    const res = http.post(url, payload, params);

    console.log('STATUS:', res.status);
    console.log('RESPONSE:', res.body);


    check(res, {
        'status is 201': (r) => r.status === 201,
        'appointmentId present': (r) => {
            try {
                const body = JSON.parse(r.body as string);
                return body.data.appointmentId !== undefined;
            } catch {
                return false;
            }
        },
    });

    sleep(1);
}
