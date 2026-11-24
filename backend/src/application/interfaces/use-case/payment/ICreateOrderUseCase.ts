import type {
    CreateOrderInputDto,
    CreateOrderOutputDto,
    CreateOrderInput,
    CreateOrderOutput,
} from "@application/dto/payment/PaymentDto";

export type { CreateOrderInput, CreateOrderOutput, CreateOrderInputDto, CreateOrderOutputDto };

export interface ICreateOrderUseCase {
    execute(input: CreateOrderInputDto): Promise<CreateOrderOutputDto>;
}
