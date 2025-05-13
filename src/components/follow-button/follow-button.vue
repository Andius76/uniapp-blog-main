<template>
	<!-- 关注按钮 -->
	<button class="follow-btn" :class="{'followed': isFollowed}" @click.stop="toggleFollow" v-if="showButton">
		{{ isFollowed ? '已关注' : '+ 关注' }}
	</button>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { followUser, checkUserFollow, getUserInfo } from '@/api/user.js'; // 导入用户API函数

// 定义组件属性
const props = defineProps({
	// 用户ID
	userId: {
		type: [Number, String],
		required: true
	},
	// 用户昵称（用于确认对话框显示）
	nickname: {
		type: String,
		default: '该用户'
	},
	// 初始关注状态
	followed: {
		type: Boolean,
		default: false
	},
	// 是否自动检查关注状态
	autoCheck: {
		type: Boolean,
		default: true
	}
});

// 定义事件
const emit = defineEmits(['follow-change', 'update:followed']);

// 关注状态
const isFollowed = ref(props.followed);
// 当前登录用户ID
const currentUserId = ref(null);
// 是否正在加载
const isLoading = ref(false);

// 计算属性：是否显示关注按钮（不能关注自己）
const showButton = computed(() => {
	// 如果是未知用户或当前用户ID未获取，默认显示
	if (!currentUserId.value) return true;
	
	// 如果是当前登录用户，不显示关注按钮
	return currentUserId.value !== Number(props.userId);
});

// 检查登录状态
const isLoggedIn = () => {
	return !!uni.getStorageSync('token');
};

// 获取当前登录用户信息
const fetchCurrentUser = async () => {
	if (!isLoggedIn()) return;
	
	try {
		const userInfo = uni.getStorageSync('userInfo');
		if (userInfo && userInfo.id) {
			currentUserId.value = userInfo.id;
		} else {
			// 如果本地存储没有，从API获取
			const res = await getUserInfo();
			if (res.code === 200 && res.data) {
				currentUserId.value = res.data.id;
				// 更新本地存储
				uni.setStorageSync('userInfo', res.data);
			}
		}
	} catch (error) {
		console.error('获取当前用户信息失败:', error);
		// 不显示错误提示，避免影响用户体验
	}
};

// 监听followed属性变化
watch(() => props.followed, (newVal) => {
	isFollowed.value = newVal;
});

/**
 * 检查关注状态
 */
const checkFollowStatus = async () => {
	// 如果没有登录或正在加载，不检查
	if (!isLoggedIn() || isLoading.value) return;
	
	// 如果没有传递用户ID，不检查
	if (!props.userId) return;
	
	// 获取当前用户信息（如果未获取）
	if (!currentUserId.value) {
		await fetchCurrentUser();
	}
	
	// 如果是当前用户自己，不需要检查关注状态
	if (currentUserId.value === Number(props.userId)) {
		return;
	}
	
	isLoading.value = true;
	
	try {
		const result = await checkUserFollow(props.userId);
		if (result.code === 200) {
			// 检查响应数据结构
			let followStatus = false;
			
			// 根据API返回的数据结构处理
			if (typeof result.data === 'boolean') {
				// 如果直接返回布尔值
				followStatus = result.data;
			} else if (result.data && typeof result.data.following === 'boolean') {
				// 如果返回对象中包含following字段
				followStatus = result.data.following;
			}
			
			// 更新状态
			isFollowed.value = followStatus;
			
			// 通知父组件状态已更新
			emit('follow-change', followStatus);
			emit('update:followed', followStatus);
			
			console.log(`用户${props.userId}的关注状态已更新为:`, followStatus);
		} else if (result.code === 404) {
			// 用户不存在，仅记录日志
			console.warn(`用户${props.userId}不存在，无法获取关注状态`);
			// 不更新UI状态，保留现有状态
		} else if (result.code === 500) {
			// 服务器错误，仅记录日志
			console.error(`检查关注状态发生服务器错误:`, result.message);
			// 不更新UI状态，保留现有状态
		}
	} catch (error) {
		// 错误处理改进：不再展示错误提示，只记录到控制台
		console.error('检查关注状态失败:', error);
		// 不更改当前的关注状态，保持原状态
	} finally {
		isLoading.value = false;
	}
};

