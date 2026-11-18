import type {
    ProposeCommonTermsDto,
    RespondCommonTermsDto,
} from "@application/dto/agreement/UpdateCommonTermsDto";
import type { AgreementResponseDto } from "@application/dto/agreement/AgreementResponseDto";

export interface IUpdateCommonTermsUseCase {
    propose(dto: ProposeCommonTermsDto): Promise<AgreementResponseDto>;
    respond(dto: RespondCommonTermsDto): Promise<AgreementResponseDto>;
}
