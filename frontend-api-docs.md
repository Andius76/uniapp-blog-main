# API 接口文档

## 用户认证相关接口

### 1. 发送邮箱验证码

**接口说明：** 用于注册、找回密码等场景发送邮箱验证码

- **请求URL：** `/api/auth/send-email-code`
- **请求方式：** POST
- **请求参数：**

| 参数名 | 类型   | 必选 | 说明     |
|--------|--------|------|----------|
| email  | string | 是   | 邮箱地址 |

- **响应参数：**

| 参数名  | 类型   | 说明     |
|---------|--------|----------|
| code    | number | 状态码   |
| message | string | 提示信息 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "验证码发送成功"
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 400    | 参数错误（邮箱格式不正确等）   |
| 429    | 请求过于频繁，请稍后再试       |
| 500    | 服务器错误                     |

- **其他说明：**
  - 验证码有效期为10分钟
  - 同一邮箱地址60秒内只能发送一次验证码
  - 验证码为6位数字
  - **✅ 当前状态：已实现**

### 2. 用户注册

**接口说明：** 新用户注册接口

- **请求URL：** `/api/auth/register`
- **请求方式：** POST
- **请求参数：**

| 参数名     | 类型   | 必选 | 说明          |
|------------|--------|------|---------------|
| email      | string | 是   | 邮箱地址      |
| email_code | string | 是   | 邮箱验证码    |
| password   | string | 是   | 密码          |

- **响应参数：**

| 参数名  | 类型   | 说明     |
|---------|--------|----------|
| code    | number | 状态码   |
| message | string | 提示信息 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "注册成功"
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 400    | 参数错误或验证码错误           |
| 409    | 邮箱已被注册                   |
| 500    | 服务器错误                     |

- **其他说明：**
  - 密码长度至少6位
  - 邮箱格式必须符合标准邮箱格式
  - 验证码必须是6位数字
  - 验证码有效期为10分钟
  - **✅ 当前状态：已实现**

### 3. 用户登录

**接口说明：** 用户登录接口

- **请求URL：** `/api/auth/login`
- **请求方式：** POST
- **请求参数：**

| 参数名   | 类型    | 必选 | 说明                |
|----------|---------|------|---------------------|
| email    | string  | 是   | 用户邮箱            |
| password | string  | 是   | 用户密码            |
| remember | boolean | 否   | 是否保持登录状态    |

- **响应参数：**

| 参数名  | 类型   | 说明                                |
|---------|--------|-------------------------------------|
| code    | number | 状态码                              |
| message | string | 提示信息                            |
| data    | object | 返回的数据，包含token和用户基本信息 |

- **data对象结构：**

| 参数名 | 类型   | 说明                 |
|--------|--------|----------------------|
| token  | string | 用户身份令牌         |
| user   | object | 用户基本信息         |

- **user对象结构：**

| 参数名      | 类型    | 说明               |
|-------------|---------|-------------------|
| id          | number  | 用户ID            |
| email       | string  | 用户邮箱          |
| nickname    | string  | 用户昵称          |
| avatar      | string  | 用户头像URL       |

- **响应示例：**

