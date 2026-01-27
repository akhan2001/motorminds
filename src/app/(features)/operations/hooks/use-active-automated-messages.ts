import { useQuery } from '@tanstack/react-query';
import type { MessageTemplate, TriggerType, ServiceType } from '@/app/(features)/messaging/types/message-template';

interface UseActiveAutomatedMessagesOptions {
    triggerType?: TriggerType;
    serviceType?: ServiceType;
    enabled?: boolean;
}

interface ActiveTemplatesResponse {
    templates: MessageTemplate[];
    count: number;
}

/**
 * Hook to fetch active automated message templates for the current shop.
 * Used to display what automated messages will be sent after work order completion.
 */
export function useActiveAutomatedMessages(options: UseActiveAutomatedMessagesOptions = {}) {
    const { triggerType, serviceType, enabled = true } = options;

    const query = useQuery<ActiveTemplatesResponse>({
        queryKey: ['active-automated-messages', triggerType, serviceType],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (triggerType) {
                params.set('trigger_type', triggerType);
            }
            if (serviceType) {
                params.set('service_type', serviceType);
            }

            const url = `/api/messaging/templates/active${params.toString() ? `?${params}` : ''}`;
            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Failed to fetch templates' }));
                throw new Error(error.error || 'Failed to fetch active templates');
            }

            return response.json();
        },
        enabled,
        staleTime: 60000, // 1 minute - templates don't change often
        retry: 1,
    });

    return {
        templates: query.data?.templates || [],
        count: query.data?.count || 0,
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook specifically for work order completion - fetches templates triggered on completion.
 */
export function useWorkOrderCompletionTemplates(enabled = true) {
    return useActiveAutomatedMessages({
        triggerType: 'work_order_complete',
        enabled,
    });
}

/**
 * Hook specifically for service reminder templates.
 */
export function useServiceReminderTemplates(enabled = true) {
    return useActiveAutomatedMessages({
        triggerType: 'service_reminder',
        enabled,
    });
}
