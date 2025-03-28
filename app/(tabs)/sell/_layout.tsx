// (tabs)/sell/_layout.tsx
import { Stack } from "expo-router";
import React, { useState, useEffect } from "react";
import { auth } from "@/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function SellLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      if (initializing) {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, [initializing]);

  // Don't render anything while checking auth state
  if (initializing) {
    return null;
  }

  // Conditionally prepare the screens based on login state
  if (!isLoggedIn) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="sellingInstructions" />
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
      </Stack>
    );
  }
}
