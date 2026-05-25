/* ============================================================
   HELPERS — defined first so they're available everywhere
   ============================================================ */

/* ---------- Clipboard helpers ---------- */
function copyToClipboard(text, onSuccess) {
    if (!text) return;
    const done = () => { if (onSuccess) onSuccess(); };
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
    } else {
        fallbackCopy(text); done();
    }
}

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

/* ---------- Success bar ---------- */
const successBar = document.getElementById('cad-success');
function showSuccessBar() {
    if (!successBar) return;
    successBar.classList.remove('hidden');
    clearTimeout(successBar._hideT);
    successBar._hideT = setTimeout(() => {
        successBar.classList.add('hidden');
    }, 10000);
}

let csdExtension = null; // only set for CSD/OPS modes

function promptExtension() {
    while (true) {
        const raw = prompt('Enter your 5-digit extension:');

        if (raw === null) return null; // user hit Cancel

        const trimmed = raw.trim();

        if (trimmed === '') {
            alert('Extension cannot be empty. Please enter your extension.');
            continue;
        }

        if (!/^\d{5}$/.test(trimmed)) {
            alert('Invalid extension — must be exactly 5 digits. Please try again.');
            continue;
        }

        return trimmed; // valid
    }
}

let csdMode = 'call-taker';

const SIDEBAR_STATUS = {
    'call-taker': { label: '📞 Call Taking', dotClass: 'status-dot--call-taker' },
    'call-taker-coach': { label: '📞 Call Taking (Coach)', dotClass: 'status-dot--call-taker' },
    csd: { label: '📋 CSD Support', dotClass: 'status-dot--csd' },
    ops: { label: '🎧 OPS Support', dotClass: 'status-dot--ops' },
};

function updateSidebarStatus() {
    const dot = document.getElementById('sidebar-status-dot');
    const label = document.getElementById('sidebar-status-label');
    if (!dot || !label) return;
    const info = SIDEBAR_STATUS[csdMode] || SIDEBAR_STATUS['call-taker'];
    label.textContent = info.label;
    dot.className = `status-dot ${info.dotClass}`;
}

function showsCoachTemplates() {
    return csdMode === 'call-taker-coach' || csdMode === 'ops';
}

function updateCoachChip() {
    const coachSection = document.getElementById('coach-scripts-section');
    const show = showsCoachTemplates();
    if (coachSection) coachSection.classList.toggle('hidden', !show);
}

function updateTemplatePanels() {
    const csdPanel = document.getElementById('csd-templates-panel');
    if (csdPanel) csdPanel.classList.toggle('hidden', csdMode !== 'csd');
    document.querySelectorAll('.flu-csd-callback').forEach(el => {
        el.classList.toggle('hidden', csdMode !== 'csd');
    });
}

function updateDutyState() {
    updateCsdTabState();
    updateCoachChip();
    updateTemplatePanels();
    updateSidebarStatus();
}

document.querySelector('.script-chip-csd[data-mode="call-taker"]')?.addEventListener('click', () => {
    csdMode = 'call-taker';
    csdExtension = null;
    updateDutyState();
});

document.querySelector('.script-chip-csd[data-mode="call-taker-coach"]')?.addEventListener('click', () => {
    csdMode = 'call-taker-coach';
    csdExtension = null;
    updateDutyState();
});

document.querySelector('.script-chip-csd[data-mode="csd"]')?.addEventListener('click', () => {
    const ext = promptExtension();
    if (ext === null) return;
    csdMode = 'csd';
    csdExtension = ext;
    updateDutyState();
});

document.querySelector('.script-chip-csd[data-mode="ops"]')?.addEventListener('click', () => {
    const ext = promptExtension();
    if (ext === null) return;
    csdMode = 'ops';
    csdExtension = ext;
    updateDutyState();
});

/* ---------- Task panels: openExclusive ---------- */
const allPanels = document.querySelectorAll('.val-panel');
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

document.getElementById('link-upper')?.addEventListener('click', () => {
    if (!editor) return;
    const plainText = editor.innerText.trim().toUpperCase();
    editor.innerHTML = '';
    editor.appendChild(document.createTextNode(plainText));
    save();
});

document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
    }
});

editor.addEventListener('paste', (e) => {
    e.preventDefault();
    const plain = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, plain);
});

/* ============================================================
   COLLAPSIBLE HELPERS
   ============================================================ */
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

