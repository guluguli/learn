# main.py
import pygame
import math
from pygame.math import Vector2
import os

# 获取当前脚本所在的目录
current_dir = os.path.dirname(os.path.abspath(__file__))
assets_dir = os.path.join(current_dir, 'assets')

class Player:
    def __init__(self, x, y):
        self.position = Vector2(x, y)
        self.velocity = Vector2(0, 0)
        self.speed = 5
        self.rotation = 0
        self.health = 100
        self.in_vehicle = False
        self.current_vehicle = None
        self.friction = 0.9  # 添加摩擦力
        
        # 加载玩家模型
        self.image = pygame.image.load(os.path.join(assets_dir, "player.png"))
        self.image = pygame.transform.scale(self.image, (32, 32))
        self.rect = self.image.get_rect()

    def move(self, keys):
        # 如果在车内，不处理玩家移动
        if self.in_vehicle:
            return

        # 计算移动方向
        direction = Vector2(0, 0)
        if keys[pygame.K_w]:
            direction.y = -1
        if keys[pygame.K_s]:
            direction.y = 1
        if keys[pygame.K_a]:
            direction.x = -1
        if keys[pygame.K_d]:
            direction.x = 1

        # 如果有输入，则标准化方向向量并应用速度
        if direction.length_squared() > 0:
            direction = direction.normalize()
            self.velocity = direction * self.speed
        else:
            # 应用摩擦力
            self.velocity *= self.friction

        # 更新位置
        self.position += self.velocity

    def drive_vehicle(self, keys):
        if not self.current_vehicle:
            return
            
        if keys[pygame.K_w]:
            self.current_vehicle.accelerate()
        if keys[pygame.K_s]:
            self.current_vehicle.brake()
        if keys[pygame.K_a]:
            self.current_vehicle.turn_left()
        if keys[pygame.K_d]:
            self.current_vehicle.turn_right()

class Vehicle:
    def __init__(self, x, y):
        self.position = Vector2(x, y)
        self.velocity = Vector2(0, 0)
        self.rotation = 0
        self.speed = 0
        self.max_speed = 10
        self.acceleration = 0.5
        self.brake_power = 0.3
        self.turn_speed = 3
        self.friction = 0.98  # 添加摩擦力
        
        # 加载车辆模型
        self.image = pygame.image.load(os.path.join(assets_dir, "car.png"))
        self.image = pygame.transform.scale(self.image, (64, 32))
        self.rect = self.image.get_rect()

    def accelerate(self):
        self.speed = min(self.speed + self.acceleration, self.max_speed)
        angle = math.radians(self.rotation)
        self.velocity.x = math.cos(angle) * self.speed
        self.velocity.y = math.sin(angle) * self.speed

    def brake(self):
        self.speed = max(self.speed - self.brake_power, 0)
        angle = math.radians(self.rotation)
        self.velocity.x = math.cos(angle) * self.speed
        self.velocity.y = math.sin(angle) * self.speed

    def turn_left(self):
        if self.speed > 0:
            self.rotation -= self.turn_speed

    def turn_right(self):
        if self.speed > 0:
            self.rotation += self.turn_speed

    def update(self):
        # 应用速度
        self.position += self.velocity
        # 应用摩擦力
        self.velocity *= self.friction
        self.speed *= self.friction

class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((800, 600))
        self.clock = pygame.time.Clock()
        self.running = True
        
        # 创建游戏对象
        self.player = Player(400, 300)
        self.vehicles = [Vehicle(100, 100), Vehicle(500, 400)]
        
        # 摄像机偏移
        self.camera_offset = Vector2(0, 0)

    def handle_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_e:
                    self.handle_vehicle_interaction()
        
        # 获取按键状态
        keys = pygame.key.get_pressed()
        
        # 移动控制
        self.player.move(keys)
        
        # 如果在车内，更新车辆位置
        if self.player.in_vehicle and self.player.current_vehicle:
            if keys[pygame.K_w]:
                self.player.current_vehicle.accelerate()
            if keys[pygame.K_s]:
                self.player.current_vehicle.brake()
            if keys[pygame.K_a]:
                self.player.current_vehicle.turn_left()
            if keys[pygame.K_d]:
                self.player.current_vehicle.turn_right()

    def handle_vehicle_interaction(self):
        if self.player.in_vehicle:
            # 下车
            self.player.in_vehicle = False
            self.player.position = self.player.current_vehicle.position + Vector2(50, 0)
            self.player.current_vehicle = None
        else:
            # 查找最近的车辆
            for vehicle in self.vehicles:
                distance = (vehicle.position - self.player.position).length()
                if distance < 50:  # 交互距离
                    self.player.in_vehicle = True
                    self.player.current_vehicle = vehicle
                    break

    def update_camera(self):
        # 相机跟随玩家
        target = self.player.current_vehicle.position if self.player.in_vehicle else self.player.position
        self.camera_offset.x = target.x - 400
        self.camera_offset.y = target.y - 300

    def update(self):
        # 更新车辆状态
        for vehicle in self.vehicles:
            vehicle.update()
            
        # 如果玩家在车内，更新玩家位置为车辆位置
        if self.player.in_vehicle:
            self.player.position = self.player.current_vehicle.position.copy()

    def draw(self):
        self.screen.fill((100, 100, 100))  # 灰色背景
        
        # 绘制车辆
        for vehicle in self.vehicles:
            pos = vehicle.position - self.camera_offset
            rotated_image = pygame.transform.rotate(vehicle.image, -vehicle.rotation)
            rect = rotated_image.get_rect(center=pos)
            self.screen.blit(rotated_image, rect)

        # 绘制玩家（如果不在车内）
        if not self.player.in_vehicle:
            pos = self.player.position - self.camera_offset
            rect = self.player.image.get_rect(center=pos)
            self.screen.blit(self.player.image, rect)

        pygame.display.flip()

    def run(self):
        while self.running:
            self.handle_input()
            self.update()
            self.update_camera()
            self.draw()
            self.clock.tick(60)

if __name__ == "__main__":
    game = Game()
    game.run()