import React, { useState, useEffect, useCallback } from 'react';
import EXIF from 'exif-js';

const API_BASE_URL = 'http://localhost:5000/api';
const AMAP_KEY = '填入你的高德apikey';

function PhotosView() {
    const [photos, setPhotos] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [exifInfo, setExifInfo] = useState(null);
    const [addresses, setAddresses] = useState({});
    const token = localStorage.getItem('token');

    // 获取所有照片
    const fetchPhotos = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/photo/photos`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '获取照片失败');
            }
            
            const data = await response.json();
            console.log('Fetched photos:', data);
            setPhotos(data);
        } catch (error) {
            console.error('获取照片错误:', error);
        }
    }, [token]);

    // 获取地址信息
    const fetchAddress = async (lat, lng, photoId) => {
        try {
            const response = await fetch(
                `https://restapi.amap.com/v3/geocode/regeo?location=${lng},${lat}&key=${AMAP_KEY}&radius=1000&extensions=all`
            );
            const data = await response.json();
            if (data.status === '1' && data.regeocode) {
                setAddresses(prev => ({
                    ...prev,
                    [photoId]: data.regeocode.formatted_address
                }));
            }
        } catch (error) {
            console.error('获取地址失败:', error);
        }
    };

    // 处理文件选择
    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            const exifData = await extractExifData(file);
            setExifInfo(exifData);
        }
    };

    // 上传照片
    const handleUpload = async (event) => {
        event.preventDefault();
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        if (exifInfo) {
            formData.append('exif_data', JSON.stringify(exifInfo));
            if (exifInfo.latitude && exifInfo.longitude) {
                formData.append('latitude', exifInfo.latitude);
                formData.append('longitude', exifInfo.longitude);
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}/photo/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '上传照片失败');
            }

            await fetchPhotos();
            setSelectedFile(null);
            setPreviewUrl(null);
            setExifInfo(null);
        } catch (error) {
            console.error('上传照片错误:', error);
        } finally {
            setUploading(false);
        }
    };

    // 删除照片
    const handleDelete = async (photoId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/photo/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除照片失败');
            }

            // 从本地状态中移除照片
            setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
        } catch (error) {
            console.error('删除照片错误:', error);
        }
    };

    // 提取 EXIF 数据
    const extractExifData = (file) => {
        return new Promise((resolve) => {
            EXIF.getData(file, function() {
                const exifData = {};
                const allTags = EXIF.getAllTags(this);

                if (allTags.GPSLatitude && allTags.GPSLongitude) {
                    const lat = EXIF.getTag(this, "GPSLatitude");
                    const latRef = EXIF.getTag(this, "GPSLatitudeRef");
                    const lon = EXIF.getTag(this, "GPSLongitude");
                    const lonRef = EXIF.getTag(this, "GPSLongitudeRef");

                    exifData.latitude = (latRef === "S" ? -1 : 1) * 
                        (lat[0] + lat[1]/60 + lat[2]/3600);
                    exifData.longitude = (lonRef === "W" ? -1 : 1) * 
                        (lon[0] + lon[1]/60 + lon[2]/3600);
                }

                exifData.make = EXIF.getTag(this, "Make");
                exifData.model = EXIF.getTag(this, "Model");
                exifData.dateTime = EXIF.getTag(this, "DateTime");
                resolve(exifData);
            });
        });
    };

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    useEffect(() => {
        photos.forEach(photo => {
            if (photo.latitude && photo.longitude && !addresses[photo.id]) {
                fetchAddress(photo.latitude, photo.longitude, photo.id);
            }
        });
    }, [photos, addresses]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    return (
        <div style={{ padding: '20px' }}>
            {/* 上传区域 */}
            <div style={{
                marginBottom: '20px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
            }}>
                <form onSubmit={handleUpload}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ marginRight: '10px' }}
                    />
                    <button
                        type="submit"
                        disabled={!selectedFile || uploading}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {uploading ? '上传中...' : '上传照片'}
                    </button>
                </form>

                {/* 预览区域 */}
                {previewUrl && (
                    <div style={{ marginTop: '20px' }}>
                        <h3>预览</h3>
                        <img
                            src={previewUrl}
                            alt="预览"
                            style={{
                                maxWidth: '300px',
                                maxHeight: '300px',
                                objectFit: 'contain',
                                marginBottom: '10px'
                            }}
                        />
                        {exifInfo && (
                            <div>
                                <h4>照片信息</h4>
                                {exifInfo.make && <p>相机品牌: {exifInfo.make}</p>}
                                {exifInfo.model && <p>相机型号: {exifInfo.model}</p>}
                                {exifInfo.dateTime && <p>拍摄时间: {exifInfo.dateTime}</p>}
                                {exifInfo.latitude && exifInfo.longitude && (
                                    <p>位置: {exifInfo.latitude.toFixed(6)}, {exifInfo.longitude.toFixed(6)}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 照片网格 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {photos.map(photo => (
                    <div key={photo.id} style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'relative',
                            width: '100%',
                            height: '250px',
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <img
                                src={`${API_BASE_URL}/photo/image/${photo.filename}`}
                                alt={photo.description || '照片'}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain'
                                }}
                                onError={(e) => {
                                    console.error(`Error loading image: ${photo.filename}`);
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPuWbvueJh+WKoOi9veWksei0pe+8gTwvdGV4dD48L3N2Zz4=';
                                }}
                            />
                        </div>
                        <div style={{ padding: '15px' }}>
                            <p style={{ margin: '5px 0' }}>上传时间: {new Date(photo.created_at).toLocaleString()}</p>
                            {photo.exif_data && (
                                <div>
                                    {(() => {
                                        try {
                                            const exif = typeof photo.exif_data === 'string' 
                                                ? JSON.parse(photo.exif_data) 
                                                : photo.exif_data;
                                            return (
                                                <>
                                                    {exif.make && <p style={{ margin: '5px 0' }}>相机品牌: {exif.make}</p>}
                                                    {exif.model && <p style={{ margin: '5px 0' }}>相机型号: {exif.model}</p>}
                                                    {exif.dateTime && <p style={{ margin: '5px 0' }}>拍摄时间: {exif.dateTime}</p>}
                                                </>
                                            );
                                        } catch (error) {
                                            console.error('解析 EXIF 数据错误:', error);
                                            return null;
                                        }
                                    })()}
                                </div>
                            )}
                            {photo.latitude && photo.longitude && (
                                <div>
                                    <p style={{ margin: '5px 0' }}>
                                        位置: {Number(photo.latitude).toFixed(6)}, {Number(photo.longitude).toFixed(6)}
                                    </p>
                                    {addresses[photo.id] && (
                                        <p style={{ margin: '5px 0' }}>
                                            地址: {addresses[photo.id]}
                                        </p>
                                    )}
                                    <button
                                        onClick={() => window.open(`https://uri.amap.com/marker?position=${photo.longitude},${photo.latitude}&name=照片位置`, '_blank')}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: '#1976d2',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            marginTop: '5px',
                                            marginRight: '10px'
                                        }}
                                    >
                                        在地图中查看
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => handleDelete(photo.id)}
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
                                删除照片
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PhotosView;
