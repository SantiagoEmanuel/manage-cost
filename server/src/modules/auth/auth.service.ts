import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { AuthRepository } from "./auth.repository.js";
import { env } from "../../config/env.js";
import {
  ConflictError,
  UnauthorizedError,
} from "../../shared/errors/app-error.js";
import {
  BCRYPT_ROUNDS,
  REFRESH_TOKEN_DAYS,
  ACCESS_TOKEN_EXPIRY_SECONDS,
} from "../../shared/constants/index.js";
import type { RegisterInput, LoginInput } from "./auth.schema.js";
import type { UserDto } from "./auth.dto.js";

interface TokenMeta {
  userAgent?: string;
  ipAddress?: string;
}
interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildUserDto(user: {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  currency: string;
  language: string;
}): UserDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    currency: user.currency,
    language: user.language,
  };
}

export class AuthService {
  private readonly repo = new AuthRepository();

  async register(
    input: RegisterInput,
  ): Promise<{ user: Pick<UserDto, "id" | "email" | "username"> }> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.repo.findUserByEmail(input.email),
      this.repo.findUserByUsername(input.username),
    ]);
    if (existingEmail) throw new ConflictError("Email already in use");
    if (existingUsername) throw new ConflictError("Username already taken");
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.repo.createUser({
      id: uuidv4(),
      email: input.email,
      username: input.username,
      passwordHash,
    });
    return {
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async login(
    input: LoginInput,
    meta: TokenMeta,
  ): Promise<{ user: UserDto } & TokenPair> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user || user.deletedAt)
      throw new UnauthorizedError("Invalid credentials");
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid credentials");
    const tokens = await this.createTokenPair(user.id, meta);
    return { user: buildUserDto(user), ...tokens };
  }

  async refresh(rawRefreshToken: string, meta: TokenMeta): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);
    const session = await this.repo.findAnySessionByTokenHash(tokenHash);
    if (!session) throw new UnauthorizedError("Invalid session");
    // Reuse attack detection: a presented token that was already rotated (revoked)
    // signals the refresh token was leaked. Invalidate the whole session family.
    if (session.isRevoked) {
      await this.repo.revokeAllUserSessions(session.userId);
      throw new UnauthorizedError("Session reuse detected");
    }
    if (new Date(session.expiresAt) < new Date()) {
      await this.repo.revokeSession(session.id);
      throw new UnauthorizedError("Session expired");
    }
    await this.repo.revokeSession(session.id);
    return this.createTokenPair(session.userId, meta);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    const session = await this.repo.findSessionByTokenHash(tokenHash);
    if (session) await this.repo.revokeSession(session.id);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.repo.revokeAllUserSessions(userId);
  }

  private async createTokenPair(
    userId: string,
    meta: TokenMeta,
  ): Promise<TokenPair> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new UnauthorizedError("User not found");
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, username: user.username },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS },
    );
    const rawRefreshToken = crypto.randomBytes(64).toString("hex");
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
    await this.repo.createSession({
      id: uuidv4(),
      userId: user.id,
      tokenHash,
      expiresAt: expiresAt.toISOString(),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });
    return { accessToken, refreshToken: rawRefreshToken, expiresAt };
  }
}
