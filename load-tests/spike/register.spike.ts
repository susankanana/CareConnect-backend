import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 10 },   // ramp-up to 10 users
        { duration: '10s', target: 200 },  // sudden spike to 200 users
        { duration: '20s', target: 300 },  // hold at 300 users
        { duration: '10s', target: 10 },   // ramp-down to 10
        { duration: '10s', target: 0 },    // ramp-down to 0
    ],
    ext: {
        loadimpact: {
            name: 'User Registration Spike Test',
        },
    },
};

function randomEmail(): string {
    return `user${Math.floor(Math.random() * 1_000_000)}@gmail.com`;
}

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/auth/register';

    const payload = JSON.stringify({
        firstName: 'Spike',
        lastName: 'TestUser',
        email: randomEmail(),
        password: 'SpikeTest123!',
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
