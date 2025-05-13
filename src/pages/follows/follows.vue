<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<!-- #ifdef H5 -->
		<view class="navbar">
			<view class="navbar-left"></view>
			<view class="navbar-title">{{ userInfo.nickname }}的关注</view>
			<view class="navbar-right"></view>
		</view>
		<!-- #endif -->
		<!-- 搜索框 -->
		<view class="search-box">
			<view class="search-input">
				<uni-icons type="search" size="20" color="#999"></uni-icons>
				<input type="text" v-model="searchKeyword" placeholder="搜索关注的人" @input="handleSearch"
					confirm-type="search" @confirm="handleConfirmSearch" />
				<uni-icons v-if="searchKeyword" type="clear" size="18" color="#999" @click="clearSearch"></uni-icons>
			</view>
		</view>

		<!-- 关注列表 -->
		<scroll-view scroll-y class="follow-list" @scrolltolower="loadMore" refresher-enabled
			:refresher-triggered="isRefreshing" @refresherrefresh="refreshList" refresher-background="#f5f5f5"
			:refresher-threshold="100" :scroll-top="scrollTop" scroll-with-animation>
			<!-- 列表内容 -->
			<view v-if="followList.length > 0">
				<view v-for="(user, index) in followList" :key="index" class="follow-item">
					<!-- 用户信息 -->
					<view class="user-info" @click="navigateToUserProfile(user.id)">
						<image class="avatar" :src="getAvatarUrl(user.avatar)" mode="aspectFill">
						</image>
						<view class="user-details">
							<text class="nickname">{{ user.nickname }}</text>
							<text class="bio">{{ user.bio }}</text>
						</view>
					</view>

					<!-- 关注按钮 - 参考index.vue中的样式 -->
					<button class="follow-btn" :class="{'followed': user.isFollowedByMe}" @click.stop="toggleFollow(index)">
						{{ user.isFollowedByMe ? '已关注' : '+ 关注' }}
					</button>
				</view>
			</view>

			<!-- 搜索结果为空时的提示 -->
			<view v-else-if="searchKeyword.trim() && !isLoading" class="empty-state">
				<uni-icons type="search" size="50" color="#ddd"></uni-icons>
				<text>未找到匹配"{{ searchKeyword }}"的关注</text>
				<view class="action-btn" @click="clearSearch">清除搜索</view>
			</view>

			<!-- 无内容提示 -->
			<view v-else-if="!isLoading" class="empty-state">
				<uni-icons type="person-filled" size="50" color="#ddd"></uni-icons>
				<text>暂未关注任何人</text>
				<view class="action-btn" @click="navigateToDiscover">去发现更多</view>
			</view>

			<!-- 加载状态 -->
			<view class="loading-state">
				<text v-if="isLoading">加载中...</text>
				<text v-else-if="noMoreData && followList.length > 0">没有更多了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import {
		ref,
		reactive,
		onMounted,
		onUnmounted
	} from 'vue';
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	import http from '@/utils/request.js'; // 导入封装的请求工具
	import { followUser, getUserFollows } from '@/api/user.js'; // 导入用户API函数
	import { getBaseUrl } from '@/utils/request'; // 引入统一的getBaseUrl函数

	// 基础URL配置
	const baseURL = 'http://localhost:8080';

	// 存储定时器ID
	let searchTimer = null; // 用于防抖处理
	let refreshTimeoutId = null; // 用于管理刷新状态

	// 获取头像完整URL
	const getAvatarUrl = (avatar) => {
		if (!avatar) return '/static/images/avatar.png';
		
		// 移除URL中可能存在的多余空格
		avatar = avatar.trim();
		
		// 确保不是null或undefined
		if (avatar === 'null' || avatar === 'undefined') {
			return '/static/images/avatar.png';
		}
		
		// 完整URL处理：如果已经是完整URL（包含http）则不处理
		if (avatar.startsWith('http')) {
			// 检查并修复双斜杠问题
			if (avatar.includes('//uploads')) {
				avatar = avatar.replace('//uploads', '/uploads');
			}
			return avatar;
		}
		// 静态资源处理：如果是静态资源路径则不处理
		else if (avatar.startsWith('/static')) {
			return avatar;
		}
		// 其他情况：添加基础URL前缀
		else {
			const baseUrl = getBaseUrl(); // 使用统一的获取baseUrl的方法
			
			// 处理不同格式的路径
			if (avatar.startsWith('/')) {
				return baseUrl + avatar;
			} else {
				// 确保路径中有uploads目录
				if (avatar.includes('uploads/')) {
					return baseUrl + '/' + avatar;
				} else {
					// 如果只是文件名，添加标准路径
					return baseUrl + '/uploads/avatars/' + avatar;
				}
			}
		}
	};

	// 关注列表数据
	const followList = ref([]);
	const searchKeyword = ref('');
	const isLoading = ref(false);
	const isRefreshing = ref(false);
	const noMoreData = ref(false);
	const isSearching = ref(false); // 新增：标记是否处于搜索状态
	const scrollTop = ref(0); // 控制滚动位置
	let currentPage = 1;
	const pageSize = 10;

	// 用户信息
	const userInfo = reactive({
		nickname: '',
		avatar: '',
		id: ''
	});

	/**
	 * 获取用户信息
	 */
	const getUserInfo = () => {
		// 从本地存储获取用户信息
		const localUserInfo = uni.getStorageSync('userInfo');
		if (localUserInfo) {
			userInfo.nickname = localUserInfo.nickname || '用户';
			userInfo.avatar = localUserInfo.avatar;
			userInfo.id = localUserInfo.id;
		}
	};

	/**
	 * 加载关注列表
	 */
	const loadFollowList = () => {
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) return;

		isLoading.value = true;

		// 模拟API请求延迟，使刷新时间稍长，增加感知
		setTimeout(() => {
			// 调用后端API获取关注列表
			getUserFollows({
				page: currentPage,
				pageSize: pageSize,
				keyword: searchKeyword.value.trim() // 搜索前去除前后空格
			}).then(res => {
				if (res.code !== 200) {
					throw new Error(res.message || '获取关注列表失败');
				}
				
				const { list, total, pages } = res.data;
				
				// 确保列表中的所有用户都设置为已关注状态
				const processedList = list.map(user => {
					return {
						...user,
						isFollowedByMe: true  // 默认为已关注状态
					};
				});

				// 添加到关注列表
				if (currentPage === 1) {
					followList.value = [...processedList];
				} else {
					followList.value.push(...processedList);
				}

				// 更新页码
				currentPage++;

				// 如果获取的数据不足一页，标记为没有更多数据
				if (list.length < pageSize || followList.value.length >= total) {
					noMoreData.value = true;
				}
				
				// 刷新成功提示
				if (isRefreshing.value) {
					uni.showToast({
						title: '刷新成功',
						icon: 'none',
						duration: 1000
					});
				}
				
				// 如果是搜索操作，显示搜索结果数量
				if (isSearching.value && searchKeyword.value.trim()) {
					if (total > 0) {
						uni.showToast({
							title: `找到${total}位相关用户`,
							icon: 'none',
							duration: 1500
						});
					} else {
						uni.showToast({
							title: '未找到相关用户',
							icon: 'none',
							duration: 1500
						});
					}
					isSearching.value = false;
				}
			}).catch(err => {
				console.error('获取关注列表失败', err);
				
				// 显示错误提示
				uni.showToast({
					title: '获取关注列表失败',
					icon: 'none'
				});
			}).finally(() => {
				isLoading.value = false;
				
				// 如果是刷新状态，立即结束刷新状态
				if (isRefreshing.value) {
					// 清除之前的定时器
					if (refreshTimeoutId) {
						clearTimeout(refreshTimeoutId);
					}
					
					// 立即结束刷新状态
					isRefreshing.value = false;
					refreshTimeoutId = null;
				}
			});
		}, 300); // 减少模拟延迟时间，提高响应速度
	};

	/**
	 * 刷新列表
	 */
	const refreshList = () => {
		// 如果已经在刷新或加载中，则不处理
		if (isRefreshing.value || isLoading.value) return;

		// 清除之前的刷新定时器
		if (refreshTimeoutId) {
			clearTimeout(refreshTimeoutId);
			refreshTimeoutId = null;
		}

		// 设置刷新状态
		isRefreshing.value = true;

		// 重置数据
		followList.value = [];
		currentPage = 1;
		noMoreData.value = false;
		// 重置滚动位置，触发滚动到顶部
		scrollTop.value = scrollTop.value === 0 ? 0.1 : 0;

		// 重新加载
		loadFollowList();
	};

	/**
	 * 加载更多
	 */
	const loadMore = () => {
		if (!noMoreData.value) {
			loadFollowList();
		}
	};

	/**
	 * 处理搜索（添加防抖处理）
	 */
	const handleSearch = () => {
		// 清除之前的定时器
		if (searchTimer) {
			clearTimeout(searchTimer);
		}
		
		// 设置防抖延迟，300毫秒后执行搜索
		searchTimer = setTimeout(() => {
			isSearching.value = true;
			
			// 显示搜索中提示
			if (searchKeyword.value.trim()) {
				uni.showLoading({ title: '搜索中...' });
			}
			
			// 重置数据
			followList.value = [];
			currentPage = 1;
			noMoreData.value = false;

			// 重新加载
			loadFollowList();
			
			// 隐藏加载提示
			setTimeout(() => {
				uni.hideLoading();
			}, 500);
		}, 300);
	};
	
	/**
	 * 处理确认搜索（回车键触发）
	 */
	const handleConfirmSearch = () => {
		// 清除定时器，避免重复搜索
		if (searchTimer) {
			clearTimeout(searchTimer);
		}
		
		// 如果输入为空，则重置搜索
		if (!searchKeyword.value.trim()) {
			return clearSearch();
		}
		
		isSearching.value = true;
		uni.showLoading({ title: '搜索中...' });
		
		// 重置数据
		followList.value = [];
		currentPage = 1;
		noMoreData.value = false;
		// 重置滚动位置，触发滚动到顶部
		scrollTop.value = scrollTop.value === 0 ? 0.1 : 0;
		
		// 重新加载
		loadFollowList();
		
		// 隐藏键盘
		uni.hideKeyboard();
		
		// 延迟隐藏加载提示
		setTimeout(() => {
			uni.hideLoading();
		}, 500);
	};

	/**
	 * 清除搜索
	 */
	const clearSearch = () => {
		searchKeyword.value = '';
		isSearching.value = true;
		
		// 重置数据
		followList.value = [];
		currentPage = 1;
		noMoreData.value = false;
		// 重置滚动位置，触发滚动到顶部
		scrollTop.value = scrollTop.value === 0 ? 0.1 : 0;

		// 重新加载
		loadFollowList();
	};

	/**
	 * 切换关注状态
	 * @param {Number} index - 用户索引
	 */
	const toggleFollow = (index) => {
		const user = followList.value[index];
		const currentFollowState = user.isFollowedByMe;

		// 如果当前是已关注状态，执行取消关注操作
		if (currentFollowState) {
			// 显示确认对话框
			uni.showModal({
				title: '取消关注',
				content: `确定不再关注"${user.nickname}"吗？`,
				success: (res) => {
					if (res.confirm) {
						// 显示加载中
						uni.showLoading({ title: '取消关注中...' });
						
						// 调用取消关注API
						followUser(user.id, false).then(res => {
							if (res.code !== 200) {
								throw new Error(res.message || '取消关注失败');
							}
							
							// 更新UI状态
							user.isFollowedByMe = false;
							uni.showToast({
								title: '已取消关注',
								icon: 'none'
							});
							
							// 从列表中移除该用户（改善用户体验）
							setTimeout(() => {
								followList.value = followList.value.filter(item => item.id !== user.id);
								if (followList.value.length === 0 && !isSearching.value) {
									// 刷新列表显示空状态
									refreshList();
								}
							}, 500);
						}).catch(err => {
							console.error('取消关注失败', err);
							uni.showToast({
								title: '取消关注失败，请重试',
								icon: 'none'
							});
						}).finally(() => {
							uni.hideLoading();
						});
					}
				}
			});
		} else {
			// 当前是未关注状态，执行关注操作
			uni.showLoading({ title: '关注中...' });
			
			// 调用关注API
			followUser(user.id, true).then(res => {
				if (res.code !== 200) {
					// 处理409已关注的情况，不作为错误处理
					if (res.code === 409) {
						// 如果后端返回已关注，直接更新UI状态为已关注
						user.isFollowedByMe = true;
						uni.showToast({
							title: '已关注该用户',
							icon: 'none'
						});
						return;
					}
					throw new Error(res.message || '关注失败');
				}
				
				// 更新UI状态
				user.isFollowedByMe = true;
				uni.showToast({
					title: '关注成功',
					icon: 'success'
				});
			}).catch(err => {
				console.error('关注失败', err);
				uni.showToast({
					title: '关注失败，请重试',
					icon: 'none'
				});
			}).finally(() => {
				uni.hideLoading();
			});
		}
	};

	/**
	 * 跳转到用户资料页
	 * @param {Number} userId - 用户ID
	 */
	const navigateToUserProfile = (userId) => {
		// #ifdef H5
		// 获取当前页面的完整URL
		const currentUrl = window.location.href;
		// 提取基础URL（去除路径部分）
		const baseUrl = currentUrl.split('#')[0];
		// 在H5环境下，使用window.open在新窗口打开用户资料页
		window.open(`${baseUrl}#/pages/user-profile/user-profile?id=${userId}`, '_blank');
		return;
		// #endif

		// 其他平台使用普通跳转
		uni.navigateTo({
			url: `/pages/user-profile/user-profile?id=${userId}`
		});
	};

	/**
	 * 跳转到发现页面
	 */
	const navigateToDiscover = () => {
		uni.switchTab({
			url: '/pages/index/index'
		});
	};

	/**
	 * 返回上一页
	 */
	const goBack = () => {
		// 获取当前页面栈
		const pages = getCurrentPages();
		if (pages.length > 1) {
			// 如果有上一页，则直接返回
			uni.navigateBack();
		} else {
			// 如果没有上一页，则跳转到我的页面
			uni.switchTab({
				url: '/pages/my/my'
			});
		}
	};

	// 页面初始化
	onMounted(() => {
		getUserInfo();
		// 加载关注列表
		loadFollowList();
	});
	
	// 页面卸载时清理定时器
	onUnmounted(() => {
		// 清理搜索定时器
		if (searchTimer) {
			clearTimeout(searchTimer);
			searchTimer = null;
		}
		
		// 清理刷新定时器
		if (refreshTimeoutId) {
			clearTimeout(refreshTimeoutId);
			refreshTimeoutId = null;
		}
	});
