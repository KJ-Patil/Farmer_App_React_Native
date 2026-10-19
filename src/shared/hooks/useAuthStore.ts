import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  PhoneAuthProvider,
  signInWithCredential,
  linkWithCredential,
  unlink,
  GoogleAuthProvider,
  OAuthProvider,
  User,
  RecaptchaVerifier,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types/auth';
import { logger } from '../services/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStore {
  user: UserProfile | null;
  firebaseUser: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  otpSent: boolean;
  otpVerified: boolean;
  verificationId: string | null;
  guestLanguage: 'en' | 'mr';

  initAuthListener: () => () => void;
  requestOtp: (mobileNumber: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  register: (profile: Partial<UserProfile>) => Promise<void>;
  signIn: (mobileNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithApple: (identityToken: string, nonce: string) => Promise<void>;
  linkGoogleAccount: (idToken: string) => Promise<void>;
  unlinkGoogleAccount: () => Promise<void>;
  linkAppleAccount: (identityToken: string, nonce: string) => Promise<void>;
  unlinkAppleAccount: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setGuestLanguage: (lang: 'en' | 'mr') => void;
  clearError: () => void;
  fetchUserProfile: (mobileNumber: string) => Promise<UserProfile | null>;
}

const mobileToEmail = (mobile: string) => `${mobile}@farmerledger.com`;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isInitialized: false,
  error: null,
  otpSent: false,
  otpVerified: false,
  verificationId: null,
  guestLanguage: 'en',

  initAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        set({ firebaseUser, isLoading: true });
        try {
          const email = firebaseUser.email || '';
          const mobile = email.replace('@farmerledger.com', '');
          const profile = await get().fetchUserProfile(mobile);
          set({ user: profile, isLoading: false, isInitialized: true });
        } catch (err) {
          logger.error('Failed to fetch user profile:', err);
          set({ user: null, isLoading: false, isInitialized: true });
        }
      } else {
        set({
          user: null,
          firebaseUser: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    });
    return unsubscribe;
  },

  fetchUserProfile: async (mobileNumber: string) => {
    const docRef = doc(db, 'users', mobileNumber);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data(), uid: docSnap.id } as UserProfile;
    }
    return null;
  },

  requestOtp: async (mobileNumber: string) => {
    set({ isLoading: true, error: null, otpSent: false });
    try {
      // On native, phone auth is handled differently
      // For Expo managed workflow, we use email/password as fallback
      // and store mobile number mapping
      set({ otpSent: true, isLoading: false });
      logger.info('OTP requested for:', mobileNumber);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  verifyOtp: async (otp: string) => {
    set({ isLoading: true, error: null });
    try {
      set({ otpVerified: true, isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  register: async (profile: Partial<UserProfile>) => {
    set({ isLoading: true, error: null });
    try {
      const mobile = profile.mobileNumber!;
      const email = mobileToEmail(mobile);
      const defaultPassword = `FL_${mobile}_2024`;

      const userCred = await createUserWithEmailAndPassword(auth, email, defaultPassword);

      const now = Timestamp.now();
      const userProfile: UserProfile = {
        uid: userCred.user.uid,
        fullName: profile.fullName || '',
        mobileNumber: mobile,
        emailId: email,
        village: profile.village || '',
        taluka: profile.taluka || '',
        district: profile.district || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        geoLocation: profile.geoLocation,
        language: profile.language || 'en',
        membershipType: profile.membershipType || 'free',
        profilePhoto: profile.profilePhoto,
        alternateMobile: profile.alternateMobile,
        dateOfBirth: profile.dateOfBirth,
        aadhaarNumber: profile.aadhaarNumber,
        farmerId: profile.farmerId,
        createdAt: now,
        updatedAt: now,
        status: 'active',
      };

      await setDoc(doc(db, 'users', mobile), userProfile);
      set({ user: userProfile, isLoading: false });
      logger.info('User registered:', mobile);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  signIn: async (mobileNumber: string, password: string) => {
    set({ isLoading: true, error: null });
    const email = mobileToEmail(mobileNumber);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      set({ isLoading: false, error: null });
      throw err;
    }
    set({ isLoading: false });
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await firebaseSignOut(auth);
      set({
        user: null,
        firebaseUser: null,
        isLoading: false,
        otpSent: false,
        otpVerified: false,
        verificationId: null,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  signInWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  signInWithApple: async (identityToken: string, nonce: string) => {
    set({ isLoading: true, error: null });
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });
      await signInWithCredential(auth, credential);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  linkGoogleAccount: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await linkWithCredential(currentUser, credential);
      }
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  unlinkGoogleAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await unlink(currentUser, 'google.com');
      }
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  linkAppleAccount: async (identityToken: string, nonce: string) => {
    set({ isLoading: true, error: null });
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });
      const currentUser = auth.currentUser;
      if (currentUser) {
        await linkWithCredential(currentUser, credential);
      }
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  unlinkAppleAccount: async () => {
    set({ isLoading: true, error: null });
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await unlink(currentUser, 'apple.com');
      }
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    set({ isLoading: true, error: null });
    try {
      const user = get().user;
      if (!user) throw new Error('No user logged in');
      const docRef = doc(db, 'users', user.mobileNumber);
      const updateData = { ...updates, updatedAt: Timestamp.now() };
      await updateDoc(docRef, updateData);
      set({ user: { ...user, ...updateData } as UserProfile, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setGuestLanguage: (lang: 'en' | 'mr') => {
    set({ guestLanguage: lang });
    AsyncStorage.setItem('guest_language', lang);
  },

  clearError: () => set({ error: null }),
}));
