/**
 * Customer hooks
 * 
 * Centralized exports for customer-related React hooks.
 */

export { 
    useCustomerAccessContext,
    type ClientAccessContext,
    type OrganizationCheckResponse,
} from './useCustomerAccessContext'

export { 
    useCheckCustomerPermissions,
    useAllCustomerPermissions,
    type CustomerAction,
    type CustomerPermissionCheck,
} from './useCheckCustomerPermissions'