</script>

<style lang="scss">
	.container {
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	// 顶部导航栏
	.navbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 90rpx;
		padding: 0 30rpx;
		background-color: #fff;
		border-bottom: 1rpx solid #f0f0f0;
		position: sticky;
		top: 0;
		z-index: 100;

		.navbar-left,
		.navbar-right {
			width: 60rpx;
			display: flex;
			align-items: center;
		}

		.navbar-title {
			font-size: 34rpx;
			font-weight: bold;
			color: #333;
		}
	}

	// 搜索框
	.search-box {
		padding: 20rpx 30rpx;
		background-color: #fff;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

		.search-input {
			display: flex;
			align-items: center;
			background-color: #f5f5f5;
			border-radius: 36rpx;
			padding: 14rpx 24rpx;

			.uni-icons {
				margin-right: 10rpx;
			}

			input {
				flex: 1;
				height: 60rpx;
				font-size: 28rpx;
			}
		}
	}

	// 关注列表
	.follow-list {
		height: calc(100vh - 210rpx);

		.follow-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx;
			margin-bottom: 2rpx;
			background-color: #fff;
			height: 160rpx;

			.user-info {
				flex: 1;
				display: flex;
				align-items: center;

				.avatar {
					width: 100rpx;
					height: 100rpx;
					border-radius: 50%;
					background-color: #eee;
					margin-right: 20rpx;
					flex-shrink: 0;
				}

				.user-details {
					flex: 1;
					width: 0;
					overflow: hidden;

					.nickname {
						font-size: 30rpx;
						color: #333;
						font-weight: 500;
						margin-bottom: 6rpx;
						display: block;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}

					.bio {
						font-size: 24rpx;
						color: #666;
						display: block;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						max-width: 420rpx;
						line-height: 1.2;
					}
				}
			}

			.follow-btn {
				height: 50rpx;
				line-height: 50rpx;
				background-color: #fff;
				color: #4361ee;
				font-size: 24rpx;
				border: 2rpx solid #4361ee;
				border-radius: 25rpx;
				padding: 0 20rpx;
				min-width: 120rpx;
				flex-shrink: 0;

				&.followed {
					color: #999;
					border-color: #999;
				}
			}
		}
	}

	// 空状态
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;

		text {
			font-size: 28rpx;
			color: #999;
			margin-top: 20rpx;
			margin-bottom: 30rpx;
			text-align: center;
			padding: 0 40rpx;
		}

		.action-btn {
			padding: 16rpx 40rpx;
			background-color: #4361ee;
			color: #fff;
			border-radius: 30rpx;
			font-size: 28rpx;
		}
	}

	// 加载状态
	.loading-state {
		text-align: center;
		font-size: 24rpx;
		color: #999;
		padding: 20rpx 0;
	}
	
	// 自定义刷新区域样式
	:deep(.uni-scroll-view-refresh) {
		background-color: #f5f5f5 !important;
	}
	
	// 提供默认样式，兼容性更好
	.uni-scroll-view-refresh {
		background-color: #f5f5f5 !important;
		
		&-inner {
			color: #fff;
			height: 80rpx !important; // 调整刷新区域高度
		}
	}
</style>