document.querySelectorAll('.flu-panel.flu-csd-callback').forEach(panel => {
    const toggle = panel.querySelector('[data-flu-toggle]');
    const body = panel.querySelector('[data-flu-body]');
    if (!toggle || !body) return;

    toggle.addEventListener('click', () => {
        const nowHidden = body.classList.toggle('flu-hidden');
        toggle.textContent = nowHidden ? '[show]' : '[hide]';
    });
});

/* ============================================================
   GUIDE SEARCH
   ============================================================ */

// ==========================================
// SEARCH ANSWERS — edit these freely
// key: search term (also used for autocomplete suggestions)
// value: the text shown in the result box (\n for line breaks)
// ==========================================
const everydayActivitiesAnswer =
    'This question focuses on what they can do at the time of the assessment so right now. A few examples can include:\n• Get changed\n• Make a drink\n• Watch TV\n• Read a book\n\nDo not use going to the toilet as an example.';

const deathlyAnswer =
    'IMPORTANT: Before selecting "yes", read this to the patient:\n\n"On brown or black skin, you can check the palms of the hands for changes in colour."\n\nWe are looking for grey, blue or otherwise extremely pale. If they still answer "yes" go with it, ensuring you have probed with the other supporting information.';

const touchAnswer =
    'A clearer way to ask this question is:\n\n"If you place your hand on the skin of your/their chest, does it feel a normal temperature?"\n\nThis question is ruling out shock, NOT a fever. Do not except answers like "I dont have a fever" or if they checked at any time other than right now.';

const breathlessAnswer =
    'If you are talking to the patient, and they are able to say more than a sentence to you, you can select "no". This question is looking for someone who is fighting desperately for every single breath they take.\n\nAnything less than this, you can select "no".';

const breathingAnswer =
    'A clearer way to ask this question is:\n\n"So when you are doing nothing at all, for example just sitting still, is your breathing any FASTER or HARDER? than normal?"\n\nTry your best to get them to specify if their breathing is specifically HARDER or FASTER, not irrelevant words like "shallow" or "rattled".';

const staystillAnswer =
    'This question is looking if, right now, the pain is so bad they cannot move AT ALL, otherwise they would be in extreme, unberable pain. Patients often exaggerate this.\n\nA great way to reword this question is:\n"Are you/they still able to move despite the pain?"\nIf they answer yes, we have ruled out they do not have to stay completely still.';

const bloodLossAnswer =
    'So since the problem has began, has there been ANY blood loss at all, even if it is unrelated to the problem. This INCLUDES things like:\n• Unrelated injuries\n• Nosebleeds\n• Periods (for females)\n\nNote that urinating blood DOES count for this question, but not for the next question.';

const guideAnswers = {
    'Is the problem stopping you from doing ALL of your everyday activities now?': everydayActivitiesAnswer,
    'Is the problem stopping them from doing ALL of their everyday activities now?': everydayActivitiesAnswer,
    'Have you lost any blood?': bloodLossAnswer,
    'Has he lost any blood?': bloodLossAnswer,
    'Has she lost any blood?': bloodLossAnswer,
    'Is he a deathly colour?': deathlyAnswer,
    'Is she a deathly colour?': deathlyAnswer,
    'Are you a deathly colour?': deathlyAnswer,
    'Do you have to stay COMPLETELY still because of the pain?': staystillAnswer,
    'Does he have to stay COMPLETELY still because of the pain?': staystillAnswer,
    'Does she have to stay COMPLETELY still because of the pain?': staystillAnswer,
    'Are you breathing faster or harder when doing nothing at all?': breatingAnswer,
    'Is he breathing faster or harder when doing nothing at all?': breatingAnswer,
    'Is she breathing faster or harder when doing nothing at all?': breatingAnswer,
    'Are you so breathless that speaking more than a few words is impossible?': breathlessAnswer,
    'Is she so breathless that speaking more than a few words is impossible?': breathlessAnswer,
    'Is he so breathless that speaking more than a few words is impossible?': breathlessAnswer,
    'Does the skin on the chest, back or abdomen feel a normal temperature when touched?': touchAnswer,
};

const guideInput     = document.getElementById('guide-input');
const guideSearchBtn = document.getElementById('guide-search-btn');
const guideResult    = document.getElementById('guide-result');

const guideAnswersByKey = Object.fromEntries(
    Object.entries(guideAnswers).map(([key, value]) => [key.toLowerCase(), value])
);

function populateGuideDatalist() {
    const datalist = document.getElementById('guide-options');
    if (!datalist) return;
    datalist.replaceChildren();
    for (const key of Object.keys(guideAnswers)) {
        const option = document.createElement('option');
        option.value = key;
        datalist.appendChild(option);
    }
}

