/**
 * Phone number utility functions for normalizing and matching phone numbers
 */

export interface PhoneNumberVariations {
	original: string;
	normalized: string;
	withoutCountryCode: string;
	withPlus: string;
	withPlusOne: string;
	variations: string[];
}

/**
 * Normalize a phone number and generate all possible variations for matching
 */
export function normalizePhoneNumber(phoneNumber: string): PhoneNumberVariations {
	if (!phoneNumber) {
		return {
			original: '',
			normalized: '',
			withoutCountryCode: '',
			withPlus: '',
			withPlusOne: '',
			variations: []
		};
	}

	// Clean the phone number (remove spaces, dashes, etc.)
	const cleaned = phoneNumber.replace(/[^+0-9]/g, '');

	// Generate different variations
	const normalized = cleaned.replace('+', '');
	const withoutCountryCode = normalized.startsWith('1') ? normalized.substring(1) : normalized;
	const withPlus = '+' + normalized;
	const withPlusOne = '+1' + withoutCountryCode;

	// Create all possible variations for matching
	const variations = [
		cleaned, // Original cleaned format
		normalized, // Without +
		withPlus, // With +
		withPlusOne, // With +1
		withoutCountryCode, // Without country code
		'1' + withoutCountryCode, // With 1 prefix
		'+' + withoutCountryCode // With + but no 1
	].filter((v, index, arr) => arr.indexOf(v) === index); // Remove duplicates

	return {
		original: phoneNumber,
		normalized,
		withoutCountryCode,
		withPlus,
		withPlusOne,
		variations
	};
}

/**
 * Find a customer by phone number using multiple variations
 */
export async function findCustomerByPhone(
	supabase: any,
	shopId: string,
	phoneNumber: string
): Promise<{ customer: any | null; matchedPhone: string | null }> {
	const phoneVariations = normalizePhoneNumber(phoneNumber);

	// Try to find customer with any of the phone number variations
	const { data: customers, error } = await supabase
		.from('customers')
		.select('*')
		.eq('shop_id', shopId)
		.in('customer_phone', phoneVariations.variations)
		.limit(1);

	if (error) {
		console.error('❌ Error searching for customer:', error);
		return { customer: null, matchedPhone: null };
	}

	if (customers && customers.length > 0) {
		const customer = customers[0];
		return { customer, matchedPhone: customer.customer_phone };
	}

	return { customer: null, matchedPhone: null };
}

/**
 * Create or find a customer by phone number
 */
export async function createOrFindCustomerByPhone(
	supabase: any,
	shopId: string,
	phoneNumber: string,
	customerName?: string
): Promise<{ customerId: string; isNew: boolean; customer: any }> {
	// First try to find existing customer
	const { customer, matchedPhone } = await findCustomerByPhone(supabase, shopId, phoneNumber);

	if (customer) {
		return {
			customerId: customer.id,
			isNew: false,
			customer
		};
	}

	// If not found, create new customer
	const phoneVariations = normalizePhoneNumber(phoneNumber);
	const defaultPhone = phoneVariations.withPlusOne; // Use +1XXXXXXXXXX format as default

	const { data: newCustomer, error } = await supabase
		.from('customers')
		.insert({
			shop_id: shopId,
			customer_name: customerName || `Customer ${phoneVariations.withoutCountryCode.slice(-4)}`,
			customer_phone: defaultPhone,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		})
		.select()
		.single();

	if (error) {
		console.error('❌ Error creating customer:', error);
		throw new Error('Failed to create customer');
	}

	return {
		customerId: newCustomer.id,
		isNew: true,
		customer: newCustomer
	};
}

/**
 * Find existing conversations by phone number using multiple variations
 */
export async function findConversationsByPhone(
	supabase: any,
	shopId: string,
	phoneNumber: string
): Promise<any[]> {
	const phoneVariations = normalizePhoneNumber(phoneNumber);

	const { data: conversations, error } = await supabase
		.from('sms_conversations')
		.select('*')
		.eq('shop_id', shopId)
		.in('customer_phone', phoneVariations.variations)
		.order('last_message_at', { ascending: false });

	if (error) {
		console.error('❌ Error searching for conversations:', error);
		return [];
	}

	return conversations || [];
}

/**
 * Merge duplicate conversations for the same phone number
 */
export async function mergeDuplicateConversations(
	supabase: any,
	shopId: string,
	phoneNumber: string,
	customerId: string
): Promise<{ keptConversationId: string | null; deletedCount: number }> {
	const conversations = await findConversationsByPhone(supabase, shopId, phoneNumber);

	if (conversations.length <= 1) {
		return { keptConversationId: conversations[0]?.id || null, deletedCount: 0 };
	}

	// Sort by last_message_at to keep the most recent
	conversations.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

	const keepConversation = conversations[0];
	const deleteConversations = conversations.slice(1);

	// Update all messages to point to the kept conversation
	for (const conv of deleteConversations) {
		await supabase
			.from('sms_messages')
			.update({
				customer_id: customerId
			})
			.eq('shop_id', shopId)
			.or(`from_number.eq.${phoneNumber},to_number.eq.${phoneNumber}`);
	}

	// Delete duplicate conversations
	for (const conv of deleteConversations) {
		await supabase
			.from('sms_conversations')
			.delete()
			.eq('id', conv.id);
	}

	// Update the kept conversation
	await supabase
		.from('sms_conversations')
		.update({
			customer_phone: phoneNumber,
			customer_id: customerId,
			last_message_at: new Date().toISOString()
		})
		.eq('id', keepConversation.id);

	return {
		keptConversationId: keepConversation.id,
		deletedCount: deleteConversations.length
	};
}