/**
 * 切换关注状态
 */
const toggleFollow = () => {
	// 检查是否登录
	if (!isLoggedIn()) {
		uni.showToast({
			title: '请先登录',
			icon: 'none'
		});
		
		// 延迟跳转到登录页
		setTimeout(() => {
			uni.navigateTo({
				url: '/pages/login/login'
			});
		}, 1500);
		return;
	}
	
	// 防止重复点击
	if (isLoading.value) {
		return;
	}
	
	// 如果当前是已关注状态，显示系统确认弹窗
	if (isFollowed.value) {
		uni.showModal({
			title: '取消关注',
			content: `确定不再关注"${props.nickname}"吗？`,
			cancelText: '取消',
			confirmText: '确定',
			confirmColor: '#4361ee',
			success: (res) => {
				if (res.confirm) {
					// 用户点击确定，执行取消关注操作
					performFollowAction(false);
				}
				// 用户点击取消，不执行任何操作
			}
		});
	} else {
		// 当前是未关注状态，直接执行关注操作
		performFollowAction();
	}
};

/**
 * 执行关注/取消关注操作
 * @param {Boolean} isFollow - 是否关注，不传则根据当前状态取反
 */
const performFollowAction = async (isFollow = !isFollowed.value) => {
	isLoading.value = true;
	
	// 显示加载中
	uni.showLoading({ 
		title: isFollow ? '关注中...' : '取消关注中...' 
	});
	
	try {
		// 调用关注/取消关注API
		const res = await followUser(props.userId, isFollow);
		
		if (res.code === 200) {
			// 更新UI状态
			isFollowed.value = isFollow;
			
			// 触发事件通知父组件
			emit('follow-change', isFollow);
			emit('update:followed', isFollow);
			
			// 显示成功提示
			uni.showToast({
				title: isFollow ? '关注成功' : '已取消关注',
				icon: isFollow ? 'success' : 'none'
			});
		} else if (res.code === 409) {
			// 处理409错误
			isFollowed.value = !isFollow; // 恢复原来的状态
			
			uni.showToast({
				title: isFollow ? '已关注该用户' : '未关注该用户',
				icon: 'none'
			});
		} else if (res.code === 404) {
			// 特别处理404错误，避免显示"用户不存在"
			uni.showToast({
				title: '无法完成操作，请刷新页面',
				icon: 'none'
			});
		} else {
			// 其他错误，显示通用提示
			uni.showToast({
				title: '操作失败，请稍后再试',
				icon: 'none'
			});
		}
	} catch (error) {
		console.error(isFollow ? '关注失败' : '取消关注失败', error);
		// 修改错误提示，避免直接显示API返回的错误信息
		uni.showToast({
			title: '网络异常，请稍后再试',
			icon: 'none'
		});
	} finally {
		uni.hideLoading();
		isLoading.value = false;
	}
};

// 组件挂载时，获取当前用户信息并检查关注状态
onMounted(async () => {
	// 获取当前用户信息
	await fetchCurrentUser();
	
	// 如果设置了自动检查，则检查关注状态
	if (props.autoCheck) {
		checkFollowStatus();
	}
});
</script>

<style lang="scss" scoped>
.follow-btn {
	padding: 0 20rpx;
	height: 56rpx;
	line-height: 56rpx;
	font-size: 24rpx;
	color: #fff;
	background-color: #4361ee;
	border-radius: 28rpx;
	transition: all 0.3s;
	margin: 0;

	&.followed {
		background-color: #f5f6fa;
		color: #666;
		border: 1px solid #e0e0e0;
	}
	
	&:active {
		transform: scale(0.95);
	}
}

/* 响应式样式，适配不同屏幕尺寸 */
@media screen and (max-width: 375px) {
	.follow-btn {
		padding: 0 15rpx;
		font-size: 22rpx;
	}
}
</style> 