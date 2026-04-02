import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';

const Login = () => {
  const location = useLocation();
  const initialMode = new URLSearchParams(location.search).get('mode');
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (submitting) return;
    setSubmitting(true);
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        navigate('/objectives');
      } else {
        await register(formData);
        navigate('/objectives');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative overflow-hidden">
        {/* Glow effect behind */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-primary rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-secondary rounded-full blur-[100px] opacity-20"></div>
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2 text-center text-white">
            Welcome to <span className="gradient-text">Competition</span>
          </h2>
          <p className="text-gray-400 text-center mb-8">
            {isLogin ? 'Sign in to continue your streak' : 'Join the accountability arena'}
          </p>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                  <UserIcon size={20} />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={onChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            )}
            
            <div className="relative">
              <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={onChange}
                className="input-field pl-10"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={onChange}
                className="input-field pl-10"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3 mt-4 disabled:opacity-60 disabled:cursor-not-allowed" disabled={submitting}>
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                </span>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
              className="text-brand-primary font-medium hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
