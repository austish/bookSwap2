// components/ListingCard.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import {
  ListingStatus,
  getStatusConfig,
  isStatusEditable,
  isStatusCancellable,
} from "@/types/listingStatus";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";

interface ListingCardProps {
  isbn: string;
  bookCover: string;
  title: string;
  condition: string;
  yourPrice: number;
  lowestPrice: number;
  onEdit: () => void;
  onCancel: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  status: ListingStatus;
  createdAt: Date;
  expiresAt?: Date;
  removedAt?: Date;
  isAdmin?: boolean;
  notes?: string;
}

const ListingCard: React.FC<ListingCardProps> = ({
  isbn,
  bookCover,
  title,
  condition,
  yourPrice,
  lowestPrice,
  onEdit,
  onCancel,
  // onApprove,
  // onReject,
  status,
  createdAt,
  expiresAt,
  removedAt,
  isAdmin = false,
  notes,
}) => {
  const statusConfig = getStatusConfig(status);
  // const showAdminActions = isAdmin && status === 'pending';

  const renderDates = () => {
    if (status === "active" && createdAt) {
      return (
        <Text style={styles.expirationText}>
          Created: {createdAt.toLocaleDateString()}
        </Text>
      );
    } else if (
      (status === "awaiting_pickup" || "awaiting_dropoff") &&
      createdAt &&
      expiresAt
    ) {
      return (
        <Text style={styles.expirationText}>
          Created: {createdAt.toLocaleDateString()} | Expires:{" "}
          {expiresAt.toLocaleDateString()}
        </Text>
      );
    } else if (status === "sold" && removedAt) {
      return (
        <Text style={styles.expirationText}>
          Sold: {removedAt.toLocaleDateString()}
        </Text>
      );
    } else if (status === "rejected" && removedAt) {
      return (
        <Text style={styles.expirationText}>
          Rejected: {removedAt.toLocaleDateString()}
        </Text>
      );
    } else if (status === "cancelled" && removedAt) {
      return (
        <Text style={styles.expirationText}>
          Cancelled: {removedAt.toLocaleDateString()}
        </Text>
      );
    } else if (status === "expired" && removedAt) {
      return (
        <Text style={styles.expirationText}>
          Expired: {removedAt.toLocaleDateString()}
        </Text>
      );
    }
    return null;
  };

  const handleCardPress = () => {
    router.push({
      pathname: "/(tabs)/buy/listing/[isbn]",
      params: { isbn },
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleCardPress}>
      <View style={styles.contentRow}>
        <Image
          source={{ uri: bookCover }}
          style={styles.bookCover}
          resizeMode="cover"
        />

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.badgesRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.getStatusColor() + "15" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusConfig.getStatusColor() },
                ]}
              >
                {statusConfig.displayText}
              </Text>
            </View>

            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{condition}</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.priceColumn}>
              <Text style={styles.priceLabel}>Your Price</Text>
              <Text style={styles.price}>${yourPrice}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.priceColumn}>
              <Text style={styles.priceLabel}>Lowest Price</Text>
              <Text style={styles.price}>${lowestPrice}</Text>
            </View>
          </View>
        </View>
      </View>

      {isAdmin && notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      )}

      {(isStatusEditable(status) || isStatusCancellable(status)) && (
        <View style={styles.actionRow}>
          {isStatusEditable(status) && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering the card press
                onEdit();
              }}
            >
              <Text style={styles.editButtonText}>Edit Listing</Text>
            </TouchableOpacity>
          )}
          {isStatusCancellable(status) && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering the card press
                onCancel();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel Listing</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* {showAdminActions && (
        <View style={styles.adminActionRow}>
          <TouchableOpacity style={styles.approveButton} onPress={onApprove}>
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {renderDates()}
    </TouchableOpacity>
  );
};

export default ListingCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.medium,
    padding: SIZES.padding.medium,
    marginHorizontal: SIZES.padding.small,
    marginBottom: SIZES.padding.medium,
    ...SIZES.shadow.small,
  },
  contentRow: {
    flexDirection: "row",
    gap: SIZES.padding.medium,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: SIZES.borderRadius.small,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: SIZES.padding.small,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SIZES.padding.small,
    marginBottom: SIZES.padding.medium,
  },
  statusBadge: {
    paddingHorizontal: SIZES.padding.small,
    paddingVertical: 4,
    borderRadius: SIZES.borderRadius.small,
  },
  statusText: {
    fontSize: SIZES.fontSize.small,
    fontWeight: "500",
  },
  conditionBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SIZES.padding.small,
    paddingVertical: 4,
    borderRadius: SIZES.borderRadius.small,
  },
  conditionText: {
    fontSize: SIZES.fontSize.small,
    fontWeight: "500",
    color: COLORS.gray,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: SIZES.padding.small,
  },
  priceColumn: {
    alignItems: "center",
    flex: 1,
  },
  separator: {
    width: 1,
    height: "100%",
    backgroundColor: COLORS.lightGray,
  },
  priceLabel: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
    marginBottom: 4,
  },
  price: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "600",
    color: COLORS.black,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SIZES.padding.medium,
    marginTop: SIZES.padding.medium,
    paddingTop: SIZES.padding.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  adminActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SIZES.padding.medium,
    marginTop: SIZES.padding.medium,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding.small,
    borderRadius: SIZES.borderRadius.small,
    alignItems: "center",
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.medium,
    fontWeight: "500",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding.small,
    borderRadius: SIZES.borderRadius.small,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.fontSize.medium,
    fontWeight: "500",
  },
  approveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: SIZES.padding.small,
    borderRadius: SIZES.borderRadius.small,
    alignItems: "center",
  },
  approveButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.medium,
    fontWeight: "500",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding.small,
    borderRadius: SIZES.borderRadius.small,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF0000",
  },
  rejectButtonText: {
    color: "#FF0000",
    fontSize: SIZES.fontSize.medium,
    fontWeight: "500",
  },
  expirationText: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: SIZES.padding.medium,
  },
  notesContainer: {
    backgroundColor: "#F9F9F9",
    padding: SIZES.padding.small,
    borderRadius: SIZES.borderRadius.small,
    marginTop: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.black,
  },
});
