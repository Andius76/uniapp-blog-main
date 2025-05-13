<template>
	<view class="message-container">
		<!-- 顶部选项卡 -->
		<view class="tabs-container">
			<view v-for="(tab, index) in tabs" :key="index" class="tab-item" :class="{ active: currentTab === index }"
				@click="switchTab(index)">
				<view class="tab-icon">
					<uni-icons :type="tab.icon" size="24"
						:color="currentTab === index ? '#4361ee' : '#666'"></uni-icons>
				</view>
				<text class="tab-text">{{ tab.name }}</text>
			</view>
		</view>

		<!-- 消息列表 -->
		<scroll-view scroll-y class="message-list" @scrolltolower="loadMore" refresher-enabled
			:refresher-triggered="isRefreshing" @refresherrefresh="refreshList">
			
			<!-- 标记全部已读按钮 -->
			<view class="mark-all-read" v-if="messageGroups.length > 0" @click="markAllAsRead">
				<text>全部标记为已读</text>
			</view>
			
			<!-- 消息分组 -->
			<block v-for="(group, groupIndex) in messageGroups" :key="groupIndex">
				<!-- 日期分组标题 -->
				<view class="date-header">{{ group.date }}</view>
				
				<!-- 消息组列表 -->
				<view v-for="(message, messageIndex) in group.messages" :key="message.id" class="message-item"
					@click="readMessage(message)">
					<view class="message-icon" :class="{ 'like-icon': currentTab === 1 }">
						<uni-icons :type="message.icon" size="30" :color="currentTab === 1 ? '#ff6b6b' : '#666'"></uni-icons>
					</view>
					<view class="message-content">
						<view class="message-title">{{ message.title }}</view>
						<view class="message-desc">{{ message.description }}</view>
					</view>
					<view class="message-right">
						<view class="message-time">{{ message.time }}</view>
						<view class="unread-dot" v-if="!message.isRead"></view>
					</view>
				</view>
			</block>

			<!-- 无消息提示 -->
			<view v-if="messageGroups.length === 0 && !isLoading" class="no-message">
				<uni-icons type="info" size="50" color="#ddd"></uni-icons>
				<text>暂无{{ tabs[currentTab].name }}消息</text>
			</view>

			<!-- 加载状态 -->
			<view v-if="isLoading" class="loading-state">
				<text>加载中...</text>
			</view>
			
			<!-- 加载完毕提示 -->
			<view v-if="noMoreData && messageGroups.length > 0" class="loading-state">
				<text>没有更多消息了</text>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import {
		reactive,
		ref,
		onMounted,
		computed
	} from 'vue';
	// 导入uni-icons组件
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	// 导入消息API
	import { getMessages, markMessageRead, markAllMessagesRead } from '@/api/message';
	import { formatAvatarUrl } from '@/utils/format'; // 引入头像格式化工具方法

	// 检查登录状态
	const checkLoginStatus = () => {
		// 获取token
		const token = uni.getStorageSync('token');
		if (!token) {
			// 未登录，跳转到登录页
			uni.showToast({
				title: '请先登录',
				icon: 'none',
				duration: 1500
			});
			
			// 保存当前页面路径，以便登录后返回
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			const currentPath = `/${currentPage.route}`;
			const redirectUrl = encodeURIComponent(currentPath);
			
			setTimeout(() => {
				uni.navigateTo({
					url: `/pages/login/login?redirect=${redirectUrl}`
				});
			}, 1500);
			
			return false;
		}
		return true;
	};

	// 当前选中的选项卡
	const currentTab = ref(0);
	// 刷新和加载状态
	const isRefreshing = ref(false);
	const isLoading = ref(false);
	const noMoreData = ref(false);
	const currentPage = ref(1);
	const pageSize = 10; // 每页10条消息

	// 选项卡数据
	const tabs = reactive([{
			name: '系统公告',
			icon: 'sound',
			type: 'announcement',
			apiType: 0 // 对应API的消息类型
		},
		{
			name: '点赞了我',
			icon: 'heart',
			type: 'like',
			apiType: 1 // 对应API的消息类型
		},
		{
			name: '评论通知',
			icon: 'chat',
			type: 'comment',
			apiType: 3 // 对应API的消息类型
		},
		{
			name: '关注了我',
			icon: 'plus',
			type: 'subscribe',
			apiType: 2 // 对应API的消息类型
		}
	]);

	// 消息组数据
	const messageGroups = reactive([]);

	// 当前选中的选项卡类型
	const currentTabType = computed(() => {
		return tabs[currentTab.value].apiType;
	});

	/**
	 * 将API返回的消息转换为展示格式
	 * @param {Array} messages - API返回的消息列表
	 * @returns {Array} - 转换后的消息组
	 */
	const formatMessages = (messages) => {
		if (!messages || !messages.length) return [];
		
		// 按日期分组
		const groupByDate = {};
		messages.forEach(msg => {
			// 提取日期部分
			const dateStr = msg.createTime.split(' ')[0];
			if (!groupByDate[dateStr]) {
				groupByDate[dateStr] = [];
			}
			
			// 为不同类型的消息设置不同的图标
			let icon = 'notification';
			switch (msg.type) {
				case 0: // 系统公告
					icon = 'sound-filled';
					break;
				case 1: // 点赞通知
					icon = 'heart-filled';
					break;
				case 2: // 关注通知
					icon = 'person-filled';
					break;
				case 3: // 评论通知
					icon = 'chat-filled';
					break;
			}
			
			// 构建展示用的消息对象
			const formattedMessage = {
				id: msg.id,
				title: getMessageTitle(msg),
				description: msg.content,
				time: msg.createTime.split(' ')[1], // 只显示时间部分
				icon: icon,
				isRead: msg.isRead === 1, // 数据库中 0-未读，1-已读，转为布尔值
				// 保存原始消息数据，用于点击时跳转
				originalMessage: msg
			};
			
			groupByDate[dateStr].push(formattedMessage);
		});
		
		// 将分组结果转换为数组格式
		const result = [];
		Object.keys(groupByDate).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
			result.push({
				date: date,
				messages: groupByDate[date]
			});
		});
		
		return result;
	};
	
	/**
	 * 根据消息类型生成合适的标题
	 * @param {Object} message - 消息对象
	 * @returns {String} - 消息标题
	 */
	const getMessageTitle = (message) => {
		switch (message.type) {
			case 0: // 系统公告
				return '系统公告';
			case 1: // 点赞通知
				// 从fromUserInfo获取用户信息
				const fromUserName = message.fromUserInfo ? message.fromUserInfo.nickname : 
					(message.fromUserId ? `用户ID:${message.fromUserId}` : '有人');
				// 内容已经包含 "点赞了您的文章《[文章标题]》"，直接返回用户名即可
				return `${fromUserName}点赞了您的文章`;
			case 2: // 关注通知
				// 从fromUserInfo获取用户信息
				const followerName = message.fromUserInfo ? message.fromUserInfo.nickname : 
					(message.fromUserId ? `用户ID:${message.fromUserId}` : '有人');
				return `${followerName}关注了您`;
			case 3: // 评论通知
				// 从fromUserInfo获取用户信息
				const commenterName = message.fromUserInfo ? message.fromUserInfo.nickname : 
					(message.fromUserId ? `用户ID:${message.fromUserId}` : '有人');
				// 内容已经区分 "评论了您的文章" 和 "回复了您的评论"
				if (message.content.includes('回复了')) {
					return `${commenterName}回复了您`;
				} else {
					return `${commenterName}评论了您的文章`;
				}
			default:
				return '消息通知';
		}
	};

	/**
	 * 加载消息列表
	 */
	const loadMessages = () => {
		// 检查登录状态
		if (!checkLoginStatus()) return;
		
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) return;

		isLoading.value = true;
		
		// 打印当前token，帮助调试
		console.log('当前Token:', uni.getStorageSync('token'));

		// 准备请求参数
		const params = {
			type: currentTabType.value, // 当前选项卡对应的消息类型
			page: currentPage.value,
			pageSize: pageSize
		};
		
		console.log('请求参数:', params);
		
		// 调用API获取消息列表
		getMessages(params)
			.then(res => {
				console.log('消息列表返回:', res);
				if (res.code === 200) {
					// 格式化消息数据
					const formattedGroups = formatMessages(res.data.list);
					
					// 如果是首页或刷新操作，替换所有数据
					if (currentPage.value === 1) {
						messageGroups.splice(0, messageGroups.length, ...formattedGroups);
					} else {
						// 否则追加数据
						messageGroups.push(...formattedGroups);
					}
					
					// 更新页码
					currentPage.value++;
					
					// 检查是否还有更多数据
					if (res.data.list.length < pageSize) {
						noMoreData.value = true;
					}
				} else {
					// 处理API错误
					uni.showToast({
						title: res.message || '获取消息失败',
						icon: 'none'
					});
				}
			})
			.catch(err => {
				console.error('加载消息列表失败:', err);
				uni.showToast({
					title: '网络异常，请稍后再试',
					icon: 'none'
				});
			})
			.finally(() => {
				isLoading.value = false;
				
				// 如果是刷新状态，结束刷新
				if (isRefreshing.value) {
					isRefreshing.value = false;
				}
			});
	};

	/**
	 * 刷新列表
	 */
	const refreshList = () => {
		// 设置刷新状态
		isRefreshing.value = true;

		// 重置数据
		messageGroups.splice(0, messageGroups.length);
		currentPage.value = 1;
		noMoreData.value = false;

		// 重新加载
		loadMessages();
	};

	/**
	 * 加载更多
	 */
	const loadMore = () => {
		if (!noMoreData.value) {
			loadMessages();
		} else {
			uni.showToast({
				title: '没有更多消息了',
				icon: 'none',
				duration: 1500
			});
		}
	};

	/**
	 * 切换选项卡
	 * @param {Number} index - 选项卡索引
	 */
	const switchTab = (index) => {
		if (currentTab.value === index) return;

		currentTab.value = index;

		// 重置加载状态
		messageGroups.splice(0, messageGroups.length);
		currentPage.value = 1;
		noMoreData.value = false;

		// 显示加载提示
		uni.showLoading({
			title: `加载${tabs[index].name}消息`
		});

		// 加载新选项卡的消息
		loadMessages();

		// 隐藏加载提示
		setTimeout(() => {
			uni.hideLoading();
		}, 500);
	};

	/**
	 * 读取消息
	 * @param {Object} message - 消息对象
	 */
	const readMessage = (message) => {
		if (!message.isRead) {
			// 先更新UI状态，优化体验
			message.isRead = true;

			// 调用API标记消息为已读
			markMessageRead(message.id)
				.then(res => {
					if (res.code !== 200) {
						// 如果API调用失败，恢复UI状态
						message.isRead = false;
						
						// 显示错误提示
						uni.showToast({
							title: res.message || '标记已读失败',
							icon: 'none'
						});
					}
				})
				.catch(err => {
					console.error('标记消息已读失败:', err);
					// 恢复UI状态
					message.isRead = false;
				});
		}

		// 获取原始消息数据
		const originalMessage = message.originalMessage;
		if (!originalMessage) return;
		
		// 根据消息类型执行不同的跳转逻辑
		switch (originalMessage.type) {
			case 0: // 系统公告
				// 跳转到公告详情页
				uni.showToast({
					title: '暂未实现公告详情页',
					icon: 'none'
				});
				break;
				
			case 1: // 点赞通知
				// 后端设置targetId为被点赞的文章ID，便于跳转
				uni.navigateTo({
					url: `/pages/article-detail/article-detail?id=${originalMessage.targetId}`
				});
				break;
				
			case 2: // 关注通知
				// 后端设置targetId为关注者的用户ID，方便跳转到用户主页
				if (originalMessage.targetId) {
					uni.navigateTo({
						url: `/pages/user-profile/user-profile?id=${originalMessage.targetId}`
					});
				}
				break;
				
			case 3: // 评论通知
				// 后端设置targetId为评论所属的文章ID
				uni.navigateTo({
					url: `/pages/article-detail/article-detail?id=${originalMessage.targetId}`
				});
				break;
		}
	};
	
	/**
	 * 全部标记为已读
	 */
	const markAllAsRead = () => {
		// 确认对话框
		uni.showModal({
			title: '标记已读',
			content: `是否将所有${tabs[currentTab.value].name}标记为已读？`,
			success: (res) => {
				if (res.confirm) {
					// 显示加载提示
					uni.showLoading({
						title: '标记中...'
					});
					
					// 调用API标记所有消息为已读
					markAllMessagesRead(currentTabType.value)
						.then(res => {
							if (res.code === 200) {
								// 更新UI状态
								messageGroups.forEach(group => {
									group.messages.forEach(msg => {
										msg.isRead = true;
									});
								});
								
								// 显示成功提示
								uni.showToast({
									title: `已标记${res.data?.readCount || '所有'}消息为已读`,
									icon: 'success'
								});
							} else {
								// 显示错误提示
								uni.showToast({
									title: res.message || '标记已读失败',
									icon: 'none'
								});
							}
						})
						.catch(err => {
							console.error('标记所有消息已读失败:', err);
							uni.showToast({
								title: '网络异常，请稍后再试',
								icon: 'none'
							});
						})
						.finally(() => {
							uni.hideLoading();
						});
				}
			}
		});
	};

	// 页面初始化
	onMounted(() => {
		// 检查登录状态
		if (checkLoginStatus()) {
			// 加载默认选项卡的消息
			loadMessages();
		}
	});
