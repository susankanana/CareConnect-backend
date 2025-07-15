import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 1,        // 1 virtual user
    iterations: 1, // 1 registration attempt
};

function randomEmail(): string {
    return `user${Math.floor(Math.random() * 1000000)}@gmail.com`;
}

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/auth/register';

    const payload = JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: randomEmail(),
        password: 'TestPassword123!',
        role: 'user'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            },
        timeout: '90s', // allow more time for slow response
    };


    const res = http.post(url, payload, params);

    check(res, {
        'status is 201': (r) => r.status === 201,
        'message present': (r) => {
            try {
                const body = JSON.parse(r.body as string);
                return body.message !== undefined;
            } catch {
                return false;
            }
        },
    });

    sleep(1);
}