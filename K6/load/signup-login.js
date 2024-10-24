import http from 'k6/http';
import { check, sleep, Trend, Counter } from 'k6';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import {SharedArray} from "k6/data";

const csvData = new SharedArray("Shared Logins", function () {
    return papaparse.parse(open('../../data/filename.csv'), {header: true}).data;
});

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

// Define options for the load test
export let options = {
    stages: [
        { duration: '10s', target: 50 },  // Ramp-up to 50 users
        { duration: '20s', target: 50 },  // Stay at 50 users for 20 seconds
        { duration: '10s', target: 0 },   // Ramp-down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // Ensure 95% of requests finish below 500ms
    },
};

// Define the main test function
export default function () {
    // Step 1: Sign-up
    let signUpPayload = JSON.stringify({
        username: `testuser_${__VU}_${__ITER}`,  // Unique username per user
        password: 'password123',
        email: `testuser_${__VU}_${__ITER}@example.com`,
    });

    let headers = { 'Content-Type': 'application/json' };

    // Send POST request to the sign-up endpoint
    let signUpRes = http.post('https://test-api.example.com/signup', signUpPayload, { headers });

    // Track the number of sign-up attempts
    SignUpCounter.add(1);

    // Capture and record trends (duration and TLS handshake timing) for sign-up
    durationTiming_SignUp.add(signUpRes.timings.duration);  // Total request duration
    tlsHandShakingTiming_SignUp.add(signUpRes.timings.tls_handshaking);  // TLS handshake time

    // Check for successful status code (200) and token presence in sign-up
    let signUpStatusIsOk = check(signUpRes, { 'status is 200': (r) => r.status === 200 });
    let signUpTokenExists = signUpRes.headers['Authorization'] !== undefined;

    // Increment counters based on failure scenarios for sign-up
    if (!signUpStatusIsOk) {
        SignUpStatusIsNotOk.add(1);  // Count requests with non-200 responses
    }
    if (!signUpTokenExists) {
        SignUpWithoutToken.add(1);  // Count requests missing a token
    }

    // Pause before next action
    sleep(1);

    // Step 2: Log in using the same credentials
    let loginPayload = JSON.stringify({
        username: `testuser_${__VU}_${__ITER}`,  // Use the same username from sign-up
        password: 'password123',
    });

    // Send POST request to the login endpoint
    let loginRes = http.post('https://test-api.example.com/login', loginPayload, { headers });

    // Track the number of login attempts
    LoginCounter.add(1);

    // Capture and record trends (duration and TLS handshake timing) for login
    durationTiming_Login.add(loginRes.timings.duration);  // Total request duration
    tlsHandShakingTiming_Login.add(loginRes.timings.tls_handshaking);  // TLS handshake time

    // Check for successful status code (200) and token presence in login
    let loginStatusIsOk = check(loginRes, { 'status is 200': (r) => r.status === 200 });
    let loginTokenExists = loginRes.headers['Authorization'] !== undefined;

    // Increment counters based on failure scenarios for login
    if (!loginStatusIsOk) {
        LoginStatusIsNotOk.add(1);  // Count requests with non-200 responses
    }
    if (!loginTokenExists) {
        LoginWithoutToken.add(1);  // Count requests missing a token
    }

    // Pause before the next iteration
    sleep(1);
}
