# RBAC权限管理系统开发文档

## 1. 需求分析

### 1.1 角色划分
- 普通用户：具有基本的浏览、发表文章、评论等功能
- 管理员：具有用户管理、文章管理等功能
- 超级管理员：具有角色管理、权限分配、用户角色分配等最高权限

### 1.2 功能模块

#### 1.2.1 管理员模块
- 用户管理：平台管理方可通过系统界面获取全部注册用户的信息列表，同时具备对违规账号进行临时封停或永久性删除的权限操作
- 文章管理：系统管理员可对文章进行评估审核，对不符合内容标准的文稿进行编辑修订等后台操作

#### 1.2.2 超级管理员模块
- 角色管理功能：主控账号具备对各类职能身份的新增、修改及移除的完整执行权
- 权限分配功能：系统允许最高管理者为各类角色设定对应权限，实现角色与权限的精确匹配
- 用户角色分配功能：平台支持向使用者赋予一项或多项角色定位，同时具备撤销现有角色的操作能力

#### 1.2.3 用户模块
已实现，包括个人信息管理、博客内容管理、消息中心等功能

## 2. 系统架构设计

### 2.1 数据库设计扩展

```sql
-- 角色表
CREATE TABLE IF NOT EXISTS `tb_role` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '角色ID',
    `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
    `create_time` DATETIME NOT NULL COMMENT '创建时间',
    `update_time` DATETIME NOT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 权限表
CREATE TABLE IF NOT EXISTS `tb_permission` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '权限ID',
    `name` VARCHAR(100) NOT NULL COMMENT '权限名称',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '权限描述',
    `path` VARCHAR(255) DEFAULT NULL COMMENT '权限路径',
    `create_time` DATETIME NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 角色-权限关联表
CREATE TABLE IF NOT EXISTS `tb_role_permission` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '关联ID',
    `role_id` BIGINT NOT NULL COMMENT '角色ID',
    `permission_id` BIGINT NOT NULL COMMENT '权限ID',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_role_permission` (`role_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色-权限关联表';

-- 用户-角色关联表
CREATE TABLE IF NOT EXISTS `tb_user_role` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '关联ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `role_id` BIGINT NOT NULL COMMENT '角色ID',
    `create_time` DATETIME NOT NULL COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_user_role` (`user_id`, `role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户-角色关联表';
```

### 2.2 实体类和DTO扩展

#### 2.2.1 角色实体类
```java
package com.manager.manager.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Role {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
```

#### 2.2.2 权限实体类
```java
package com.manager.manager.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Permission {
    private Long id;
    private String name;
    private String description;
    private String path;
    private LocalDateTime createTime;
}
```

#### 2.2.3 关联实体类
需要创建 `RolePermission.java` 和 `UserRole.java` 文件，以及相应的DTO类。

### 2.3 安全配置修改

#### 2.3.1 JWT认证过滤器修改
需要扩展 `JwtAuthenticationFilter.java`，增加角色和权限处理逻辑。

#### 2.3.2 安全配置类修改
扩展 `SecurityConfig.java`，实现基于角色的访问控制。

## 3. 接口设计

### 3.1 管理员接口

#### 3.1.1 用户管理
- `GET /api/admin/users` - 获取所有用户列表
- `PUT /api/admin/users/{userId}/status` - 更新用户状态
- `DELETE /api/admin/users/{userId}` - 删除用户

#### 3.1.2 文章管理
- `GET /api/admin/articles` - 获取所有文章列表
- `PUT /api/admin/articles/{articleId}/status` - 审核文章
- `DELETE /api/admin/articles/{articleId}` - 删除文章

### 3.2 超级管理员接口

#### 3.2.1 角色管理
- `GET /api/admin/roles` - 获取所有角色
- `GET /api/admin/roles/{id}` - 获取角色详情
- `POST /api/admin/roles` - 创建角色
- `PUT /api/admin/roles/{id}` - 更新角色
- `DELETE /api/admin/roles/{id}` - 删除角色

#### 3.2.2 权限管理
- `GET /api/admin/permissions` - 获取所有权限
- `GET /api/admin/permissions/{id}` - 获取权限详情
- `POST /api/admin/permissions` - 创建权限
- `PUT /api/admin/permissions/{id}` - 更新权限
- `DELETE /api/admin/permissions/{id}` - 删除权限

#### 3.2.3 角色权限分配
- `POST /api/admin/roles/{roleId}/permissions` - 为角色分配权限

#### 3.2.4 用户角色分配
- `POST /api/admin/users/{userId}/roles` - 为用户分配角色

## 4. 前端设计

### 4.1 管理后台

#### 4.1.1 登录页面
- 管理员登录界面

#### 4.1.2 管理员主界面
- 用户管理界面
- 文章管理界面

#### 4.1.3 超级管理员界面
- 角色管理界面
- 权限管理界面
- 权限分配界面
- 用户角色分配界面

## 5. 初始数据

```sql
-- 初始化角色数据
INSERT INTO `tb_role` (`name`, `description`, `create_time`, `update_time`) VALUES
('USER', '普通用户', NOW(), NOW()),
('ADMIN', '管理员', NOW(), NOW()),
('SUPER_ADMIN', '超级管理员', NOW(), NOW());

-- 初始化权限数据
INSERT INTO `tb_permission` (`name`, `description`, `path`, `create_time`) VALUES
('user:view', '查看用户', '/api/admin/users', NOW()),
('user:edit', '编辑用户', '/api/admin/users/*', NOW()),
('article:view', '查看文章', '/api/admin/articles', NOW()),
('article:edit', '编辑文章', '/api/admin/articles/*', NOW()),
('role:view', '查看角色', '/api/admin/roles', NOW()),
('role:edit', '编辑角色', '/api/admin/roles/*', NOW()),
('permission:view', '查看权限', '/api/admin/permissions', NOW()),
('permission:edit', '编辑权限', '/api/admin/permissions/*', NOW());

-- 角色权限关联
-- 管理员权限
INSERT INTO `tb_role_permission` (`role_id`, `permission_id`) VALUES
(2, 1), -- ADMIN -> user:view
(2, 3), -- ADMIN -> article:view
(2, 4); -- ADMIN -> article:edit

-- 超级管理员权限（所有权限）
INSERT INTO `tb_role_permission` (`role_id`, `permission_id`) VALUES
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8);

-- 设置一个超级管理员账号（假设ID为1的用户为超级管理员）
INSERT INTO `tb_user_role` (`user_id`, `role_id`, `create_time`) VALUES
(1, 3, NOW());
```

## 6. 开发步骤优先级

1. 数据库结构和实体类实现
2. 安全配置修改，支持基于角色的访问控制
3. Mapper和Service接口开发
4. Controller层接口开发
5. 前端管理后台界面开发

4.2.1 管理员模块
用户管理：平台管理方可通过系统界面获取全部注册用户的信息列表，同时具备对违规账号进行临时封停或永久性删除的权限操作。
文章管理：系统管理员可对文章进行评估审核，对不符合内容标准的文稿进行编辑修订等后台操作。
4.2.2 超级管理员模块
角色管理功能：主控账号具备对各类职能身份的新增、修改及移除的完整执行权。
权限分配功能：系统允许最高管理者为各类角色设定对应权限，实现角色与权限的精确匹配。
用户角色分配功能：平台支持向使用者赋予一项或多项角色定位，同时具备撤销现有角色的操作能力。