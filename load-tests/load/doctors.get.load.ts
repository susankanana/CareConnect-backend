import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://careconnect-backend-c2he.onrender.com'; 

export const options = {
    stages: [
        { duration: '30s', target: 40 }, // ramp-up to 40 users over 30 seconds
        { duration: '40s', target: 50 }, // stay at 50 users for 40 seconds
        { duration: '10s', target: 0 },  // ramp-down to 0 users
    ],
    ext: {
        loadimpact: {
            name: 'Doctors GET Load Test',
        },
    },
};

export default function () {
    
    const res = http.get(`${BASE_URL}/doctors`, {
        headers: {
            'Content-Type': 'application/json',
             'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI0MiwidXNlcl9pZCI6MjQyLCJmaXJzdF9uYW1lIjoiU3VzYW4iLCJsYXN0X25hbWUiOiJLYW5hbmEiLCJyb2xlIjoiYWRtaW4iLCJpc1ZlcmlmaWVkIjpmYWxzZSwiZXhwIjoxNzUyODMxNjMxLCJpYXQiOjE3NTI1NzI0MzF9.enXQshsHcn0-x0vgSF42o5AhK8oAKMqgCJjXw4FsWSs`
        },
    });

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