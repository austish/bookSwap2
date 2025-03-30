import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig'
import CustomPicker from '@/components/CustomPicker';
import { CONDITIONS, getConditionLabel } from '@/types/bookOptions';
import {StyleSheet} from 'react-native';
import {COLORS, SIZES} from '@/constants/theme';

interface ListingData {
  condition: string;
  notes: string;
  price: number;
  title: string;
  bookCover: string;
}

export default function EditListingScreen() {
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const params = useLocalSearchParams();
  const listingId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<ListingData>({
    condition: '',
    notes: '',
    price: 0,
    title: '',
    bookCover: '',
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingRef = doc(db, 'listings', listingId);
        const listingDoc = await getDoc(listingRef);

        if (!listingDoc.exists) {
          Alert.alert('Error', 'Listing not found');
          router.back();
          return;
        }
        const listingData = listingDoc.data();

        const bookRef = doc(db, 'books', listingData?.isbn);
        const bookDoc = await getDoc(bookRef);
        const bookData = bookDoc.data();

        setListing({
          condition: listingData?.condition || '',
          notes: listingData?.notes || '',
          price: listingData?.price || 0,
          title: bookData?.title || 'Unknown Book',
          bookCover: bookData?.coverUrl || '',
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching listing:', error);
        Alert.alert('Error', 'Failed to load listing details');
        router.back();
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId, router, db]);

  const handleSave = async () => {
    if (!listing.condition || !listing.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (listing.price <= 0) {
      Alert.alert('Error', 'Price must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const listingRef = doc(db, 'listings', listingId);
      await updateDoc(listingRef, {
        condition: listing.condition,
        notes: listing.notes,
        price: listing.price,
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Listing updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating listing:', error);
      Alert.alert('Error', 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Icon name="arrow-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Listing</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.bookInfo}>
          {listing.bookCover && (
            <Image
              source={{uri: listing.bookCover}}
              style={styles.coverImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.bookDetails}>
            <Text style={styles.bookTitle}>{listing.title}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Condition</Text>
          <TouchableOpacity
            style={[styles.pickerButton]}
            onPress={() => setShowConditionPicker(true)}
            disabled={saving}>
            <Text style={styles.pickerButtonText}>
              {listing.condition
                ? getConditionLabel(listing.condition)
                : 'Select Condition'}
            </Text>
            <Icon name="chevron-down" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={listing.notes}
            onChangeText={text => setListing({...listing, notes: text})}
            placeholder="Add any additional notes about the book"
            multiline
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Price ($)</Text>
          <TextInput
            style={styles.input}
            value={listing.price.toString()}
            onChangeText={text => {
              const price = parseFloat(text) || 0;
              setListing({...listing, price});
            }}
            keyboardType="decimal-pad"
            placeholder="Enter price"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      <CustomPicker
        visible={showConditionPicker}
        value={listing.condition}
        options={CONDITIONS}
        onSelect={(value: string) =>
          setListing(prev => ({...prev, condition: value}))
        }
        onClose={() => setShowConditionPicker(false)}
        title="Select Condition"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.white,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.white,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SIZES.padding.screen,
      paddingVertical: SIZES.spacing.vertical.medium,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.lightGray,
    },
    backButton: {
      marginRight: SIZES.padding.medium,
    },
    title: {
      fontSize: SIZES.fontSize.large,
      fontWeight: '600',
      color: COLORS.black,
    },
    content: {
      flex: 1,
      padding: SIZES.padding.screen,
    },
    bookInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SIZES.spacing.vertical.small,
    },
    coverImage: {
      width: 80,
      height: 120,
      marginRight: SIZES.padding.medium,
      borderRadius: SIZES.borderRadius.small,
    },
    bookDetails: {
      flex: 1,
    },
    bookTitle: {
      fontSize: SIZES.fontSize.large,
      fontWeight: '600',
      color: COLORS.black,
    },
    formSection: {
      marginBottom: SIZES.spacing.vertical.medium,
    },
    sectionTitle: {
      fontSize: SIZES.fontSize.medium,
      fontWeight: '500',
      color: COLORS.black,
      marginBottom: SIZES.spacing.vertical.small,
    },
    input: {
      borderWidth: 1,
      borderColor: COLORS.lightGray,
      borderRadius: SIZES.borderRadius.input,
      padding: SIZES.padding.medium,
      fontSize: SIZES.fontSize.medium,
      color: COLORS.black,
      backgroundColor: COLORS.white,
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: COLORS.lightGray,
      borderRadius: SIZES.borderRadius.input,
      padding: SIZES.padding.medium,
      backgroundColor: COLORS.white,
    },
    pickerButtonText: {
      fontSize: SIZES.fontSize.medium,
      color: COLORS.black,
    },
    validInput: {
      borderColor: COLORS.primary,
    },
    notesInput: {
      height: 100,
      textAlignVertical: 'top',
    },
    footer: {
      padding: SIZES.padding.screen,
      borderTopWidth: 1,
      borderTopColor: COLORS.lightGray,
    },
    saveButton: {
      backgroundColor: COLORS.primary,
      height: SIZES.height.button,
      borderRadius: SIZES.borderRadius.large,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButtonText: {
      color: COLORS.white,
      fontSize: SIZES.fontSize.large,
      fontWeight: '600',
    },
  });
  