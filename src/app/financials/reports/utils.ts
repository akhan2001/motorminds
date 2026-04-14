/** Timezone-safe date formatter. Date-only strings (YYYY-MM-DD) are parsed as
 *  local time to avoid EST off-by-one issues from UTC midnight interpretation. */
export const formatDate = (dateString: string): string => {
	if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
		const [year, month, day] = dateString.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('en-CA', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
	}
	return new Date(dateString).toLocaleDateString('en-CA', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};
