/**
 * 网络请求工具 - 管理后台专用
 * 文件位置: /src/utils/request.js
 * 
 * 该文件是整个管理应用的网络请求核心，提供以下功能：
 * 1. 专为H5平台配置基础URL
 * 2. 统一的请求头设置和管理员Token处理
 * 3. 请求拦截器 - 处理URL、请求方法、请求头和Token
 * 4. 响应拦截器 - 统一处理HTTP状态码和业务状态码
 * 5. 统一的错误处理和提示
 * 6. 封装GET、POST、PUT、DELETE等请求方法
 */

/**
 * 获取基础URL - 管理后台专用
 * @returns {string} 基础URL
 */
function getBaseUrl() {
	// 管理后台仅支持H5平台
	// 根据当前环境判断使用哪个基础URL
	if (process.env.NODE_ENV === 'development') {
		// 开发环境
		return ''; // 使用相对路径，避免跨域问题
	} else {
		// 生产环境 - 使用相对路径，依赖Nginx代理转发
		return ''; // 使用相对路径，不要指定域名
	}
}

/**
 * 请求配置
 */
const config = {
	// 基础URL
	baseUrl: getBaseUrl(),
	// 请求头
	header: {
		'Content-Type': 'application/json'
	},
	// 请求超时时间（毫秒）
	timeout: 60000,
	// 是否携带token
	withToken: true
};

/**
 * 获取管理员token
 * @returns {string} token值
 */
function getToken() {
	const token = uni.getStorageSync('admin_token') || '';
	console.log('获取admin_token: ' + (token ? token.substring(0, 20) + '...' : '无'));
	return token;
}

/**
 * 请求拦截器
 * @param {Object} options - 请求配置
 * @returns {Object} 处理后的请求配置
 */
function requestInterceptor(options) {
	// 处理请求URL
	if (!options.url.startsWith('http')) {
		options.url = `${config.baseUrl}${options.url}`;
	}

	// 处理请求方法
	options.method = (options.method || 'GET').toUpperCase();

	// 处理请求头
	options.header = {
		...config.header,
		...options.header
	};

	// 如果需要携带token
	if (config.withToken) {
		const token = getToken();
		if (token) {
			options.header['Authorization'] = `Bearer ${token}`;
			console.log('请求URL: ' + options.url);
			console.log('请求头Authorization: Bearer ' + token.substring(0, 20) + '...');
		} else {
			console.warn('警告: 管理员接口请求未携带Token');
		}
	}

	// 处理GET请求的params，转换为URL参数
	if (options.method === 'GET' && options.params) {
		const queryString = Object.keys(options.params)
			.filter(key => options.params[key] !== undefined && options.params[key] !== null)
			.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(options.params[key])}`)
			.join('&');
			
		if (queryString) {
			options.url = `${options.url}${options.url.includes('?') ? '&' : '?'}${queryString}`;
		}
		
		// params已经处理过，从options中移除
		delete options.params;
	}

	return options;
}

/**
 * 响应拦截器
 * @param {Object} response - 响应数据
 * @returns {Object|Promise} 处理后的响应数据或Promise.reject
 */
function responseInterceptor(response) {
	const {
		statusCode,
		data
	} = response;

	// HTTP状态码处理
	if (statusCode >= 200 && statusCode < 300) {
		// 处理业务状态码
		if (data.code === 200) {
			return data;
		} else {
			// 处理业务错误
			uni.showToast({
				title: data.message || '请求失败',
				icon: 'none',
				duration: 2000
			});
			console.error(`业务错误 (${data.code}): ${data.message || '未知错误'}`);
			return Promise.reject(data);
		}
	}

	// 401: 未授权，token过期或无效
	if (statusCode === 401) {
			// 清除管理员token
			uni.removeStorageSync('admin_token');
			uni.removeStorageSync('admin_info');
			uni.removeStorageSync('admin_roles');
			
			// 跳转到管理员登录页
			uni.showToast({
				title: '管理员登录已过期，请重新登录',
				icon: 'none',
				duration: 2000
			});

			setTimeout(() => {
				uni.redirectTo({
					url: '/pages/admin-login/admin-login'
				});
			}, 1500);

		return Promise.reject(new Error('登录已过期，请重新登录'));
	}

	// 403: 权限不足
	if (statusCode === 403) {
		console.error('权限不足 (403):', data);
		
		// 检查本地存储的Token和角色信息
		const token = uni.getStorageSync('admin_token');
		const roles = uni.getStorageSync('admin_roles');
		console.log('当前Token:', token ? (token.substring(0, 10) + '...') : '无');
		console.log('当前角色:', roles ? JSON.stringify(roles) : '无');
		
		uni.showToast({
			title: '权限不足，无法访问该资源',
			icon: 'none',
			duration: 2000
		});
		
		// 如果确实已登录但仍然遇到403，尝试重新登录刷新权限
		if (token) {
			setTimeout(() => {
				uni.showModal({
					title: '提示',
					content: '您的权限不足或已过期，是否重新登录?',
					confirmText: '重新登录',
					success: function(res) {
						if (res.confirm) {
							// 清除本地存储
							uni.removeStorageSync('admin_token');
							uni.removeStorageSync('admin_info');
							uni.removeStorageSync('admin_roles');
							
							// 跳转到登录页
							uni.redirectTo({
								url: '/pages/admin-login/admin-login'
							});
						}
					}
				});
			}, 500);
		}
		
		return Promise.reject(data);
	}

	// 429: 请求频率限制
	if (statusCode === 429) {
		uni.showToast({
			title: '请求过于频繁，请稍后再试',
			icon: 'none',
			duration: 2000
		});
		return Promise.reject(data);
	}

	// 其他错误
	uni.showToast({
		title: data.message || '请求失败',
		icon: 'none',
		duration: 2000
	});

	return Promise.reject(data);
}

/**
 * 请求函数
 * @param {Object} options - 请求配置
 * @returns {Promise} - 返回Promise对象
 */
function request(options) {
	// 合并请求配置
	const mergedOptions = {
		...options,
		timeout: options.timeout || config.timeout
	};

	// 请求拦截
	const interceptedOptions = requestInterceptor(mergedOptions);

	// 返回Promise
	return new Promise((resolve, reject) => {
		uni.request({
			...interceptedOptions,
			success: (res) => {
				try {
					// 响应拦截
					const result = responseInterceptor(res);
					resolve(result);
				} catch (error) {
					console.error('响应处理错误:', error);
					reject(error);
				}
			},
			fail: (err) => {
				uni.showToast({
					title: '网络请求失败',
					icon: 'none',
					duration: 2000
				});
				reject(err);
			}
		});
	});
}

// 封装HTTP方法
const http = {
	get(url, params, options = {}) {
		return request({ url, method: 'GET', params, ...options });
	},
	
	post(url, data, options = {}) {
		return request({ url, method: 'POST', data, ...options });
	},
	
	put(url, data, options = {}) {
		return request({ url, method: 'PUT', data, ...options });
	},
	
	delete(url, data, options = {}) {
		return request({ url, method: 'DELETE', data, ...options });
	},
	
	patch(url, data, options = {}) {
		return request({ url, method: 'PATCH', data, ...options });
	}
};

export default http;