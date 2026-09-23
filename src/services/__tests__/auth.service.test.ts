import { describe, expect, it, vi } from "vitest";
import { userRepository } from "../../repositories/user.repository.ts";
import * as authService from "../auth.service.ts";
import { hashPassword } from "../../lib/password.ts";

vi.mock("../../repositories/user.repository.ts", () => ({
    userRepository: {
        findById: vi.fn(),
        findByEmail: vi.fn(),
        create: vi.fn(),
    }
}));

vi.mock("../../lib/password.ts", () => ({
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
}));

describe("auth.service.register", () => {
    it("creates a user with a hashed password", async () => {
        vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
        vi.mocked(userRepository.create as any).mockResolvedValue({
            id: "cuid",
            email: "example@gmail.com",
            tier: "free",
            passwordHash: "$2b$12$...",
        });
        vi.mocked(hashPassword as any).mockReturnValue("$2b$12$...")

        const result = await authService.register({
            email: "example@gmail.com",
            password: "SecurePass123",
        });

        expect(userRepository.create).toHaveBeenCalledWith({
            email: "example@gmail.com",
            passwordHash: "$2b$12$...",
        })

        expect(result).not.toHaveProperty("passwordHash");
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("email");
    });

    it("throws an error if email exists", async () => {
        vi.mocked(userRepository.findByEmail as any).mockResolvedValue({
            id: "cuid",
        })

        const conflictCall = async () => await authService.register({
            email: "example@gmail.com",
            password: "Test1244",
        });

        await expect(conflictCall).rejects.toThrow(/already registered/);
    });
});
