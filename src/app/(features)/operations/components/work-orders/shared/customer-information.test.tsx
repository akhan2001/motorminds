// src/app/(features)/operations/components/work-orders/shared/customer-information.test.tsx

import React from 'react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { CustomerInformation } from './customer-information'
import { CustomerService } from '@/app/(features)/customers/lib/customer-service'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/app/(features)/customers/lib/customer-service')
vi.mock('sonner')

// Mock useAuth hook (hoisted so it's available inside vi.mock factory)
const mockUseAuth = vi.hoisted(() => ({
    shopId: 'shop-1'
}))

vi.mock('../../../hooks/use-auth', () => ({
    useAuth: () => mockUseAuth
}))

// Mock formatPhoneNumber utility
vi.mock('@/utils/format-phone', () => ({
    formatPhoneNumber: (phone: string) => {
        // Simple formatting: add dashes
        if (!phone) return ''
        const cleaned = phone.replace(/\D/g, '')
        if (cleaned.length <= 3) return cleaned
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
}))

// Mock getInitials utility
vi.mock('@/lib/utils/text', () => ({
    getInitials: (name: string) => {
        if (!name) return ''
        const parts = name.trim().split(' ')
        if (parts.length === 1) return parts[0][0].toUpperCase()
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
}))

// Mock CustomerSearchBar component (hoisted so it's available inside vi.mock factory)
const mockCustomerSearchBar = vi.hoisted(() => {
    return vi.fn((props: any) => {
        return React.createElement('div', { 'data-testid': 'customer-search-bar' },
            React.createElement('button', {
                'data-testid': 'select-customer-btn',
                onClick: () => {
                    props.onSelect({
                        id: 'customer-1',
                        customer_name: 'John Doe',
                        customer_email: 'john@example.com',
                        customer_phone: '5551234567',
                        customer_address: '123 Main St'
                    })
                }
            }, 'Select Customer'),
            React.createElement('button', {
                'data-testid': 'create-new-customer-btn',
                onClick: () => props.onCreateNew()
            }, 'Create New')
        )
    })
})

vi.mock('@/components/common/customers/customer-search-bar', () => ({
    CustomerSearchBar: mockCustomerSearchBar
}))

// Mock VehicleSearchForCustomer component (hoisted so it's available inside vi.mock factory)
const mockVehicleSearchForCustomer = vi.hoisted(() => {
    return vi.fn((props: any) => {
        return React.createElement('div', { 'data-testid': 'vehicle-search-for-customer' },
            React.createElement('button', {
                'data-testid': 'select-customer-by-vehicle-btn',
                onClick: () => {
                    props.onCustomerSelect({
                        id: 'customer-1',
                        customer_name: 'John Doe',
                        customer_email: 'john@example.com',
                        customer_phone: '5551234567',
                        customer_address: '123 Main St'
                    })
                }
            }, 'Select Customer by Vehicle')
        )
    })
})

vi.mock('@/components/common/customers/vehicle-search-for-customer', () => ({
    VehicleSearchForCustomer: mockVehicleSearchForCustomer
}))

describe('CustomerInformation Component', () => {
    const mockOnFieldChange = vi.fn()
    const mockOnCustomerChange = vi.fn()
    const mockOnCustomerSaved = vi.fn()

    const defaultProps = {
        customerId: 'customer-1',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        isEditing: true,
        isCreating: false,
        onFieldChange: mockOnFieldChange,
        onCustomerChange: mockOnCustomerChange,
        onCustomerSaved: mockOnCustomerSaved,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockUseAuth.shopId = 'shop-1'
        vi.mocked(CustomerService.createCustomer).mockResolvedValue({
            id: 'new-customer-1',
            customer_name: 'Jane Smith',
            customer_email: 'jane@example.com',
            customer_phone: '5559876543',
            customer_address: '456 Oak Ave'
        } as any)
        vi.mocked(CustomerService.updateCustomer).mockResolvedValue({
            id: 'customer-1',
            customer_name: 'John Doe Updated',
            customer_email: 'john.updated@example.com',
            customer_phone: '5551234567',
            customer_address: '123 Main St Updated'
        } as any)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('Customer search tabs display when editing and shopId exists', () => {
        render(
            <CustomerInformation
                {...defaultProps}
                isEditing={true}
            />
        )

        expect(screen.getByText(/Search by Customer/i)).toBeInTheDocument()
        expect(screen.getByText(/Search by Vehicle/i)).toBeInTheDocument()
        expect(screen.getByTestId('customer-search-bar')).toBeInTheDocument()
    })

    test('Selecting customer from search bar populates all fields correctly', async () => {
        render(
            <CustomerInformation
                {...defaultProps}
                isEditing={true}
            />
        )

        const selectButton = screen.getByTestId('select-customer-btn')
        fireEvent.click(selectButton)

        await waitFor(() => {
            expect(mockOnFieldChange).toHaveBeenCalledWith('customer', 'John Doe')
            expect(mockOnFieldChange).toHaveBeenCalledWith('customerEmail', 'john@example.com')
            expect(mockOnFieldChange).toHaveBeenCalledWith('customerPhone', '5551234567')
            expect(mockOnFieldChange).toHaveBeenCalledWith('customerAddress', '123 Main St')
            expect(mockOnCustomerChange).toHaveBeenCalledWith('customer-1')
        })
    })

    test('Creating new customer clears all fields', async () => {
        render(
            <CustomerInformation
                {...defaultProps}
                isEditing={true}
                customerName="John Doe"
                customerEmail="john@example.com"
                customerPhone="5551234567"
                customerAddress="123 Main St"
            />
        )

        const createNewButton = screen.getByTestId('create-new-customer-btn')
        fireEvent.click(createNewButton)

        await waitFor(() => {
            expect(mockOnFieldChange).toHaveBeenCalledWith('customer', '')
            expect(mockOnFieldChange).toHaveBeenCalledWith('customerEmail', '')
            expect(mockOnFieldChange).toHaveBeenCalledWith('customerPhone', '')
            expect(mockOnFieldChange).toHaveBeenCalledWith('customerAddress', '')
            expect(mockOnCustomerChange).toHaveBeenCalledWith('new')
        })
    })

    test('When in edit mode, fields should be editable', () => {
        render(
            <CustomerInformation
                {...defaultProps}
                customerName="John Doe"
                customerEmail="john@example.com"
                customerPhone="5551234567"
                isEditing={true}
            />
        )

        const nameInput = screen.getByLabelText(/Name/i)
        const phoneInput = screen.getByLabelText(/Phone/i)
        const emailInput = screen.getByLabelText(/Email/i)

        expect(nameInput).not.toHaveAttribute('disabled')
        expect(phoneInput).not.toHaveAttribute('disabled')
        expect(emailInput).not.toHaveAttribute('disabled')
    })

    test('Name/Phone/Email validation works', async () => {
        const { rerender } = render(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
            />
        )

        const nameInput = screen.getByLabelText(/Name/i)
        const phoneInput = screen.getByLabelText(/Phone/i)
        const emailInput = screen.getByLabelText(/Email/i)

        // Test name validation
        fireEvent.blur(nameInput)
        await waitFor(() => {
            expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
        })

        // Test phone validation
        fireEvent.blur(phoneInput)
        await waitFor(() => {
            expect(screen.getByText(/Phone number is required/i)).toBeInTheDocument()
        })

        // Test email validation (optional, but if provided should be valid)
        // Rerender with invalid email value first (component is controlled)
        rerender(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerEmail="invalid-email"
            />
        )
        fireEvent.blur(emailInput)
        await waitFor(() => {
            expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument()
        })
    })

    test('Phone validation rejects invalid phone numbers', async () => {
        const { rerender } = render(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerName="John Doe"
            />
        )

        const phoneInput = screen.getByLabelText(/Phone/i) as HTMLInputElement

        // Test phone too short
        rerender(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerName="John Doe"
                customerPhone="123"
            />
        )
        fireEvent.blur(phoneInput)
        await waitFor(() => {
            expect(screen.getByText(/Enter a valid phone number/i)).toBeInTheDocument()
        })

        // Test valid phone clears error
        rerender(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerName="John Doe"
                customerPhone="5551234567"
            />
        )
        // Re-query the input after rerender
        const phoneInputValid = screen.getByLabelText(/Phone/i) as HTMLInputElement
        // Trigger change event to clear the error (onChange handler clears errors)
        fireEvent.change(phoneInputValid, { target: { value: '5551234567' } })
        await waitFor(() => {
            expect(screen.queryByText(/Enter a valid phone number/i)).not.toBeInTheDocument()
        })
    })

    test('Save new customer validates required fields before saving', async () => {
        render(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerName=""
                customerPhone=""
            />
        )

        const saveButton = screen.getByText(/Save Customer/i)
        expect(saveButton).toBeDisabled()
        expect(CustomerService.createCustomer).not.toHaveBeenCalled()
    })

    test('Save new customer creates customer and notifies parent', async () => {
        render(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerName="Jane Smith"
                customerEmail="jane@example.com"
                customerPhone="5559876543"
                customerAddress="456 Oak Ave"
            />
        )

        const saveButton = screen.getByText(/Save Customer/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(CustomerService.createCustomer).toHaveBeenCalledWith('shop-1', expect.objectContaining({
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '5559876543',
                address: '456 Oak Ave',
                source: 'work_order'
            }))
            expect(toast.success).toHaveBeenCalled()
            expect(mockOnCustomerSaved).toHaveBeenCalled()
            expect(mockOnCustomerChange).toHaveBeenCalledWith('new-customer-1')
        })
    })

    test('Save new customer shows error when shopId is missing', async () => {
        mockUseAuth.shopId = undefined as any

        render(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerName="Jane Smith"
                customerPhone="5559876543"
            />
        )

        const saveButton = screen.getByText(/Save Customer/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Shop ID is required')
            expect(CustomerService.createCustomer).not.toHaveBeenCalled()
        })
    })

    test('Update existing customer updates customer in database', async () => {
        render(
            <CustomerInformation
                {...defaultProps}
                customerId="customer-1"
                customerName="John Doe Updated"
                customerEmail="john.updated@example.com"
                customerPhone="5551234567"
                customerAddress="123 Main St Updated"
                isEditing={true}
                isCreating={false}
            />
        )

        const saveButton = screen.getByText(/Save Customer Info/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(CustomerService.updateCustomer).toHaveBeenCalledWith('customer-1', expect.objectContaining({
                name: 'John Doe Updated',
                email: 'john.updated@example.com',
                phone: '5551234567',
                address: '123 Main St Updated'
            }))
            expect(toast.success).toHaveBeenCalledWith('Customer information updated successfully')
            expect(mockOnCustomerSaved).toHaveBeenCalled()
        })
    })

    test('Update customer shows error when customerId is "new"', async () => {
        render(
            <CustomerInformation
                {...defaultProps}
                customerId="new"
                customerName="John Doe"
                customerPhone="5551234567"
                isEditing={true}
                isCreating={false}
            />
        )

        // Should not show update button when customerId is "new"
        expect(screen.queryByText(/Save Customer Info/i)).not.toBeInTheDocument()
    })

    test('Save button disabled when form invalid', () => {
        render(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerName=""
                customerPhone=""
            />
        )

        const saveButton = screen.getByText(/Save Customer/i)
        expect(saveButton).toBeDisabled()
    })

    test('Save button shows loading state during save', async () => {
        vi.mocked(CustomerService.createCustomer).mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({
                id: 'new-customer-1',
                customer_name: 'Jane Smith',
                customer_email: 'jane@example.com',
                customer_phone: '5559876543',
                customer_address: '456 Oak Ave'
            } as any), 100))
        )

        render(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerName="Jane Smith"
                customerPhone="5559876543"
            />
        )

        const saveButton = screen.getByText(/Save Customer/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(screen.getByText(/Saving.../i)).toBeInTheDocument()
        })
    })

    test('Error handling shows toast on save failure', async () => {
        const errorMessage = 'Failed to save customer'
        vi.mocked(CustomerService.createCustomer).mockRejectedValue(new Error(errorMessage))

        render(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="new"
                customerName="Jane Smith"
                customerPhone="5559876543"
            />
        )

        const saveButton = screen.getByText(/Save Customer/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(errorMessage)
        })
    })

    test('Error handling shows toast on update failure', async () => {
        const errorMessage = 'Failed to update customer'
        vi.mocked(CustomerService.updateCustomer).mockRejectedValue(new Error(errorMessage))

        render(
            <CustomerInformation
                {...defaultProps}
                customerId="customer-1"
                customerName="John Doe"
                customerPhone="5551234567"
                isEditing={true}
                isCreating={false}
            />
        )

        const saveButton = screen.getByText(/Save Customer Info/i)
        fireEvent.click(saveButton)

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(errorMessage)
        })
    })

    test('Avatar displays customer initials', () => {
        render(
            <CustomerInformation
                {...defaultProps}
                customerName="John Doe"
            />
        )

        // Avatar should display initials "JD" for "John Doe"
        const avatar = screen.getByText('JD')
        expect(avatar).toBeInTheDocument()
    })

    test('Phone number is formatted when displayed', () => {
        render(
            <CustomerInformation
                {...defaultProps}
                customerPhone="5551234567"
            />
        )

        const phoneInput = screen.getByLabelText(/Phone/i) as HTMLInputElement
        // formatPhoneNumber should format it as "555-123-4567"
        expect(phoneInput.value).toBe('555-123-4567')
    })

    test('Fields are disabled when not in edit mode', () => {
        render(
            <CustomerInformation
                {...defaultProps}
                customerName="John Doe"
                customerPhone="5551234567"
                isEditing={false}
            />
        )

        const nameInput = screen.getByLabelText(/Name/i)
        const phoneInput = screen.getByLabelText(/Phone/i)
        const emailInput = screen.getByLabelText(/Email/i)

        expect(nameInput).toHaveAttribute('disabled')
        expect(phoneInput).toHaveAttribute('disabled')
        expect(emailInput).toHaveAttribute('disabled')
    })

    test('Fields are disabled when creating and customerId is not "new"', () => {
        render(
            <CustomerInformation
                {...defaultProps}
                isCreating={true}
                customerId="customer-1"
                customerName="John Doe"
                customerPhone="5551234567"
            />
        )

        const nameInput = screen.getByLabelText(/Name/i)
        const phoneInput = screen.getByLabelText(/Phone/i)

        expect(nameInput).toHaveAttribute('disabled')
        expect(phoneInput).toHaveAttribute('disabled')
    })
})
