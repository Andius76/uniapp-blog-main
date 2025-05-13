# 博客系统API接口文档

本文档描述了博客系统的前端API接口，包括文章、用户、评论等功能的接口定义。

## 基本信息

- 基础URL: `http://localhost:8080`
- 所有接口都通过 `/src/utils/request.js` 中的HTTP客户端进行请求
- 认证方式: Bearer Token (JWT)
- 响应格式: JSON

## 通用响应结构

所有API响应都遵循以下统一格式:

```json
{
  "code": 200,              // 状态码: 200成功，非200表示错误
  "message": "success",     // 消息说明
  "data": {}                // 响应数据，结构因接口而异
}
```

## 文章相关接口 (/src/api/article.js)

### 获取文章列表

- 请求: `GET /api/article`
- 参数:
  - `page`: 页码，从1开始，默认1
  - `pageSize`: 每页条数，默认10
  - `tag`: 标签ID，可选
  - `keyword`: 搜索关键词，可选
- 响应:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "records": [
        {
          "id": 1,
          "title": "文章标题",
          "summary": "文章摘要",
          "content": "文章内容",
          "coverImage": "封面图URL",
          "viewCount": 100,
          "likeCount": 50,
          "commentCount": 10,
          "createTime": "2023-01-01 10:00:00",
          "author": {
            "id": 1,
            "nickname": "用户昵称",
            "avatar": "头像URL"
          },
          "tags": [
            {
              "id": 1,
              "name": "标签名称"
            }
          ],
          "isLiked": true,    // 当前用户是否已点赞
          "isCollected": false // 当前用户是否已收藏
        }
      ],
      "total": 100,      // 总记录数
      "size": 10,        // 每页条数
      "current": 1,      // 当前页码
      "pages": 10        // 总页数
    }
  }
  ```

### 获取文章详情

- 请求: `GET /api/article/{id}`
- 响应:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 1,
      "title": "文章标题",
      "content": "文章内容",
      "coverImage": "封面图URL",
      "viewCount": 100,
      "likeCount": 50,
      "commentCount": 10,
      "createTime": "2023-01-01 10:00:00",
      "updateTime": "2023-01-02 10:00:00",
      "author": {
        "id": 1,
        "nickname": "用户昵称",
        "avatar": "头像URL",
        "bio": "个人简介"
      },
      "tags": [
        {
          "id": 1,
          "name": "标签名称"
        }
      ],
      "isLiked": true,    // 当前用户是否已点赞
      "isCollected": false // 当前用户是否已收藏
    }
  }
  ```

### 发布文章

- 请求: `POST /api/article`
- 请求体:
  ```json
  {
    "title": "文章标题",
    "content": "文章内容",
    "htmlContent": "HTML格式的文章内容",
    "tags": [1, 2],  // 标签ID数组
    "coverImage": "封面图URL"
  }
  ```
- 响应:
  ```json
  {
    "code": 200,
    "message": "发布成功",
    "data": {
      "id": 1  // 新发布的文章ID
    }
  }
  ```

### 更新文章

- 请求: `PUT /api/article/{id}`
- 请求体: 同发布文章
- 响应:
  ```json
  {
    "code": 200,
    "message": "更新成功",
    "data": null
  }
  ```

### 点赞/取消点赞文章

- 点赞请求: `POST /api/article/like/{id}`
- 取消点赞: `DELETE /api/article/like/{id}`
- 响应:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": null
  }
  ```

### 收藏/取消收藏文章

- 收藏请求: `POST /api/article/collect/{id}`
- 取消收藏: `DELETE /api/article/collect/{id}`
- 响应:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": null
  }
  ```

### 获取文章评论列表

- 请求: `GET /api/article/comments/{articleId}`
- 参数:
  - `page`: 页码，从1开始，默认1
  - `pageSize`: 每页条数，默认10
