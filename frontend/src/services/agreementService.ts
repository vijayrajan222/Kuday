import { api } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import type {
  Agreement,
  AgreementUnlockStatus,
  CommonTerms,
  CreateAgreementPayload,
  DraftClauseResponse,
  ProposeCustomClausePayload,
  RespondCustomClausePayload,
  AgreementPaymentOrderResponse,
  VerifyAgreementPaymentPayload,
} from "@/types/agreement.types";

export const agreementService = {
  async checkUnlockStatus(
    hostId: string,
    seekerId: string,
    roomId: string
  ): Promise<AgreementUnlockStatus> {
    const res = await api.get<{ success: boolean; data: AgreementUnlockStatus }>(
      `${API_ENDPOINTS.AGREEMENT.CHECK_UNLOCK}?hostId=${encodeURIComponent(
        hostId
      )}&seekerId=${encodeURIComponent(seekerId)}&roomId=${encodeURIComponent(roomId)}`
    );
    return res.data.data;
  },

  async createOrGetAgreement(payload: CreateAgreementPayload): Promise<Agreement> {
    const res = await api.post<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.CREATE,
      payload
    );
    return res.data.data;
  },

  async getAgreement(id: string): Promise<Agreement> {
    const res = await api.get<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.GET_BY_ID(id)
    );
    return res.data.data;
  },

  async proposeCommonTerms(id: string, terms: CommonTerms): Promise<Agreement> {
    const res = await api.patch<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.PROPOSE_TERMS(id),
      { terms }
    );
    return res.data.data;
  },

  async respondCommonTerms(id: string, action: "accept" | "reject"): Promise<Agreement> {
    const res = await api.patch<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.RESPOND_TERMS(id),
      { action }
    );
    return res.data.data;
  },

  async draftClause(id: string, userNeed: string): Promise<DraftClauseResponse> {
    const res = await api.post<{ success: boolean; data: DraftClauseResponse }>(
      API_ENDPOINTS.AGREEMENT.DRAFT_CLAUSE(id),
      { userNeed }
    );
    return res.data.data;
  },

  async proposeClause(id: string, payload: ProposeCustomClausePayload): Promise<Agreement> {
    const res = await api.post<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.PROPOSE_CLAUSE(id),
      payload
    );
    return res.data.data;
  },

  async respondClause(
    id: string,
    clauseId: string,
    payload: RespondCustomClausePayload
  ): Promise<Agreement> {
    const res = await api.patch<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.RESPOND_CLAUSE(id, clauseId),
      payload
    );
    return res.data.data;
  },

  async createPaymentOrder(id: string): Promise<AgreementPaymentOrderResponse> {
    const res = await api.post<{ success: boolean; data: AgreementPaymentOrderResponse }>(
      API_ENDPOINTS.AGREEMENT.CREATE_PAYMENT_ORDER(id)
    );
    return res.data.data;
  },

  async verifyPayment(
    id: string,
    payload: VerifyAgreementPaymentPayload
  ): Promise<Agreement> {
    const res = await api.post<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.VERIFY_PAYMENT(id),
      payload
    );
    return res.data.data;
  },

  async signAgreement(id: string): Promise<Agreement> {
    const res = await api.post<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.SIGN(id)
    );
    return res.data.data;
  },

  async getPdfBlob(id: string): Promise<Blob> {
    const res = await api.get(API_ENDPOINTS.AGREEMENT.GET_PDF(id), {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
