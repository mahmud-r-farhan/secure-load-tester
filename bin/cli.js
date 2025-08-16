#!/usr/bin/env node

const { program } = require('commander');
const { runTests } = require('../src/index');
const fs = require('fs').promises;

program
    .version('1.1.0')
    .description('Secure Load Tester: A CLI tool for performance and security testing of Node.js APIs')
    .option('-u, --url <url>', 'Target API URL', 'http://localhost:5000/api/test')
    .option('-r, --requests <number>', 'Number of requests', '10')
    .option('-d, --delay <seconds>', 'Delay between request batches', '1')
    .option('-c, --concurrent <number>', 'Concurrent requests', '5')
    .option('-t, --token <token>', 'Bearer token for JWT', '')
    .option('-s, --session <cookie>', 'Session cookie (e.g., sessionId=abc123)', '')
    .option('-x, --csrf <token>', 'CSRF token', '')
    .option('-p, --payloads <file>', 'Custom payloads JSON file', '')
    .option('-f, --config <file>', 'Configuration JSON file', '')
    .parse(process.argv);

const options = program.opts();

async function main() {
    let config = {
        targetUrl: options.url,
        maxRequests: parseInt(options.requests, 10),
        delay: parseFloat(options.delay),
        concurrent: parseInt(options.concurrent, 10),
        authToken: options.token,
        sessionCookie: options.session,
        csrfToken: options.csrf,
        customPayloadsFile: options.payloads
    };

    if (options.config) {
        try {
            const configFile = JSON.parse(await fs.readFile(options.config));
            config = { ...config, ...configFile };
        } catch (error) {
            console.error(`Error loading config file: ${error.message}`);
            process.exit(1);
        }
    }

    try {
        await runTests(config);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();