```json
{
    "code": 200,
    "message": "登录成功",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "email": "user@example.com",
            "nickname": "示例用户",
            "avatar": "https://example.com/avatars/default.png"
        }
    }
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 400    | 参数错误                       |
| 401    | 账号或密码错误                 |
| 403    | 账号已被禁用                   |
| 500    | 服务器错误                     |

- **其他说明：**
  - token使用JWT格式，需要在后续请求的header中添加：`Authorization: Bearer {token}`
  - remember为true时，token有效期为30天；为false时，token有效期为24小时
  - 前端在登录成功后会将user信息存储在本地，格式为：`uni.setStorageSync('userInfo', res.data.user)`
  - 个人页面初始加载时会优先使用本地存储的用户信息进行显示，然后再通过API获取完整信息
  - 若接口调用失败，前端会使用本地存储的信息作为降级处理
  - 注意：后端返回的字段为`fansCount`，前端使用`followerCount`，需要在代码中进行适配
  - **✅ 当前状态：已实现**

### 4. 重置密码

**接口说明：** 通过邮箱验证码找回密码

- **请求URL：** `/api/auth/reset-password`
- **请求方式：** POST
- **请求参数：**

| 参数名       | 类型   | 必选 | 说明               |
|--------------|--------|------|-------------------|
| email        | string | 是   | 用户邮箱          |
| email_code   | string | 是   | 邮箱验证码        |
| new_password | string | 是   | 新密码            |

- **响应参数：**

| 参数名  | 类型   | 说明     |
|---------|--------|----------|
| code    | number | 状态码   |
| message | string | 提示信息 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "密码重置成功"
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 400    | 参数错误或验证码错误           |
| 404    | 用户不存在                     |
| 409    | 新密码与原密码相同             |
| 500    | 服务器错误                     |

- **其他说明：**
  - 新密码长度至少6位
  - 系统会验证新密码与原密码是否相同，不允许设置为相同的密码
  - 验证码通过"发送邮箱验证码"接口获取
  - 验证码有效期为10分钟
  - **✅ 当前状态：已实现**

## 图片处理与路径优化

### 1. 图片URL处理策略

**说明：** 前端对各类图片URL的处理逻辑，确保在不同情况下都能正确显示图片。

- **处理策略：**

  | URL类型 | 示例 | 处理方式 |
  |---------|------|----------|
  | 完整URL | http://example.com/image.jpg | 直接使用，同时修复可能存在的双斜杠问题 |
  | 静态资源 | /static/images/default.png | 直接使用，无需处理 |
  | 相对路径(带/) | /uploads/avatars/user.jpg | 添加基础URL前缀 |
  | 相对路径(不带/) | uploads/image.jpg | 添加基础URL前缀，并添加/ |
  | 空值或无效值 | null, undefined, "null", "undefined" | 返回空字符串或使用默认图片 |

- **处理函数：**

  ```js
  const formatImageUrl = (url) => {
    if (!url) return '';
    
    // 移除URL中可能存在的多余空格
    url = url.trim();
    
    // 确保不是null或undefined
    if (url === 'null' || url === 'undefined') {
      return '';
    }
    
    // 完整URL处理：如果已经是完整URL（包含http）则不处理
    if (url.startsWith('http')) {
      // 检查并修复双斜杠问题
      if (url.includes('//uploads')) {
        url = url.replace('//uploads', '/uploads');
      }
      return url;
    }
    // 静态资源处理：如果是静态资源路径则不处理
    else if (url.startsWith('/static')) {
      return url;
    }
    // 其他情况：添加基础URL前缀
    else {
      if (url.startsWith('/')) {
        return getBaseUrl() + url;
      } else {
        return getBaseUrl() + '/' + url;
      }
    }
  };
  ```

- **应用场景：**
  - 文章封面图片
  - 文章内容图片
  - 用户头像
  - 评论图片
  - 标签图标等

### 2. 图片错误处理机制

**说明：** 针对图片加载失败情况的处理策略，确保UI不会因图片加载失败而出现空白区域。

- **错误处理优先级：**
  1. URL修复（如修复localhost域名问题）
  2. 替代图片（如使用文章中的其他图片）
  3. 默认图片（兜底方案）

- **实现方式：**
  ```js
  // 图片元素添加错误处理事件
  <image :src="formattedImageUrl" @error="handleImageError" />
  
  // 处理函数示例（文章封面图片）
  const handleCoverImageError = () => {
    console.error(`封面图片加载失败:`, data.article.coverImage);
    
    // 记录原始URL用于调试
    const originalUrl = data.article.coverImage;
    
    // 尝试修复URL问题（如localhost域名）
    if (data.article.coverImage && data.article.coverImage.includes('http://localhost:8080')) {
      const fixedUrl = data.article.coverImage.replace('http://localhost:8080', getBaseUrl());
      console.log(`尝试修复localhost URL: ${data.article.coverImage} -> ${fixedUrl}`);
      data.article.coverImage = fixedUrl;
      return; // 给修复的URL一次机会
    }
    
    // 尝试使用文章中的其他图片
    if (data.article.images && data.article.images.length > 0) {
      console.log(`尝试使用文章的第一张图片作为封面替代:`, data.article.images[0]);
      data.article.coverImage = formatImageUrl(data.article.images[0]);
    } else {
      // 使用默认图片
      console.log(`使用默认图片作为封面(原URL:${originalUrl})`);
      data.article.coverImage = '/static/images/img1.png';
    }
  };
  ```

- **适用组件：**
  - 文章列表组件（ArticleList）
  - 文章详情页（article-detail）
  - 个人资料页（user-profile）

### 3. 图片显示优化

**说明：** 图片显示相关的视觉优化和加载体验改进。

- **加载体验优化：**
  - 图片加载前显示背景色（#f5f5f5），避免白色闪烁
  - 添加合适的阴影效果，提升层次感
  - 使用object-fit: cover确保图片比例一致
  - 图片容器使用固定宽高比，防止加载时的布局跳动

- **交互优化：**
  - H5环境下添加鼠标悬停效果和点击提示
  - 支持图片预览（点击放大）功能
  - 图片加载失败时有明确的降级显示

- **样式示例：**
  ```css
  .cover-image {
    width: 100%;
    height: 400rpx;
    border-radius: 8rpx;
    object-fit: cover;
    position: relative;
    box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.15); // 增强阴影效果
    background-color: #f5f5f5; // 图片加载前显示的背景色
    
    // H5环境下的增强效果
    // #ifdef H5
    height: 400px;
    border-radius: 8px;
    cursor: pointer; // 鼠标变为手指形状，提示可点击
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.01);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      
      &::after {
        content: '点击查看大图';
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
      }
    }
    // #endif
  }
  ```

### 4. 图片相关API调用说明

- **获取文章详情时的图片处理：**
  - API返回的文章详情中包含`coverImage`字段
  - 前端负责处理该字段，确保URL格式正确
  - 处理逻辑：`const formattedCoverUrl = formatImageUrl(article.coverImage);`

- **图片URL与服务器环境适配：**
  ```js
  /**
   * 获取基础URL
   */
  const getBaseUrl = () => {
    // #ifdef APP-PLUS
    return 'http://10.9.99.181:8080'; // 安卓模拟器访问本机服务器的地址
    // #endif

    // #ifdef H5
    return 'http://localhost:8080';
    // #endif

    // #ifdef MP-WEIXIN
    return 'http://localhost:8080';
    // #endif
  };
  ```

- **最佳实践建议：**
  - 服务端返回完整URL是最佳选择，可减少前端处理逻辑
  - 前端应统一图片URL处理函数，确保处理一致性
  - 图片容器应设置默认宽高和背景色，优化加载体验
  - 建议使用CDN加速图片加载，提升国际化访问体验
  - 应使用WebP等现代图片格式优化加载性能

### 3. 评论头像处理最佳实践

**说明：** 在文章详情页的评论和回复中，需要正确处理用户头像。

- **处理流程：**
  1. 从后端API接收评论数据时，可能存在多种格式的头像数据
  2. 使用`formatImageUrl`函数统一处理头像URL
  3. 为空或无效的头像URL提供默认头像

- **主要函数实现：**
  ```js
  // 处理图片URL，针对头像进行特殊处理
  const formatImageUrl = (url) => {
    // 对于空值或未定义，返回默认头像
    if (!url) return '/static/images/avatar.png';
    
    // 移除URL中可能存在的多余空格
    url = url.trim();
    
    // 确保不是字符串形式的null或undefined
    if (url === 'null' || url === 'undefined') {
      return '/static/images/avatar.png';
    }
    
    // 完整URL处理：如果已经是完整URL（包含http）则不处理
    if (url.startsWith('http')) {
      // 检查并修复双斜杠问题
      if (url.includes('//uploads')) {
        url = url.replace('//uploads', '/uploads');
      }
      return url;
    }
    // 静态资源处理：如果是静态资源路径则不处理
    else if (url.startsWith('/static')) {
      return url;
    }
    // 其他情况：添加基础URL前缀
    else {
      if (url.startsWith('/')) {
        return getBaseUrl() + url;
      } else {
        return getBaseUrl() + '/' + url;
      }
    }
  };
  ```

- **应用场景：**
  - 主评论的用户头像处理：`<image :src="formatImageUrl(comment.avatar)" class="comment-avatar"/>`
  - 回复评论的用户头像处理：`<image :src="formatImageUrl(reply.avatar)" class="reply-avatar"/>`
  - 文章作者头像处理

- **样式最佳实践：**
  ```css
  .comment-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 20rpx;
    flex-shrink: 0;
    background-color: #f0f0f0; /* 添加背景色防止头像加载时的空白 */
    object-fit: cover; /* 确保头像适当裁剪填充 */
    border: 1rpx solid #eee; /* 添加边框使头像更清晰 */
  }
  
  .reply-avatar {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    margin-right: 16rpx;
    flex-shrink: 0;
    background-color: #f0f0f0;
    object-fit: cover;
    border: 1rpx solid #eee;
  }
  ```

## 用户资料管理相关接口

### 1. 获取用户个人信息

**接口说明：** 获取当前登录用户的个人资料信息

- **请求URL：** `/api/user/info`
- **请求方式：** GET
- **请求参数：** 无

- **响应参数：**

| 参数名  | 类型   | 说明     |
|---------|--------|----------|
| code    | number | 状态码   |
| message | string | 提示信息 |
| data    | object | 用户信息 |

- **data对象结构：**

| 参数名         | 类型   | 说明                  |
|----------------|--------|---------------------|
| id             | number | 用户ID              |
| email          | string | 用户邮箱            |
| nickname       | string | 用户昵称            |
| avatar         | string | 用户头像URL         |
| bio            | string | 个人简介            |
| followCount    | number | 关注数量            |
| fansCount      | number | 粉丝数量            |
| articleCount   | number | 文章数量            |
| createTime     | string | 注册时间            |

- **响应示例：**

```json
{
    "code": 200,
    "message": "操作成功",
    "data": {
        "id": 1,
        "email": "user@example.com",
        "nickname": "示例用户",
        "avatar": "https://example.com/avatars/default.jpg",
        "bio": "这是我的个人简介",
        "followCount": 10,
        "fansCount": 5,
        "articleCount": 8,
        "createTime": "2023-05-01 12:00:00"
    }
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 401    | 未登录或token无效              |
| 500    | 服务器错误                     |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 用于个人主页信息展示
  - 前端"我的"页面会先使用本地存储的基本用户信息（来自登录响应），然后调用此接口获取完整用户信息
  - 若接口调用失败，前端会使用本地存储的信息作为降级处理
  - 注意：后端返回的字段为`fansCount`，前端使用`followerCount`，需要在代码中进行适配
  - **✅ 当前状态：已实现**

### 2. 更新用户个人资料

**接口说明：** 更新当前登录用户的个人资料

- **请求URL：** `/api/user/profile`
- **请求方式：** PUT
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明       |
|----------|--------|------|------------|
| nickname | string | 否   | 用户昵称   |
| bio      | string | 否   | 个人简介   |

- **响应参数：**

| 参数名  | 类型   | 说明                 |
|---------|--------|----------------------|
| code    | number | 状态码               |
| message | string | 提示信息             |
| data    | object | 更新后的用户信息     |

- **data对象结构：**

| 参数名    | 类型   | 说明             |
|-----------|--------|------------------|
| nickname  | string | 更新后的用户昵称 |
| bio       | string | 更新后的个人简介 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "个人资料更新成功",
    "data": {
        "nickname": "新昵称",
        "bio": "这是更新后的个人简介"
    }
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 400    | 参数错误                       |
| 401    | 未登录或token无效              |
| 500    | 服务器错误                     |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 可以只更新昵称或者只更新个人简介，不需要同时提供
  - 昵称长度限制：2-20个字符
  - 个人简介长度限制：0-200个字符
  - **✅ 当前状态：已实现**

### 3. 上传用户头像

**接口说明：** 上传或更新当前登录用户的头像

- **请求URL：** `/api/user/avatar`
- **请求方式：** POST
- **请求类型：** multipart/form-data
- **请求参数：**

| 参数名 | 类型 | 必选 | 说明     |
|--------|------|------|----------|
| avatar | file | 是   | 头像文件 |

- **响应参数：**

| 参数名  | 类型   | 说明             |
|---------|--------|------------------|
| code    | number | 状态码           |
| message | string | 提示信息         |
| data    | object | 上传成功后的信息 |

- **data对象结构：**

| 参数名    | 类型   | 说明                 |
|-----------|--------|----------------------|
| avatarUrl | string | 头像的访问URL        |

- **响应示例：**

```json
{
    "code": 200,
    "message": "头像上传成功",
    "data": {
        "avatarUrl": "https://example.com/avatars/user_1.jpg"
    }
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 400    | 文件格式不支持或文件过大       |
| 401    | 未登录或token无效              |
| 500    | 服务器错误                     |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 支持的文件格式：jpg、jpeg、png、gif
  - 文件大小限制：2MB
  - 上传成功后会自动裁剪和压缩图片
  - 旧头像会被自动删除
  - **✅ 当前状态：已实现**

### 4. 获取用户关注列表

**接口说明：** 获取当前登录用户的关注列表

- **请求URL：** `/api/user/follows`
- **请求方式：** GET
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明                              |
|----------|--------|------|-----------------------------------|
| page     | number | 否   | 页码，默认1                       |
| pageSize | number | 否   | 每页条数，默认10，最大50          |
| keyword  | string | 否   | 搜索关键词，用于按昵称搜索关注的用户 |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 分页数据     |

- **data对象结构：**

| 参数名      | 类型    | 说明               |
|-------------|---------|-------------------|
| total       | number  | 总记录数          |
| pages       | number  | 总页数            |
| list        | array   | 关注用户列表      |

- **list数组元素结构：**

| 参数名        | 类型    | 说明              |
|---------------|---------|------------------|
| id            | number  | 用户ID           |
| nickname      | string  | 用户昵称         |
| avatar        | string  | 用户头像URL      |
| bio           | string  | 用户个人简介     |
| isFollowedByMe | boolean | 当前登录用户是否关注此用户 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 15,
        "pages": 2,
        "list": [
            {
                "id": 2,
                "nickname": "用户昵称",
                "avatar": "user_2_avatar.jpg",
                "bio": "这是个人简介",
                "isFollowedByMe": true
            },
            // 更多用户...
        ]
    }
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 401    | 未登录或token无效              |
| 500    | 服务器错误                     |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 返回的avatar字段可能存在三种形式：
    1. 仅文件名，如：`user_2_avatar.jpg`
    2. 完整相对路径，如：`/uploads/avatars/user_2_avatar.jpg`
    3. 完整URL，如：`http://example.com/uploads/avatars/user_2_avatar.jpg`
  - 前端需要根据不同情况处理头像URL，确保正确显示
  - 支持通过keyword参数搜索用户昵称
  - 可配合关注/取消关注接口实现关注管理
  - **✅ 当前状态：已实现**

### 5. 关注用户

**接口说明：** 关注指定用户

- **请求URL：** `/api/user/follow/{userId}`
- **请求方式：** POST
- **请求参数：**

| 参数名 | 类型   | 必选 | 说明                    |
|--------|--------|------|------------------------|
| userId | number | 是   | 要关注的用户ID，包含在URL路径中 |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "关注成功"
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 400    | 不能关注自己                   |
| 401    | 未登录或token无效              |
| 404    | 用户不存在                     |
| 409    | 已经关注过该用户               |
| 500    | 服务器错误                     |

- **✅ 当前状态：已实现**

### 6. 取消关注用户

**接口说明：** 取消关注指定用户

- **请求URL：** `/api/user/follow/{userId}`
- **请求方式：** DELETE 
- **请求参数：**

| 参数名 | 类型   | 必选 | 说明                    |
|--------|--------|------|------------------------|
| userId | number | 是   | 要取消关注的用户ID，包含在URL路径中 |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "已取消关注"
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 401    | 未登录或token无效              |
| 404    | 用户不存在或未关注该用户       |
| 500    | 服务器错误                     |

- **✅ 当前状态：已实现**

### 7. 获取用户粉丝列表

**接口说明：** 获取当前登录用户的粉丝列表

- **请求URL：** `/api/user/fans`
- **请求方式：** GET
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明                              |
|----------|--------|------|-----------------------------------|
| page     | number | 否   | 页码，默认1                       |
| pageSize | number | 否   | 每页条数，默认10，最大50          |
| keyword  | string | 否   | 搜索关键词，用于按昵称搜索粉丝用户 |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 分页数据     |

- **data对象结构：**

| 参数名      | 类型    | 说明               |
|-------------|---------|-------------------|
| total       | number  | 总记录数          |
| pages       | number  | 总页数            |
| list        | array   | 粉丝用户列表      |

- **list数组元素结构：**

| 参数名        | 类型    | 说明              |
|---------------|---------|------------------|
| id            | number  | 用户ID           |
| nickname      | string  | 用户昵称         |
| avatar        | string  | 用户头像URL      |
| bio           | string  | 用户个人简介     |
| isFollowed    | boolean | 当前用户是否已关注此用户 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 15,
        "pages": 2,
        "list": [
            {
                "id": 2,
                "nickname": "用户昵称",
                "avatar": "user_2_avatar.jpg",
                "bio": "这是个人简介",
                "isFollowed": true
            },
            // 更多用户...
        ]
    }
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 401    | 未登录或token无效              |
| 500    | 服务器错误                     |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 返回的avatar字段可能存在三种形式：
    1. 仅文件名，如：`user_2_avatar.jpg`
    2. 完整相对路径，如：`/uploads/avatars/user_2_avatar.jpg`
    3. 完整URL，如：`http://example.com/uploads/avatars/user_2_avatar.jpg`
  - 前端需要根据不同情况处理头像URL，确保正确显示
  - 支持通过keyword参数搜索用户昵称
  - 可配合关注/取消关注接口实现粉丝管理
  - **✅ 当前状态：已实现**

