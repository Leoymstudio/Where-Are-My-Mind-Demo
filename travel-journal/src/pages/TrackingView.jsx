import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const API_BASE_URL = 'http://localhost:5000/api';

// 自定义起点和终点图标
const startIcon = L.icon({
    iconUrl: icon,  // 使用默认图标
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'start-marker'  // 添加自定义类名
});

const endIcon = L.icon({
    iconUrl: icon,  // 使用默认图标
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'end-marker'  // 添加自定义类名
});

// 添加样式到组件中
const markerStyles = `
    .start-marker {
        filter: hue-rotate(120deg);  /* 绿色 */
    }
    .end-marker {
        filter: hue-rotate(0deg);  /* 红色 */
    }
`;

function TrackingView() {
    const [tracks, setTracks] = useState([]);
    const [isTracking, setIsTracking] = useState(false);
    const [currentTrack, setCurrentTrack] = useState({
        points: [],
        startTime: null
    });
    const token = localStorage.getItem('token');

    // 获取所有路径
    const fetchTracks = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/track/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('获取路径失败');
            const data = await response.json();
            setTracks(data);
        } catch (error) {
            console.error('获取路径错误:', error);
        }
    }, [token]);

    // 删除路径
    const handleDelete = async (trackId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/track/${trackId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('删除路径失败');
            setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
        } catch (error) {
            console.error('删除路径错误:', error);
        }
    };

    // 开始记录路径
    const startTracking = () => {
        setIsTracking(true);
        setCurrentTrack({
            points: [],
            startTime: new Date().toISOString()
        });
        
        // 开始获取位置
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentTrack(prev => ({
                        ...prev,
                        points: [...prev.points, {
                            lat: latitude,
                            lng: longitude,
                            timestamp: new Date().toISOString()
                        }]
                    }));
                },
                (error) => console.error('位置获取错误:', error),
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        }
    };

    // 结束记录路径
    const stopTracking = async () => {
        setIsTracking(false);
        
        try {
            // 计算距离
            const distance = calculateDistance(currentTrack.points);
            
            // 保存路径
            const response = await fetch(`${API_BASE_URL}/track/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: `路线 ${new Date().toLocaleString()}`,
                    points: currentTrack.points,
                    start_time: currentTrack.startTime,
                    end_time: new Date().toISOString(),
                    distance
                })
            });

            if (!response.ok) throw new Error('保存路径失败');
            
            // 重新获取所有路径
            fetchTracks();
            
            // 清空当前路径
            setCurrentTrack({
                points: [],
                startTime: null
            });
        } catch (error) {
            console.error('保存路径错误:', error);
        }
    };

    // 计算距离
    const calculateDistance = (points) => {
        if (points.length < 2) return 0;
        
        let distance = 0;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            distance += getDistanceFromLatLonInM(
                prev.lat, prev.lng,
                curr.lat, curr.lng
            );
        }
        return Math.round(distance);
    };

    // 计算两点之间的距离（米）
    function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // 地球半径（米）
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // 初始加载
    useEffect(() => {
        fetchTracks();
    }, [fetchTracks]);

    // 获取路径的起点和终点
    const getTrackEndpoints = (points) => {
        if (!points || points.length === 0) return { start: null, end: null };
        return {
            start: points[0],
            end: points[points.length - 1]
        };
    };

    return (
        <div style={{ padding: '20px' }}>
            <style>{markerStyles}</style>
            
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={isTracking ? stopTracking : startTracking}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: isTracking ? '#f44336' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {isTracking ? '停止记录' : '开始记录'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 150px)' }}>
                {/* 地图显示 */}
                <div style={{ flex: 2 }}>
                    <MapContainer
                        center={[39.9042, 116.4074]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
                            attribution='&copy; 高德地图'
                        />
                        {/* 显示当前记录的路径 */}
                        {isTracking && currentTrack.points.length > 0 && (
                            <>
                                <Polyline
                                    positions={currentTrack.points.map(p => [p.lat, p.lng])}
                                    color="red"
                                />
                                {/* 起点标记 */}
                                <Marker 
                                    position={[currentTrack.points[0].lat, currentTrack.points[0].lng]}
                                    icon={startIcon}
                                >
                                    <Popup>
                                        <div>
                                            <strong>起点</strong><br/>
                                            时间: {new Date(currentTrack.points[0].timestamp).toLocaleString()}
                                        </div>
                                    </Popup>
                                </Marker>
                                {/* 终点标记 */}
                                <Marker 
                                    position={[
                                        currentTrack.points[currentTrack.points.length - 1].lat,
                                        currentTrack.points[currentTrack.points.length - 1].lng
                                    ]}
                                    icon={endIcon}
                                >
                                    <Popup>
                                        <div>
                                            <strong>当前位置</strong><br/>
                                            时间: {new Date(currentTrack.points[currentTrack.points.length - 1].timestamp).toLocaleString()}
                                        </div>
                                    </Popup>
                                </Marker>
                            </>
                        )}
                        {/* 显示历史路径 */}
                        {tracks.map(track => {
                            const { start, end } = getTrackEndpoints(track.points);
                            return (
                                <React.Fragment key={track.id}>
                                    <Polyline
                                        positions={track.points.map(p => [p.lat, p.lng])}
                                        color="blue"
                                    >
                                        <Popup>
                                            <div>
                                                <p><strong>{track.name}</strong></p>
                                                <p>开始时间: {new Date(track.start_time).toLocaleString()}</p>
                                                <p>距离: {track.distance}米</p>
                                                <button
                                                    onClick={() => handleDelete(track.id)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    删除路线
                                                </button>
                                            </div>
                                        </Popup>
                                    </Polyline>
                                    {start && (
                                        <Marker 
                                            position={[start.lat, start.lng]}
                                            icon={startIcon}
                                        >
                                            <Popup>
                                                <div>
                                                    <strong>起点</strong><br/>
                                                    时间: {new Date(start.timestamp).toLocaleString()}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )}
                                    {end && (
                                        <Marker 
                                            position={[end.lat, end.lng]}
                                            icon={endIcon}
                                        >
                                            <Popup>
                                                <div>
                                                    <strong>终点</strong><br/>
                                                    时间: {new Date(end.timestamp).toLocaleString()}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* 路径列表 */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    backgroundColor: '#f5f5f5',
                    padding: '15px',
                    borderRadius: '8px'
                }}>
                    <h2>路径记录</h2>
                    {tracks.map(track => {
                        const { start, end } = getTrackEndpoints(track.points);
                        return (
                            <div
                                key={track.id}
                                style={{
                                    backgroundColor: 'white',
                                    padding: '15px',
                                    marginBottom: '10px',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                <h3>{track.name}</h3>
                                <p>开始时间: {new Date(track.start_time).toLocaleString()}</p>
                                {track.end_time && (
                                    <p>结束时间: {new Date(track.end_time).toLocaleString()}</p>
                                )}
                                <p>距离: {track.distance}米</p>
                                {start && (
                                    <p>起点: [{start.lat.toFixed(6)}, {start.lng.toFixed(6)}]</p>
                                )}
                                {end && (
                                    <p>终点: [{end.lat.toFixed(6)}, {end.lng.toFixed(6)}]</p>
                                )}
                                <button
                                    onClick={() => handleDelete(track.id)}
                                    style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginTop: '10px'
                                    }}
                                >
                                    删除路线
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default TrackingView;
