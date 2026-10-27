import { SessionLoading } from "../components/session-loading";
import { useRef, useState } from "react";
import { useAuth, useSignIn, useSignUp, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import { Redirect } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Button, ErrorText, Field, Label, Title, s } from "../components/ui";

type Stage = "login" | "signup" | "verify" | "forgot" | "reset";
function authError(error: unknown) {
  if (error && typeof error === "object" && "errors" in error && Array.isArray(error.errors)) {
    const first = error.errors[0];
    if (typeof first?.longMessage === "string") return first.longMessage;
    if (typeof first?.message === "string") return first.message;
  }
  return error instanceof Error ? error.message : "We couldn't complete sign-in. Please try again.";
}
export default function SignIn() {
  const { isLoaded, isSignedIn } = useAuth(); const { startSSOFlow } = useSSO();
  const login = useSignIn(); const signup = useSignUp();
  const [busy, setBusy] = useState(false); const inFlight = useRef(false); const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("login"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [code, setCode] = useState("");
  if (!isLoaded || !login.isLoaded || !signup.isLoaded) return <SessionLoading />;
  if (isSignedIn) return <Redirect href="/(workspace)/(tabs)" />;
  async function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try { await action(); } catch (caught) { setError(authError(caught)); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function google() {
    const result = await startSSOFlow({ strategy: "oauth_google", redirectUrl: AuthSession.makeRedirectUri({ scheme: "solace", path: "sso-callback" }) });
    if (result.createdSessionId && result.setActive) await result.setActive({ session: result.createdSessionId });
    else if (!["cancel", "dismiss"].includes(result.authSessionResult?.type || "")) throw new Error("Sign-in needs another verification step. Please try again or use your email.");
  }
  async function submit() {
    if (!login.signIn || !signup.signUp) return;
    if (stage === "login") {
      const result = await login.signIn.create({ identifier: email.trim(), password });
      if (result.status !== "complete" || !result.createdSessionId) throw new Error("This account needs additional verification. Please use Google sign-in or complete verification in the PWA.");
      await login.setActive!({ session: result.createdSessionId });
    } else if (stage === "signup") {
      await signup.signUp.create({ emailAddress: email.trim(), password });
      await signup.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPassword(""); setStage("verify");
    } else if (stage === "verify") {
      const result = await signup.signUp.attemptEmailAddressVerification({ code });
      if (result.status !== "complete" || !result.createdSessionId) throw new Error("Your account needs more information. Complete account setup in the PWA, then sign in here.");
      await signup.setActive!({ session: result.createdSessionId });
    } else if (stage === "forgot") {
      await login.signIn.create({ strategy: "reset_password_email_code", identifier: email.trim() });
      setPassword(""); setCode(""); setStage("reset");
    } else {
      await login.signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code });
      const result = await login.signIn.resetPassword({ password });
      if (result.status !== "complete" || !result.createdSessionId) throw new Error("Password changed. This account needs additional verification; please sign in again.");
      await login.setActive!({ session: result.createdSessionId });
    }
  }
  const showPassword = stage === "login" || stage === "signup" || stage === "reset";
  return <SafeAreaView style={s.page}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { flexGrow: 1, justifyContent: "center" }]}><Label>solace</Label><Title>{stage === "signup" ? "A space of your own." : stage === "verify" ? "Check your email." : stage === "forgot" || stage === "reset" ? "Find your way back." : "Welcome back."}</Title><Body>{stage === "verify" || stage === "reset" ? "Enter the code sent to your email." : "Write what matters, reflect, and make room for what comes next. Sign in to keep your saved entries with your account."}</Body>
    {stage === "login" || stage === "signup" || stage === "forgot" ? <View style={s.gap}><Label>Email address</Label><TextInput accessibilityLabel="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={s.input} /></View> : null}
    {stage === "verify" || stage === "reset" ? <Field label="Verification code" value={code} onChange={setCode} maxLength={12} keyboardType="numbers-and-punctuation" /> : null}
    {showPassword ? <View style={s.gap}><Label>{stage === "reset" ? "New password" : "Password"}</Label><TextInput accessibilityLabel={stage === "reset" ? "New password" : "Password"} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete={stage === "login" ? "current-password" : "new-password"} style={s.input} /></View> : null}
    {error ? <ErrorText>{error}</ErrorText> : null}<Button disabled={busy} onPress={() => { void run(submit); }}>{busy ? "Please wait…" : stage === "signup" ? "Create account" : stage === "verify" ? "Verify email" : stage === "forgot" ? "Send reset code" : stage === "reset" ? "Set new password" : "Sign in"}</Button>
    {stage === "login" ? <><Button quiet disabled={busy} onPress={() => { void run(google); }}>Continue with Google</Button><Button quiet disabled={busy} onPress={() => { setError(""); setPassword(""); setStage("signup"); }}>Create an account</Button><Button quiet disabled={busy} onPress={() => { setError(""); setPassword(""); setStage("forgot"); }}>Forgot password?</Button></> : <Button quiet disabled={busy} onPress={() => { setError(""); setPassword(""); setCode(""); setStage("login"); }}>Back to sign in</Button>}
    {stage === "verify" || stage === "reset" ? <Button quiet disabled={busy} onPress={() => { void run(async () => { if (stage === "verify") await signup.signUp?.prepareEmailAddressVerification({ strategy: "email_code" }); else await login.signIn?.create({ strategy: "reset_password_email_code", identifier: email.trim() }); }); }}>Resend code</Button> : null}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
