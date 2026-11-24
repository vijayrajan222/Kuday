import type {
  GetAgreementPdfInputDto,
  GetAgreementPdfOutputDto,
} from "@application/dto/agreement/AgreementPdfDto";

export type { GetAgreementPdfInputDto, GetAgreementPdfOutputDto };

export interface IGetAgreementPdfUseCase {
  execute(input: GetAgreementPdfInputDto): Promise<GetAgreementPdfOutputDto>;
  execute(userId: string, agreementId: string): Promise<GetAgreementPdfOutputDto>;
  execute(
    inputOrUserId: GetAgreementPdfInputDto | string,
    agreementId?: string
  ): Promise<GetAgreementPdfOutputDto>;
}
