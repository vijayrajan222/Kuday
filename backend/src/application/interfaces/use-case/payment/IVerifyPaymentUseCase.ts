import type {
    VerifyPaymentInputDto,
    VerifyPaymentOutputDto,
    VerifyPaymentInput,
    VerifyPaymentOutput,
} from "@application/dto/payment/PaymentDto";

export type {
    VerifyPaymentInput,
    VerifyPaymentOutput,
    VerifyPaymentInputDto,
    VerifyPaymentOutputDto,
};

export interface IVerifyPaymentUseCase {
    execute(input: VerifyPaymentInputDto): Promise<VerifyPaymentOutputDto>;
}
