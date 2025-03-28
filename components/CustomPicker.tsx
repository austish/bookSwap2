// components/CustomPicker.tsx
import React from "react";
import { View, Text, Modal, TouchableOpacity, FlatList } from "react-native";
import { StyleSheet, Dimensions } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";

interface Option {
  id: string;
  label: string;
}

interface CustomPickerProps {
  visible: boolean;
  value: string;
  options: readonly Option[];
  onSelect: (value: string) => void;
  onClose: () => void;
  title: string;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  visible,
  value,
  options,
  onSelect,
  onClose,
  title,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.modalHeaderSpacer} />
        </View>
        <FlatList
          data={options}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.pickerItem,
                value === item.id && styles.pickerItemSelected,
              ]}
              onPress={() => {
                onSelect(item.id);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  value === item.id && styles.pickerItemTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

export default CustomPicker;

const { height } = Dimensions.get("window");
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    paddingBottom: 34, // Add safe area padding for bottom
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: SIZES.fontSize.large,
    fontWeight: "600",
    color: COLORS.black,
  },
  modalCloseButton: {
    width: 70,
  },
  modalHeaderSpacer: {
    width: 70,
  },
  modalCloseText: {
    color: COLORS.primary,
    fontSize: SIZES.fontSize.medium,
  },
  pickerItem: {
    padding: SIZES.padding.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  pickerItemSelected: {
    backgroundColor: COLORS.lightGray,
  },
  pickerItemText: {
    fontSize: SIZES.fontSize.medium,
    color: COLORS.black,
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
