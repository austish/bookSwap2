// src/screens/SignUp/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import InputField from "@/components/InputField";
import { db } from "@/firebaseConfig";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";

interface RequirementCheckProps {
  met: boolean;
}

const RequirementCheck: React.FC<RequirementCheckProps> = ({ met }) => (
  <Text style={{ color: met ? COLORS.success : COLORS.gray }}>
    {met ? "✓" : "○"}
  </Text>
);

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Password validation states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasLowerCase, setHasLowerCase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);

  // Check password requirements in real-time
  useEffect(() => {
    setHasMinLength(password.length >= 8);
    setHasUpperCase(/[A-Z]/.test(password));
    setHasLowerCase(/[a-z]/.test(password));
    setHasNumber(/\d/.test(password));
  }, [password]);

  // Existing validation functions
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validatePassword = (passwordValue: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(passwordValue);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return false;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (!validatePassword(password)) {
      Alert.alert("Error", "Password must meet all requirements");
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Safety timeout to reset loading state after 10 seconds
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        displayName: name,
        email: email,
        phoneNumber: null,
        dateJoined: serverTimestamp(),
        lastActive: serverTimestamp(),
        numOfPurchases: 0,
        numOfSales: 0,
        listingIds: [],
        purchaseIds: [],
        saleIds: [],
        notifications: {
          email: true,
          push: true,
        },
        searchAlerts: [],
        preferredPaymentMethod: null,
        accountStatus: "active",
        admin: false,
      });

      setIsLoading(false);
      router.push("/buy");
    } catch (error: any) {
      let errorMessage = "An error occurred while creating your account";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email address is already registered";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password accounts are not enabled";
          break;
        case "auth/weak-password":
          errorMessage = "Please enter a stronger password";
          break;
        default:
          errorMessage = `Error: ${error.message || "Unknown error occurred"}`;
      }

      Alert.alert("Error", errorMessage, [
        {
          text: "OK",
          onPress: () => setIsLoading(false),
        },
      ]);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign Up</Text>

        <InputField
          icon="account"
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />

        <InputField
          icon="email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <InputField
          icon="lock"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          showPassword={showPassword}
          togglePassword={() => setShowPassword(!showPassword)}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
        />

        {/* Password Requirements - only shown when password input is focused */}
        {isPasswordFocused && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>

            <View style={styles.requirement}>
              <RequirementCheck met={hasMinLength} />
              <Text
                style={[
                  styles.requirementText,
                  { color: hasMinLength ? COLORS.success : COLORS.gray },
                ]}
              >
                At least 8 characters
              </Text>
            </View>

            <View style={styles.requirement}>
              <RequirementCheck met={hasUpperCase} />
              <Text
                style={[
                  styles.requirementText,
                  { color: hasUpperCase ? COLORS.success : COLORS.gray },
                ]}
              >
                One uppercase letter
              </Text>
            </View>

            <View style={styles.requirement}>
              <RequirementCheck met={hasLowerCase} />
              <Text
                style={[
                  styles.requirementText,
                  { color: hasLowerCase ? COLORS.success : COLORS.gray },
                ]}
              >
                One lowercase letter
              </Text>
            </View>

            <View style={styles.requirement}>
              <RequirementCheck met={hasNumber} />
              <Text
                style={[
                  styles.requirementText,
                  { color: hasNumber ? COLORS.success : COLORS.gray },
                ]}
              >
                One number
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.createButton,
            isLoading && styles.createButtonDisabled,
          ]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? "SIGNING UP..." : "SIGN UP"}
          </Text>
        </TouchableOpacity>

        <Pressable
          onPress={() => router.push("/account/login")}
          style={styles.loginLink}
          testID="loginLink"
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginHighlight}>Log In</Text>
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
    padding: SIZES.padding.screen,
  },
  title: {
    fontSize: SIZES.fontSize.title,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SIZES.spacing.vertical.medium,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius.large,
    height: SIZES.height.button,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.spacing.vertical.medium,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.medium,
    fontWeight: "bold",
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  loginLink: {
    marginTop: SIZES.spacing.vertical.medium,
    alignItems: "center",
  },
  loginText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
  },
  loginHighlight: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  requirementsContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  requirementsTitle: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
    marginBottom: 8,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  requirementText: {
    fontSize: SIZES.fontSize.small,
    marginLeft: 8,
  },
});
