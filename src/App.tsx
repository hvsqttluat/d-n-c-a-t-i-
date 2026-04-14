/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, db, googleProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { UserProfile } from './types';
import { Layout } from './components/Layout';
import { LogIn, Loader2, Shield } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL || '',
            role: 'member',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...newProfile,
            createdAt: serverTimestamp(),
          });
          setProfile(newProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-army-bg p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#005f27 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="max-w-md w-full army-card text-center relative z-10">
          <div className="w-24 h-24 bg-army-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl border-4 border-army-gold">
            <Shield className="w-12 h-12 text-army-gold" />
          </div>
          <h1 className="text-4xl font-black text-army-dark mb-2 tracking-tight uppercase">Nexus Army</h1>
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="badge-army">Hệ thống báo ban</span>
            <span className="badge-army">Quân đội</span>
          </div>
          
          <p className="text-zinc-600 mb-10 font-medium leading-relaxed">
            Hệ thống quản lý và điều hành công việc <br/>
            <span className="text-army-primary font-bold">Bộ Chỉ huy Quân sự</span>
          </p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-army-primary text-white py-4 px-6 rounded-full font-bold text-lg hover:bg-army-dark hover:text-army-gold transition-all active:scale-95 shadow-lg group"
          >
            <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            Đăng nhập hệ thống
          </button>
          
          <div className="mt-12 flex items-center justify-center gap-4 opacity-20">
            <div className="w-16 h-px bg-army-dark" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-army-dark">Bảo mật tuyệt đối</span>
            <div className="w-16 h-px bg-army-dark" />
          </div>
        </div>
        
        <div className="absolute bottom-8 text-[10px] font-black tracking-[0.3em] uppercase text-army-dark opacity-40">
          © 2026 Bộ Chỉ huy Quân sự tỉnh • Hệ thống nội bộ
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} profile={profile} onLogout={handleLogout}>
      {/* Content will be injected here via Layout */}
    </Layout>
  );
}

