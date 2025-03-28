// (tabs)/account/edit.tsx
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StyleSheet } from 'react-native';
import { COLORS, SIZES } from '@/constants/theme';
import { auth } from '@/firebaseConfig';

interface UserData {
  name: string;
  email: string;
  phoneNumber: string | null;
}

interface EditAccountProps {
  userData: UserData | null;
  onUpdateSuccess: () => void;
}

interface FieldConfig {
  label: string;
  value: string;
  icon: string;
  onPress: () => void;
}

const EditAccount: React.FC<EditAccountProps> = ({
  userData,
  onUpdateSuccess,
}) => {
  const [editLoading, setEditLoading] = useState<boolean>(false);

//   const handleUpdateField = async (
//     field: keyof UserData,
//     value: string,
//   ): Promise<void> => {
//     if (!value.trim()) {
//       return;
//     }
//     setEditLoading(true);

//     try {
//       const currentUser = auth.currentUser;
//       if (currentUser) {
//         if (field === 'name') {
//           await currentUser.updateProfile({displayName: value});
//         }

//         await firestore()
//           .collection('users')
//           .doc(currentUser.uid)
//           .update({[field]: value});

//         Alert.alert('Success', `${field} updated successfully`);
//         onUpdateSuccess();
//       }
//     } catch (error) {
//       console.error(`Error updating ${field}:`, error);
//       Alert.alert('Error', `Failed to update ${field}`);
//     } finally {
//       setEditLoading(false);
//     }
//   };

  const renderField = ({
    label,
    value,
    onPress,
  }: FieldConfig): JSX.Element => (
    <TouchableOpacity
      style={styles.fieldContainer}
      onPress={onPress}
      disabled={editLoading}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldValue}>
          <Text style={styles.fieldValueText}>{value}</Text>
          <Icon style={styles.chevron} name="chevron-right" size={24} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderField({
          label: 'Name',
          value: userData.name || 'Not set',
          icon: 'account',
          onPress: () => {
            /* Handle name update */
          },
        })}
        {renderField({
          label: 'Email',
          value: userData.email,
          icon: 'email',
          onPress: () => {
            /* Email is read-only */
          },
        })}
        {renderField({
          label: 'Phone',
          value: userData.phoneNumber || 'Not set',
          icon: 'phone',
          onPress: () => {
            /* Handle phone update */
          },
        })}
        {renderField({
          label: 'Password',
          value: '••••••••',
          icon: 'lock',
          onPress: () => {
            /* Handle password update */
          },
        })}
      </View>
    </View>
  );
};

export default EditAccount;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding.small,
  },
  fieldContainer: {
    paddingVertical: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  fieldContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
    fontWeight: '500',
  },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldValueText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.gray,
    marginRight: SIZES.padding.small,
  },
  chevron: {
    color: COLORS.gray,
  },
});
