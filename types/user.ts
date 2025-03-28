export type AccountStatus = 'active' | 'banned';

export interface User {
  id: string;
  email: string;
  displayName: string;
  accountStatus: AccountStatus;
  dateJoined: string;
  lastActive: string;
  admin: boolean;
  numOfPurchases: number;
  numOfSales: number;
  phoneNumber: string | null;
  preferredPaymentMethod: string | null;
  listingIds: string[];
  notifications: {
    email: boolean;
    push: boolean;
  };
}
