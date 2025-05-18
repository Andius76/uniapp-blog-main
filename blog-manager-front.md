# 博客管理后台前端API接口文档

## 基础信息

- 基础URL: `https://andiusblog.xyz`
- 子域名: `admin.andiusblog.xyz`
- API路径前缀: `/api/admin`
- 请求工具: `@/utils/request.js`

## 认证相关接口

### 管理员登录

- **请求路径**: `/api/admin/login`
- **请求方法**: `POST`
- **请求参数**:
  ```javascript
  {
    username: string, // 用户名
    password: string  // 密码
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "登录成功",
    data: {
      token: string,       // JWT令牌
      userInfo: object,    // 管理员信息
      roles: array,        // 角色列表
      permissions: array   // 权限列表
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { adminLogin } from '@/api/admin/auth.js';
  
  adminLogin({
    username: 'admin',
    password: 'password'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 获取管理员信息

- **请求路径**: `/api/admin/info`
- **请求方法**: `GET`
- **请求头**: 需要携带`Authorization`令牌
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取管理员信息成功",
    data: {
      id: number,
      username: string,
      nickname: string,
      avatar: string,
      roles: array,
      permissions: array
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { getAdminInfo } from '@/api/admin/auth.js';
  
  getAdminInfo().then(res => {
    // 处理响应结果
  });
  ```

### 管理员退出登录

