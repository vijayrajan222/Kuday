import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface GoogleAuthButtonProps {
  label?: string;
}

export function GoogleAuthButton({ label = 'Continue with Google' }: GoogleAuthButtonProps) {
  const { googleAuth, isLoading } = useGoogleAuth();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (window.google?.accounts?.oauth2) return;

    const existingScript = document.getElementById('google-gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleGoogleAuth = useCallback(async () => {
    if (googleClientId && window.google?.accounts?.oauth2) {
      // Use Google OAuth2 Popup flow
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.access_token) {
            try {
              // Fetch user profile from Google using the access token
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const profile = await userInfoRes.json();

              await googleAuth({
                email: profile.email,
                firstName: profile.given_name || profile.name || 'Google User',
                lastName: profile.family_name || '',
                googleId: profile.sub,
                picture: profile.picture,
              });
            } catch (err) {
              console.error('Google profile fetch error:', err);
            }
          }
        },
      });

      // Request Google OAuth Access Token (Opens Google Account Selector Popup)
      tokenClient.requestAccessToken();
    } else {
      // Dev prompt fallback when Client ID or script is not loaded
      const userEmail = prompt('Enter your Google Account email to simulate Google Auth:', 'user@gmail.com');
      if (userEmail) {
        const parts = userEmail.split('@')[0].split('.');
        const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Google';
        const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'User';

        await googleAuth({
          email: userEmail,
          firstName,
          lastName,
          googleId: `google_${Date.now()}`,
        });
      }
    }
  }, [googleClientId, googleAuth]);

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      fullWidth
      isLoading={isLoading}
      onClick={handleGoogleAuth}
      className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
    >
      {!isLoading && <GoogleIcon className="mr-2.5 h-5 w-5" />}
      {isLoading ? 'Signing in with Google...' : label}
    </Button>
  );
}

// Global declaration for Google GIS library
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential?: string }) => void }) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (res: { access_token?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}
