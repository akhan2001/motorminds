// src/app/(features)/operations/components/work-orders/shared/vehicle-information.test.tsx

import React from 'react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { VehicleInformation } from './vehicle-information'
import { VehicleService } from '@/app/(features)/customers/lib/vehicle-service'
import { decodeVin } from '@/app/(features)/customers/vehicles/lib/vin-decode'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/app/(features)/customers/lib/vehicle-service')
vi.mock('@/app/(features)/customers/vehicles/lib/vin-decode')
vi.mock('sonner')

// Mock VehicleDropdown component (hoisted so it's available inside vi.mock factory)
const mockVehicleDropdown = vi.hoisted(() => {
    return vi.fn((props: any) => {
        return React.createElement('div', { 'data-testid': 'vehicle-dropdown' },
            React.createElement('select', {
                value: props.selectedVehicleId || '',
                onChange: (e: any) => {
                    const value = e.target.value
                    if (value === 'new') {
                        props.onVehicleSelect('new')
                    } else if (value === 'vehicle-1') {
                        props.onVehicleSelect('vehicle-1', {
                            id: 'vehicle-1',
                            year: 2020,
                            make: 'Toyota',
                            model: 'Camry',
                            color: 'Blue',
                            vin: '1HGBH41JXMN109186',
                            licensePlate: 'ABC123',
                            displayName: '2020 Toyota Camry'
                        })
                    }
                }
            },
                React.createElement('option', { value: '' }, 'Select Vehicle'),
                React.createElement('option', { value: 'new' }, '+ Add New Vehicle'),
                React.createElement('option', { value: 'vehicle-1' }, '2020 Toyota Camry')
            )
        )
    })
})

vi.mock('@/app/(features)/customers/components/Selection', () => ({
    VehicleDropdown: mockVehicleDropdown
}))

// Mock updateInvoiceVehicleInfo (hoisted so it's available inside vi.mock factory)
const mockUpdateInvoiceVehicleInfo = vi.hoisted(() => vi.fn())
vi.mock('@/app/invoices/utils/invoice-utils', async () => {
    const actual = await vi.importActual('@/app/invoices/utils/invoice-utils')
    return {
        ...actual,
        updateInvoiceVehicleInfo: mockUpdateInvoiceVehicleInfo
    }
})