- **请求路径**: `/api/admin/logout`
- **请求方法**: `POST`
- **请求头**: 需要携带`Authorization`令牌
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "退出成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { adminLogout } from '@/api/admin/auth.js';
  
  adminLogout().then(res => {
    // 处理响应结果
  });
  ```

## 用户管理接口

### 获取用户列表

- **请求路径**: `/api/admin/users`
- **请求方法**: `GET`
- **请求参数**:
  ```javascript
  {
    page: number,    // 页码，默认1
    size: number,    // 每页数量，默认10
    keyword: string, // 搜索关键词(可选)
    status: number   // 用户状态(可选)：0-禁用，1-正常
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取用户列表成功",
    data: {
      total: number,    // 总记录数
      list: array       // 用户列表
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { userApi } from '@/api/admin/index.js';
  
  userApi.getUserList({
    page: 1,
    size: 10,
    keyword: '搜索关键词',
    status: 1
  }).then(res => {
    // 处理响应结果
  });
  ```

### 获取用户详情

- **请求路径**: `/api/admin/users/:id`
- **请求方法**: `GET`
- **请求参数**: 路径参数`id`为用户ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取用户详情成功",
    data: {
      id: number,
      username: string,
      nickname: string,
      avatar: string,
      email: string,
      status: number,
      createTime: string,
      updateTime: string
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { userApi } from '@/api/admin/index.js';
  
  userApi.getUserDetail(1).then(res => {
    // 处理响应结果
  });
  ```

### 更新用户状态

- **请求路径**: `/api/admin/users/:id/status`
- **请求方法**: `PUT`
- **请求参数**:
  ```javascript
  {
    status: number  // 用户状态：0-禁用，1-正常
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "用户状态更新成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { userApi } from '@/api/admin/index.js';
  
  userApi.updateUserStatus(1, 1).then(res => {
    // 处理响应结果
  });
  ```

### 删除用户

- **请求路径**: `/api/admin/users/:id`
- **请求方法**: `DELETE`
- **请求参数**: 路径参数`id`为用户ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "用户删除成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { userApi } from '@/api/admin/index.js';
  
  userApi.deleteUser(1).then(res => {
    // 处理响应结果
  });
  ```

## 文章管理接口

### 获取文章列表

- **请求路径**: `/api/admin/articles`
- **请求方法**: `GET`
- **请求参数**:
  ```javascript
  {
    page: number,    // 页码，默认1
    size: number,    // 每页数量，默认10
    keyword: string, // 搜索关键词(可选)
    status: string   // 文章状态(可选)：0-草稿，1-已发布，2-待审核，3-已下架
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取文章列表成功",
    data: {
      total: number,    // 总记录数
      list: array       // 文章列表
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { articleApi } from '@/api/admin/index.js';
  
  articleApi.getArticleList({
    page: 1,
    size: 10,
    keyword: '搜索关键词',
    status: '1'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 获取文章详情

- **请求路径**: `/api/admin/articles/:id`
- **请求方法**: `GET`
- **请求参数**: 路径参数`id`为文章ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取文章详情成功",
    data: {
      id: number,
      title: string,
      content: string,
      summary: string,
      thumbnail: string,
      status: number,
      viewCount: number,
      likeCount: number,
      commentCount: number,
      createTime: string,
      updateTime: string,
      author: object
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { articleApi } from '@/api/admin/index.js';
  
  articleApi.getArticleDetail(1).then(res => {
    // 处理响应结果
  });
  ```

### 更新文章状态

- **请求路径**: `/api/admin/articles/:id/status`
- **请求方法**: `PUT`
- **请求参数**:
  ```javascript
  {
    status: string  // 文章状态：0-草稿，1-已发布，2-待审核，3-已下架
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "文章状态更新成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { articleApi } from '@/api/admin/index.js';
  
  articleApi.updateArticleStatus(1, '1').then(res => {
    // 处理响应结果
  });
  ```

### 删除文章

- **请求路径**: `/api/admin/articles/:id`
- **请求方法**: `DELETE`
- **请求参数**: 路径参数`id`为文章ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "文章删除成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { articleApi } from '@/api/admin/index.js';
  
  articleApi.deleteArticle(1).then(res => {
    // 处理响应结果
  });
  ```

## 角色管理接口

### 获取角色列表

- **请求路径**: `/api/admin/roles`
- **请求方法**: `GET`
- **请求参数**:
  ```javascript
  {
    page: number,    // 页码，默认1
    size: number,    // 每页数量，默认10
    keyword: string  // 搜索关键词(可选)
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取角色列表成功",
    data: {
      total: number,    // 总记录数
      list: array       // 角色列表
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { roleApi } from '@/api/admin/index.js';
  
  roleApi.getRoleList({
    page: 1,
    size: 10,
    keyword: '搜索关键词'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 获取角色详情

- **请求路径**: `/api/admin/roles/:id`
- **请求方法**: `GET`
- **请求参数**: 路径参数`id`为角色ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取角色详情成功",
    data: {
      id: number,
      name: string,
      description: string,
      status: string,
      createTime: string,
      updateTime: string
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { roleApi } from '@/api/admin/index.js';
  
  roleApi.getRoleDetail(1).then(res => {
    // 处理响应结果
  });
  ```

### 添加角色

- **请求路径**: `/api/admin/roles`
- **请求方法**: `POST`
- **请求参数**:
  ```javascript
  {
    name: string,         // 角色名称
    description: string,  // 角色描述
    status: string        // 角色状态：0-禁用，1-启用
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "添加角色成功",
    data: {
      id: number,
      name: string,
      description: string,
      status: string
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { roleApi } from '@/api/admin/index.js';
  
  roleApi.addRole({
    name: '编辑',
    description: '可以管理文章',
    status: '1'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 更新角色

- **请求路径**: `/api/admin/roles/:id`
- **请求方法**: `PUT`
- **请求参数**:
  ```javascript
  {
    name: string,         // 角色名称
    description: string,  // 角色描述
    status: string        // 角色状态：0-禁用，1-启用
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "更新角色成功",
    data: {
      id: number,
      name: string,
      description: string,
      status: string
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { roleApi } from '@/api/admin/index.js';
  
  roleApi.updateRole(1, {
    name: '高级编辑',
    description: '可以管理所有文章',
    status: '1'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 更新角色状态

- **请求路径**: `/api/admin/roles/:id/status`
- **请求方法**: `PUT`
- **请求参数**:
  ```javascript
  {
    status: string  // 角色状态：0-禁用，1-启用
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "更新角色状态成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { roleApi } from '@/api/admin/index.js';
  
  roleApi.updateRoleStatus(1, '1').then(res => {
    // 处理响应结果
  });
  ```

### 删除角色

- **请求路径**: `/api/admin/roles/:id`
- **请求方法**: `DELETE`
- **请求参数**: 路径参数`id`为角色ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "删除角色成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { roleApi } from '@/api/admin/index.js';
  
  roleApi.deleteRole(1).then(res => {
    // 处理响应结果
  });
  ```

## 权限管理接口

### 获取权限列表

- **请求路径**: `/api/admin/permissions`
- **请求方法**: `GET`
- **请求参数**:
  ```javascript
  {
    page: number,    // 页码，默认1
    size: number,    // 每页数量，默认10
    keyword: string  // 搜索关键词(可选)
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取权限列表成功",
    data: {
      total: number,    // 总记录数
      list: array       // 权限列表
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { permissionApi } from '@/api/admin/index.js';
  
  permissionApi.getPermissionList({
    page: 1,
    size: 10,
    keyword: '搜索关键词'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 获取权限详情

- **请求路径**: `/api/admin/permissions/:id`
- **请求方法**: `GET`
- **请求参数**: 路径参数`id`为权限ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取权限详情成功",
    data: {
      id: number,
      name: string,
      code: string,
      path: string,
      description: string
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { permissionApi } from '@/api/admin/index.js';
  
  permissionApi.getPermissionDetail(1).then(res => {
    // 处理响应结果
  });
  ```

### 添加权限

- **请求路径**: `/api/admin/permissions`
- **请求方法**: `POST`
- **请求参数**:
  ```javascript
  {
    name: string,         // 权限名称
    code: string,         // 权限标识符
    path: string,         // 权限路径(可选)
    description: string   // 权限描述(可选)
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "添加权限成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { permissionApi } from '@/api/admin/index.js';
  
  permissionApi.addPermission({
    name: '查看文章',
    code: 'article:view',
    path: '/api/admin/articles',
    description: '允许查看文章列表和详情'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 更新权限

- **请求路径**: `/api/admin/permissions/:id`
- **请求方法**: `PUT`
- **请求参数**:
  ```javascript
  {
    name: string,         // 权限名称
    code: string,         // 权限标识符
    path: string,         // 权限路径(可选)
    description: string   // 权限描述(可选)
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "更新权限成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { permissionApi } from '@/api/admin/index.js';
  
  permissionApi.updatePermission(1, {
    name: '查看所有文章',
    code: 'article:view:all',
    path: '/api/admin/articles',
    description: '允许查看所有文章'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 删除权限

- **请求路径**: `/api/admin/permissions/:id`
- **请求方法**: `DELETE`
- **请求参数**: 路径参数`id`为权限ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "删除权限成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { permissionApi } from '@/api/admin/index.js';
  
  permissionApi.deletePermission(1).then(res => {
    // 处理响应结果
  });
  ```

### 获取所有权限

- **请求路径**: `/api/admin/permissions/all`
- **请求方法**: `GET`
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取所有权限成功",
    data: [
      {
        id: number,
        name: string,
        code: string,
        path: string,
        description: string
      }
    ]
  }
  ```
- **使用方法**:
  ```javascript
  import { permissionApi } from '@/api/admin/index.js';
  
  permissionApi.getAllPermissions().then(res => {
    // 处理响应结果
  });
  ```

## 角色-权限关系接口

### 获取角色拥有的权限

- **请求路径**: `/api/admin/roles/:roleId/permissions`
- **请求方法**: `GET`
- **请求参数**: 路径参数`roleId`为角色ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取角色权限成功",
    data: [
      {
        id: number,
        name: string,
        code: string,
        path: string,
        description: string
      }
    ]
  }
  ```
- **使用方法**:
  ```javascript
  import { rolePermissionApi } from '@/api/admin/index.js';
  
  rolePermissionApi.getRolePermissions(1).then(res => {
    // 处理响应结果
  });
  ```

### 为角色分配权限

- **请求路径**: `/api/admin/roles/:roleId/permissions`
- **请求方法**: `POST`
- **请求参数**:
  ```javascript
  {
    permissionIds: array  // 权限ID数组
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "角色权限分配成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { rolePermissionApi } from '@/api/admin/index.js';
  
  rolePermissionApi.assignPermissions(1, [1, 2, 3]).then(res => {
    // 处理响应结果
  });
  ```

## 用户-角色关系接口

### 获取用户列表(带角色信息)

- **请求路径**: `/api/admin/users/roles`
- **请求方法**: `GET`
- **请求参数**:
  ```javascript
  {
    page: number,    // 页码，默认1
    size: number,    // 每页数量，默认10
    keyword: string  // 搜索关键词(可选)
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取用户列表成功",
    data: {
      total: number,    // 总记录数
      list: array       // 用户列表(包含角色信息)
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { userRoleApi } from '@/api/admin/index.js';
  
  userRoleApi.getUserList({
    page: 1,
    size: 10,
    keyword: '搜索关键词'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 获取用户拥有的角色

- **请求路径**: `/api/admin/users/:userId/roles`
- **请求方法**: `GET`
- **请求参数**: 路径参数`userId`为用户ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取用户角色成功",
    data: [
      {
        id: number,
        name: string,
        description: string,
        status: string
      }
    ]
  }
  ```
- **使用方法**:
  ```javascript
  import { userRoleApi } from '@/api/admin/index.js';
  
  userRoleApi.getUserRoles(1).then(res => {
    // 处理响应结果
  });
  ```

### 给用户分配角色

- **请求路径**: `/api/admin/users/:userId/roles`
- **请求方法**: `POST`
- **请求参数**:
  ```javascript
  {
    roleIds: array  // 角色ID数组
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "用户角色分配成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { userRoleApi } from '@/api/admin/index.js';
  
  userRoleApi.assignUserRoles(1, [1, 2, 3]).then(res => {
    // 处理响应结果
  });
  ```

## 管理员-角色关系接口

### 获取管理员列表(带角色信息)

- **请求路径**: `/api/admin/users/roles/admin`
- **请求方法**: `GET`
- **请求参数**:
  ```javascript
  {
    page: number,    // 页码，默认1
    size: number,    // 每页数量，默认10
    keyword: string  // 搜索关键词(可选)
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取管理员列表成功",
    data: {
      total: number,    // 总记录数
      list: array       // 管理员列表(包含角色信息)
    }
  }
  ```
- **使用方法**:
  ```javascript
  import { userRoleApi } from '@/api/admin/index.js';
  
  userRoleApi.getAdminList({
    page: 1,
    size: 10,
    keyword: '搜索关键词'
  }).then(res => {
    // 处理响应结果
  });
  ```

### 获取管理员拥有的角色

- **请求路径**: `/api/admin/users/roles/admin/:adminId`
- **请求方法**: `GET`
- **请求参数**: 路径参数`adminId`为管理员ID
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "获取管理员角色成功",
    data: [
      {
        id: number,
        name: string,
        description: string,
        status: string
      }
    ]
  }
  ```
- **使用方法**:
  ```javascript
  import { userRoleApi } from '@/api/admin/index.js';
  
  userRoleApi.getAdminRoles(1).then(res => {
    // 处理响应结果
  });
  ```

### 给管理员分配角色

- **请求路径**: `/api/admin/users/roles/admin/:adminId`
- **请求方法**: `POST`
- **请求参数**:
  ```javascript
  {
    roleIds: array  // 角色ID数组
  }
  ```
- **响应结果**:
  ```javascript
  {
    code: 200,
    message: "管理员角色分配成功",
    data: null
  }
  ```
- **使用方法**:
  ```javascript
  import { userRoleApi } from '@/api/admin/index.js';
  
  userRoleApi.assignAdminRoles(1, [1, 2, 3]).then(res => {
    // 处理响应结果
  });
  ```

