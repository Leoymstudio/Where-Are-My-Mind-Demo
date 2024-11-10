import React, { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_BASE_URL = 'http://localhost:5000/api';

function JournalView() {
    const [journals, setJournals] = useState([]);
    const [currentJournal, setCurrentJournal] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const token = localStorage.getItem('token');

    // 获取所有日志
    const fetchJournals = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/journal/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('获取日志失败');
            const data = await response.json();
            setJournals(data);
        } catch (error) {
            console.error('获取日志错误:', error);
        }
    }, [token]);

    // 创建新日志
    const createJournal = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/journal/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });
            if (!response.ok) throw new Error('创建日志失败');
            const data = await response.json();
            setJournals([...journals, data]);
            clearForm();
        } catch (error) {
            console.error('创建日志错误:', error);
        }
    };

    // 更新日志
    const updateJournal = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/journal/${currentJournal.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });
            if (!response.ok) throw new Error('更新日志失败');
            await fetchJournals();
            clearForm();
        } catch (error) {
            console.error('更新日志错误:', error);
        }
    };

    // 删除日志
    const deleteJournal = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/journal/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('删除日志失败');
            setJournals(journals.filter(journal => journal.id !== id));
        } catch (error) {
            console.error('删除日志错误:', error);
        }
    };

    // 清空表单
    const clearForm = () => {
        setTitle('');
        setContent('');
        setCurrentJournal(null);
        setIsEditing(false);
    };

    // 编辑日志
    const editJournal = (journal) => {
        setCurrentJournal(journal);
        setTitle(journal.title);
        setContent(journal.content);
        setIsEditing(true);
    };

    // 初始加载
    useEffect(() => {
        fetchJournals();
    }, [fetchJournals]);

    return (
        <div style={{ padding: '20px', display: 'flex', gap: '20px', height: 'calc(100vh - 64px)' }}>
            {/* 日志列表 */}
            <div style={{ 
                width: '300px', 
                backgroundColor: '#f5f5f5', 
                padding: '15px',
                borderRadius: '8px',
                overflowY: 'auto'
            }}>
                <h2>日志列表</h2>
                <button
                    onClick={clearForm}
                    style={{
                        width: '100%',
                        padding: '8px',
                        marginBottom: '10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    写新日志
                </button>
                {journals.map(journal => (
                    <div
                        key={journal.id}
                        style={{
                            padding: '10px',
                            marginBottom: '10px',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                    >
                        <h3>{journal.title}</h3>
                        <p>{new Date(journal.created_at).toLocaleString()}</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                onClick={() => editJournal(journal)}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                编辑
                            </button>
                            <button
                                onClick={() => deleteJournal(journal.id)}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                删除
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 编辑区域 - 修改布局 */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%'
            }}>
                {/* 标题输入 */}
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="日志标题"
                        style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '16px',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    />
                </div>

                {/* 编辑器容器 */}
                <div style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0  // 重要：防止内容溢出
                }}>
                    <div style={{ 
                        flex: 1,
                        position: 'relative',
                        marginBottom: '15px'
                    }}>
                        <ReactQuill
                            value={content}
                            onChange={setContent}
                            style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, false] }],
                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                    [{'list': 'ordered'}, {'list': 'bullet'}],
                                    ['link', 'image'],
                                    ['clean']
                                ]
                            }}
                        />
                    </div>

                    {/* 按钮区域 */}
                    <div style={{ 
                        padding: '10px 0',
                        borderTop: '1px solid #ddd',
                        backgroundColor: 'white'
                    }}>
                        <button
                            onClick={isEditing ? updateJournal : createJournal}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginRight: '10px'
                            }}
                        >
                            {isEditing ? '更新日志' : '保存日志'}
                        </button>
                        {isEditing && (
                            <button
                                onClick={clearForm}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#9e9e9e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                取消编辑
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JournalView;
