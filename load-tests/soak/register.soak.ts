import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 20 },    // ramp-up to 20 users
        { duration: '56m', target: 20 },    // sustain 20 users
        { duration: '40s', target: 0 },    // ramp-down to 0
    ],
    ext: {
        loadimpact: {
            name: 'User Registration Soak Test',
        },
    },
};

function randomEmail(): string {
    return `user${Math.floor(Math.random() * 1_000_000)}@gmail.com`;
}

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/auth/register';

    const payload = JSON.stringify({
        firstName: 'Soak',
        lastName: 'TestUser',
        email: randomEmail(),
        password: 'SoakTest123!',
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
