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
            name: 'User Registration Breakpoint Test',
        },
    },
};

function randomEmail(): string {
    return `user${Math.floor(Math.random() * 1_000_000)}@gmail.com`;
}

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/auth/register';

    const payload = JSON.stringify({
        firstName: 'Breakpoint',
        lastName: 'TestUser',
        email: randomEmail(),
        password: 'BreakpointTest123!',
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
