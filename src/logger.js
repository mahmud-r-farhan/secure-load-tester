const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs').promises;
const ejs = require('ejs');

async function saveLogs(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const csvWriter = createCsvWriter({
        path: `security_test_log_${timestamp}.csv`,
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

    await csvWriter.writeRecords(results);
    return `security_test_log_${timestamp}.csv`;
}

async function saveJsonReport(results, summary) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const report = { summary, results };
    const fileName = `security_test_report_${timestamp}.json`;
    await fs.writeFile(fileName, JSON.stringify(report, null, 2));
    return fileName;
}

async function saveHtmlReport(results, summary) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const template = await fs.readFile('src/report-template.ejs', 'utf-8');
    const html = await ejs.render(template, { results, summary });
    const fileName = `security_test_report_${timestamp}.html`;
    await fs.writeFile(fileName, html);
    return fileName;
}

module.exports = { saveLogs, saveJsonReport, saveHtmlReport };