import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50 },    // ramp-up to 50 users
        { duration: '30s', target: 100 },   // ramp-up to 100 users
        { duration: '30s', target: 200 },   // ramp-up to 200 users
        { duration: '30s', target: 400 },   // ramp-up to 400 users
        { duration: '30s', target: 800 },   // ramp-up to 800 users
        { duration: '30s', target: 1600 },  // ramp-up to 1600 users
        { duration: '30s', target: 0 },     // ramp-down to 0 users
    ],
    ext: {
        loadimpact: {
            name: 'Appointment POST Breakpoint Test',
        },
    },
};

function getRandomDate(): string {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getRandomTime(): string {
    const hours = Math.floor(Math.random() * 8) + 9; // 09:00–16:00
    return `${hours.toString().padStart(2, '0')}:00:00`;
}

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/appointment/register';

    // Replace these with valid, existing doctor & user IDs
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
