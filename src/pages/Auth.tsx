import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { LogIn, UserPlus, AlertCircle, ArrowLeft, Settings } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/admin');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('Check your email for the confirmation link!');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      let errorMessage = err.message;
      
      if (err.message === 'Failed to fetch') {
        errorMessage = 'Failed to connect to Supabase. Please check: \n1. Is your VITE_SUPABASE_URL correct? \n2. Is your internet connection stable? \n3. Is your Supabase project active (not paused)?';
        
        // Check for common URL mistakes
        const url = import.meta.env.VITE_SUPABASE_URL;
        if (url && !url.startsWith('https://')) {
          errorMessage += '\n\nNote: Your Supabase URL should start with https://';
        }

        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (key && !key.startsWith('eyJ') && !key.startsWith('sb_publishable_')) {
          errorMessage += '\n\nWarning: Your Supabase Anon Key format looks unusual. It should typically start with "eyJ" (legacy) or "sb_publishable_" (new).';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6">
      {!isSupabaseConfigured && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-3"
        >
          <Settings className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold mb-1">Supabase Not Configured</p>
            <p className="opacity-80">You need to set your Supabase credentials in the environment variables to use authentication.</p>
          </div>
        </motion.div>
      )}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Portfolio
      </motion.button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-3xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-400">
            {isLogin ? 'Sign in to manage your portfolio' : 'Start building your AI-queryable portfolio'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-teal transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-gray-500 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-teal transition-colors"
              placeholder="••••••••"
            />
          </div>

      {error && (
        <div className="w-full max-w-md mb-6 space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div className="whitespace-pre-line">{error}</div>
          </div>
          
          {error.includes('Failed to fetch') && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 space-y-2">
              <p className="font-bold text-gray-300 uppercase tracking-widest">Environment Debug:</p>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <span>VITE_SUPABASE_URL:</span>
                <span className={import.meta.env.VITE_SUPABASE_URL ? "text-green-400" : "text-red-400"}>
                  {import.meta.env.VITE_SUPABASE_URL ? 'LOADED ✅' : 'MISSING ❌'}
                </span>
                <span>VITE_SUPABASE_ANON_KEY:</span>
                <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? "text-green-400" : "text-red-400"}>
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'LOADED ✅' : 'MISSING ❌'}
                </span>
              </div>
              <p className="mt-2 opacity-60">
                If "MISSING", you must add these to the <b>Secrets</b> panel in the AI Studio sidebar. 
                Setting them in .env.example is not enough.
              </p>
            </div>
          )}
        </div>
      )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-teal text-bg-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-bg-dark/30 border-t-bg-dark rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Sign In' : 'Sign Up'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-400 hover:text-brand-teal transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
