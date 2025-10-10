/* ---------- Collapsible helpers ---------- */
function wireCollapse(toggleId, bodyId) {
    const t = document.getElementById(toggleId);
    const b = document.getElementById(bodyId);
    if (!t || !b) return;
    b.classList.add('flu-hidden'); // start hidden
    t.addEventListener('click', () => {
        b.classList.toggle('flu-hidden');
        t.textContent = b.classList.contains('flu-hidden') ? '[show]' : '[hide]';
    });
}

wireCollapse('c3-toggle', 'c3-body');
wireCollapse('c3-toggle', 'c3-body2');
wireCollapse('wca-toggle', 'wca-body');
wireCollapse('ccb-toggle', 'ccb-body');
wireCollapse('ados-toggle', 'ados-body');

/* ---------- Extra panels toggle ---------- */
const extraToggle = document.getElementById('link-extra');
const extraPanels = document.querySelectorAll('.links-panel, .flu-panel, .info-panel, .c3-panel');
if (extraToggle) {
    extraToggle.addEventListener('click', (e) => {
        e.preventDefault();
        extraPanels.forEach(el => el.classList.toggle('hidden'));
    });
}

/* ---------- Lab Results panel ---------- */
const labTrigger = document.getElementById('lab-trigger');
const labPanel = document.getElementById('lab-panel');
const labLog = document.getElementById('lab-log');
const labCopy = document.getElementById('lab-copy');

if (labTrigger && labPanel) {
    labTrigger.addEventListener('click', () => {
        const isOpen = labPanel.classList.contains('show');
        if (isOpen) {
            labPanel.classList.remove('show');
            labPanel.setAttribute('aria-hidden', 'true');
        } else {
            openExclusive(labPanel);
        }
    });
}

/* Copy log */
/* Copy log (and clear table + inputs) */
labCopy?.addEventListener('click', () => {
    const text = labLog?.value ?? '';
    if (!text.trim()) return;

    const done = () => {
        showSuccessBar();
        if (labLog) labLog.value = '';
        if (labTbody) labTbody.innerHTML = '';   // clear results table
        if (labHospital) labHospital.value = '';
        if (labPhone) labPhone.value = '';
        if (labBleep) labBleep.value = '';
        if (labExt) labExt.value = '';
        if (labResult) labResult.value = '';
        if (labValue) labValue.value = '';
        updateLabAddState();
        updateLabGenerateState();
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else {
        fallbackCopy(text); done();
    }
});

/* ---------- Flu table last row toggle ---------- */
const fluToggle = document.getElementById('flu-toggle');
const fluRow = document.querySelector('.flu-table tr:last-child');
if (fluRow) fluRow.classList.add('flu-hidden'); // start hidden
if (fluToggle && fluRow) {
    fluToggle.addEventListener('click', () => {
        fluRow.classList.toggle('flu-hidden');
        fluToggle.textContent = fluRow.classList.contains('flu-hidden') ? '[show]' : '[hide]';
    });
}

/* ---------- LanguageLine panel ---------- */
const llTrigger = document.getElementById('ll-trigger');
const llPanel = document.getElementById('ll-panel');
const llLog = document.getElementById('ll-log');
const llCopy = document.getElementById('ll-copy');

/* Toggle panel */
if (llTrigger && llPanel) {
    llTrigger.addEventListener('click', () => {
        const isOpen = llPanel.classList.contains('show');
        if (isOpen) {
            llPanel.classList.remove('show');
            llPanel.setAttribute('aria-hidden', 'true');
        } else {
            openExclusive(llPanel);
        }
    });
}

/* Copy (copy -> toast -> clear) */
llCopy?.addEventListener('click', () => {
    const text = llLog?.value ?? '';
    if (!text.trim()) return;

    const done = () => {
        showSuccessBar();
        if (llLog) llLog.value = '';
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else {
        fallbackCopy(text); done();
    }
});

/* ---------- LanguageLine inputs ---------- */
const llId = document.getElementById('ll-id');
const llLang = document.getElementById('ll-lang');
const llGenerate = document.getElementById('ll-generate');

/* Enable Generate if both boxes filled */
function updateLlGenerateState() {
    const hasId = (llId?.value.trim().length ?? 0) > 0;
    const hasLang = (llLang?.value.trim().length ?? 0) > 0;
    if (llGenerate) llGenerate.disabled = !(hasId && hasLang);
}
[llId, llLang].forEach(el => el?.addEventListener('input', updateLlGenerateState));

/* Generate log */
llGenerate?.addEventListener('click', () => {
    const id = llId.value.trim();
    const lang = llLang.value.trim();
    if (!id || !lang) return;

    const output = `LANGUAGELINE INTERPRETER USED.\nLANGUAGE USED: ${lang}\nINTERPRETER ID: ${id}`.toUpperCase();
    if (llLog) {
        llLog.value = output;
        llLog.scrollTop = llLog.scrollHeight;
    }
});

/* Copy (copy -> toast -> clear + wipe inputs) */
llCopy?.addEventListener('click', () => {
    const text = llLog?.value ?? '';
    if (!text.trim()) return;

    const done = () => {
        showSuccessBar();
        if (llLog) llLog.value = '';
        if (llId) llId.value = '';
        if (llLang) llLang.value = '';
        updateLlGenerateState();
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else {
        fallbackCopy(text); done();
    }
});

/* ---------- Quick Scripts: click-to-copy with flash (generic) ---------- */
document.querySelectorAll('.script-chip:not(.script-chip-special)').forEach(chip => {
    chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-copy') || chip.innerText;
        const after = () => {
            chip.classList.remove('flash');
            void chip.offsetWidth;
            chip.classList.add('flash');
        };
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(after).catch(() => { fallbackCopy(text); after(); });
        } else {
            fallbackCopy(text); after();
        }
    });
});

