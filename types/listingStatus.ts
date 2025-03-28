import { COLORS } from '@/constants/theme';

export type ListingStatus =
  | 'active'
  | 'awaiting_dropoff'
  | 'awaiting_pickup'
  | 'sold'
  | 'cancelled'
  | 'rejected'
  | 'expired';

interface ListingStatusConfig {
  status: ListingStatus;
  displayText: string;
  getStatusColor: () => string;
  canEdit: boolean;
  canCancel: boolean;
}

export const LISTING_STATUS_CONFIG: ListingStatusConfig[] = [
  {
    status: 'active',
    displayText: 'Active',
    getStatusColor: () => COLORS.primary, // Blue
    canEdit: true,
    canCancel: true,
  },
  {
    status: 'awaiting_dropoff',
    displayText: 'Awaiting Dropoff',
    getStatusColor: () => '#FFA500', // Orange
    canEdit: false,
    canCancel: false,
  },
  {
    status: 'awaiting_pickup',
    displayText: 'Awaiting Pickup',
    getStatusColor: () => '#FFA500', // Orange
    canEdit: false,
    canCancel: false,
  },
  {
    status: 'sold',
    displayText: 'Sold',
    getStatusColor: () => '#4CAF50', // Green
    canEdit: false,
    canCancel: false,
  },
  {
    status: 'rejected',
    displayText: 'Rejected',
    getStatusColor: () => '#FF0000', // Red
    canEdit: false,
    canCancel: false,
  },
  {
    status: 'cancelled',
    displayText: 'Cancelled',
    getStatusColor: () => '#808080', // Gray
    canEdit: false,
    canCancel: false,
  },
  {
    status: 'expired',
    displayText: 'Expired',
    getStatusColor: () => '#FF0000', // Red
    canEdit: false,
    canCancel: false,
  },
];

// Helper functions
export const getStatusConfig = (status: ListingStatus): ListingStatusConfig => {
  const statusConfig = LISTING_STATUS_CONFIG.find(cfg => cfg.status === status);
  if (!statusConfig) {
    throw new Error(`Invalid listing status: ${status}`);
  }
  return statusConfig;
};

export const isStatusEditable = (status: ListingStatus): boolean => {
  return getStatusConfig(status).canEdit;
};

export const isStatusCancellable = (status: ListingStatus): boolean => {
  return getStatusConfig(status).canCancel;
};
