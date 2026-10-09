// src/components/Layout.jsx
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Layout() {
  const { token, logout } = useAuth(); // 获取全局登录状态和退出函数
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // 清除token（Context和localStorage都会清空）
    navigate('/login'); // 跳转到登录页
  };

  return (
    <div className="app-layout">
      <nav style={{ background: '#eee', padding: '1rem' }}>
        {/* 已登录：显示 主页 + 退出登录；未登录：显示 登录 + 注册 */}
        {token ? (
          <>
            <Link to="/" style={{ marginRight: '1rem' }}>主页</Link>
            <button onClick={handleLogout}>退出登录</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: '1rem' }}>登录</Link>
            <Link to="/register">注册</Link>
          </>
        )}
      </nav>

      <main style={{ padding: '1rem' }}>
        {/* Outlet 是一个占位符，子路由匹配的组件会在这里显示 */}
        <Outlet />
      </main>
    </div>
  );
}
export default Layout;
