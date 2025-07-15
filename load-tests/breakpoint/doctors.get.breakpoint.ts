import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 50 },    // ramp-up to 50 users
        { duration: '30s', target: 100 },   // ramp-up to 100 users
        { duration: '30s', target: 200 },   // ramp-up to 200 users
        { duration: '30s', target: 400 },   // ramp-up to 400 users
        { duration: '30s', target: 800 },   // ramp-up to 800 users
        { duration: '30s', target: 1600 },  // ramp-up to 1600 users (keep increasing)
        { duration: '30s', target: 0 },     // ramp-down to 0 users
    ],
    ext: {
        loadimpact: {
            name: 'Doctors GET Breakpoint Test',
        },
    },
};

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/doctors';

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI0MiwidXNlcl9pZCI6MjQyLCJmaXJzdF9uYW1lIjoiU3VzYW4iLCJsYXN0X25hbWUiOiJLYW5hbmEiLCJyb2xlIjoiYWRtaW4iLCJpc1ZlcmlmaWVkIjpmYWxzZSwiZXhwIjoxNzUyODI5NDY2LCJpYXQiOjE3NTI1NzAyNjZ9.2_NJxO_MZOQfEiAx1xQKc89r7Ix6cEPnuqtAZApJh20`
        },
    };

    const res = http.get(url, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'has data array': (r) => {
            try {
                const body = JSON.parse(r.body as string);
                return Array.isArray(body.data);
            } catch {
                return false;
            }
        },
    });

    sleep(1);
}