/* ---------- Special: CHASING 111 asks for DAS ref, then copies ---------- */
const chipChase111 = document.getElementById('chip-chase-111');
chipChase111?.addEventListener('click', () => {
    const ref = window.prompt('Please enter the Digital Admin Slip reference number.');
    if (!ref) return;

    const text = `NO NEW OR WORSENING SYMPTOMS. WCAG.
PT CALLING TO CHASE CALLBACK, DAS RAISED (${ref.trim()})`.toUpperCase();

    const after = () => {
        chipChase111.classList.remove('flash');
        void chipChase111.offsetWidth;
        chipChase111.classList.add('flash');
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(after).catch(() => { fallbackCopy(text); after(); });
    } else {
        fallbackCopy(text); after();
    }
});

/* ---------- Special: CALL ENDED, DISCONNECTED ---------- */
const chipCallDisc = document.getElementById('chip-call-ended-disc');
chipCallDisc?.addEventListener('click', () => {
    const voicemail = window.confirm('Were you able to leave a voicemail containing worsening care advice?\n\nOK: Yes\nCancel: No');
    const vmText = voicemail ? 'WORSENING VOICEMAIL LEFT' : 'COULD NOT LEAVE WORSENING VOICEMAIL.';

    const text = `CALL ENDED, CALLER DISCONNECTED.
CALLED BACK PATIENT (3X), NO RESPONSE.\n${vmText}`.toUpperCase();

    const after = () => {
        chipCallDisc.classList.remove('flash');
        void chipCallDisc.offsetWidth;
        chipCallDisc.classList.add('flash');
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(after).catch(() => { fallbackCopy(text); after(); });
    } else {
        fallbackCopy(text); after();
    }
});

