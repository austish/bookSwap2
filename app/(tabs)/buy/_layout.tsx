// app/(tabs)/buy/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function BuyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="checkout"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="cart"
        options={{
          presentation: "card",
        }}
      />
    </Stack>
  );
}
