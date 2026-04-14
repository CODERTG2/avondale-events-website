import { Event } from "./definitions";

// copied from avondale-event-indexer repo

export function toChicago(date: Date): Date {
    const str = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(date);
    
    const [datePart, timePart] = str.split(', ');
    const [month, day, year] = datePart.split('/');
    let [hour, minute, second] = timePart.split(':').map(Number);
    if (hour === 24) hour = 0; // Fix Intl 24-hour midnight
    return new Date(+year, +month - 1, +day, hour, minute, second);
}

function formatTime(date: Date, hoursOnly = false) {
    const chicagoDate = toChicago(date);
    const hours = chicagoDate.getHours() % 12 || 12;
    const minutes = chicagoDate.getMinutes();
    const period = hoursOnly ? '' : (chicagoDate.getHours() >= 12 ? 'pm' : 'am');
    return minutes === 0 ? `${hours}${period}` : `${hours}:${minutes.toString().padStart(2, '0')}${period}`;
};

export function formatTimeRange(event: Event) {

    if (!event.startDate || isISODate(event.startDate)) {
        // no start or end time provided
        return "All Day";
    }

    const start = toChicago(new Date(event.startDate));
    const startHours = start.getHours();
    const startMinutes = start.getMinutes();

    if (event.startDate && !event.endDate) {
        // no end time provided
        return formatTime(new Date(event.startDate));
    }

    const end = toChicago(new Date(event.endDate as string));
    const endHours = end.getHours();

    const isSameTime = new Date(event.startDate).getTime() === new Date(event.endDate as string).getTime();
    if (isSameTime) {
        // Same start and end time
        return formatTime(new Date(event.startDate));
    }

    const isSamePeriod = (startHours < 12 && endHours < 12) || (startHours >= 12 && endHours >= 12);
    if (isSamePeriod) {
        // Same AM/PM, only show the period once
        return `${formatTime(new Date(event.startDate), true)}-${formatTime(new Date(event.endDate as string))}`;
    } else {
        // Different AM/PM, show both periods
        return `${formatTime(new Date(event.startDate))}-${formatTime(new Date(event.endDate as string))}`;
    }
}


export function formatDay(event: Event) {
    let date;
    if (isISODate(event.startDate))
        date = getDateFromISODate(event.startDate);
    else
        date = toChicago(new Date(event.startDate));

    // Force English locale formatting
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'numeric', day: 'numeric' }).format(date);
}

function getDateFromISODate(str: string) {
    // Create a new Date object directly for noon to prevent midnight local shifts
    let [year, month, day] = str.split('-');
    return new Date(+year, +month - 1, +day, 12, 0, 0); // Noon is safe from timezone shifts
}

export function getEndOfWeek(weeksOut = 0) {
    // return a timestamp for the following Monday at noon
    // Calculate the date n weeks from today
    const futureDate = toChicago(new Date());
    // Add weeks
    futureDate.setDate(futureDate.getDate() + (weeksOut * 7));

    // Move to the following Monday
    const dayOfWeek = futureDate.getDay(); // Get the day of the week (0 is Sunday)
    const daysUntilNextMonday = (8 - dayOfWeek) % 7; // Days until the next Monday
    const endDate = new Date(futureDate);
    endDate.setDate(futureDate.getDate() + daysUntilNextMonday);

    // Set the time to noon
    endDate.setHours(12, 0, 0, 0); // Noon (12:00 PM)

    return endDate;
}


export function isISODate(str: string) {
    // Regular expression for ISO Date format (YYYY-MM-DD)
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return isoDateRegex.test(str);
}


function isISODateTime(str: string) {
    // Regular expression for ISO Datetime format (YYYY-MM-DDTHH:mm:ss±hh:mm or without the timezone)
    const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
    return isoDateTimeRegex.test(str);
}

export function eventSort(a: Event, b: Event) {
    // sort start times in order
    let aDateTime = isISODate(a.startDate) ? getDateFromISODate(a.startDate) : toChicago(new Date(a.startDate));
    let bDateTime = isISODate(b.startDate) ? getDateFromISODate(b.startDate) : toChicago(new Date(b.startDate));

    // if all day event, place at the end of the day
    if (isISODate(a.startDate))
        aDateTime.setDate(aDateTime.getDate() + 1);
    if (isISODate(b.startDate))
        bDateTime.setDate(bDateTime.getDate() + 1);

    return aDateTime.getTime() - bDateTime.getTime();
}