### 8. 获取用户资料

**接口说明：** 获取指定用户的详细资料

- **请求URL：** `/api/user/profile/{userId}`
- **请求方式：** GET
- **请求参数：**

| 参数名 | 类型   | 必选 | 说明                    |
|--------|--------|------|------------------------|
| userId | number | 是   | 用户ID，包含在URL路径中 |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 用户资料     |

- **data对象结构：**

| 参数名         | 类型    | 说明                          |
|---------------|---------|------------------------------|
| id            | number  | 用户ID                       |
| nickname      | string  | 用户昵称                     |
| avatar        | string  | 用户头像URL                  |
| bio           | string  | 个人简介                     |
| postCount     | number  | 发表的文章数量               |
| followCount   | number  | 关注数量                     |
| followerCount | number  | 粉丝数量                     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 1,
        "nickname": "示例用户",
        "avatar": "/uploads/avatars/user_1_1746006650938.jpg",
        "bio": "这是我的个人简介",
        "postCount": 10,
        "followCount": 20,
        "followerCount": 30
    }
}
```

- **错误码说明：**

| 错误码 | 说明           |
|--------|--------------|
| 200    | 请求成功     |
| 404    | 用户不存在   |
| 500    | 服务器错误   |

- **其他说明：**
  - avatar可能返回完整路径（以/uploads开头）或仅文件名
  - 前端需要处理avatar字段，确保显示完整URL
  - **✅ 当前状态：已实现**

### 9. 获取用户文章列表

**接口说明：** 获取指定用户发表或点赞的文章列表

- **请求URL：** `/api/user/{userId}/articles`
- **请求方式：** GET
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明                                    |
|----------|--------|------|----------------------------------------|
| userId   | number | 是   | 用户ID，包含在URL路径中                 |
| type     | string | 是   | 文章类型：posts(发表的) / likes(点赞的) |
| page     | number | 否   | 页码，默认1                             |
| pageSize | number | 否   | 每页条数，默认10                        |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 分页数据     |

- **data对象结构：**

| 参数名      | 类型    | 说明               |
|-------------|---------|-------------------|
| total       | number  | 总记录数          |
| list        | array   | 文章列表          |

- **list数组元素结构：**

| 参数名        | 类型    | 说明              |
|---------------|---------|------------------|
| id            | number  | 文章ID           |
| title         | string  | 文章标题         |
| summary       | string  | 文章摘要         |
| createTime    | string  | 发布时间         |
| viewCount     | number  | 浏览量           |
| likeCount     | number  | 点赞量           |
| commentCount  | number  | 评论量           |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 20,
        "list": [
            {
                "id": 1,
                "title": "文章标题",
                "summary": "文章摘要...",
                "createTime": "2024-03-20 10:00:00",
                "viewCount": 100,
                "likeCount": 50,
                "commentCount": 30
            }
        ]
    }
}
```

- **⚠️ 当前状态：已实现**

### 10. 检查是否关注用户

**接口说明：** 检查当前登录用户是否关注了指定用户

- **请求URL：** `/api/user/check-follow/{userId}`
- **请求方式：** GET
- **请求参数：**

| 参数名 | 类型   | 必选 | 说明                    |
|--------|--------|------|------------------------|
| userId | number | 是   | 要检查的用户ID，包含在URL路径中 |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 关注状态信息 |

- **data对象结构：**

