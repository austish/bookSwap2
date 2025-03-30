// app/(tabs)/buy/listing/[isbn].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useLocalSearchParams, router } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  getGenreLabel,
  getTypeLabel,
  getSubjectLabel,
  getConditionLabel,
} from "@/types/bookOptions";
import {StyleSheet} from 'react-native';
import {COLORS, SIZES} from '@/constants/theme';

interface Listing {
  id: string;
  isbn: string;
  condition: string;
  price: number;
  sellerId: string;
  status: string;
}

interface ConditionGroup {
  condition: string;
  lowestPrice: number;
  listingId: string;
  count: number;
}

interface BookData {
  isbn: string;
  title: string;
  coverUrl: string;
  author: string;
  publisher: string;
  yearPublished: string;
  genre: string;
  subject: string;
  type: string;
}

export default function BookDetailsScreen() {
  const params = useLocalSearchParams();
  const isbn = params.isbn as string;

  const [loading, setLoading] = useState(true);
  const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([]);
  const [book, setBook] = useState<BookData>({
    isbn: isbn,
    title: "",
    coverUrl: "",
    author: "",
    publisher: "",
    yearPublished: "",
    genre: "",
    subject: "",
    type: "",
  });

  useEffect(() => {
    // Fetch the book data and listings
    const fetchBookData = async () => {
      try {
        setLoading(true);

        // Fetch the book details
        const bookRef = doc(db, "books", isbn);
        const bookDoc = await getDoc(bookRef);

        if (bookDoc.exists()) {
          const bookData = bookDoc.data() as BookData;
          setBook({
            isbn: isbn,
            title: bookData.title || "Book Title",
            coverUrl: bookData.coverUrl || "",
            author: bookData.author || "Author Name",
            publisher: bookData.publisher || "Publisher Name",
            yearPublished: bookData.yearPublished || "Year Published",
            genre: bookData.genre || "any",
            subject: bookData.subject || "any",
            type: bookData.type || "any",
          });
        }

        // Get all active listings for this book using ISBN
        const listingsRef = collection(db, "listings");

        const q = query(
          listingsRef,
          where("isbn", "==", isbn),
          where("status", "==", "active")
        );

        const listingsSnapshot = await getDocs(q);

        const listings: Listing[] = [];
        listingsSnapshot.forEach((d) => {
          listings.push({
            id: d.id,
            isbn: d.data().isbn,
            condition: d.data().condition,
            price: d.data().price,
            sellerId: d.data().sellerId,
            status: d.data().status,
          });
        });

        // Group by condition and find lowest price for each condition
        const groupedByCondition: { [condition: string]: Listing[] } = {};

        listings.forEach((listing) => {
          if (!groupedByCondition[listing.condition]) {
            groupedByCondition[listing.condition] = [];
          }
          groupedByCondition[listing.condition].push(listing);
        });

        // Find the lowest price for each condition
        const lowestPriceByCondition: ConditionGroup[] = [];

        Object.keys(groupedByCondition).forEach((condition) => {
          const conditionListings = groupedByCondition[condition];
          const lowestPriceListing = conditionListings.reduce((prev, current) =>
            prev.price < current.price ? prev : current
          );

          lowestPriceByCondition.push({
            condition,
            lowestPrice: lowestPriceListing.price,
            listingId: lowestPriceListing.id,
            count: conditionListings.length,
          });
        });

        // Sort listings by condition
        const conditionOrder = ["new", "likenew", "good", "fair", "poor"];
        lowestPriceByCondition.sort((a, b) => {
          return (
            conditionOrder.indexOf(a.condition) -
            conditionOrder.indexOf(b.condition)
          );
        });

        setConditionGroups(lowestPriceByCondition);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching book data and listings:", error);
        setLoading(false);
      }
    };

    if (isbn) {
      fetchBookData();
    }
  }, [isbn]);

  const handleBack = () => {
    router.back();
  };

  const handleAddToCart = (listingId: string) => {
    // Implement add to cart functionality
    console.log("Adding listing to cart:", listingId);
    // You could navigate to cart or show a confirmation
    // router.push('/cart');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading book details...</Text>
      </View>
    );
  }

  // Render a single condition option
  const renderConditionItem = ({ item }: { item: ConditionGroup }) => (
    <View style={styles.conditionCard}>
      <View style={styles.conditionHeader}>
        <Text style={styles.conditionLabel}>
          {getConditionLabel(item.condition)} ({item.count})
        </Text>
        <Text style={styles.conditionPrice}>
          ${item.lowestPrice.toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.conditionAddButton}
        onPress={() => handleAddToCart(item.listingId)}
      >
        <Icon name="cart-plus" size={16} color={COLORS.white} />
        <Text style={styles.conditionAddButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Details</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.bookHeader}>
          <Image
            source={{ uri: book.coverUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />

          <View style={styles.bookInfo}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>by {book.author}</Text>

            {conditionGroups.length > 0 && (
              <View style={styles.pricingContainer}>
                <Text style={styles.price}>
                  From $
                  {Math.min(
                    ...conditionGroups.map((group) => group.lowestPrice)
                  ).toFixed(2)}
                </Text>
                <Text style={styles.lowestPrice}>
                  {conditionGroups.length}{" "}
                  {conditionGroups.length === 1 ? "option" : "options"}{" "}
                  available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Condition & pricing section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Conditions</Text>
          {conditionGroups.length > 0 ? (
            <FlatList
              data={conditionGroups}
              renderItem={renderConditionItem}
              keyExtractor={(item) => item.condition}
              horizontal={false}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noListingsText}>
              No listings available for this book
            </Text>
          )}
        </View>

        {/* Details section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ISBN:</Text>
            <Text style={styles.detailValue}>{book.isbn}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Publisher:</Text>
            <Text style={styles.detailValue}>{book.publisher}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Publication Year:</Text>
            <Text style={styles.detailValue}>{book.yearPublished}</Text>
          </View>

          {book.genre && book.genre !== "any" ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Genre:</Text>
              <Text style={styles.detailValue}>
                {getGenreLabel(book.genre)}
              </Text>
            </View>
          ) : book.subject && book.subject !== "any" ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Subject:</Text>
              <Text style={styles.detailValue}>
                {getSubjectLabel(book.subject)}
              </Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Book Type:</Text>
            <Text style={styles.detailValue}>{getTypeLabel(book.type)}</Text>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.white,
    },
    loadingText: {
      marginTop: 10,
      color: COLORS.gray,
      fontSize: SIZES.fontSize.medium,
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
    headerTitle: {
      color: COLORS.primary,
      fontSize: SIZES.fontSize.large,
      fontWeight: '600',
      marginLeft: SIZES.padding.small,
    },
    scrollView: {
      flex: 1,
    },
    bookHeader: {
      flexDirection: 'row',
      padding: SIZES.padding.screen,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.lightGray,
    },
    coverImage: {
      width: 120,
      height: 180,
      borderRadius: 8,
    },
    bookInfo: {
      flex: 1,
      marginLeft: SIZES.padding.medium,
      justifyContent: 'flex-start',
    },
    title: {
      fontSize: SIZES.fontSize.large,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: 5,
    },
    author: {
      fontSize: SIZES.fontSize.medium,
      color: COLORS.gray,
      marginBottom: 10,
    },
    pricingContainer: {
      marginBottom: 10,
      marginTop: 'auto',
    },
    price: {
      fontSize: SIZES.fontSize.large,
      fontWeight: 'bold',
      color: COLORS.primary,
    },
    lowestPrice: {
      fontSize: SIZES.fontSize.small,
      color: COLORS.gray,
    },
    badgesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    badge: {
      backgroundColor: COLORS.lightGray,
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginRight: 8,
      marginBottom: 4,
    },
    badgeText: {
      fontSize: SIZES.fontSize.small,
      color: COLORS.gray,
    },
    addToCartButton: {
      backgroundColor: COLORS.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: SIZES.borderRadius.large,
      height: SIZES.height.button,
      marginHorizontal: SIZES.padding.screen,
      marginVertical: SIZES.padding.medium,
    },
    addToCartButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: SIZES.fontSize.medium,
      marginLeft: 8,
    },
    section: {
      padding: SIZES.padding.screen,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.lightGray,
    },
    sectionTitle: {
      fontSize: SIZES.fontSize.large,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: SIZES.padding.medium,
    },
    detailRow: {
      flexDirection: 'row',
      paddingVertical: 6,
    },
    detailLabel: {
      width: 140,
      fontSize: SIZES.fontSize.medium,
      fontWeight: '600',
      color: COLORS.gray,
    },
    detailValue: {
      flex: 1,
      fontSize: SIZES.fontSize.medium,
      color: COLORS.black,
    },
    // New styles for condition cards
    conditionCard: {
      backgroundColor: COLORS.white,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: COLORS.lightGray,
      overflow: 'hidden',
    },
    conditionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SIZES.padding.medium,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.lightGray,
    },
    conditionLabel: {
      fontSize: SIZES.fontSize.medium,
      fontWeight: '600',
      color: COLORS.black,
    },
    conditionPrice: {
      fontSize: SIZES.fontSize.large,
      fontWeight: 'bold',
      color: COLORS.black,
    },
    conditionAddButton: {
      backgroundColor: COLORS.secondary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SIZES.padding.small,
    },
    conditionAddButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: SIZES.fontSize.medium,
      marginLeft: 5,
    },
    noListingsText: {
      fontSize: SIZES.fontSize.medium,
      color: COLORS.gray,
      textAlign: 'center',
      marginVertical: SIZES.padding.medium,
    },
  });
  