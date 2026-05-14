import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, User, Lock, Mail, Bell, Shield, LogOut, ChevronRight, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Form states
  const [editFormData, setEditFormData] = useState({ name: '', mobile_number: '' });
  const [passwordFormData, setPasswordFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/employees/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setEditFormData({ name: response.data.name, mobile_number: response.data.mobile_number });
      setLoading(false);
    } catch (err) {
      setError('Failed to load profile. Please try logging in again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/employees/me`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditModalOpen(false);
      fetchProfile();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setFormLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    setFormLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/employees/me/password`, {
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setIsPasswordModalOpen(false);
      setPasswordFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setFormLoading(false);
    }
  };

  const SettingItem = ({ icon: Icon, title, subtitle, color, onClick }) => (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0 group"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={32} />
      <p className="text-gray-500 font-medium">Loading your profile...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 p-8 text-center">
      <AlertCircle className="text-red-500" size={48} />
      <p className="text-gray-900 font-bold text-xl">{error}</p>
      <button onClick={handleLogout} className="text-blue-600 font-semibold hover:underline">Return to Login</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-12 relative">
      {/* Toast Messages */}
      {message && (
        <div className={`fixed top-24 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-right duration-300 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-2 hover:opacity-70"><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
        <div className="w-10"></div>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative">
          <img 
            src={`https://ui-avatars.com/api/?name=${user.name}&background=2563EB&color=fff&size=128&rounded=true`} 
            alt="Profile" 
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
          />
          <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-blue-600 hover:text-blue-700 transition-colors">
            <Camera size={16} />
          </button>
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">{user.name}</h2>
        <p className="text-gray-500 text-sm font-medium">{user.email}</p>
      </div>

      <div className="space-y-8">
        {/* Account Section */}
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-1">ACCOUNT</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <SettingItem 
              icon={User} 
              title="Edit Profile" 
              subtitle="Update your name and mobile number" 
              color="bg-purple-600"
              onClick={() => setIsEditModalOpen(true)}
            />
            <SettingItem 
              icon={Lock} 
              title="Change Password" 
              subtitle="Update your password" 
              color="bg-indigo-600"
              onClick={() => setIsPasswordModalOpen(true)}
            />
            <SettingItem 
              icon={Mail} 
              title="Email Address" 
              subtitle={user.email} 
              color="bg-blue-600"
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3 px-1">PREFERENCES</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <SettingItem 
              icon={Bell} 
              title="Notifications" 
              subtitle="Manage your notification preferences" 
              color="bg-purple-500"
            />
            <SettingItem 
              icon={Shield} 
              title="Privacy" 
              subtitle="Manage your privacy settings" 
              color="bg-indigo-500"
            />
          </div>
        </div>

        {/* Logout Section */}
        <div className="pt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-red-50 rounded-2xl shadow-sm border border-gray-100 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-600 font-bold">
                <LogOut size={20} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-red-600">Log Out</h4>
                <p className="text-xs text-red-400 font-medium">Sign out from your account</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-red-200 group-hover:text-red-300 transition-colors" />
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Mobile Number</label>
                <input 
                  type="text" 
                  required
                  value={editFormData.mobile_number}
                  onChange={(e) => setEditFormData({...editFormData, mobile_number: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Current Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordFormData.oldPassword}
                  onChange={(e) => setPasswordFormData({...passwordFormData, oldPassword: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="border-t border-gray-50 pt-2"></div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">New Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
