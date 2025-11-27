import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { performance } from 'perf_hooks';
import { TestResult } from './stats';

export async function sendRequest(
    id: number,
    targetUrl: string,
    method: string = 'POST',
    headers: Record<string, string> = {},
    body: any = {},
    timeout: number = 20000,
    testType: string = 'STANDARD'
): Promise<TestResult> {
    const start = performance.now();
    try {
        const config: AxiosRequestConfig = {
            method,
            url: targetUrl,
            headers: {
                'User-Agent': 'SecureLoadTester/2.0',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            timeout,
            withCredentials: true
        };

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
            config.data = body;
        } else {
            config.params = body;
        }

        const response: AxiosResponse = await axios(config);
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
    } catch (error: any) {
        const duration = (performance.now() - start) / 1000;
        return {
            id,
            method,
            status: error.response ? error.response.status : 'ERROR',
            responseTime: duration,
            error: error.message || 'Unknown Error',
            response: '',
            sensitiveLeak: '',
            testType
        };
    }
}