/* ---------- Special: CALL ENDED, SILENT ---------- */
const chipCallSilent = document.getElementById('chip-call-ended-silent');
chipCallSilent?.addEventListener('click', () => {
    const voicemail = window.confirm('Were you able to leave a voicemail containing worsening care advice?\n\nOK: Yes\nCancel: No');
    const vmText = voicemail ? 'WORSENING VOICEMAIL LEFT' : 'COULD NOT LEAVE WORSENING VOICEMAIL.';

    const text = `CALL ENDED, LINE SILENT/UNRESPONSIVE.
CALLED BACK PATIENT (3X), NO RESPONSE.\n${vmText}`.toUpperCase();

    const after = () => {
        chipCallSilent.classList.remove('flash');
        void chipCallSilent.offsetWidth;
        chipCallSilent.classList.add('flash');
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(after).catch(() => { fallbackCopy(text); after(); });
    } else {
        fallbackCopy(text); after();
    }
});


/* ---------- Special: DATIX asks for ref, then copies ---------- */
const chipDatix = document.getElementById('chip-datix');
chipDatix?.addEventListener('click', () => {
    const ref = window.prompt('Please enter the DATIX reference number.');
    if (!ref) return;

    const text = `DATIX RAISED (${ref.trim()})`.toUpperCase();

    const after = () => {
        chipDatix.classList.remove('flash');
        void chipDatix.offsetWidth;
        chipDatix.classList.add('flash');
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(after).catch(() => { fallbackCopy(text); after(); });
    } else {
        fallbackCopy(text); after();
    }
});

/* ---------- Special: SAFEGUARDING asks for ref, then copies ---------- */
const chipSafeguarding = document.getElementById('chip-safeguarding');
chipSafeguarding?.addEventListener('click', () => {
    const ref = window.prompt('Please enter the Safeguarding reference number.');
    if (!ref) return;

    const text = `SAFEGUARDING RAISED (${ref.trim()})`.toUpperCase();

    const after = () => {
        chipSafeguarding.classList.remove('flash');
        void chipSafeguarding.offsetWidth;
        chipSafeguarding.classList.add('flash');
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(after).catch(() => { fallbackCopy(text); after(); });
    } else {
        fallbackCopy(text); after();
    }
});

/* Init */
updateLlGenerateState();

/* ---------- Lab Results: fields ---------- */
const labHospital = document.getElementById('lab-hospital');
const labPhone = document.getElementById('lab-phone');
const labBleep = document.getElementById('lab-bleep');
const labExt = document.getElementById('lab-ext');

const labResult = document.getElementById('lab-result');
const labValue = document.getElementById('lab-value');
const labAdd = document.getElementById('lab-add');

const labTable = document.getElementById('lab-table');
const labTbody = document.getElementById('lab-tbody');
const labGenerate = document.getElementById('lab-generate');

/* Enable Add when both result + value present */
function updateLabAddState() {
    const ok = (labResult?.value.trim().length ?? 0) > 0 && (labValue?.value.trim().length ?? 0) > 0;
    if (labAdd) labAdd.disabled = !ok;
}
labResult?.addEventListener('input', updateLabAddState);
labValue?.addEventListener('input', updateLabAddState);

/* Add a result row */
labAdd?.addEventListener('click', () => {
    const res = labResult.value.trim();
    const val = labValue.value.trim();
    if (!res || !val) return;

    const tr = document.createElement('tr');

    const tdRes = document.createElement('td');
    tdRes.textContent = res;
    tdRes.style.padding = '8px';

    const tdVal = document.createElement('td');
    tdVal.textContent = val;
    tdVal.style.padding = '8px';

    const tdAct = document.createElement('td');
    tdAct.style.textAlign = 'right';
    tdAct.style.padding = '8px';

    const btnX = document.createElement('button');
    btnX.type = 'button';
    btnX.textContent = '✕';
    btnX.setAttribute('aria-label', `Remove ${res}`);
    btnX.style.minWidth = '32px';
    btnX.style.height = '28px';
    btnX.className = 'pill';
    btnX.addEventListener('click', () => {
        tr.remove();
        updateLabGenerateState();
    });

    tdAct.appendChild(btnX);
    tr.appendChild(tdRes);
    tr.appendChild(tdVal);
    tr.appendChild(tdAct);
    labTbody.appendChild(tr);

    labResult.value = '';
    labValue.value = '';
    updateLabAddState();
    updateLabGenerateState();
});

