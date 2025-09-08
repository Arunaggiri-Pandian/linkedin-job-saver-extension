
Job Saver Starter — 2025-09-07

This folder contains:
- job-saver-extension/  → Chrome/Edge extension (load as "unpacked")
- apps-script/Code.gs   → Google Apps Script code to paste
- sheet/JobsHeaders.csv → CSV with the header row for your Google Sheet

Quick Start:
1) Create a Google Sheet, name it e.g. "Job Tracker". Add a tab named "Jobs".
   Import sheet/JobsHeaders.csv or paste the header row manually.

2) Open Extensions → Apps Script in that Sheet. Paste the contents of apps-script/Code.gs.
   - Replace SHEET_ID with your Sheet's ID (the long string in the URL).
   - Optionally set API_KEY_OPTIONAL to a random secret, e.g. 'sk_f2b234787b35ede1'.
   - Deploy → New deployment → Web app:
       * Execute as: Me
       * Who has access: Anyone with the link (or Anyone)
     Copy the Web App URL.

3) Load the extension in Chrome:
   - chrome://extensions → Developer mode ON → Load unpacked → select job-saver-extension
   - Click "Details" → "Extension options" (or right-click the extension icon → Options)
   - Paste the Web App URL and (if you set it) the same API key.

4) Go to a LinkedIn job page and click "Save to Sheet" (blue floating button).
   Check your Google Sheet for a new row.

Troubleshooting:
- If the Sheet didn't update: open chrome://extensions → "Service worker" console for this extension and look for errors.
- If Apps Script says Unauthorized (401): your API key didn't match. Use the same key in both places.
- In Apps Script, ensure "Execute as: Me" or you'll get permission errors writing to your Sheet.
- Make sure your tab is named exactly "Jobs".
