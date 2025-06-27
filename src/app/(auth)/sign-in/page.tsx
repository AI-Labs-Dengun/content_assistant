"use client";
import React, { useState } from 'react';
import { useTheme } from "../../providers/ThemeProvider";
import { useSupabase } from "../../providers/SupabaseProvider";
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../../lib/LanguageContext';
import { useTranslation } from '../../../lib/i18n';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useNotification from '../../../lib/hooks/useNotification';
import { Toaster } from 'react-hot-toast';

export default function SignIn() {
  const { dark, toggleTheme } = useTheme();
  const { signIn } = useSupabase();
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const notify = useNotification();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        let errorMessage = t('auth.errors.serverError');
        
        // Mapear erros específicos do Supabase para nossas mensagens traduzidas
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = t('auth.errors.invalidCredentials');
            break;
          case 'Email not confirmed':
            errorMessage = t('auth.errors.emailNotConfirmed');
            break;
          case 'Network error':
            errorMessage = t('auth.errors.networkError');
            break;
          case 'Too many requests':
            errorMessage = t('auth.errors.tooManyRequests');
            break;
          default:
            if (error.message.includes('email')) {
              errorMessage = t('auth.errors.invalidEmailFormat');
            } else if (error.message.includes('password')) {
              errorMessage = t('auth.errors.passwordTooShort');
            }
        }
        
        notify.error(errorMessage);
      } else {
        notify.success(t('auth.success.signIn'));
        // Adiciona um pequeno atraso antes do redirecionamento
        setTimeout(() => {
          router.push('/chat');
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage = err.message || t('auth.errors.serverError');
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-gradient relative">
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid #10B981',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'var(--background)',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'var(--background)',
            },
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid #EF4444',
            },
          },
        }}
      />
      <div className="w-full h-screen md:h-auto md:max-w-md flex flex-col justify-center md:justify-start md:pt-12 md:pb-12 rounded-none md:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex flex-col justify-center px-6">
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white text-left">{t('auth.signIn')}</h1>
              <button
                onClick={toggleTheme}
                className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 focus:outline-none"
                aria-label={dark ? t('settings.lightMode') : t('settings.darkMode')}
              >
                {dark ? (
                  <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-5 h-5 text-white'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636' />
                    <circle cx='12' cy='12' r='5' fill='currentColor' />
                  </svg>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-5 h-5 text-gray-700'>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z' />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-left text-base leading-tight w-full mb-4">{t('auth.signInWithGoogle')}</p>
          </div>
          
          <form className="w-full flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-y-1">
              <label className="text-gray-700 dark:text-gray-200 text-sm font-medium" htmlFor="email">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <label className="text-gray-700 dark:text-gray-200 text-sm font-medium" htmlFor="password">{t('auth.password')}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? t('auth.hidePassword') || 'Hide password' : t('auth.showPassword') || 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('auth.signIn')}
            </button>
          </form>
          
          <a href="/sign-up" className="mt-6 text-gray-600 dark:text-gray-300 text-sm text-center block underline font-medium hover:text-gray-800 dark:hover:text-gray-100">
            {t('auth.noAccount')} {t('auth.signUp')}
          </a>
        </div>
      </div>
      
      <button
        className="hidden md:block absolute top-4 right-4 bg-gray-200 dark:bg-gray-700 rounded-full p-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        onClick={toggleTheme}
        aria-label={dark ? t('settings.lightMode') : t('settings.darkMode')}
        type="button"
      >
        {dark ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636" />
            <circle cx="12" cy="12" r="5" fill="currentColor" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
        )}
      </button>
    </div>
  );
} 