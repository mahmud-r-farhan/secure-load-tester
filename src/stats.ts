export interface TestResult {
    id: number;
    method: string;
    status: number | 'ERROR';
    responseTime: number;
    error: string | null;
    response: string;
    sensitiveLeak: string;
    testType: string;
}

export interface StatsSummary {
    total: number;
    success: number;
    error: number;
    avgTime: string;
    csrfFailures: number;
    sessionHijackFailures: number;
    jwtFailures: number;
}

export class Stats {
    total: number;
    success: number;
    error: number;
    totalTime: number;
    csrfFailures: number;
    sessionHijackFailures: number;
    jwtFailures: number;

    constructor() {
        this.total = 0;
        this.success = 0;
        this.error = 0;
        this.totalTime = 0;
        this.csrfFailures = 0;
        this.sessionHijackFailures = 0;
        this.jwtFailures = 0;
    }

    update(result: TestResult): void {
        this.total += 1;
        if (result.status !== 'ERROR' && typeof result.status === 'number' && result.status >= 200 && result.status < 400) {
            this.success += 1;
            this.totalTime += result.responseTime;
        } else {
            this.error += 1;
            if (result.testType === 'CSRF') this.csrfFailures += 1;
            if (result.testType === 'SESSION_HIJACK') this.sessionHijackFailures += 1;
            if (result.testType === 'JWT') this.jwtFailures += 1;
        }
    }

    getAverageTime(): number {
        return this.success > 0 ? this.totalTime / this.success : 0;
    }

    getSummary(): StatsSummary {
        return {
            total: this.total,
            success: this.success,
            error: this.error,
            avgTime: this.getAverageTime().toFixed(3),
            csrfFailures: this.csrfFailures,
            sessionHijackFailures: this.sessionHijackFailures,
            jwtFailures: this.jwtFailures
        };
    }
}