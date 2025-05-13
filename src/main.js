import {
	createSSRApp
} from "vue";
import App from "./App.vue";

// 添加页面跳转拦截器 - 管理端专用
uni.addInterceptor('navigateTo', {
	invoke(args) {
		// 仅允许管理员登录页不需要验证
		const isAdminLoginPage = args.url.startsWith('/pages/admin-login/admin-login');
		
		// 如果不是管理员登录页且未登录，拦截跳转
		if (!isAdminLoginPage && !uni.getStorageSync('admin_token')) {
			// 未登录
			uni.showToast({
				title: '请先登录管理员账号',
				icon: 'none'
			});
			
			// 跳转到管理员登录页
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/admin-login/admin-login'
				});
			}, 1500);
			
			return false; // 阻止原导航
		}
		return args; // 继续原导航
	}
});

// 同样拦截redirectTo
uni.addInterceptor('redirectTo', {
	invoke(args) {
		// 仅允许管理员登录页不需要验证
		const isAdminLoginPage = args.url.startsWith('/pages/admin-login/admin-login');
		
		// 如果不是管理员登录页且未登录，拦截跳转
		if (!isAdminLoginPage && !uni.getStorageSync('admin_token')) {
			// 未登录
			uni.showToast({
				title: '请先登录管理员账号',
				icon: 'none'
			});
			
			// 跳转到管理员登录页
			setTimeout(() => {
				uni.redirectTo({
					url: '/pages/admin-login/admin-login'
				});
			}, 1500);
			
			return false; // 阻止原导航
		}
		return args; // 继续原导航
	}
});

export function createApp() {
	const app = createSSRApp(App);
	
	// 可以在这里添加全局配置或插件
	
	return {
		app,
	};
}
