// assumes ical.js loaded

const icsUrl = 'calendar.ics';

async function fetchCalendar(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.status} ${response.statusText}`);
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
        const timeStr = `${event.start.toLocaleTimeString('en-US', timeOptions)}–${event.end.toLocaleTimeString('en-US', timeOptions)}`.toLocaleLowerCase();
        const recurrenceStr = event.recurrence ? ` (${event.recurrence})` : '';
        const descriptionStr = event.description ? `<br>${event.description}` : '';
        li.innerHTML = `${event.summary}<span class="secondary">${descriptionStr}<br>${dateStr}${recurrenceStr}<br>${timeStr}</span>`;
        ul.appendChild(li);
    });
    return ul;
}

// Given an ical event, return a human-readable description of the recurrence
// (such as "every week").
//
// TODO: This is jank english language hacking - maybe use a library for this?
function describeRecurrence(icalEvent) {
    const rrule = icalEvent.component.getFirstPropertyValue('rrule');
    if (!rrule) return 'recurring';

    let description = 'every ';
    if (rrule.interval > 1) {
        description += rrule.interval + ' ';
    }

    switch (rrule.freq) {
        case 'DAILY':
            description += 'day';
            break;
        case 'WEEKLY':
            description += 'week';
            break;
        case 'MONTHLY':
            description += 'month';
            break;
        case 'YEARLY':
            description += 'year';
            break;
        default:
            description += rrule.freq.toLowerCase();
    }
    if (rrule.interval > 1) {
        description += 's';
    }

    return description;
}

// Given a parsed ical.js calendar, return a list of upcoming events ("upcoming"
// here, for now, means events after six hours ago. This is so that in-progress
// events are still shown).
function getUpcomingEvents(vcalendar, numEvents = 10) {
    const events = vcalendar.getAllSubcomponents('vevent');

    const sixHoursAgo = ICAL.Time.now();
    sixHoursAgo.addDuration(ICAL.Duration.fromSeconds(-6 * 60 * 60));

    const upcomingEvents = [];

    events.forEach(event => {
        const icalEvent = new ICAL.Event(event);

        if (icalEvent.isRecurring()) {
            const expand = icalEvent.iterator();
            let next;

            // only add the next instance (later we show the recurrence)
            // so this actually only runs once
            while (next = expand.next()) {
                if (next.compare(sixHoursAgo) >= 0) {
                    upcomingEvents.push({
                        summary: icalEvent.summary,
                        description: icalEvent.description,
                        start: next.toJSDate(),
                        end: icalEvent.endDate.toJSDate(),
                        recurrence: describeRecurrence(icalEvent)
                    });
                    break;
                }
            }
        } else {
            const eventStart = icalEvent.startDate;
            if (eventStart.compare(sixHoursAgo) >= 0) {
                upcomingEvents.push({
                    summary: icalEvent.summary,
                    description: icalEvent.description,
                    start: eventStart.toJSDate(),
                    end: icalEvent.endDate.toJSDate(),
                });
            }
        }
    });

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
