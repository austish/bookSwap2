import { router, Stack } from "expo-router";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { onAuthStateChanged } from "firebase/auth";
import { ActivityIndicator, View } from "react-native";

export default function AccountLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/(tabs)/account/signup");
      } else {
        router.replace("/(tabs)/account");
      }
    }
  }, [user, isLoading]);

  // Show loading indicator while auth state is being determined
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Conditionally prepare the screens based on login state
  if (!user) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    );
  } else {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="admin" />
      </Stack>
    );
  }
}
