# 前端API文档

本文档详细说明了博客系统前端与后端交互的API接口，包括用户认证、文章管理等功能。

## 目录

- [认证相关](#认证相关)
  - [用户注册](#用户注册)
  - [发送邮箱验证码](#发送邮箱验证码)
  - [用户登录](#用户登录)
  - [管理员登录](#管理员登录)
  - [忘记密码](#忘记密码)
  - [重置密码](#重置密码)
- [角色管理相关](#角色管理相关)
  - [获取角色列表](#获取角色列表)
  - [获取角色详情](#获取角色详情)
  - [添加角色](#添加角色)
  - [更新角色](#更新角色)
  - [更新角色状态](#更新角色状态)
  - [删除角色](#删除角色)

## 认证相关

### 用户注册

**接口地址**: `/api/auth/register`

**请求方式**: POST

**请求参数**:

| 参数名     | 类型   | 必填 | 说明       |
| ---------- | ------ | ---- | ---------- |
| email      | String | 是   | 用户邮箱   |
| email_code | String | 是   | 邮箱验证码 |
| password   | String | 是   | 用户密码   |

**响应示例**:

```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "用户昵称",
      "avatar": "default.jpg"
    }
  }
}
```

### 发送邮箱验证码

**接口地址**: `/api/auth/send-email-code`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| email  | String | 是   | 用户邮箱 |

**响应示例**:

```json
{
  "code": 200,
  "message": "验证码已发送",
  "data": null
}
```

### 用户登录

**接口地址**: `/api/auth/login`

**请求方式**: POST

**请求参数**:

| 参数名   | 类型    | 必填 | 说明             |
| -------- | ------- | ---- | ---------------- |
| email    | String  | 是   | 用户邮箱         |
| password | String  | 是   | 用户密码         |
| remember | Boolean | 否   | 是否记住登录状态 |

**响应示例**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "用户昵称",
      "avatar": "default.jpg",
      "bio": "用户简介"
    }
  }
}
```

### 管理员登录

**接口地址**: `/api/admin/login`

**请求方式**: POST

**请求参数**:

| 参数名   | 类型   | 必填 | 说明         |
| -------- | ------ | ---- | ------------ |
| username | String | 是   | 管理员账号   |
| password | String | 是   | 管理员密码   |

**响应示例**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "系统管理员",
      "avatar": "admin.jpg"
    },
    "roles": ["admin", "editor"]
  }
}
```

**前端实现说明**:

管理员登录页面(`admin-login.vue`)实现了以下功能：

1. 表单验证：验证管理员账号和密码的合法性
2. 请求处理：调用`login`函数并传入`isAdmin:true`参数标识管理员登录
3. 登录成功：保存token和管理员信息到本地存储
4. 自动跳转：登录成功后自动跳转到管理后台首页

### 忘记密码

**接口地址**: `/api/auth/forget-password`

**请求方式**: POST

**请求参数**:

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| email  | String | 是   | 用户邮箱 |

**响应示例**:

```json
{
  "code": 200,
  "message": "密码重置链接已发送至邮箱",
  "data": null
}
```

### 重置密码

**接口地址**: `/api/auth/reset-password`

**请求方式**: POST

**请求参数**:

| 参数名       | 类型   | 必填 | 说明       |
| ------------ | ------ | ---- | ---------- |
| email        | String | 是   | 用户邮箱   |
| email_code   | String | 是   | 邮箱验证码 |
| new_password | String | 是   | 新密码     |

**响应示例**:

```json
{
  "code": 200,
  "message": "密码重置成功",
  "data": null
}
```

## 角色管理相关

### 获取角色列表

**接口地址**: `/api/admin/roles`

**请求方式**: GET

**请求参数**:

| 参数名  | 类型   | 必填 | 说明                |
|---------|--------|------|-------------------|
| page    | Number | 否   | 页码，默认1        |
| size    | Number | 否   | 每页条数，默认10   |
| keyword | String | 否   | 搜索关键词         |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取角色列表成功",
  "data": {
    "total": 5,
    "list": [
      {
        "id": 1,
        "name": "超级管理员",
        "description": "系统最高权限，可以管理所有功能",
        "status": "1",
        "isSystem": "1",
        "createTime": "2023-05-01 12:00:00",
        "updateTime": "2023-05-01 12:00:00"
      },
      {
        "id": 2,
        "name": "内容管理员",
        "description": "负责管理文章和评论相关内容",
        "status": "1",
        "isSystem": "1",
        "createTime": "2023-05-01 12:00:00",
        "updateTime": "2023-05-01 12:00:00"
      }
    ]
  }
}
```

### 获取角色详情

**接口地址**: `/api/admin/roles/{id}`

**请求方式**: GET

**请求参数**:

| 参数名 | 类型   | 必填 | 说明     |
|--------|--------|------|----------|
| id     | Number | 是   | 角色ID   |

**响应示例**:

```json
{
  "code": 200,
  "message": "获取角色详情成功",
  "data": {
    "id": 1,
    "name": "超级管理员",
    "description": "系统最高权限，可以管理所有功能",
    "status": "1",
    "isSystem": "1",
    "createTime": "2023-05-01 12:00:00",
    "updateTime": "2023-05-01 12:00:00"
  }
}
```

### 添加角色

**接口地址**: `/api/admin/roles`

**请求方式**: POST

**请求参数**:

| 参数名      | 类型   | 必填 | 说明                  |
|-------------|--------|------|---------------------|
| name        | String | 是   | 角色名称             |
| description | String | 否   | 角色描述             |
| status      | String | 是   | 状态：0-禁用，1-启用  |
| isSystem    | String | 否   | 是否系统内置：0-否，1-是，默认0 |

**响应示例**:

```json
{
  "code": 200,
  "message": "添加角色成功",
  "data": {
    "id": 6,
    "name": "测试角色",
    "description": "这是一个测试角色",
    "status": "1",
    "isSystem": "0",
    "createTime": "2023-06-10 15:30:00",
    "updateTime": "2023-06-10 15:30:00"
  }
}
```

### 更新角色

**接口地址**: `/api/admin/roles/{id}`

**请求方式**: PUT

**请求参数**:

| 参数名      | 类型   | 必填 | 说明                  |
|-------------|--------|------|---------------------|
| id          | Number | 是   | 角色ID（路径参数）    |
| name        | String | 是   | 角色名称             |
| description | String | 否   | 角色描述             |
| status      | String | 是   | 状态：0-禁用，1-启用  |

**响应示例**:

```json
{
  "code": 200,
  "message": "更新角色成功",
  "data": {
    "id": 6,
    "name": "测试角色-修改",
    "description": "这是一个修改后的测试角色",
    "status": "1",
    "isSystem": "0",
    "createTime": "2023-06-10 15:30:00",
    "updateTime": "2023-06-10 16:15:00"
  }
}
```

**注意事项**:
- 系统内置角色（isSystem=1）不允许修改
- 角色名称不允许重复

### 更新角色状态

**接口地址**: `/api/admin/roles/{id}/status`

**请求方式**: PUT

**请求参数**:

| 参数名 | 类型   | 必填 | 说明                  |
|--------|--------|------|---------------------|
| id     | Number | 是   | 角色ID（路径参数）    |
| status | String | 是   | 状态：0-禁用，1-启用  |

**响应示例**:

```json
{
  "code": 200,
  "message": "更新角色状态成功",
  "data": null
}
```

**注意事项**:
- 系统内置角色（isSystem=1）不允许修改状态

### 删除角色

**接口地址**: `/api/admin/roles/{id}`

**请求方式**: DELETE

**请求参数**:

| 参数名 | 类型   | 必填 | 说明               |
|--------|--------|------|-------------------|
| id     | Number | 是   | 角色ID（路径参数） |

**响应示例**:

```json
{
  "code": 200,
  "message": "删除角色成功",
  "data": null
}
```

**注意事项**:
- 系统内置角色（isSystem=1）不允许删除

## 跨平台交互体验优化

### APP与微信小程序交互优化

**功能说明**: 针对APP和微信小程序环境优化了文章列表的滚动交互体验。

#### 下拉刷新行为优化

**实现说明**:
- 在非H5环境下禁用了scroll-view组件的自动下拉刷新功能
- 防止轻微下拉即触发刷新操作，避免意外刷新
- 相关属性设置：
  ```html
  <scroll-view 
    :refresher-enabled="false" 
    :refresher-triggered="isRefreshing" 
    @refresherrefresh="handleRefresh"
    ... >
  ```

#### 回到顶部功能调整

**实现说明**:
- 移除了APP和微信小程序环境下的回到顶部按钮
- 通过条件编译控制回到顶部按钮只在H5环境显示
- 处理滚动事件时根据不同平台采取不同策略:
  ```js
  // H5环境下显示回到顶部按钮
  // #ifdef H5
  showBackTop.value = scrollTop > 500;
  // #endif
  
  // 非H5环境下强制不显示回到顶部按钮
  // #ifndef H5
  showBackTop.value = false;
  // #endif
  ```

#### 交互一致性优化

**实现说明**:
- 确保"我的"页面与首页、分类页面的交互体验一致
- 简化非H5环境的UI元素，减少不必要的视觉干扰
- 适配不同平台特性，提供更符合平台习惯的交互方式
- 通过条件编译(`#ifdef`/`#ifndef`)实现平台差异化处理
