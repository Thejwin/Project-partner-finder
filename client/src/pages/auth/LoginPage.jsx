import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { authService } from '../../services';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      setIsLoading(true);
      const res = await authService.login({ email, password });
      
      addToast('Welcome back!', 'success');
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      // login() handles the redirect
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/3 -translate-y-1/4 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-[600px] h-[600px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-md w-full p-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
            ProjectConnect
          </h1>
          <p className="text-surface-500 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            id="email"
            label="Email Address"
            type="email" 
            placeholder="you@example.com" 
            value={email} 
            onChange={e=>setEmail(e.target.value)}
            disabled={isLoading}
            required 
          />
          <Input 
            id="password"
            label="Password"
            type="password" 
            placeholder="••••••••" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            disabled={isLoading}
            required
          />
          
          <Button type="submit" className="w-full mt-2" isLoading={isLoading} size="lg">
            Log In
          </Button>
        </form>
        
        <div className="mt-8 text-center text-sm text-surface-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
