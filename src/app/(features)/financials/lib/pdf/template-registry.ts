import { ProfessionalTemplate } from '../../components/invoice-pdf/templates/ProfessionalTemplate'
import type { TemplateRegistry, TemplateMetadata } from '../../types/invoice-pdf'

// Template metadata for UI display
export const TEMPLATE_METADATA: Record<string, TemplateMetadata> = {
    professional: {
        id: 'professional',
        name: 'Professional',
        description: 'Clean and professional layout with blue accents',
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
export const getAvailableTemplates = () => {
    return Object.values(TEMPLATE_METADATA)
}

