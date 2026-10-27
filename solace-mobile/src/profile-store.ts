export type Profile = { version: 1; name: string; onboardingComplete: true };

type Storage = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
};

function profileKey(userId: string) {
  // SecureStore keys permit only letters, numbers, dots, dashes and underscores.
  return `solace.profile.v1.${Array.from(userId, (char) => char.codePointAt(0)!.toString(16)).join("-")}`;
}

export function createProfileStore(storage: Storage) {
  return {
    async load(userId: string): Promise<Profile | null> {
      const value = await storage.getItemAsync(profileKey(userId));
      if (value === null) return null;
      const profile = JSON.parse(value) as Partial<Profile> | null;
      if (!profile || profile.version !== 1 || profile.onboardingComplete !== true ||
          typeof profile.name !== "string" || !profile.name.trim() || profile.name.length > 80) {
        throw new Error("Your saved profile could not be read.");
      }
      return { version: 1, name: profile.name.trim(), onboardingComplete: true };
    },
    async complete(userId: string, name: string): Promise<Profile> {
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 80) throw new Error("Enter a name between 1 and 80 characters.");
      const profile: Profile = { version: 1, name: trimmed, onboardingComplete: true };
      // Advance the screen only after durable storage succeeds.
      await storage.setItemAsync(profileKey(userId), JSON.stringify(profile));
      return profile;
    },
  };
}
