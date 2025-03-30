// app/(tabs)/buy/index.tsx
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Dimensions } from "react-native";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { FlatList } from "react-native-gesture-handler";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  limit,
  startAfter,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";

interface Book {
  isbn: string;
  title: string;
  coverUrl: string;
  lowestPrice: number;
}

export default function BuyScreen() {
  const [filterVisible, setFilterVisible] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const lastVisibleRef = useRef<any>(null);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);
  const isInitialMount = useRef(true);

  const BOOKS_PER_PAGE = 10;

  const handleMyOrdersPress = () => {
    router.push("/sell");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    lastVisibleRef.current = null;
    setHasMoreBooks(true);
    try {
      // Reset pagination and fetch first page
      await fetchBooksWithActiveListings(true);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchBooksWithActiveListings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Query books collection with pagination
      const booksRef = collection(db, "books");
      let booksQuery;

      if (isRefresh || !lastVisibleRef.current) {
        // First page or refresh
        booksQuery = query(
          booksRef,
          orderBy("title", "asc"),
          limit(BOOKS_PER_PAGE)
        );
      } else {
        // Next pages
        booksQuery = query(
          booksRef,
          orderBy("title", "asc"),
          startAfter(lastVisibleRef.current),
          limit(BOOKS_PER_PAGE)
        );
      }

      const booksSnapshot = await getDocs(booksQuery);

      // Update the last visible document for pagination
      const lastDoc = booksSnapshot.docs[booksSnapshot.docs.length - 1];
      lastVisibleRef.current = lastDoc || null;

      // No more books to load
      if (booksSnapshot.docs.length < BOOKS_PER_PAGE) {
        setHasMoreBooks(false);
      }

      if (booksSnapshot.empty) {
        if (isRefresh) {
          setBooks([]);
        }
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Process books and fetch their active listings
      const booksWithListingsPromises = booksSnapshot.docs.map(
        async (bookDoc) => {
          const bookData = bookDoc.data();
          const listingIds = bookData.listingIds || [];

          // Skip books with no listings
          if (!listingIds || listingIds.length === 0) {
            return null;
          }

          // Fetch active listings for this book
          const activeListings = await Promise.all(
            listingIds.map(async (listingId: string) => {
              const listingRef = doc(db, "listings", listingId);
              const listingDoc = await getDoc(listingRef);

              if (!listingDoc.exists) {
                return null;
              }

              const listingData = listingDoc.data();
              // Only return active listings
              if (listingData && listingData.status === "active") {
                return {
                  id: listingDoc.id,
                  price: listingData.price,
                  ...listingData,
                };
              }
              return null;
            })
          );

          // Filter out null values and only keep active listings
          const validListings = activeListings.filter(
            (listing) => listing !== null
          );

          // Skip books with no active listings
          if (validListings.length === 0) {
            return null;
          }

          // Find the lowest price among active listings
          const lowestPrice = Math.min(
            ...validListings.map((listing) => listing.price)
          );

          return {
            id: bookDoc.id,
            isbn: bookDoc.id,
            title: bookData.title || "Unknown Book",
            coverUrl: bookData.coverUrl || "",
            lowestPrice: lowestPrice,
            activeListingsCount: validListings.length,
          };
        }
      );

      const booksWithListings = (
        await Promise.all(booksWithListingsPromises)
      ).filter((book) => book !== null) as Book[];

      if (isRefresh) {
        setBooks(booksWithListings);
      } else {
        setBooks((prevBooks) => [...prevBooks, ...booksWithListings]);
      }
    } catch (error) {
      console.error("Error fetching books with listings:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchBooksWithActiveListings(true);
    }
  }, []);

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCartPress = () => {
    router.push("/buy/cart");
  };

  const handleFilterClose = () => {
    setFilterVisible(false);
  };

  const handleFilterReset = () => {
    // Implement reset logic
    setFilterVisible(false);
  };

  const handleFilterApply = () => {
    // Implement apply logic
    setFilterVisible(false);
  };

  const handleBookPress = (isbn: string) => {
    router.push({
      pathname: "/(tabs)/buy/listing/[isbn]",
      params: { isbn },
    });
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMoreBooks) {
      fetchBooksWithActiveListings();
    }
  };

  const renderFooter = () => {
    if (!loadingMore) {
      return null;
    }

    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={COLORS.secondary} />
      </View>
    );
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => handleBookPress(item.isbn)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.coverUrl }}
          style={styles.bookCover}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.bookTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.bookPrice}>From ${item.lowestPrice.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>BookSwap</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleMyOrdersPress}
            style={styles.ordersContainer}
          >
            <Icon name="package-variant" size={28} color={COLORS.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCartPress}
            style={styles.cartContainer}
          >
            <Icon name="cart" size={28} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon
            name="magnify"
            size={24}
            color={COLORS.gray}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={"Search for Textbooks"}
            placeholderTextColor={COLORS.gray}
            onChangeText={handleSearch}
            value={searchText}
          />
        </View>
      </View>

      {/* Content area */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : filteredBooks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No books found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.isbn}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.booksList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.gray}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const cardWidth = (width - SIZES.padding.screen * 2 - SIZES.padding.medium) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding.screen,
    paddingVertical: SIZES.padding.medium,
  },
  logo: {
    fontSize: SIZES.fontSize.title,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  ordersContainer: {
    padding: SIZES.padding.small,
    marginRight: SIZES.padding.medium,
  },
  cartContainer: {
    padding: SIZES.padding.small,
  },
  searchContainer: {
    paddingHorizontal: SIZES.padding.medium,
    paddingVertical: SIZES.padding.small,
  },
  searchBar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.large,
    alignItems: "center",
    paddingHorizontal: 15,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    paddingVertical: 8,
  },
  filterButton: {
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.lightGray,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: SIZES.fontSize.large,
    color: COLORS.gray,
    textAlign: "center",
  },
  booksList: {
    padding: SIZES.padding.screen,
  },
  row: {
    justifyContent: "space-between",
  },
  bookCard: {
    width: cardWidth,
    marginBottom: SIZES.padding.large,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.medium,
    padding: SIZES.padding.small,
    ...SIZES.shadow.small,
    justifyContent: "flex-start",
  },
  imageContainer: {
    width: "100%",
    height: cardWidth * 1.4, // Create a tall rectangle for the book cover
    borderRadius: SIZES.borderRadius.small,
    overflow: "hidden",
    marginBottom: SIZES.padding.small,
  },
  bookCover: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.lightGray,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
    color: COLORS.black,
  },
  bookPrice: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: "auto",
  },
  loadingMoreContainer: {
    padding: SIZES.padding.medium,
    justifyContent: "center",
    alignItems: "center",
  },
});