| 参数名    | 类型    | 说明         |
|-----------|---------|--------------|
| following | boolean | 是否已关注该用户 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "following": true
    }
}
```

- **错误码说明：**

| 错误码 | 说明           |
|--------|--------------|
| 200    | 请求成功     |
| 401    | 未登录或token无效 |
| 404    | 用户不存在   |
| 500    | 服务器错误   |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 用于用户资料页面加载时检查关注状态
  - 如果用户未登录，返回401错误
  - 如果检查的是当前登录用户自己，将返回`following: false`（不能关注自己）
  - **✅ 当前状态：已实现**

### 11. 搜索文章

**接口说明：** 根据关键词搜索文章，支持按标题、作者昵称、标签进行模糊匹配

- **请求URL：** `/api/article/search`
- **请求方式：** GET
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明                              |
|----------|--------|------|-----------------------------------|
| keyword  | string | 是   | 搜索关键词                        |
| page     | number | 否   | 页码，默认1                       |
| pageSize | number | 否   | 每页条数，默认10，最大50          |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 分页数据     |

- **data对象结构：**

| 参数名      | 类型    | 说明               |
|-------------|---------|-------------------|
| total       | number  | 总记录数          |
| pages       | number  | 总页数            |
| list        | array   | 文章列表          |

- **list数组元素结构：**

| 参数名         | 类型             | 说明                 |
|----------------|------------------|---------------------|
| id             | number           | 文章ID              |
| title          | string           | 文章标题            |
| summary        | string           | 文章摘要            |
| content        | string           | 文章内容（纯文本）  |
| coverImage     | string           | 封面图片URL         |
| tags           | Array\<string\>  | 文章标签            |
| viewCount      | number           | 浏览量              |
| likeCount      | number           | 点赞数              |
| commentCount   | number           | 评论数              |
| collectCount   | number           | 收藏数              |
| isLiked        | boolean          | 当前用户是否已点赞   |
| isCollected    | boolean          | 当前用户是否已收藏   |
| author         | object           | 作者信息对象         |

- **author对象结构：**

| 参数名      | 类型    | 说明              |
|-------------|---------|------------------|
| id          | number  | 用户ID           |
| nickname    | string  | 用户昵称         |
| avatar      | string  | 用户头像URL      |
| isFollowed  | boolean | 当前用户是否已关注此用户 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 25,
        "pages": 3,
        "list": [
            {
                "id": 1001,
                "title": "Vue3学习笔记",
                "summary": "这是一篇关于Vue3的学习笔记...",
                "coverImage": "https://example.com/uploads/articles/cover_1001.jpg",
                "tags": ["Vue", "前端"],
                "viewCount": 120,
                "likeCount": 30,
                "commentCount": 15,
                "collectCount": 25,
                "isLiked": false,
                "isCollected": true,
                "author": {
                    "id": 101,
                    "nickname": "前端大神",
                    "avatar": "https://example.com/uploads/avatars/user_101.jpg",
                    "isFollowed": false
                }
            }
        ]
    }
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 400    | 参数错误                |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口支持未登录状态访问，但未登录时isLiked, isCollected, isFollowed字段均为false
  - 关键词会自动对标题、作者昵称和标签进行模糊匹配
  - 搜索结果按相关度和发布时间排序
  - 如果搜索结果为空，返回空列表而非错误
  - 在首页搜索框中输入关键词并点击搜索按钮，会直接在首页显示搜索结果
  - **✅ 后端状态：已实现**
  - **✅ 前端状态：已实现**

## 首页搜索功能

### 搜索实现逻辑

**功能说明：** 首页搜索功能允许用户直接在首页搜索文章，并在当前页面展示结果

1. **搜索入口：**
   - 首页顶部搜索框，支持输入关键词
   - 可通过点击搜索按钮或按回车键触发搜索

2. **实现方式：**
   - 搜索时调用`searchArticles` API
   - 搜索结果直接显示在首页文章列表区域
   - 搜索状态时导航菜单不选中任何标签
   - 显示搜索结果数量和搜索关键词
   - 提供"清除搜索"按钮，点击后返回推荐列表

3. **交互优化：**
   - 搜索过程显示加载提示
   - 无搜索结果时显示友好提示并自动返回推荐列表
   - 支持搜索结果的分页加载（下拉刷新和上拉加载更多）
   - 搜索模式下支持点赞、收藏等常规操作
   - 清除搜索后自动恢复导航菜单选中状态

4. **代码实现示例：**
   ```js
   // 搜索处理
   const handleSearch = () => {
     if (!searchText) return;
     
     // 设置搜索模式
     currentNav = -1;
     
     // 调用搜索API
     searchArticles(searchText, {page: 1, pageSize: 10})
       .then(res => {
         if (res.code === 200) {
           articleList = processSearchResults(res.data.list);
         }
       });
   };
   ```

5. **样式调整：**
   - 搜索状态下添加搜索结果信息条
   - 清除搜索按钮添加悬停和点击效果
   - 搜索结果为空时提供明确反馈

6. **数据处理：**
   - 搜索结果经过统一的数据处理逻辑，确保头像、封面图等格式一致
   - 保持与常规文章列表相同的交互行为
   - 搜索模式下同样支持数据刷新和状态同步
   - **✅ 当前状态：已实现**

## 功能说明

### 用户资料展示页面

1. 页面功能：
   - 显示用户基本信息（头像、昵称、个人简介）
   - 显示用户统计信息（发表数、关注数、粉丝数）
   - 支持关注/取消关注功能
   - 支持点击头像查看大图
   - 自适应布局，适合各种屏幕尺寸
   - 个人简介区域显示"个人简介："标签，文本自动换行

2. 数据处理：
   - 页面加载时通过 `/api/user/profile/{userId}` 获取用户资料
   - 使用 `/api/user/check-follow/{userId}` 检查关注状态
   - 头像URL处理支持多种格式：
     - 空值返回默认头像
     - http(s)链接直接使用
     - /uploads开头的完整相对路径
     - 仅文件名的情况
   - 统计数据（发表数、关注数、粉丝数）自动显示
   - 后端返回的 `followerCount` 用于显示粉丝数

3. 样式说明：
   - 个人简介区域宽度自适应（最大宽度100%）
   - 添加了合适的行高（line-height: 1.4）
   - 支持长文本自动换行（word-wrap: break-word）
   - 兼容APP、微信小程序和H5三个平台

4. 实现细节：
   - 使用 box-sizing: border-box 确保跨平台一致性
   - 使用 flex 布局实现自适应效果
   - 头像使用 flex-shrink: 0 防止缩小
   - 使用条件编译确保在不同平台显示一致
   - **✅ 当前状态：已实现**

### 关注列表页面

1. 页面功能：
   - 显示当前用户的关注列表
   - 支持搜索关注的用户（按昵称）
   - 支持下拉刷新和上拉加载更多
   - 可关注/取消关注列表中的用户
   - 点击用户可跳转到其个人资料页

2. 数据处理：
   - 通过 `/api/user/follows` 接口获取关注列表
   - 支持分页加载（pageSize默认10）
   - 关注/取消关注功能通过 `/api/user/follow/{userId}` 接口实现
   - 取消关注时会显示确认对话框
   - 头像URL处理支持三种格式：
     - 空值返回默认头像 `/static/images/avatar.png`
     - http(s)链接直接使用
     - /uploads开头的完整相对路径，拼接baseURL
     - 仅文件名的情况，拼接完整路径`${baseURL}/uploads/avatars/${avatar}`

3. 样式说明：
   - 列表项高度固定为160rpx，确保一致的视觉效果
   - 个人简介文本超出显示省略号（单行显示）
   - 个人简介最大宽度为420rpx
   - 按钮使用flex-shrink: 0确保不被挤压

4. 交互优化：
   - 关注/取消关注按钮添加loading状态
   - 操作成功和失败都有明确的Toast提示
   - 搜索、刷新、加载更多功能无缝配合
   - 无关注用户时显示空状态提示并提供"去发现更多"按钮
   - 下拉刷新时确保刷新区域背景色与页面背景一致
   - 在H5环境下支持新窗口打开用户资料页
   - 从关注列表返回"我的"页面时，自动刷新关注数据

5. 搜索功能实现：
   - 支持按用户昵称进行实时搜索和回车键确认搜索
   - 搜索使用后端API的keyword参数：`/api/user/follows?keyword=xxx`
   - 搜索输入添加防抖处理（300ms），避免频繁请求
   - 搜索过程中显示Loading状态提示"搜索中..."
   - 搜索结果会清空当前列表并重置分页，显示匹配的关注用户
   - 搜索成功后会显示结果数量提示（例如"找到3位相关用户"）
   - 无搜索结果时显示专门的空状态提示和清除搜索按钮
   - 搜索输入框提供一键清除功能，清除后自动恢复完整关注列表
   - 搜索结果支持继续上拉加载更多（保持与普通列表一致的加载逻辑）
   - 适当处理搜索过程中可能出现的错误情况，包括后端409错误（已关注过该用户）
   - **✅ 当前状态：已实现**

### 关注状态刷新机制

1. 功能说明：
   - 在"我的"页面添加关注数量自动刷新机制
   - 关注/取消关注操作后，返回"我的"页面自动更新关注数量
   - 在用户资料页面添加关注/取消关注功能
   - 支持页面间数据同步，确保关注状态一致性

2. 实现方式：
   - 在my.vue的onShow生命周期中添加refreshUserInfo方法
   - 使用节流控制避免短时间内多次刷新
   - 静默刷新用户信息，无需显示loading状态
   - 在user-profile.vue中添加关注按钮和关注状态检查
   - 使用checkUserFollow API检查关注状态
   - 提供关注状态检查的降级方案，兼容后端API尚未实现的情况

3. 交互优化：
   - 关注/取消关注操作添加确认对话框
   - 关注/取消关注过程中显示loading状态
   - 操作成功后显示明确的反馈提示
   - 取消关注时显示确认对话框，避免误操作
   - 在关注列表中取消关注后，自动从列表中移除用户
   - **✅ 当前状态：已实现**

### 文章发布页面

1. 页面功能：
   - 支持富文本编辑，包括文本格式化（加粗、斜体、下划线、标题等）
   - 支持添加标题和正文内容，自动统计字数
   - 提供编辑和预览两种模式切换
   - 支持添加文章标签（最多5个）
   - 支持上传文章封面图片
   - 支持在正文中插入多张图片（最多20张）
   - 支持发布新文章和编辑已有文章
   - 离开页面时的内容保存提示
   - 支持无图片文章的直接提交功能
   - 提供自动保存草稿功能，防止内容丢失

2. 数据处理：
   - 自动处理图片上传，支持本地图片到服务器URL的转换
   - 图片处理支持大小限制（最大5MB）和格式检查
   - 封面图片比例检查，建议使用16:9比例
   - 自动从HTML内容中提取图片路径，构建完整的发布请求
   - 支持标题长度限制（最多50个字符）和内容长度检查
   - 支持粘贴图片直接插入到编辑器
   - 发布成功后自动跳转到文章详情页
   - 统一API基础URL配置，确保所有请求使用同一端口
   - 自动处理DOM相关错误，提高跨平台兼容性

3. 编辑器特性：
   - 支持自适应高度，根据内容自动调整
   - 固定底部工具栏，确保工具随时可用
   - 预览模式下提供完整的文章预览效果，支持长文章滚动显示
   - 图片宽度固定为100%，确保在所有设备上显示一致
   - 支持图片删除和重新上传
   - 支持添加和管理自定义标签
   - 支持富文本内容格式的保存和恢复
   - 优化编辑器高度计算，更好地适应各种内容长度

4. 用户体验优化：
   - 表单验证提示，确保内容完整性
   - 图片上传状态提示和进度反馈
   - 编辑/预览模式无缝切换
   - 发布前确认对话框
   - 退出编辑的确认提示，防止误操作丢失内容
   - 工具栏简洁明了，提供基本的编辑功能
   - 预览模式下展示真实的文章效果
   - 自动保存草稿（每分钟）和退出时草稿保存提示
   - 应用启动时自动检测并提示加载草稿内容
   - 添加条件编译指令处理不同平台DOM操作兼容性

5. 草稿功能实现：
   - 自动检测未发布的草稿内容并提示恢复
   - 定时自动保存（每60秒保存一次）
   - 保存内容包括标题、正文、HTML格式、标签和封面图片
   - 支持24小时内草稿有效期限制，过期自动清理
   - 用户可选择恢复草稿或放弃旧草稿
   - 文章成功发布后自动清理草稿数据
   - **✅ 当前状态：已实现**

## 文章管理相关接口

### 1. 发布文章

**接口说明：** 发布新文章

- **请求URL：** `/api/article`
- **请求方式：** POST
- **请求参数：**

| 参数名      | 类型            | 必选 | 说明                 |
|-------------|-----------------|------|---------------------|
| title       | string          | 是   | 文章标题            |
| content     | string          | 是   | 文章纯文本内容      |
| htmlContent | string          | 是   | 文章HTML格式内容    |
| tags        | Array\<string\> | 否   | 文章标签数组        |
| coverImage  | string          | 否   | 文章封面图片URL     |

- **响应参数：**

| 参数名  | 类型   | 说明               |
|---------|--------|-------------------|
| code    | number | 状态码            |
| message | string | 提示信息          |
| data    | object | 返回的数据        |

- **data对象结构：**

| 参数名 | 类型   | 说明        |
|--------|--------|------------|
| id     | number | 新发布文章的ID |

- **响应示例：**

```json
{
    "code": 200,
    "message": "文章发布成功",
    "data": {
        "id": 1001
    }
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 400    | 参数错误                |
| 401    | 未登录或token无效       |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 文章标题长度限制：2-100个字符
  - 文章内容不能为空
  - tags为可选参数，如提供则为字符串数组，每个标签最长20个字符
  - coverImage为封面图片URL，支持用户专门上传的封面图片
  - 前端会自动处理图片上传，包括从本地路径转换为服务器URL
  - **✅ 当前状态：已实现**

### 2. 更新文章

**接口说明：** 更新现有文章

- **请求URL：** `/api/article/{articleId}`
- **请求方式：** PUT
- **请求参数：**

| 参数名      | 类型            | 必选 | 说明                 |
|-------------|-----------------|------|---------------------|
| articleId   | number          | 是   | 文章ID (URL路径参数) |
| title       | string          | 是   | 文章标题            |
| content     | string          | 是   | 文章纯文本内容      |
| htmlContent | string          | 是   | 文章HTML格式内容    |
| tags        | Array\<string\> | 否   | 文章标签数组        |
| coverImage  | string          | 否   | 文章封面图片URL     |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "文章更新成功"
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 400    | 参数错误                |
| 401    | 未登录或token无效       |
| 403    | 无权限修改此文章        |
| 404    | 文章不存在              |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 用户只能更新自己发布的文章
  - 其他参数要求同发布文章接口
  - **✅ 当前状态：已实现**

### 2.1 文章编辑流程

**功能说明：** 前端编辑文章的完整流程及实现细节

1. **流程概述：**
   - 用户点击文章的"编辑"按钮
   - 前端发送GET请求获取完整文章内容
   - 跳转到发布页面（编辑模式）
   - 用户编辑内容
   - 用户点击"保存"按钮
   - 前端发送PUT请求更新文章内容

2. **编辑入口：**
   - 在文章列表或文章详情页提供编辑按钮
   - 编辑按钮仅对文章作者或有权限的用户显示
   - 点击编辑按钮时，调用`handleEditArticle`函数

3. **获取文章详情：**
   - 调用`getArticleDetail(articleId)`获取完整文章内容
   - API路径：`GET /api/article/{articleId}`
   - 确保获取HTML内容和标签等完整信息

4. **编辑页面传参：**
   - 将文章数据编码并传递到发布页面
   ```js
   const articleData = {
     id: article.id,
     title: article.title,
     content: article.content,
     htmlContent: article.htmlContent,
     tags: article.tags,
     coverImage: article.coverImage,
     mode: 'edit' // 标记为编辑模式
   };
   
   uni.navigateTo({
     url: `/pages/publish/publish?mode=edit&articleData=${encodeURIComponent(JSON.stringify(articleData))}`
   });
   ```

5. **发布页面编辑模式：**
   - 发布页面根据`mode=edit`参数判断是新增还是编辑
   - 解析`articleData`参数并填充到编辑器中
   - 编辑模式下显示"更新文章"而非"发布文章"
   - 提供预览功能和表单验证

6. **提交更新：**
   - 用户点击"更新文章"按钮
   - 前端收集表单数据并验证
   - 处理新上传的图片（如果有）
   - 调用`updateArticle`函数发送更新请求
   ```js
   updateArticle({
     id: articleId,
     title: title,
     content: content,
     htmlContent: htmlContent,
     tags: tags,
     coverImage: coverImage
   }).then(res => {
     if (res.code === 200) {
       uni.showToast({ title: '更新成功', icon: 'success' });
       // 跳转到文章详情页或返回上一页
     }
   });
   ```

7. **错误处理：**
   - 获取文章详情失败时提供降级方案
   - 使用可用的简略内容进行编辑
   - 提供友好的错误提示
   - 网络错误时保存草稿，防止内容丢失

8. **权限控制：**
   - 根据`showEditForAllUsers`属性控制编辑权限
   - 可配置为仅文章作者可编辑，或所有已登录用户可编辑
   - 前端通过`isCurrentUser`函数判断当前用户是否为文章作者

9. **安全考虑：**
   - 前端仅提供编辑入口，实际权限由后端控制
   - 所有编辑操作都需要有效的token
   - 后端会验证用户是否有权限编辑指定文章

10. **实现示例：**
    ```js
    /**
     * 处理编辑文章
     * @param {Object} article - 文章对象
     */
    const handleEditArticle = (article) => {
      // 确保用户已登录
      const token = uni.getStorageSync('token');
      if (!token) return;
      
      // 显示加载提示
      uni.showLoading({ title: '准备编辑...' });
      
      // 获取完整文章内容
      getArticleDetail(article.id)
        .then(res => {
          if (res.code === 200) {
            // 准备文章数据并跳转到编辑页面
            const articleData = {
              id: article.id,
              title: article.title,
              content: res.data.content,
              htmlContent: res.data.htmlContent,
              tags: article.tags || [],
              coverImage: article.coverImage
            };
            
            uni.navigateTo({
              url: `/pages/publish/publish?mode=edit&articleData=${encodeURIComponent(JSON.stringify(articleData))}`
            });
          }
        })
        .finally(() => uni.hideLoading());
    };
    ```

- **✅ 当前状态：已实现并优化**

### 3. 上传文章图片

**接口说明：** 上传文章中使用的图片，包括正文图片和封面图片

- **请求URL：** `/api/article/upload-image`
- **请求方式：** POST
- **请求类型：** multipart/form-data
- **请求参数：**

| 参数名 | 类型 | 必选 | 说明     |
|--------|------|------|----------|
| image  | file | 是   | 图片文件 |
| type   | string | 否 | 图片类型：cover(封面图)或content(正文图)，默认为content |
| width  | number | 否 | 原始图片宽度，用于服务器生成缩略图 |
| height | number | 否 | 原始图片高度，用于服务器生成缩略图 |

- **响应参数：**

| 参数名  | 类型   | 说明             |
|---------|--------|------------------|
| code    | number | 状态码           |
| message | string | 提示信息         |
| data    | object | 上传成功后的信息 |

- **data对象结构：**

| 参数名         | 类型   | 说明                 |
|----------------|--------|----------------------|
| imageUrl       | string | 图片的访问URL        |
| thumbnailUrl   | string | 缩略图的访问URL      |
| type           | string | 图片类型：cover或content |
| width          | number | 原始图片宽度         |
| height         | number | 原始图片高度         |

- **响应示例：**

```json
{
    "code": 200,
    "message": "图片上传成功",
    "data": {
        "imageUrl": "http://example.com/uploads/articles/image_1234567890.jpg",
        "thumbnailUrl": "http://example.com/uploads/articles/thumbnails/image_1234567890.jpg",
        "type": "content",
        "width": 1200,
        "height": 800
    }
}
```

- **错误码说明：**

| 错误码 | 说明                           |
|--------|--------------------------------|
| 200    | 成功                           |
| 400    | 文件格式不支持或文件过大       |
| 401    | 未登录或token无效              |
| 500    | 服务器错误                     |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 支持的文件格式：jpg、jpeg、png、gif
  - 文件大小限制：5MB
  - 上传成功后会自动处理和压缩图片
  - 封面图片会进行额外的处理，如裁剪为特定比例（16:9）和尺寸
  - 正文图片会自动生成缩略图，在编辑模式使用缩略图，预览和发布时使用原图
  - thumbnailUrl用于在编辑器中显示缩略图，imageUrl用于实际文章展示
  - 前端会自动处理缩略图与原图的切换逻辑，后端只需提供两个URL
  - 返回的imageUrl和thumbnailUrl均为完整的图片访问URL
  - 图片会被保存在服务器的articles目录下
  - type参数用于区分图片用途，可用于后端不同的处理逻辑
  - width和height参数可用于后端生成合适尺寸的缩略图
  - **✅ 当前状态：已实现**

### 4. 获取文章列表

**接口说明：** 获取文章列表，支持分页、标签筛选和关键词搜索

- **请求URL：** `/api/article`
- **请求方式：** GET
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明                              |
|----------|--------|------|-----------------------------------|
| page     | number | 否   | 页码，默认1                       |
| pageSize | number | 否   | 每页条数，默认10，最大50          |
| tag      | string | 否   | 标签筛选                          |
| keyword  | string | 否   | 关键词搜索，匹配标题和内容        |
| sort     | string | 否   | 排序方式：new(最新)、hot(热门)、recommend(推荐)、following(关注) |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 分页数据     |

- **data对象结构：**

| 参数名      | 类型    | 说明               |
|-------------|---------|-------------------|
| total       | number  | 总记录数          |
| pages       | number  | 总页数            |
| list        | array   | 文章列表          |

- **list数组元素结构：**

| 参数名         | 类型             | 说明                 |
|----------------|------------------|---------------------|
| id             | number           | 文章ID              |
| title          | string           | 文章标题            |
| summary        | string           | 文章摘要            |
| content        | string           | 文章内容（纯文本）  |
| coverImage     | string           | 封面图片URL         |
| tags           | Array\<string\>  | 文章标签            |
| viewCount      | number           | 浏览量              |
| likeCount      | number           | 点赞数              |
| commentCount   | number           | 评论数              |
| userId         | number           | 作者ID (将逐渐废弃, 使用 author.id) |
| nickname       | string           | 作者昵称 (将逐渐废弃, 使用 author.nickname) |
| avatar         | string           | 作者头像 (将逐渐废弃, 使用 author.avatar) |
| author         | object           | 作者信息对象        |
| isLiked        | boolean          | 当前用户是否已点赞该文章 |
| isCollected    | boolean          | 当前用户是否已收藏该文章 |
| createTime     | string           | 创建时间            |
| updateTime     | string           | 更新时间            |

- **author对象结构：**

| 参数名      | 类型    | 说明              |
|-------------|---------|------------------|
| id          | number  | 用户ID           |
| nickname    | string  | 用户昵称         |
| avatar      | string  | 用户头像URL      |
| isFollowed  | boolean | 当前用户是否已关注此作者 |

- **⚠️ 当前状态：已实现 (部分字段如isLiked, isCollected, author.isFollowed 由此变更引入)**

### 5. 获取文章详情

**接口说明：** 获取单篇文章的详细内容

- **请求URL：** `/api/article/{articleId}`
- **请求方式：** GET
- **请求参数：**

| 参数名    | 类型   | 必选 | 说明                    |
|-----------|--------|------|------------------------|
| articleId | number | 是   | 文章ID，包含在URL路径中 |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 文章详情     |

- **data对象结构：**

| 参数名         | 类型             | 说明                          |
|----------------|------------------|------------------------------|
| id             | number           | 文章ID                       |
| title          | string           | 文章标题                     |
| content        | string           | 文章内容（纯文本）           |
| htmlContent    | string           | 文章HTML内容                 |
| coverImage     | string           | 封面图片URL                  |
| images         | Array\<object\>  | 文章图片数组，包含原图和缩略图URL |
| tags           | Array\<string\>  | 文章标签                     |
| viewCount      | number           | 浏览量                       |
| likeCount      | number           | 点赞数                       |
| commentCount   | number           | 评论数                       |
| isLiked        | boolean          | 当前用户是否已点赞该文章      |
| isCollected    | boolean          | 当前用户是否已收藏该文章      |
| userId         | number           | 作者ID (将逐渐废弃, 使用 author.id) |
| nickname       | string           | 作者昵称 (将逐渐废弃, 使用 author.nickname) |
| avatar         | string           | 作者头像 (将逐渐废弃, 使用 author.avatar) |
| author         | object           | 作者信息对象                 |
| createTime     | string           | 创建时间                     |
| updateTime     | string           | 更新时间                     |

- **author对象结构 (补充到data对象结构内联，或作为独立说明)：**

| 参数名      | 类型    | 说明              |
|-------------|---------|------------------|
| id          | number  | 用户ID           |
| nickname    | string  | 用户昵称         |
| avatar      | string  | 用户头像URL      |
| isFollowed  | boolean | 当前用户是否已关注此作者 |

- **images数组元素结构：**

| 参数名       | 类型   | 说明               |
|--------------|--------|-------------------|
| imageUrl     | string | 原始图片URL       |
| thumbnailUrl | string | 缩略图URL         |
| width        | number | 图片原始宽度      |
| height       | number | 图片原始高度      |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": 1001,
        "title": "示例文章标题",
        "content": "这是文章的纯文本内容...",
        "htmlContent": "<p>这是文章的HTML内容...</p><img class='article-content-image' src='https://example.com/uploads/articles/image_1.jpg' />",
        "coverImage": "https://example.com/uploads/articles/cover_1001.jpg",
        "images": [
            {
                "imageUrl": "https://example.com/uploads/articles/image_1.jpg",
                "thumbnailUrl": "https://example.com/uploads/articles/thumbnails/image_1.jpg",
                "width": 1200,
                "height": 800
            }
        ],
        "tags": ["技术", "教程"],
        "viewCount": 120,
        "likeCount": 30,
        "commentCount": 15,
        "isLiked": false,
        "isCollected": true,
        "userId": 1,
        "nickname": "示例用户",
        "avatar": "https://example.com/uploads/avatars/user_1.jpg",
        "isFollowed": false,
        "createTime": "2024-05-01 10:00:00",
        "updateTime": "2024-05-01 10:00:00"
    }
}
```

- **错误码说明：**

| 错误码 | 说明           |
|--------|--------------|
| 200    | 请求成功     |
| 404    | 文章不存在   |
| 500    | 服务器错误   |

- **其他说明：**
  - isLiked、isCollected、isFollowed等字段仅在用户已登录的情况下有意义
  - 未登录用户访问时，这些字段默认为false
  - 访问文章详情会自动增加文章的浏览量
  - htmlContent字段包含完整的富文本格式内容，适合直接在前端富文本组件中展示
  - 获取文章详情失败时提供降级方案
  - **✅ 当前状态：已实现**

### 6. 点赞/取消点赞文章

**接口说明：** 对文章进行点赞或取消点赞操作

- **请求URL：** `/api/article/like/{articleId}`
- **请求方式：** POST (点赞) / DELETE (取消点赞)
- **请求参数：**

| 参数名    | 类型   | 必选 | 说明                     |
|-----------|--------|------|-------------------------|
| articleId | number | 是   | 文章ID，包含在URL路径中  |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 返回数据     |

- **data对象结构：**

| 参数名    | 类型   | 说明           |
|-----------|--------|---------------|
| likeCount | number | 更新后的点赞数 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "点赞成功",
    "data": {
        "likeCount": 31
    }
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 401    | 未登录或token无效       |
| 404    | 文章不存在              |
| 409    | 已点赞或已取消点赞      |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - POST请求表示点赞，DELETE请求表示取消点赞
  - 用户不能重复点赞同一篇文章
  - 点赞/取消点赞操作会实时更新文章的点赞数
  - **⚠️ 当前状态：已实现**

### 7. 收藏/取消收藏文章

**接口说明：** 对文章进行收藏或取消收藏操作

- **请求URL：** `/api/article/collect/{articleId}`
- **请求方式：** POST (收藏) / DELETE (取消收藏)
- **请求参数：**

| 参数名    | 类型   | 必选 | 说明                     |
|-----------|--------|------|-------------------------|
| articleId | number | 是   | 文章ID，包含在URL路径中  |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "收藏成功"
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 401    | 未登录或token无效       |
| 404    | 文章不存在              |
| 409    | 已收藏或已取消收藏      |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - POST请求表示收藏，DELETE请求表示取消收藏
  - 用户不能重复收藏同一篇文章
  - **⚠️ 当前状态：已实现**

### 8. 获取用户收藏的文章列表

**接口说明：** 获取当前登录用户收藏的文章列表

- **请求URL：** `/api/article/collections`
- **请求方式：** GET
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明                     |
|----------|--------|------|--------------------------|
| page     | number | 否   | 页码，默认1             |
| pageSize | number | 否   | 每页条数，默认10，最大50 |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 分页数据     |

- **data对象结构：**

| 参数名 | 类型   | 说明         |
|--------|--------|--------------|
| total  | number | 总记录数     |
| pages  | number | 总页数       |
| list   | array  | 文章列表     |

- **list数组元素结构：** 同文章列表接口

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 401    | 未登录或token无效       |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 返回的是当前登录用户的收藏文章
  - **⚠️ 当前状态：已实现**

### 9. 获取文章标签列表

**接口说明：** 获取系统中所有的文章标签及其对应的文章数量

- **请求URL：** `/api/article/tags`
- **请求方式：** GET
- **请求参数：** 无
- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | array  | 标签列表     |

- **data数组元素结构：**

| 参数名 | 类型   | 说明       |
|--------|--------|------------|
| name   | string | 标签名称   |
| count  | number | 文章数量   |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": [
        {
            "name": "技术",
            "count": 120
        },
        {
            "name": "生活",
            "count": 85
        },
        {
            "name": "旅行",
            "count": 42
        }
    ]
}
```

