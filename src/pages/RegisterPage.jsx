// src/pages/RegisterPage.jsx
import { useState } from 'react';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('正在尝试注册:', { username, email, password });
    // 下节课我们会在这里调用API
  };

  return (
    <div>
      <h1>注册</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>用户名:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>邮箱:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>密码:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">注册</button>
      </form>
    </div>
  );
}
export default RegisterPage;
