interface MiaSession {
	id: string
	shop_id: string
	session_id: string // client-generated UUID
	vehicle_context: {
		year?: number
		make?: string
		model?: string
		engine?: string
		vehicle_id?: string
		manufacturer_id?: string
	}
	created_at: string
	updated_at: string
	status: 'active' | 'ended'
}