- **错误码说明：**

| 错误码 | 说明         |
|--------|------------|
| 200    | 成功       |
| 500    | 服务器错误 |

- **其他说明：**
  - 该接口可以在未登录状态下访问
  - 返回的标签按文章数量降序排列
  - 标签数据会被缓存，定期更新
  - 用于分类页面的标签导航和标签云展示
  - 返回的标签数量可能有限制，通常返回使用频率最高的前30个标签
  - **⚠️ 当前状态：需要实现**

### 10. 按标签获取文章列表

**接口说明：** 获取指定标签的文章列表

- **请求URL：** `/api/article`
- **请求方式：** GET
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明                              |
|----------|--------|------|-----------------------------------|
| tag      | string | 否   | 标签名称，不提供则返回所有文章     |
| page     | number | 否   | 页码，默认1                       |
| pageSize | number | 否   | 每页条数，默认10，最大50          |
| sort     | string | 否   | 排序方式：new(最新)、hot(热门)、recommend(推荐)、following(关注) |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 分页数据     |

- **data对象结构：**

| 参数名      | 类型    | 说明               |
|-------------|---------|-------------------|
| total       | number  | 总记录数          |
| pages       | number  | 总页数            |
| list        | array   | 文章列表          |

- **list数组元素结构：**

| 参数名         | 类型             | 说明                 |
|----------------|------------------|---------------------|
| id             | number           | 文章ID              |
| title          | string           | 文章标题            |
| summary        | string           | 文章摘要            |
| content        | string           | 文章内容（纯文本）  |
| coverImage     | string           | 封面图片URL         |
| tags           | Array\<string\>  | 文章标签            |
| viewCount      | number           | 浏览量              |
| likeCount      | number           | 点赞数              |
| commentCount   | number           | 评论数              |
| collectCount   | number           | 收藏数              |
| isLiked        | boolean          | 当前用户是否已点赞该文章 |
| isCollected    | boolean          | 当前用户是否已收藏该文章 |
| userId         | number           | 作者ID (将逐渐废弃, 使用 author.id) |
| nickname       | string           | 作者昵称 (将逐渐废弃, 使用 author.nickname) |
| avatar         | string           | 作者头像 (将逐渐废弃, 使用 author.avatar) |
| author         | object           | 作者信息对象         |
| isFollowed     | boolean          | 当前用户是否已关注此作者 |
| createTime     | string           | 创建时间            |
| updateTime     | string           | 更新时间            |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 42,
        "pages": 5,
        "list": [
            {
                "id": 1001,
                "title": "技术文章标题",
                "summary": "这是一篇关于技术的文章摘要...",
                "coverImage": "https://example.com/uploads/articles/cover_1001.jpg",
                "tags": ["技术", "编程"],
                "viewCount": 120,
                "likeCount": 30,
                "commentCount": 15,
                "collectCount": 25,
                "isLiked": false,
                "isCollected": true,
                "userId": 1,
                "nickname": "技术作者",
                "avatar": "https://example.com/uploads/avatars/user_1.jpg",
                "isFollowed": false,
                "createTime": "2024-05-01 10:00:00",
                "updateTime": "2024-05-01 10:00:00"
            },
            // 更多文章...
        ]
    }
}
```

- **错误码说明：**

| 错误码 | 说明           |
|--------|--------------|
| 200    | 请求成功     |
| 400    | 参数错误     |
| 500    | 服务器错误   |

- **其他说明：**
  - 该接口整合了获取文章列表和按标签筛选的功能
  - 参数`tag`不区分大小写，但建议与标签获取接口返回的`name`字段保持一致
  - isLiked和isCollected字段仅在用户已登录时有意义，未登录用户默认为false
  - 可以通过`sort`参数指定排序方式，默认为最新文章
  - 该接口被用于首页、标签筛选页、分类页面等多个场景
  - **✅ 当前状态：已实现，标签筛选功能也已完善**

## 分类页面功能说明

### 标签分类页面

**功能说明：** 根据标签分类展示文章的页面，提供标签导航和文章列表

1. **页面功能：**
   - 顶部搜索栏，支持搜索标签
   - 水平滚动的标签导航栏，显示标签名称和文章数量
   - 文章列表区域，根据选择的标签展示相关文章
   - 支持切换标签分类
   - 支持下拉刷新和上拉加载更多
   - 空状态提示和加载状态展示

2. **数据处理：**
   - 页面加载时通过 `/api/article/tags` 获取标签列表
   - 点击标签时通过 `/api/article?tag={tagName}` 获取文章列表
   - 支持标签搜索功能，可在本地过滤标签
   - 支持"全部"标签，显示所有文章
   - 自动计算"全部"标签的文章数量（所有标签文章数量之和）

3. **交互优化：**
   - 当前选中的标签高亮显示
   - 标签导航栏支持水平滚动，确保所有标签可见
   - 文章列表区域根据标签内容动态调整空状态提示
   - 搜索标签后，如果找到匹配的标签，自动切换到该标签
   - 标签点击有反馈效果
   - 适配不同屏幕尺寸的响应式设计

4. **实现细节：**
   - 使用 ArticleList 组件展示文章，提高代码复用
   - 使用 computed 属性实现标签过滤功能
   - 标签切换时重置文章列表并自动加载新数据
   - 使用 BackToTop 组件提供回到顶部功能
   - 使用 sticky 定位确保标签导航栏始终可见
   - 搜索、刷新、加载更多功能无缝配合
   - **✅ 当前状态：已实现**

## 性能优化与问题修复

### 我的页面文章列表重复渲染问题

1. **问题描述：**
   - "我的"页面中文章列表在某些情况下会重复渲染
   - 刷新操作没有正确的防抖控制，导致多次触发API请求
   - 页面反复刷新造成性能问题和用户体验下降

2. **解决方案：**
   - 添加`isRefreshing`标志变量防止重复刷新
   - 设置页面刷新状态的防抖间隔（2秒）
   - 使用`resetList`和`loadArticles`替代直接调用`refresh`方法
   - 优化ArticleList组件的刷新逻辑，确保只在必要时重新请求数据

3. **代码实现：**
   ```js
   // 处理下拉刷新
   const handleRefresh = () => {
     if (isRefreshing.value) return; // 避免重复触发
     
     isRefreshing.value = true;
     
     // 完全重置组件状态
     articleList.value = [];
     currentPage.value = 1;
     noMoreData.value = false;
     
     // 重新加载数据
     setTimeout(() => {
       loadArticles(true)
         .finally(() => {
           isRefreshing.value = false;
           emit('refresh'); // 通知父组件刷新已完成
         });
     }, 300);
   };
   ```

### 浏览器刷新时重复请求API问题

1. **问题描述：**
   - 页面刷新时会重复发起API请求
   - 没有有效的防止重复加载机制
   - 在网络不稳定情况下可能导致数据重复或请求冲突

2. **解决方案：**
   - 添加`isFirstLoad`标志识别首次加载
   - 引入全局加载锁机制`globalLoadingLock`
   - 创建统一的数据加载入口`loadUserDataAndArticles()`
   - 使用`v-if`控制ArticleList组件渲染时机
   - 添加组件key属性确保正确重新渲染

3. **代码实现：**
   ```js
   // 全局加载锁和首次加载标记
   const globalLoadingLock = ref(false);
   const isFirstLoad = ref(true);
   
   // 统一的数据加载入口
   const loadUserDataAndArticles = async () => {
     if (globalLoadingLock.value) return;
     
     globalLoadingLock.value = true;
     try {
       await refreshUserInfo();
       if (articleListRef.value) {
         await articleListRef.value.resetList();
         await articleListRef.value.loadArticles();
       }
     } finally {
       globalLoadingLock.value = false;
       isFirstLoad.value = false;
     }
   };
   
   // 在页面显示时处理加载
   onShow(() => {
     if (isFirstLoad.value) {
       loadUserDataAndArticles();
     } else {
       refreshUserInfo(); // 仅刷新用户信息，不重载文章列表
     }
   });
   ```

### 创作中心功能实现

1. **功能说明：**
   - 将"我的"页面中的创作中心按钮链接到发布页面
   - 改进页面间导航逻辑，确保用户体验流畅

2. **实现方式：**
   - 修改`navigateTo`方法，使点击创作中心按钮跳转到`/pages/publish/publish`
   - 增加了发布按钮的样式和交互反馈

3. **代码实现：**
   ```js
   // 导航到创作中心
   const navigateToPublish = () => {
     uni.navigateTo({
       url: '/pages/publish/publish'
     });
   };
   ```

### 文章编辑权限改进

1. **功能说明：**
   - 改进文章编辑权限控制逻辑，使编辑权限更灵活
   - 保留删除功能仅对文章作者开放的限制

2. **实现方式：**
   - 添加`:show-edit-for-all-users="true"`属性到ArticleList组件
   - 修改ArticleList组件，增加`showEditForAllUsers`属性
   - 移除了`handleEditArticle`函数中的作者身份检查

3. **代码实现：**
   ```js
   // 组件属性
   const props = defineProps({
     // 是否允许所有已登录用户编辑文章
     showEditForAllUsers: {
       type: Boolean,
       default: false
     },
     // 其他属性...
   });
   
   // 处理编辑文章
   const handleEdit = async (index) => {
     const article = articleList.value[index];
     
     // 判断编辑权限
     if (!props.showEditForAllUsers && !isCurrentUser(article.author?.id)) {
       uni.showToast({
         title: '只能编辑自己的文章',
         icon: 'none'
       });
       return;
     }
     
     // 编辑逻辑...
   };
   ```

### 组件优化

1. **ArticleList组件优化：**
   - 添加防抖和节流控制，避免频繁刷新
   - 改进了网络错误处理和请求重试机制
   - 添加请求超时处理，提高组件稳定性
   - 优化了加载状态显示逻辑
   - 增强了条件渲染效率，减少不必要的DOM操作
   - 添加了组件卸载时的事件清理，防止内存泄漏

2. **"我的"页面优化：**
   - 使用节流控制用户信息刷新频率
   - 添加缓存机制降低API请求频率
   - 优化页面加载顺序，提高用户体验
   - 改进了返回键和手势处理逻辑
   - 增强了错误处理和降级显示能力

3. **数据一致性优化：**
   - 使用事件总线（uni.$on/uni.$emit）实现组件间通信
   - 文章状态变更时自动刷新相关列表
   - 确保用户数据在多个页面间的一致性
   - 提供统一的API响应处理逻辑，确保数据格式一致

## 用户设置面板问题修复

### 1. H5环境设置面板点击问题修复

**问题描述：** 在H5环境中，当用户打开设置面板后，点击面板内的选项（如修改头像、修改昵称等）会导致整个设置面板意外关闭。

**修复方案：**

1. **事件冒泡阻止机制：**
   - 在H5环境下，为所有内部操作按钮添加事件冒泡阻止
   - 在模板中使用`@click.stop`指令阻止事件冒泡
   - 在JS处理函数中添加`e.stopPropagation()`

2. **特殊操作状态标记：**
   - 添加`isInOperation`标记变量，用于标识正在进行特殊操作（如选择头像）
   - 全局点击事件监听器检查此标记，避免在特殊操作时关闭面板
   ```js
   document.addEventListener('click', (event) => {
     if (showUserSettings.value && !isInOperation.value) {
       const settingsPanel = document.querySelector('.user-settings-wrapper');
       if (settingsPanel && !settingsPanel.contains(event.target)) {
         showUserSettings.value = false;
       }
     }
   });
   ```

3. **添加头像选择前事件通知：**
   - 新增`before-avatar-select`事件，通知父组件即将开始头像选择
   ```js
   const changeAvatar = (e) => {
     // H5环境下阻止事件冒泡
     // #ifdef H5
     if (e) e.stopPropagation();
     // #endif
     
     // 重置状态
     isAvatarUpdated.value = false;
     
     // 触发头像选择前事件，通知父组件正在进行特殊操作
     emit('before-avatar-select');
     
     // 选择头像逻辑...
   };
   ```

### 2. 设置面板交互逻辑优化

**修复内容：**

1. **面板内导航优化：**
   - 修改`handleBackOrClose`函数，实现分层导航逻辑
   - 点击"取消"按钮现在会返回主设置页面，而不是关闭整个设置面板
   ```js
   const handleBackOrClose = (e) => {
     // #ifdef H5
     if (e) e.stopPropagation();
     // #endif
     
     if (isEditingNickname.value && hasUnsavedChanges.value) {
       // 如果有未保存的修改，显示确认弹窗
       showConfirmAbandonDialog();
     } else if (isEditingNickname.value) {
       // 返回主设置页面
       cancelEditNickname(e);
     } else if (isConfirmingLogout.value) {
       // 返回主设置页面
       cancelLogout(e);
     } else {
       // 关闭整个设置面板
       closeSettings();
     }
   };
   ```

2. **修改头像流程优化：**
   - 修改头像成功后不再关闭设置面板
   - 添加成功视觉反馈（高亮动画和"更新成功"提示文本）
   ```js
   // 设置头像更新成功状态
   isAvatarUpdated.value = true;
   
   // 显示成功提示
   uni.showToast({
     title: '头像更新成功',
     icon: 'success',
     duration: 2000
   });
   
   // 3秒后重置状态
   setTimeout(() => {
     isAvatarUpdated.value = false;
   }, 3000);
   
   // 成功后不关闭设置页面
   ```

3. **状态管理优化：**
   - 使用`panelVisible`变量控制面板动画状态
   - 添加`isAvatarUpdated`标记更新成功状态
   - 使用条件编译区分不同平台的交互行为

### 3. 跨平台兼容性增强

**优化内容：**

1. **CSS增强：**
   - 为H5环境添加特殊样式规则，确保事件处理正确
   ```css
   // #ifdef H5
   // H5环境下强制禁止点击事件冒泡导致面板消失
   pointer-events: auto !important;
   // #endif
   ```

2. **动画优化：**
   - 使用CSS动画显示头像更新成功状态
   ```css
   &.avatar-updated {
     border-color: #4361ee;
     box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
     animation: avatar-pulse 1.5s infinite;
   }
   
   @keyframes avatar-pulse {
     0% {
       box-shadow: 0 0 0 0 rgba(67, 97, 238, 0.4);
     }
     70% {
       box-shadow: 0 0 0 6px rgba(67, 97, 238, 0);
     }
     100% {
       box-shadow: 0 0 0 0 rgba(67, 97, 238, 0);
     }
   }
   ```

3. **条件编译应用：**
   - 使用条件编译确保在不同平台上的行为一致
   ```js
   // H5环境下忽略此操作，APP和小程序才执行
   // #ifndef H5
   if (!props.visible || gestureLocked.value) return;
   
   if (e.touches && e.touches.length > 0) {
     touchStartX.value = e.touches[0].clientX;
     touchStartY.value = e.touches[0].clientY;
   }
   // #endif
   ```

通过以上修复，解决了用户设置面板在H5环境中的交互问题，使用户可以在设置面板中流畅地完成头像修改、昵称修改和退出登录确认等操作，而不会意外关闭整个设置面板。同时，增强了设置面板在不同平台上的兼容性和一致性。

## 关注状态管理与检查

### 关注状态检查功能

**功能说明：** 实现关注状态检查的多种方案，确保关注按钮状态在各个页面中的一致性。

1. **关注状态检查API：**
   - 通过 `checkUserFollow(userId)` API检查当前登录用户是否关注了指定用户
   - API路径：`/api/user/check-follow/{userId}`
   - 根据后端返回的boolean值更新关注状态
   - 该API支持降级处理，当API调用失败时仍能保持应用正常工作

2. **关注按钮组件化：**
   - 创建单独的`follow-button`组件封装关注/取消关注逻辑
   - 组件支持传入初始关注状态`followed`和自动检查属性`auto-check`
   - 组件在挂载时可以自动检查关注状态，确保UI状态与后端一致
   ```html
   <follow-button 
     :user-id="userId" 
     :nickname="nickname" 
     :followed="isFollowed"
     :auto-check="true"
     @follow-change="handleFollowChange"
   />
   ```

3. **实现方式：**
   - **单个状态检查：** 在关注按钮组件内部实现，通过`checkFollowStatus`方法：
   ```js
   // 组件内部关注状态检查方法
   const checkFollowStatus = async () => {
     // 如果没有登录或没有用户ID，不检查
     if (!isLoggedIn() || !props.userId) return;
     
     try {
       const result = await checkUserFollow(props.userId);
       if (result.code === 200) {
         // 后端返回的关注状态与当前状态不同，更新状态
         if (isFollowed.value !== result.data) {
           isFollowed.value = result.data;
           // 通知父组件状态已更新
           emit('follow-change', result.data);
           emit('update:followed', result.data);
         }
       }
     } catch (error) {
       console.error('检查关注状态失败:', error);
     }
   };
   
   // 组件挂载时，自动检查关注状态
   onMounted(() => {
     if (props.autoCheck) {
       checkFollowStatus();
     }
   });
   ```
   
   - **批量状态检查：** 在列表页面批量检查作者关注状态：
   ```js
   /**
    * 批量检查文章作者的关注状态
    * @param {Array} articles - 文章列表
    */
   const checkArticleAuthorsFollowStatus = async (articles) => {
     // 检查登录状态
     const token = uni.getStorageSync('token');
     if (!token) return;
     
     // 收集所有需要检查关注状态的作者ID并去重
     const authorIds = [...new Set(
       articles
         .filter(article => article.author && article.author.id)
         .map(article => article.author.id)
     )];
     
     if (authorIds.length === 0) return;
     
     // 为每个作者检查关注状态
     for (const authorId of authorIds) {
       try {
         const result = await checkUserFollow(authorId);
         if (result.code === 200) {
           // 更新所有该作者的文章
           articles.forEach(article => {
             if (article.author && article.author.id === authorId) {
               article.author.isFollowed = result.data;
             }
           });
         }
       } catch (error) {
         console.error(`检查作者 ${authorId} 关注状态失败:`, error);
       }
     }
   };
   ```

4. **状态检查触发时机：**
   - 关注按钮组件挂载时（通过`autoCheck`属性控制）
   - 文章列表加载完成后（通过`checkArticleAuthorsFollowStatus`函数）
   - 关注/取消关注操作后（通过组件的内部状态更新）
   - 特定页面（如分类页）加载新文章数据时
   - 加载更多文章数据时对新加载的文章进行检查

5. **数据一致性策略：**
   - 双重检查机制：组件级别检查 + 页面级别批量检查
   - 关注/取消关注操作时广播状态变更，确保其他页面同步更新
   - 使用`follow-change`事件通知父组件状态变化，实现跨组件状态同步
   - 合理的错误处理和降级逻辑，确保网络问题不影响用户体验

6. **最佳实践：**
   - 组件设计应遵循单一职责原则，专注于关注状态管理
   - 关注按钮组件应处理自己的状态检查和UI更新，减轻页面负担
   - 在列表页面初始化时进行批量检查，减少API请求次数
   - 使用事件系统（uni.$emit/uni.$on）实现全局状态同步

此关注状态检查机制确保了用户在不同页面（如文章列表、文章详情、用户资料页等）看到的关注状态始终一致，提高了用户体验和应用的可靠性。

## 消息通知相关接口

### 1. 获取消息列表

**接口说明：** 获取当前登录用户的消息通知列表，支持按类型筛选和分页

- **请求URL：** `/api/message`
- **请求方式：** GET
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明                              |
|----------|--------|------|-----------------------------------|
| type     | number | 否   | 消息类型：0-系统公告，1-点赞通知，2-关注通知，3-评论通知，不传则获取所有类型 |
| page     | number | 否   | 页码，默认1                       |
| pageSize | number | 否   | 每页条数，默认10，最大50          |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 分页数据     |

- **data对象结构：**

| 参数名 | 类型   | 说明         |
|--------|--------|--------------|
| total  | number | 总记录数     |
| pages  | number | 总页数       |
| list   | array  | 消息列表     |

- **list数组元素结构：**

| 参数名         | 类型    | 说明                 |
|----------------|---------|----------------------|
| id             | number  | 消息ID              |
| type           | number  | 消息类型：0-系统公告，1-点赞通知，2-关注通知，3-评论通知 |
| content        | string  | 消息内容            |
| isRead         | number  | 是否已读：0-未读，1-已读 |
| createTime     | string  | 消息创建时间        |
| fromUserId     | number  | 发送者ID（系统消息为null） |
| toUserId       | number  | 接收者ID            |
| targetId       | number  | 目标ID（文章ID、评论ID等） |
| fromUserInfo   | object  | 发送者信息（后端可能会关联查询用户表） |

- **fromUserInfo对象结构** (如果后端实现)：

| 参数名     | 类型   | 说明         |
|------------|--------|--------------|
| id         | number | 用户ID       |
| nickname   | string | 用户昵称     |
| avatar     | string | 用户头像URL  |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 25,
        "pages": 3,
        "list": [
            {
                "id": 101,
                "type": 1,
                "content": "用户前端达人点赞了您的文章《Vue3新特性解析》",
                "isRead": 0,
                "createTime": "2024-05-01 10:00:00",
                "fromUserId": 10001,
                "toUserId": 2001,
                "targetId": 2001,
                "fromUserInfo": {
                    "id": 10001,
                    "nickname": "前端达人",
                    "avatar": "https://example.com/uploads/avatars/user_10001.jpg"
                }
            },
            {
                "id": 102,
                "type": 1,
                "content": "用户JavaScript专家点赞了您的评论",
                "isRead": 1,
                "createTime": "2024-04-28 15:30:00",
                "fromUserId": 10002,
                "toUserId": 2001,
                "targetId": 3001,
                "fromUserInfo": {
                    "id": 10002,
                    "nickname": "JavaScript专家",
                    "avatar": "https://example.com/uploads/avatars/user_10002.jpg"
                }
            }
        ]
    }
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 401    | 未登录或token无效       |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - type参数用于筛选特定类型的消息，不传则获取所有类型
  - isRead字段为数字类型：0-未读，1-已读
  - fromUserId在系统消息（type=0）时为null
  - 如果targetId指向的是评论，建议在消息content中包含该评论所属的文章信息
  - fromUserInfo对象是后端可能会关联查询用户表获取的扩展字段，便于前端直接显示用户信息
  - **✅ 当前状态：已实现**

### 2. 标记消息为已读

**接口说明：** 将指定消息标记为已读状态

- **请求URL：** `/api/message/read/{messageId}`
- **请求方式：** PUT
- **请求参数：**

| 参数名    | 类型   | 必选 | 说明                     |
|-----------|--------|------|-------------------------|
| messageId | number | 是   | 消息ID，包含在URL路径中  |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "标记成功"
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 401    | 未登录或token无效       |
| 403    | 无权操作此消息          |
| 404    | 消息不存在              |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 用户只能将发送给自己的消息标记为已读
  - **✅ 当前状态：已实现**

### 3. 批量标记消息为已读

**接口说明：** 将指定类型的所有消息标记为已读状态

- **请求URL：** `/api/message/read-all`
- **请求方式：** PUT
- **请求参数：**

| 参数名 | 类型   | 必选 | 说明                              |
|--------|--------|------|-----------------------------------|
| type   | number | 否   | 消息类型：0-系统公告，1-点赞通知，2-关注通知，3-评论通知，不传则标记所有类型 |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 返回数据     |

- **data对象结构：**

| 参数名    | 类型   | 说明           |
|-----------|--------|---------------|
| readCount | number | 已标记的消息数 |

- **响应示例：**

```json
{
    "code": 200,
    "message": "标记成功",
    "data": {
        "readCount": 15
    }
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 401    | 未登录或token无效       |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - type参数用于标记特定类型的所有未读消息为已读，不传则标记所有类型
  - **✅ 当前状态：已实现**

### 4. 获取未读消息数量

**接口说明：** 获取当前用户的未读消息数量统计

- **请求URL：** `/api/message/unread-count`
- **请求方式：** GET
- **请求参数：** 无

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | object | 统计数据     |

- **data对象结构：**

| 参数名         | 类型   | 说明                   |
|----------------|--------|------------------------|
| total          | number | 总未读消息数           |
| systemCount    | number | 系统公告未读数         |
| likeCount      | number | 点赞通知未读数         |
| followCount    | number | 关注通知未读数         |
| commentCount   | number | 评论通知未读数         |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": 12,
        "systemCount": 2,
        "likeCount": 5,
        "followCount": 3,
        "commentCount": 2
    }
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 401    | 未登录或token无效       |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要在请求头中携带token才能访问
  - 用于在导航栏和各消息标签上显示未读消息数量
  - **✅ 当前状态：已实现**

