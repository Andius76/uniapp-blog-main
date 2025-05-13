<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<!-- #ifdef H5 -->
		<view class="navbar">
			<view class="navbar-left"></view>
			<view class="navbar-title">{{ userInfo.nickname }}的粉丝</view>
			<view class="navbar-right"></view>
		</view>
		<!-- #endif -->
		<!-- 搜索框 -->
		<view class="search-box">
			<view class="search-input">
				<uni-icons type="search" size="20" color="#999"></uni-icons>
				<input type="text" v-model="searchKeyword" placeholder="搜索粉丝" @input="handleSearch"
					confirm-type="search" @confirm="handleConfirmSearch" />
				<uni-icons v-if="searchKeyword" type="clear" size="18" color="#999" @click="clearSearch"></uni-icons>
			</view>
		</view>

		<!-- 粉丝列表 -->
		<scroll-view scroll-y class="follow-list" @scrolltolower="loadMore" refresher-enabled
			:refresher-triggered="isRefreshing" @refresherrefresh="refreshList" refresher-background="#f5f5f5"
			:refresher-threshold="100" :scroll-top="scrollTop" scroll-with-animation>
			<!-- 列表内容 -->
			<view v-if="fansList.length > 0">
				<view v-for="(user, index) in fansList" :key="index" class="follow-item">
					<!-- 用户信息 -->
					<view class="user-info" @click="navigateToUserProfile(user.id)">
						<image class="avatar" :src="getAvatarUrl(user.avatar)" mode="aspectFill">
						</image>
						<view class="user-details">
							<text class="nickname">{{ user.nickname }}</text>
							<text class="bio">{{ user.bio }}</text>
						</view>
					</view>

					<!-- 关注按钮 -->
					<button class="follow-btn" :class="{'followed': user.isFollowedByMe}" @click.stop="toggleFollow(index)">
						{{ user.isFollowedByMe ? '互相关注' : '+ 关注' }}
					</button>
				</view>
			</view>

			<!-- 搜索结果为空时的提示 -->
			<view v-else-if="searchKeyword.trim() && !isLoading" class="empty-state">
				<uni-icons type="search" size="50" color="#ddd"></uni-icons>
				<text>未找到匹配"{{ searchKeyword }}"的粉丝</text>
				<view class="action-btn" @click="clearSearch">清除搜索</view>
			</view>

			<!-- 无内容提示 -->
			<view v-else-if="!isLoading" class="empty-state">
				<uni-icons type="person-filled" size="50" color="#ddd"></uni-icons>
				<text>暂无粉丝</text>
				<view class="action-btn" @click="navigateToDiscover">去发现更多</view>
			</view>

			<!-- 加载状态 -->
			<view class="loading-state">
				<text v-if="isLoading">加载中...</text>
				<text v-else-if="noMoreData && fansList.length > 0">没有更多了</text>
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
	import http from '@/utils/request.js';
	import { followUser } from '@/api/user.js';
	import { getBaseUrl } from '@/utils/request';

	// 存储定时器ID
	let searchTimer = null;
	let refreshTimeoutId = null;

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
			const baseUrl = getBaseUrl();
			
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

	// 粉丝列表数据
	const fansList = ref([]);
	const searchKeyword = ref('');
	const isLoading = ref(false);
	const isRefreshing = ref(false);
	const noMoreData = ref(false);
	const isSearching = ref(false);
	const scrollTop = ref(0);
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
		const localUserInfo = uni.getStorageSync('userInfo');
		if (localUserInfo) {
			userInfo.nickname = localUserInfo.nickname || '用户';
			userInfo.avatar = localUserInfo.avatar;
			userInfo.id = localUserInfo.id;
		}
	};

	/**
	 * 加载粉丝列表
	 */
	const loadFansList = () => {
		if (noMoreData.value || isLoading.value) return;

		isLoading.value = true;

		setTimeout(() => {
			// 调用后端API获取粉丝列表
			http.get('/api/user/fans', {
				page: currentPage,
				pageSize: pageSize,
				keyword: searchKeyword.value.trim()
			}).then(res => {
				if (res.code !== 200) {
					throw new Error(res.message || '获取粉丝列表失败');
				}
				
				const { list, total, pages } = res.data;
				
				// 处理粉丝列表数据
				const processedList = list.map(user => {
					return {
						...user,
						isFollowedByMe: user.isFollowed || false  // 设置是否已关注状态
					};
				});

				// 添加到粉丝列表
				if (currentPage === 1) {
					fansList.value = [...processedList];
				} else {
					fansList.value.push(...processedList);
				}

				// 更新页码
				currentPage++;

				// 判断是否还有更多数据
				if (list.length < pageSize || fansList.value.length >= total) {
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
				
				// 搜索结果提示
				if (isSearching.value && searchKeyword.value.trim()) {
					if (total > 0) {
						uni.showToast({
							title: `找到${total}位相关粉丝`,
							icon: 'none',
							duration: 1500
						});
					} else {
						uni.showToast({
							title: '未找到相关粉丝',
							icon: 'none',
							duration: 1500
						});
					}
					isSearching.value = false;
				}
			}).catch(err => {
				console.error('获取粉丝列表失败', err);
				uni.showToast({
					title: '获取粉丝列表失败',
					icon: 'none'
				});
			}).finally(() => {
				isLoading.value = false;
				if (isRefreshing.value) {
					if (refreshTimeoutId) {
						clearTimeout(refreshTimeoutId);
					}
					isRefreshing.value = false;
					refreshTimeoutId = null;
				}
			});
		}, 300);
	};

	/**
	 * 刷新列表
	 */
	const refreshList = () => {
		if (isRefreshing.value || isLoading.value) return;

		if (refreshTimeoutId) {
			clearTimeout(refreshTimeoutId);
			refreshTimeoutId = null;
		}

		isRefreshing.value = true;
		fansList.value = [];
		currentPage = 1;
		noMoreData.value = false;
		scrollTop.value = scrollTop.value === 0 ? 0.1 : 0;

		loadFansList();
	};

	/**
	 * 加载更多
	 */
	const loadMore = () => {
		if (!noMoreData.value) {
			loadFansList();
		}
	};

	/**
	 * 处理搜索
	 */
	const handleSearch = () => {
		if (searchTimer) {
			clearTimeout(searchTimer);
		}
		
		searchTimer = setTimeout(() => {
			isSearching.value = true;
			
			if (searchKeyword.value.trim()) {
				uni.showLoading({ title: '搜索中...' });
			}
			
			fansList.value = [];
			currentPage = 1;
			noMoreData.value = false;

			loadFansList();
			
			setTimeout(() => {
				uni.hideLoading();
			}, 500);
		}, 300);
	};
	
	/**
	 * 处理确认搜索
	 */
	const handleConfirmSearch = () => {
		if (searchTimer) {
			clearTimeout(searchTimer);
		}
		
		if (!searchKeyword.value.trim()) {
			return clearSearch();
		}
		
		isSearching.value = true;
		uni.showLoading({ title: '搜索中...' });
		
		fansList.value = [];
		currentPage = 1;
		noMoreData.value = false;
		scrollTop.value = scrollTop.value === 0 ? 0.1 : 0;
		
		loadFansList();
		
		uni.hideKeyboard();
		
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
		
		fansList.value = [];
		currentPage = 1;
		noMoreData.value = false;
		scrollTop.value = scrollTop.value === 0 ? 0.1 : 0;

		loadFansList();
	};

	/**
	 * 切换关注状态
	 */
	const toggleFollow = (index) => {
		const user = fansList.value[index];
		const currentFollowState = user.isFollowedByMe;

		// 显示加载中
		uni.showLoading({ title: currentFollowState ? '取消关注中...' : '关注中...' });
		
		// 调用关注API
		followUser(user.id, !currentFollowState).then(res => {
			if (res.code !== 200) {
				if (res.code === 409) {
					user.isFollowedByMe = true;
					uni.showToast({
						title: '已关注该用户',
						icon: 'none'
					});
					return;
				}
				throw new Error(res.message || '操作失败');
			}
			
			// 更新UI状态
			user.isFollowedByMe = !currentFollowState;
			uni.showToast({
				title: user.isFollowedByMe ? '关注成功' : '已取消关注',
				icon: 'success'
			});
		}).catch(err => {
			console.error('关注操作失败', err);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		}).finally(() => {
			uni.hideLoading();
		});
	};

	/**
	 * 跳转到用户资料页
	 */
	const navigateToUserProfile = (userId) => {
		// #ifdef H5
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		window.open(`${baseUrl}#/pages/user-profile/user-profile?id=${userId}`, '_blank');
		return;
		// #endif

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

	// 页面初始化
	onMounted(() => {
		getUserInfo();
		loadFansList();
	});
	
	// 页面卸载时清理定时器
	onUnmounted(() => {
		if (searchTimer) {
			clearTimeout(searchTimer);
			searchTimer = null;
		}
		
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

	// 粉丝列表
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
			height: 80rpx !important;
		}
	}
</style> 