import { describe, expect, it, vi } from "vitest";
import { userRepository } from "../../repositories/user.repository.ts";
import * as authService from "../auth.service.ts";
import { hashPassword } from "../../lib/password.ts";
import { prisma } from "../../lib/prisma.ts";

vi .mock("../../lib/prisma.ts", () => ({
	prisma: {
		role: {
			findFirst: vi.fn(),
		},
		userRole: {
			create: vi.fn(),
		}
	}
}));

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
        vi.mocked(userRepository.create).mockResolvedValue({
            id: "cuid",
            email: "example@gmail.com",
            name: null,
            tier: "free",
            isActive: true,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            passwordHash: "$2b$12$...",
        });
        vi.mocked(hashPassword).mockResolvedValue("$2b$12$...")
	vi.mocked(prisma.role.findFirst).mockResolvedValue({
		id: "cuid",
        name: "string",
        description: null,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
	});
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
        vi.mocked(userRepository.findByEmail).mockResolvedValue({
            id: "cuid",
            email: "example@gmail.com",
            name: null,
            passwordHash: "$2b$12$...",
            tier: "free",
            isActive: true,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        const conflictCall = async () => await authService.register({
            email: "example@gmail.com",
            password: "Test1244",
        });

        await expect(conflictCall).rejects.toThrow(/already registered/);
    });
});

describe("auth.service.login", () => {
    it("tokens are sent back for valid credentials");
    it("throw error for invalid credentials (email and or password");
    it("hashes refresh token before storage");
});

describe("auth.service.refresh", () => {
    it("invalid token type is rejected")
    it("invalid token is rejected")
    it("expired token is rejected")
    it("is hashed before storage");
    it("returns a new token if successful")
});
