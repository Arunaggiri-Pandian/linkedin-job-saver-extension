# LinkedIn Job Saver

## Why was this created?

The job hunt can be a chaotic process. You apply to countless jobs, and then, weeks later, you get a call for an interview. The problem? You have no idea what the job is. You scramble to find the original job posting, but it's often too late. This extension was built to solve that problem.

It's also for those moments when you're scrolling through LinkedIn during a class, on your commute, or just browsing, and you come across an interesting role. You click "Save for later," but it gets lost in the abyss of your saved posts. By saving the job to a Google Sheet, you create a personal, organized, and persistent record of your job search, ensuring you never miss an opportunity.

This project is a Chrome extension that allows you to save job postings from LinkedIn to a Google Sheet.

## Features

- **One-click job saving:** Save job details from LinkedIn to a Google Sheet with a single click.
- **Automatic data scraping:** The extension automatically scrapes job title, company, location, salary, and other relevant details.
- **Application status tracking:** Choose between "Apply now" and "Save for later" to track your application status.
- **Duplicate detection:** The Google Apps Script checks for duplicate job IDs to avoid duplicate entries.
- **Easy setup:** The project includes a simple options page to configure the Google Apps Script webhook URL and an optional API key.

## How it works

The project consists of three main parts:

1.  **Chrome Extension (`job-saver-extension`):**
    -   The `content.js` script injects a "Save to Sheet" button onto LinkedIn job pages.
    -   When the button is clicked, the script scrapes the job details from the page.
    -   A popup asks the user to choose between "Apply now" and "Save for later".
    -   The `service_worker.js` sends the job data to the Google Apps Script webhook.
    -   The `options.html` and `options.js` files provide a settings page to configure the webhook URL and API key.

2.  **Google Apps Script (`apps-script`):**
    -   The `Code.gs` script receives the job data from the Chrome extension.
    -   It checks for an optional API key for authorization.
    -   It checks for duplicate job IDs to prevent duplicate entries.
    -   It appends the job data as a new row to a Google Sheet.

3.  **Google Sheet (`sheet`):**
    -   The `JobsHeaders.csv` file contains the headers for the Google Sheet.

## Setup

1.  **Create a Google Sheet:**
    -   Create a new Google Sheet.
    -   Copy the headers from `sheet/JobsHeaders.csv` and paste them into the first row of the sheet.
    -   Get the Sheet ID from the URL (e.g., `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`).

2.  **Create a Google Apps Script:**
    -   Open the Google Sheet and go to "Extensions" > "Apps Script".
    -   Copy the code from `apps-script/Code.gs` and paste it into the script editor.
    -   Replace `PUT_YOUR_SHEET_ID_HERE` with your Google Sheet ID.
    -   (Optional) Set an `API_KEY_OPTIONAL` in the script.
    -   Deploy the script as a web app:
        -   Click "Deploy" > "New deployment".
        -   Select "Web app" as the deployment type.
        -   In the "Who has access" dropdown, select "Anyone".
        -   Click "Deploy".
        -   Copy the web app URL.

3.  **Configure the Chrome Extension:**
    -   Open Chrome and go to `chrome://extensions`.
    -   Enable "Developer mode".
    -   Click "Load unpacked" and select the `job-saver-extension` folder.
    -   Right-click the extension icon and select "Options".
    -   Paste the web app URL into the "Apps Script Web App URL" field.
    -   (Optional) If you set an API key in the Apps Script, enter it in the "Optional API Key" field.
    -   Click "Save".

## Usage

1.  Navigate to a job posting on LinkedIn.
2.  Click the "Save to Sheet" button.
3.  Select "Apply now" or "Save for later".
4.  The job details will be saved to your Google Sheet.