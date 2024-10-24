import http from 'k6/http';
import { check, sleep, Trend, Counter } from 'k6';

// Define custom trends and counters for performance measurement
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

// Spike test stages
export let options = {
    stages: [
        { duration: '2m', target: 10 },    // Ramp-up to 10 users over 2 minutes
        { duration: '30s', target: 200 },  // Spike to 200 users within 30 seconds (sudden surge)
        { duration: '3m', target: 200 },   // Hold at 200 users for 3 minutes (test system under spike)
        { duration: '30s', target: 10 },   // Ramp down to 10 users within 30 seconds
        { duration: '3m', target: 0 },     // Return to 0 users over 3 minutes (recovering phase)
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'],  // 95% of requests should complete within 1000ms
    },
};

// Main function for spike test
export default function () {
    // Step 1: Sign-up request
    let signUpPayload = JSON.stringify({
        username: `testuser_${__VU}_${__ITER}`,  // Unique username for each virtual user
        password: 'password123',
        email: `testuser_${__VU}_${__ITER}@example.com`,
    });

    let headers = { 'Content-Type': 'application/json' };

    // Send POST request for sign-up
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

    // Send POST request for login
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
