import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginView from './pages/LoginView';
import RegisterView from './pages/RegisterView';
import MapView from './pages/MapView';
import JournalView from './pages/JournalView';
import PhotosView from './pages/PhotosView';
import TrackingView from './pages/TrackingView';
import ProfileView from './pages/ProfileView';
import Navigation from './components/Navigation';

// 带导航栏的布局组件
function Layout({ children }) {
    const token = localStorage.getItem('token');
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {token && <Navigation />}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {children}
            </div>
        </div>
    );
}

// 保护路由的组件
function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/register" element={<RegisterView />} />
                <Route path="/login" element={<LoginView />} />
                <Route
                    path="/map"
                    element={
                        <PrivateRoute>
                            <MapView />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/journal"
                    element={
                        <PrivateRoute>
                            <JournalView />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/photos"
                    element={
                        <PrivateRoute>
                            <PhotosView />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/tracking"
                    element={
                        <PrivateRoute>
                            <TrackingView />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <ProfileView />
                        </PrivateRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/map" />} />
            </Routes>
        </Router>
    );
}

export default App; 