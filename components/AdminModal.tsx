
import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import bcrypt from 'bcryptjs';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
  currentRealPassword?: string; 
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onLogin, currentRealPassword }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);

    // Default to "666333" if no password is set in data
    const targetPwd = currentRealPassword || "666333";
    let isValid = false;

    try {
        // Check if target is a bcrypt hash (starts with $2a$ or $2b$)
        if (targetPwd.startsWith('$2a$') || targetPwd.startsWith('$2b$')) {
            // Verify hash locally
            isValid = bcrypt.compareSync(password, targetPwd);
        } else {
            // Fallback for legacy plain text passwords
            isValid = password === targetPwd;
        }

        if (isValid) {
            onLogin(password);
            onClose();
            setPassword('');
        } else {
            setError(true);
        }
    } catch (err) {
        console.error("Login error", err);
        setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" />
            管理员登录
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2 ml-1">密码错误</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;
