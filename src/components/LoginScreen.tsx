import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { 
  Shield, 
  User, 
  Lock, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (role: 'admin' | 'user', name: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [adminSecretCode, setAdminSecretCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check if ?register=true or ?reg=1 or ?setup=admin is in URL to enable self-registration
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const isRegisterParamPresent = params.get('register') === 'true' || params.get('reg') === '1' || params.get('setup') === 'admin';

  const handleFetchUserProfileAndCallback = async (uid: string, fallbackEmail: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let userRole: 'admin' | 'user' = 'user';
      let displayName = fallbackEmail.split('@')[0];

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        userRole = data.role === 'admin' ? 'admin' : 'user';
        displayName = data.name || displayName;
      } else {
        // Fallback or setup for default demo emails
        if (fallbackEmail === 'admin@tka.com') {
          userRole = 'admin';
          displayName = 'Admin TKA SMA';
        } else if (fallbackEmail === 'user@tka.com') {
          userRole = 'user';
          displayName = 'Guru Sosiologi';
        }
        
        // Save fallback profile
        await setDoc(userDocRef, {
          uid,
          email: fallbackEmail,
          name: displayName,
          role: userRole,
          createdAt: new Date()
        });
      }

      onLoginSuccess(userRole, displayName);
    } catch (err: any) {
      console.error("Error loading user profile:", err);
      setError("Gagal memuat profil pengguna dari database.");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Silakan isi semua bidang input.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await handleFetchUserProfileAndCallback(userCredential.user.uid, userCredential.user.email || email);
    } catch (err: any) {
      console.error(err);
      const isInvalidCred = 
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/invalid-login-credentials' ||
        (err.message && (
          err.message.includes('invalid-credential') || 
          err.message.includes('invalid-login-credentials') ||
          err.message.includes('user-not-found') ||
          err.message.includes('wrong-password')
        ));

      if (isInvalidCred) {
        setError("Email atau Password yang Anda masukkan salah.");
      } else {
        setError(`Gagal Masuk: ${err.message || err}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError("Silakan lengkapi seluruh formulir pendaftaran.");
      return;
    }

    // Secure Admin Registration verification
    if (role === 'admin') {
      const trimmedCode = adminSecretCode.trim();
      if (trimmedCode !== 'MASTERPRINT-ADMIN' && trimmedCode !== 'TKA-SMA-ADMIN') {
        setError("Kode Verifikasi Administrator salah atau tidak sah.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;
      
      // Update Auth Profile
      await updateProfile(userCredential.user, {
        displayName: fullName
      });

      // Save to users collection
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: email.trim(),
        name: fullName,
        role: role,
        createdAt: new Date()
      });

      setSuccessMsg("Pendaftaran berhasil! Mengalihkan ke Dashboard...");
      setTimeout(() => {
        onLoginSuccess(role, fullName);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email sudah digunakan.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password terlalu lemah (minimal 6 karakter).");
      } else {
        setError(`Pendaftaran gagal: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Absolute Decorative Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative z-10"
      >
        {/* App Title & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-inner">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">MasterPrint TKA SMA</h2>
          <p className="text-xs text-slate-400 mt-1">Sistem Manajemen Kisi-Kisi & Soal TKA SMA berbasis AI</p>
        </div>

        {/* Conditional Tab Selector for Registration */}
        {isRegisterParamPresent && (
          <div className="flex border border-slate-800 mb-6 bg-slate-950/40 p-1 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('signin');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 px-3 text-center rounded-xl font-bold text-xs transition-all ${
                activeTab === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 px-3 text-center rounded-xl font-bold text-xs transition-all ${
                activeTab === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daftar Baru
            </button>
          </div>
        )}

        {/* Portal Header when registration tab isn't shown */}
        {!isRegisterParamPresent && (
          <div className="bg-indigo-600/10 border border-indigo-500/20 py-2.5 px-4 rounded-xl mb-6 text-center">
            <span className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Portal Masuk Pengguna Resmi
            </span>
          </div>
        )}

        {/* Alert Messages */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* Form Inputs (Conditional by Tab) */}
        {activeTab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="nama@sekolah.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Masuk ke Aplikasi"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Nama Lengkap & Gelar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="nama@sekolah.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  placeholder="Minimal 6 Karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Peran Pengguna (Role)</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                    role === 'user'
                      ? 'bg-slate-800 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Guru Sosiologi
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                    role === 'admin'
                      ? 'bg-slate-800 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Administrator
                </button>
              </div>
            </div>

            {role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1"
              >
                <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Kode Khusus Verifikasi Admin</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-indigo-500">
                    <Shield className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="Masukkan Kode Khusus Admin"
                    value={adminSecretCode}
                    onChange={(e) => setAdminSecretCode(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-950 text-indigo-300 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition font-mono"
                    disabled={loading}
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-xs mt-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Mendaftarkan..." : "Selesaikan Pendaftaran"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}

        {/* Notice of Registration disabled (only shown when register query isn't used) */}
        {!isRegisterParamPresent && (
          <div className="mt-6 text-center text-[10px] text-slate-500 bg-slate-950/40 p-4 border border-slate-800/60 rounded-2xl leading-relaxed">
            <span className="font-bold text-slate-400 block mb-1">Pendaftaran Mandiri Dinonaktifkan</span>
            Sistem ini hanya dapat diakses oleh Guru & Admin resmi. Hubungi <span className="text-indigo-400 font-semibold">Admin TKA SMA</span> untuk didaftarkan ke sistem.
          </div>
        )}

        {/* Helper text when register query IS used */}
        {isRegisterParamPresent && (
          <div className="mt-6 text-center text-[10px] text-slate-400 bg-indigo-950/20 p-3 border border-indigo-900/40 rounded-2xl leading-relaxed">
            <span className="font-bold text-indigo-400 block mb-1">🔑 Mode Registrasi Aktif (Melalui URL Khusus)</span>
            Daftarkan akun Admin menggunakan kode verifikasi khusus, atau daftarkan akun Guru langsung dari sini.
          </div>
        )}

        {/* Developer Credit Link */}
        <div className="mt-5 text-center">
          <a
            href="https://lynk.id/ajisosiologi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-950/40 hover:bg-indigo-950 text-[10px] font-extrabold text-indigo-400 rounded-xl border border-indigo-900/60 hover:border-indigo-500/55 transition duration-200"
          >
            <span>Create @ajisosiologi</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
