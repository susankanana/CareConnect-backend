import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 },   // ramp-up to 20 users
        { duration: '30s', target: 100 },  // ramp-up to 100 users
        { duration: '30s', target: 200 },  // ramp-up to 200 users
        { duration: '1m', target: 300 },   // spike to 300 users
        { duration: '30s', target: 0 },    // ramp-down
    ],
    ext: {
        loadimpact: {
            name: 'User Registration Stress Test',
        },
    },
};

function randomEmail(): string {
    return `user${Math.floor(Math.random() * 1_000_000)}@gmail.com`;
}

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/auth/register';

    const payload = JSON.stringify({
        firstName: 'Stress',
        lastName: 'Tester',
        email: randomEmail(),
        password: 'StressTest123!',
        role: 'user',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: '60s',
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
