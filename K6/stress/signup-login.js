import http from 'k6/http';
import { check, sleep, Trend, Counter } from 'k6';

// Define custom trends and counters for measuring performance
const durationTiming_SignUp = new Trend('/POST Duration Timing_SignUp');
const tlsHandShakingTiming_SignUp = new Trend('/POST Tls shaking_SignUp');
let SignUpCounter = new Counter('/AlphaPortal SignUp Counter');
let SignUpStatusIsNotOk = new Counter('/SignUp errors (status is not 200)');
let SignUpWithoutToken = new Counter('/SignUp errors (without token)');

const durationTiming_Login = new Trend('/POST Duration Timing_Login');
const tlsHandShakingTiming_Login = new Trend('/POST Tls shaking_Login');
let LoginCounter = new Counter('/AlphaPortal Login Counter');
let LoginStatusIsNotOk = new Counter('/Login errors (status is not 200)');
let LoginWithoutToken = new Counter('/Login errors (without token)');

// Stress test stages
export let options = {
    stages: [
        { duration: '2m', target: 100 },    // Ramp-up to 100 users over 2 minutes
        { duration: '2m', target: 200 },    // Ramp-up to 200 users over 2 minutes
        { duration: '3m', target: 300 },    // Ramp-up to 300 users over 3 minutes (increased pressure)
        { duration: '2m', target: 400 },    // Ramp-up to 400 users over 2 minutes (further stress)
        { duration: '5m', target: 500 },    // Maintain at 500 users for 5 minutes (maximum stress)
        { duration: '2m', target: 0 },      // Ramp-down to 0 users over 2 minutes (recovery phase)
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'],  // 95% of requests should finish within 1500ms
    },
};

// Main function for stress test
export default function () {
    // Step 1: Sign-up request
    let signUpPayload = JSON.stringify({
        username: `testuser_${__VU}_${__ITER}`,  // Unique username for each virtual user
        password: 'password123',
        email: `testuser_${__VU}_${__ITER}@example.com`,
    });

    let headers = { 'Content-Type': 'application/json' };

    // Send the sign-up request
    let signUpRes = http.post('https://test-api.example.com/signup', signUpPayload, { headers });

    // Track sign-up trends and counters
    SignUpCounter.add(1);
    durationTiming_SignUp.add(signUpRes.timings.duration);
    tlsHandShakingTiming_SignUp.add(signUpRes.timings.tls_handshaking);

    let signUpStatusIsOk = check(signUpRes, { 'status is 200': (r) => r.status === 200 });
    let signUpTokenExists = signUpRes.headers['Authorization'] !== undefined;

    // Increment counters for sign-up errors
    if (!signUpStatusIsOk) {
        SignUpStatusIsNotOk.add(1);
    }
    if (!signUpTokenExists) {
        SignUpWithoutToken.add(1);
    }

    // Pause before next step
    sleep(1);

    // Step 2: Log in using the created account
    let loginPayload = JSON.stringify({
        username: `testuser_${__VU}_${__ITER}`,
        password: 'password123',
    });

    // Send the login request
    let loginRes = http.post('https://test-api.example.com/login', loginPayload, { headers });

    // Track login trends and counters
    LoginCounter.add(1);
    durationTiming_Login.add(loginRes.timings.duration);
    tlsHandShakingTiming_Login.add(loginRes.timings.tls_handshaking);

    let loginStatusIsOk = check(loginRes, { 'status is 200': (r) => r.status === 200 });
    let loginTokenExists = loginRes.headers['Authorization'] !== undefined;

    // Increment counters for login errors
    if (!loginStatusIsOk) {
        LoginStatusIsNotOk.add(1);
    }
    if (!loginTokenExists) {
        LoginWithoutToken.add(1);
    }

    // Pause before the next iteration
    sleep(1);
}