populateGuideDatalist();

function runGuideSearch() {
    const query  = guideInput?.value.trim().toLowerCase() ?? '';
    const answer = guideAnswersByKey[query];
    if (guideResult) {
        guideResult.querySelector('.guide-result-text').textContent =
            answer ?? 'No result found for that search.';
        guideResult.classList.toggle('guide-result--found',   !!answer);
        guideResult.classList.toggle('guide-result--missing', !answer);
    }
}

guideInput?.addEventListener('input', runGuideSearch);

/* ============================================================
   EXTRA PANELS TOGGLE
   ============================================================ */
const extraToggle = document.getElementById('link-extra');

if (extraToggle) {
    extraToggle.addEventListener('click', (e) => {
        e.preventDefault();

        const scope = extraToggle.closest('.page') || document;

        scope
            .querySelectorAll('.links-panel, .flu-panel:not(.flu-csd-callback), .info-panel, .c3-panel')
            .forEach(el => el.classList.toggle('hidden'));
    });
}

/* ============================================================
   LAB RESULTS PANEL
   ============================================================ */
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
labCopy?.addEventListener('click', () => {
    const text = labLog?.value ?? '';
    if (!text.trim()) return;
    copyToClipboard(text, () => showSuccessBar());
});

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

    let header = `${hospital.toUpperCase()} - LAB NUMBER: ${phone}`;
    if (ext) header += `, PT NUMBER: ${ext}`;
    if (bleep) header += `, LAB NUMBER EXT: ${bleep}`;

    const output = `${header} - ${pairs.join(', ')}`.toUpperCase();

    if (labLog) {
        labLog.value = output;
        labLog.scrollTop = labLog.scrollHeight;
    }
});

/* Init states */
updateLabAddState();
updateLabGenerateState();

/* ============================================================
   COLD & FLU SYMPTOMS (starts expanded)
   ============================================================ */
const fluToggle = document.getElementById('flu-toggle');
const fluRow = document.getElementById('flu-body');
if (fluToggle && fluRow) {
    fluRow.classList.remove('flu-hidden');
    fluToggle.textContent = '[hide]';
    fluToggle.addEventListener('click', () => {
        fluRow.classList.toggle('flu-hidden');
        fluToggle.textContent = fluRow.classList.contains('flu-hidden') ? '[show]' : '[hide]';
    });
}

/* ============================================================
   LANGUAGELINE PANEL
   ============================================================ */
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
    copyToClipboard(text, () => {
        showSuccessBar();
        if (llLog) llLog.value = '';
        if (llId) llId.value = '';
        if (llLang) llLang.value = '';
        updateLlGenerateState();
    });
});

/* Init */
updateLlGenerateState();

/* ============================================================
   CSD NOTES
   ============================================================ */
const csdTabBtn = document.querySelector('.tab-btn[data-tab="csd"]');

function setCsdTabLocked(locked) {
    if (!csdTabBtn) return;
    csdTabBtn.dataset.locked = locked ? 'true' : 'false';
    csdTabBtn.setAttribute('aria-disabled', locked ? 'true' : 'false');
    csdTabBtn.classList.toggle('locked', locked);
}

// CSD tab is only unlocked when mode is csd or ops (and extension is set)
function updateCsdTabState() {
    const unlocked = (csdMode === 'csd' || csdMode === 'ops') && !!csdExtension;
    setCsdTabLocked(!unlocked);
}

updateDutyState();

/* ---------- Copy flash helper ---------- */
function runCopyFlash(chip) {
    chip.classList.remove('copy-flash', 'copy-flash-red');
    void chip.offsetWidth;

    const flashClass = chip.classList.contains('script-chip-csd-red')
        ? 'copy-flash-red'
        : 'copy-flash';

    chip.classList.add(flashClass);

    const handler = () => {
        chip.classList.remove(flashClass);
        chip.removeEventListener('animationend', handler);
    };

    chip.addEventListener('animationend', handler);
}

/* ---------- Quick Scripts: click-to-copy with flash (generic) ---------- */
document.querySelectorAll('.script-chip:not(.script-chip-special):not(.script-chip-csd)').forEach(chip => {
    chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-copy') || chip.innerText;
        copyToClipboard(text, () => runCopyFlash(chip));
    });
});

