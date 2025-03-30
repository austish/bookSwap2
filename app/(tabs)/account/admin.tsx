// (tabs)/account/admin.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "@/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { User } from "@/types/user";
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";

export default function AdminScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", ">=", searchQuery),
        where("email", "<=", searchQuery + "\uf8ff")
      );

      const usersSnapshot = await getDocs(q);

      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateJoined: doc.data().dateJoined.toDate(),
        lastActive: doc.data().lastActive.toDate(),
      })) as User[];

      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user: User) => {
    router.push({
      pathname: "/(tabs)/account/userDetails/[id]",
      params: { id: user.id},
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Page</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search user by email"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="magnify" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userItem}
              onPress={() => handleUserPress(user)}
            >
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userName}>{user.displayName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  title: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: "row",
    padding: SIZES.padding.screen,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.small,
    padding: SIZES.padding.small,
    marginRight: SIZES.padding.small,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius.small,
    padding: SIZES.padding.small,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsContainer: {
    flex: 1,
    padding: SIZES.padding.screen,
  },
  userItem: {
    padding: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  userEmail: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    color: COLORS.black,
  },
  userName: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
  },
});