/* Enable Generate when: hospital + phone present AND at least one row */
function updateLabGenerateState() {
    const hasRows = !!labTbody && labTbody.children.length > 0;
    const hasHospital = (labHospital?.value.trim().length ?? 0) > 0;
    const hasPhone = (labPhone?.value.trim().length ?? 0) > 0;
    if (labGenerate) labGenerate.disabled = !(hasRows && hasHospital && hasPhone);
}
[labHospital, labPhone, labBleep, labExt].forEach(el => el?.addEventListener('input', updateLabGenerateState));

/* Generate log line:
   <HOSPITAL> - #<PHONE>[, EXT: <EXT>][, BLEEP: <BLEEP>] - RESULT: VALUE, RESULT: VALUE
*/
labGenerate?.addEventListener('click', () => {
    const hospital = labHospital?.value.trim();
    const phone = labPhone?.value.trim();
    const ext = labExt?.value.trim();
    const bleep = labBleep?.value.trim();

    if (!hospital || !phone) return;

    const pairs = [...(labTbody?.children || [])].map(tr => {
        const tds = tr.querySelectorAll('td');
        const r = tds[0]?.textContent?.trim() || '';
        const v = tds[1]?.textContent?.trim() || '';
        return r && v ? `${r.toUpperCase()}: ${v}` : null;
    }).filter(Boolean);

    if (pairs.length === 0) return;

    let header = `${hospital.toUpperCase()} - #${phone}`;
    if (ext) header += `, EXT: ${ext}`;
    if (bleep) header += `, BLEEP: ${bleep}`;

    const output = `${header} - ${pairs.join(', ')}`.toUpperCase();

    if (labLog) {
        labLog.value = output;
        labLog.scrollTop = labLog.scrollHeight;
    }
});

/* Init states */
updateLabAddState();
updateLabGenerateState();


/* ---------- Repeat Prescriptions panel ---------- */
const rpTrigger = document.getElementById('rp-trigger');
const rpPanel = document.getElementById('rp-panel');

const rpInput = document.getElementById('rp-input');
const rpAdd = document.getElementById('rp-add');

const rpTable = document.getElementById('rp-table');
const rpTbody = document.getElementById('rp-tbody');

const rpGenerate = document.getElementById('rp-generate');
const rpLog = document.getElementById('rp-log');
const rpCopy = document.getElementById('rp-copy');

/* Toggle panel */
if (rpTrigger && rpPanel) {
    rpTrigger.addEventListener('click', () => {
        const isOpen = rpPanel.classList.contains('show');
        if (isOpen) {
            rpPanel.classList.remove('show');
            rpPanel.setAttribute('aria-hidden', 'true');
        } else {
            openExclusive(rpPanel);
        }
    });
}

/* Enable Add when input has text */
rpInput?.addEventListener('input', () => {
    const hasText = rpInput.value.trim().length > 0;
    if (rpAdd) rpAdd.disabled = !hasText;
});

/* Add medication row */
rpAdd?.addEventListener('click', () => {
    const text = rpInput.value.trim();
    if (!text) return;

    const tr = document.createElement('tr');

    const tdMed = document.createElement('td');
    tdMed.textContent = text;
    tdMed.style.padding = '8px';

    const tdAct = document.createElement('td');
    tdAct.style.textAlign = 'right';
    tdAct.style.padding = '8px';

    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.textContent = '✕';
    btnRemove.setAttribute('aria-label', `Remove ${text}`);
    btnRemove.style.minWidth = '32px';
    btnRemove.style.height = '28px';
    btnRemove.className = 'pill'; // reuse small button styling if you have it

    btnRemove.addEventListener('click', () => {
        tr.remove();
        updateRpGenerateState();
    });

    tdAct.appendChild(btnRemove);
    tr.appendChild(tdMed);
    tr.appendChild(tdAct);
    rpTbody.appendChild(tr);

    rpInput.value = '';
    rpAdd.disabled = true;
    updateRpGenerateState();
});

