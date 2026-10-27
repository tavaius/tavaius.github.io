// MetSearch RMS - skeleton app logic.
// Hash routes:
//   #/dashboard            home / timeline
//   #/results              last search's results
//   #/record/<id>[/<sec>]  a record, optionally on a section (alerts, family...)
//   #/tasks, #/alerts, #/shared   simple lists
//   anything else          "coming soon" placeholder
// Search outcomes follow the user flow diagram: one result opens straight
// away, a list shows results, too many shows a warning + first page, none
// shows an info message.

(function () {
    'use strict';

    const D = window.RMS_DATA;
    const PAGE_SIZE = 15;
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const icon = (name, cls = '') => `<svg class="icon ${cls}"><use href="#i-${name}"/></svg>`;
    const nowStamp = () => {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return { date: `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
    };

    // Setting the hash triggers route() via hashchange; only re-render by hand
    // when the hash isn't changing (otherwise we'd render twice and the
    // one-shot message bar would be lost).
    const navigate = (h) => { if (location.hash === h) route(); else location.hash = h; };

    // ---------- state ----------
    const state = {
        user: null,
        openTabs: [],        // record ids, in open order
        seen: new Set(),     // records the user has opened
        search: null,        // { type, text, criteria, results, when, showAll }
        msg: null,           // { kind, title, text }
        editing: null        // record panel currently in edit mode ('ident', 'desc', 'details')
    };

    // Session lives in sessionStorage so a refresh keeps you signed in, but
    // closing the tab signs you out. Only the display name is kept.
    const store = {
        get() { try { return JSON.parse(sessionStorage.getItem('rms-session')); } catch (_) { return null; } },
        set(v) { try { sessionStorage.setItem('rms-session', JSON.stringify(v)); } catch (_) { } },
        clear() { try { sessionStorage.removeItem('rms-session'); } catch (_) { } }
    };

    // Edits are kept in this browser's localStorage, so each viewer has their
    // own copy of the training data. "Reset training data" wipes it.
    const DB_KEY = 'rms-db-v1';
    const PERSIST = ['people', 'objects', 'locations', 'events', 'tasks'];
    const db = {
        load() {
            try {
                const saved = JSON.parse(localStorage.getItem(DB_KEY));
                if (saved) PERSIST.forEach((k) => { if (Array.isArray(saved[k])) D[k] = saved[k]; });
            } catch (_) { }
        },
        save() { try { localStorage.setItem(DB_KEY, JSON.stringify(Object.fromEntries(PERSIST.map((k) => [k, D[k]])))); } catch (_) { toast('Could not save - browser storage is unavailable'); } },
        reset() { try { localStorage.removeItem(DB_KEY); } catch (_) { } location.reload(); }
    };
    db.load();

    // ---------- record lookup ----------
    const TYPE_ICON = { person: 'person', object: 'cube', location: 'pin', event: 'bolt' };
    const allRecords = () => [
        ...D.people.map((r) => ({ ...r, kind: 'person' })),
        ...D.objects.map((r) => ({ ...r, kind: 'object' })),
        ...D.locations.map((r) => ({ ...r, kind: 'location' })),
        ...D.events.map((r) => ({ ...r, kind: 'event' }))
    ];
    const findRecord = (id) => allRecords().find((r) => r.id === id);
    // the stored object itself (findRecord returns a copy), for editing
    const rawRecord = (id) => ['people', 'objects', 'locations', 'events'].map((k) => D[k].find((r) => r.id === id)).find(Boolean);
    const displayName = (r) => r.kind === 'person' ? `${r.first} ${r.last}` : r.name;
    const ageFrom = (dob) => {
        const [d, m, y] = dob.split('/').map(Number);
        const now = new Date();
        let age = now.getFullYear() - y;
        if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
        return age;
    };

    // ======================================================
    // Auth
    // ======================================================
    function showLogin() {
        $('#app').classList.add('hidden');
        $('#login-screen').classList.remove('hidden');
        $('#login-user').focus();
    }

    function showApp() {
        $('#login-screen').classList.add('hidden');
        $('#app').classList.remove('hidden');
        $('#user-name').textContent = state.user.name;
        $('#user-initials').textContent = state.user.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        if (!location.hash || location.hash === '#') location.hash = '#/dashboard';
        else route();
    }

    $('#login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const u = $('#login-user').value.trim();
        const p = $('#login-pass').value;
        $('#login-pass').value = '';
        if (!u || !p) { $('#login-error').classList.remove('hidden'); return; }
        $('#login-error').classList.add('hidden');
        state.user = { name: u.toUpperCase() === D.user.warrant ? D.user.name : u.toUpperCase(), warrant: u.toUpperCase() };
        store.set(state.user);
        setMsg('success', 'Signed in', `Welcome, ${state.user.name}. You are working in the training environment.`);
        showApp();
    });

    $('#logout-btn').addEventListener('click', () => {
        store.clear();
        state.user = null; state.openTabs = []; state.seen.clear(); state.search = null; state.msg = null;
        $('#user-menu').classList.add('hidden');
        history.replaceState(null, '', location.pathname);
        showLogin();
    });

    // ======================================================
    // Rail / side menu
    // ======================================================
    const MENU = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dash', href: '#/dashboard' },
        { id: 'search', label: 'Search', icon: 'search', href: '#/results', sub: [['Search results', '#/results'], ['Create person record', '#/new']] },
        { id: 'shared', label: 'Shared Searches', icon: 'share', href: '#/shared', sub: ["You've shared", 'Shared with you', 'Shared search history', 'Group shares'] },
        { id: 'saved', label: 'Saved Searches', icon: 'star', href: '#/saved' },
        { id: 'alerts', label: 'Alerts', icon: 'alert', href: '#/alerts', sub: ['Create alerts', 'Manage alerts'] },
        { id: 'tasks', label: 'Tasks', icon: 'tasks', href: '#/tasks' },
        { id: 'reports', label: 'Reports', icon: 'report', href: '#/reports', sub: ['Create reports', 'Existing reports', 'Scheduled reports', 'Report history'] },
        { id: 'dataviz', label: 'Data Visualisations', icon: 'chart', href: '#/dataviz' },
        { id: 'maps', label: 'Mapping', icon: 'globe', href: '#/maps' },
        { id: 'profile', label: 'My Profile', icon: 'user', href: '#/profile' },
        { id: 'settings', label: 'Settings', icon: 'cog', href: '#/settings' },
        { id: 'help', label: 'Help', icon: 'help', href: '#/help' }
    ];

    function renderRail(activeId) {
        $('#rail-items').innerHTML = MENU.map((m) => `
            <button class="rail__item ${m.id === activeId ? 'active' : ''}" data-go="${m.href}" data-menu="${m.id}" title="${esc(m.label)}">
                ${icon(m.icon)}<span class="rail__label">${esc(m.label)}</span>
                ${m.sub ? `<span class="rail__label" style="margin-left:auto">${icon('chev-down')}</span>` : ''}
            </button>
            ${m.sub ? `<div class="rail__sub ${m.id === activeId ? 'show' : ''}">${m.sub.map((s) => Array.isArray(s) ? `<button data-go="${s[1]}">${esc(s[0])}</button>` : `<button data-go="${m.href}">${esc(s)}</button>`).join('')}</div>` : ''}
        `).join('');
    }

    const rail = $('#rail');
    $('#menu-toggle').addEventListener('click', () => rail.classList.toggle('open'));
    $('#rail-compress').addEventListener('click', () => rail.classList.remove('open'));

    // ======================================================
    // Global clicks: [data-go] navigation, dismissers, dropdowns
    // ======================================================
    document.addEventListener('click', (e) => {
        const go = e.target.closest('[data-go]');
        if (go) {
            e.preventDefault();
            navigate(go.dataset.go);
            $('#user-menu').classList.add('hidden');
            if (window.innerWidth <= 820) rail.classList.remove('open');
            return;
        }
        const dis = e.target.closest('[data-dismiss]');
        if (dis) {
            const t = document.getElementById(dis.dataset.dismiss);
            if (t) t.remove();
            if (dis.dataset.dismiss === 'msgbar') state.msg = null;
            return;
        }
        if (e.target.closest('#user-btn')) { $('#user-menu').classList.toggle('hidden'); return; }
        if (!e.target.closest('#user-menu')) $('#user-menu').classList.add('hidden');
        // re-rendered wizard buttons are detached by now, so ignore those
        if (e.target.isConnected && !e.target.closest('#quick-search')) closeAdvanced();
    });

    // ---------- Theme ----------
    function applyTheme(t) {
        document.documentElement.dataset.theme = t;
        try { localStorage.setItem('rms-theme', t); } catch (_) { }
        $('#theme-btn-label').textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
    }
    $('#theme-btn').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
    $('#reset-btn').addEventListener('click', () => {
        if (confirm('Reset all training data? Your edits, notes and new records in this browser will be lost.')) db.reset();
    });

    $('#notif-btn').addEventListener('click', () => { navigate('#/alerts'); });

    // ======================================================
    // Message bar
    // ======================================================
    function setMsg(kind, title, text) { state.msg = { kind, title, text }; }
    function renderMsg() {
        const slot = $('#msgbar-slot');
        if (!state.msg) { slot.innerHTML = ''; return; }
        const m = state.msg;
        const ic = m.kind === 'success' ? 'thumb' : m.kind === 'warn' ? 'alert' : 'info';
        slot.innerHTML = `<div class="msgbar msgbar--${m.kind}" id="msgbar" role="status">
            ${icon(ic)}<strong>${esc(m.title)}</strong><span>${esc(m.text)}</span>
            <button class="close" data-dismiss="msgbar" aria-label="Dismiss">${icon('close')}</button></div>`;
        // a message shows once, then clears on the next navigation
        state.msg = null;
    }

    function toast(text) {
        const t = document.createElement('div');
        t.className = 'toast'; t.textContent = text;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2200);
    }

    // ======================================================
    // Search
    // ======================================================
    function matches(r, text, crit) {
        if (crit) {
            const c = crit;
            if (c.first && !r.first?.toLowerCase().startsWith(c.first.toLowerCase())) return false;
            if (c.last && !r.last?.toLowerCase().startsWith(c.last.toLowerCase())) return false;
            if (c.sex && r.sex !== c.sex) return false;
            if (c.dob && r.dob !== c.dob) return false;
            if (c.sources?.length && !c.sources.includes(r.source)) return false;
        }
        if (!text) return true;
        const hay = [r.name, r.first, r.last, r.pncId, r.dob, r.model, r.make, r.town, r.postcode, r.area, r.category,
            ...(r.address || [])].filter(Boolean).join(' ').toLowerCase();
        return text.toLowerCase().split(/[\s,]+/).filter(Boolean).every((tok) => hay.includes(tok));
    }

    function runSearch(type, text, criteria) {
        let recs = allRecords();
        if (type && type !== 'all') recs = recs.filter((r) => r.kind === type);
        const results = recs.filter((r) => matches(r, text, criteria)).sort((a, b) => b.prob - a.prob);
        const st = nowStamp();
        resultsFilter.kinds.clear(); resultsFilter.sources.clear();
        state.search = { type, text, criteria, results, when: st, showAll: false };

        // user flow: one / list / too many / none
        if (results.length === 0) {
            setMsg('info', 'No results', 'No records matched your search. Try fewer terms, check spelling, or use Advanced search.');
            navigate('#/results');
        } else if (results.length === 1) {
            setMsg('success', 'One match', 'A single record matched, so it has been opened for you.');
            openRecord(results[0].id);
        } else {
            navigate('#/results');
        }
    }

    $('#quick-search').addEventListener('submit', (e) => {
        e.preventDefault();
        closeAdvanced();
        runSearch($('#qs-type').value, $('#qs-text').value.trim(), null);
    });

    // ---------- Advanced search wizard ----------
    const adv = { step: 1, where: ['PNC', 'Intel', 'Investigation', 'Custody'], crit: {} };
    const SOURCES = ['PNC', 'Intel', 'Investigation', 'Prosecution', 'Custody', 'DVLA', 'PND', 'VOTERS'];

    function openAdvanced() { adv.step = 1; renderAdvanced(); $('#adv-panel').classList.remove('hidden'); }
    function closeAdvanced() { $('#adv-panel').classList.add('hidden'); }
    $('#adv-toggle').addEventListener('click', () => $('#adv-panel').classList.contains('hidden') ? openAdvanced() : closeAdvanced());

    function renderAdvanced() {
        const s = adv.step;
        const stepCls = (n) => n === s ? 'on' : n < s ? 'done' : '';
        let body = '';
        if (s === 1) {
            body = `<h4>Data sources to search</h4><div class="checks">${SOURCES.map((src) =>
                `<label><input type="checkbox" value="${src}" ${adv.where.includes(src) ? 'checked' : ''}> ${src}</label>`).join('')}</div>`;
        } else if (s === 2) {
            const c = adv.crit;
            body = `<h4>Person details</h4>
                <div class="grid3">
                    <input class="input" data-k="first" placeholder="First name..." value="${esc(c.first)}">
                    <input class="input" data-k="last" placeholder="Surname..." value="${esc(c.last)}">
                    <input class="input" data-k="dob" placeholder="Date of birth (dd/mm/yyyy)" value="${esc(c.dob)}">
                    <select class="select" data-k="sex"><option value="">Sex...</option>
                        ${['Male', 'Female'].map((v) => `<option ${c.sex === v ? 'selected' : ''}>${v}</option>`).join('')}</select>
                    <select class="select" data-k="height"><option value="">Height...</option><option>Under 5 ft 6</option><option>5 ft 6 - 6 ft</option><option>Over 6 ft</option></select>
                    <select class="select" data-k="eth"><option value="">Ethnicity...</option><option>White</option><option>Black</option><option>Asian</option><option>Other</option></select>
                </div>
                <h4>Object details</h4>
                <div class="grid3">
                    <input class="input" data-k="obj1" placeholder="Object 1" value="${esc(c.obj1)}">
                    <input class="input" data-k="obj2" placeholder="Object 2" value="${esc(c.obj2)}">
                    <input class="input" data-k="obj3" placeholder="Object 3" value="${esc(c.obj3)}">
                </div>`;
        } else {
            body = `<h4>Authentication and search</h4>
                <p style="font-size:12px;margin:0 0 8px">Record a reason for this search. Searches are audited.</p>
                <div class="grid3">
                    <select class="select" id="adv-reason"><option value="">Reason...</option><option>Ongoing investigation</option><option>Intelligence check</option><option>Safeguarding</option><option>Training</option></select>
                    <input class="input" id="adv-ref" placeholder="CAD / crime reference">
                </div>
                <p style="font-size:11px;color:var(--muted);margin:8px 0 0">Searching ${esc(adv.where.join(', ') || 'no sources')}.</p>`;
        }
        $('#adv-panel').innerHTML = `
            <div class="adv-panel__head">Advanced search <button type="button" id="adv-close" aria-label="Close">${icon('close')}</button></div>
            <div class="steps"><div class="${stepCls(1)}">Step 1 - Where to search</div><div class="${stepCls(2)}">Step 2 - Search criteria</div><div class="${stepCls(3)}">Step 3 - Authentication and search</div></div>
            <div class="adv-body">${body}</div>
            <div class="adv-foot">
                ${s > 1 ? `<button type="button" class="btn btn--grey btn--sm" id="adv-back">${icon('chev-left')} Back</button>` : ''}
                <button type="button" class="btn btn--primary btn--sm" id="adv-next">${s < 3 ? 'Next' : 'Search'} ${icon(s < 3 ? 'chev-right' : 'search')}</button>
            </div>`;

        $('#adv-close').onclick = closeAdvanced;
        if ($('#adv-back')) $('#adv-back').onclick = () => { collectAdv(); adv.step--; renderAdvanced(); };
        $('#adv-next').onclick = () => {
            collectAdv();
            if (s < 3) { adv.step++; renderAdvanced(); return; }
            if (!$('#adv-reason').value) { $('#adv-reason').focus(); toast('Select a reason for the search'); return; }
            closeAdvanced();
            const c = adv.crit;
            $('#qs-text').value = [c.first, c.last].filter(Boolean).join(' ');
            runSearch('person', '', { first: c.first, last: c.last, sex: c.sex, dob: c.dob, sources: adv.where });
        };
    }

    function collectAdv() {
        if (adv.step === 1) adv.where = $$('#adv-panel .checks input:checked').map((i) => i.value);
        if (adv.step === 2) $$('#adv-panel [data-k]').forEach((el) => { adv.crit[el.dataset.k] = el.value.trim(); });
    }

    // ======================================================
    // Record tabs
    // ======================================================
    function openRecord(id) {
        if (!state.openTabs.includes(id)) state.openTabs.push(id);
        state.seen.add(id);
        state.editing = null;
        navigate('#/record/' + id);
    }

    function closeTab(id) {
        state.openTabs = state.openTabs.filter((t) => t !== id);
        if (location.hash.startsWith('#/record/' + id)) {
            const last = state.openTabs[state.openTabs.length - 1];
            navigate(last ? '#/record/' + last : '#/results');
        } else route();
    }

    function tabsHtml(activeId) {
        const s = state.search;
        const resultsTab = `<button class="rtab results ${!activeId ? 'active' : ''}" data-go="#/results">
            ${icon('tasks')}<small>Search</small><span class="n">Results</span></button>`;
        const tabs = state.openTabs.map((id) => {
            const r = findRecord(id);
            if (!r) return '';
            return `<button class="rtab ${id === activeId ? 'active' : ''}" data-go="#/record/${id}">
                <small>${esc(r.source)}</small><span class="n">${esc(r.name || 'New record')}</span>
                <span class="x" data-close-tab="${id}" title="Close">${icon('close')}</span></button>`;
        }).join('');
        let summary;
        if (activeId) {
            const r = findRecord(activeId);
            const st = nowStamp();
            summary = `<div class="rsummary rec"><b>Record summary</b><span>Date opened: ${st.date}</span><span>Time opened: ${st.time}</span>${r.pncId ? `<span>PNCid: ${esc(r.pncId)}</span>` : ''}</div>`;
        } else if (s) {
            const shown = s.showAll ? s.results.length : Math.min(PAGE_SIZE, s.results.length);
            summary = `<div class="rsummary"><b>Search summary</b><span>Date searched: ${s.when.date}</span><span>Time searched: ${s.when.time}</span>
                <span>Displaying: ${shown}/${s.results.length}</span><span>Query: ${esc(s.text || describeCrit(s.criteria) || 'All')}</span></div>`;
        } else summary = `<div class="rsummary"><b>No search yet</b><span>Use the search bar above to begin.</span></div>`;
        return `<div class="rtabs">${resultsTab}${tabs}</div>${summary}`;
    }

    function describeCrit(c) {
        if (!c) return '';
        return [c.first && 'First: ' + c.first, c.last && 'Last: ' + c.last, c.sex, c.dob].filter(Boolean).join(', ');
    }

    // ======================================================
    // Views
    // ======================================================
    function panel(title, body, opts = {}) {
        const ic = opts.icon ? `<span class="tl-icon ${opts.iconBg || ''}">${icon(opts.icon)}</span>` : '';
        const tools = opts.tools !== false ? `<div class="panel__tools">
            ${opts.edit ? `<button title="Edit" data-edit="${opts.edit}">${icon('edit')}</button>` : opts.add ? '' : `<button title="Link" data-act="link">${icon('link')}</button><button title="Expand" data-act="expand">${icon('expand')}</button>`}
            <button title="Collapse" data-act="collapse">${icon('chev-up', 'chev')}</button></div>` : '';
        return `<section class="panel ${opts.cls || ''}">
            <div class="panel__head">${ic}<span>${esc(title)}</span>${tools}</div>
            <div class="panel__body">${body}</div></section>`;
    }

    const kvTable = (rows, cls = '') => `<table class="kv ${cls}"><tbody>${rows.map(([k, v]) => {
        const none = v === null || v === undefined || v === '';
        return `<tr><th>${esc(k)}</th><td class="${none ? 'none' : ''}">${none ? 'None held' : esc(v).replace(/\n/g, '<br>')}</td></tr>`;
    }).join('')}</tbody></table>`;

    // ---------- Dashboard ----------
    const TL_STYLE = {
        report: { icon: 'report', bg: 'bg-ink' }, crime: { icon: 'alert', bg: 'bg-red' }, rotl: { icon: 'alert', bg: 'bg-red' },
        misper: { icon: 'person', bg: 'bg-sky' }, task: { icon: 'tasks', bg: 'bg-green' }
    };

    function viewDashboard() {
        const open = D.tasks.filter((t) => !t.done).length;
        const stats = [
            { n: D.alerts.length, label: 'New Alerts', link: 'View alerts', href: '#/alerts', icon: 'bell', bg: 'bg-red' },
            { n: open, label: 'New Tasks', link: 'View tasks', href: '#/tasks', icon: 'tasks', bg: 'bg-green' },
            { n: 1, label: 'New Report', link: 'View reports', href: '#/reports', icon: 'report', bg: 'bg-ink' },
            { n: D.sharedSearches.length, label: 'Shared Searches', link: 'View shared searches', href: '#/shared', icon: 'share', bg: 'bg-sky' }
        ];
        const tl = D.timeline.map((ev) => {
            const st = TL_STYLE[ev.kind];
            let body = `<div class="panel__sub">${esc(ev.sub)}<time>${esc(ev.time)}</time></div>`;
            if (ev.kind === 'report') {
                body += `<div class="thumbs">${['Report', 'Report', 'Report'].map((l) => `<figure><div class="doc"></div>${l}</figure>`).join('')}</div>`;
            } else if (ev.rows) body += kvTable(ev.rows);
            if (ev.person) body += `<div style="margin-top:8px"><a href="#" data-open="${ev.person}">View record ${icon('chev-right')}</a></div>`;
            return panel(ev.title, body, { icon: st.icon, iconBg: st.bg });
        });
        // alternate the cards across the two timeline columns
        const left = tl.filter((_, i) => i % 2 === 0).join(''), right = tl.filter((_, i) => i % 2 === 1).join('');

        const taskList = `<div class="panel__sub">Latest ${Math.min(5, D.tasks.length)} tasks</div><ul class="tasks-list">${D.tasks.slice(0, 5).map((t, i) => `
            <li class="${i === 0 ? 'hl' : ''} ${t.done ? 'done' : ''}"><span class="dot"></span>
                <div><div class="t">${esc(t.title)}</div><div class="m">Tasked by: ${esc(t.by)}</div><a href="#/tasks" style="font-size:11px">View task ${icon('chev-right')}</a></div>
                <label>Complete <input type="checkbox" data-task="${t.id}" ${t.done ? 'checked' : ''}></label></li>`).join('')}</ul>`;

        return `
            <div class="stats">${stats.map((s) => `<div class="stat"><div class="stat__icon ${s.bg}">${icon(s.icon)}</div>
                <div class="stat__text"><div>${s.n} ${esc(s.label)}</div><a href="${s.href}">${esc(s.link)} ${icon('chev-right')}</a></div></div>`).join('')}</div>
            <div class="dash">
                <div>
                    <h2 class="page-title">Timeline <small>${D.timeline.length} events</small></h2>
                    <div class="timeline-filter"><select class="select" style="width:auto;height:28px;font-size:12px" aria-label="Timeline range">
                        <option>Last 24 hours</option><option>Last 7 days</option><option>Last 30 days</option></select></div>
                    <div class="timeline"><div>${left}</div><div>${right}</div></div>
                </div>
                <div>
                    <h2 class="page-title">My MetSearch</h2>
                    ${panel('Heat Map', `<div class="panel__sub">Hackney two mile radius</div>${heatmapSvg()}`, { cls: 'panel--sky' })}
                    ${panel('Tasks', taskList, { cls: 'panel--sky' })}
                </div>
            </div>`;
    }

    // Stylised street map + hotspots. Placeholder for a real mapping layer.
    function heatmapSvg() {
        const spots = [[210, 140, 60], [150, 90, 34], [270, 95, 30], [110, 175, 28], [300, 200, 26], [190, 60, 22], [60, 110, 22], [240, 230, 20], [330, 60, 18]];
        const roads = ['M0 40 L400 70', 'M0 150 Q200 120 400 170', 'M40 0 L120 300', 'M200 0 L215 300', 'M330 0 L280 300', 'M0 240 L400 210', 'M0 90 Q150 200 400 110'];
        return `<svg class="heatmap" viewBox="0 0 400 280" role="img" aria-label="Crime heat map">
            <defs><radialGradient id="hm"><stop offset="0" stop-color="#e2321f" stop-opacity=".95"/><stop offset=".55" stop-color="#ef5a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ef5a2a" stop-opacity="0"/></radialGradient></defs>
            <rect width="400" height="280" fill="#ece8df"/>
            <path d="M0 255 C90 230 140 270 220 250 S360 225 400 245 L400 280 L0 280z" fill="#a9cbe3"/>
            <rect x="250" y="120" width="55" height="40" fill="#cfe3bf" rx="4"/><rect x="40" y="200" width="45" height="30" fill="#cfe3bf" rx="4"/>
            ${roads.map((d) => `<path d="${d}" stroke="#fff" stroke-width="6" fill="none"/><path d="${d}" stroke="#f5d27a" stroke-width="2.5" fill="none"/>`).join('')}
            ${spots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#hm)"/>`).join('')}
        </svg>`;
    }

    // ---------- Results ----------
    function ringHtml(p) {
        const r = 24, c = 2 * Math.PI * r;
        return `<div class="ring" title="Match probability"><svg width="56" height="56"><circle cx="28" cy="28" r="${r}" fill="none" style="stroke:var(--line-soft)" stroke-width="3"/>
            <circle cx="28" cy="28" r="${r}" fill="none" stroke="#1e7fd0" stroke-width="3" stroke-dasharray="${(p / 100) * c} ${c}"/></svg>
            <span>${p}<sup>%</sup></span></div>`;
    }

    function resultDetails(r) {
        const pair = (k, v) => `<div>${esc(k)}: <span>${esc(v || '-')}</span></div>`;
        if (r.kind === 'person') return pair('Date of birth (age)', `${r.dob} (${ageFrom(r.dob)})`) + pair('Gender', r.sex) + pair('Birthplace', r.birthplace) + pair('Ethnicity', r.ethnicity) + pair('PNC id', r.pncId) + pair('Town', r.address?.[r.address.length - 1]);
        if (r.kind === 'object') return pair('Type', r.type) + pair('Make', r.make) + pair('Model', r.model) + pair('Colour', r.colour) + pair('Keeper postcode', r.keeper);
        if (r.kind === 'location') return pair('Type', r.type) + pair('Address line 1', r.name) + pair('Town/City', r.town) + pair('Postcode', r.postcode);
        return pair('Category', r.category) + pair('Scale', r.scale) + pair('Date', r.date) + pair('Time', r.time) + pair('Area', r.area);
    }

    const resultsFilter = { kinds: new Set(), sources: new Set() };

    function viewResults() {
        const s = state.search;
        let body;
        if (!s) {
            body = `<div class="empty">Start a search using the bar above, or open <a href="#" id="open-adv">Advanced search</a>.</div>`;
        } else {
            let list = s.results;
            if (resultsFilter.kinds.size) list = list.filter((r) => resultsFilter.kinds.has(r.kind));
            if (resultsFilter.sources.size) list = list.filter((r) => resultsFilter.sources.has(r.source));
            const tooMany = list.length > PAGE_SIZE && !s.showAll;
            const shown = tooMany ? list.slice(0, PAGE_SIZE) : list;
            const kinds = ['person', 'object', 'location', 'event'];
            const srcs = [...new Set(s.results.map((r) => r.source))].sort();
            const count = (fn) => s.results.filter(fn).length;

            const refine = `<aside class="refine" id="refine">
                <div class="refine__head">${icon('filter')} Refine results</div>
                <fieldset><legend>Data type</legend>${kinds.map((k) => `<label><input type="checkbox" data-fk="${k}" ${resultsFilter.kinds.has(k) ? 'checked' : ''}> ${k[0].toUpperCase() + k.slice(1)} (${count((r) => r.kind === k)})</label>`).join('')}</fieldset>
                <fieldset><legend>Data source</legend>${srcs.map((x) => `<label><input type="checkbox" data-fs="${x}" ${resultsFilter.sources.has(x) ? 'checked' : ''}> ${esc(x)} (${count((r) => r.source === x)})</label>`).join('')}</fieldset>
                <fieldset><legend>Person filters</legend>
                    <div class="row">First name<input class="input" id="rf-first" value="${esc(s.criteria?.first || '')}"></div>
                    <div class="row">Surname<input class="input" id="rf-last" value="${esc(s.criteria?.last || '')}"></div>
                    <button class="btn btn--primary btn--sm" id="rf-apply" style="width:100%">Re-search</button>
                </fieldset></aside>`;

            const rows = shown.map((r, i) => `
                <article class="result ${state.seen.has(r.id) ? 'seen' : ''}">
                    <div class="result__main" data-open="${r.id}">
                        <div>${i + 1}</div>
                        <div class="result__type" title="${r.kind}">${icon(TYPE_ICON[r.kind])}</div>
                        <div class="result__name">${esc(r.name)}</div>
                        <div class="result__details">${resultDetails(r)}</div>
                        <div>${ringHtml(r.prob)}</div>
                    </div>
                    <div class="result__foot">Ext. data sources <span class="src">${esc(r.source)} ${icon('chev-right')}</span></div>
                    <button class="btn btn--dark btn--sm result__open" data-open="${r.id}">${state.seen.has(r.id) ? `Seen ${icon('eye')}` : `Open ${icon('folder')}`}</button>
                </article>`).join('');

            const notice = tooMany ? `<div class="notice">${icon('alert')}<span><strong>Beware.</strong> MetSearch is displaying the first ${PAGE_SIZE} results of ${list.length}. Refine your search, or <a href="#" id="show-all">show all</a>.</span></div>` : '';

            body = `<button class="btn filter-toggle" id="filter-toggle">${icon('filter')} Refine results</button>
                <div class="results-layout">${refine}<div>
                ${notice}
                ${shown.length ? `<div class="rlist-head"><span>#</span><span>Type</span><button data-sort="name">Name ${icon('sort')}</button><span>Details</span><button data-sort="prob">Probability ${icon('sort')}</button></div>${rows}`
                    : `<div class="empty">No records to show. ${s.results.length ? 'Clear some filters.' : 'Try a different search.'}</div>`}
                </div></div>`;
        }
        return `${tabsHtml(null)}<h1 class="page-title page-title--row">Search results <button class="btn btn--primary btn--sm" data-go="#/new">${icon('plus')} Create person record</button></h1>${body}`;
    }

    // ---------- Record ----------
    const SECTIONS = [
        ['summary', 'Summary', 'report'], ['alerts', 'Alerts and Markers', 'alert'], ['notes', 'Notes', 'edit'], ['firearms', 'Firearms Certificates', 'shield'],
        ['history', 'Record History', 'clock'], ['family', 'Family', 'user'], ['associates', 'Associates', 'share'],
        ['intel', 'Intel', 'report'], ['investigation', 'Investigation', 'search'], ['prosecutions', 'Prosecutions', 'report'], ['custody', 'Custody', 'folder']
    ];

    // Editable field sets. `path` is where the value lives on the record;
    // 'description.x' writes into the nested description object.
    const FIELDS = {
        ident: [
            { k: 'first', label: 'First name' }, { k: 'last', label: 'Surname' },
            { k: 'dob', label: 'Date of birth', ph: 'dd/mm/yyyy' }, { k: 'birthplace', label: 'Birthplace' },
            { k: 'sex', label: 'Sex', options: ['Male', 'Female', 'Unknown'] }, { k: 'ethnicity', label: 'Ethnicity' },
            { k: 'source', label: 'Source', options: ['PNC', 'Intel', 'Investigation', 'Custody', 'Prosecution'] },
            { k: 'pncId', label: 'PNC id' }, { k: 'croId', label: 'CRO id' }, { k: 'alias', label: 'Alias' },
            { k: 'address', label: 'Address', multi: true }
        ],
        desc: [
            { k: 'description.hair', label: 'Hair' }, { k: 'description.build', label: 'Build' },
            { k: 'description.eyes', label: 'Eye colour' }, { k: 'description.height', label: 'Height' },
            { k: 'description.marks', label: 'Marks and scars', multi: true }
        ]
    };
    const MARKER_GROUPS = [['alerts', 'Alerts', 'tag--red'], ['warnings', 'Warning signals', 'tag--amber'], ['markers', 'Information markers', 'tag--sky']];

    const getPath = (r, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), r);
    function setPath(r, path, v) {
        const keys = path.split('.');
        const last = keys.pop();
        const obj = keys.reduce((o, k) => (o[k] = o[k] || {}), r);
        obj[last] = v;
    }

    function editForm(key, fields, r) {
        const inputs = fields.map((f) => {
            let v = getPath(r, f.k);
            if (Array.isArray(v)) v = v.join('\n');
            const control = f.options
                ? `<select class="select" data-f="${f.k}">${f.options.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
                : f.multi ? `<textarea class="input" rows="3" data-f="${f.k}">${esc(v)}</textarea>`
                    : `<input class="input" data-f="${f.k}" value="${esc(v)}" placeholder="${esc(f.ph || '')}">`;
            return `<label class="form-row"><span>${esc(f.label)}</span>${control}</label>`;
        }).join('');
        return `<form class="edit-form" data-save="${key}">${inputs}
            <div class="form-actions"><button type="button" class="btn btn--sm" data-cancel-edit>Cancel</button><button class="btn btn--primary btn--sm">Save changes</button></div></form>`;
    }

    // record changes go into Record History as an audit trail
    function audit(r, type, detail) {
        r.history = r.history || [];
        r.history.unshift({ date: nowStamp().date, type, detail: `${detail} - ${state.user.name}` });
    }

    function viewRecord(id, section = 'summary') {
        const r = findRecord(id);
        if (!r) return `${tabsHtml(null)}<div class="empty">Record ${esc(id)} not found.</div>`;
        if (!state.openTabs.includes(id)) state.openTabs.push(id);
        state.seen.add(id);

        if (r.kind !== 'person') {
            const fields = Object.keys(r).filter((k) => !['id', 'kind', 'prob', 'history'].includes(k)).map((k) => ({ k, label: k[0].toUpperCase() + k.slice(1) }));
            const body = state.editing === 'details' ? editForm('details', fields, r) : kvTable(fields.map((f) => [f.label, r[f.k]]), 'kv--lg');
            return `${tabsHtml(id)}<div class="rec-head"><h1>${esc(r.name)}</h1><span class="tag tag--ink">${esc(r.source)}</span><span class="tag tag--blue">${esc(r.kind)}</span></div>
                <div style="max-width:640px">${panel('Details', body, { edit: 'details' })}</div>`;
        }

        const tags = (list, cls) => (list || []).map((t) => `<span class="tag ${cls}">${esc(t)}</span>`).join('');
        const age = /^\d{2}\/\d{2}\/\d{4}$/.test(r.dob || '') ? `<span class="age">(${ageFrom(r.dob)} years old)</span>` : '';
        const head = `<div class="rec-head">
            <h1>${esc(displayName(r).trim() || 'New record')}</h1>${age}
            <span class="tag tag--ink">${esc(r.source)}</span>${r.alias ? `<span class="tag tag--sky">Alias: ${esc(r.alias)}</span>` : ''}
            ${MARKER_GROUPS.map(([k, , cls]) => tags(r[k], cls)).join('')}
            <span style="margin-left:auto;display:flex;gap:6px"><button class="btn btn--sm" data-act="print">Print</button><button class="btn btn--sm" data-act="share">${icon('share')} Share</button></span></div>`;

        const nav = `<nav class="rec-nav">${SECTIONS.map(([k, label, ic]) => {
            const n = k === 'alerts' ? (r.alerts || []).length : k === 'notes' ? (r.notes || []).length : 0;
            const badge = n ? `<span class="badge ${k === 'notes' ? 'badge--blue' : ''}">${n}</span>` : '';
            return `<button class="${k === section ? 'active' : ''}" data-go="#/record/${id}/${k}">${icon(ic)}${esc(label)} ${badge}${icon('chev-right', 'chev-r')}</button>`;
        }).join('')}</nav>`;

        return `${tabsHtml(id)}${head}<div class="rec-layout">${nav}${recordSection(r, section)}</div>`;
    }

    function linkedPeople(r, rel) {
        const ids = r[rel] || [];
        const rows = ids.map((pid) => {
            const p = findRecord(pid);
            return p ? `<tr><th><a href="#" data-open="${p.id}">${esc(displayName(p))}</a></th><td>${esc(p.dob)} - ${esc(p.source)} ${esc(p.pncId)}</td>
                <td class="row-act"><button class="icon-btn" title="Remove link" data-unlink="${rel}|${p.id}">${icon('x')}</button></td></tr>` : '';
        }).join('');
        const options = D.people.filter((p) => p.id !== r.id && !ids.includes(p.id) && (p.first || p.last))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => `<option value="${p.id}">${esc(p.name)} (${esc(p.dob)})</option>`).join('');
        return `${rows ? `<table class="kv kv--lg"><tbody>${rows}</tbody></table>` : `<div class="empty">None recorded.</div>`}
            <form class="inline-form" data-link="${rel}"><select class="select" name="person"><option value="">Link a person...</option>${options}</select>
            <button class="btn btn--primary btn--sm">${icon('link')} Link</button></form>`;
    }

    function recordSection(r, section) {
        const d = r.description || {};
        const wrap = (inner) => `<div class="rec-col-wide">${inner}</div>`;
        switch (section) {
            case 'summary': {
                const ident = state.editing === 'ident' ? editForm('ident', FIELDS.ident, r)
                    : kvTable([['Date of birth', r.dob], ['Birthplace', r.birthplace], ['Sex', r.sex], ['Ethnicity', r.ethnicity], ['PNC id', r.pncId], ['CRO id', r.croId], ['Address', (r.address || []).join('\n')]], 'kv--lg');
                const desc = state.editing === 'desc' ? editForm('desc', FIELDS.desc, r)
                    : kvTable([['Hair', d.hair], ['Build', d.build], ['Eye colour', d.eyes], ['Height', d.height], ['Marks and scars', d.marks]], 'kv--lg');
                const sil = `<svg viewBox="0 0 100 110"><use href="#i-silhouette"/></svg>`;
                const images = `<div class="panel__sub" style="font-weight:400;color:var(--muted)">${icon('info')} Placeholder images - no photographs held in training data</div>
                    <div class="mugs">${['Front', 'Profile'].map((v) => `<div class="mug"><div class="ph">${sil}</div><dl><dt>Type</dt><dd>Custody - ${v}</dd><dt>Date</dt><dd>${esc(r.dob)}</dd></dl></div>`).join('')}</div>`;
                const warn = (r.warnings || []).length ? kvTable(r.warnings.map((w) => [w, 'Recorded - check before approach'])) : `<div class="empty">No warning signals recorded.</div>`;
                return `<div>${panel('Identification', ident, { edit: 'ident' })}${panel('Description', desc, { edit: 'desc' })}</div>
                    <div>${panel('Images', images, { add: true })}${panel('Warning Signals', warn + `<div style="margin-top:8px"><a href="#/record/${r.id}/alerts">Manage alerts and markers ${icon('chev-right')}</a></div>`, { add: true })}</div>`;
            }
            case 'alerts': {
                const groups = MARKER_GROUPS.map(([k, label, cls]) => `<div class="marker-group"><h4>${esc(label)}</h4>
                    ${(r[k] || []).length ? (r[k]).map((t, i) => `<span class="tag ${cls} tag--removable">${esc(t)}<button title="Remove" data-del-marker="${k}|${i}">${icon('x')}</button></span>`).join(' ') : '<span class="muted">None</span>'}</div>`).join('');
                const form = `<form class="inline-form" data-add-marker><select class="select" name="group">${MARKER_GROUPS.map(([k, label]) => `<option value="${k}">${esc(label)}</option>`).join('')}</select>
                    <input class="input" name="text" placeholder="e.g. Violent, Weapons, Drugs" required><button class="btn btn--primary btn--sm">${icon('plus')} Add</button></form>`;
                return wrap(panel('Alerts and Markers', groups + form, { add: true }));
            }
            case 'notes': {
                const notes = (r.notes || []).map((n, i) => `<div class="note"><div class="note__meta">${esc(n.by)} - ${esc(n.at)}<button class="icon-btn" title="Delete note" data-del-note="${i}">${icon('x')}</button></div><div>${esc(n.text).replace(/\n/g, '<br>')}</div></div>`).join('');
                const form = `<form class="note-form" data-add-note><textarea class="input" name="text" rows="3" placeholder="Add a note to this record..." required></textarea>
                    <div class="form-actions"><button class="btn btn--primary btn--sm">${icon('plus')} Add note</button></div></form>`;
                return wrap(panel('Notes', form + (notes || `<div class="empty">No notes yet.</div>`), { add: true }));
            }
            case 'history': {
                const rows = (r.history || []).map((h, i) => `<tr><td>${esc(h.date)}</td><td>${esc(h.type)}</td><td>${esc(h.detail)}</td>
                    <td class="row-act"><button class="icon-btn" title="Delete entry" data-del-hist="${i}">${icon('x')}</button></td></tr>`).join('');
                const form = `<form class="inline-form" data-add-hist><input class="input" name="date" placeholder="dd/mm/yyyy" value="${nowStamp().date}" style="max-width:120px">
                    <select class="select" name="type" style="max-width:150px">${['Arrest', 'Charge', 'Conviction', 'Caution', 'Custody', 'Stop', 'Intel', 'Other'].map((t) => `<option>${t}</option>`).join('')}</select>
                    <input class="input" name="detail" placeholder="Detail" required><button class="btn btn--primary btn--sm">${icon('plus')} Add</button></form>`;
                return wrap(panel('Record History', (rows
                    ? `<table class="simple-table"><thead><tr><th>Date</th><th>Type</th><th>Detail</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
                    : `<div class="empty">No history recorded.</div>`) + form, { add: true }));
            }
            case 'family': return wrap(panel('Family', linkedPeople(r, 'family'), { add: true }));
            case 'associates': return wrap(panel('Associates', linkedPeople(r, 'associates'), { add: true }));
            default: {
                const label = SECTIONS.find(([k]) => k === section)?.[1] || section;
                return wrap(panel(label, `<div class="empty">No ${esc(label.toLowerCase())} held for this nominal in the training data.</div>`, { add: true }));
            }
        }
    }

    // New blank person; opens straight into the identification edit form.
    function createPerson() {
        const n = D.people.filter((p) => p.id.startsWith('N')).length + 1;
        let id = 'N' + n;
        while (rawRecord(id)) id = 'N' + Math.floor(Math.random() * 1e6);
        D.people.unshift({
            id, source: 'PNC', name: '', first: '', last: '', dob: '', sex: 'Unknown', ethnicity: '', birthplace: '',
            pncId: '', croId: '', address: [], alerts: [], warnings: [], markers: [], description: {}, history: [], notes: [],
            associates: [], family: [], prob: 100
        });
        audit(rawRecord(id), 'Created', 'Record created');
        db.save();
        state.openTabs.push(id);
        state.editing = 'ident';
        history.replaceState(null, '', '#/record/' + id);
        route();
    }

    // ---------- Record edit handlers (delegated from #view) ----------
    function currentRecord() {
        const m = location.hash.match(/^#\/record\/([^/]+)/);
        return m ? rawRecord(m[1]) : null;
    }

    function handleRecordSubmit(form) {
        const r = currentRecord();
        if (!r) return;
        const val = (name) => (form.elements[name]?.value || '').trim();
        if (form.dataset.save) {
            const key = form.dataset.save;
            $$('[data-f]', form).forEach((el) => {
                const f = el.dataset.f;
                let v = el.value.trim();
                if (f === 'address') v = v.split('\n').map((x) => x.trim()).filter(Boolean);
                setPath(r, f, v);
            });
            if (r.first !== undefined) r.name = [r.last, r.first].filter(Boolean).join(', ');
            audit(r, 'Update', `${{ ident: 'Identification', desc: 'Description', details: 'Details' }[key]} updated`);
            state.editing = null;
            toast('Record saved');
        } else if (form.hasAttribute('data-add-marker')) {
            const g = val('group'), t = val('text');
            if (!t) return;
            r[g] = r[g] || [];
            r[g].push(t);
            audit(r, 'Update', `${MARKER_GROUPS.find(([k]) => k === g)[1]} added: ${t}`);
        } else if (form.hasAttribute('data-add-note')) {
            const t = val('text');
            if (!t) return;
            const st = nowStamp();
            r.notes = r.notes || [];
            r.notes.unshift({ text: t, by: state.user.name, at: `${st.date} ${st.time}` });
        } else if (form.hasAttribute('data-add-hist')) {
            if (!val('detail')) return;
            r.history = r.history || [];
            r.history.unshift({ date: val('date'), type: val('type'), detail: val('detail') });
        } else if (form.dataset.link) {
            const rel = form.dataset.link, other = rawRecord(val('person'));
            if (!other) return;
            // links go both ways
            r[rel] = [...new Set([...(r[rel] || []), other.id])];
            other[rel] = [...new Set([...(other[rel] || []), r.id])];
            audit(r, 'Update', `${rel === 'family' ? 'Family member' : 'Associate'} linked: ${other.name}`);
        } else return;
        db.save();
        route();
    }

    function handleRecordClick(t) {
        const r = currentRecord();
        if (!r) return false;
        const hit = (attr) => t.closest(`[${attr}]`);
        let el;
        if ((el = hit('data-edit'))) { state.editing = el.dataset.edit; route(); return true; }
        if (hit('data-cancel-edit')) { state.editing = null; route(); return true; }
        if ((el = hit('data-del-marker'))) {
            const [g, i] = el.dataset.delMarker.split('|');
            const [removed] = r[g].splice(+i, 1);
            audit(r, 'Update', `${MARKER_GROUPS.find(([k]) => k === g)[1]} removed: ${removed}`);
        } else if ((el = hit('data-del-note'))) {
            if (!confirm('Delete this note?')) return true;
            r.notes.splice(+el.dataset.delNote, 1);
        } else if ((el = hit('data-del-hist'))) {
            if (!confirm('Delete this history entry?')) return true;
            r.history.splice(+el.dataset.delHist, 1);
        } else if ((el = hit('data-unlink'))) {
            const [rel, pid] = el.dataset.unlink.split('|');
            const other = rawRecord(pid);
            r[rel] = (r[rel] || []).filter((x) => x !== pid);
            if (other) other[rel] = (other[rel] || []).filter((x) => x !== r.id);
            audit(r, 'Update', `Link removed: ${other ? other.name : pid}`);
        } else return false;
        db.save();
        route();
        return true;
    }

    // ---------- Simple list views ----------
    function viewTasks() {
        return `<h1 class="page-title">Tasks <small>${D.tasks.filter((t) => !t.done).length} open</small></h1>
            <table class="simple-table"><thead><tr><th>Task</th><th>Tasked by</th><th>Due</th><th>Complete</th></tr></thead><tbody>
            ${D.tasks.map((t) => `<tr><td>${esc(t.title)}</td><td>${esc(t.by)}</td><td>${esc(t.due)}</td><td><input type="checkbox" data-task="${t.id}" ${t.done ? 'checked' : ''}></td></tr>`).join('')}</tbody></table>`;
    }
    function viewAlerts() {
        return `<h1 class="page-title">Alerts <small>${D.alerts.length} new</small></h1>
            <table class="simple-table"><thead><tr><th>Level</th><th>Alert</th><th>Time</th></tr></thead><tbody>
            ${D.alerts.map((a) => `<tr><td><span class="tag ${a.level === 'Heightened' ? 'tag--red' : a.level === 'Standard' ? 'tag--blue' : 'tag--amber'}">${esc(a.level)}</span></td><td>${esc(a.title)}</td><td>${esc(a.time)}</td></tr>`).join('')}</tbody></table>`;
    }
    function viewShared() {
        return `<h1 class="page-title">Shared searches <small>${D.sharedSearches.length} shared with you</small></h1>
            <table class="simple-table"><thead><tr><th>Shared by</th><th>Search</th><th>Time</th><th></th></tr></thead><tbody>
            ${D.sharedSearches.map((s, i) => `<tr><td>${esc(s.by)}</td><td>${esc(s.query)}</td><td>${esc(s.time)}</td><td><button class="btn btn--primary btn--sm" data-rerun="${i}">Run search</button></td></tr>`).join('')}</tbody></table>`;
    }
    function viewPlaceholder(id) {
        const m = MENU.find((x) => x.id === id);
        return `<h1 class="page-title">${esc(m ? m.label : 'Not found')}</h1><div class="panel"><div class="empty">This area is part of the prototype but has not been built yet.</div></div>`;
    }

    // ======================================================
    // Router
    // ======================================================
    function route() {
        if (!state.user) return;
        const parts = location.hash.replace(/^#\/?/, '').split('/');
        const [page, a, b] = parts;
        let html, active = page;
        switch (page) {
            case 'dashboard': html = viewDashboard(); break;
            case 'results': html = viewResults(); active = 'search'; break;
            case 'record': html = viewRecord(a, b); active = 'search'; break;
            case 'new': createPerson(); return;
            case 'tasks': html = viewTasks(); break;
            case 'alerts': html = viewAlerts(); break;
            case 'shared': html = viewShared(); break;
            default: html = viewPlaceholder(page);
        }
        renderRail(active);
        renderMsg();
        $('#view').innerHTML = html;
        window.scrollTo(0, 0);
    }
    window.addEventListener('hashchange', route);

    // Delegated handlers for things inside #view
    $('#view').addEventListener('click', (e) => {
        if (handleRecordClick(e.target)) { e.preventDefault(); return; }
        const closeX = e.target.closest('[data-close-tab]');
        if (closeX) { e.preventDefault(); e.stopPropagation(); closeTab(closeX.dataset.closeTab); return; }
        const op = e.target.closest('[data-open]');
        if (op) { e.preventDefault(); openRecord(op.dataset.open); return; }
        const act = e.target.closest('[data-act]');
        if (act) {
            const a = act.dataset.act;
            if (a === 'collapse') act.closest('.panel').classList.toggle('collapsed');
            else if (a === 'print') window.print();
            else toast(`"${a}" is not wired up in the skeleton yet`);
            return;
        }
        if (e.target.id === 'show-all') { e.preventDefault(); state.search.showAll = true; route(); return; }
        if (e.target.id === 'open-adv') { e.preventDefault(); e.stopPropagation(); openAdvanced(); return; }
        if (e.target.closest('#filter-toggle')) { $('#refine').classList.toggle('show'); return; }
        if (e.target.id === 'rf-apply') {
            const first = $('#rf-first').value.trim(), last = $('#rf-last').value.trim();
            runSearch('person', '', { ...(state.search.criteria || {}), first, last });
            return;
        }
        const sort = e.target.closest('[data-sort]');
        if (sort && state.search) {
            const k = sort.dataset.sort;
            state.search.results.sort(k === 'name' ? (x, y) => x.name.localeCompare(y.name) : (x, y) => y.prob - x.prob);
            route(); return;
        }
        const rerun = e.target.closest('[data-rerun]');
        if (rerun) {
            const q = D.sharedSearches[+rerun.dataset.rerun].query;
            const [type, text] = q.split(':').map((s) => s.trim());
            runSearch(type.toLowerCase() === 'vehicle' ? 'object' : type.toLowerCase(), text, null);
        }
    });

    $('#view').addEventListener('submit', (e) => {
        e.preventDefault();
        handleRecordSubmit(e.target);
    });

    $('#view').addEventListener('change', (e) => {
        const t = e.target;
        if (t.dataset.task) {
            const task = D.tasks.find((x) => x.id === t.dataset.task);
            task.done = t.checked;
            db.save();
            toast(t.checked ? 'Task marked complete' : 'Task reopened');
            route();
        } else if (t.dataset.fk || t.dataset.fs) {
            const set = t.dataset.fk ? resultsFilter.kinds : resultsFilter.sources;
            const v = t.dataset.fk || t.dataset.fs;
            t.checked ? set.add(v) : set.delete(v);
            route();
        }
    });

    // ======================================================
    // Boot
    // ======================================================
    applyTheme(document.documentElement.dataset.theme || 'light');
    state.user = store.get();
    if (state.user) showApp(); else showLogin();
})();