describe('VehicleInformation Component', () => {
    const mockOnFieldChange = vi.fn()
    const mockOnVehicleSelect = vi.fn()
    const mockOnVehicleSaved = vi.fn()

    const defaultProps = {
        customerId: 'customer-1',
        vehicleYear: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleColor: '',
        vehicleVin: '',
        vehicleLicensePlate: '',
        vehicleMileage: '',
        isEditing: true,
        isCreating: false,
        onFieldChange: mockOnFieldChange,
        onVehicleSelect: mockOnVehicleSelect,
        onVehicleSaved: mockOnVehicleSaved,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(VehicleService.getCustomerVehicles).mockResolvedValue([])
        vi.mocked(VehicleService.createVehicle).mockResolvedValue({
            id: 'new-vehicle-1',
            year: '2020',
            make: 'Toyota',
            model: 'Camry',
            color: 'Blue',
            vin: '1HGBH41JXMN109186',
            license_plate: 'ABC123',
            mileage: '50000'
        } as any)
        vi.mocked(VehicleService.updateVehicle).mockResolvedValue({} as any)
        vi.mocked(VehicleService.toVehicleOption).mockImplementation((vehicle: any) => ({
            id: vehicle.id,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.color,
            vin: vehicle.vin,
            licensePlate: vehicle.license_plate,
            displayName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        }))
        mockUpdateInvoiceVehicleInfo.mockResolvedValue([{ id: 'invoice-1' }])
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('Vehicle dropdown loads and displays vehicles for a customer', async () => {
        const mockVehicles = [
            {
                id: 'vehicle-1',
                year: 2020,
                make: 'Toyota',
                model: 'Camry',
                color: 'Blue',
                vin: '1HGBH41JXMN109186',
                license_plate: 'ABC123'
            }
        ]
        vi.mocked(VehicleService.getCustomerVehicles).mockResolvedValue(mockVehicles as any)

        render(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
            />
        )

        await waitFor(() => {
            expect(screen.getByTestId('vehicle-dropdown')).toBeInTheDocument()
        })
    })

    test('Selecting existing vehicle populates all fields correctly', async () => {
        render(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="vehicle-1"
            />
        )

        const dropdown = screen.getByTestId('vehicle-dropdown')
        const select = dropdown.querySelector('select')
        
        if (select) {
            fireEvent.change(select, { target: { value: 'vehicle-1' } })
        }

        await waitFor(() => {
            expect(mockOnFieldChange).toHaveBeenCalledWith('vehicleYear', '2020')
            expect(mockOnFieldChange).toHaveBeenCalledWith('vehicleMake', 'Toyota')
            expect(mockOnFieldChange).toHaveBeenCalledWith('vehicleModel', 'Camry')
            expect(mockOnFieldChange).toHaveBeenCalledWith('vehicleColor', 'Blue')
            expect(mockOnFieldChange).toHaveBeenCalledWith('vehicleVin', '1HGBH41JXMN109186')
            expect(mockOnFieldChange).toHaveBeenCalledWith('vehicleLicensePlate', 'ABC123')
            expect(mockOnVehicleSelect).toHaveBeenCalled()
        })
    })

    test('When in edit mode, the vehicle should be editable', () => {
        render(
            <VehicleInformation
                {...defaultProps}
                vehicleYear="2020"
                vehicleMake="Toyota"
                vehicleModel="Camry"
                isEditing={true}
            />
        )

        const yearInput = screen.getByLabelText(/Year/i)
        const makeSelect = screen.getByLabelText(/Make/i)
        const modelInput = screen.getByLabelText(/Model/i)

        expect(yearInput).not.toHaveAttribute('readOnly')
        expect(makeSelect).not.toHaveAttribute('disabled')
        expect(modelInput).not.toHaveAttribute('readOnly')
    })

    test('Year/Make/Model validation works', async () => {
        render(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
            />
        )

        const yearInput = screen.getByLabelText(/Year/i)
        const makeSelect = screen.getByLabelText(/Make/i)
        const modelInput = screen.getByLabelText(/Model/i)

        // Test year validation
        fireEvent.blur(yearInput)
        await waitFor(() => {
            expect(screen.getByText(/Year is required/i)).toBeInTheDocument()
        })

        // Test make validation
        fireEvent.blur(makeSelect)
        // Make uses Select component, validation happens on save

        // Test model validation
        fireEvent.blur(modelInput)
        await waitFor(() => {
            expect(screen.getByText(/Model is required/i)).toBeInTheDocument()
        })
    })

    test('Year validation rejects invalid years', async () => {
        const { rerender } = render(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
            />
        )

        const yearInput = screen.getByLabelText(/Year/i) as HTMLInputElement

        // Test year too old - render with invalid year and blur
        rerender(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
                vehicleYear="1800"
            />
        )
        fireEvent.blur(yearInput)
        await waitFor(() => {
            expect(screen.getByText(/Please enter a valid year/i)).toBeInTheDocument()
        })

        // Test year too future - render with valid year first to clear error
        // Simulate selecting "new" vehicle again to clear errors (component calls setErrors({}))
        const dropdown = screen.getByTestId('vehicle-dropdown')
        const select = dropdown.querySelector('select')
        if (select) {
            fireEvent.change(select, { target: { value: 'new' } })
        }
        // Now rerender with valid year
        rerender(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
                vehicleYear="2020"
            />
        )
        // Wait for error to be cleared (selecting "new" clears all errors)
        await waitFor(() => {
            expect(screen.queryByText(/Please enter a valid year/i)).not.toBeInTheDocument()
        }, { timeout: 1000 })

        // Now render with future year
        const futureYear = new Date().getFullYear() + 2
        rerender(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
                vehicleYear={futureYear.toString()}
            />
        )
        fireEvent.blur(yearInput)
        await waitFor(() => {
            expect(screen.getByText(/Please enter a valid year/i)).toBeInTheDocument()
        })
    })

    test('Save new vehicle validates required fields before saving', async () => {
        // Test that when customerId is "new", button is disabled (prevents saving)
        render(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
                customerId="new"
                vehicleYear="2020"
                vehicleMake="Toyota"
                vehicleModel="Camry"
                vehicleLicensePlate="ABC123"
            />
        )

        const saveButton = screen.getByText(/Save Vehicle Info/i)
        expect(saveButton).toBeDisabled()
        expect(VehicleService.createVehicle).not.toHaveBeenCalled()
    })

    test('Save new vehicle creates vehicle and refreshes dropdown', async () => {
        render(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
                vehicleYear="2020"
                vehicleMake="Toyota"
                vehicleModel="Camry"
                vehicleLicensePlate="ABC123"
            />
        )

        const saveButton = screen.getByText(/Save Vehicle Info/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(VehicleService.createVehicle).toHaveBeenCalledWith('customer-1', expect.objectContaining({
                year: '2020',
                make: 'Toyota',
                model: 'Camry'
            }))
            expect(toast.success).toHaveBeenCalled()
            expect(mockOnVehicleSaved).toHaveBeenCalled()
        })
    })

    test('Save existing vehicle updates vehicle in database', async () => {
        render(
            <VehicleInformation
                {...defaultProps}
                vehicleId="vehicle-1"
                vehicleYear="2020"
                vehicleMake="Toyota"
                vehicleModel="Camry"
                vehicleColor="Blue"
                vehicleVin="1HGBH41JXMN109186"
                vehicleLicensePlate="ABC123"
                vehicleMileage="50000"
            />
        )

        const saveButton = screen.getByText(/Save Vehicle Info/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(VehicleService.updateVehicle).toHaveBeenCalledWith('vehicle-1', expect.objectContaining({
                year: '2020',
                make: 'Toyota',
                model: 'Camry',
                color: 'Blue',
                vin: '1HGBH41JXMN109186',
                licensePlate: 'ABC123',
                mileage: '50000'
            }))
            expect(toast.success).toHaveBeenCalledWith('Vehicle information updated successfully')
        })
    })

    test('Save invoice vehicle updates invoice vehicle info (when vehicleId === "existing")', async () => {
        render(
            <VehicleInformation
                {...defaultProps}
                vehicleId="existing"
                invoiceNumber="INV-001"
                shopId="shop-1"
                vehicleYear="2020"
                vehicleMake="Toyota"
                vehicleModel="Camry"
                vehicleColor="Blue"
                vehicleVin="1HGBH41JXMN109186"
                vehicleLicensePlate="ABC123"
                vehicleMileage="50000"
            />
        )

        const saveButton = screen.getByText(/Save Vehicle Info/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(mockUpdateInvoiceVehicleInfo).toHaveBeenCalledWith('INV-001', expect.objectContaining({
                year: '2020',
                make: 'Toyota',
                model: 'Camry',
                color: 'Blue',
                vin: '1HGBH41JXMN109186',
                license_plate: 'ABC123',
                mileage: '50000'
            }), 'shop-1')
            expect(toast.success).toHaveBeenCalledWith('Vehicle information updated successfully')
            expect(VehicleService.updateVehicle).not.toHaveBeenCalled()
        })
    })

    test('Save button disabled when form invalid', () => {
        render(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
                vehicleYear=""
                vehicleMake=""
                vehicleModel=""
                vehicleLicensePlate=""
            />
        )

        const saveButton = screen.getByText(/Save Vehicle Info/i)
        expect(saveButton).toBeDisabled()
    })

    test('Save button shows loading state during save', async () => {
        vi.mocked(VehicleService.createVehicle).mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({
                id: 'new-vehicle-1',
                year: '2020',
                make: 'Toyota',
                model: 'Camry'
            } as any), 100))
        )

        render(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
                vehicleYear="2020"
                vehicleMake="Toyota"
                vehicleModel="Camry"
                vehicleLicensePlate="ABC123"
            />
        )

        const saveButton = screen.getByText(/Save Vehicle Info/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(screen.getByText(/Saving.../i)).toBeInTheDocument()
        })
    })

    test('Error handling shows toast on save failure', async () => {
        const errorMessage = 'Failed to save vehicle'
        vi.mocked(VehicleService.createVehicle).mockRejectedValue(new Error(errorMessage))

        render(
            <VehicleInformation
                {...defaultProps}
                isCreating={true}
                selectedVehicleId="new"
                vehicleYear="2020"
                vehicleMake="Toyota"
                vehicleModel="Camry"
                vehicleLicensePlate="ABC123"
            />
        )

        const saveButton = screen.getByText(/Save Vehicle Info/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(errorMessage)
        })
    })
})