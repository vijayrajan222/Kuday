import { api } from "@/services/api";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import type {
  Agreement,
  AgreementUnlockStatus,
  CreateAgreementPayload,
  DraftClauseResponse,
  SubmitProposalPayload,
  AcceptProposalPayload,
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

  async acquireLock(id: string): Promise<Agreement> {
    const res = await api.post<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.LOCK(id)
    );
    return res.data.data;
  },

  async renewLockHeartbeat(id: string): Promise<Agreement> {
    const res = await api.post<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.HEARTBEAT(id)
    );
    return res.data.data;
  },

  async releaseLock(id: string): Promise<Agreement> {
    const res = await api.post<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.UNLOCK(id)
    );
    return res.data.data;
  },

  async submitProposal(id: string, payload: SubmitProposalPayload): Promise<Agreement> {
    const res = await api.post<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.SUBMIT(id),
      payload
    );
    return res.data.data;
  },

  async acceptProposal(id: string, payload: AcceptProposalPayload): Promise<Agreement> {
    const res = await api.post<{ success: boolean; data: Agreement }>(
      API_ENDPOINTS.AGREEMENT.ACCEPT(id),
      payload
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

  async getPdfBlob(id: string): Promise<Blob> {
    const res = await api.get(API_ENDPOINTS.AGREEMENT.GET_PDF(id), {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
