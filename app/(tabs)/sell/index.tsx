import { Redirect } from 'expo-router';
import React from 'react';

export default function sell() {
  return <Redirect href="/(tabs)/buy" />;
}