/* Enable Generate only when there is at least one row */
function updateRpGenerateState() {
    const hasRows = !!rpTbody && rpTbody.children.length > 0;
    if (rpGenerate) rpGenerate.disabled = !hasRows;
}

/* Build log from table rows */
rpGenerate?.addEventListener('click', () => {
    const meds = [...(rpTbody?.children || [])]
        .map(tr => tr.querySelector('td')?.textContent?.trim())
        .filter(Boolean);

    if (!meds.length) return;

    const output = `${meds.join(', ')}`.toUpperCase();
    if (rpLog) {
        rpLog.value = output;
        rpLog.scrollTop = rpLog.scrollHeight;
    }
});

/* Copy log (copy -> toast -> clear) */
rpCopy?.addEventListener('click', () => {
    const text = rpLog?.value ?? '';
    if (!text.trim()) return;

    const done = () => {
        showSuccessBar();
        if (rpLog) rpLog.value = '';
        if (rpTbody) {
            rpTbody.innerHTML = '';   // clear the table
            updateRpGenerateState();  // disable Generate now that it's empty
        }
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else {
        fallbackCopy(text); done();
    }
});

/* Init */
updateRpGenerateState();

/* ---------- Physical Orange Flag: inputs ---------- */
const pofRaise = document.getElementById('pof-raise');
const pofTime = document.getElementById('pof-time');
const pofInit = document.getElementById('pof-init');
const pofGenerate = document.getElementById('pof-generate');
const pofLog = document.getElementById('pof-log');
const pofCopy = document.getElementById('pof-copy');

/* Enforce uppercase initials (3 chars) */
pofInit?.addEventListener('input', () => {
    pofInit.value = pofInit.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    updatePofGenerateState();
});

/* Fill time as HHMM when Raise is clicked */
pofRaise?.addEventListener('click', () => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    pofTime.value = `${hh}${mm}`;
    updatePofGenerateState();
});

/* Enable Generate only when both time + initials present */
function updatePofGenerateState() {
    const hasTime = (pofTime?.value.trim().length ?? 0) === 4;
    const hasInit = (pofInit?.value.trim().length ?? 0) >= 2;
    if (pofGenerate) pofGenerate.disabled = !(hasTime && hasInit);
}

/* Generate -> fill the log textbox with the formatted line */
pofGenerate?.addEventListener('click', () => {
    const time = pofTime?.value.trim();
    const init = pofInit?.value.trim();
    if (!time || !init) return;

    const line = `ORANGE FLAG RAISED @ ${time}, ASSISTED IN PERSON BY (${init})`;
    if (pofLog) {
        pofLog.value = line;                 // replace contents as requested
        pofLog.scrollTop = pofLog.scrollHeight;
    }
});

/* Copy-all (same behaviour as OPS: copy -> success -> clear) */
pofCopy?.addEventListener('click', () => {
    const text = pofLog?.value ?? '';
    if (!text.trim()) return;

    const done = () => {
        showSuccessBar(); 
        if (pofLog) pofLog.value = '';
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else {
        fallbackCopy(text); done();
    }
});

/* Init state */
updatePofGenerateState();

/* ---------- Tabs ---------- */
const tabs = document.querySelectorAll('.tab-btn');
const pages = document.querySelectorAll('.page');
tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    pages.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    const id = 'page-' + btn.dataset.tab;
    document.getElementById(id)?.classList.add('active');
}));

/* ---------- Notepad autosave ---------- */
const editor = document.getElementById('editor');
const countEl = document.getElementById('count');

