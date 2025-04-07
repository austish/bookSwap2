import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";

interface Order {
  id: string;
  bookId: string;
  isbn: string;
  title: string;
  coverUrl: string;
  condition: string;
  price: number;
  status: OrderStatus;
  createdAt: Date;
  sellerId: string;
  buyerId: string;
}

type OrderStatus =
  | "order_confirmed"
  | "awaiting_seller_dropoff"
  | "seller_dropped_off"
  | "awaiting_buyer_pickup"
  | "completed";

type TabType = "Pending" | "History";

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("Pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("buyerId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const orderPromises = querySnapshot.docs.map(async (d) => {
        const orderData = d.data();

        // Fetch book details
        const bookRef = d.data().bookId
          ? await getDoc(doc(db, "books", d.data().bookId))
          : null;
        const bookData = bookRef?.exists() ? bookRef.data() : null;

        return {
          id: d.id,
          ...orderData,
          title: bookData?.title || orderData.title || "Unknown Book",
          coverUrl: bookData?.coverUrl || orderData.coverUrl || "",
          isbn: bookData?.isbn || orderData.isbn || "",
          createdAt: orderData.createdAt?.toDate() || new Date(),
        } as Order;
      });

      const fetchedOrders = await Promise.all(orderPromises);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderOrderStatus = (status: OrderStatus) => {
    switch (status) {
      case "order_confirmed":
        return { text: "Order Confirmed", color: COLORS.primary };
      case "awaiting_seller_dropoff":
        return { text: "Awaiting Seller Dropoff", color: "#FFA500" };
      case "seller_dropped_off":
        return { text: "Seller Dropped Off", color: "#FFA500" };
      case "awaiting_buyer_pickup":
        return { text: "Awaiting Pickup", color: "#FFA500" };
      case "completed":
        return { text: "Completed", color: COLORS.success };
      default:
        return { text: "Unknown Status", color: COLORS.gray };
    }
  };

  const getConditionLabel = (condition: string): string => {
    switch (condition) {
      case "new":
        return "New";
      case "likenew":
        return "Like New";
      case "good":
        return "Good";
      case "fair":
        return "Fair";
      case "poor":
        return "Poor";
      default:
        return condition;
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Filter by status
    if (activeTab === "Pending") {
      filtered = filtered.filter(
        (order) =>
          order.status === "order_confirmed" ||
          order.status === "awaiting_seller_dropoff" ||
          order.status === "seller_dropped_off" ||
          order.status === "awaiting_buyer_pickup"
      );
    } else {
      filtered = filtered.filter((order) => order.status === "completed");
    }

    // Filter by search query
    // if (searchQuery) {
    //   filtered = filtered.filter((order) =>
    //     order.title.toLowerCase().includes(searchQuery.toLowerCase())
    //   );
    // }

    return filtered;
  };

  const handleViewOrderDetails = (order: Order) => {
    router.push({
      pathname: "/(tabs)/buy/orderDetails/[id]",
      params: { id: order.id },
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusInfo = renderOrderStatus(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleViewOrderDetails(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderDate}>
            {item.createdAt.toLocaleDateString()}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.color + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.bookCondition}>
            Condition: {getConditionLabel(item.condition)}
          </Text>
        </View>

        <View style={styles.priceInfo}>
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="shopping" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No orders found</Text>
      <Text style={styles.emptyText}>
        {activeTab === "Pending"
          ? "You have no pending orders"
          : "Your completed orders will appear here"}
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.push("/(tabs)/buy")}
      >
        <Text style={styles.browseButtonText}>Browse Books</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <View style={styles.tabsContainer}>
        {["Pending", "History"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as TabType)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Orders"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray}
        />
      </View> */}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={getFilteredOrders()}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "bold",
    color: COLORS.primary,
    marginLeft: SIZES.padding.small,
  },
  backButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  activeTabText: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
  },
  listContainer: {
    padding: SIZES.padding.screen,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SIZES.padding.medium,
    marginBottom: SIZES.padding.medium,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  bookDetails: {
    marginBottom: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  bookCondition: {
    fontSize: 14,
    color: COLORS.gray,
  },
  priceInfo: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 8,
    alignItems: "flex-end",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
});
