import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // 导航项配置
    const navItems = [
        { path: '/map', label: '地图标记' },
        { path: '/journal', label: '旅行日志' },
        { path: '/photos', label: '照片管理' },
        { path: '/tracking', label: '路径追踪' },
        { path: '/profile', label: '个人信息' }
    ];

    return (
        <nav style={{
            backgroundColor: '#1976d2',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white'
        }}>
            <div style={{
                display: 'flex',
                gap: '20px'
            }}>
                {navItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.2)' : 'transparent'
                        }}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
            }}>
                <span>欢迎使用Where are my mind！</span>
                <button
                    onClick={handleLogout}
                    style={{
                        backgroundColor: 'transparent',
                        border: '1px solid white',
                        color: 'white',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}
                >
                    退出登录
                </button>
            </div>
        </nav>
    );
}

export default Navigation; 