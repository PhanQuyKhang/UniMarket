import React from 'react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import logoImg from "/logo.png";

interface LoginPageProps {
  onGoogleLogin: (credentialResponse: any) => void;
  onBack: () => void;
  onTestLogin?: () => void;
  onAdminLogin?: () => void;
}

export function LoginPage({ onGoogleLogin, onBack, onTestLogin, onAdminLogin }: LoginPageProps) {
  // Use the hook to open a popup OAuth flow; we'll request an access token and then fetch profile
  const loginWithChooser = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid profile email',
    onSuccess: async (tokenResponse: any) => {
      try {
        // tokenResponse should contain an access_token
        if (!tokenResponse || !tokenResponse.access_token) {
          console.error('No access token received from implicit flow', tokenResponse);
          return;
        }

        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!res.ok) {
          console.error('Failed to fetch Google userinfo', await res.text());
          return;
        }

        const profile = await res.json();
        // Pass an object containing name/email/picture to onGoogleLogin — App will accept this shape too
        onGoogleLogin({ name: profile.name, email: profile.email, picture: profile.picture });
      } catch (err) {
        console.error('Error fetching profile after token:', err);
      }
    },
    onError: () => {
      console.error('Implicit login failed');
    },
  });

  // Manual popup fallback that opens Google's OAuth endpoint with prompt=select_account
  const openManualChooser = () => {
    const clientId = (window as any).__GOOGLE_CLIENT_ID || '';
    const redirectUri = `${window.location.origin}/oauth_callback.html`;
    const scope = encodeURIComponent('openid profile email');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&prompt=select_account`;

    const popup = window.open(authUrl, 'google_oauth', 'width=500,height=700');

    const handler = async (ev: MessageEvent) => {
      if (!ev.data || ev.data.type !== 'oauth_callback') return;
      try {
        const data = ev.data.data || {};
        // data may contain access_token or id_token depending on response_type
        if (data.access_token) {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });
          if (res.ok) {
            const profile = await res.json();
            onGoogleLogin({ name: profile.name, email: profile.email, picture: profile.picture });
          } else {
            console.error('Failed to fetch profile', await res.text());
          }
        } else if (data.id_token) {
          // id_token: just pass it back to the app; App's handler can decode it
          onGoogleLogin({ credential: data.id_token });
        }
      } catch (e) {
        console.error('Error handling OAuth callback', e);
      } finally {
        window.removeEventListener('message', handler);
        if (popup && !popup.closed) popup.close();
      }
    };

    window.addEventListener('message', handler);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src={logoImg} alt="UniMarket Logo" className="h-20 w-20" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to UniMarket</CardTitle>
          <CardDescription>
            Sign in to access your profile and manage your items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Removed default Google button per request */}
          <div className="mt-2">
            <Button
              variant="ghost"
              onClick={() => loginWithChooser({ prompt: 'select_account' })}
              className="w-full"
            >
              Choose Google Account
            </Button>
          </div>

          {/* Demo admin login for testing */}
          {onAdminLogin && (
            <Button
              variant="destructive"
              onClick={onAdminLogin}
              className="w-full"
            >
              Admin Login (demo)
            </Button>
          )}

          {onTestLogin && (
            <Button
              onClick={onTestLogin}
              className="w-full"
              variant="secondary"
            >
              Test Login (Demo)
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
