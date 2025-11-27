import { Stats, TestResult } from '../stats';

describe('Stats', () => {
    let stats: Stats;

    beforeEach(() => {
        stats = new Stats();
    });

    it('should initialize with zero values', () => {
        const summary = stats.getSummary();
        expect(summary.total).toBe(0);
        expect(summary.success).toBe(0);
        expect(summary.error).toBe(0);
        expect(summary.avgTime).toBe('0.000');
    });

    it('should update stats correctly for success', () => {
        const result: TestResult = {
            id: 1,
            method: 'POST',
            status: 200,
            responseTime: 0.1,
            error: null,
            response: 'ok',
            sensitiveLeak: '',
            testType: 'STANDARD'
        };
        stats.update(result);
        const summary = stats.getSummary();
        expect(summary.total).toBe(1);
        expect(summary.success).toBe(1);
        expect(summary.error).toBe(0);
        expect(summary.avgTime).toBe('0.100');
    });

    it('should update stats correctly for error', () => {
        const result: TestResult = {
            id: 1,
            method: 'POST',
            status: 500,
            responseTime: 0.1,
            error: 'Server Error',
            response: '',
            sensitiveLeak: '',
            testType: 'STANDARD'
        };
        stats.update(result);
        const summary = stats.getSummary();
        expect(summary.total).toBe(1);
        expect(summary.success).toBe(0);
        expect(summary.error).toBe(1);
    });

    it('should track specific failures', () => {
        stats.update({
            id: 1,
            method: 'POST',
            status: 403,
            responseTime: 0.1,
            error: 'Forbidden',
            response: '',
            sensitiveLeak: '',
            testType: 'CSRF'
        });
        expect(stats.csrfFailures).toBe(1);

        stats.update({
            id: 2,
            method: 'POST',
            status: 401,
            responseTime: 0.1,
            error: 'Unauthorized',
            response: '',
            sensitiveLeak: '',
            testType: 'SESSION_HIJACK'
        });
        expect(stats.sessionHijackFailures).toBe(1);

        stats.update({
            id: 3,
            method: 'POST',
            status: 401,
            responseTime: 0.1,
            error: 'Unauthorized',
            response: '',
            sensitiveLeak: '',
            testType: 'JWT'
        });
        expect(stats.jwtFailures).toBe(1);
    });
});
