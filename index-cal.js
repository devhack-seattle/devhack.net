// assumes ical.js, rrule.js loaded

const icsUrl = 'calendar.ics';

function escape(str) {
    return str.replace(/[&<>"'/]/g, function (char) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&apos;',
            '/': '&#47;'
        };
        return escapeMap[char] || char;
    });
}

async function fetchCalendar(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`naurrrr :( failed to fetch calendar: ${response.status} ${response.statusText}`);
    }
    const icsData = await response.text();
    const jcalData = ICAL.parse(icsData);
    const vcalendar = new ICAL.Component(jcalData);
    return vcalendar;
}

// Armed with a list of events, draw them into an HTML ul list.
function drawEventList(events) {
    const dateOptions = {
        weekday: 'long',
        month: "numeric",
        day: "numeric",
    };
    const timeOptions = {
        hour: "numeric",
        minute: "numeric",
    };
    const ul = document.createElement('ul');
    events.forEach(event => {
        const li = document.createElement('li');
        const dateStr = `${event.start.toLocaleDateString('en-US', dateOptions)}`.toLocaleLowerCase();
        const timeStr = `${event.start.toLocaleTimeString('en-US', timeOptions)} - ${event.end.toLocaleTimeString('en-US', timeOptions)}`.toLocaleLowerCase();
        const descriptionStr = event.description ? `<br>${escape(event.description)}` : '';
        const recurrence = event.recurrence ? `${event.recurrence}<br>`.toLocaleLowerCase() : '';
        li.innerHTML = `${escape(event.summary)}<span class="secondary">${descriptionStr}<br>${recurrence}${dateStr}<br>${timeStr}</span>`;
        ul.appendChild(li);
    });
    return ul;
}

// Given an ical event, return a human-readable description of the recurrence
// (such as "every week").
function describeRecurrence(icalEvent) {
    const ruleStr = icalEvent.component.getFirstPropertyValue('rrule').toString();
    const parsed = rrule.RRule.fromString(ruleStr);
    return parsed.toText();
}

// Given a parsed ical.js calendar, return a list of upcoming events ("upcoming"
// here, for now, means events after 3 hours ago. This is so that in-progress
// events are still shown).
function getUpcomingEvents(vcalendar, numEvents = 10) {
    const events = vcalendar.getAllSubcomponents('vevent');

    const hoursAfterEnd = ICAL.Time.now();
    hoursAfterEnd.addDuration(ICAL.Duration.fromSeconds(-3 * 60 * 60));

    const upcomingEvents = [];

    let titlesSeen = new Set();

    events.forEach(event => {
        const icalEvent = new ICAL.Event(event);

        if (icalEvent.isRecurring()) {
            // an attempt at preventing duplicate events when the same event was
            // preempted by an one-off instance created by editing the single
            // occurrence in NextCloud.
            if (titlesSeen.has(icalEvent.summary)) {
                return;
            }
        
            const expand = icalEvent.iterator();
            let next;

            // only add the next instance (later we show the recurrence)
            // so this actually only runs once
            while (next = expand.next()) {
                const duration = icalEvent.duration;

                const end = next.clone();
                end.addDuration(duration);
                if (end.compare(hoursAfterEnd) >= 0) {
                    titlesSeen.add(icalEvent.summary);
                    upcomingEvents.push({
                        summary: icalEvent.summary,
                        description: icalEvent.description,
                        start: next.toJSDate(),
                        end: end.toJSDate(),
                        recurrence: describeRecurrence(icalEvent)
                    });
                    break;
                }
            }
        } else {
            const eventStart = icalEvent.startDate;
            if (eventStart.compare(hoursAfterEnd) >= 0) {
                titlesSeen.add(icalEvent.summary);
                upcomingEvents.push({
                    summary: icalEvent.summary,
                    description: icalEvent.description,
                    start: eventStart.toJSDate(),
                    end: icalEvent.endDate.toJSDate(),
                });
            }
        }
    });

    console.log("events added: " + Array.from(titlesSeen));

    return upcomingEvents.sort((a, b) => a.start - b.start).slice(0, numEvents);
}

// Main function :)
async function doCalendar(calendarUrl, targetElementId) {
    const targetElement = document.getElementById(targetElementId);

    try {
        const vcalendar = await fetchCalendar(calendarUrl);

        const upcomingEvents = getUpcomingEvents(vcalendar);
        const eventList = drawEventList(upcomingEvents);
        targetElement.innerHTML = '';
        targetElement.appendChild(eventList);
    }
    catch (error) {
        targetElement.innerHTML = '<p>Sorry - couldn\'t load the calendar :(</p> <small>' + error + '</small>';
    }
}
doCalendar(icsUrl, 'cal-parsed');