/* ---------- CSD Templates: copy with extension insertion ---------- */
function getCsdTemplateText(templateId) {
    if ((csdMode === 'csd' || csdMode === 'ops') && !csdExtension) {
        alert('No extension set. Please select CSD Duties or OPS Duties first.');
        return null;
    }
    const ext = csdExtension;

    const base = `CSD ${ext} -> `;

    switch (templateId) {
        case '1':
            return `${base}`;
        case '2':
            return `${base}LINKED TO CASE: `;
        case '3':
            return `${base}CB1, NO CONTACT: VOICEMAIL LEFT. `;
        case '4':
            return `${base}CB1, NO CONTACT: COULD NOT LEAVE VOICEMAIL. `;
        case '5':
            return `${base}CB2, NO CONTACT: VOICEMAIL LEFT. CASE TO BE CLOSED.`;
        case '6':
            return `${base}CB2, NO CONTACT: VOICEMAIL COULD NOT BE LEFT. CASE TO BE CLOSED. `;
        default:
            return null;
    }
}

function copyCsdTemplate(chip, templateId) {
    const text = getCsdTemplateText(templateId);
    if (!text) return;

    copyToClipboard(text, () => runCopyFlash(chip));
}

document.querySelectorAll('.script-chip-csd[data-template]').forEach(chip => {
    const templateId = chip.dataset.template;
    chip.addEventListener('click', () => copyCsdTemplate(chip, templateId));
});

/* ---------- Special: CHASING 111 asks for DAS ref, then copies ---------- */
const chipChase111 = document.getElementById('chip-chase-111');
chipChase111?.addEventListener('click', () => {
    const ref = window.prompt('Please enter the Digital Admin Slip reference number.');
    if (!ref) return;

    const text = `NO NEW OR WORSENING SYMPTOMS. WCAG.
PT CALLING TO CHASE CALLBACK, DAS RAISED (${ref.trim()})`.toUpperCase();

    copyToClipboard(text, () => runCopyFlash(chipChase111));
});

/* ---------- Special: CALL ENDED, DISCONNECTED ---------- */
const chipCallDisc = document.getElementById('chip-call-ended-disc');
chipCallDisc?.addEventListener('click', () => {
    const voicemail = window.confirm('Were you able to leave a voicemail containing worsening care advice?\n\nOK: Yes\nCancel: No');
    const vmText = voicemail ? 'WORSENING VOICEMAIL LEFT' : 'COULD NOT LEAVE WORSENING VOICEMAIL.';

    const text = `CALL ENDED, CALLER DISCONNECTED.
CALLED BACK PATIENT (3X), NO RESPONSE.\n${vmText}`.toUpperCase();

    copyToClipboard(text, () => runCopyFlash(chipCallDisc));
});

/* ---------- Special: CALL ENDED, SILENT ---------- */
const chipCallSilent = document.getElementById('chip-call-ended-silent');
chipCallSilent?.addEventListener('click', () => {
    const voicemail = window.confirm('Were you able to leave a voicemail containing worsening care advice?\n\nOK: Yes\nCancel: No');
    const vmText = voicemail ? 'WORSENING VOICEMAIL LEFT' : 'COULD NOT LEAVE WORSENING VOICEMAIL.';

    const text = `CALL ENDED, LINE SILENT/UNRESPONSIVE.
CALLED BACK PATIENT (3X), NO RESPONSE.\n${vmText}`.toUpperCase();

    copyToClipboard(text, () => runCopyFlash(chipCallSilent));
});

/* ---------- Special: DATIX asks for ref, then copies ---------- */
const chipDatix = document.getElementById('chip-datix');
chipDatix?.addEventListener('click', () => {
    const ref = window.prompt('Please enter the DATIX reference number.');
    if (!ref) return;

    const text = `DATIX RAISED (${ref.trim()})`.toUpperCase();

    copyToClipboard(text, () => runCopyFlash(chipDatix));
});

/* ---------- Special: SAFEGUARDING asks for ref, then copies ---------- */
const chipSafeguarding = document.getElementById('chip-safeguarding');
chipSafeguarding?.addEventListener('click', () => {
    const ref = window.prompt('Please enter the DAS reference number.');
    if (!ref) return;

    const text = `DAS RAISED (${ref.trim()})`.toUpperCase();

    copyToClipboard(text, () => runCopyFlash(chipSafeguarding));
});

/* ============================================================
   SHIFT AUTOFILL
   ============================================================ */
const shiftAutoFillButton = document.getElementById('shift-autofill');
shiftAutoFillButton?.addEventListener('click', autoFillShift);

