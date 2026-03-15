import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { authService } from '../../services';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', termsAccepted: false });
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.username) return;
    if (!formData.termsAccepted) {
      addToast('Please accept the terms to continue', 'error');
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await authService.register(formData);
      
      addToast('Account created successfully!', 'success');
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed.', 'error');
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
      
      <div className="max-w-md w-full p-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white relative z-10 flex flex-col">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
            Join ProjectConnect
          </h1>
          <p className="text-surface-500 mt-2">Create your account to start collaborating</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          <Input 
            id="username"
            label="Username"
            type="text" 
            placeholder="johndoe" 
            value={formData.username} 
            onChange={handleChange}
            disabled={isLoading}
            required 
          />
          <Input 
            id="email"
            label="Email Address"
            type="email" 
            placeholder="you@example.com" 
            value={formData.email} 
            onChange={handleChange}
            disabled={isLoading}
            required 
          />
          <Input 
            id="password"
            label="Password"
            type="password" 
            placeholder="••••••••" 
            value={formData.password} 
            onChange={handleChange} 
            disabled={isLoading}
            required
            minLength={8}
          />
          
          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="termsAccepted"
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={handleChange}
                disabled={isLoading}
                className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="termsAccepted" className="font-medium text-surface-700">
                I accept the terms and conditions
              </label>
            </div>
          </div>
          
          <Button type="submit" className="w-full mt-4" isLoading={isLoading} size="lg">
            Sign Up
          </Button>
        </form>
        
        <div className="mt-8 text-center text-sm text-surface-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Log in instead
          </Link>
        </div>
      </div>
    </div>
  );
};
