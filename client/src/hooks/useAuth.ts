import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../lib/apiClient.js';
import type { User } from '@shared/types.js';
import type {
  LoginInput,
  SignupInput,
  UpdateProfileInput,
  DeleteAccountInput,
} from '@shared/schemas.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<User>;
  deleteAccount: (input: DeleteAccountInput) => Promise<void>;
  toggleSimpleMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const [simpleMode, setSimpleMode] = useState<boolean>(() => {
    return localStorage.getItem('kisanmitra_simple_mode') === 'true';
  });

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ user: User }>('/auth/me');
        return res.user;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Sync language and simple mode with user preferences
  useEffect(() => {
    if (user) {
      if (user.preferred_language && user.preferred_language !== i18n.language) {
        i18n.changeLanguage(user.preferred_language);
        localStorage.setItem('kisanmitra_lang', user.preferred_language);
      }
      setSimpleMode(user.simple_mode);
      localStorage.setItem('kisanmitra_simple_mode', String(user.simple_mode));
    }
  }, [user, i18n]);

  // Apply simple mode CSS class to html tag
  useEffect(() => {
    if (simpleMode) {
      document.documentElement.classList.add('simple-mode');
    } else {
      document.documentElement.classList.remove('simple-mode');
    }
  }, [simpleMode]);

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await apiClient.post<{ user: User }>('/auth/login', input);
      return res.user;
    },
    onSuccess: loggedInUser => {
      queryClient.setQueryData(['auth', 'me'], loggedInUser);
      if (loggedInUser.preferred_language) {
        i18n.changeLanguage(loggedInUser.preferred_language);
        localStorage.setItem('kisanmitra_lang', loggedInUser.preferred_language);
      }
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (input: SignupInput) => {
      const res = await apiClient.post<{ user: User }>('/auth/signup', input);
      return res.user;
    },
    onSuccess: newUser => {
      queryClient.setQueryData(['auth', 'me'], newUser);
      if (newUser.preferred_language) {
        i18n.changeLanguage(newUser.preferred_language);
        localStorage.setItem('kisanmitra_lang', newUser.preferred_language);
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const res = await apiClient.patch<{ user: User }>('/auth/me', input);
      return res.user;
    },
    onSuccess: updatedUser => {
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (input: DeleteAccountInput) => {
      await apiClient.delete('/auth/me', input);
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
    },
  });

  const toggleSimpleMode = async () => {
    const nextMode = !simpleMode;
    setSimpleMode(nextMode);
    localStorage.setItem('kisanmitra_simple_mode', String(nextMode));
    if (user) {
      await updateProfileMutation.mutateAsync({ simple_mode: nextMode });
    }
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user: user || null,
        isLoading,
        isAuthenticated: Boolean(user),
        login: async input => {
          await loginMutation.mutateAsync(input);
        },
        signup: async input => {
          await signupMutation.mutateAsync(input);
        },
        logout: async () => {
          await logoutMutation.mutateAsync();
        },
        updateProfile: async input => {
          return await updateProfileMutation.mutateAsync(input);
        },
        deleteAccount: async input => {
          await deleteAccountMutation.mutateAsync(input);
        },
        toggleSimpleMode,
      },
    },
    children
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
