import React from "react";
import { View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import ListingManager from "@/components/ListingManager";
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";

export default function SellScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Sell</Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/sell/createListing")}
        >
          <Text style={styles.createButtonText}>Create Listing</Text>
        </TouchableOpacity>
      </View>

      <ListingManager/>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.padding.screen,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: SIZES.fontSize.title,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius.large,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    ...SIZES.shadow.small,
  },
  createButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
});
