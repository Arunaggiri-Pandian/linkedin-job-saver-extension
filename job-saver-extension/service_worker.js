// service_worker.js
chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  if (msg?.type === 'SAVE_JOB' || msg?.type === 'UPDATE_STATUS') {
    chrome.storage.sync.get(['webhookUrl', 'apiKey'], async ({ webhookUrl, apiKey }) => {
      if (!webhookUrl) { console.warn('Set webhook URL in options.'); return; }
      try {
        const url = apiKey ? `${webhookUrl}?key=${encodeURIComponent(apiKey)}` : webhookUrl;
        const body = (msg.type === 'SAVE_JOB')
          ? { ...(msg.payload || {}), api_key: apiKey }
          : { mode: 'updateStatus', job_id: msg.payload.job_id, status: msg.payload.status, api_key: apiKey };

        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(body),
          redirect: 'follow'
        });

        console.log(`${msg.type} sent for job_id:`, msg?.payload?.job_id);
      } catch (e) {
        console.error('Webhook error', e);
      }
    });
  }
});