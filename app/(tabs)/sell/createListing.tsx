// (tabs)/sell/createListing.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import CustomPicker from "@/components/CustomPicker";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { ListingStatus } from "@/types/listingStatus";
import { classifyBook } from "@/utils/bookClassifier";
import {
  GENRE_OPTIONS,
  BOOK_TYPES,
  SUBJECT_OPTIONS,
  CONDITIONS,
  getConditionLabel,
} from "@/types/bookOptions";
import { auth, db } from "@/firebaseConfig";
import { StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import { router } from "expo-router";

interface BookDocument {
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  yearPublished?: string;
  pageCount?: number;
  coverUrl?: string;
  type: (typeof BOOK_TYPES)[number]["id"];
  subject?: (typeof SUBJECT_OPTIONS)[number]["id"];
  genre?: (typeof GENRE_OPTIONS)[number]["id"];
  listingIds: string[];
}

interface ListingDocument {
  listingId: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  condition: string;
  notes?: string;
  price: number;
  createdAt: Date;
  expiresAt: Date | null;
  status: ListingStatus;
  isbn: string;
  title: string;
}

interface BookInfo {
  title: string;
  author: string;
  publisher?: string;
  publishDate?: string;
  numberOfPages?: number;
  coverUrl?: string;
  isbn: string;
  type: (typeof BOOK_TYPES)[number]["id"];
  subject?: (typeof SUBJECT_OPTIONS)[number]["id"];
  genre?: (typeof GENRE_OPTIONS)[number]["id"];
}

interface FormData {
  isbn: string;
  condition: string;
  price: string;
  notes?: string;
  bookInfo?: BookInfo;
}

interface FormErrors {
  [key: string]: string;
}

export default function CreateListingScreen() {
  const [formData, setFormData] = useState<FormData>({
    isbn: "",
    condition: "",
    price: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [isIsbnValid, setIsIsbnValid] = useState(false);
  const [isCheckingIsbn, setIsCheckingIsbn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced ISBN validation
  // Show error while typing if ISBN length is wrong
  useEffect(() => {
    if (
      formData.isbn.length > 0 &&
      formData.isbn.length !== 10 &&
      formData.isbn.length !== 13
    ) {
      setErrors((prev) => ({
        ...prev,
        isbn: `ISBN must be 10 or 13 digits (current: ${formData.isbn.length})`,
      }));
      setIsIsbnValid(false);
      return;
    }

    const validateIsbn = async () => {
      // Only check with API if ISBN is 10 or 13 digits
      if (!/^[\dX]{10}$|^[\dX]{13}$/.test(formData.isbn)) {
        return;
      }

      setIsCheckingIsbn(true);
      try {
        const response = await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${formData.isbn}&format=json&jscmd=data`
        );
        const data = await response.json();
        const bookData = data[`ISBN:${formData.isbn}`];

        if (bookData) {
          setIsIsbnValid(true);
          setErrors((prev) => ({ ...prev, isbn: "" }));
          const subjects = bookData.subjects || [];
          const classification = classifyBook(subjects);

          // Store book information
          const bookInfo: BookInfo = {
            title: bookData.title,
            author: bookData.authors?.[0]?.name || "Unknown Author",
            publisher: bookData.publishers?.[0]?.name,
            publishDate: bookData.publish_date,
            numberOfPages: bookData.number_of_pages,
            coverUrl: bookData.cover?.medium,
            isbn:
              bookData.identifiers?.isbn_13?.[0] ||
              bookData.identifiers?.isbn_10?.[0] ||
              formData.isbn,
            type: classification.bookType,
            genre: classification.genre,
            subject: classification.subject,
          };

          setFormData((prev) => ({
            ...prev,
            bookInfo,
          }));
        } else {
          setIsIsbnValid(false);
          setErrors((prev) => ({
            ...prev,
            isbn: "Invalid ISBN - book not found",
          }));
        }
      } catch (error) {
        setIsIsbnValid(false);
        setErrors((prev) => ({ ...prev, isbn: "Error checking ISBN" }));
      } finally {
        setIsCheckingIsbn(false);
      }
    };

    // Set up debounce timer
    const timeoutId = setTimeout(() => {
      if (formData.isbn.length === 10 || formData.isbn.length === 13) {
        validateIsbn();
      }
    }, 1000); // Wait 1 second after typing stops

    // Cleanup timeout
    return () => clearTimeout(timeoutId);
  }, [formData.isbn]);

  const isFormValid = (): boolean => {
    // Check if all required fields are filled and valid
    return (
      isIsbnValid &&
      formData.isbn !== "" &&
      formData.bookInfo !== undefined &&
      formData.condition !== "" &&
      formData.price !== "" &&
      !/^\d+(\.\d{0,2})?$/.test(formData.price) === false // Ensure price is valid number
    );
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (!isFormValid()) {
      return;
    }

    // Get current user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert(
        "Authentication Error",
        "You must be logged in to create a listing.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsSubmitting(true);
    setErrors({}); // Clear any previous errors

    try {
      // Generate a new listing ID
      const listingCollection = collection(db, "listings");
      const listingId = doc(listingCollection).id;

      // Check if a book document exists for this ISBN
      if (!formData.bookInfo?.isbn) {
        throw new Error("ISBN is undefined");
      }
      const bookRef = doc(db, "books", formData.bookInfo.isbn);
      const bookSnapshot = await getDoc(bookRef);

      // Only create a new book document if one doesn't exist
      if (!bookSnapshot.exists()) {
        const bookDoc: BookDocument = {
          isbn: formData.bookInfo?.isbn || "",
          title: formData.bookInfo?.title || "Unknown Title",
          author: formData.bookInfo?.author || "Unknown Author",
          publisher: formData.bookInfo?.publisher || "Unknown Publisher",
          yearPublished: formData.bookInfo?.publishDate || "Unknown Year",
          pageCount: formData.bookInfo?.numberOfPages || 0,
          coverUrl: formData.bookInfo?.coverUrl || "",
          type: formData.bookInfo?.type || "other",
          subject: formData.bookInfo?.subject || "",
          genre: formData.bookInfo?.genre || "any",
          // Initialize with the current listing ID
          listingIds: [listingId],
        };

        // Add the book document to Firestore
        await setDoc(bookRef, bookDoc);
      } else {
        // Book exists, update the listingIds array
        await updateDoc(bookRef, {
          listingIds: [...bookSnapshot.data()?.listingIds, listingId],
        });
      }
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      const displayName = userDoc.data()?.displayName;

      // Create the listing document
      const listingDoc: ListingDocument = {
        listingId,
        sellerId: currentUser.uid,
        sellerName: displayName || "Unknown Seller",
        sellerEmail: currentUser.email || "Unknown Email",
        condition: formData.condition,
        notes: formData.notes || "",
        price: parseFloat(formData.price),
        createdAt: new Date(),
        expiresAt: null,
        status: "active",
        isbn: formData.bookInfo?.isbn || "",
        title: formData.bookInfo?.title || "Unknown Title",
      };

      // Add the listing document
      const listingRef = doc(db, "listings", listingId);
      await setDoc(listingRef, listingDoc);

      await runTransaction(db, async (transaction) => {
        if (!userDoc.exists()) {
          throw new Error("User document not found");
        }

        const userData = userDoc.data();
        const listingIds = userData?.listingIds || [];

        transaction.update(userRef, {
          listingIds: [...listingIds, listingId],
        });
      });

      // Show success message before navigating
      Alert.alert(
        "Listing Active",
        "Your listing has been created successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );

      console.log("Listing created successfully");
    } catch (error) {
      console.error("Error creating listing:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to create listing. Please try again.",
      }));

      Alert.alert(
        "Error",
        "There was a problem creating your listing. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === "isbn") {
      if (value.length > 0 && value.length !== 10 && value.length !== 13) {
        setErrors((prev) => ({
          ...prev,
          isbn: `ISBN must be 10 or 13 digits (current: ${value.length})`,
        }));
        setIsIsbnValid(false);
      } else {
        setErrors((prev) => ({ ...prev, isbn: "" }));
      }

      // Clear book info and reset dependent fields when ISBN is edited
      setFormData((prev) => ({
        ...prev,
        isbn: value,
        bookInfo: undefined,
        condition: "",
        price: "",
      }));
      setIsIsbnValid(false);
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    }
  };

  // Determine if each field should be enabled
  const isConditionEnabled = isIsbnValid;
  const isPriceEnabled = isIsbnValid && formData.condition !== "";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="chevron-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Listing</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>ISBN</Text>
            <View style={styles.isbnContainer}>
              <TextInput
                style={[styles.input, isIsbnValid && styles.validInput]}
                value={formData.isbn}
                onChangeText={(value) => handleInputChange("isbn", value)}
                placeholder="Enter 10 or 13-digit ISBN"
                keyboardType="numeric"
                maxLength={13}
                editable={!isSubmitting}
              />
              {isCheckingIsbn && (
                <ActivityIndicator
                  style={styles.isbnLoader}
                  color={COLORS.primary}
                />
              )}
            </View>
            {errors.isbn && <Text style={styles.errorText}>{errors.isbn}</Text>}
            {isIsbnValid && formData.bookInfo && (
              <View style={styles.bookInfo}>
                <View style={styles.bookHeader}>
                  {formData.bookInfo.coverUrl && (
                    <Image
                      source={{ uri: formData.bookInfo.coverUrl }}
                      style={styles.coverImage}
                      resizeMode="contain"
                    />
                  )}
                  <View style={styles.bookHeaderText}>
                    <Text style={styles.bookTitle}>
                      {formData.bookInfo.title}
                    </Text>
                    <Text style={styles.bookAuthor}>
                      {formData.bookInfo.author}
                    </Text>
                    <View style={styles.bookDetails}>
                      {formData.bookInfo.publishDate && (
                        <Text style={styles.bookDetail}>
                          {formData.bookInfo.publishDate}
                        </Text>
                      )}
                      {formData.bookInfo.numberOfPages && (
                        <Text style={styles.bookDetail}>
                          {formData.bookInfo.numberOfPages} pages
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text
              style={[
                styles.label,
                !isConditionEnabled && styles.disabledLabel,
              ]}
            >
              Condition
            </Text>
            <TouchableOpacity
              style={[
                styles.pickerButton,
                !isConditionEnabled && styles.disabledInput,
                formData.condition !== "" && styles.validInput,
              ]}
              onPress={() => isConditionEnabled && setShowConditionPicker(true)}
              disabled={!isConditionEnabled || isSubmitting}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !isConditionEnabled && styles.disabledText,
                ]}
              >
                {formData.condition
                  ? getConditionLabel(formData.condition)
                  : "Select Condition"}
              </Text>
              <Icon
                name="chevron-down"
                size={24}
                color={isConditionEnabled ? COLORS.gray : COLORS.lightGray}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text
              style={[
                styles.label,
                !isConditionEnabled && styles.disabledLabel,
              ]}
            >
              Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                !isConditionEnabled && styles.disabledInput,
                formData.notes && styles.validInput,
              ]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange("notes", value)}
              placeholder="Add any notes about the condition"
              multiline={true}
              numberOfLines={3}
              editable={isConditionEnabled && !isSubmitting}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text
              style={[styles.label, !isPriceEnabled && styles.disabledLabel]}
            >
              Price
            </Text>
            <View
              style={[
                styles.priceInputContainer,
                !isPriceEnabled && styles.disabledInput,
                formData.price !== "" && isPriceEnabled && styles.validInput,
              ]}
            >
              <Text
                style={[
                  styles.dollarSign,
                  !isPriceEnabled && styles.disabledText,
                ]}
              >
                $
              </Text>
              <TextInput
                style={[
                  styles.priceInput,
                  !isPriceEnabled && styles.disabledText,
                ]}
                value={formData.price}
                onChangeText={(value) => handleInputChange("price", value)}
                placeholder="Enter price"
                keyboardType="decimal-pad"
                editable={isPriceEnabled && !isSubmitting}
              />
            </View>
            {errors.price && (
              <Text style={styles.errorText}>{errors.price}</Text>
            )}
          </View>

          {errors.submit && (
            <Text style={[styles.errorText, styles.submitError]}>
              {errors.submit}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid() || isSubmitting) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Create Listing</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomPicker
        visible={showConditionPicker}
        value={formData.condition}
        options={CONDITIONS}
        onSelect={(value: string) => handleInputChange("condition", value)}
        onClose={() => setShowConditionPicker(false)}
        title="Select Condition"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.padding.screen,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    color: COLORS.primary,
    fontSize: SIZES.fontSize.large,
    fontWeight: "600",
    marginLeft: SIZES.padding.small,
  },
  backButton: {
    padding: 8,
    color: COLORS.primary,
  },
  inputContainer: {
    marginBottom: SIZES.spacing.vertical.medium,
  },
  label: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 8,
  },
  disabledLabel: {
    color: COLORS.gray,
  },
  isbnContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  isbnLoader: {
    position: "absolute",
    right: 12,
  },
  input: {
    height: SIZES.height.input,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.input,
    paddingHorizontal: SIZES.padding.medium,
    fontSize: SIZES.fontSize.medium,
    backgroundColor: COLORS.white,
    flex: 1,
  },
  disabledInput: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.lightGray,
  },
  validInput: {
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  bookInfo: {
    marginTop: 8,
    padding: SIZES.padding.medium,
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.small,
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  coverImage: {
    width: 80,
    height: 120,
    borderRadius: SIZES.borderRadius.small,
    backgroundColor: "#D3D3D3",
  },
  bookHeaderText: {
    flex: 1,
    marginLeft: SIZES.padding.medium,
  },
  bookTitle: {
    fontSize: SIZES.fontSize.medium,
    fontWeight: "600",
    color: COLORS.black,
  },
  bookAuthor: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
    marginTop: 4,
  },
  bookDetails: {
    marginTop: 8,
  },
  bookDetail: {
    fontSize: SIZES.fontSize.small,
    color: COLORS.gray,
    marginTop: 2,
  },
  pickerButton: {
    height: SIZES.height.input,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.input,
    paddingHorizontal: SIZES.padding.medium,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
  },
  pickerButtonText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
  },
  disabledText: {
    color: COLORS.gray,
  },
  errorText: {
    color: "red",
    fontSize: SIZES.fontSize.small,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: SIZES.height.button,
    borderRadius: SIZES.borderRadius.large,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SIZES.spacing.vertical.medium,
    paddingHorizontal: SIZES.padding.large,
    minWidth: 200,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: SIZES.fontSize.large,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: SIZES.height.input,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.input,
    backgroundColor: COLORS.white,
  },
  dollarSign: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    paddingLeft: SIZES.padding.medium,
    paddingRight: 4,
  },
  priceInput: {
    flex: 1,
    height: "100%",
    fontSize: SIZES.fontSize.medium,
    paddingRight: SIZES.padding.medium,
  },
  notesInput: {
    height: 100,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.borderRadius.input,
    paddingHorizontal: SIZES.padding.medium,
    paddingTop: SIZES.padding.small,
    fontSize: SIZES.fontSize.medium,
    backgroundColor: COLORS.white,
    textAlignVertical: "top",
  },
  submitError: {
    textAlign: "center",
    marginBottom: SIZES.spacing.vertical.medium,
    fontSize: SIZES.fontSize.medium,
  },
});
