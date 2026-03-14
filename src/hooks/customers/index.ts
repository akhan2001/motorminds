/**
 * Customer hooks
 * 
 * Centralized exports for customer-related React hooks.
 */

export { 
    useCustomerAccessContext,
    useAccessContext,
    type ClientAccessContext,
    type OrganizationCheckResponse,
} from './useCustomerAccessContext'

export { 
    useCheckCustomerPermissions,
    useAllCustomerPermissions,
    type CustomerAction,
    type CustomerPermissionCheck,
} from './useCheckCustomerPermissions'
