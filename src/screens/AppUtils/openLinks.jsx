import { Alert, Linking } from "react-native";

export const openLink = async (url) => {
    if (!url?.trim()) return;
    let link = url.trim();
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      link = "https://" + link;
    }
    try {
      await Linking.openURL(link);
    } catch (err) {
      Alert.alert("Error", "Unable to open link");
      console.error("Failed to open URL:", err);
    }
  };
  