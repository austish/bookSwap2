// app/(tabs)/sell/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function SellLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
