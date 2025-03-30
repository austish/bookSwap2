// (tabs)/sell/_layout.tsx
import { router, Stack } from "expo-router";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function SellLayout() {
  const { user, isLoading } = useAuth();

  // Force navigation when auth state changes
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/(tabs)/sell/sellingInstructions");
    } else if (!isLoading && user) {
      router.replace("/(tabs)/sell");
    }
  }, [user, isLoading]);

  // Don't render anything while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      {!user ? (
        <Stack.Screen name="sellingInstructions" />
      ) : (
        <Stack.Screen name="index" />
      )}
    </Stack>
  );
}
