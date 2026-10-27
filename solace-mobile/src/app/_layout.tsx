import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Message } from "../components/ui";

WebBrowser.maybeCompleteAuthSession();
export default function RootLayout() {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return <SafeAreaProvider><StatusBar style="dark" />{key && !key.includes("your_clerk") ? <ClerkProvider publishableKey={key} tokenCache={tokenCache}><Slot /></ClerkProvider> : <Message title="Sign-in is not configured" detail="Please install an updated Solace build with its account configuration." />}</SafeAreaProvider>;
}
