/* Dispatch Functions - reels, ODA combobox and the generated note. */

/* ---------- Theme (same storage key as the main tool) ---------- */
const THEME_KEY = 'aa-theme';

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('.theme-btn').forEach(btn => {
        const on = btn.dataset.pickTheme === theme;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

applyTheme(document.documentElement.dataset.theme || 'light');

document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        applyTheme(btn.dataset.pickTheme);
        try { localStorage.setItem(THEME_KEY, btn.dataset.pickTheme); } catch (_) { }
    });
});

/* ---------- State ---------- */
const values = {};          // reel id -> current number
let odaIndex = -1;          // -1 = nothing picked yet

const noteEl = document.getElementById('note');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Note ---------- */
// Zero-count call lines get dropped entirely, per the template.
function buildNote() {
    const held = [];
    if (values.c2) held.push(`${values.c2}x C2 Calls`);
    if (values.c3) held.push(`${values.c3}x C3 Calls`);
    if (values.urg) held.push(`${values.urg}x URG Calls`);

    const oda = odaIndex >= 0 ? odaOptions[odaIndex].textContent : '[select ODA]';

    return 'Reviewed outstanding unassigned incident. I have verified no available resources, '
        + 'having checked neighbouring dispatch desks and resource availability. '
        + 'Considering escalation to a SRD/DM. Holding:\n'
        + held.map(l => l + '\n').join('')
        + `${oda} ODA. CSP Level ${values.csp}.`;
}

function renderNote() {
    noteEl.value = buildNote();
}

/* ---------- Reels ---------- */
function setReel(reel, next, dir) {
    const id = reel.dataset.reel;
    const min = Number(reel.dataset.min);
    const max = Number(reel.dataset.max);
    const win = reel.querySelector('.reel-window');

    values[id] = next;
    win.setAttribute('aria-valuenow', next);
    win.classList.toggle('lit', next >= 1);
    reel.querySelector('[data-step="1"]').disabled = next >= max;
    reel.querySelector('[data-step="-1"]').disabled = next <= min;

    // First render (dir = 0): just set the number, no roll
    const nums = [...win.querySelectorAll('.reel-num')];
    if (!dir) {
        nums[nums.length - 1].textContent = next;
        return;
    }

    // Rapid clicks can leave old numbers mid-exit - clear them, keep the newest
    nums.slice(0, -1).forEach(n => n.remove());
    const current = nums[nums.length - 1];

    const incoming = document.createElement('span');
    incoming.className = 'reel-num';
    incoming.setAttribute('aria-hidden', 'true');
    incoming.textContent = next;

    if (reducedMotion) {
        current.remove();
    } else {
        current.classList.remove('in-up', 'in-down');
        current.classList.add(dir > 0 ? 'out-up' : 'out-down');
        incoming.classList.add(dir > 0 ? 'in-up' : 'in-down');
        setTimeout(() => current.remove(), 200);
    }
    win.appendChild(incoming);
}

function stepReel(reel, step) {
    const min = Number(reel.dataset.min);
    const max = Number(reel.dataset.max);
    const next = Math.min(max, Math.max(min, values[reel.dataset.reel] + step));
    if (next === values[reel.dataset.reel]) return;
    setReel(reel, next, step);
    renderNote();
}

document.querySelectorAll('.reel').forEach(reel => {
    const min = Number(reel.dataset.min);
    const max = Number(reel.dataset.max);
    setReel(reel, Number(reel.dataset.value), 0);

    reel.querySelectorAll('.reel-btn').forEach(btn => {
        btn.addEventListener('click', () => stepReel(reel, Number(btn.dataset.step)));
    });

    // Keyboard lives on the reel window (it's the spinbutton)
    reel.querySelector('.reel-window').addEventListener('keydown', e => {
        const id = reel.dataset.reel;
        let target = null;
        if (e.key === 'ArrowUp') target = values[id] + 1;
        else if (e.key === 'ArrowDown') target = values[id] - 1;
        else if (e.key === 'PageUp') target = values[id] + 10;
        else if (e.key === 'PageDown') target = values[id] - 10;
        else if (e.key === 'Home') target = min;
        else if (e.key === 'End') target = max;
        if (target === null) return;

        e.preventDefault();
        target = Math.min(max, Math.max(min, target));
        if (target === values[id]) return;
        setReel(reel, target, target > values[id] ? 1 : -1);
        renderNote();
    });
});

