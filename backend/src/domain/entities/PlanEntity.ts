export interface PlanEntity {
    id: string;
    name: string;
    price: number; // Integer in paise
    durationDays: number;
    description?: string | undefined;
    features?: string[] | undefined;
    isActive: boolean;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}
