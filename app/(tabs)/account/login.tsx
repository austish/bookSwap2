// (tabs)/account/login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";
import InputField from '@/components/InputField';

type RootStackParamList = {
  Buy: undefined;
  Sell: undefined;
  Account: undefined;
  Cart: undefined;
  SignUp: undefined;
  MainTabs: undefined;
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return false;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      console.log("User logged in successfully:", userCredential.user.uid);
      router.push("/buy");
    } catch (error: any) {
      let errorMessage = "Failed to login. Please try again.";

      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        default:
          console.error("Login error:", error);
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>

        <InputField
          icon="email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
        />

        <InputField
          icon="lock"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? "LOGGING IN..." : "LOGIN"}
          </Text>
        </TouchableOpacity>

        <Pressable
          onPress={() => router.push("/account/signup")}
          style={styles.signUpLink}
          disabled={isLoading}
        >
          <Text style={styles.signUpText}>
            Don't have an account?{" "}
            <Text style={styles.signUpHighlight}>Sign Up</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.medium,
    fontWeight: "bold",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  signUpLink: {
    marginTop: 20,
    alignItems: "center",
  },
  signUpText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
  },
  signUpHighlight: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});
