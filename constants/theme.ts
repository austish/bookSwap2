// constants/theme.ts
export const COLORS = {
  primary: "#00306C",
  secondary: "#FFB800",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#666666",
  lightGray: "#E5E5E5",
  success: "#4CAF50",
  error: "#F44336",
};

export const SIZES = {
  padding: {
    small: 8,
    medium: 16,
    large: 24,
    screen: 20, // Padding used for screen content
  },
  fontSize: {
    small: 12, // Used for navigation labels
    medium: 16, // Used for regular text
    large: 20, // Used for input text and buttons
    title: 34, // Used for screen titles
  },
  borderRadius: {
    small: 8,
    medium: 16,
    large: 25, // Used for buttons
    input: 10, // Used for input fields
  },
  height: {
    input: 50, // Height for input fields
    button: 50, // Height for primary buttons
  },
  spacing: {
    vertical: {
      small: 4,
      medium: 20, // Space between sections
      large: 40,
    },
  },
  shadow: {
    small: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};
