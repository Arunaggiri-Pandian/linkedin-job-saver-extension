// content.js
(function () {
  // -------- helpers --------
  const $ = sel => document.querySelector(sel);
  const text = el => (el ? el.textContent.trim() : '');

  function safeSendMessage(msg) {
    try {
      if (!chrome?.runtime?.id) return;
      chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError);
    } catch (_) {}
  }

  // -------- job id + canonical url --------
  function getJobIdFromUrl(url) {
    try {
      const u = new URL(url);
      const byParam = u.searchParams.get('currentJobId') || u.searchParams.get('trkId') || u.searchParams.get('jk');
      if (byParam) return byParam;
      const m = u.pathname.match(/\/jobs\/view\/(\d+)/);
      if (m) return m[1];
    } catch {}
    return '';
  }
  const canonicalJobUrl = id => (id ? `https://www.linkedin.com/jobs/view/${id}/` : location.href);

  // -------- JSON-LD fallback --------
  function parseJsonLd() {
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const j = JSON.parse(s.textContent);
        const job = Array.isArray(j) ? j.find(x => x && x['@type']==='JobPosting') : (j && j['@type']==='JobPosting' ? j : null);
        if (!job) continue;
        const addr = job.jobLocation?.address || {};
        return {
          job_title: job.title || '',
          company: job.hiringOrganization?.name || '',
          location: [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', ')
        };
      } catch {}
    }
    return {};
  }

  // -------- robust field scraping --------
  const TITLE_Q = [
    'h1[data-test="job-details-title"]',
    'h1.jobs-unified-top-card__job-title',
    'h1.job-details-jobs-unified-top-card__job-title',
    'h1.top-card-layout__title'
  ].join(', ');

  const COMPANY_Q = [
    'a[data-test="job-details-company-name"]',
    'a[data-test="job-details-company"]',
    'a.jobs-unified-top-card__company-name',
    'a.job-details-jobs-unified-top-card__company-name',
    'a.topcard__org-name-link',
    '.top-card-layout__second-subline a'
  ].join(', ');

  const LOCATION_Q = [
    '[data-test="job-details-location"]',
    '[data-test-job-location]',
    '.jobs-unified-top-card__bullet',
    '.top-card-layout__second-subline .t-black--light'
  ].join(', ');

  function normalizeWorkplace() {
    const parts = Array.from(document.querySelectorAll(
      '.jobs-unified-top-card__job-insight, .jobs-unified-top-card__bullet, [data-test-workplace-type], .job-details-jobs-unified-top-card__workplace-type'
    )).map(el => el.textContent.toLowerCase());
    if (parts.some(p => /remote/.test(p))) return 'Remote';
    if (parts.some(p => /hybrid/.test(p))) return 'Hybrid';
    if (parts.some(p => /on[- ]?site/.test(p))) return 'On-site';
    return '';
  }

  // salary: scan only the top card / header areas to avoid random numbers
  function findSalary() {
    const containers = document.querySelectorAll(
      '.jobs-unified-top-card, .job-details-jobs-unified-top-card, .top-card-layout, [data-test="job-details"]'
    );
    const rxRange = /([$€£]\s?\d[\d,]*(?:\.\d+)?\s*(?:-|–|to)\s*[$€£]?\s?\d[\d,]*(?:\.\d+)?\s*(?:\/?(?:hr|hour|year|yr|mo|month|day)|\s+(?:per|a)\s+(?:hour|year|month|day)))/i;
    const rxSingle = /([$€£]\s?\d[\d,]*(?:\.\d+)?\s*(?:\/?(?:hr|hour|year|yr|mo|month|day)|\s+(?:per|a)\s+(?:hour|year|month|day)))/i;

    for (const c of containers) {
      const t = c.innerText || '';
      const m1 = t.match(rxRange);
      if (m1) return m1[1];
      const m2 = t.match(rxSingle);
      if (m2) return m2[1];
    }
    return '';
  }

  function scrape() {
    const data = {};
    data.job_id = getJobIdFromUrl(location.href);
    data.job_url = canonicalJobUrl(data.job_id);

    data.job_title = text($(TITLE_Q));
    data.company   = text($(COMPANY_Q));
    data.location  = text($(LOCATION_Q));
    data.workplace_type = normalizeWorkplace();

    // JSON-LD fallback
    const ld = parseJsonLd();
    if (!data.job_title && ld.job_title) data.job_title = ld.job_title;
    if (!data.company && ld.company)     data.company   = ld.company;
    if (!data.location && ld.location)   data.location  = ld.location;

    // title/company from og:title or document.title ("Title - Company | LinkedIn")
    const t1 = document.querySelector('meta[property="og:title"]')?.content || '';
    const t2 = document.title || '';
    const source = t1 || t2;
    if (source) {
      const cleaned = source.replace(/\s*\|\s*LinkedIn\s*$/i, '');
      const parts = cleaned.split(' - ');
      if (!data.job_title && parts[0]) data.job_title = parts[0].trim();
      if (!data.company && parts[1])   data.company   = parts[1].trim();
    }

    // application method
    const applyBtn = $('button.jobs-apply-button, button.artdeco-button--primary');
    data.application_method = applyBtn && /easy apply/i.test(applyBtn.textContent) ? 'Easy Apply' : 'External';

    // salary + posted date
    data.salary_text = findSalary();
    data.date_posted = (document.querySelector('[data-test-posted-date]')?.getAttribute('datetime') || '').trim();

    data.saved_at = new Date().toISOString();
    // status will be set from the user's choice
    return data;
  }

  // -------- two-choice flow (save only after choice) --------
  function showChoicePopup(onPick) {
    // remove if already showing
    document.getElementById('job-saver-choice')?.remove();

    const box = document.createElement('div');
    box.id = 'job-saver-choice';
    Object.assign(box.style, {
      position: 'fixed', right: '16px', bottom: '68px', zIndex: 1000000,
      background: 'white', color: '#111', borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)', padding: '10px', display: 'flex', gap: '8px',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
    });

    const mk = (label) => {
      const b = document.createElement('button');
      b.textContent = label;
      Object.assign(b.style, {
        padding: '8px 12px', borderRadius: '999px', border: '1px solid #ddd',
        background: '#f7f7f7', cursor: 'pointer', fontWeight: 600
      });
      return b;
    };

    const applyBtn = mk('Apply now');
    const laterBtn = mk('Save for later');

    applyBtn.addEventListener('click', () => { onPick('applied'); box.remove(); });
    laterBtn.addEventListener('click', () => { onPick('Saved to Apply Later'); box.remove(); });

    box.appendChild(applyBtn);
    box.appendChild(laterBtn);
    document.body.appendChild(box);

    // auto-dismiss in case user ignores it
    setTimeout(() => box.remove(), 8000);
  }

  // -------- button lifecycle (SPA-proof) --------
  let clickCooldown = false;

  function createButton() {
    document.getElementById('job-saver-save-btn')?.remove();
    document.getElementById('job-saver-choice')?.remove();

    const btn = document.createElement('button');
    btn.id = 'job-saver-save-btn';
    btn.textContent = 'Save to Sheet';
    Object.assign(btn.style, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: 1000000,
      padding: '10px 14px', borderRadius: '10px', border: 'none',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)', cursor: 'pointer',
      background: '#0a66c2', color: 'white', fontWeight: '600'
    });

    btn.addEventListener('click', () => {
      if (clickCooldown) return;
      clickCooldown = true;

      // do NOT save yet—ask the user first
      showChoicePopup((statusChoice) => {
        const payload = scrape();
        if (!payload.job_id) {
          btn.textContent = 'No job id';
          setTimeout(() => (btn.textContent = 'Save to Sheet'), 900);
          clickCooldown = false;
          return;
        }
        payload.status = statusChoice;     // 'applied' or 'Saved to Apply Later'
        safeSendMessage({ type: 'SAVE_JOB', payload });
        btn.textContent = 'Saved!';
        setTimeout(() => { btn.textContent = 'Save to Sheet'; clickCooldown = false; }, 900);
      });
    });

    document.body.appendChild(btn);
  }

  let ensureTimer;
  function ensureSaveButton() {
    clearTimeout(ensureTimer);
    ensureTimer = setTimeout(() => {
      const jid = getJobIdFromUrl(location.href);
      if (!jid) return;
      if (!document.getElementById('job-saver-save-btn')) createButton();
    }, 120);
  }

  function hookSpaNavigation() {
    const fire = () => window.dispatchEvent(new Event('joblocationchange'));
    ['pushState','replaceState'].forEach(type => {
      const orig = history[type];
      history[type] = function () { const r = orig.apply(this, arguments); fire(); return r; };
    });
    window.addEventListener('popstate', fire);
    window.addEventListener('joblocationchange', () => { createButton(); ensureSaveButton(); });
  }

  const mo = new MutationObserver(() => ensureSaveButton());
  mo.observe(document.documentElement, { childList: true, subtree: true });

  hookSpaNavigation();
  ensureSaveButton();
})();