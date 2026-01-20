import { ProfessionalTemplate } from '../../components/invoice-pdf/templates/ProfessionalTemplate'
import { TonyTemplate } from '../../components/invoice-pdf/templates/TonyTemplate'
import { ModernTemplate } from '../../components/invoice-pdf/templates/ModernTemplate'
import type { TemplateRegistry, TemplateMetadata } from '../../types/invoice-pdf'
import { hasTemplateAccess } from './template-restrictions'

// Template metadata for UI display
export const TEMPLATE_METADATA: Record<string, TemplateMetadata> = {
    professional: {
        id: 'professional',
        name: 'Professional',
        description: 'Clean and professional layout with blue accents',
    },
    tony: {
        id: 'tony',
        name: 'Good Guyz Garage',
        description: 'Classic automotive garage invoice with Canadian branding',
    },
    // modern: {
    //     id: 'modern',
    //     name: 'Modern',
    //     description: 'Contemporary design with bold typography',
    // },
    // Future templates can be added here:
    // modern: {
    //     id: 'modern',
    //     name: 'Modern',
    //     description: 'Contemporary design with bold typography',
    // },
    // minimal: {
    //     id: 'minimal',
    //     name: 'Minimal',
    //     description: 'Simple and clean design',
    // },
}

// Template registry mapping IDs to components
export const TEMPLATE_REGISTRY: TemplateRegistry = {
    professional: {
        component: ProfessionalTemplate,
        metadata: TEMPLATE_METADATA.professional,
    },
    tony: {
        component: TonyTemplate,
        metadata: TEMPLATE_METADATA.tony,
    },
    modern: {
        component: ModernTemplate,
        metadata: TEMPLATE_METADATA.modern,
    },
    // Future templates can be added here:
}

// Helper to get template component
export const getTemplate = (templateId: string) => {
    return TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY.professional
}

// Helper to get all available templates
// Filters templates based on shop restrictions using shop_id
export const getAvailableTemplates = (shopId?: string | null) => {
    const allTemplates = Object.values(TEMPLATE_METADATA)
    
    // Filter templates based on shop access
    return allTemplates.filter(template => {
        return hasTemplateAccess(template.id, shopId)
    })
}

