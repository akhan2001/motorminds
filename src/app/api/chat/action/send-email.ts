import { ChatAction } from "../types/actions";

export async function handleSendEmail(data: any) {
	// Extract email details
	const { recipient, subject, message } = data;

	try {
		// Call your email sending API
		const response = await fetch('/api/send-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				to: recipient.email,
				subject: subject || "Message from MotorMinds",
				recipientName: recipient.name,
				message: message
			}),
		});

		if (!response.ok) {
			throw new Error('Failed to send email');
		}

		return {
			action: ChatAction.SEND_EMAIL,
			data: { success: true },
			message: `Email sent successfully to ${recipient.name}`
		};
	} catch (error) {
		console.error('Error sending email:', error);
		return {
			action: ChatAction.SEND_EMAIL,
			data: { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
			message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`
		};
	}
}