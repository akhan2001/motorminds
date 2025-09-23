export const TEMPLATE_CATEGORIES = [
  'Oil Change',
  'Brake Service',
  'Engine Repair',
  'Transmission Service',
  'Electrical Service',
  'AC Service',
  'Suspension Service',
  'Tire Service',
  'Maintenance',
  'Other'
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

// Helper function to get categories for dropdown
export const getTemplateCategories = (): { value: string; label: string }[] => {
  return TEMPLATE_CATEGORIES.map(category => ({
    value: category,
    label: category
  }));
};

// Helper function to validate if a category exists
export const isValidTemplateCategory = (category: string): boolean => {
  return TEMPLATE_CATEGORIES.includes(category as TemplateCategory);
};
