export const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // The 'T00:00:00Z' is crucial to ensure the date is parsed as UTC
    // and not affected by the user's local timezone.
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}; 