import { useEffect, useState } from "react";
import { currentUser } from "@/lib/mock-data";

const KEY = "pinguim:profile";

export type ProfileData = {
  avatar: string;
  displayName: string;
  username: string;
  age: number | "";
  gender: string;
  city: string;
  state: string;
  birthdate: string;
  bio: string;
  profession: string;
  education: string;
  interests: string;
  hobbies: string;
  ageRangeMin: number;
  ageRangeMax: number;
  maxDistance: number;
  interestGender: string;
  languages: string;
  email: string;
  phone: string;
  twoFactor: boolean;
  showOnline: boolean;
  allowMessages: boolean;
  allowRequests: boolean;
  blockedUsers: string[];
  selfieVerified: boolean;
  documentVerified: boolean;
};

export const defaultProfile: ProfileData = {
  avatar: currentUser.avatar,
  displayName: currentUser.name,
  username: currentUser.username,
  age: currentUser.age,
  gender: "",
  city: "São Paulo",
  state: "SP",
  birthdate: "",
  bio: currentUser.bio ?? "",
  profession: "",
  education: "",
  interests: "",
  hobbies: "",
  ageRangeMin: 18,
  ageRangeMax: 40,
  maxDistance: 50,
  interestGender: "todos",
  languages: "Português",
  email: "",
  phone: "",
  twoFactor: false,
  showOnline: true,
  allowMessages: true,
  allowRequests: true,
  blockedUsers: [],
  selfieVerified: false,
  documentVerified: false,
};

export function getProfile(): ProfileData {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

export function saveProfile(p: ProfileData) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event("pinguim:profile-changed"));
}

export function useProfile(): [ProfileData, (p: ProfileData) => void] {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  useEffect(() => {
    setProfile(getProfile());
    const on = () => setProfile(getProfile());
    window.addEventListener("pinguim:profile-changed", on);
    return () => window.removeEventListener("pinguim:profile-changed", on);
  }, []);
  return [profile, (p) => { saveProfile(p); setProfile(p); }];
}
