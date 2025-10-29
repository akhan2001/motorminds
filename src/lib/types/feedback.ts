export interface SendFeedbackVariables {
    message: string
    feedbackType: 'issue' | 'idea'
    pathname?: string
    userAgent?: string
}

export interface SendFeedbackData {
    success: boolean
    messageId?: string
    error?: string
}