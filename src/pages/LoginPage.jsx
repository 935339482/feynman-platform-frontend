// src/pages/LoginPage.jsx
import { useState } from 'react';
import apiClient from '../api/axios'; // 引入apiClient
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // 引入useAuth

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth(); // 从Context中获取login函数
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await apiClient.post('/users/login', { email, password });
      login(response.data.token); // 调用Context的login函数来更新全局token
      console.log('登录成功，Token:', response.data.token);
      navigate('/'); // 登录成功后跳转到主页
    } catch (err) {
      // err.response 存在 = 服务器有响应(4xx/5xx)；不存在 = 根本连不上服务器
      console.error('登录失败:', err.response?.data || err.message);
      setError(err.response?.data?.msg || '无法连接服务器，请确认后端已启动');
    }
  };

  return (
    <div>
      <h1>登录</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>邮箱:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            required
          />
        </div>
        <div>
          <label>密码:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            required
          />
        </div>
        <button type="submit">登录</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
export default LoginPage;
