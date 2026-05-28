export interface UserProfileDto {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  currency: string;
  language: string;
  timezone: string;
  createdAt: string;
}
