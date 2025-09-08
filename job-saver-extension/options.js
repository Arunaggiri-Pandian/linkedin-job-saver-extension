const webhookEl = document.getElementById('webhookUrl');
const apiKeyEl = document.getElementById('apiKey');
const saveBtn = document.getElementById('save');

chrome.storage.sync.get(['webhookUrl', 'apiKey'], ({webhookUrl, apiKey}) => {
  if (webhookUrl) webhookEl.value = webhookUrl;
  if (apiKey) apiKeyEl.value = apiKey;
});

saveBtn.addEventListener('click', () => {
  chrome.storage.sync.set({ webhookUrl: webhookEl.value.trim(), apiKey: apiKeyEl.value.trim() });
  saveBtn.textContent = 'Saved!';
  setTimeout(() => saveBtn.textContent = 'Save', 1000);
});