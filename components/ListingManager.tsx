// components/ListingManager.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  getFirestore,
  doc,
  onSnapshot,
  getDoc,
  writeBatch,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useLocalSearchParams, router } from "expo-router";
import ListingCard from "./ListingCard";
import { ListingStatus, isStatusCancellable } from "@/types/listingStatus";
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";

type TabType = "Active" | "Pending" | "History";

interface ListingManagerProps {
    userId: string;
    isAdmin?: string; // Changed to string to match what you're passing
  }

interface Listing {
  id: string;
  isbn: string;
  condition: string;
  price: number;
  status: ListingStatus;
  createdAt: Date;
}

interface ListingWithBook extends Listing {
  bookCover: string;
  title: string;
  lowestPrice: number; // Added lowestPrice field
}

const ListingManager: React.FC<ListingManagerProps> = ({ userId, isAdmin = 'false' }) => {
  const [activeTab, setActiveTab] = useState<TabType>("Active");
//   const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<ListingWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Helper function to get the lowest price for a book ISBN
  const fetchLowestPrice = React.useCallback(
    async (isbn: string, condition: string) => {
      // Query all active listings for this book excluding the current listing
      const listingsRef = collection(db, "listings");
      const activeListingsQuery = query(
        listingsRef,
        where("isbn", "==", isbn),
        where("status", "==", "active"),
        where("condition", "==", condition)
      );

      const listingsSnapshot = await getDocs(activeListingsQuery);

      let lowestPrice = Infinity;

      listingsSnapshot.forEach((docSnap) => {
        const listing = docSnap.data();
        if (listing.price < lowestPrice) {
          lowestPrice = listing.price;
        }
      });

      // If no other listings were found, return 0
      return lowestPrice === Infinity ? 0 : lowestPrice;
    },
    []
  );

  useEffect(() => {
    const targetUserId = userId || auth.currentUser?.uid;

    if (!targetUserId) {
      setLoading(false);
      return;
    }

    if (isAdmin) {
      setIsUserAdmin(true);
    }

    const unsubscribeListeners: (() => void)[] = [];

    const userRef = doc(db, "users", targetUserId);
    const userListener = onSnapshot(userRef, async (userDoc) => {
      if (!userDoc.exists) {
        setLoading(false);
        return;
      }

      const listingIds = userDoc.data()?.listingIds || [];

      if (listingIds.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      listingIds.forEach((listingId: string) => {
        const listingRef = doc(db, "listings", listingId);
        const listingListener = onSnapshot(listingRef, async (listingDoc) => {
          if (!listingDoc.exists) {
            return;
          }

          const listingData = {
            id: listingDoc.id,
            ...listingDoc.data(),
            createdAt: listingDoc.data()?.createdAt?.toDate(),
          } as Listing;

          try {
            const bookRef = doc(db, "books", listingData.isbn);
            const bookDoc = await getDoc(bookRef);

            const bookData = bookDoc.exists() ? bookDoc.data() : null;

            // Get the lowest price for this book
            const lowestPrice = await fetchLowestPrice(
              listingData.isbn,
              listingData.condition
            );

            const listingWithBook: ListingWithBook = {
              ...listingData,
              title: bookData?.title || "Unknown Book",
              bookCover: bookData?.coverUrl || "",
              lowestPrice: lowestPrice,
            };

            setListings((prevListings) => {
              const existingIndex = prevListings.findIndex(
                (l) => l.id === listingId
              );
              if (existingIndex >= 0) {
                const updatedListings = [...prevListings];
                updatedListings[existingIndex] = listingWithBook;
                return updatedListings;
              } else {
                return [...prevListings, listingWithBook];
              }
            });
          } catch (error) {
            console.error("Error fetching book data:", error);
          }
        });

        unsubscribeListeners.push(listingListener);
      });

      setLoading(false);
    });

    unsubscribeListeners.push(userListener);

    return () => {
      unsubscribeListeners.forEach((unsub) => unsub());
    };
  }, [userId, isAdmin, fetchLowestPrice]);

  // Filter listings based on status group
  const getFilteredListings = (tabGroup: TabType) => {
    switch (tabGroup) {
      case "Active":
        return listings.filter((listing) => listing.status === "active");
      case "Pending":
        return listings.filter(
          (listing) =>
            listing.status === "awaiting_pickup" ||
            listing.status === "awaiting_dropoff"
        );
      case "History":
        return listings.filter((listing) =>
          ["completed", "cancelled", "rejected", "expired"].includes(
            listing.status
          )
        );
      default:
        return [];
    }
  };

  // Get listings for current tab
  const getDisplayedListings = () => {
    const filteredListings = getFilteredListings(activeTab);

    // if (searchQuery) {
    //   return filteredListings.filter((listing) =>
    //     listing.title.toLowerCase().includes(searchQuery.toLowerCase())
    //   );
    // }

    return filteredListings;
  };

  // Calculate tab counts
  const tabData = [
    {
      label: "Active" as TabType,
      count: getFilteredListings("Active").length,
    },
    {
      label: "Pending" as TabType,
      count: getFilteredListings("Pending").length,
    },
    {
      label: "History" as TabType,
      count: getFilteredListings("History").length,
    },
  ];

  const handleCancelListing = async (listingId: string) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert("Error", "You must be logged in to cancel a listing.");
      return;
    }

    const listing = listings.find((l) => l.id === listingId);

    if (!listing || !isStatusCancellable(listing.status)) {
      Alert.alert("Error", "This listing cannot be cancelled.");
      return;
    }

    Alert.alert(
      "Cancel Listing",
      "Are you sure you want to cancel this listing? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              const batch = writeBatch(db);

              const listingRef = doc(db, "listings", listingId);
              batch.delete(listingRef);

              const userRef = doc(db, "users", currentUser.uid);
              batch.update(userRef, {
                listingIds: arrayRemove(listingId),
              });

              const bookRef = doc(db, "books", listing.isbn);
              batch.update(bookRef, {
                listingIds: arrayRemove(listingId),
              });

              await batch.commit();

              setListings((prevListings) =>
                prevListings.filter((l) => l.id !== listingId)
              );

              Alert.alert(
                "Success",
                "Listing has been successfully cancelled."
              );
            } catch (error) {
              console.error("Error cancelling listing:", error);
              Alert.alert(
                "Error",
                "Failed to cancel listing. Please try again later."
              );
            }
          },
        },
      ]
    );
  };

  const renderListings = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    const displayedListings = getDisplayedListings();

    if (displayedListings.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === "Active" && "No active listings"}
            {activeTab === "Pending" && "No pending listings"}
            {activeTab === "History" && "No history listings"}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === "Active" && "Active listings will show up here"}
            {activeTab === "Pending" && "Pending listings will show up here"}
            {activeTab === "History" && "Completed listings will show up here"}
          </Text>
        </View>
      );
    }

    return (
      <>
        {displayedListings.map((listing) => (
          <ListingCard
            key={listing.id}
            {...listing}
            title={listing.title}
            yourPrice={listing.price}
            lowestPrice={listing.lowestPrice}
            isAdmin={isUserAdmin}
            onEdit={() =>
              router.push({
                pathname: "/(tabs)/sell/editListing/[id]",
                params: { id: listing.id },
              })
            }
            onCancel={() => handleCancelListing(listing.id)}
          />
        ))}
      </>
    );
  };

  return (
    <View style={styles.componentContainer}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.tabsContainer}>
            {tabData.map(({ label, count }) => (
              <Pressable
                key={label}
                style={[styles.tab, activeTab === label && styles.activeTab]}
                onPress={() => setActiveTab(label)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === label && styles.activeTabText,
                  ]}
                >
                  {label}
                </Text>
                <View style={styles.countContainer}>
                  <Text style={styles.countText}>{count}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.gray}
            />
          </View> */}

          {renderListings()}
        </View>
      </ScrollView>
    </View>
  );
};

export default ListingManager;

const styles = StyleSheet.create({
  componentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.padding.screen,
    paddingBottom: 100, // Extra padding at the bottom
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  countContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingHorizontal: 6,
    marginLeft: 5,
    height: 18,
    justifyContent: "center",
  },
  countText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.white,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.input,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    marginLeft: 8,
    color: COLORS.black,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
  },
});
