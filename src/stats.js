class Stats {
    constructor() {
        this.total = 0;
        this.success = 0;
        this.error = 0;
        this.totalTime = 0;
        this.csrfFailures = 0;
        this.sessionHijackFailures = 0;
        this.jwtFailures = 0;
    }

    update(result) {
        this.total += 1;
        if (result.status !== 'ERROR' && result.status >= 200 && result.status < 400) {
            this.success += 1;
            this.totalTime += result.responseTime;
        } else {
            this.error += 1;
            if (result.testType === 'CSRF') this.csrfFailures += 1;
            if (result.testType === 'SESSION_HIJACK') this.sessionHijackFailures += 1;
            if (result.testType === 'JWT') this.jwtFailures += 1;
        }
    }

    getAverageTime() {
        return this.success > 0 ? (this.totalTime / this.success).toFixed(3) : 0;
    }

    getSummary() {
        return {
            total: this.total,
            success: this.success,
            error: this.error,
            avgTime: this.getAverageTime(),
            csrfFailures: this.csrfFailures,
            sessionHijackFailures: this.sessionHijackFailures,
            jwtFailures: this.jwtFailures
        };
    }
}

module.exports = Stats;