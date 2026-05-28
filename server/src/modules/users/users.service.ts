import bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository.js';
import { NotFoundError, ConflictError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { BCRYPT_ROUNDS } from '../../shared/constants/index.js';
import type { UpdateProfileInput, ChangePasswordInput } from './users.schema.js';
import type { UserProfileDto } from './users.dto.js';

function toDto(user: { id: string; email: string; username: string; avatarUrl: string | null; currency: string; language: string; timezone: string; createdAt: string }): UserProfileDto {
  return { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl, currency: user.currency, language: user.language, timezone: user.timezone, createdAt: user.createdAt };
}

export class UsersService {
  private readonly repo = new UsersRepository();

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError('User');
    return toDto(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfileDto> {
    if (input.username) {
      const existing = await this.repo.findByUsername(input.username);
      if (existing && existing.id !== userId) throw new ConflictError('Username already taken');
    }
    const patch: Parameters<UsersRepository['update']>[1] = {};
    if (input.username !== undefined) patch.username = input.username;
    if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl ?? null;
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.language !== undefined) patch.language = input.language;
    if (input.timezone !== undefined) patch.timezone = input.timezone;
    const updated = await this.repo.update(userId, patch);
    if (!updated) throw new NotFoundError('User');
    return toDto(updated);
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError('User');
    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Current password is incorrect');
    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await this.repo.update(userId, { passwordHash });
  }

  async searchUsers(q: string, requesterId: string): Promise<{ id: string; email: string; username: string; avatarUrl: string | null }[]> {
    return this.repo.search(q, requesterId);
  }
}
