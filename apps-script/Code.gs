const SHEET_ID = 'PUT_YOUR_SHEET_ID_HERE';
const API_KEY_OPTIONAL = ''; // e.g. 'sk_abc123' and set same in extension Options; or leave empty to disable

function doPost(e) {
  try {
    const headers = e?.parameter || {};
    const apiKeyHeader = (e?.headers && (e.headers['x-api-key'] || e.headers['X-API-Key'])) || headers.key || headers.apikey;
    if (API_KEY_OPTIONAL && apiKeyHeader !== API_KEY_OPTIONAL) {
      return ContentService.createTextOutput('Unauthorized').setMimeType(ContentService.MimeType.TEXT).setResponseCode(401);
    }

    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Jobs') || ss.insertSheet('Jobs');

    const id = (body.job_id || '').toString();

    const last = sheet.getLastRow();
    const startRow = Math.max(2, last - 500);
    if (last >= 2) {
      const rng = sheet.getRange(startRow, 2, last - startRow + 1, 1).getValues(); // col B = job_id
      if (id && rng.some(r => r[0] && r[0].toString() === id)) {
        return ContentService.createTextOutput('DUPLICATE');
      }
    }

    sheet.appendRow([
      new Date(),
      body.job_id || '',
      body.job_title || '',
      body.company || '',
      body.job_url || '',
      body.location || '',
      body.workplace_type || '',
      body.date_posted || '',
      body.application_method || '',
      body.salary_text || '',
      body.status || 'saved',
      body.notes || ''
    ]);

    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('ERROR: ' + err.message);
  }
}