import { useState } from 'react';
import { Key } from 'lucide-react';
import type { AuthorType } from '../supabaseDb';
import './LoginScreen.css';

interface LoginScreenProps {
  onLogin: (author: AuthorType) => void;
}

// Access keys - customize these for your users
// Format: { username: 'access_key' }
const ACCESS_KEYS: Record<AuthorType, string> = {
  user1: 'key1',   // First user's access key
  user2: 'key2',   // Second user's access key
};

// Display names for users
const USER_NAMES: Record<AuthorType, string> = {
  user1: 'User 1',
  user2: 'User 2',
};

function LoginScreen({ onLogin }: LoginScreenProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (key === ACCESS_KEYS.user1) {
      localStorage.setItem('journal_author', 'user1');
      onLogin('user1');
    } else if (key === ACCESS_KEYS.user2) {
      localStorage.setItem('journal_author', 'user2');
      onLogin('user2');
    } else {
      setError('Invalid key! 🔒');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-icon">
          <Key size={48} />
        </div>
        <h1>Our Journal 💕</h1>
        <p>Enter your access key</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError('');
            }}
            placeholder="Access key..."
            className="login-input"
            autoFocus
          />
          
          {error && <p className="login-error">{error}</p>}
          
          <button type="submit" className="login-btn">
            Enter 🚀
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
