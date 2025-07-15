import http from 'k6/http'; 
import { check, sleep } from 'k6'; 


export const options = {
    vus: 1, 
    iterations: 1,
    duration: '15s', 

};

export default function () {
    const url = 'https://careconnect-backend-c2he.onrender.com/auth/login';
    const payload = JSON.stringify({ 
        email: 'suzzannekans@gmail.com',
        password: 'pass123'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json', 
        },
    };

    const res = http.post(url, payload, params); 



    check(res, {
        'status is 200': (r) => r.status === 200,
        'response has token': (r) => {
            try {
                const body = JSON.parse(r.body as string);
                return typeof body.token === 'string';
            } catch {
                return false;
            }
        },
    });

    sleep(1);
}