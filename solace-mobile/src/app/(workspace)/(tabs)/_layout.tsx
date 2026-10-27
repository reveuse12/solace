import { usePalette } from "../../../lib/theme";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";
import { Loading, Message } from "../../../components/ui";

export default function TabsLayout() {
  const colors = usePalette();
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  if (fontError) return <Message title="Navigation couldn't load" detail="Please close and reopen Solace to reload its bundled icons." />;
  if (!fontsLoaded) return <Loading />;
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.ink,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.surface },
    tabBarLabelStyle: { fontSize: 12 },
    tabBarLabelPosition: "below-icon",
  }}>
    <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "sunny" : "sunny-outline"} size={size} color={typeof color === "string" ? color : focused ? colors.ink : colors.muted} /> }} />
    <Tabs.Screen name="library" options={{ title: "Library", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "headset" : "headset-outline"} size={size} color={typeof color === "string" ? color : focused ? colors.ink : colors.muted} /> }} />
    <Tabs.Screen name="reflect" options={{ title: "Reflect", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "journal" : "journal-outline"} size={size} color={typeof color === "string" ? color : focused ? colors.ink : colors.muted} /> }} />
    <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={size} color={typeof color === "string" ? color : focused ? colors.ink : colors.muted} /> }} />
  </Tabs>;
}
