import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Image,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";
import { useCart } from "@/context/CartContext";

interface CartItem {
  id: string;
  isbn: string;
  title: string;
  coverUrl: string;
  condition: string;
  price: number;
  sellerId: string;
}

export default function CartScreen() {
  const { items, removeFromCart, clearCart, getCartTotal } = useCart();

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cart-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptyText}>
        Items you add to your cart will appear here
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.back()}
      >
        <Text style={styles.browseButtonText}>Browse Books</Text>
      </TouchableOpacity>
    </View>
  );

  const navigateToBookDetails = (isbn: string) => {
    router.push(`/(tabs)/buy/listing/${isbn}`);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity
        style={styles.itemTouchable}
        onPress={() => navigateToBookDetails(item.isbn)}
      >
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderCover}>
            <Icon name="book-outline" size={24} color={COLORS.gray} />
          </View>
        )}
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <Text style={styles.bookCondition}>
            Condition:{" "}
            {item.condition === "new"
              ? "New"
              : item.condition === "likenew"
              ? "Like New"
              : item.condition === "good"
              ? "Good"
              : item.condition === "fair"
              ? "Fair"
              : "Poor"}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.id)}
        >
          <Icon name="trash-can-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Calculate total price
  const total = getCartTotal();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Cart</Text>
        {items.length > 0 && (
          <Text style={styles.itemCount}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </Text>
        )}
      </View>

      {/* Cart Items */}
      <View style={styles.content}>
        <FlatList
          data={items}
          renderItem={renderCartItem}
          ListEmptyComponent={renderEmptyCart}
          contentContainerStyle={styles.listContainer}
          keyExtractor={(item) => item.id}
        />

        {/* Order Summary - Only show if cart has items */}
        {items.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>Free</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Bottom Buttons */}
        {items.length > 0 && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => clearCart()}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => {
                // Handle checkout
                console.log("Proceeding to checkout with items:", items);
                // Navigate to checkout screen
                // router.navigate('/(checkout)');
              }}
            >
              <Text style={styles.checkoutButtonText}>Check Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding.screen,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
    color: COLORS.primary,
  },
  title: {
    color: COLORS.primary,
    fontSize: SIZES.fontSize.large,
    fontWeight: "600",
    marginLeft: SIZES.padding.small,
  },
  itemCount: {
    color: COLORS.gray,
    fontSize: SIZES.fontSize.small,
    marginLeft: "auto",
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: SIZES.padding.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.spacing.vertical.large,
  },
  emptyTitle: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "600",
    color: COLORS.black,
    marginTop: SIZES.spacing.vertical.medium,
    marginBottom: SIZES.spacing.vertical.small,
  },
  emptyText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: SIZES.spacing.vertical.medium,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding.large,
    paddingVertical: SIZES.padding.medium,
    borderRadius: SIZES.borderRadius.large,
    marginTop: SIZES.spacing.vertical.medium,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.medium,
    fontWeight: "500",
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  coverImage: {
    width: 50,
    height: 70,
    borderRadius: 4,
    marginRight: SIZES.padding.medium,
  },
  placeholderCover: {
    width: 50,
    height: 70,
    borderRadius: 4,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SIZES.padding.medium,
  },
  bookInfo: {
    flex: 1,
    marginRight: SIZES.padding.medium,
  },
  bookTitle: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    marginBottom: SIZES.spacing.vertical.small,
  },
  bookCondition: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  removeButton: {
    padding: 4,
  },
  summaryContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.medium,
    padding: SIZES.padding.medium,
    marginVertical: SIZES.padding.medium,
  },
  summaryTitle: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    marginBottom: SIZES.padding.medium,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.padding.small,
  },
  summaryLabel: {
    color: COLORS.gray,
  },
  summaryValue: {
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray,
    marginVertical: SIZES.padding.small,
  },
  totalLabel: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    color: COLORS.primary,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SIZES.padding.large,
    gap: SIZES.padding.medium,
  },
  clearButton: {
    flex: 1,
    paddingVertical: SIZES.padding.medium,
    borderRadius: SIZES.borderRadius.large,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
  },
  clearButtonText: {
    color: COLORS.primary,
    fontSize: SIZES.fontSize.medium,
    fontWeight: "500",
  },
  checkoutButton: {
    flex: 1,
    paddingVertical: SIZES.padding.medium,
    borderRadius: SIZES.borderRadius.large,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.medium,
    fontWeight: "500",
  },
  itemTouchable: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
});
