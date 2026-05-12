export interface UserDto {
  id: string; email: string; username: string;
  avatarUrl: string | null; currency: string; language: string;
}
export interface AuthResponseDto { user: UserDto; }
