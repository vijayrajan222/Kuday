export interface CreateNotificationRequestDto {
    userId: string;
    title: string;
    message: string;
    type: "admin_verification" | "interest_request" | "system";
}
