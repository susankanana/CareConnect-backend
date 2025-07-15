import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://careconnect-backend-c2he.onrender.com';

export const options = {
    stages: [
        { duration: '30s', target: 30 }, // ramp-up to 30 users over 30s
        { duration: '40s', target: 40 }, // stay at 40 users for 40s
        { duration: '10s', target: 0 },  // ramp-down to 0
    ],
    ext: {
        loadimpact: {
            name: 'User Registration Load Test',
        },
    },
};

function randomEmail(): string {
    return `user${Math.floor(Math.random() * 1000000)}@gmail.com`;
}

export default function () {
    const url = `${BASE_URL}/auth/register`;

    const payload = JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: randomEmail(),
        password: 'TestPassword123!',
        role: 'user',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: '90s',
    };

    const res = http.post(url, payload, params);

    check(res, {
        'status is 201': (r) => r.status === 201,
        'message present': (r) => {
            try {
                const body = JSON.parse(r.body as string);
                return typeof body.message === 'string';
            } catch {
                return false;
            }
        },
    });

    sleep(1);
}
