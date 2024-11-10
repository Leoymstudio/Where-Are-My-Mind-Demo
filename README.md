# Where are my mind- 旅行日记应用

## 项目简介

Where are my mind是一个全栈旅行日记应用，允许用户记录他们的旅行经历，包括日记、照片、路线追踪等功能。使用 React 作为前端框架，Flask 作为后端服务器，提供了完整的用户认证和数据管理功能。项目目前是作为南京农业大学的综合系统开发作业（略显简陋）。

## 主要功能

- 📝 日记管理：创建、编辑、删除旅行日记
- 📸 照片管理：上传照片，自动提取 EXIF 信息
- 🗺️ 路线追踪：记录旅行路线，显示在地图上
- 👤 用户管理：注册、登录、个人信息管理
- 🌍 地图集成：基于高德地图的位置服务

## 技术栈

### 前端

- React 18
- React Router v6
- Leaflet (地图组件)
- React-Quill (富文本编辑器)
- EXIF.js (照片信息提取)

### 后端

- Python 3.8+
- Flask
- SQLAlchemy
- JWT Authentication
- SQLite/MySQL

## 项目结构

```bash
travel-journal/
├── src/ # 前端源代码
│ ├── components/ # 可复用组件
│ │ └── Navigation.jsx # 导航栏组件
│ ├── pages/ # 页面组件
│ │ ├── LoginView.jsx # 登录页面
│ │ ├── RegisterView.jsx # 注册页面
│ │ ├── MapView.jsx # 地图页面
│ │ ├── JournalView.jsx # 日记页面
│ │ ├── PhotosView.jsx # 照片页面
│ │ ├── TrackingView.jsx # 路线追踪页面
│ │ └── ProfileView.jsx # 个人信息页面
│ ├── App.js # 应用主组件
│ └── index.js # 入口文件
├── public/ # 静态资源
└── package.json # 项目配置文件
travel_journal_backend/
├── app/ # 后端应用目录
│ ├── models/ # 数据模型
│ │ ├── user.py # 用户模型
│ │ ├── journal.py # 日记模型
│ │ ├── photo.py # 照片模型
│ │ └── track.py # 路线模型
│ ├── routes/ # 路由处理
│ │ ├── auth.py # 认证相关路由
│ │ ├── journal.py # 日记相关路由
│ │ ├── photo.py # 照片相关路由
│ │ └── track.py # 路线相关路由
│ └── init.py # 应用初始化
├── config.py # 配置文件
├── requirements.txt # Python 依赖
└── run.py # 启动脚本

```

## 项目使用

### 克隆项目

```bash
# 克隆项目
git clone [项目地址]
cd travel-journal

# 安装依赖
npm install react-router-dom # 路由
npm install @mui/material # UI 组件
npm install leaflet # 地图组件
npm install react-quill # 富文本编辑器
npm install exif-js # EXIF 信息提取

# 启动开发服务器
npm start
```

### 进入后端目录


```
cd travel_journal_backend

# 创建并激活虚拟环境
python -m venv venv

# Windows 激活虚拟环境
venv\Scripts\activate

# Linux/Mac 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install flask
pip install flask-sqlalchemy
pip install flask-jwt-extended
pip install flask-cors
pip install pillow
pip install python-dotenv

# 或者直接通过 requirements.txt 安装
pip install -r requirements.txt

# 初始化数据库
flask db init
flask db migrate
flask db upgrade

# 启动服务器
python run.py
```


### 前端依赖

```bash
{
  "dependencies": {
    "@emotion/react": "^11.x",
    "@emotion/styled": "^11.x",
    "@mui/material": "^5.x",
    "exif-js": "^2.3.0",
    "leaflet": "^1.9.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-quill": "^2.x",
    "react-router-dom": "^6.x"
  }
}
```

### 后端依赖

```bash
Flask==2.3.x
Flask-SQLAlchemy==3.1.x
Flask-JWT-Extended==4.5.x
Flask-CORS==4.0.x
Pillow==10.x
python-dotenv==1.0.x
```

### 环境变量

```bash
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

### 配置文件

```bash
class Config:
    SECRET_KEY = 'your-secret-key'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///travel_journal.db'
    JWT_SECRET_KEY = 'your-jwt-secret-key'
    UPLOAD_FOLDER = 'uploads'
```
