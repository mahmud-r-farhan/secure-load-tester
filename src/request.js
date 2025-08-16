const axios = require('axios');
const { performance } = require('perf_hooks');

async function sendRequest(id, targetUrl, method = 'POST', headers = {}, body = {}, timeout = 20000, testType = 'STANDARD') {
    const start = performance.now();
    try {
        const config = {
            method,
            url: targetUrl,
            headers: {
                'User-Agent': 'SecureLoadTester/1.0',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            data: body,
            timeout,
            withCredentials: true
        };

        const response = await axios(config);
        const duration = Number((performance.now() - start) / 1000).toFixed(3);

        const responseText = response.data ? JSON.stringify(response.data).slice(0, 100) : '';
        const sensitiveLeak = /password|traceback|secret|key|sessionid|token/i.test(responseText) ? 'Possible sensitive data leak' : '';

        return {
            id,
            method,
            status: response.status,
            responseTime: duration,
            error: null,
            response: responseText,
            sensitiveLeak,
            testType
        };
    } catch (error) {
        const duration = Number((performance.now() - start) / 1000).toFixed(3);
        return {
            id,
            method,
            status: error.response ? error.response.status : 'ERROR',
            responseTime: duration,
            error: error.message,
            response: '',
            sensitiveLeak: '',
            testType
        };
    }
}

module.exports = { sendRequest };