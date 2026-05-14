import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, BarChart2, ShieldCheck, Clock, User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import API_BASE_URL from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="w-full max-w-[1200px] h-[750px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex overflow-hidden border border-gray-100">
        
        {/* LEFT PANEL (Visual / Features) */}
        <div className="w-[45%] relative hidden lg:flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white z-0"></div>
          
          {/* Hotel Image clipped to bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[380px] z-0">
             {/* Gradient overlay to blend image into background */}
             <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-transparent z-10"></div>
             <img 
               src="https://images.unsplash.com/photo-1542314831-c6a422192e21?auto=format&fit=crop&w=1200&q=80" 
               alt="Luxury Resort" 
               className="w-full h-full object-cover object-bottom"
             />
          </div>

          <div className="relative z-20 flex-1 p-14 pt-16 flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-14">
              <div className="text-[#2563EB]">
                <Building2 size={36} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">Chippy <span className="text-[#2563EB]">ERP</span></span>
            </div>

            {/* Header Text */}
            <div className="w-10 h-1 bg-[#93C5FD] mb-6 rounded-full"></div>
            <h1 className="text-[32px] font-extrabold text-[#0D1537] leading-[1.2] mb-4">
              Manage Smarter.<br/>Serve Better.
            </h1>
            <p className="text-gray-500 font-medium mb-10 max-w-[300px] leading-relaxed">
              All-in-one management system for hotels and service apartments.
            </p>

            {/* Feature List */}
            <div className="space-y-6">
              {/* Feature 1 */}
              <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-full bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
                   <BarChart2 size={18} strokeWidth={2.5} />
                 </div>
                 <div>
                   <h3 className="text-[13px] font-bold text-[#0D1537]">Real-time Dashboard</h3>
                   <p className="text-[11px] text-gray-500 font-medium tracking-wide">Track enquiries, bookings & revenue instantly</p>
                 </div>
              </div>
              {/* Feature 2 */}
              <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0 shadow-sm border border-emerald-50">
                   <ShieldCheck size={18} strokeWidth={2.5} />
                 </div>
                 <div>
                   <h3 className="text-[13px] font-bold text-[#0D1537]">Secure & Reliable</h3>
                   <p className="text-[11px] text-gray-500 font-medium tracking-wide">Enterprise grade security for your data</p>
                 </div>
              </div>
              {/* Feature 3 */}
              <div className="flex items-center gap-4">
                 <div className="w-11 h-11 rounded-full bg-[#F5F3FF] text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-sm border border-purple-50">
                   <Clock size={18} strokeWidth={2.5} />
                 </div>
                 <div>
                   <h3 className="text-[13px] font-bold text-[#0D1537]">Save Time</h3>
                   <p className="text-[11px] text-gray-500 font-medium tracking-wide">Automate operations and increase productivity</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (Login Form) */}
        <div className="flex-1 bg-white flex flex-col justify-center p-8 lg:p-16 border-l border-gray-100 relative z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
          <div className="max-w-[400px] mx-auto w-full">
            
            <div className="text-center mb-10">
              <h2 className="text-[32px] font-extrabold text-[#0D1537] mb-2 tracking-tight">Welcome Back!</h2>
              <p className="text-[13px] text-gray-500 font-medium">Sign in to continue to Chippy ERP</p>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 text-center shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-[#0D1537] tracking-wide ml-0.5">Mobile Number / Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={18} strokeWidth={2} />
                  </div>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-gray-400 placeholder:font-normal bg-gray-50/30" 
                    placeholder="Enter mobile number or email" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[12px] font-bold text-[#0D1537] tracking-wide ml-0.5">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={18} strokeWidth={2} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-900 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-gray-400 placeholder:font-normal bg-gray-50/30" 
                    placeholder="Enter your password" 
                  />
                  <div 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <span className="text-[12px] font-bold text-[#2563EB] cursor-pointer hover:underline transition-all">Forgot Password?</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#1A56DB] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.99] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2"
              >
                 <LogIn size={18} strokeWidth={2.5}/> {loading ? 'Authorizing Session...' : 'Sign In'}
              </button>

              <div className="flex items-center gap-4 my-8">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">or</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <button 
                type="button" 
                className="w-full bg-white border border-gray-200 text-gray-700 font-bold text-[13px] py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm active:scale-[0.99] transition-all"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                Sign in with Google
              </button>

              <p className="text-center text-[12px] font-semibold text-gray-500 pt-6">
                Don't have an account? <span className="text-[#2563EB] font-bold cursor-pointer hover:underline">Contact Administrator</span>
              </p>

            </form>
          </div>
        </div>

      </div>

      <p className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mt-8">© 2026 Chippy ERP. All rights reserved.</p>
    </div>
  );
}
