import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { auth, db } from "@/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import AnimatedSubMenu from "@/components/AnimatedSubMenu";
import EditAccount from "@/components/EditAccount";
import DropDown from "@/components/DropDown";
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

interface UserData {
  name: string;
  email: string;
  phoneNumber: string | null;
  numOfPurchases?: number;
  numOfSales?: number;
  isAdmin?: boolean;
}

export default function AccountScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const [currentMenu, setCurrentMenu] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const mainMenuAnim = useRef(new Animated.Value(0)).current;
  const subMenuAnim = useRef(new Animated.Value(400)).current;

  const fetchUserData = useCallback(async () => {
    try {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data?.displayName || "User",
            email: user.email || "No email",
            phoneNumber: data?.phoneNumber || null,
            numOfPurchases: data?.numOfPurchases || 0,
            numOfSales: data?.numOfSales || 0,
            isAdmin: data?.admin || false,
          });
        } else {
          setUserData({
            name: user.displayName || "User",
            email: user.email || "No email",
            phoneNumber: null,
            numOfPurchases: 0,
            numOfSales: 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await auth.signOut();
              setTimeout(() => {
                router.replace("/(tabs)/account/login");
              }, 100);
              console.log("User signed out successfully");
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const showSubMenu = (menu: string) => {
    setCurrentMenu(menu);
    Animated.parallel([
      Animated.timing(mainMenuAnim, {
        toValue: -400,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(subMenuAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideSubMenu = () => {
    Animated.parallel([
      Animated.timing(mainMenuAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(subMenuAnim, {
        toValue: 400,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentMenu(null);
    });
  };

  const renderMenuItem = (
    icon: string,
    label: string,
    onPress: () => void,
    textColor = COLORS.black
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Icon
          name={icon}
          size={24}
          color={textColor === COLORS.black ? COLORS.gray : textColor}
        />
        <Text style={[styles.menuItemText, { color: textColor }]}>{label}</Text>
      </View>
      <Icon
        name="chevron-right"
        size={24}
        color={textColor === COLORS.black ? COLORS.gray : textColor}
      />
    </TouchableOpacity>
  );

  const renderMainMenu = () => (
    <Animated.View
      style={[
        styles.mainContainer,
        currentMenu ? styles.mainContainerBack : styles.mainContainerFront,
        {
          transform: [{ translateX: mainMenuAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Account</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Icon name="account-circle" size={60} color={COLORS.primary} />
          <Text style={styles.userName}>{userData?.name}</Text>
          <Text style={styles.userEmail}>{userData?.email}</Text>
        </View>
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => showSubMenu("purchases")}
          >
            <Text style={styles.statValue}>
              {userData?.numOfPurchases ?? 0}
            </Text>
            <Text style={styles.statLabel}>Purchases</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => showSubMenu("sales")}
          >
            <Text style={styles.statValue}>{userData?.numOfSales ?? 0}</Text>
            <Text style={styles.statLabel}>Sales</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View>
        {renderMenuItem("account-edit", "Edit Account", () =>
          showSubMenu("edit")
        )}
        {renderMenuItem("bell-outline", "Search Alerts", () =>
          showSubMenu("alerts")
        )}
        {renderMenuItem("help-circle", "Support", () => showSubMenu("support"))}
        {userData?.isAdmin &&
          renderMenuItem("shield-account", "Admin Page", () =>
            router.push("/account/admin")
          )}
        {renderMenuItem("logout", "Logout", handleLogout, COLORS.primary)}
      </View>
    </Animated.View>
  );

  const renderSubMenuContent = () => {
    switch (currentMenu) {
      case "purchases":
        return (
          <View>
            <Text style={styles.emptyText}>No purchase history yet</Text>
          </View>
        );
      case "sales":
        return (
          <View>
            <Text style={styles.emptyText}>No sale history yet</Text>
          </View>
        );
      case "edit":
        return (
          <EditAccount
            userData={userData}
            onUpdateSuccess={() => {
              // Refresh user data when updates happen
              fetchUserData();
            }}
          />
        );
      case "alerts":
        return (
          <View>
            <Text>Search alerts coming soon.</Text>
          </View>
        );
      case "support":
        return (
          <ScrollView
            style={styles.supportScrollView}
            contentContainerStyle={styles.supportContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <DropDown
              title="Buying Process"
              content={{
                numberedSteps: [
                  {
                    number: 1,
                    text: "Browse available textbooks.",
                  },
                  {
                    number: 2,
                    text: "Add desired books to cart.",
                  },
                  {
                    number: 3,
                    text: "Complete secure payment and arrange for pickup at *ROOM*.",
                  },
                ],
                additionalInfo:
                  "Always verify book condition before completing the pickup. All sales are final. \n\nWe will hold your book for *DAYS*. No-shows are subject to a *CHARGE*.",
              }}
            />
            <DropDown
              title="Selling Process"
              content={{
                numberedSteps: [
                  {
                    number: 1,
                    text: "Create an account or sign in to get started.",
                  },
                  {
                    number: 2,
                    text: "List your book and bring it to *ROOM*. We'll inspect the books condition and hold it until someone buys it.",
                  },
                  {
                    number: 3,
                    text: "Once someone buys and picks up your book, we'll transfer you the money!",
                  },
                ],
                additionalInfo:
                  "Change your mind? Don't worry! Cancel the listing and we'll hold your book for up to 14 days.\n\nWe'll hold the book for *LENGTH*.",
              }}
            />
            <DropDown
              title="Holding Policy"
              content={{
                numberedSteps: [
                  {
                    number: 1,
                    text: "Books can be held for up to 24 hours after purchase confirmation",
                  },
                  {
                    number: 2,
                    text: "Seller must respond within 12 hours",
                  },
                  {
                    number: 3,
                    text: "If seller doesn't respond, purchase is automatically cancelled",
                  },
                ],
                additionalInfo:
                  "Multiple no-shows may result in account restrictions",
              }}
            />
            <DropDown
              title="Contact Us"
              content={{
                // numberedSteps: [],
                additionalInfo:
                  "Please feel free to contact us at *EMAIL* for any questions or concerns.",
              }}
            />
          </ScrollView>
        );
      default:
        return null;
    }
  };

  const getSubMenuTitle = () => {
    switch (currentMenu) {
      case "purchases":
        return "Purchase History";
      case "sales":
        return "Sale History";
      case "edit":
        return "Edit Account";
      case "alerts":
        return "Search Alerts";
      case "support":
        return "Support";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderMainMenu()}

      <AnimatedSubMenu
        visible={currentMenu !== null}
        title={getSubMenuTitle()}
        onBack={hideSubMenu}
        animValue={subMenuAnim}
      >
        {renderSubMenuContent()}
      </AnimatedSubMenu>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
  },
  mainContainerFront: {
    zIndex: 1,
  },
  mainContainerBack: {
    zIndex: 0,
  },
  header: {
    paddingHorizontal: SIZES.padding.screen,
    paddingTop: SIZES.padding.small,
    paddingBottom: SIZES.spacing.vertical.medium,
  },
  title: {
    fontSize: SIZES.fontSize.title,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileSection: {
    paddingHorizontal: SIZES.padding.screen,
    paddingBottom: SIZES.padding.large,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SIZES.padding.large,
  },
  userName: {
    fontSize: SIZES.fontSize.large,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: SIZES.padding.small,
  },
  userEmail: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
    marginTop: SIZES.padding.small,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.padding.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding.small,
  },
  statValue: {
    fontSize: SIZES.fontSize.large,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
    marginTop: SIZES.padding.small,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.lightGray,
    marginHorizontal: SIZES.padding.large,
  },
  menuSection: {
    paddingTop: SIZES.padding.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.padding.screen,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    marginLeft: SIZES.padding.medium,
  },
  emptyText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: SIZES.padding.large,
  },
  // Support content styles
  supportScrollView: {
    flex: 1,
  },
  supportContentContainer: {
    paddingBottom: SIZES.padding.large,
  },
});