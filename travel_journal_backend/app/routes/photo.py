from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.photo import Photo
from app import db
import os
import uuid
from werkzeug.utils import secure_filename
from PIL import Image

bp = Blueprint('photo', __name__, url_prefix='/api/photo')

@bp.route('/photos', methods=['GET'])
@jwt_required()
def get_photos():
    try:
        user_id = get_jwt_identity()
        photos = Photo.query.filter_by(user_id=user_id).all()
        return jsonify([{
            'id': photo.id,
            'filename': photo.filename,
            'original_filename': photo.original_filename,
            'created_at': photo.created_at.isoformat(),
            'exif_data': photo.exif_data,
            'latitude': photo.latitude,
            'longitude': photo.longitude
        } for photo in photos])
    except Exception as e:
        print(f"Error getting photos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_photo():
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
        
    try:
        # 生成安全的文件名
        filename = secure_filename(str(uuid.uuid4()) + os.path.splitext(file.filename)[1])
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        
        # 确保目录存在
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # 保存文件
        file.save(file_path)
        print(f"File saved to: {file_path}")
        
        # 创建数据库记录
        photo = Photo(
            filename=filename,
            original_filename=file.filename,
            file_path=file_path,
            exif_data=request.form.get('exif_data'),
            latitude=float(request.form.get('latitude')) if request.form.get('latitude') else None,
            longitude=float(request.form.get('longitude')) if request.form.get('longitude') else None,
            user_id=get_jwt_identity()
        )
        
        db.session.add(photo)
        db.session.commit()
        
        return jsonify({
            'id': photo.id,
            'filename': filename,
            'created_at': photo.created_at.isoformat()
        }), 201
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/image/<filename>')
def serve_image(filename):
    try:
        return send_file(
            os.path.join(current_app.config['UPLOAD_FOLDER'], filename),
            mimetype='image/jpeg'
        )
    except Exception as e:
        print(f"Error serving image: {str(e)}")
        return jsonify({'error': str(e)}), 404

@bp.route('/<int:photo_id>', methods=['DELETE'])
@jwt_required()
def delete_photo(photo_id):
    try:
        user_id = get_jwt_identity()
        photo = Photo.query.filter_by(id=photo_id, user_id=user_id).first_or_404()
        
        # 删除实际的文件
        if photo.file_path and os.path.exists(photo.file_path):
            try:
                os.remove(photo.file_path)
            except OSError as e:
                print(f"Error deleting file: {e}")
        
        # 从数据库中删除记录
        db.session.delete(photo)
        db.session.commit()
        
        return jsonify({'message': '照片已删除'}), 200
        
    except Exception as e:
        print(f"Delete error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500