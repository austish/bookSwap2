// screens/Cart/index.tsx
import React from 'react';
import {View, Text, TouchableOpacity, SafeAreaView, StyleSheet} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, SIZES} from '@/constants/theme';


interface CartItem {
  id: string;
  title: string;
  price: number;
  condition: string;
}

export default function CartScreen() {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Icon name="cart-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptyText}>
        Items you add to your cart will appear here
      </Text>
    </View>
  );

  const renderCartItem = ({item}: {item: CartItem}) => (
    <View style={styles.cartItem}>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <Text style={styles.bookCondition}>{item.condition}</Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            setCartItems(current =>
              current.filter(cartItem => cartItem.id !== item.id),
            );
          }}>
          <Icon name="trash-can-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="chevron-left" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Cart</Text>
      </View>

      {/* Cart Items */}
      <View style={styles.content}>
        <FlatList
          data={cartItems}
          renderItem={renderCartItem}
          ListEmptyComponent={renderEmptyCart}
          contentContainerStyle={styles.listContainer}
          keyExtractor={item => item.id}
        />

        {/* Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setCartItems([])}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              cartItems.length === 0 && styles.disabledButton,
            ]}
            disabled={cartItems.length === 0}
            onPress={() => {
              // Handle checkout
            }}>
            <Text style={styles.checkoutButtonText}>Check Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

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
      flexDirection: 'row',
      alignItems: 'center',
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
      fontWeight: '600',
      marginLeft: SIZES.padding.small,
    },
    listContainer: {
      flexGrow: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: SIZES.spacing.vertical.large,
    },
    emptyTitle: {
      fontSize: SIZES.fontSize.large,
      fontWeight: '600',
      color: COLORS.black,
      marginTop: SIZES.spacing.vertical.medium,
      marginBottom: SIZES.spacing.vertical.small,
    },
    emptyText: {
      fontSize: SIZES.fontSize.medium,
      color: COLORS.gray,
      textAlign: 'center',
    },
    cartItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: SIZES.padding.medium,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.lightGray,
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
      flexDirection: 'row',
      alignItems: 'center',
    },
    price: {
      fontSize: SIZES.fontSize.medium,
      fontWeight: '600',
      color: COLORS.black,
      marginRight: SIZES.padding.medium,
    },
    removeButton: {
      padding: SIZES.padding.small,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: SIZES.padding.large,
      gap: SIZES.padding.medium,
    },
    clearButton: {
      flex: 1,
      paddingVertical: SIZES.padding.medium,
      borderRadius: SIZES.borderRadius.large,
      borderWidth: 1,
      borderColor: COLORS.primary,
      alignItems: 'center',
    },
    clearButtonText: {
      color: COLORS.primary,
      fontSize: SIZES.fontSize.medium,
      fontWeight: '500',
    },
    checkoutButton: {
      flex: 1,
      paddingVertical: SIZES.padding.medium,
      borderRadius: SIZES.borderRadius.large,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
    },
    checkoutButtonText: {
      color: COLORS.white,
      fontSize: SIZES.fontSize.medium,
      fontWeight: '500',
    },
    disabledButton: {
      backgroundColor: COLORS.gray,
    },
  });
  
