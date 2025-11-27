# Secure Load Tester

A command-line tool for performance and security testing of Node.js APIs. It supports load testing, CSRF testing, session hijacking testing, JWT validation testing, XSS, SQL Injection, and other security vulnerabilities.

## Features
- **Performance Testing**: Send concurrent HTTP requests to measure response time and requests per second (RPS).
- **Security Testing**:
  - CSRF (Cross-Site Request Forgery) testing with missing or invalid tokens.
  - Session Hijacking testing with invalid or expired session cookies.
  - JWT (JSON Web Token) testing with invalid, expired, or manipulated tokens.
  - Malicious payload testing (XSS, SQL Injection, Path Traversal).
  - Sensitive data leak detection in responses.
- **Customizable**: Load custom payloads from a JSON file.
- **Reporting**: Save results in CSV, JSON, and HTML formats for analysis.
- **CLI Support**: Easy-to-use command-line interface with configuration file support (including full paths).
- **HTTP Method Support**: Specify HTTP method (e.g., GET, POST); for non-body methods like GET, payloads are sent as query parameters.
- **Timeout Configuration**: Set request timeout.
- **Output Directory**: Specify directory for saving reports.

## Installation
Install the package globally or locally via npm:

```bash
npm install -g secure-load-tester
```

Or locally in your project:

```bash
npm install secure-load-tester
```

## Usage
Run the tool using the `secure-load-tester` command with optional parameters:

```bash
secure-load-tester [options]
```

### Options
- `-u, --url <url>`: Target API URL (default: `http://localhost:5000/api/test`)
- `-r, --requests <number>`: Number of requests (default: 10)
- `-d, --delay <seconds>`: Delay between request batches in seconds (default: 1)
- `-c, --concurrent <number>`: Concurrent requests (default: 5)
- `-t, --token <token>`: Bearer token for JWT authentication (optional)
- `-s, --session <cookie>`: Session cookie (e.g., `sessionId=abc123`, optional)
- `-x, --csrf <token>`: CSRF token (optional)
- `-p, --payloads <file>`: Path to custom payloads JSON file (optional)
- `-f, --config <file>`: Path to configuration JSON file (supports full paths, optional)
- `-m, --method <method>`: HTTP method (e.g., POST, GET, default: POST)
- `--timeout <ms>`: Request timeout in milliseconds (default: 20000)
- `-o, --output <dir>`: Output directory for reports (default: current directory)

### Examples
Run a test with default settings:

```bash
secure-load-tester
```

Run with custom parameters:

```bash
secure-load-tester -u http://localhost:3000/api/test -r 20 -c 10 -t your_jwt_token -s sessionId=abc123 -x your_csrf_token -m GET --timeout 30000 -o ./reports
```

Use a configuration file (supports full paths):

```bash
secure-load-tester -f config.json
```

Or with full path:

```bash
secure-load-tester -f C:\Users\<your-username>\path\config.json
```
> Replace `<your-username>` with the username on your machine.

### Configuration File
Create a `config.json` file to specify default settings:

```json
{
    "targetUrl": "http://localhost:5000/api/test",
    "maxRequests": 10,
    "delay": 1,
    "concurrent": 5,
    "authToken": "",
    "sessionCookie": "",
    "csrfToken": "",
    "customPayloadsFile": "",
    "method": "POST",
    "timeout": 20000,
    "outputDir": "."
}
```

### Custom Payloads
Create a `payloads.json` file to add custom malicious payloads:

```json
[
    { "test_id": "custom_test_1", "value": "custom_malicious_input" },
    { "test_id": "custom_test_2", "value": "another_malicious_input" }
]
```

Then specify the file:

```bash
secure-load-tester -p payloads.json
```

## Output
- Real-time progress in the terminal, showing sent requests, successes, errors, and average response time.
- Detailed test summary with total time, RPS, CSRF failures, session hijacking failures, and JWT failures.
- Results saved in the specified output directory:
  - CSV file (`security_test_log_<timestamp>.csv`)
  - JSON report (`security_test_report_<timestamp>.json`)
  - HTML report (`security_test_report_<timestamp>.html`)

## Analysis
- **CSRF Failures**: Low failures (e.g., 403 status codes) indicate effective CSRF protection.
- **Session Hijacking Failures**: Low failures (e.g., 401/403 status codes) indicate strong session validation.
- **JWT Failures**: Low failures (e.g., 401/403 status codes) indicate robust JWT validation.
- **Sensitive Data Leaks**: Check the `sensitiveLeak` column in the CSV/HTML for potential data exposure.
- **Performance**: High `429` status codes with high concurrency suggest effective rate limiting.

## Changes in v2.0.0
- Added support for custom HTTP methods (e.g., GET, where payloads become query params).
- Added request timeout configuration.
- Added output directory for reports.
- Improved handling of response data types and performance metrics (kept as numbers internally).
- Enhanced JWT manipulation with error handling.
- Optimized file paths for templates and outputs.
- Clarified full path support for config files in documentation.

---