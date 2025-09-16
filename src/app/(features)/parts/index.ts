// Main page component
export { default as PartsOrderingPage } from './page'

// Context
export { PartsOrderingProvider, usePartsOrderingContext } from './context/PartsOrderingContext'

// Main components
export { VehicleSelection } from './components/VehicleSelection'
export { PartsSelection } from './components/PartsSelection'
export { ChatPanel } from './components/Chat'

// Individual components
export { VinDecoder } from './components/VehicleSelection/VinDecoder'
export { EngineGrid } from './components/VehicleSelection/EngineGrid'
export { CategoryGrid } from './components/PartsSelection/CategoryGrid'
export { PartCard } from './components/PartsSelection/PartCard'
export { PartsGrid } from './components/PartsSelection/PartsGrid'
export { ChatHeader } from './components/Chat/ChatHeader'
export { CartPanel } from './components/Chat/CartPanel'
export { ChatMessages } from './components/Chat/ChatMessages'
export { ChatInput } from './components/Chat/ChatInput'

// Hooks
export { useVehicleSelection } from './hooks/useVehicleSelection'
export { usePartsData } from './hooks/usePartsData'
export { useChat } from './hooks/useChat'
export { useCart } from './hooks/useCart'
export { useVinDecoder } from './hooks/useVinDecoder'

// Services
export { partsApi } from './services/partsApi'
export { chatApi } from './services/chatApi'
export { cartApi } from './services/cartApi'

// Types
export type { VehicleEngine, PartsCategory, Part, ChatMessage, MiaProduct, Source, VehicleContext } from './types'