/* ---------- ODA combobox ---------- */
const combo = document.getElementById('oda-trigger');
const list = document.getElementById('oda-list');
const odaValue = document.getElementById('oda-value');
const odaOptions = [...list.querySelectorAll('[role="option"]')];
let activeIndex = -1;
let typeBuffer = '';
let typeTimer = null;

const isOpen = () => !list.hidden;

function setActive(i) {
    activeIndex = i;
    odaOptions.forEach((o, j) => o.classList.toggle('active', j === i));
    if (i >= 0) {
        combo.setAttribute('aria-activedescendant', odaOptions[i].id);
        odaOptions[i].scrollIntoView({ block: 'nearest' });
    } else {
        combo.removeAttribute('aria-activedescendant');
    }
}

function openList() {
    list.hidden = false;
    combo.setAttribute('aria-expanded', 'true');
    setActive(odaIndex >= 0 ? odaIndex : 0);
}

function closeList() {
    list.hidden = true;
    combo.setAttribute('aria-expanded', 'false');
    setActive(-1);
}

function chooseOda(i) {
    odaIndex = i;
    odaValue.textContent = odaOptions[i].textContent;
    combo.classList.add('has-value');
    odaOptions.forEach((o, j) => o.setAttribute('aria-selected', j === i ? 'true' : 'false'));
    closeList();
    renderNote();
}

combo.addEventListener('click', () => (isOpen() ? closeList() : openList()));

combo.addEventListener('keydown', e => {
    const last = odaOptions.length - 1;
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            if (!isOpen()) openList(); else setActive(Math.min(activeIndex + 1, last));
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (!isOpen()) openList(); else setActive(Math.max(activeIndex - 1, 0));
            break;
        case 'Home':
            if (isOpen()) { e.preventDefault(); setActive(0); }
            break;
        case 'End':
            if (isOpen()) { e.preventDefault(); setActive(last); }
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            if (!isOpen()) openList(); else chooseOda(activeIndex);
            break;
        case 'Escape':
            if (isOpen()) { e.preventDefault(); closeList(); }
            break;
        case 'Tab':
            if (isOpen()) closeList();
            break;
        default:
            // Typeahead: "m" jumps to Medway, "pa" to Paddock Wood, etc.
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                typeBuffer += e.key.toLowerCase();
                clearTimeout(typeTimer);
                typeTimer = setTimeout(() => { typeBuffer = ''; }, 600);
                const hit = odaOptions.findIndex(o => o.textContent.toLowerCase().startsWith(typeBuffer));
                if (hit >= 0) {
                    if (!isOpen()) openList();
                    setActive(hit);
                }
            }
    }
});

// mousedown + preventDefault keeps focus on the trigger while you click an option
list.addEventListener('mousedown', e => e.preventDefault());
list.addEventListener('click', e => {
    const i = odaOptions.indexOf(e.target.closest('[role="option"]'));
    if (i >= 0) chooseOda(i);
});
odaOptions.forEach((o, i) => o.addEventListener('mousemove', () => setActive(i)));

document.addEventListener('click', e => {
    if (isOpen() && !e.target.closest('#oda-combo')) closeList();
});

/* ---------- Copy ---------- */
const copyBtn = document.getElementById('note-copy');

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

copyBtn.addEventListener('click', async () => {
    const text = noteEl.value;
    try {
        await navigator.clipboard.writeText(text);
    } catch (_) {
        fallbackCopy(text);
    }
    copyBtn.textContent = 'Copied';
    copyBtn.classList.add('done');
    clearTimeout(copyBtn._t);
    copyBtn._t = setTimeout(() => {
        copyBtn.textContent = 'Copy note';
        copyBtn.classList.remove('done');
    }, 1600);
});

/* ---------- Init ---------- */
renderNote();
