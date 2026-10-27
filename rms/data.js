// Fictional training data for the MetSearch RMS skeleton.
// Nothing here is real - names, addresses and references are made up.
// Swap this file for a real API layer later; app.js only reads RMS_DATA.

window.RMS_DATA = {
    user: { name: 'Demo User', warrant: 'TR0001', role: 'Training account' },

    people: [
        {
            id: 'P1', source: 'PNC', name: 'Smith, John', first: 'John', last: 'Smith', dob: '25/12/1990',
            sex: 'Male', ethnicity: 'White - north European', birthplace: 'Glasgow', pncId: '04/359A', croId: null,
            address: ['111 Marsh Avenue', 'Long Meadow', 'Worcester', 'WR4 0HJ'],
            alias: 'Garry Monk',
            alerts: ['Disqualified Driver', 'Violent'],
            warnings: ['Violent', 'Explosives'],
            markers: ['Ailment'],
            description: { hair: 'Short / brown, greying, thinning', build: 'Heavy', eyes: 'Green', height: '6 ft 1 in (183cm)', marks: 'Tattoo of a fire breathing dragon on left shoulder blade; scar on left elbow' },
            history: [
                { date: '12/03/2014', type: 'Arrest', detail: 'Common assault - Hackney' },
                { date: '02/11/2012', type: 'Conviction', detail: 'Driving whilst disqualified' },
                { date: '19/06/2010', type: 'Caution', detail: 'Possession of a bladed article' }
            ],
            associates: ['P3', 'P4'], family: ['P5'],
            prob: 96
        },
        {
            id: 'P2', source: 'PNC', name: 'Westmacott, John', first: 'John', last: 'Westmacott', dob: '01/05/1965',
            sex: 'Male', ethnicity: 'White - unknown', birthplace: 'Scotland', pncId: '88/1102C', croId: '12044/88K',
            address: ['14 Albion Road', 'Epsom', 'KT17 2PQ'],
            alerts: [], warnings: ['Weapons'], markers: [],
            description: { hair: 'Grey, receding', build: 'Medium', eyes: 'Blue', height: '5 ft 10 in (178cm)', marks: 'None recorded' },
            history: [{ date: '04/04/2009', type: 'Conviction', detail: 'Handling stolen goods' }],
            associates: [], family: [], prob: 82
        },
        {
            id: 'P3', source: 'Intel', name: 'Paterson, John Alan', first: 'John', last: 'Paterson', dob: '17/08/1982',
            sex: 'Male', ethnicity: 'White - British', birthplace: 'Croydon', pncId: '01/77812F', croId: null,
            address: ['Flat 3, 9 Kings Parade', 'Brixton', 'SW2 1AB'],
            alerts: ['Violent'], warnings: [], markers: ['Drugs'],
            description: { hair: 'Black, short', build: 'Slim', eyes: 'Brown', height: '5 ft 9 in (175cm)', marks: 'Scar on right cheek' },
            history: [{ date: '22/01/2013', type: 'Arrest', detail: 'Possession with intent to supply' }],
            associates: ['P1'], family: [], prob: 71
        },
        {
            id: 'P4', source: 'PNC', name: 'Sanderson, Ian', first: 'Ian', last: 'Sanderson', dob: '09/09/1974',
            sex: 'Male', ethnicity: 'Non-white', birthplace: 'Battersea', pncId: '93/40021H', croId: null,
            address: ['27 Station Approach', 'Lewisham', 'SE13 5RT'],
            alerts: [], warnings: [], markers: [],
            description: { hair: 'Shaved', build: 'Athletic', eyes: 'Brown', height: '6 ft 0 in (180cm)', marks: 'None recorded' },
            history: [], associates: ['P1'], family: [], prob: 90
        },
        {
            id: 'P5', source: 'Custody', name: 'Smith, Joanne', first: 'Joanne', last: 'Smith', dob: '03/02/1993',
            sex: 'Female', ethnicity: 'White - British', birthplace: 'Worcester', pncId: '11/20931B', croId: null,
            address: ['111 Marsh Avenue', 'Long Meadow', 'Worcester', 'WR4 0HJ'],
            alerts: [], warnings: [], markers: [],
            description: { hair: 'Blonde, long', build: 'Slim', eyes: 'Blue', height: '5 ft 5 in (165cm)', marks: 'None recorded' },
            history: [{ date: '30/07/2015', type: 'Custody', detail: 'Voluntary attendance - witness' }],
            associates: [], family: ['P1'], prob: 64
        },
        {
            id: 'P6', source: 'Investigation', name: 'Carter, Derrick', first: 'Derrick', last: 'Carter', dob: '14/11/1979',
            sex: 'Male', ethnicity: 'White - British', birthplace: 'Peckham', pncId: '97/33018D', croId: null,
            address: ['111 Marsh Avenue', 'Long Meadow', 'Lewisham', 'SE4 0HJ'],
            alerts: ['ROTL'], warnings: [], markers: [],
            description: { hair: 'Brown', build: 'Medium', eyes: 'Hazel', height: '5 ft 11 in (180cm)', marks: 'Tattoo on right forearm' },
            history: [{ date: '01/09/2014', type: 'ROTL', detail: 'Release on temporary licence - HMP Peckham' }],
            associates: [], family: [], prob: 58
        },
        {
            id: 'P7', source: 'PNC', name: 'Andrews, Geoff', first: 'Geoff', last: 'Andrews', dob: '06/06/1987',
            sex: 'Male', ethnicity: 'White - British', birthplace: 'Brixton', pncId: '05/11209K', croId: null,
            address: ['4 Effra Road', 'Brixton', 'SW2 1BZ'],
            alerts: ['Missing Person'], warnings: [], markers: ['Vulnerable'],
            description: { hair: 'Brown, short', build: 'Slim', eyes: 'Brown', height: '5 ft 8 in (173cm)', marks: 'None recorded' },
            history: [{ date: '03/09/2014', type: 'MISPER', detail: 'Reported missing - Brixton' }],
            associates: [], family: [], prob: 45
        }
    ],

    objects: [
        { id: 'O1', source: 'PNC', name: 'RO60 RYC', type: 'Vehicle', model: 'Astra', make: 'Vauxhall', colour: 'Black', keeper: 'SE1 4RP', prob: 75 },
        { id: 'O2', source: 'DVLA', name: 'LK14 HXT', type: 'Vehicle', model: 'Transit', make: 'Ford', colour: 'White', keeper: 'E8 3QQ', prob: 52 }
    ],

    locations: [
        { id: 'L1', source: 'Intel', name: '45 Kenilworth Road', type: 'Private residence', town: 'Islington', postcode: 'N5 8UT', prob: 30 },
        { id: 'L2', source: 'PND', name: '111 Marsh Avenue', type: 'Private residence', town: 'Worcester', postcode: 'WR4 0HJ', prob: 66 }
    ],

    events: [
        { id: 'E1', source: 'Intel', name: 'Brixton Disorder', category: 'Public disorder', scale: 'Large', date: '25/12/2013', time: '16:52', area: 'Brixton (SW11)', prob: 50 }
    ],

    timeline: [
        { kind: 'report', title: 'Report Generated', sub: 'Intel Reports', time: '01/09/2014 11:15' },
        { kind: 'crime', title: 'Crime Alert', sub: 'Common Assault', time: '02/09/2014 08:10',
          rows: [['Source', 'Crime Reporting'], ['Officer', 'PC Jenkins 01456'], ['Borough', 'Hackney'], ['Status', 'Serious'], ['Level', 'Heightened']] },
        { kind: 'rotl', title: 'ROTL Alert', sub: 'ROTL', time: '02/09/2014 12:48', person: 'P6',
          rows: [['Name', 'Derrick Carter'], ['Establishment', 'Peckham'], ['Home address', '111 Marsh Avenue\nLong Meadow\nLewisham\nSE4 0HJ'], ['Out', '03/09/2014 09:00'], ['In', '04/09/2014 09:00']] },
        { kind: 'misper', title: 'MISPER', sub: 'Missing Person Reported', time: '03/09/2014 06:22', person: 'P7',
          rows: [['Name', 'Geoff Andrews'], ['Age', '27 years old'], ['Area', 'Brixton']] },
        { kind: 'task', title: 'New Task', sub: 'Carnival crime summary', time: '03/09/2014 09:40',
          rows: [['Tasked by', 'SGT Dan 0526'], ['Due', '05/09/2014']] },
        { kind: 'crime', title: 'Crime Alert', sub: 'Theft from vehicle', time: '03/09/2014 14:02',
          rows: [['Source', 'Crime Reporting'], ['Officer', 'PC Rahman 22871'], ['Borough', 'Islington'], ['Status', 'Standard'], ['Level', 'Normal']] },
        { kind: 'report', title: 'Report Generated', sub: 'Custody Summary', time: '03/09/2014 17:30' }
    ],

    tasks: [
        { id: 'T1', title: 'Carnival crime summary', by: 'SGT Dan 0526', due: '05/09/2014', done: false },
        { id: 'T2', title: 'Review ROTL licence conditions', by: 'DS Okafor 1183', due: '06/09/2014', done: false },
        { id: 'T3', title: 'Update MISPER risk assessment', by: 'Insp Hale 0042', due: '04/09/2014', done: false },
        { id: 'T4', title: 'Link intel report 2231 to nominal', by: 'DC Price 7781', due: '08/09/2014', done: true },
        { id: 'T5', title: 'Quality check stop records', by: 'SGT Dan 0526', due: '09/09/2014', done: false }
    ],

    alerts: [
        { level: 'Heightened', title: 'Common assault - Hackney', time: '02/09/2014 08:10' },
        { level: 'ROTL', title: 'Derrick Carter released on temporary licence', time: '02/09/2014 12:48' },
        { level: 'MISPER', title: 'Geoff Andrews reported missing - Brixton', time: '03/09/2014 06:22' },
        { level: 'Standard', title: 'Theft from vehicle - Islington', time: '03/09/2014 14:02' },
        { level: 'Heightened', title: 'Firearms discharge reported - Tottenham', time: '03/09/2014 22:51' }
    ],

    sharedSearches: [
        { by: 'DC Price 7781', query: 'Person: Paterson, John', time: '02/09/2014 10:12' },
        { by: 'DS Okafor 1183', query: 'Vehicle: RO60 RYC', time: '03/09/2014 15:40' }
    ]
};