function wordCount(html) {
    return (html.replace(/<[^>]*>/g, ' ').match(/\b\w+\b/g) || []).length;
}
function save() {
    if (!editor) return;
    localStorage.setItem('seclcleric_note_html', editor.innerHTML);
    if (countEl) countEl.textContent = wordCount(editor.innerHTML) + ' words';
}
function load() {
    if (!editor) return;
    const html = localStorage.getItem('seclcleric_note_html');
    if (html) editor.innerHTML = html;
    if (countEl) countEl.textContent = wordCount(editor.innerHTML) + ' words';
}

editor?.addEventListener('input', save);
document.getElementById('link-clear')?.addEventListener('click', () => {
    if (!editor) return;
    editor.innerHTML = '';
    save();
});
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
    }
});

/* ---------- Validation panel (C3/C4) ---------- */
const valTrigger = document.getElementById('val-trigger');
const valPanel = document.getElementById('val-panel');

const allPanels = document.querySelectorAll('#page-tasks .val-panel');
function openExclusive(panel) {
    allPanels.forEach(p => {
        if (p !== panel) {
            p.classList.remove('show');
            p.setAttribute('aria-hidden', 'true');
        }
    });
    panel.classList.add('show');
    panel.setAttribute('aria-hidden', 'false');
}
valTrigger?.addEventListener('click', () => {
    if (!valPanel) return;
    const isOpen = valPanel.classList.contains('show');
    if (isOpen) {
        valPanel.classList.remove('show');
        valPanel.setAttribute('aria-hidden', 'true');
    } else {
        openExclusive(valPanel);
    }
});

/* Category (C3/C4) */
const cat3 = document.getElementById('cat3');
const cat4 = document.getElementById('cat4');
function setCat(button) {
    [cat3, cat4].forEach(b => b?.setAttribute('aria-pressed', 'false'));
    button?.setAttribute('aria-pressed', 'true');
    updateConfirmState();
}
cat3?.addEventListener('click', () => setCat(cat3));
cat4?.addEventListener('click', () => setCat(cat4));

/* Initials enforcement (clinical validation) */
const clinInit = document.getElementById('clin-init');
clinInit?.addEventListener('input', () => {
    clinInit.value = clinInit.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
});

/* Description + Confirm (C3/C4) */
const descInput = document.getElementById('desc-input');
const confirmBtn = document.getElementById('confirm-btn');
const cadOutput = document.getElementById('cad-output');

function getSelectedCategory() {
    if (cat3?.getAttribute('aria-pressed') === 'true') return 'C3';
    if (cat4?.getAttribute('aria-pressed') === 'true') return 'C4';
    return null;
}
function updateConfirmState() {
    const cat = getSelectedCategory();
    const hasDesc = (descInput?.value.trim().length ?? 0) > 0;
    if (confirmBtn) confirmBtn.disabled = !(cat && hasDesc);
}
descInput?.addEventListener('input', updateConfirmState);
descInput?.addEventListener('input', () => {
    descInput.value = descInput.value.toUpperCase();
});
confirmBtn?.addEventListener('click', () => {
    const cat = getSelectedCategory();
    const desc = descInput?.value.trim();
    if (!cat || !desc) return;

    const initials = clinInit?.value.trim() ?? '';
    const line = initials.length > 0
        ? `${cat} VALIDATION ARRANGED BY CLINICAL (${initials}) - ${desc}`
        : `${cat} VALIDATION ARRANGED, NO CLINICAL RESPONSE - ${desc}`;

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(line).catch(() => fallbackCopy(line));
    } else {
        fallbackCopy(line);
    }

    [cat3, cat4].forEach(b => b?.setAttribute('aria-pressed', 'false'));
    if (clinInit) clinInit.value = '';
    if (descInput) descInput.value = '';
    updateConfirmState();
    showSuccessBar();
});

/* ---------- Clipboard fallback ---------- */
function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) { }
    document.body.removeChild(ta);
}

/* ---------- Shift Lock logic ---------- */
const shiftStart = document.getElementById('shift-start');
const shiftEnd = document.getElementById('shift-end');
const shiftLock = document.getElementById('shift-lock');
const shiftBreaks = document.getElementById('shift-breaks');