## 管理后台 API 接口

### 1. 角色管理相关接口

#### 1.1 获取角色列表

**接口说明：** 获取系统中所有角色信息，支持分页

- **请求URL：** `/admin/roles`
- **请求方式：** GET
- **请求参数：**

| 参数名   | 类型   | 必选 | 说明                     |
|----------|--------|------|--------------------------|
| page     | number | 否   | 页码，默认1             |
| size     | number | 否   | 每页条数，默认10        |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |
| data    | array  | 角色列表     |
| total   | number | 总记录数     |

- **data数组元素结构：**

| 参数名      | 类型   | 说明                   |
|-------------|--------|------------------------|
| id          | number | 角色ID                |
| name        | string | 角色名称              |
| description | string | 角色描述              |
| status      | string | 状态：'1'-启用，'0'-禁用 |
| isSystem    | string | 是否系统内置：'1'-是，'0'-否 |
| createTime  | string | 创建时间              |
| updateTime  | string | 更新时间              |

- **响应示例：**

```json
{
    "code": 200,
    "message": "success",
    "data": [
        {
            "id": 1,
            "name": "超级管理员",
            "description": "系统最高权限角色",
            "status": "1",
            "isSystem": "1",
            "createTime": "2024-01-01 00:00:00",
            "updateTime": "2024-01-01 00:00:00"
        },
        {
            "id": 2,
            "name": "内容管理员",
            "description": "负责内容审核和管理",
            "status": "1",
            "isSystem": "0",
            "createTime": "2024-01-05 10:00:00",
            "updateTime": "2024-01-05 10:00:00"
        }
    ],
    "total": 2
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 401    | 未登录或token无效       |
| 403    | 无权限访问              |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要管理员权限才能访问
  - 返回的角色会根据创建时间降序排列
  - **✅ 当前状态：已实现**

#### 1.2 添加角色

**接口说明：** 创建新角色

- **请求URL：** `/admin/roles`
- **请求方式：** POST
- **请求参数：**

| 参数名      | 类型   | 必选 | 说明                      |
|-------------|--------|------|---------------------------|
| name        | string | 是   | 角色名称                  |
| description | string | 否   | 角色描述                  |
| status      | string | 否   | 状态：'1'-启用，'0'-禁用，默认'1' |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "添加成功"
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 400    | 参数错误                |
| 401    | 未登录或token无效       |
| 403    | 无权限操作              |
| 409    | 角色名称已存在          |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要管理员权限才能访问
  - 角色名称在系统中必须唯一
  - 角色名称长度限制：2-50个字符
  - 角色描述长度限制：0-200个字符
  - **✅ 当前状态：已实现**

#### 1.3 更新角色

**接口说明：** 更新现有角色信息

- **请求URL：** `/admin/roles/{id}`
- **请求方式：** PUT
- **请求参数：**

| 参数名      | 类型   | 必选 | 说明                      |
|-------------|--------|------|---------------------------|
| id          | number | 是   | 角色ID，包含在URL路径中    |
| name        | string | 是   | 角色名称                  |
| description | string | 否   | 角色描述                  |
| status      | string | 否   | 状态：'1'-启用，'0'-禁用   |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "更新成功"
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 400    | 参数错误                |
| 401    | 未登录或token无效       |
| 403    | 无权限操作              |
| 404    | 角色不存在              |
| 409    | 角色名称已存在          |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要管理员权限才能访问
  - 不能修改系统内置角色（isSystem=1）
  - 角色名称在系统中必须唯一（除本身外）
  - 同样遵循角色名称和描述的长度限制
  - **✅ 当前状态：已实现**

#### 1.4 删除角色

**接口说明：** 删除指定角色

- **请求URL：** `/admin/roles/{id}`
- **请求方式：** DELETE
- **请求参数：**

| 参数名 | 类型   | 必选 | 说明                     |
|--------|--------|------|--------------------------|
| id     | number | 是   | 角色ID，包含在URL路径中   |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "删除成功"
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 401    | 未登录或token无效       |
| 403    | 无权限操作              |
| 404    | 角色不存在              |
| 409    | 角色正在使用中，无法删除 |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要管理员权限才能访问
  - 不能删除系统内置角色（isSystem=1）
  - 如果角色已分配给用户，则无法删除，需要先取消用户的角色分配
  - 删除角色会自动清除该角色的所有权限分配
  - **✅ 当前状态：已实现**

#### 1.5 更新角色状态

**接口说明：** 启用或禁用指定角色

- **请求URL：** `/admin/roles/{id}/status`
- **请求方式：** PATCH
- **请求参数：**

| 参数名 | 类型   | 必选 | 说明                     |
|--------|--------|------|--------------------------|
| id     | number | 是   | 角色ID，包含在URL路径中   |
| status | string | 是   | 状态：'1'-启用，'0'-禁用  |

- **响应参数：**

| 参数名  | 类型   | 说明         |
|---------|--------|--------------|
| code    | number | 状态码       |
| message | string | 提示信息     |

- **响应示例：**

```json
{
    "code": 200,
    "message": "状态更新成功"
}
```

- **错误码说明：**

| 错误码 | 说明                     |
|--------|-------------------------|
| 200    | 成功                    |
| 400    | 参数错误                |
| 401    | 未登录或token无效       |
| 403    | 无权限操作              |
| 404    | 角色不存在              |
| 500    | 服务器错误              |

- **其他说明：**
  - 该接口需要管理员权限才能访问
  - 不能修改系统内置角色的状态
  - 禁用角色后，拥有该角色的用户将失去对应权限
  - **✅ 当前状态：已实现**