- 响应:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "records": [
        {
          "id": 1,
          "content": "评论内容",
          "createTime": "2023-01-01 10:00:00",
          "likeCount": 5,
          "isLiked": false,  // 当前用户是否已点赞该评论
          "userId": 1,
          "user": {
            "id": 1,
            "nickname": "评论者昵称",
            "avatar": "头像URL"
          },
          "replies": [  // 回复列表
            {
              "id": 2,
              "content": "回复内容",
              "createTime": "2023-01-01 11:00:00",
              "userId": 2,
              "user": {
                "id": 2,
                "nickname": "回复者昵称",
                "avatar": "头像URL"
              },
              "replyUserId": 1,
              "replyUser": {
                "id": 1,
                "nickname": "被回复者昵称",
                "avatar": "头像URL"
              }
            }
          ]
        }
      ],
      "total": 20,      // 总记录数
      "size": 10,        // 每页条数
      "current": 1,      // 当前页码
      "pages": 2         // 总页数
    }
  }
  ```

### 发表评论

- 请求: `POST /api/article/comment/{articleId}`
- 请求体:
  ```json
  {
    "content": "评论内容",
    "parentId": null,    // 父评论ID，回复评论时必填
    "replyUserId": null  // 回复的用户ID，回复评论时必填
  }
  ```
- 响应:
  ```json
  {
    "code": 200,
    "message": "评论成功",
    "data": {
      "id": 1  // 新评论ID
    }
  }
  ```

## 评论相关接口 (/src/api/comment.js)

### 点赞/取消点赞评论

- 点赞请求: `POST /api/comment/like/{id}`
- 取消点赞: `DELETE /api/comment/like/{id}`
- 响应:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": null
  }
  ```

### 删除评论

- 请求: `DELETE /api/comment/{id}`
- 响应:
  ```json
  {
    "code": 200,
    "message": "删除成功",
    "data": null
  }
  ```

### 获取用户的评论

- 请求: `GET /api/comment/user`
- 参数:
  - `page`: 页码，从1开始，默认1
  - `pageSize`: 每页条数，默认10
- 响应格式同获取文章评论列表

### 获取用户收到的评论

- 请求: `GET /api/comment/received`
- 参数:
  - `page`: 页码，从1开始，默认1
  - `pageSize`: 每页条数，默认10
- 响应格式同获取文章评论列表

## 用户相关接口 (/src/api/user.js)

### 获取用户信息

- 请求: `GET /api/user/{id}`
- 响应:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "id": 1,
      "nickname": "用户昵称",
      "avatar": "头像URL",
      "bio": "个人简介",
      "articleCount": 10,  // 文章数
      "followCount": 20,   // 关注数
      "fansCount": 30,     // 粉丝数
      "isFollowed": false  // 当前用户是否已关注该用户
    }
  }
  ```

### 关注/取消关注用户

- 关注请求: `POST /api/user/follow/{id}`
- 取消关注: `DELETE /api/user/follow/{id}`
- 响应:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": null
  }
  ```

## 认证相关接口 (/src/api/auth.js)

### 用户注册

- 请求: `POST /api/auth/register`
- 请求体:
  ```json
  {
    "email": "user@example.com",
    "password": "password",
    "nickname": "用户昵称",
    "code": "123456"  // 邮箱验证码
  }
  ```
- 响应:
  ```json
  {
    "code": 200,
    "message": "注册成功",
    "data": {
      "token": "jwt_token",
      "userInfo": {
        "id": 1,
        "nickname": "用户昵称",
        "avatar": "头像URL"
      }
    }
  }
  ```

### 用户登录

- 请求: `POST /api/auth/login`
- 请求体:
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```
- 响应:
  ```json
  {
    "code": 200,
    "message": "登录成功",
    "data": {
      "token": "jwt_token",
      "userInfo": {
        "id": 1,
        "nickname": "用户昵称",
        "avatar": "头像URL"
      }
    }
  }
  ```

### 发送邮箱验证码

- 请求: `POST /api/auth/send-email-code?email=user@example.com`
- 响应:
  ```json
  {
    "code": 200,
    "message": "验证码已发送",
    "data": null
  }
  ```

### 重置密码

- 请求: `POST /api/auth/reset-password`
- 请求体:
  ```json
  {
    "email": "user@example.com",
    "newPassword": "new_password",
    "code": "123456"  // 邮箱验证码
  }
  ```
- 响应:
  ```json
  {
    "code": 200,
    "message": "密码重置成功",
    "data": null
  }
  ``` 