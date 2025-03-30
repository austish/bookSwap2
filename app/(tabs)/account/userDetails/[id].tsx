import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { User, AccountStatus } from "../../../../types/user";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import ListingManager from "../../../../components/ListingManager";
import { db } from "@/firebaseConfig";
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";

export default function UserDetailsScreen() {
  const params = useLocalSearchParams();
  const userId = params.id as string;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userDoc = doc(db, "users", userId);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          setUser({
            id: userSnapshot.id,
            ...userSnapshot.data(),
          } as User);
        } else {
          Alert.alert("Error", "User not found");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        Alert.alert("Error", "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, router]);

  const handleBanUser = async () => {
    if (!user) return;

    Alert.alert(
      "Ban User",
      `Are you sure you want to ${
        user.accountStatus === "banned" ? "unban" : "ban"
      } ${user.displayName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              const newStatus: AccountStatus =
                user.accountStatus === "banned" ? "active" : "banned";

              const userDoc = doc(db, "users", user.id);
              await updateDoc(userDoc, {
                accountStatus: newStatus,
                updatedAt: serverTimestamp(),
              });

              setUser((prevUser) => ({
                ...prevUser!,
                accountStatus: newStatus,
              }));

              Alert.alert(
                "Success",
                `User has been ${
                  newStatus === "banned" ? "banned" : "unbanned"
                } successfully`
              );
            } catch (error) {
              console.error("Error updating user status:", error);
              Alert.alert(
                "Error",
                "Failed to update user status. Please try again."
              );
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const renderDetailItem = (
    label: string,
    value: string | number | boolean | null
  ) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>
        {value === null ? "Not set" : value.toString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text>Loading user details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>User Details</Text>
        {updating ? (
          <ActivityIndicator
            style={styles.headerAction}
            color={COLORS.primary}
          />
        ) : (
          <TouchableOpacity
            style={[
              styles.banButton,
              {
                backgroundColor:
                  user.accountStatus === "banned"
                    ? COLORS.success
                    : COLORS.primary,
              },
            ]}
            onPress={handleBanUser}
          >
            <Text style={styles.banButtonText}>
              {user.accountStatus === "banned" ? "Unban" : "Ban"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.userHeaderSection}>
          <Text style={styles.userName}>{user.displayName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    user.accountStatus === "active"
                      ? COLORS.success
                      : COLORS.primary,
                },
              ]}
            >
              <Text style={styles.statusText}>
                {user.accountStatus.charAt(0).toUpperCase() +
                  user.accountStatus.slice(1)}
              </Text>
            </View>
            {user.admin && (
              <View style={[styles.statusBadge, styles.adminBadge]}>
                <Text style={styles.statusText}>Admin</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          {renderDetailItem(
            "Date Joined",
            new Date(user.dateJoined).toLocaleDateString()
          )}
          {renderDetailItem("Phone Number", user.phoneNumber)}
          {renderDetailItem("Preferred Payment", user.preferredPaymentMethod)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          {renderDetailItem("Total Purchases", user.numOfPurchases)}
          {renderDetailItem("Total Sales", user.numOfSales)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderDetailItem("Email Notifications", user.notifications.email)}
          {renderDetailItem("Push Notifications", user.notifications.push)}
        </View>

        <View>
          <Text style={styles.sectionTitle}>Listings</Text>
          <View style={styles.listingSection}>
            <ListingManager userId={user.id} isAdmin={"true"} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.padding.screen,
    paddingTop: SIZES.padding.medium,
    paddingBottom: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    marginRight: SIZES.padding.medium,
  },
  headerAction: {
    marginLeft: "auto",
  },
  title: {
    flex: 1,
    fontSize: SIZES.fontSize.large,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  banButton: {
    paddingHorizontal: SIZES.padding.medium,
    paddingVertical: SIZES.padding.small,
    borderRadius: SIZES.borderRadius.small,
    marginLeft: SIZES.padding.medium,
  },
  banButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.small,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
    padding: SIZES.padding.screen,
  },
  userHeaderSection: {
    marginBottom: SIZES.spacing.vertical.large,
    alignItems: "center",
  },
  userName: {
    fontSize: SIZES.fontSize.title,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: SIZES.spacing.vertical.small,
  },
  userEmail: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
    marginBottom: SIZES.spacing.vertical.medium,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SIZES.padding.small,
  },
  statusBadge: {
    paddingHorizontal: SIZES.padding.medium,
    paddingVertical: SIZES.padding.small,
    borderRadius: SIZES.borderRadius.large,
  },
  adminBadge: {
    backgroundColor: COLORS.secondary,
  },
  statusText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.small,
    fontWeight: "600",
  },
  section: {
    marginBottom: SIZES.spacing.vertical.medium,
  },
  sectionTitle: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: SIZES.spacing.vertical.medium,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SIZES.padding.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  detailLabel: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    fontWeight: "500",
  },
  listingSection: {
    marginHorizontal: -SIZES.padding.screen,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.padding.large,
    height: '100%'
  },
});
