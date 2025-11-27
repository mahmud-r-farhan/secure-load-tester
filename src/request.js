const axios = require('axios');
const { performance } = require('perf_hooks');

async function sendRequest(id, targetUrl, method = 'POST', headers = {}, body = {}, timeout = 20000, testType = 'STANDARD') {
    const start = performance.now();
    try {
        const config = {
            method,
            url: targetUrl,
            headers: {
                'User-Agent': 'SecureLoadTester/1.2',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            timeout,
            withCredentials: true
        };

        if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.data = body;
        } else {
            config.params = body;
        }

        const response = await axios(config);
        const duration = (performance.now() - start) / 1000;

        let responseText = '';
        if (response.data) {
            if (typeof response.data === 'string') {
                responseText = response.data.slice(0, 100);
            } else {
                try {
                    responseText = JSON.stringify(response.data).slice(0, 100);
                } catch (e) {
                    responseText = '[Non-stringifiable response]';
                }
            }
        }

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
        const duration = (performance.now() - start) / 1000;
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