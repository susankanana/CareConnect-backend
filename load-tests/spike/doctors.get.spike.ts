import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 10 },   // ramp-up to 10 users
        { duration: '10s', target: 200 },  // sudden spike to 200 users
        { duration: '20s', target: 300 },  // stay at 300 users
        { duration: '10s', target: 10 },   // quick ramp-down to 10 users
        { duration: '10s', target: 0 },    // ramp-down to 0 users
    ],
    ext: {
        loadimpact: {
            name: 'Doctors GET Spike Test',
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