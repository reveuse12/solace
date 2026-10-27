import { SessionLoading } from "../../components/session-loading";
import { ReadAloudProvider } from "../../components/read-aloud";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack, useSegments } from "expo-router";
import { WorkspaceProvider, useWorkspace } from "../../lib/workspace";
import { profileIsComplete } from "../../lib/models";
import { Action, Message } from "../../components/ui";
function ProfileGate() {
  const { profile, loading, profileFetched, error, refresh, signOut } = useWorkspace(); const segments = useSegments();
  if (loading) return <SessionLoading />;
  if (!profileFetched) return <Message title="Your space couldn't be loaded" detail={error || "Please try again. Your saved profile has not been changed."}><Action label="Try again" action={refresh} /><Action quiet label="Sign out" action={signOut} /></Message>;
  if (!profileIsComplete(profile) && !segments.some((segment) => segment === "onboarding")) return <Redirect href="/(workspace)/onboarding" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
export default function WorkspaceLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  if (!isLoaded) return <SessionLoading />;
  if (!isSignedIn || !userId) return <Redirect href="/sign-in" />;
  return <WorkspaceProvider key={userId} userId={userId}><ReadAloudProvider><ProfileGate /></ReadAloudProvider></WorkspaceProvider>;
}