// Pad out the PNC index with generated nominals so searches return realistic
// volumes (the "too many results" path in the user flow). Deterministic so
// the same search always gives the same list.
(function padPeople(d) {
    const firsts = ['John', 'James', 'Michael', 'David', 'Paul', 'Mark', 'Daniel', 'Sarah', 'Emma', 'Laura', 'Chris', 'Ian'];
    const lasts = ['Smith', 'Jones', 'Brown', 'Taylor', 'Wilson', 'Davies', 'Evans', 'Smith', 'Thomas', 'Roberts', 'Smith', 'Walker'];
    const towns = ['Hackney', 'Brixton', 'Islington', 'Peckham', 'Croydon', 'Ealing', 'Camden', 'Lewisham'];
    const srcs = ['PNC', 'PNC', 'PNC', 'Intel', 'Custody', 'Investigation'];
    let seed = 7;
    const rnd = (n) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor(seed / 233280 * n); };
    for (let i = 0; i < 80; i++) {
        const first = firsts[rnd(firsts.length)], last = lasts[rnd(lasts.length)];
        const dd = String(1 + rnd(28)).padStart(2, '0'), mm = String(1 + rnd(12)).padStart(2, '0');
        const female = ['Sarah', 'Emma', 'Laura'].includes(first);
        d.people.push({
            id: 'G' + (i + 1), source: srcs[rnd(srcs.length)], name: last + ', ' + first, first, last,
            dob: dd + '/' + mm + '/' + (1955 + rnd(45)), sex: female ? 'Female' : 'Male',
            ethnicity: 'Not recorded', birthplace: towns[rnd(towns.length)],
            pncId: String(80 + rnd(20)) + '/' + (10000 + rnd(89999)) + 'X', croId: null,
            address: [(1 + rnd(200)) + ' High Street', towns[rnd(towns.length)]],
            alerts: [], warnings: [], markers: [], description: {}, history: [], associates: [], family: [],
            prob: 20 + rnd(60)
        });
    }
})(window.RMS_DATA);
