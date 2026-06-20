import React, { useState } from 'react';

export default function Auth({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    try {
      await onLogin(username.trim(), password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Đăng Nhập Hệ Thống</h2>
        <p>Hệ thống HRM nội bộ doanh nghiệp</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">Tên đăng nhập</label>
            <input
              type="text"
              id="login-username"
              className="form-control"
              placeholder="admin, hruser, empuser..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Mật khẩu</label>
            <input
              type="password"
              id="login-password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