async function autoFillShift() {
    let text = '';

    if (navigator.clipboard?.readText) {
        try {
            text = await navigator.clipboard.readText();
        } catch (e) {}
    }

    if (!text) {
        text = window.prompt(
            'Paste the WFM homepage text here (Ctrl+V), then press OK:',
            ''
        );
        if (!text) return;
    }

    const data = parseWfmCurrentShift(text);
    if (!data) {
        alert('To use this, first copy your WFM shift using (Ctrl+A) and (Ctrl+C).');
        return;
    }

    const startInput = document.getElementById('shift-start');
    const endInput = document.getElementById('shift-end');
    if (startInput && data.shiftStart) startInput.value = data.shiftStart;
    if (endInput && data.shiftEnd) endInput.value = data.shiftEnd;

    const breakIds = ['break-1', 'break-2', 'break-3'];
    breakIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) el.value = data.breaks[i] || '';
    });

    const lunchInput = document.getElementById('break-lunch');
    if (lunchInput) lunchInput.value = data.lunch || '';
}

function parseWfmCurrentShift(raw) {
    const lines = raw
        .replace(/\r/g, '\n')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l !== '');

    const idxCurrent = lines.findIndex(l =>
        l.toLowerCase().startsWith('current shift')
    );
    if (idxCurrent === -1) return null;

    let idxUpcoming = lines.findIndex(
        (l, i) => i > idxCurrent && l.toLowerCase().startsWith('upcoming shifts')
    );
    if (idxUpcoming === -1) idxUpcoming = lines.length;

    const blockLines = lines.slice(idxCurrent, idxUpcoming);
    const blockText = blockLines.join('\n');

    const mainRange = blockText.match(
        /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/
    );
    if (!mainRange) return null;

    const shiftStart = toHHMM(mainRange[1]);
    const shiftEnd = toHHMM(mainRange[2]);

    const breaks = [];
    let lunch = '';

    const timeRangeRe = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;

    for (let i = 0; i < blockLines.length - 1; i++) {
        const line = blockLines[i];
        const next = blockLines[i + 1] || '';
        const m = line.match(timeRangeRe);
        if (!m) continue;

        const start = toHHMM(m[1]);
        const label = next.toLowerCase();

        if (label.includes('lunch')) {
            lunch = start;
        } else if (label.includes('rest break')) {
            breaks.push(start);
        }
    }

    return { shiftStart, shiftEnd, breaks, lunch };
}

function toHHMM(timeText) {
    const m = timeText.match(/(\d{1,2}):(\d{2})/);
    if (!m) return '';
    return m[1].padStart(2, '0') + m[2];
}

/* ============================================================
   REPEAT PRESCRIPTIONS PANEL
   ============================================================ */
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
    btnRemove.className = 'pill';

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
    copyToClipboard(text, () => {
        showSuccessBar();
        if (rpLog) rpLog.value = '';
        if (rpTbody) {
            rpTbody.innerHTML = '';
            updateRpGenerateState();
        }
    });
});

/* Init */
updateRpGenerateState();

/* ============================================================
   TABS
   ============================================================ */
const tabs = document.querySelectorAll('.tab-btn');
const pages = document.querySelectorAll('.page');
function setActiveTab(tabName) {
    tabs.forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabName);
        b.setAttribute('aria-pressed', b.dataset.tab === tabName ? 'true' : 'false');
    });
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${tabName}`)?.classList.add('active');
}

tabs.forEach(btn => btn.addEventListener('click', () => {
    const isCsdTab = btn.dataset.tab === 'csd';
    const csdLocked = csdTabBtn?.dataset.locked === 'true';

    if (isCsdTab && csdLocked) {
        alert('These are templates for CSD/OPS only.\nChange your status to access this.');
        return;
    }

    setActiveTab(btn.dataset.tab);
}));

/* ============================================================
   SHIFT LOCK LOGIC
   ============================================================ */
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

/* ============================================================
   NOTIFICATIONS & SCHEDULING
   ============================================================ */
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
    if (br1) scheduleBreak(br1, 'Break 1');
    if (br2) scheduleBreak(br2, 'Break 2');
    if (br3) scheduleBreak(br3, 'Break 3');
    if (brL) scheduleBreak(brL, 'Lunch');
});

const shiftPanel = document.getElementById('shift-panel');
if (shiftPanel) {
    shiftPanel.classList.add('breaks-visible');
    updateBreakLockState();
}
/* ============================================================
   INIT STATES — run after everything is defined
   ============================================================ */
load();
updateOpsConfirmState();




