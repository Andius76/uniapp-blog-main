import request from '@/utils/request'

// 角色管理相关API
const roleApi = {
  // 获取角色列表
  getRoleList(params) {
    console.log('roleApi.getRoleList被调用，参数:', JSON.stringify(params));
    return request.get('/api/admin/roles', params);
  },
  
  // 添加角色
  addRole(data) {
    console.log('roleApi.addRole被调用，数据:', JSON.stringify(data));
    return request.post('/api/admin/roles', data);
  },
  
  // 更新角色
  updateRole(id, data) {
    console.log('roleApi.updateRole被调用，ID:', id, '数据:', JSON.stringify(data));
    return request.put(`/api/admin/roles/${id}`, data);
  },
  
  // 删除角色
  deleteRole(id) {
    console.log('roleApi.deleteRole被调用，ID:', id);
    return request.delete(`/api/admin/roles/${id}`);
  },
  
  // 更新角色状态
  updateRoleStatus(id, status) {
    console.log('roleApi.updateRoleStatus被调用，ID:', id, '状态:', status);
    return request.patch(`/api/admin/roles/${id}/status`, { status });
  }
}

// 用户管理相关API
const userApi = {
  // 获取用户列表
  getUserList(params) {
    console.log('userApi.getUserList被调用，参数:', JSON.stringify(params));
    return request.get('/api/admin/users', params);
  },
  
  // 获取用户详情
  getUserDetail(id) {
    console.log('userApi.getUserDetail被调用，ID:', id);
    return request.get(`/api/admin/users/${id}`);
  },
  
  // 更新用户
  updateUser(id, data) {
    console.log('userApi.updateUser被调用，ID:', id, '数据:', JSON.stringify(data));
    return request.put(`/api/admin/users/${id}`, data);
  },
  
  // 删除用户
  deleteUser(id) {
    console.log('userApi.deleteUser被调用，ID:', id);
    return request.delete(`/api/admin/users/${id}`);
  },
  
  // 带密码验证的删除用户
  deleteUserWithPassword(id, password) {
    console.log('userApi.deleteUserWithPassword被调用，ID:', id);
    return request.delete(`/api/admin/users/${id}`, { 
      adminPassword: password 
    });
  },
  
  // 更新用户状态
  updateUserStatus(id, status) {
    console.log('userApi.updateUserStatus被调用，ID:', id, '状态:', status);
    return request.put(`/api/admin/users/${id}/status`, { status });
  }
}

// 文章管理相关API
const articleApi = {
  // 获取文章列表
  getArticleList(params) {
    console.log('articleApi.getArticleList被调用，参数:', JSON.stringify(params));
    return request.get('/api/admin/articles', params);
  },
  
  // 获取文章详情
  getArticleDetail(id) {
    console.log('articleApi.getArticleDetail被调用，ID:', id);
    return request.get(`/api/admin/articles/${id}`);
  },
  
  // 更新文章
  updateArticle(id, data) {
    console.log('articleApi.updateArticle被调用，ID:', id, '数据:', JSON.stringify(data));
    return request.put(`/api/admin/articles/${id}`, data);
  },
  
  // 删除文章
  deleteArticle(id) {
    console.log('articleApi.deleteArticle被调用，ID:', id);
    return request.delete(`/api/admin/articles/${id}`);
  },
  
  // 更新文章状态(发布/下架)
  updateArticleStatus(id, status) {
    console.log('articleApi.updateArticleStatus被调用，ID:', id, '状态:', status);
    return request.patch(`/api/admin/articles/${id}/status`, { status });
  }
}

// 权限管理相关API
const permissionApi = {
  // 获取权限列表
  getPermissionList(params) {
    console.log('permissionApi.getPermissionList被调用，参数:', JSON.stringify(params));
    // 使用复数形式的路径
    return request.get('/api/admin/permissions', params);
  },
  
  // 添加权限
  addPermission(data) {
    console.log('permissionApi.addPermission被调用，数据:', JSON.stringify(data));
    return request.post('/api/admin/permissions', data);
  },
  
  // 更新权限
  updatePermission(id, data) {
    console.log('permissionApi.updatePermission被调用，ID:', id, '数据:', JSON.stringify(data));
    return request.put(`/api/admin/permissions/${id}`, data);
  },
  
  // 删除权限
  deletePermission(id) {
    console.log('permissionApi.deletePermission被调用，ID:', id);
    return request.delete(`/api/admin/permissions/${id}`);
  }
}

// 角色-权限分配相关API
const rolePermissionApi = {
  // 获取角色的权限列表
  getRolePermissions(roleId) {
    console.log('rolePermissionApi.getRolePermissions被调用，角色ID:', roleId);
    return request.get(`/api/admin/roles/${roleId}/permissions`);
  },
  
  // 分配角色权限
  assignPermissions(roleId, permissionIds) {
    console.log('rolePermissionApi.assignPermissions被调用，角色ID:', roleId, '权限IDs:', JSON.stringify(permissionIds));
    return request.post(`/api/admin/roles/${roleId}/permissions`, { permissionIds });
  }
}

// 用户-角色分配相关API
const userRoleApi = {
  // 获取用户列表(包含角色信息)
  getUserList(params) {
    return request.get('/api/admin/users/roles', params);
  },
  
  // 获取用户的角色列表
  getUserRoles(userId) {
    return request.get(`/api/admin/users/roles/${userId}`);
  },
  
  // 分配用户角色
  assignUserRoles(userId, roleIds) {
    return request.post(`/api/admin/users/roles/${userId}`, roleIds);
  },
  
  // 获取管理员列表(包含角色信息)
  getAdminList(params) {
    return request.get('/api/admin/users/roles/admin', params);
  },
  
  // 获取管理员的角色列表
  getAdminRoles(adminId) {
    return request.get(`/api/admin/users/roles/admin/${adminId}`);
  },
  
  // 分配管理员角色
  assignAdminRoles(adminId, roleIds) {
    return request.post(`/api/admin/users/roles/admin/${adminId}`, roleIds);
  }
}

export {
  roleApi,
  userApi,
  articleApi,
  permissionApi,
  rolePermissionApi,
  userRoleApi
} 