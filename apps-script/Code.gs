const SHEET_ID = '<<PASTE_YOUR_SHEET_ID>>';
const API_KEY_OPTIONAL = 'ArunArun007';

// Set to your local time zone (File → Settings in Sheets should match this too)
const TZ = 'America/Boise';

function doGet(e) { return ContentService.createTextOutput('UP'); }

function doPost(e) {
  try {
    const bodyText = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(bodyText);

    const qp = e && e.parameter ? e.parameter : {};
    const incomingKey = qp.key || qp.apikey || body.api_key || '';
    if (API_KEY_OPTIONAL && incomingKey !== API_KEY_OPTIONAL) {
      return ContentService.createTextOutput('Unauthorized')
        .setMimeType(ContentService.MimeType.TEXT).setResponseCode(401);
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('Jobs') || ss.insertSheet('Jobs');

    const mode = (qp.mode || body.mode || 'create').toString();
    const jobId = (body.job_id || '').toString();

    if (mode === 'updateStatus') {
      if (!jobId) return ContentService.createTextOutput('ERROR: missing job_id');
      const row = findLastRowByJobId_(sheet, jobId);  // job_id in column C (3)
      if (!row) return ContentService.createTextOutput('NOT_FOUND');
      sheet.getRange(row, 12).setValue(body.status || ''); // L: status
      if (body.notes !== undefined) sheet.getRange(row, 13).setValue(body.notes); // M: notes
      return ContentService.createTextOutput('UPDATED');
    }

    // ALWAYS set saved_date & saved_time on the server (reliable & consistent)
    const now = new Date();
    const savedDate = Utilities.formatDate(now, TZ, 'M/d/yyyy');    // e.g. 9/7/2025
    const savedTime = Utilities.formatDate(now, TZ, 'h:mm:ss a');   // e.g. 8:25:11 PM

    // de-dupe last 500 by job_id (column C)
    const last = sheet.getLastRow();
    const startRow = Math.max(2, last - 500);
    if (last >= 2 && jobId) {
      const rng = sheet.getRange(startRow, 3, last - startRow + 1, 1).getValues(); // C = job_id
      if (rng.some(r => (r[0] || '').toString() === jobId)) {
        return ContentService.createTextOutput('DUPLICATE');
      }
    }

    // Append row: A saved_date, B saved_time, C job_id, D job_title, E company, F job_url,
    //             G location, H workplace_type, I date_posted, J application_method,
    //             K salary_text, L status, M notes
    sheet.appendRow([
      savedDate,                          // A
      savedTime,                          // B
      body.job_id || '',                  // C
      body.job_title || '',               // D
      body.company || '',                 // E
      body.job_url || '',                 // F
      body.location || '',                // G
      body.workplace_type || '',          // H
      body.date_posted || '',             // I
      body.application_method || '',      // J
      body.salary_text || '',             // K
      body.status || 'saved',             // L
      body.notes || ''                    // M
    ]);

    // (Optional) Format A & B to show exactly what we want
    const r = sheet.getLastRow();
    sheet.getRange(r, 1).setNumberFormat('M/d/yyyy');
    sheet.getRange(r, 2).setNumberFormat('h:mm:ss AM/PM');

    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('ERROR: ' + err.message);
  }
}

function findLastRowByJobId_(sheet, jobId) {
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const values = sheet.getRange(2, 3, last - 1, 1).getValues(); // C2:C (job_id)
  for (let i = values.length - 1; i >= 0; i--) {
    if ((values[i][0] || '').toString() === jobId) return i + 2;
  }
  return null;
}