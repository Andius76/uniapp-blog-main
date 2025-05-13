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
