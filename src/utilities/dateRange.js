const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};

const endOfDay = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
};

export const resolvePeriod = (period, startStr, endStr) => {
    const now = new Date();
    let startDate, endDate;

    switch ((period || '').toLowerCase()) {
        case 'daily':
            startDate = startOfDay(now);
            endDate = endOfDay(now);
            break;
        case 'weekly': {
            const day = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - ((day + 6) % 7));
            startDate = startOfDay(monday);
            endDate = endOfDay(now);
            break;
        }
        case 'monthly':
            startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
            endDate = endOfDay(now);
            break;
        case 'yearly':
            startDate = startOfDay(new Date(now.getFullYear(), 0, 1));
            endDate = endOfDay(now);
            break;
        case 'custom':
            startDate = startStr ? startOfDay(new Date(startStr)) : startOfDay(now);
            endDate = endStr ? endOfDay(new Date(endStr)) : endOfDay(now);
            break;
        default:
            startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
            endDate = endOfDay(now);
    }

    return { startDate, endDate };
};

export const formatDateRangeLabel = (startDate, endDate) =>
    `${startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – ${endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
