import { createObjectCsvWriter } from 'csv-writer';
import { promises as fs } from 'fs';
import ejs from 'ejs';
import path from 'path';
import { TestResult, StatsSummary } from './stats';

const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Secure Load Tester Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .success { color: green; }
        .error { color: red; }
        .summary { margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Secure Load Tester Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Requests:</strong> <%= summary.total %></p>
        <p><strong>Successful Requests:</strong> <span class="success"><%= summary.success %></span></p>
        <p><strong>Failed Requests:</strong> <span class="error"><%= summary.error %></span></p>
        <p><strong>Average Response Time:</strong> <%= summary.avgTime %>s</p>
        <p><strong>CSRF Failures:</strong> <%= summary.csrfFailures %> (Low failures indicate effective CSRF protection)</p>
        <p><strong>Session Hijacking Failures:</strong> <%= summary.sessionHijackFailures %> (Low failures indicate strong session validation)</p>
        <p><strong>JWT Failures:</strong> <%= summary.jwtFailures %> (Low failures indicate robust JWT validation)</p>
    </div>
    <h2>Request Details</h2>
    <table>
        <tr>
            <th>Request ID</th>
            <th>Method</th>
            <th>Status Code</th>
            <th>Response Time (s)</th>
            <th>Error</th>
            <th>Response Snippet</th>
            <th>Sensitive Data Leak</th>
            <th>Test Type</th>
        </tr>
        <% results.forEach(result => { %>
            <tr>
                <td><%= result.id %></td>
                <td><%= result.method %></td>
                <td class="<%= typeof result.status === 'number' && result.status >= 200 && result.status < 400 ? 'success' : 'error' %>"><%= result.status %></td>
                <td><%= result.responseTime.toFixed(3) %></td>
                <td><%= result.error || '-' %></td>
                <td><%= result.response || '-' %></td>
                <td><%= result.sensitiveLeak || '-' %></td>
                <td><%= result.testType %></td>
            </tr>
        <% }) %>
    </table>
</body>
</html>`;

export async function saveLogs(results: TestResult[], outputDir: string = '.'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const filePath = path.join(outputDir, `security_test_log_${timestamp}.csv`);
    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: 'id', title: 'Request ID' },
            { id: 'method', title: 'Method' },
            { id: 'status', title: 'Status Code' },
            { id: 'responseTime', title: 'Response Time (s)' },
            { id: 'error', title: 'Error' },
            { id: 'response', title: 'Response Snippet' },
            { id: 'sensitiveLeak', title: 'Sensitive Data Leak' },
            { id: 'testType', title: 'Test Type' }
        ]
    });

    await csvWriter.writeRecords(results.map(result => ({
        ...result,
        responseTime: result.responseTime.toFixed(3)
    })));
    return filePath;
}

export async function saveJsonReport(results: TestResult[], summary: StatsSummary, outputDir: string = '.'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const report = { summary, results: results.map(result => ({ ...result, responseTime: result.responseTime.toFixed(3) })) };
    const filePath = path.join(outputDir, `security_test_report_${timestamp}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    return filePath;
}

export async function saveHtmlReport(results: TestResult[], summary: StatsSummary, outputDir: string = '.'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const html = ejs.render(template, { results, summary });
    const filePath = path.join(outputDir, `security_test_report_${timestamp}.html`);
    await fs.writeFile(filePath, html);
    return filePath;
}