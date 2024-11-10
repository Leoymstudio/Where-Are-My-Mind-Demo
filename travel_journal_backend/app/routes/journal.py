from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.journal import Journal
from app import db
from datetime import datetime

bp = Blueprint('journal', __name__, url_prefix='/api/journal')

@bp.route('/', methods=['GET', 'POST'])
@jwt_required()
def journals():
    user_id = get_jwt_identity()
    
    if request.method == 'GET':
        user_journals = Journal.query.filter_by(user_id=user_id).order_by(Journal.created_at.desc()).all()
        return jsonify([{
            'id': journal.id,
            'title': journal.title,
            'content': journal.content,
            'created_at': journal.created_at.isoformat(),
            'updated_at': journal.updated_at.isoformat()
        } for journal in user_journals])
    
    data = request.get_json()
    journal = Journal(
        title=data.get('title', ''),
        content=data['content'],
        user_id=user_id
    )
    db.session.add(journal)
    db.session.commit()
    
    return jsonify({
        'id': journal.id,
        'title': journal.title,
        'content': journal.content,
        'created_at': journal.created_at.isoformat()
    }), 201

@bp.route('/<int:journal_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def journal_detail(journal_id):
    user_id = get_jwt_identity()
    journal = Journal.query.filter_by(id=journal_id, user_id=user_id).first_or_404()
    
    if request.method == 'GET':
        return jsonify({
            'id': journal.id,
            'title': journal.title,
            'content': journal.content,
            'created_at': journal.created_at.isoformat(),
            'updated_at': journal.updated_at.isoformat()
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        journal.title = data.get('title', journal.title)
        journal.content = data.get('content', journal.content)
        db.session.commit()
        return jsonify({'message': '日志已更新'})
    
    else:  # DELETE
        db.session.delete(journal)
        db.session.commit()
        return jsonify({'message': '日志已删除'}) 