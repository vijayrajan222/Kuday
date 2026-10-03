import type { IUserRepository } from "../../interfaces/repository/IUserRepository.js";

export class ToggleBlockUserUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(userId: string): Promise<{ isBlocked: boolean; message: string }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found.");
        }

        if (user.isAdmin) {
            throw new Error("Cannot block an admin user.");
        }

        const newBlockedState = !user.isBlocked;
        await this.userRepository.updateUser(userId, { isBlocked: newBlockedState });

        return {
            isBlocked: newBlockedState,
            message: newBlockedState ? "User account blocked successfully." : "User account unblocked successfully.",
        };
    }
}
