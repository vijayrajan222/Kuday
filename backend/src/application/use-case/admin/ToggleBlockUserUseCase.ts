import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IToggleBlockUserUseCase } from "@application/interfaces/use-case/admin/IToggleBlockUserUseCase";
import type { ToggleBlockUserResultDto } from "@application/dto/admin/ToggleBlockUserDto";

export class ToggleBlockUserUseCase implements IToggleBlockUserUseCase {
    constructor(private userRepository: IUserRepository) {}

    async execute(userId: string): Promise<ToggleBlockUserResultDto> {
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
