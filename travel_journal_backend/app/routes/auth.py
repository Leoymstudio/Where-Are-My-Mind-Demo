from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.user import User
from app import db
from datetime import datetime

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
        
    user = User(
        username=data['username'],
        email=data['email'],
        nickname=data.get('nickname'),
        birthday=datetime.strptime(data.get('birthday', ''), '%Y-%m-%d').date() if data.get('birthday') else None,
        phone=data.get('phone')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': '注册成功'}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({'token': access_token}), 200
        
    return jsonify({'error': '用户名或密码错误'}), 401

@bp.route('/profile', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    
    if request.method == 'GET':
        return jsonify({
            'username': user.username,
            'email': user.email,
            'nickname': user.nickname,
            'birthday': user.birthday.strftime('%Y-%m-%d') if user.birthday else None,
            'phone': user.phone,
            'preferences': user.preferences
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        user.nickname = data.get('nickname', user.nickname)
        user.email = data.get('email', user.email)
        if data.get('birthday'):
            user.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
        user.phone = data.get('phone', user.phone)
        user.preferences = data.get('preferences', user.preferences)
        db.session.commit()
        return jsonify({'message': '个人信息已更新'})
    
    else:  # DELETE
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': '账户已删除'}) 

@bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})