shiftLock?.addEventListener('click', () => {
    const startVal = shiftStart?.value.trim() || '';
    const endVal = shiftEnd?.value.trim() || '';

    if (startVal.length !== 4 || endVal.length !== 4) {
        alert('Please enter both a 4-digit start and finish time first.');
        return;
    }

    // Make shift times unchangeable
    if (shiftStart) shiftStart.readOnly = true;
    if (shiftEnd) shiftEnd.readOnly = true;

    // Show break fields
    if (shiftBreaks) {
        shiftBreaks.style.display = 'flex';
        updateBreakLockState();
    }
});

/* Breaks Lock enable/disable + lock behaviour */
const br1 = document.getElementById('break-1');
const br2 = document.getElementById('break-2');
const br3 = document.getElementById('break-3');
const brL = document.getElementById('break-lunch');
const shiftLock2 = document.getElementById('shift-lock-2');

function updateBreakLockState() {
    const ok =
        (br1?.value.trim().length === 4) &&
        (br2?.value.trim().length === 4) &&
        (br3?.value.trim().length === 4) &&
        (brL?.value.trim().length === 4);
    if (shiftLock2) shiftLock2.disabled = !ok;
}

[br1, br2, br3, brL].forEach(el => el?.addEventListener('input', updateBreakLockState));

/* ---- helpers for notifications & scheduling ---- */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.error('SW register failed:', err));
}

async function ensureNotifyPermission() {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
}

async function fireNotification(title, body) {
    try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && Notification.permission === 'granted') {
            await reg.showNotification(title, {
                body,
                requireInteraction: true, // stays until dismissed
                tag: title,
                renotify: true
            });
            return true;
        }
    } catch (e) { /* fall through */ }
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
        return true;
    }
    return false;
}

function parseHHMMToDate(hhmm) {
    if (!/^\d{4}$/.test(hhmm)) return null;
    const now = new Date();
    const h = parseInt(hhmm.slice(0, 2), 10);
    const m = parseInt(hhmm.slice(2), 10);
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);  // schedule for tomorrow if already passed
    return t;
}

function scheduleBreak(inputEl, label) {
    const when = parseHHMMToDate(inputEl.value.trim());
    if (!when) return;
    const delay = when.getTime() - Date.now();

    window.setTimeout(async () => {
        // visually dim the box (75% transparent)
        inputEl.classList.add('break-dim');
        // fire the system toast
        await fireNotification(`${label} has started`, `${label} started at ${inputEl.value}.`);
    }, delay);
}

shiftLock2?.addEventListener('click', async () => {
    // make break/lunch read-only
    [br1, br2, br3, brL].forEach(el => { if (el) el.readOnly = true; });

    // disable both locks
    if (shiftLock2) shiftLock2.disabled = true;
    if (shiftLock) shiftLock.disabled = true;

    // request permission (must be user-initiated so gotta do click)
    await ensureNotifyPermission();

    // schedule the toasts
    // yummers

    if (br1) scheduleBreak(br1, 'Break 1');
    if (br2) scheduleBreak(br2, 'Break 2');
    if (br3) scheduleBreak(br3, 'Break 3');
    if (brL) scheduleBreak(brL, 'Lunch');
});

if (shiftPanel) {               // shiftPanel = document.getElementById('shift-panel')
    shiftPanel.classList.add('breaks-visible');
    updateBreakLockState();
}

/* ---------- Success bar ---------- */
load();
const successBar = document.getElementById('cad-success');
function showSuccessBar() {
    if (!successBar) return;
    successBar.classList.remove('hidden');
    clearTimeout(successBar._hideT);
    successBar._hideT = setTimeout(() => {
        successBar.classList.add('hidden');
    }, 10000);
}

/* ---------- OPS/CIL panel ---------- */
const opsTrigger = document.getElementById('ops-trigger');
const opsPanel = document.getElementById('ops-panel');

