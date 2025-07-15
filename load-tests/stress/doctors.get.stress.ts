import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 },   // ramp-up to 20 users
        { duration: '30s', target: 100 },  // ramp-up to 100 users
        { duration: '30s', target: 200 },  // ramp-up to 200 users
        { duration: '1m', target: 300 },   // spike to 300 users
        { duration: '30s', target: 0 },    // ramp-down to 0 users
    ],
    ext: {
        loadimpact: {
            name: 'Doctors GET Stress Test',
        },
    },
};

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/doctors';

    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI0MiwidXNlcl9pZCI6MjQyLCJmaXJzdF9uYW1lIjoiU3VzYW4iLCJsYXN0X25hbWUiOiJLYW5hbmEiLCJyb2xlIjoiYWRtaW4iLCJpc1ZlcmlmaWVkIjpmYWxzZSwiZXhwIjoxNzUyODMxNjMxLCJpYXQiOjE3NTI1NzI0MzF9.enXQshsHcn0-x0vgSF42o5AhK8oAKMqgCJjXw4FsWSs`
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