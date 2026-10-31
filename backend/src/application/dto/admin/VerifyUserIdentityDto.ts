export interface VerifyUserIdentityRequestDto {
    userId: string;
    action: "approve" | "reject";
    rejectionReason?: string;
}

export interface VerifyUserIdentityResultDto {
    message: string;
    identityStatus: string;
}
