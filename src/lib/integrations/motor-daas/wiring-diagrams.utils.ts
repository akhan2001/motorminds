/**
 * Utility functions for wiring diagrams data transformation
 */

/**
 * Extract diagram name from application data
 * Priority: DisplayName → SAESubjects + Systems → Fallback
 * Extracted from duplicate getDiagramName functions
 */
export function extractDiagramName(application: {
	DisplayName?: string
	ApplicationID: number
	SAESubjects?: Array<{
		Name: string
		Systems?: Array<{ Name: string; IsActive?: boolean }>
	}>
}): string {
	// Priority 1: DisplayName
	if (application.DisplayName && typeof application.DisplayName === 'string' && application.DisplayName.trim()) {
		return application.DisplayName.trim()
	}

	// Priority 2: Build from SAESubjects + Systems
	if (application.SAESubjects && Array.isArray(application.SAESubjects) && application.SAESubjects.length > 0) {
		const subjectNames = application.SAESubjects.filter((subject: any) => subject && subject.Name).map((subject: any) => {
			if (subject.Systems && Array.isArray(subject.Systems) && subject.Systems.length > 0) {
				const activeSystems = subject.Systems.filter((sys: any) => sys && sys.Name && sys.IsActive !== false).map((sys: any) => sys.Name)

				if (activeSystems.length > 0) {
					return `${subject.Name} - ${activeSystems.join(', ')}`
				}
			}
			return subject.Name
		}).filter(Boolean)

		if (subjectNames.length > 0) {
			return subjectNames.join(', ')
		}
	}

	// Priority 3: Fallback
	return `Wiring Diagram ${application.ApplicationID}`
}

