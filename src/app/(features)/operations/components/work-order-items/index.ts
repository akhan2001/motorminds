// Work Order Item Types and Schemas
// Centralized exports for all work order item types

// Labor Items
export {
    laborItemSchema,
    laborItemFormSchema,
    laborItemCreateSchema,
    laborItemsSchema, // Legacy
    type LaborItem,
    type LaborItemFormData,
    type LaborItemCreateData,
} from './Labor/labor-item';

// Parts Items
export {
    partsItemSchema,
    partsItemFormSchema,
    partsItemCreateSchema,
    type PartsItem,
    type PartsItemFormData,
    type PartsItemCreateData,
} from './Parts/parts-item';

// Services Items
export {
    servicesItemSchema,
    servicesItemFormSchema,
    servicesItemCreateSchema,
    type ServicesItem,
    type ServicesItemFormData,
    type ServicesItemCreateData,
} from './Services/services-item';

// Packages Items
export {
    packagesItemSchema,
    packagesItemFormSchema,
    packagesItemCreateSchema,
    type PackagesItem,
    type PackagesItemFormData,
    type PackagesItemCreateData,
} from './Packages/package-item';

// Fees Items
export {
    feesItemSchema,
    feesItemFormSchema,
    feesItemCreateSchema,
    type FeesItem,
    type FeesItemFormData,
    type FeesItemCreateData,
} from './Fees/fees-item';

// Discount Items
export {
    discountItemSchema,
    discountItemFormSchema,
    discountItemCreateSchema,
    discountItemsSchema, // Legacy
    type DiscountItem,
    type DiscountItemFormData,
    type DiscountItemCreateData,
} from './Discounts/discount-item';

// Union types for all item types
export type WorkOrderItemUnion = 
    | LaborItem 
    | PartsItem 
    | ServicesItem 
    | PackagesItem 
    | FeesItem 
    | DiscountItem;

export type WorkOrderItemFormDataUnion = 
    | LaborItemFormData 
    | PartsItemFormData 
    | ServicesItemFormData 
    | PackagesItemFormData 
    | FeesItemFormData 
    | DiscountItemFormData;

export type WorkOrderItemCreateDataUnion = 
    | LaborItemCreateData 
    | PartsItemCreateData 
    | ServicesItemCreateData 
    | PackagesItemCreateData 
    | FeesItemCreateData 
    | DiscountItemCreateData;