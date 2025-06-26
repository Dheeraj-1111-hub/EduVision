import React, { useEffect, useState } from "react";
import { Slot, useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log("🌟 Checking token:", token);

        if (token) {
          router.replace("/navigation/screens/Home");
        } else {
          router.replace("/(auth)/SignupScreen");
        }
      } catch (err) {
        console.error("Error reading token:", err);
        router.replace("/(auth)/SignupScreen");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ba68c8" />
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1b002d",
    justifyContent: "center",
    alignItems: "center",
  },
});
