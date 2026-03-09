export function formatLeadDate(dateString: string | Date | null | undefined) {
    if (dateString == null) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";

    const day = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
    }).format(date);

    const month = new Intl.DateTimeFormat("en-GB", {
        month: "short",
    }).format(date);

    const year = new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
    }).format(date);

    const time = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    })
        .format(date)
        .toLowerCase();

    return `${day}-${month}-${year} | ${time}`;
}