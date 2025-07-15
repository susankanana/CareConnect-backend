import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '2m', target: 20 },   // ramp-up to 20 users over 2 minutes
        { duration: '56m', target: 20 },  // stay at 20 users for 56 minutes (total 58m)
        { duration: '40s', target: 0 },    // ramp-down to 0 users
    ],
    ext: {
        loadimpact: {
            name: 'Doctors GET Soak Test',
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