</script>

<style lang="scss">
	page {
		background-color: #f5f5f5;
		min-height: 100%;
	}

	.message-container {
		display: flex;
		flex-direction: column;
		padding: 20px 10px;

		// 顶部选项卡样式
		.tabs-container {
			display: flex;
			justify-content: space-around;
			padding: 20rpx 0;
			background-color: #fff;
			box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			z-index: 100;
			margin-top: 0;

			.tab-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 10rpx 0;
				flex: 1;
				position: relative;

				&.active {
					.tab-text {
						color: #4361ee;
						font-weight: bold;
					}

					&::after {
						content: '';
						position: absolute;
						bottom: -10rpx;
						left: 50%;
						transform: translateX(-50%);
						width: 60rpx;
						height: 6rpx;
						background-color: #4361ee;
						border-radius: 3rpx;
					}
				}

				.tab-icon {
					margin-bottom: 10rpx;
				}

				.tab-text {
					font-size: 26rpx;
					color: #666;
				}
			}
		}

		// 消息列表样式
		.message-list {
			margin-top: 120rpx; // 为固定的tabs-container留出空间

			// 加载状态
			.loading-state {
				text-align: center;
				font-size: 24rpx;
				color: #999;
				margin: 20rpx 0;
				padding: 20rpx 0;
			}
			
			// 标记全部已读按钮
			.mark-all-read {
				text-align: center;
				font-size: 26rpx;
				color: #4361ee;
				background-color: #fff;
				padding: 20rpx 0;
				margin-bottom: 20rpx;
				border-radius: 20rpx;
				box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
				
				&:active {
					opacity: 0.7;
				}
			}
			
			// 日期分组标题
			.date-header {
				font-size: 24rpx;
				color: #999;
				padding: 20rpx 30rpx;
				position: sticky;
				top: 0;
				z-index: 1;
				background-color: #f5f5f5;
			}

			.message-item {
				display: flex;
				background-color: #fff;
				padding: 30rpx;
				margin-bottom: 20rpx;
				border-radius: 20rpx;
				box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
				position: relative;

				.message-icon {
					width: 80rpx;
					height: 80rpx;
					border-radius: 50%;
					background-color: #f0f0f0;
					display: flex;
					justify-content: center;
					align-items: center;
					margin-right: 20rpx;
					
					&.like-icon {
						background-color: rgba(255, 107, 107, 0.1);
					}
				}

				.message-content {
					flex: 1;

					.message-title {
						font-size: 28rpx;
						color: #333;
						margin-bottom: 10rpx;
						font-weight: 500;
					}

					.message-desc {
						font-size: 26rpx;
						color: #666;
						line-height: 1.4;
					}
				}

				.message-right {
					display: flex;
					flex-direction: column;
					align-items: flex-end;
					justify-content: space-between;
					min-width: 120rpx;

					.message-time {
						font-size: 24rpx;
						color: #999;
					}

					.unread-dot {
						width: 16rpx;
						height: 16rpx;
						border-radius: 50%;
						background-color: #ff6b6b;
					}
				}

				&:active {
					opacity: 0.7;
				}
			}

			// 无消息提示
			.no-message {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				padding: 100rpx 0;

				text {
					font-size: 28rpx;
					color: #999;
					margin-top: 20rpx;
				}
			}
		}
	}

	// 全局样式覆盖
	.uni-scroll-view-refresh {
		background-color: #f5f5f5 !important;

		&-inner {
			color: #fff;
		}
	}
</style>