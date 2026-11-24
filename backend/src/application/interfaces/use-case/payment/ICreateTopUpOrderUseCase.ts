import type {
    CreateTopUpOrderInputDto,
    CreateTopUpOrderOutputDto,
    CreateTopUpOrderInput,
    CreateTopUpOrderOutput,
} from "@application/dto/payment/PaymentDto";

export type {
    CreateTopUpOrderInput,
    CreateTopUpOrderOutput,
    CreateTopUpOrderInputDto,
    CreateTopUpOrderOutputDto,
};

export interface ICreateTopUpOrderUseCase {
    execute(input: CreateTopUpOrderInputDto): Promise<CreateTopUpOrderOutputDto>;
}
