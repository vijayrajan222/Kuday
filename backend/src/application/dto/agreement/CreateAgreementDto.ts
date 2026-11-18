export interface CreateAgreementRequestDto {
    hostId: string;
    seekerId: string;
    roomId: string;
}

export interface CheckAgreementUnlockDto {
    hostId: string;
    seekerId: string;
    roomId: string;
}
