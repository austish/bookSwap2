// (tabs)/account/sellingInstructions.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native";
import { COLORS } from "@/constants/theme";
import { router } from "expo-router";

export default function SellingInstructionsScreen() {

  const handleSignupPress = () => {
    router.replace("/(tabs)/account/signup")
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start Selling Today!</Text>

      <View style={styles.instructionsContainer}>
        <Text style={styles.subtitle}>How it works:</Text>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>
            Create an account or sign in to get started.
          </Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>
            List your book and bring it to *ROOM*. We'll hold it until someone
            buys it.
          </Text>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>
            Once someone buys and picks up your book, we'll transfer you the
            money!
          </Text>
        </View>
        <Text style={styles.miscText}>
          Change your mind? Don't worry! Cancel the listing and we'll hold your
          book for up to 14 days.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignupPress}>
        <Text style={styles.buttonText}>Sign Up to Start Selling</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: COLORS.primary,
  },
  instructionsContainer: {
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    color: "#fff",
    textAlign: "center",
    lineHeight: 30,
    marginRight: 15,
    fontSize: 16,
    fontWeight: "600",
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  miscText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
