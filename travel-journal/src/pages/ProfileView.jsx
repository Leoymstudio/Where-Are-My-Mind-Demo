import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

function ProfileView() {
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        nickname: '',
        birthday: '',
        phone: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // 获取个人信息
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('获取个人信息失败');
                const data = await response.json();
                setProfile(data);
                setEditData(data);
            } catch (error) {
                console.error('获取个人信息错误:', error);
            }
        };

        fetchProfile();
    }, [token]);

    // 处理信息更新
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editData)
            });

            if (!response.ok) throw new Error('更新个人信息失败');
            const data = await response.json();
            setProfile(editData);
            setIsEditing(false);
            console.log('更新成功:', data);
        } catch (error) {
            console.error('更新个人信息错误:', error);
        }
    };

    // 处理账户删除
    const handleDelete = async () => {
        if (!window.confirm('确定要删除账户吗？此操作不可恢复！')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('删除账户失败');
            
            // 清除本地存储并跳转到登录页
            localStorage.removeItem('token');
            navigate('/login');
        } catch (error) {
            console.error('删除账户错误:', error);
        }
    };

    return (
        <div style={{
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h2 style={{ margin: 0 }}>个人信息</h2>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            编辑信息
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleUpdate}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>用户名:</label>
                            <input
                                type="text"
                                value={editData.username || ''}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: '#f5f5f5'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>邮箱:</label>
                            <input
                                type="email"
                                value={editData.email || ''}
                                disabled
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: '#f5f5f5'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>昵称:</label>
                            <input
                                type="text"
                                value={editData.nickname || ''}
                                onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>生日:</label>
                            <input
                                type="date"
                                value={editData.birthday || ''}
                                onChange={(e) => setEditData({ ...editData, birthday: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>电话:</label>
                            <input
                                type="tel"
                                value={editData.phone || ''}
                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="submit"
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                保存
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditData(profile);
                                    setIsEditing(false);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#9e9e9e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <p><strong>用户名:</strong> {profile.username}</p>
                        <p><strong>邮箱:</strong> {profile.email}</p>
                        <p><strong>昵称:</strong> {profile.nickname}</p>
                        <p><strong>生日:</strong> {profile.birthday}</p>
                        <p><strong>电话:</strong> {profile.phone}</p>
                    </div>
                )}

                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <button
                        onClick={handleDelete}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        删除账户
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProfileView;
