/**
 * Text formatting utilities for displaying MOTOR API responses
 * 
 * These functions handle cleaning and formatting XML/HTML content
 * from MOTOR DaaS API responses for display in the UI.
 */

/**
 * Clean step text - convert XML/HTML to readable text
 * Used for formatting MOTOR procedure step content
 */
export function cleanStepText(text: string): string {
	return text
		// Handle emphasis/bold
		.replace(/<emph[^>]*type="bold"[^>]*>([\s\S]*?)<\/emph>/gi, '**$1**')
		.replace(/<emph[^>]*>([\s\S]*?)<\/emph>/gi, '*$1*')
		// Replace xref with "See Figure" text
		.replace(/<xref[^>]*idref="([^"]*)"[^>]*\/>/gi, '(See Figure)')
		// Handle nested step groups
		.replace(/<stepgrp2>/gi, '\n')
		.replace(/<\/stepgrp2>/gi, '')
		.replace(/<stepgrp>/gi, '')
		.replace(/<\/stepgrp>/gi, '')
		// Remove other tags
		.replace(/<\/?MOTOR_Procedure>/gi, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<p>/gi, '')
		// Clean remaining tags
		.replace(/<\/?[^>]+(>|$)/g, '')
		// HTML entities
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		// Clean whitespace
		.replace(/\n{3,}/g, '\n\n')
		.trim()
}

