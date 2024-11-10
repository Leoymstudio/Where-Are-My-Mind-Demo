from app import create_app, db
import os

app = create_app()

with app.app_context():
    # 确保上传目录存在且有正确的权限
    upload_folder = app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder, mode=0o755)
    
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)