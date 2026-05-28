export interface GroupMemberDto {
  id: string;
  userId: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

export interface GroupDto {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  ownerId: string;
  createdAt: string;
  members: GroupMemberDto[];
}

export interface GroupExpenseDto {
  id: string;
  groupId: string;
  payerId: string;
  payerUsername: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  paymentMethod: string;
  date: string;
  notes: string | null;
  createdAt: string;
  splits: { userId: string; username: string; amount: number }[];
}
