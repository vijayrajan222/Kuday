import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";
import type { PlanEntity } from "@domain/entities/PlanEntity";

export interface CreateOrderInputDto {
    userId: string;
    planId: string;
    idempotencyKey?: string | undefined;
}

export interface CreateOrderOutputDto {
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

export interface CreateTopUpOrderInputDto {
    userId: string;
    amountPaise: number; // Integer in paise
    idempotencyKey?: string | undefined;
}

export interface CreateTopUpOrderOutputDto {
    orderId: string;
    amount: number; // in paise
    currency: string;
    keyId: string;
}

export interface GetPlansInputDto {
    audience?: string | undefined;
}

export type GetPlansOutputDto = PlanEntity[];

export interface HandleWebhookInputDto {
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

export interface HandleWebhookOutputDto {
    received: boolean;
    action: string;
}

export interface VerifyPaymentInputDto {
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export interface VerifyPaymentOutputDto {
    success: boolean;
    orderId: string;
    paymentId: string;
    amount: number;
    status: string;
    alreadyProcessed?: boolean | undefined;
    subscription?: SubscriptionEntity | undefined;
}

// Aliases for full backwards compatibility
export type CreateOrderInput = CreateOrderInputDto;
export type CreateOrderOutput = CreateOrderOutputDto;
export type CreateTopUpOrderInput = CreateTopUpOrderInputDto;
export type CreateTopUpOrderOutput = CreateTopUpOrderOutputDto;
export type HandleWebhookInput = HandleWebhookInputDto;
export type VerifyPaymentInput = VerifyPaymentInputDto;
export type VerifyPaymentOutput = VerifyPaymentOutputDto;