const opsOp = document.getElementById('ops-op');
const opsCl = document.getElementById('ops-cl');
const opsInit = document.getElementById('ops-init');
const opsDesc = document.getElementById('ops-desc');
const opsConfirm = document.getElementById('ops-confirm');
const opsLog = document.getElementById('ops-log');
const opsCopy = document.getElementById('ops-copy');

/* Show/hide OPS/CIL */
if (opsTrigger && opsPanel) {
    opsTrigger.addEventListener('click', () => {
        const isOpen = opsPanel.classList.contains('show');
        if (isOpen) {
            opsPanel.classList.remove('show');
            opsPanel.setAttribute('aria-hidden', 'true');
        } else {
            openExclusive(opsPanel);
        }
    });
}

/* OPS/CIL pill toggle */
function setOpsType(btn) {
    [opsOp, opsCl].forEach(b => b?.setAttribute('aria-pressed', 'false'));
    btn?.setAttribute('aria-pressed', 'true');
    updateOpsConfirmState();
}
opsOp?.addEventListener('click', () => setOpsType(opsOp));
opsCl?.addEventListener('click', () => setOpsType(opsCl));

/* OPS/CIL initials enforcement */
opsInit?.addEventListener('input', () => {
    opsInit.value = opsInit.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
});

/* Enable OPS/CIL confirm only when ready */
function getOpsType() {
    if (opsOp?.getAttribute('aria-pressed') === 'true') return 'OPERATIONAL';
    if (opsCl?.getAttribute('aria-pressed') === 'true') return 'CLINICAL';
    return null;
}
function updateOpsConfirmState() {
    const type = getOpsType();
    const hasAdvice = (opsDesc?.value.trim().length ?? 0) > 0;
    if (opsConfirm) opsConfirm.disabled = !(type && hasAdvice);
}
opsDesc?.addEventListener('input', updateOpsConfirmState);

// OPS/CIL Confirm (append only, add trailing newline; no popup, no copy)
opsConfirm?.addEventListener('click', (e) => {
    e.preventDefault();
    const type = getOpsType();
    const advice = opsDesc?.value.trim();
    if (!type || !advice) return;

    const initials = opsInit?.value.trim() ?? '';
    const who = (type === 'OPERATIONAL') ? 'OPS' : 'CLINICAL';
    const initialsTag = initials ? ` (${initials})` : '';
    const entry = `ADVISED BY ${who}${initialsTag}: ${advice}`;

    if (opsLog) {
        // ensure entries stack with a newline after each
        const needsLeadingNewline = opsLog.value && !opsLog.value.endsWith('\n');
        opsLog.value = opsLog.value
            ? `${opsLog.value}${needsLeadingNewline ? '\n' : ''}${entry}\n`
            : `${entry}\n`;
        opsLog.scrollTop = opsLog.scrollHeight;
    }

    // Do NOT copy or show success here

    // Reset inputs
    [opsOp, opsCl].forEach(b => b?.setAttribute('aria-pressed', 'false'));
    if (opsInit) opsInit.value = '';
    if (opsDesc) opsDesc.value = '';
    updateOpsConfirmState();
});


opsCopy?.addEventListener('click', () => {
    const text = opsLog?.value ?? '';
    if (!text.trim()) return;

    const done = () => {
        showSuccessBar(); // show the green popup only on copy
        if (opsLog) opsLog.value = '';
    };

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else {
        fallbackCopy(text); done();
    }
});

/* ---------- Physical Orange Flag panel ---------- */
const pofTrigger = document.getElementById('pof-trigger');
const pofPanel = document.getElementById('pof-panel');

if (pofTrigger && pofPanel) {
    pofTrigger.addEventListener('click', () => {
        const isOpen = pofPanel.classList.contains('show');
        if (isOpen) {
            pofPanel.classList.remove('show');
            pofPanel.setAttribute('aria-hidden', 'true');
        } else {
            openExclusive(pofPanel);
        }
    });
}

/* ---------- init states dont touch ---------- */
updateConfirmState();

updateOpsConfirmState();
