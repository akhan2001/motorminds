export enum ChatAction {
    NONE = "NONE",
    SEND_EMAIL = "SEND_EMAIL",
    CREATE_CUSTOMER = "CREATE_CUSTOMER",
    DATABASE_QUERY = "DATABASE_QUERY"
}

export interface ActionResponse {
    action: ChatAction;
    data?: any;
    message: string;
}