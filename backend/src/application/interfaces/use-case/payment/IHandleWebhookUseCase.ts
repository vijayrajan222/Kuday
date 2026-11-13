export interface HandleWebhookInput {
    rawBody: string;
    signature: string;
    eventPayload: {
        event: string;
        payload: {
            payment?: {
                entity: {
                    id: string;
                    order_id?: string;
                    amount?: number;
                    status?: string;
                    method?: string;
                    error_code?: string;
                    error_description?: string;
                };
            };
            refund?: {
                entity: {
                    id: string;
                    payment_id: string;
                    amount: number;
                    status: string;
                };
            };
        };
    };
}

export interface IHandleWebhookUseCase {
    execute(input: HandleWebhookInput): Promise<{ received: boolean; action: string }>;
}
