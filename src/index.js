const { sendRequest } = require('./request');
const Stats = require('./stats');
const { saveLogs, saveJsonReport, saveHtmlReport } = require('./logger');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;

async function runTests(config) {
    const {
        targetUrl = 'http://localhost:5000/api/test',
        maxRequests = 10,
        delay = 1,
        concurrent = 5,
        authToken = '',
        sessionCookie = '',
        csrfToken = '',
        customPayloadsFile = ''
    } = config;

    console.log(`\n🚀 Sending ${maxRequests} request(s) to ${targetUrl} with ${delay}s delay and ${concurrent} concurrent requests...`);

    // Default payloads
    let payloads = [
        { test_id: `test_${uuidv4()}`, value: 'sample' },
        { test_id: `<script>alert('XSS')</script>`, value: 'malicious' },
        { test_id: `1; DROP TABLE users; --`, value: 'sql_injection' },
        { test_id: `../../etc/passwd`, value: 'path_traversal' }
    ];

    // Load custom payloads if provided
    if (customPayloadsFile) {
        try {
            const customPayloads = JSON.parse(await fs.readFile(customPayloadsFile));
            payloads = payloads.concat(customPayloads);
        } catch (error) {
            console.error(`Error loading custom payloads: ${error.message}`);
        }
    }

    // Headers configuration
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (sessionCookie) headers['Cookie'] = sessionCookie;

    // JWT manipulation
    const manipulatedJwt = authToken ? jwt.sign({ ...jwt.decode(authToken), iat: Math.floor(Date.now() / 1000) - 3600 }, 'invalid-secret') : 'invalid_jwt_token';

    // Test configurations
    const testConfigs = [
        { type: 'STANDARD', headers, payload: payloads[0] },
        { type: 'CSRF', headers: { ...headers, 'X-CSRF-Token': csrfToken || 'invalid_csrf_token' }, payload: payloads[0] },
        { type: 'CSRF', headers, payload: payloads[0] },
        { type: 'SESSION_HIJACK', headers: { ...headers, Cookie: `sessionId=${uuidv4()}` }, payload: payloads[0] },
        { type: 'SESSION_HIJACK', headers: { ...headers, Cookie: sessionCookie || `sessionId=expired_${uuidv4()}` }, payload: payloads[0] },
        { type: 'JWT', headers: { ...headers, Authorization: `Bearer ${manipulatedJwt}` }, payload: payloads[0] },
        { type: 'JWT', headers: { ...headers, Authorization: 'Bearer invalid_jwt' }, payload: payloads[0] },
        { type: 'MALICIOUS', headers, payload: payloads[Math.floor(Math.random() * (payloads.length - 1)) + 1] }
    ];

    const stats = new Stats();
    const results = [];
    const startTime = performance.now();

    // Run requests in batches
    for (let i = 1; i <= maxRequests; i += concurrent) {
        const batch = [];
        for (let j = 0; j < concurrent && i + j <= maxRequests; j++) {
            const config = testConfigs[Math.floor(Math.random() * testConfigs.length)];
            batch.push(sendRequest(i + j, targetUrl, 'POST', config.headers, config.payload, 20000, config.type));
        }

        const batchResults = await Promise.all(batch);
        batchResults.forEach(result => {
            stats.update(result);
            results.push(result);
            console.log(`\r📊 Sent: ${stats.total}/${maxRequests} | ✅ Success: ${stats.success} | ❌ Error: ${stats.error} | ⏱ Avg Time: ${stats.getAverageTime()}s`);
        });

        await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    const csvFile = await saveLogs(results);
    const jsonFile = await saveJsonReport(results, stats.getSummary());
    const htmlFile = await saveHtmlReport(results, stats.getSummary());
    const elapsedTotal = Number((performance.now() - startTime) / 1000).toFixed(2);

    console.log('\n📈 Test Summary:');
    console.log(`⏳ Total time: ${elapsedTotal}s`);
    console.log(`⚡ Avg RPS: ${(maxRequests / elapsedTotal).toFixed(2)}`);
    console.log(`✅ Successful requests: ${stats.success}`);
    console.log(`❌ Failed requests: ${stats.error}`);
    console.log(`🔒 CSRF test failures: ${stats.csrfFailures} (If low, CSRF protection may be effective)`);
    console.log(`🔓 Session Hijacking test failures: ${stats.sessionHijackFailures} (If low, session validation may be effective)`);
    console.log(`🔐 JWT test failures: ${stats.jwtFailures} (If low, JWT validation may be effective)`);
    console.log(`📁 Logs saved to '${csvFile}', '${jsonFile}', and '${htmlFile}'`);
}

module.exports = { runTests };