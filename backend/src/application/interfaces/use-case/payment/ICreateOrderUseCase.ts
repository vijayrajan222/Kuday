export interface CreateOrderInput {
    userId: string;
    planId: string;
    idempotencyKey?: string | undefined;
}

export interface CreateOrderOutput {
    orderId: string;
    amount: number; // in paise
    currency: string;
    keyId: string;
    plan: {
        id: string;
        name: string;
        price: number;
        durationDays: number;
    };
}

export interface ICreateOrderUseCase {
    execute(input: CreateOrderInput): Promise<CreateOrderOutput>;
}
