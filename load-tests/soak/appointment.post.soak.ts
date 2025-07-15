import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 20 },    // ramp-up to 20 users
        { duration: '56m', target: 20 },    // hold at 20 users
        { duration: '40s', target: 0 },    // ramp-down to 0
    ],
    ext: {
        loadimpact: {
            name: 'Appointment POST Soak Test',
        },
    },
};

function getRandomDate(): string {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getRandomTime(): string {
    const hours = Math.floor(Math.random() * 8) + 9; // Between 09:00 and 16:00
    return `${hours.toString().padStart(2, '0')}:00:00`;
}

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/appointment/register';

    // Replace with valid existing values from your DB
    const doctorId = 243;
    const userId = 245;

    const payload = JSON.stringify({
        userId,
        doctorId,
        appointmentDate: getRandomDate(),
        timeSlot: getRandomTime(),
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI0NSwidXNlcl9pZCI6MjQ1LCJmaXJzdF9uYW1lIjoiTmFhbWFuIiwibGFzdF9uYW1lIjoiT21hcmUiLCJyb2xlIjoidXNlciIsImlzVmVyaWZpZWQiOmZhbHNlLCJleHAiOjE3NTI4Mjk2OTksImlhdCI6MTc1MjU3MDQ5OX0.HwQZTQgnJRE2BuyFrzG5KI7x0y93S7SG7Iddjidt8AE`
        },
        timeout: '60s',
    };

    const res = http.post(url, payload, params);

    check(res, {
        'status is 201': (r) => r.status === 201,
        'appointmentId present': (r) => {
            try {
                const body = JSON.parse(r.body as string);
                return body?.data?.appointmentId !== undefined;
            } catch {
                return false;
            }
        },
    });

    sleep(1);
}
