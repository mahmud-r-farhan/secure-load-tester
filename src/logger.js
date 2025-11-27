const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs').promises;
const ejs = require('ejs');
const path = require('path');

async function saveLogs(results, outputDir = '.') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const filePath = path.join(outputDir, `security_test_log_${timestamp}.csv`);
    const csvWriter = createCsvWriter({
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

async function saveJsonReport(results, summary, outputDir = '.') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const report = { summary, results: results.map(result => ({ ...result, responseTime: result.responseTime.toFixed(3) })) };
    const filePath = path.join(outputDir, `security_test_report_${timestamp}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    return filePath;
}

async function saveHtmlReport(results, summary, outputDir = '.') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const templatePath = path.join(__dirname, 'report-template.ejs');
    const template = await fs.readFile(templatePath, 'utf-8');
    const html = await ejs.render(template, { results, summary });
    const filePath = path.join(outputDir, `security_test_report_${timestamp}.html`);
    await fs.writeFile(filePath, html);
    return filePath;
}

module.exports = { saveLogs, saveJsonReport, saveHtmlReport };