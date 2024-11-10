import requests
import json
import os
from datetime import datetime
import time

BASE_URL = 'http://localhost:5000/api'

class TravelJournalTest:
    def __init__(self):
        self.token = None
        self.headers = None
    
    def check_server(self):
        try:
            response = requests.get(f'{BASE_URL}/auth/health')
            return response.status_code == 200
        except requests.exceptions.ConnectionError:
            return False

    def wait_for_server(self, timeout=30):
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.check_server():
                return True
            time.sleep(1)
        return False

    def test_auth(self):
        print("\n=== 测试用户认证 ===")
        try:
            # 注册
            register_data = {
                'username': 'testuser',
                'email': 'test@example.com',
                'password': 'password123',
                'nickname': '测试用户',
                'birthday': '1990-01-01',
                'phone': '13800138000'
            }
            response = requests.post(f'{BASE_URL}/auth/register', json=register_data)
            if response.status_code == 400 and 'error' in response.json():
                if response.json()['error'] == '用户名已存在':
                    print('用户已存在，继续录测试')
                else:
                    print('注册失败:', response.json())
                    return False
            elif response.status_code == 201:
                print('注册成功:', response.json())
            else:
                print(f'注册失败: {response.status_code}', response.text)
                return False

            # 登录
            login_data = {
                'username': 'testuser',
                'password': 'password123'
            }
            response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
            if response.status_code != 200:
                print(f'登录失败: {response.status_code}', response.text)
                return False
            
            self.token = response.json().get('token')
            if not self.token:
                print('登录失败: 没有获取到token')
                return False
                
            self.headers = {'Authorization': f'Bearer {self.token}'}
            print('登录成功:', response.json())
            
            # 获取个人信息
            response = requests.get(f'{BASE_URL}/auth/profile', headers=self.headers)
            if response.status_code == 200:
                print('获取个人信息:', response.json())
            else:
                print(f'获取个人信息失败: {response.status_code}', response.text)
                return False
            
            # 更新个人信息
            update_data = {
                'nickname': '更新后的昵称',
                'phone': '13900139000',
                'birthday': '1991-01-01'
            }
            response = requests.put(f'{BASE_URL}/auth/profile', 
                                  headers=self.headers,
                                  json=update_data)
            if response.status_code == 200:
                print('更新个人信息:', response.json())
            else:
                print(f'更新个人信息失败: {response.status_code}', response.text)
                return False

            return True
            
        except requests.exceptions.RequestException as e:
            print(f"请求错误: {str(e)}")
            return False
        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {str(e)}")
            return False
        except Exception as e:
            print(f"其他错误: {str(e)}")
            return False

    def test_markers(self):
        print("\n=== 测试地图标记 ===")
        # 创建标记
        marker_data = {
            'position': [39.9042, 116.4074],
            'description': '测试标记点'
        }
        response = requests.post(f'{BASE_URL}/map/markers',
                               headers=self.headers,
                               json=marker_data)
        marker_id = response.json().get('id')
        print('创建标记结果:', response.json())

        # 获取所有标记
        response = requests.get(f'{BASE_URL}/map/markers', headers=self.headers)
        print('所有标记:', response.json())
        
        # 删除标记
        response = requests.delete(f'{BASE_URL}/map/markers/{marker_id}',
                                 headers=self.headers)
        print('删除标记结果:', response.json())

    def test_journal(self):
        print("\n=== 测试旅行日志 ===")
        # 创建日志
        journal_data = {
            'title': '测试日志',
            'content': '<p>这是一篇测试日志的内容</p>'
        }
        response = requests.post(f'{BASE_URL}/journal/',
                               headers=self.headers,
                               json=journal_data)
        journal_id = response.json().get('id')
        print('创建日志结果:', response.json())

        # 获取所有日志
        response = requests.get(f'{BASE_URL}/journal/', headers=self.headers)
        print('所有日志:', response.json())

        # 更新日志
        update_data = {
            'title': '更新后的日志',
            'content': '<p>这是更新后的内容</p>'
        }
        response = requests.put(f'{BASE_URL}/journal/{journal_id}',
                              headers=self.headers,
                              json=update_data)
        print('更新日志结果:', response.json())

        # 删除日志
        response = requests.delete(f'{BASE_URL}/journal/{journal_id}',
                                 headers=self.headers)
        print('删除日志结果:', response.json())

    def test_photos(self):
        print("\n=== 测试照片管理 ===")
        test_image_path = 'test_image.jpg'
        file_handle = None
        
        try:
            # 创建测试图片
            with open(test_image_path, 'wb') as f:
                f.write(b'test image content')

            # 上传照片
            with open(test_image_path, 'rb') as test_file:
                files = {'file': ('test_image.jpg', test_file, 'image/jpeg')}
                data = {
                    'latitude': '39.9042',
                    'longitude': '116.4074',
                    'exif_data': json.dumps({'camera': 'test camera'})
                }
                response = requests.post(
                    f'{BASE_URL}/photo/upload',
                    headers=self.headers,
                    files=files,
                    data=data
                )
                print('上传照片结果:', response.json())
                
                if response.status_code != 201:
                    print(f'上传照片失败: {response.status_code}', response.text)
                    return False

                photo_id = response.json().get('id')

            # 获取所有照片
            response = requests.get(
                f'{BASE_URL}/photo/photos',
                headers=self.headers
            )
            print('所有照片:', response.json())

            # 删除照片
            if photo_id:
                response = requests.delete(
                    f'{BASE_URL}/photo/{photo_id}',
                    headers=self.headers
                )
                print('删除照片结果:', response.json())
                
                if response.status_code != 200:
                    print(f'删除照片失败: {response.status_code}', response.text)
                    return False

            return True

        except Exception as e:
            print(f"测试过程中出现错误: {str(e)}")
            return False
        finally:
            # 确保文件句柄已关闭
            if file_handle and not file_handle.closed:
                file_handle.close()
            
            # 等待一小段时间确保文件不再被使用
            import time
            time.sleep(1)
            
            # 尝试多次删除文件
            for _ in range(3):
                try:
                    if os.path.exists(test_image_path):
                        os.remove(test_image_path)
                    break
                except OSError:
                    time.sleep(1)

    def test_tracking(self):
        print("\n=== 测试路径追踪 ===")
        # 创建路径
        track_data = {
            'name': '测试路线',
            'points': [
                {'lat': 39.9042, 'lng': 116.4074, 'timestamp': datetime.now().isoformat()},
                {'lat': 39.9142, 'lng': 116.4174, 'timestamp': datetime.now().isoformat()}
            ],
            'start_time': datetime.now().isoformat(),
            'distance': 1500
        }
        response = requests.post(f'{BASE_URL}/track/',
                               headers=self.headers,
                               json=track_data)
        track_id = response.json().get('id')
        print('创建路径结果:', response.json())

        # 获取所有路径
        response = requests.get(f'{BASE_URL}/track/', headers=self.headers)
        print('所有路径:', response.json())

        # 更新路径
        update_data = {
            'name': '更新后的路线',
            'distance': 2000
        }
        response = requests.put(f'{BASE_URL}/track/{track_id}',
                              headers=self.headers,
                              json=update_data)
        print('更新路径结果:', response.json())

        # 删除路径
        response = requests.delete(f'{BASE_URL}/track/{track_id}',
                                 headers=self.headers)
        print('删除路径结果:', response.json())

    def run_all_tests(self):
        if not self.wait_for_server():
            print("无法连接到服务器，请确保服务器已启动")
            return

        try:
            if not self.test_auth():
                print("认证测试失败，停止后续测试")
                return
                
            self.test_markers()
            self.test_journal()
            self.test_photos()
            self.test_tracking()
            print("\n所有测试完成!")
        except Exception as e:
            print(f"测试过程中出现错误: {str(e)}")

if __name__ == '__main__':
    tester = TravelJournalTest()
    tester.run_all_tests()