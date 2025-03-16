import { ActionResponse, ChatAction } from "../types/actions";
import { handleSendEmail } from "./send-email";

// Placeholder handlers for other actions
const handleNone = async (data: any): Promise<ActionResponse> => {
    return { action: ChatAction.NONE, message: "No action performed" };
};

const handleCreateCustomer = async (data: any): Promise<ActionResponse> => {
    return { action: ChatAction.CREATE_CUSTOMER, message: "Customer creation not implemented yet" };
};

const handleDatabaseQuery = async (data: any): Promise<ActionResponse> => {
    return { action: ChatAction.DATABASE_QUERY, message: "Database query not implemented yet" };
};

export const actionHandlers: Record<ChatAction, (data: any) => Promise<ActionResponse>> = {
    [ChatAction.NONE]: handleNone,
    [ChatAction.SEND_EMAIL]: handleSendEmail,
    [ChatAction.CREATE_CUSTOMER]: handleCreateCustomer,
    [ChatAction.DATABASE_QUERY]: handleDatabaseQuery
};

export async function executeAction(action: ChatAction, data: any) {
    if (actionHandlers[action]) {
        return await actionHandlers[action](data);
    }
    return { action: ChatAction.NONE, message: "Unknown action" };
}