import { ProfessionalTemplate } from '../../components/invoice-pdf/templates/ProfessionalTemplate'
import { TonyTemplate } from '../../components/invoice-pdf/templates/TonyTemplate'
import type { TemplateRegistry, TemplateMetadata } from '../../types/invoice-pdf'

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
    // Future templates:
    // modern: {
    //     component: ModernTemplate,
    //     metadata: TEMPLATE_METADATA.modern,
    // },
}

// Helper to get template component
export const getTemplate = (templateId: string) => {
    return TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY.professional
}

// Helper to get all available templates
// Filters templates based on shop restrictions
export const getAvailableTemplates = (shopName?: string | null) => {
    const allTemplates = Object.values(TEMPLATE_METADATA)
    
    // Filter out restricted templates
    return allTemplates.filter(template => {
        // Tony template is only available for Good Guyz Garage
        if (template.id === 'tony') {
            return shopName?.toLowerCase() === 'good guyz garage'
        }
        
        // All other templates are available to everyone
        return true
    })
}

