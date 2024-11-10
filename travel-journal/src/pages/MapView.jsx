import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const API_BASE_URL = 'http://localhost:5000/api';

// 自定义标记图标
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// API 函数
async function saveMarker(markerData, token) {
    try {
        const response = await fetch(`${API_BASE_URL}/map/markers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                position: markerData.position,
                description: `标记点 ${markerData.id}`
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '保存标记失败');
        }
        return data;
    } catch (error) {
        console.error('保存标记错误:', error);
        throw error;
    }
}

async function fetchMarkers(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/map/markers`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '获取标记失败');
        }
        return data;
    } catch (error) {
        console.error('获取标记错误:', error);
        throw error;
    }
}

async function deleteMarker(markerId, token) {
    try {
        const response = await fetch(`${API_BASE_URL}/map/markers/${markerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || '删除标记失败');
        }
        return data;
    } catch (error) {
        console.error('删除标记错误:', error);
        throw error;
    }
}

function MapEvents({ markers, setMarkers, isAKeyPressed, token }) {
    useMapEvents({
        async click(e) {
            if (isAKeyPressed) {
                const { lat, lng } = e.latlng;
                const newMarker = { 
                    position: [lat, lng],
                    id: Date.now()
                };
                
                try {
                    const savedMarker = await saveMarker(newMarker, token);
                    setMarkers(prevMarkers => [...prevMarkers, {
                        id: savedMarker.id,
                        position: savedMarker.position,
                        description: savedMarker.description
                    }]);
                } catch (error) {
                    console.error('保存标记失败:', error);
                }
            }
        }
    });

    return null;
}

function MapView() {
    const [markers, setMarkers] = useState([]);
    const [isAKeyPressed, setIsAKeyPressed] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const token = localStorage.getItem('token');

    // 初始加载标记
    useEffect(() => {
        if (token) {
            fetchMarkers(token)
                .then(data => {
                    setMarkers(data);
                })
                .catch(error => {
                    console.error('加载标记失败:', error);
                });
        }
    }, [token]);

    // 键盘事件处理
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'a' || event.key === 'A') {
                setIsAKeyPressed(true);
            }
        };

        const handleKeyUp = (event) => {
            if (event.key === 'a' || event.key === 'A') {
                setIsAKeyPressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // 删除标记处理
    const handleDeleteMarker = async (markerId) => {
        try {
            await deleteMarker(markerId, token);
            setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== markerId));
        } catch (error) {
            console.error('删除标记失败:', error);
        }
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', flex: 1 }}>
                <MapContainer
                    center={[39.9042, 116.4074]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    doubleClickZoom={false}
                >
                    <TileLayer
                        url="https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                        attribution='&copy; 高德地图'
                    />
                    {markers.map(marker => (
                        <Marker key={marker.id} position={marker.position}>
                            <Popup>
                                <div>
                                    {marker.description}<br />
                                    经度: {marker.position[1].toFixed(6)}<br />
                                    纬度: {marker.position[0].toFixed(6)}<br />
                                    <button
                                        onClick={() => handleDeleteMarker(marker.id)}
                                        style={{
                                            marginTop: '8px',
                                            padding: '4px 8px',
                                            backgroundColor: '#ff4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        删除标记
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    <MapEvents 
                        markers={markers} 
                        setMarkers={setMarkers} 
                        isAKeyPressed={isAKeyPressed}
                        token={token}
                    />
                </MapContainer>
                
                {/* 添加标记表格按钮 */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '10px'
                }}>
                    <button
                        onClick={() => setShowTable(!showTable)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {showTable ? '隐藏标记列表' : '显示标记列表'}
                    </button>
                </div>

                {/* 提示信息 */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    zIndex: 1000
                }}>
                    按住 A 键点击地图添加标记
                </div>

                {/* 标记表格 */}
                {showTable && (
                    <div style={{
                        position: 'absolute',
                        top: '60px',
                        left: '10px',
                        background: 'white',
                        padding: '15px',
                        borderRadius: '5px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        maxHeight: '60vh',
                        overflowY: 'auto'
                    }}>
                        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>ID</th>
                                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>描述</th>
                                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>纬度</th>
                                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>经度</th>
                                    <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {markers.map(marker => (
                                    <tr key={marker.id}>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{marker.id}</td>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{marker.description}</td>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{marker.position[0].toFixed(6)}</td>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{marker.position[1].toFixed(6)}</td>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                            <button
                                                onClick={() => handleDeleteMarker(marker.id)}
                                                style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#ff4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                删除
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MapView;
