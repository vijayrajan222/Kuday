export interface CreateTopUpOrderInput {
    userId: string;
    amountPaise: number; // Integer in paise
    idempotencyKey?: string | undefined;
}

export interface CreateTopUpOrderOutput {
    orderId: string;
    amount: number; // in paise
    currency: string;
    keyId: string;
}

export interface ICreateTopUpOrderUseCase {
    execute(input: CreateTopUpOrderInput): Promise<CreateTopUpOrderOutput>;
}
