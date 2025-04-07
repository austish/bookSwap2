// app/(tabs)/buy/checkout.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/firebaseConfig";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  writeBatch,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

type CheckoutStep = "summary" | "payment" | "confirmation";

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { items, getCartTotal, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("summary");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  //   const [preferredPaymentMethod, setPreferredPaymentMethod] =
  //     useState<PaymentMethod | null>(null);
  //   const [savePaymentMethod, setSavePaymentMethod] = useState(false);

  // Calculate total price
  const totalAmount = getCartTotal();

  // Get user data including preferred payment method
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnapshot = await getDoc(userRef);

          if (userSnapshot.exists()) {
            const data = userSnapshot.data();
            setUserData(data);
            // Set preferred payment method if available
            // if (data.preferredPaymentMethod) {
            //   setPreferredPaymentMethod(
            //     data.preferredPaymentMethod as PaymentMethod
            //   );
            //   setPaymentMethod(data.preferredPaymentMethod as PaymentMethod);
            // }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  // Handle going back to previous step
  const handleBack = () => {
    if (currentStep === "summary") {
      router.back();
    } else if (currentStep === "payment") {
      setCurrentStep("summary");
    } else {
      setCurrentStep("payment");
    }
  };

  // Handle proceeding to next step
  const handleNext = () => {
    if (currentStep === "summary") {
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      // Validate payment method selection
      if (!acceptedTerms) {
        Alert.alert(
          "Required Information",
          "Please accept the terms of service to continue."
        );
        return;
      }
      setCurrentStep("confirmation");
    }
  };

  // Handle final checkout submission
  const handleCheckout = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to place an order.");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create a new order ID
      const orderRef = doc(collection(db, "orders"));
      const orderId = orderRef.id;

      // Get the purchased items data (similar to your original code)
      const purchasedItems = items.map((item) => {
        // Your existing mapping logic
        return {
          listingId: item.id,
          isbn: item.isbn,
          title: item.title,
          condition: item.condition,
          price: item.price,
          sellerId: item.sellerId,
          // Other fields you need
        };
      });

      // Store pending order in Firestore (status: "payment_pending")
      // This should be a minimal record that will be updated after payment success
      const pendingOrderData = {
        id: orderId,
        buyerId: user.uid,
        buyerEmail: user.email,
        items: purchasedItems,
        totalAmount,
        status: "payment_pending",
        createdAt: serverTimestamp(),
      };

      // Save the pending order
      await setDoc(orderRef, pendingOrderData);

      // Handle Stripe payment

    } catch (error) {
      console.error("Error creating pending order:", error);
      Alert.alert(
        "Checkout Error",
        "There was an error processing your order. Please try again."
      );
      setIsProcessing(false);
    }
  };

  // Render the order summary step
  const renderOrderSummary = (isConfirmation: boolean) => (
    <View>
      <Text style={styles.stepTitle}>
        {isConfirmation ? "Order Confirmation" : "Order Summary"}
      </Text>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      ) : (
        <>
          {/* List of items */}
          <View>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemCondition}>{item.condition}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Total amount */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
          </View>
        </>
      )}
    </View>
  );

  // Render the payment method step
  const renderPaymentMethod = () => (
    <View>
      <Text style={styles.stepTitle}>Payment Method</Text>

      <View style={styles.paymentSection}>
        <View style={styles.paymentHeader}>
          <Icon name="credit-card" size={24} color={COLORS.primary} />
          <Text style={styles.paymentTitle}>
            Credit/Debit Card (via Stripe)
          </Text>
        </View>

        <View style={styles.paymentInstructions}>
          <Text style={styles.instructionTitle}>Payment Information:</Text>
          <Text style={styles.instructionText}>
            • Your payment will be securely processed by Stripe
          </Text>
          <Text style={styles.instructionText}>
            • You'll be redirected to complete payment after reviewing your
            order
          </Text>
          <Text style={styles.instructionText}>
            • Your payment information is never stored on our servers
          </Text>
        </View>

        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View
              style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
            >
              {acceptedTerms && (
                <Icon name="check" size={16} color={COLORS.white} />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I understand
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.note}>
        <Icon name="information-outline" size={20} color={COLORS.primary} />
        <Text style={styles.noteText}>
          In the event the seller fails to drop off the book within 5 business
          days or their book doesn't match the listed condition, you'll receive
          a full refund.
        </Text>
      </View>
    </View>
  );

  // Render the confirmation step
  const renderConfirmation = () => (
    <View>
      {renderOrderSummary(true)}

      {/* <View style={styles.confirmationSection}>
        <Text style={styles.confirmationSectionTitle}>Payment Method:</Text>
        <Text style={styles.confirmationText}>
          {paymentMethod === "venmo"
            ? `Venmo: ${venmoUsername}`
            : `Zelle: ${zelleInfo}`}
        </Text>
      </View> */}

      {notes && (
        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationSectionTitle}>Additional Notes:</Text>
          <Text style={styles.confirmationText}>{notes}</Text>
        </View>
      )}

      <View style={styles.processInfoContainer}>
        <Text style={styles.processInfoTitle}>What Happens Next:</Text>
        <View style={styles.processStep}>
          <View style={styles.processStepNumber}>
            <Text style={styles.processStepNumberText}>1</Text>
          </View>
          <Text style={styles.processStepText}>
            Your payment will be processed.
          </Text>
        </View>
        <View style={styles.processStep}>
          <View style={styles.processStepNumber}>
            <Text style={styles.processStepNumberText}>2</Text>
          </View>
          <Text style={styles.processStepText}>
            The seller has 5 business days to drop off your book(s) at the
            BookSwap Center.
          </Text>
        </View>
        <View style={styles.processStep}>
          <View style={styles.processStepNumber}>
            <Text style={styles.processStepNumberText}>3</Text>
          </View>
          <Text style={styles.processStepText}>
            Once the book is dropped off, you'll receive a notification to pick
            it up.
          </Text>
        </View>
        <View style={styles.processStep}>
          <View style={styles.processStepNumber}>
            <Text style={styles.processStepNumberText}>4</Text>
          </View>
          <Text style={styles.processStepText}>
            You'll have 5 business days to pick up your book(s) from the
            BookSwap Center (Room 201 in the Student Union Building).
          </Text>
        </View>
      </View>

      <View style={styles.note}>
        <Icon name="information-outline" size={20} color={COLORS.primary} />
        <Text style={styles.noteText}>
          Text
        </Text>
      </View>
    </View>
  );

  // Render the appropriate step content based on currentStep
  const renderStepContent = () => {
    switch (currentStep) {
      case "summary":
        return renderOrderSummary(false);
      case "payment":
        return renderPaymentMethod();
      case "confirmation":
        return renderConfirmation();
      default:
        return null;
    }
  };

  // Get the appropriate button text based on currentStep
  const getButtonText = () => {
    switch (currentStep) {
      case "summary":
        return "Continue to Payment";
      case "payment":
        return "Review Order";
      case "confirmation":
        return "Place Order";
      default:
        return "Next";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          disabled={isProcessing}
        >
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              currentStep === "summary"
                ? styles.activeProgressDot
                : currentStep === "payment" || currentStep === "confirmation"
                ? styles.completedProgressDot
                : {},
            ]}
          >
            {(currentStep === "payment" || currentStep === "confirmation") && (
              <Icon name="check" size={16} color={COLORS.white} />
            )}
          </View>
          <Text style={styles.progressText}>Summary</Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              currentStep === "payment"
                ? styles.activeProgressDot
                : currentStep === "confirmation"
                ? styles.completedProgressDot
                : {},
            ]}
          >
            {currentStep === "confirmation" && (
              <Icon name="check" size={16} color={COLORS.white} />
            )}
          </View>
          <Text style={styles.progressText}>Payment</Text>
        </View>

        <View style={styles.progressLine} />

        <View style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              currentStep === "confirmation" && styles.activeProgressDot,
            ]}
          />
          <Text style={styles.progressText}>Confirm</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>{renderStepContent()}</ScrollView>

      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        {items.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, isProcessing && styles.disabledButton]}
            onPress={
              currentStep === "confirmation" ? handleCheckout : handleNext
            }
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.actionButtonText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  creditCardForm: {
    marginTop: SIZES.padding.medium,
    marginBottom: SIZES.padding.large,
  },
  paymentSection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.medium,
    padding: SIZES.padding.medium,
    marginBottom: SIZES.padding.medium,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.padding.medium,
  },
  paymentTitle: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    color: COLORS.black,
    marginLeft: SIZES.padding.small,
  },
  paymentInstructions: {
    backgroundColor: COLORS.lightGray + "30",
    padding: SIZES.padding.medium,
    borderRadius: SIZES.borderRadius.small,
  },
  instructionTitle: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    marginBottom: 5,
  },
  highlight: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  processInfoContainer: {
    marginTop: SIZES.padding.small,
    marginBottom: SIZES.padding.medium,
    padding: SIZES.padding.medium,
    backgroundColor: COLORS.primary + "10",
    borderRadius: SIZES.borderRadius.medium,
  },
  processInfoTitle: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: SIZES.padding.medium,
  },
  processStep: {
    flexDirection: "row",
    marginBottom: SIZES.padding.small,
    alignItems: "flex-start",
  },
  processStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SIZES.padding.small,
  },
  processStepNumberText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  processStepText: {
    flex: 1,
    fontSize: SIZES.fontSize.small,
    color: COLORS.black,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: SIZES.padding.small,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding.screen,
    paddingVertical: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  progressStep: {
    alignItems: "center",
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activeProgressDot: {
    backgroundColor: COLORS.secondary,
  },
  completedProgressDot: {
    backgroundColor: COLORS.success,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
    padding: SIZES.padding.screen,
  },
  stepTitle: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: SIZES.padding.large,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: SIZES.padding.large,
  },
  emptyText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
  },
  itemRow: {
    paddingVertical: SIZES.padding.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemTitle: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemCondition: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
  },
  itemPrice: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    color: COLORS.black,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SIZES.padding.medium,
    borderTopWidth: 2,
    borderTopColor: COLORS.gray,
  },
  totalLabel: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "bold",
    color: COLORS.black,
  },
  totalAmount: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  paymentOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.padding.large,
  },
  paymentOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SIZES.padding.medium,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.medium,
  },
  selectedPaymentOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10", // 10% opacity
  },
  paymentOptionText: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
    marginTop: 8,
  },
  selectedPaymentOptionText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  saveMethodContainer: {
    marginBottom: SIZES.padding.large,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
  },
  note: {
    flexDirection: "row",
    backgroundColor: COLORS.lightGray + "40", // 40% opacity
    padding: SIZES.padding.medium,
    borderRadius: SIZES.borderRadius.small,
    alignItems: "flex-start",
  },
  noteText: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
    marginLeft: 8,
    flex: 1,
  },
  formGroup: {
    marginBottom: SIZES.padding.small,
  },
  formLabel: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    marginBottom: 8,
  },
  formInput: {
    height: SIZES.height.input,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.small,
    paddingHorizontal: SIZES.padding.medium,
    fontSize: SIZES.fontSize.medium,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: SIZES.padding.small,
  },
  pickupNote: {
    flexDirection: "row",
    backgroundColor: COLORS.lightGray + "40", // 40% opacity
    padding: SIZES.padding.medium,
    borderRadius: SIZES.borderRadius.small,
    alignItems: "flex-start",
    marginTop: SIZES.padding.medium,
  },
  pickupNoteText: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
    marginLeft: 8,
    flex: 1,
  },
  confirmationSection: {
    marginBottom: SIZES.padding.medium,
  },
  confirmationSectionTitle: {
    marginTop: SIZES.padding.medium,
    fontSize: SIZES.fontSize.large,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  confirmationItem: {
    paddingVertical: SIZES.padding.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  confirmationItemTitle: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
  },
  confirmationItemDetails: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
  },
  confirmationText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    marginBottom: 4,
  },
  confirmationTotal: {
    fontSize: SIZES.fontSize.large,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  termsContainer: {
    backgroundColor: COLORS.lightGray + "40", // 40% opacity
    padding: SIZES.padding.medium,
    borderRadius: SIZES.borderRadius.small,
    marginTop: SIZES.padding.medium,
  },
  termsText: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
  },
  buttonContainer: {
    padding: SIZES.padding.screen,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    height: SIZES.height.button,
    borderRadius: SIZES.borderRadius.large,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
