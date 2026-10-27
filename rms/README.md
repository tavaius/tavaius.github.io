# MetSearch RMS (skeleton)

Concept records management system built from UX mock-ups. Plain HTML/CSS/JS, no build step.
Open `rms/index.html` (or `/rms/` on GitHub Pages). Training mode only: any user number and
password signs in, nothing is stored or sent anywhere, and all data in `data.js` is fictional.

- `index.html` - login screen, app shell (header, search bar, side menu), icon sprite
- `styles.css` - colour tokens and layout, tablet/phone breakpoints
- `data.js`   - fictional people, objects, locations, events, timeline, tasks, alerts
- `app.js`    - hash router and views: dashboard, search results, record, tasks, alerts, shared searches,
                plus the 3-step advanced search

Search outcomes follow the user flow diagram: one result opens the record, a list shows results,
more than 15 shows a warning with the first 15, none shows an info message.
