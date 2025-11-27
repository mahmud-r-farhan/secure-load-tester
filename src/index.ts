import { sendRequest } from './request';
import { Stats, TestResult } from './stats';
import { saveLogs, saveJsonReport, saveHtmlReport } from './logger';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';

export interface Config {
    targetUrl?: string;
    maxRequests?: number;
    delay?: number;
    concurrent?: number;
    authToken?: string;
    sessionCookie?: string;
    csrfToken?: string;
    customPayloadsFile?: string;
    method?: string;
    timeout?: number;
    outputDir?: string;
}

interface TestConfig {
    type: string;
    headers: Record<string, string>;
    payload: { test_id: string; value: string };
}

export async function runTests(config: Config): Promise<void> {
    const {
        targetUrl = 'http://localhost:5000/api/test',
        maxRequests = 10,
        delay = 1,
        concurrent = 5,
        authToken = '',
        sessionCookie = '',
        csrfToken = '',
        customPayloadsFile = '',
        method = 'POST',
        timeout = 20000,
        outputDir = '.'
    } = config;

    console.log(`\n🚀 Sending ${maxRequests} request(s) to ${targetUrl} using ${method} with ${delay}s delay and ${concurrent} concurrent requests...`);

    // Default payloads
    let payloads: Array<{ test_id: string; value: string }> = [
        { test_id: `test_${uuidv4()}`, value: 'sample' },
        // XSS
        { test_id: `<script>alert('XSS')</script>`, value: 'malicious_xss_basic' },
        { test_id: `<img src=x onerror=alert(1)>`, value: 'malicious_xss_img' },
        { test_id: `javascript:alert(1)`, value: 'malicious_xss_js_scheme' },
        // SQL Injection
        { test_id: `1; DROP TABLE users; --`, value: 'sql_injection_drop' },
        { test_id: `' OR '1'='1`, value: 'sql_injection_auth_bypass' },
        { test_id: `admin' --`, value: 'sql_injection_comment' },
        // Path Traversal
        { test_id: `../../etc/passwd`, value: 'path_traversal_unix' },
        { test_id: `..\\..\\windows\\win.ini`, value: 'path_traversal_win' },
        // Command Injection
        { test_id: `; ls -la`, value: 'command_injection_ls' },
        { test_id: `| cat /etc/passwd`, value: 'command_injection_cat' }
    ];

    // Load custom payloads if provided
    if (customPayloadsFile) {
        try {
            const fileContent = await fs.readFile(customPayloadsFile, 'utf-8');
            const customPayloads = JSON.parse(fileContent);
            payloads = payloads.concat(customPayloads);
        } catch (error: any) {
            console.error(`Error loading custom payloads: ${error.message}`);
        }
    }

    // Headers configuration
    const headers: Record<string, string> = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (sessionCookie) headers['Cookie'] = sessionCookie;

    // JWT manipulation
    let manipulatedJwt = 'invalid_jwt_token';
    if (authToken) {
        try {
            const decoded = jwt.decode(authToken) as any || {};
            manipulatedJwt = jwt.sign({ ...decoded, iat: Math.floor(Date.now() / 1000) - 3600 }, 'invalid-secret');
        } catch (error: any) {
            console.warn(`Warning: Could not decode JWT for manipulation: ${error.message}`);
        }
    }

    // Test configurations
    const testConfigs: TestConfig[] = [
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
    const results: TestResult[] = [];
    const startTime = performance.now();

    // Run requests in batches
    for (let i = 1; i <= maxRequests; i += concurrent) {
        const batch: Promise<TestResult>[] = [];
        for (let j = 0; j < concurrent; j++) {
            if (i + j <= maxRequests) {
                const config = testConfigs[Math.floor(Math.random() * testConfigs.length)];
                batch.push(sendRequest(i + j, targetUrl, method, config.headers, config.payload, timeout, config.type));
            }
        }

        const batchResults = await Promise.all(batch);
        batchResults.forEach(result => {
            stats.update(result);
            results.push(result);
            console.log(`\r📊 Sent: ${stats.total}/${maxRequests} | ✅ Success: ${stats.success} | ❌ Error: ${stats.error} | ⏱ Avg Time: ${stats.getAverageTime().toFixed(3)}s`);
        });

        // Only delay if there are more requests to send
        if (i + concurrent <= maxRequests) {
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
    }

    const csvFile = await saveLogs(results, outputDir);
    const jsonFile = await saveJsonReport(results, stats.getSummary(), outputDir);
    const htmlFile = await saveHtmlReport(results, stats.getSummary(), outputDir);
    const elapsedTotal = ((performance.now() - startTime) / 1000).toFixed(2);

    console.log('\n📈 Test Summary:');
    console.log(`⏳ Total time: ${elapsedTotal}s`);
    console.log(`⚡ Avg RPS: ${(maxRequests / parseFloat(elapsedTotal)).toFixed(2)}`);
    console.log(`✅ Successful requests: ${stats.success}`);
    console.log(`❌ Failed requests: ${stats.error}`);
    console.log(`🔒 CSRF test failures: ${stats.csrfFailures} (If low, CSRF protection may be effective)`);
    console.log(`🔓 Session Hijacking test failures: ${stats.sessionHijackFailures} (If low, session validation may be effective)`);
    console.log(`🔐 JWT test failures: ${stats.jwtFailures} (If low, JWT validation may be effective)`);
    console.log(`📁 Logs saved to '${csvFile}', '${jsonFile}', and '${htmlFile}'`);
}