import { useReducer, useCallback, useMemo } from 'react'
import { WeekSchedule, DaySchedule } from '@/app/(features)/settings/profile-form'

// State types
export interface SettingsFormState {
    operatingHours: WeekSchedule
    services: string[]
    newService: string
    isSaving: boolean
}

export type SettingsFormAction = 
    | { type: 'SET_OPERATING_HOURS'; payload: WeekSchedule }
    | { type: 'UPDATE_DAY_SCHEDULE'; payload: { day: keyof WeekSchedule; field: keyof DaySchedule; value: any } }
    | { type: 'SET_SERVICES'; payload: string[] }
    | { type: 'ADD_SERVICE'; payload: string }
    | { type: 'REMOVE_SERVICE'; payload: string }
    | { type: 'SET_NEW_SERVICE'; payload: string }
    | { type: 'SET_SAVING'; payload: boolean }
    | { type: 'RESET_FORM' }

// Initial state
const initialState: SettingsFormState = {
    operatingHours: {
        Monday: { closed: false, openTime: "09:00", closeTime: "17:00" },
        Tuesday: { closed: false, openTime: "09:00", closeTime: "17:00" },
        Wednesday: { closed: false, openTime: "09:00", closeTime: "17:00" },
        Thursday: { closed: false, openTime: "09:00", closeTime: "17:00" },
        Friday: { closed: false, openTime: "09:00", closeTime: "17:00" },
        Saturday: { closed: false, openTime: "09:00", closeTime: "17:00" },
        Sunday: { closed: true, openTime: "09:00", closeTime: "17:00" }
    },
    services: [],
    newService: "",
    isSaving: false
}

// Reducer function
function settingsFormReducer(state: SettingsFormState, action: SettingsFormAction): SettingsFormState {
    switch (action.type) {
        case 'SET_OPERATING_HOURS':
            return { ...state, operatingHours: action.payload }
        
        case 'UPDATE_DAY_SCHEDULE':
            return {
                ...state,
                operatingHours: {
                    ...state.operatingHours,
                    [action.payload.day]: {
                        ...state.operatingHours[action.payload.day],
                        [action.payload.field]: action.payload.value
                    }
                }
            }
        
        case 'SET_SERVICES':
            return { ...state, services: action.payload }
        
        case 'ADD_SERVICE':
            return { 
                ...state, 
                services: [...state.services, action.payload],
                newService: ""
            }
        
        case 'REMOVE_SERVICE':
            return { 
                ...state, 
                services: state.services.filter(s => s !== action.payload)
            }
        
        case 'SET_NEW_SERVICE':
            return { ...state, newService: action.payload }
        
        case 'SET_SAVING':
            return { ...state, isSaving: action.payload }
        
        case 'RESET_FORM':
            return initialState
        
        default:
            return state
    }
}

// Custom hook for settings form state management
export function useSettingsForm() {
    const [state, dispatch] = useReducer(settingsFormReducer, initialState)

    // Memoized action creators for better performance
    const setOperatingHours = useCallback((hours: WeekSchedule) => {
        dispatch({ type: 'SET_OPERATING_HOURS', payload: hours })
    }, [])

    const updateDaySchedule = useCallback((day: keyof WeekSchedule, field: keyof DaySchedule, value: any) => {
        dispatch({ 
            type: 'UPDATE_DAY_SCHEDULE', 
            payload: { day, field, value }
        })
    }, [])

    const setServices = useCallback((services: string[]) => {
        dispatch({ type: 'SET_SERVICES', payload: services })
    }, [])

    const addService = useCallback((service: string) => {
        dispatch({ type: 'ADD_SERVICE', payload: service })
    }, [])

    const removeService = useCallback((service: string) => {
        dispatch({ type: 'REMOVE_SERVICE', payload: service })
    }, [])

    const setNewService = useCallback((service: string) => {
        dispatch({ type: 'SET_NEW_SERVICE', payload: service })
    }, [])

    const setSaving = useCallback((saving: boolean) => {
        dispatch({ type: 'SET_SAVING', payload: saving })
    }, [])

    const resetForm = useCallback(() => {
        dispatch({ type: 'RESET_FORM' })
    }, [])

    // Memoize the actions object to prevent recreation on every render
    const actions = useMemo(() => ({
        setOperatingHours,
        updateDaySchedule,
        setServices,
        addService,
        removeService,
        setNewService,
        setSaving,
        resetForm
    }), [
        setOperatingHours,
        updateDaySchedule,
        setServices,
        addService,
        removeService,
        setNewService,
        setSaving,
        resetForm
    ])

    return {
        state,
        actions
    }
} 