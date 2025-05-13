<template>
	<!-- #ifdef H5 -->
	<view class="container">
		<view class="article-width-container">
			<!-- 用户信息区域 -->
			<view class="user-info-section">
				<view class="user-header">
					<image class="avatar" :src="getAvatarUrl(userInfo.avatar)" mode="aspectFill" @click="previewAvatar"></image>
					<view class="user-meta">
						<view class="name-and-follow">
							<text class="nickname">{{ userInfo.nickname }}</text>
							<!-- 关注按钮，当用户不是自己时显示 -->
							<button v-if="!isSelf" class="follow-btn" :class="{'followed': isFollowing}" @click="toggleFollow">
								{{ isFollowing ? '已关注' : '+ 关注' }}
							</button>
						</view>
						<view class="bio-container">
							<text class="bio-label">个人简介：</text>
							<text class="bio">{{ userInfo.bio || '这个人很懒，什么都没写~' }}</text>
						</view>
					</view>
				</view>

				<!-- 用户统计信息 -->
				<view class="user-stats">
					<view class="stat-item">
						<text class="num">{{ userInfo.postCount || 0 }}</text>
						<text class="label">发表</text>
					</view>
					<view class="stat-item">
						<text class="num">{{ userInfo.followCount || 0 }}</text>
						<text class="label">关注</text>
					</view>
					<view class="stat-item">
						<text class="num">{{ userInfo.followerCount || 0 }}</text>
						<text class="label">粉丝</text>
					</view>
				</view>
			</view>
			
			<!-- 内容区域 -->
			<view class="content-area">
				<!-- 使用ArticleList组件 -->
				<ArticleList 
					v-if="userInfo.id && isArticleListInitialized" 
					ref="articleListRef" 
					:list-type="'userPosts'" 
					:userId="userInfo.id"
					:show-manage-options="false" 
					:show-collect="true"
					:empty-text="'该用户暂无发表内容'" 
					:height="'calc(100vh - 445rpx)'"
					:use-global-scroll="true"
					@article-click="viewArticleDetail"
					@collect="handleCollect"
					@like="handleLike"
					@comment="handleComment"
					@share="handleShare"
				/>
				<view v-else-if="isLoading" class="loading-container">
					<text class="loading-text">加载中...</text>
				</view>
			</view>
			
			<!-- 使用通用的回到顶部组件 -->
			<back-to-top ref="backToTopRef" :threshold="300" :hide-after-click="true" :duration="0" @click="scrollToTop" />
		</view>
	</view>
	<!-- #endif -->
	
	<!-- #ifndef H5 -->
	<view class="container">
		<!-- 用户信息区域 -->
		<view class="user-info-section">
			<view class="user-header">
				<image class="avatar" :src="getAvatarUrl(userInfo.avatar)" mode="aspectFill" @click="previewAvatar"></image>
				<view class="user-meta">
					<view class="name-and-follow">
						<text class="nickname">{{ userInfo.nickname }}</text>
						<!-- 关注按钮，当用户不是自己时显示 -->
						<button v-if="!isSelf" class="follow-btn" :class="{'followed': isFollowing}" @click="toggleFollow">
							{{ isFollowing ? '已关注' : '+ 关注' }}
						</button>
					</view>
					<view class="bio-container">
						<text class="bio-label">个人简介：</text>
						<text class="bio">{{ userInfo.bio || '这个人很懒，什么都没写~' }}</text>
					</view>
				</view>
			</view>

			<!-- 用户统计信息 -->
			<view class="user-stats">
				<view class="stat-item">
					<text class="num">{{ userInfo.postCount || 0 }}</text>
					<text class="label">发表</text>
				</view>
				<view class="stat-item">
					<text class="num">{{ userInfo.followCount || 0 }}</text>
					<text class="label">关注</text>
				</view>
				<view class="stat-item">
					<text class="num">{{ userInfo.followerCount || 0 }}</text>
					<text class="label">粉丝</text>
				</view>
			</view>
		</view>
		
		<!-- 添加文章列表 -->
		<view class="content-area">
			<!-- 使用ArticleList组件 -->
			<ArticleList 
				v-if="userInfo.id && isArticleListInitialized" 
				ref="articleListRef" 
				:list-type="'userPosts'" 
				:userId="userInfo.id"
				:show-manage-options="false" 
				:show-collect="true"
				:empty-text="'该用户暂无发表内容'" 
				:height="'calc(100vh - 350rpx)'"
				:use-global-scroll="false"
				@article-click="viewArticleDetail"
				@collect="handleCollect"
				@like="handleLike"
				@comment="handleComment"
				@share="handleShare"
			/>
			<view v-else-if="isLoading" class="loading-container">
				<text class="loading-text">加载中...</text>
			</view>
		</view>
		
		<!-- 使用通用的回到顶部组件 -->
		<back-to-top ref="backToTopRef" :threshold="300" :hide-after-click="true" :duration="0" @click="scrollToTop" />
	</view>
	<!-- #endif -->
</template>

<script setup>
	import { reactive, ref, onMounted } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import http from '@/utils/request.js';
	import { checkUserFollow, followUser } from '@/api/user.js';
	import { getBaseUrl } from '@/utils/request'; // 引入统一的getBaseUrl函数
	// 引入文章列表组件
	import ArticleList from '@/components/article-list/article-list.vue';
	// 引入回到顶部组件
	import BackToTop from '@/components/back-to-top/back-to-top.vue';

	// 是否关注中
	const isFollowing = ref(false);
	// 是否是自己的主页
	const isSelf = ref(false);
	// 当前登录用户ID
	let currentUserId = null;
	// 文章列表引用
	const articleListRef = ref(null);
	// 添加回到顶部引用
	const backToTopRef = ref(null);
	// 添加加载状态控制，防止重复请求
	const isLoading = ref(false);
	// 添加是否已经初始化文章列表的标志
	const isArticleListInitialized = ref(false);

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

	// 用户信息
	const userInfo = reactive({
		id: '',
		nickname: '',
		avatar: '',
		bio: '',
		postCount: 0,
		followCount: 0,
		followerCount: 0,
		isFollowed: false
	});

	// 加载用户信息
	const loadUserInfo = async (userId) => {
		// 防止重复加载
		if (isLoading.value) return;
		
		try {
			isLoading.value = true;
			
			const res = await http.get(`/api/user/profile/${userId}`);
			if (res.code === 200) {
				Object.assign(userInfo, res.data);
				
				// 判断是否是自己的主页
				const localUserInfo = uni.getStorageSync('userInfo');
				if (localUserInfo) {
					currentUserId = localUserInfo.id;
					isSelf.value = Number(userId) === Number(localUserInfo.id);
				}
				
				// 如果不是自己的主页，检查是否已关注
				if (!isSelf.value) {
					checkFollowStatus();
				}
				
				// 标记文章列表可以初始化
				isArticleListInitialized.value = true;
			}
		} catch (error) {
			console.error('获取用户信息失败:', error);
			uni.showToast({
				title: '获取用户信息失败',
				icon: 'none'
			});
		} finally {
			isLoading.value = false;
		}
	};
	
	// 检查关注状态
	const checkFollowStatus = async () => {
		try {
			// 跳过自己，自己不能关注自己
			if (isSelf.value) {
				isFollowing.value = false;
				return;
			}
			
			// 尝试使用check-follow API (如果后端已实现)
			try {
				console.log('尝试检查关注状态...');
				const res = await checkUserFollow(userInfo.id);
				if (res.code === 200) {
					isFollowing.value = res.data.following;
					console.log('关注状态检查结果:', isFollowing.value);
					return;
				}
			} catch (apiError) {
				console.log('check-follow API不存在或请求失败，使用降级方案:', apiError);
			}
			
			// 降级方案1：检查用户资料中是否有isFollowed标志
			if (userInfo.isFollowed !== undefined) {
				isFollowing.value = userInfo.isFollowed;
				console.log('使用用户数据中的isFollowed:', isFollowing.value);
				return;
			}
			
			// 降级方案2：通过关注列表API检查
			console.log('尝试通过关注列表API检查关注状态...');
			try {
				// 获取关注列表第一页，检查是否包含当前用户
				const followsRes = await http.get('/api/user/follows', { 
					page: 1, 
					pageSize: 100,
					// 添加用户昵称作为搜索关键词，如果后端支持搜索功能，可以减少返回数据量
					keyword: userInfo.nickname
				});
				
				if (followsRes.code === 200) {
					const isFound = followsRes.data.list.some(user => Number(user.id) === Number(userInfo.id));
					isFollowing.value = isFound;
					console.log('通过关注列表API检查结果:', isFollowing.value);
					return;
				}
			} catch (followError) {
				console.error('获取关注列表失败:', followError);
			}
			
			// 最终降级：默认为未关注状态
			console.log('所有检查方法都失败，默认设置为未关注状态');
			isFollowing.value = false;
		} catch (error) {
			console.error('检查关注状态失败:', error);
			isFollowing.value = false;
		}
	};
	
	// 切换关注状态
	const toggleFollow = async () => {
		// 防止自己关注自己
		if (isSelf.value) {
			uni.showToast({
				title: '不能关注自己',
				icon: 'none'
			});
			return;
		}
		
		if (!userInfo.id) return;
		
		// 如果是已关注状态，弹出确认对话框
		if (isFollowing.value) {
			uni.showModal({
				title: '取消关注',
				content: `确定不再关注"${userInfo.nickname}"吗？`,
				confirmText: '确定',
				cancelText: '取消',
				success: async (res) => {
					if (res.confirm) {
						await performFollowToggle();
					}
				}
			});
		} else {
			// 如果是未关注状态，直接执行关注操作
			await performFollowToggle();
		}
	};
	
	// 执行关注/取消关注操作
	const performFollowToggle = async () => {
		try {
			uni.showLoading({ title: isFollowing.value ? '取消关注中...' : '关注中...' });
			
			// 使用followUser函数替代直接http请求
			const res = await followUser(userInfo.id, !isFollowing.value);
			
			if (res.code === 200) {
				// 更新关注状态
				isFollowing.value = !isFollowing.value;
				
				// 更新粉丝数
				userInfo.followerCount += isFollowing.value ? 1 : -1;
				
				uni.showToast({
					title: isFollowing.value ? '关注成功' : '已取消关注',
					icon: isFollowing.value ? 'success' : 'none'
				});
			} else if (res.code === 409) {
				// 处理已关注的情况
				if (!isFollowing.value) {
					isFollowing.value = true;
					uni.showToast({
						title: '已经关注过该用户',
						icon: 'none'
					});
				} else {
					uni.showToast({
						title: '您未关注该用户',
						icon: 'none'
					});
				}
			} else {
				throw new Error(res.message || '操作失败');
			}
		} catch (error) {
			console.error('关注操作失败:', error);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};

	// 查看文章详情
	const viewArticleDetail = (articleId) => {
		// #ifdef H5
		// H5环境下，新窗口打开文章详情页
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		const detailUrl = `${baseUrl}#/pages/article-detail/article-detail?id=${articleId}`;
		window.open(detailUrl, '_blank');
		// #endif

		// #ifndef H5
		// 非H5环境下，正常跳转
		uni.navigateTo({
			url: `/pages/article-detail/article-detail?id=${articleId}`
		});
		// #endif
	};
	
	// 处理收藏操作
	const handleCollect = (article) => {
		uni.showToast({
			title: article.isCollected ? '收藏成功' : '已取消收藏',
			icon: article.isCollected ? 'success' : 'none'
		});
		
		// TODO: 实际收藏API调用
		// api.collectArticle(article.id, article.isCollected).then(res => {
		//   console.log('收藏状态已更新');
		// });
	};
	
	// 处理点赞操作
	const handleLike = (article) => {
		uni.showToast({
			title: article.isLiked ? '点赞成功' : '已取消点赞',
			icon: article.isLiked ? 'success' : 'none'
		});
		
		// TODO: 实际点赞API调用
	};
	
	// 处理评论操作
	const handleComment = (article) => {
		// 跳转到文章详情页并显示评论部分
		uni.navigateTo({
			url: `/pages/article-detail/article-detail?id=${article.id}&showComments=true`
		});
	};
	
	// 处理分享操作
	const handleShare = (article) => {
		// 分享菜单
		uni.showActionSheet({
			itemList: ['分享到微信', '复制链接', '生成分享图'],
			success: (res) => {
				switch (res.tapIndex) {
					case 0: // 分享到微信
						// #ifdef APP-PLUS
						uni.share({
							provider: 'weixin',
							scene: 'WXSceneSession',
							type: 0,
							title: article.title,
							summary: article.summary || '来自博客',
							imageUrl: article.coverImage || '',
							href: `${getBaseUrl()}/article/${article.id}`,
							success: () => {
								uni.showToast({
									title: '分享成功',
									icon: 'success'
								});
							}
						});
						// #endif

						// #ifdef H5 || MP-WEIXIN
						uni.showToast({
							title: '已复制链接，请手动分享',
							icon: 'none'
						});
						uni.setClipboardData({
							data: `${getBaseUrl()}/article/${article.id}`,
							success: () => {
								console.log('链接已复制');
							}
						});
						// #endif
						break;

					case 1: // 复制链接
						uni.setClipboardData({
							data: `${getBaseUrl()}/article/${article.id}`,
							success: () => {
								uni.showToast({
									title: '链接已复制',
									icon: 'success'
								});
							}
						});
						break;

					case 2: // 生成分享图
						uni.showToast({
							title: '分享图生成中...',
							icon: 'loading',
							duration: 2000
						});

						setTimeout(() => {
							uni.showToast({
								title: '分享图已生成',
								icon: 'success'
							});
						}, 2000);
						break;
				}
			}
		});
	};
	
	// 滚动到顶部
	const scrollToTop = () => {
		// #ifdef H5
		try {
			// 使用原生window.scrollTo方法
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		} catch (e) {
			console.error('滚动到顶部失败:', e);
		}
		// #endif

		// #ifndef H5
		try {
			// 非H5环境使用uni的API
			uni.pageScrollTo({
				scrollTop: 0,
				duration: 300
			});
		} catch (e) {
			console.error('滚动到顶部失败:', e);
		}
		// #endif

		// 如果文章列表组件存在，也调用其滚动到顶部方法
		if (articleListRef.value && typeof articleListRef.value.scrollToTop === 'function') {
			articleListRef.value.scrollToTop();
		}
	};

	// 添加头像预览方法
	const previewAvatar = () => {
		// 获取完整的头像URL
		const avatarUrl = getAvatarUrl(userInfo.avatar);
		
		// 使用uni.previewImage API预览头像
		uni.previewImage({
			urls: [avatarUrl],
			current: avatarUrl,
			indicator: 'default',
			loop: false,
			success: () => {
				console.log('头像预览成功');
			},
			fail: (err) => {
				console.error('头像预览失败:', err);
				uni.showToast({
					title: '预览失败，请重试',
					icon: 'none'
				});
			}
		});
	};

	// 页面加载
	onLoad((options) => {
		if (options.id) {
			userInfo.id = options.id;
			loadUserInfo(options.id);
		} else {
			uni.showToast({
				title: '用户ID不存在',
				icon: 'none'
			});
		}
	});
</script>

<style lang="scss">
	/* 整体容器背景色 */
	.container {
		background-color: #f5f5f5;
		min-height: 100vh;
	}
	
	/* H5环境下的容器，宽度与首页文章列表区域一致 */
	/* #ifdef H5 */
	.article-width-container {
		min-width: 600px;
		width: 100%;
		max-width: 700px;
		margin: 0 auto;
		padding: 10px 20px 20px;
		box-sizing: border-box;
		background-color: #fff;
		border-radius: 4px;
		min-height: 200px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		margin-top: 0;
	}
	
	/* 添加水平滚动条样式，与首页保持一致 */
	html {
		overflow-y: scroll;
		overflow-x: auto;
		min-width: 1000px;

		&::-webkit-scrollbar {
			width: 6px;
			height: 6px;
		}

		&::-webkit-scrollbar-thumb {
			background: #ddd;
			border-radius: 3px;

			&:hover {
				background: #bbb;
			}
		}

		&::-webkit-scrollbar-track {
			background: #f5f5f5;
		}
	}

	body {
		min-width: 1000px;
	}
	
	/* H5环境下重置基础样式，修复顶部溢出问题 */
	body, html {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}

	/* 容器从页面顶部开始，防止顶部溢出 */
	.container {
		margin-top: 0;
		position: relative;
		top: 0;
	}
	/* #endif */

	.user-info-section {
		background-color: #fff;
		padding: 30rpx;
		margin-bottom: 20rpx;
		/* #ifndef H5 */
		border-radius: 12rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		margin: 20rpx;
		/* #endif */

		.user-header {
			display: flex;
			align-items: center;

			.avatar {
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				margin-right: 20rpx;
				background-color: #eee;
				flex-shrink: 0; /* 防止头像缩小 */
				border: 2rpx solid #f0f0f0;
				/* 添加手指形状光标，提示可点击 */
				cursor: pointer; 
			}

			.user-meta {
				flex: 1;
				width: 0; /* 确保宽度自适应 */
				
				.name-and-follow {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 8rpx;
					
					.nickname {
						font-size: 32rpx;
						font-weight: bold;
						color: #333;
					}
					
					.follow-btn {
						margin: 0;
						padding: 0 20rpx;
						height: 50rpx;
						line-height: 46rpx;
						font-size: 24rpx;
						background-color: #fff;
						color: #4361ee;
						border: 2rpx solid #4361ee;
						border-radius: 25rpx;
						
						&.followed {
							color: #999;
							border-color: #999;
						}
					}
				}

				.bio-container {
					display: flex;
					flex-wrap: wrap; /* 允许内容换行 */
					width: 100%; /* 确保容器占满可用空间 */
					max-width: 100%; /* 限制最大宽度 */
					
					.bio-label {
						font-size: 24rpx;
						color: #666;
						font-weight: 500;
						flex-shrink: 0; /* 防止标签缩小 */
					}
					
					.bio {
						font-size: 24rpx;
						color: #999;
						flex: 1; /* 内容自适应宽度 */
						max-width: 100%; /* 限制最大宽度 */
						line-height: 1.4; /* 保留合适的行高 */
						word-wrap: break-word; /* 允许长单词换行 */
						/* 兼容各平台 */
						/* #ifdef H5 */
						box-sizing: border-box;
						/* #endif */
						/* #ifdef MP-WEIXIN */
						box-sizing: border-box;
						/* #endif */
						/* #ifdef APP-PLUS */
						box-sizing: border-box;
						/* #endif */
					}
				}
			}
		}

		.user-stats {
			display: flex;
			justify-content: space-around;
			margin-top: 30rpx;
			padding: 20rpx 0;
			border-top: 1rpx solid #f0f0f0;

			.stat-item {
				text-align: center;

				.num {
					font-size: 32rpx;
					font-weight: bold;
					color: #333;
					display: block;
				}

				.label {
					font-size: 24rpx;
					color: #999;
					margin-top: 8rpx;
					display: block;
				}
			}
		}
	}
	
	/* 内容区域样式 */
	.content-area {
		/* #ifndef H5 */
		padding: 0 20rpx;
		background-color: #fff;
		border-radius: 12rpx;
		margin: 20rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		padding-bottom: 20rpx;
		/* #endif */
	}
	
	/* 加载状态样式 */
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100rpx;
		
		.loading-text {
			color: #999;
			font-size: 28rpx;
		}
	}
	
	/* 文章列表底部功能栏样式定制 - 从"我的"页面复制 */
	/* #ifdef H5 */
	:deep(.article-actions) {
		/* 整体样式优化 */
		border-top: 1px solid #eaeaea;
		padding: 6px 0;
		/* 使用flex布局实现均匀水平排布 */
		display: flex;
		justify-content: space-around;
		align-items: center;

		/* 操作按钮样式 */
		.action-item {
			padding: 6px 15px;
			border-radius: 4px;
			transition: all 0.3s ease;
			cursor: pointer;
			/* 居中显示内容 */
			display: flex;
			align-items: center;
			justify-content: center;
			flex: 1;
			margin: 0 2px;

			/* 图标上移并放大 */
			.uni-icons {
				margin-top: -4px;
				transform: scale(1.2);
				/* 图标放大1.2倍 */
			}

			/* 默认悬停效果 */
			&:hover {
				/* 文本和图标变蓝色 */
				color: #4361ee !important;

				/* 图标变蓝色 */
				.uni-icons {
					color: #4361ee !important;
				}
			}

			/* 点赞按钮悬停特殊样式 - 使用nth-child(3)定位点赞按钮 */
			&:nth-child(3):hover {
				/* 文本和图标变红色 */
				color: #ff6b6b !important;

				/* 图标变红色 */
				.uni-icons {
					color: #ff6b6b !important;
				}
			}

			/* 收藏按钮悬停特殊样式 */
			&:nth-child(4):hover {
				/* 文本和图标变黄色 */
				color: #ffbb00 !important;

				/* 图标变黄色 */
				.uni-icons {
					color: #ffbb00 !important;
				}
			}

			/* 已点赞状态 */
			&.liked {
				color: #ff6b6b !important;
				
				.uni-icons {
					color: #ff6b6b !important;
				}
			}
			
			/* 已收藏状态 */
			&.collected {
				color: #ffbb00 !important;
				
				.uni-icons {
					color: #ffbb00 !important;
				}
			}

			/* 图标和文本的间距 */
			.uni-icons+text {
				margin-left: 5px;
			}
		}
	}
	/* #endif */
	
	/* 非H5环境下的文章操作区样式 */
	/* #ifndef H5 */
	:deep(.article-actions) {
		border-top: 1rpx solid #eaeaea;
		padding: 10rpx 0;
		display: flex;
		justify-content: space-around;
		align-items: center;
		
		.action-item {
			display: flex;
			align-items: center;
			padding: 6rpx 15rpx;
			font-size: 24rpx;
			color: #666;
			
			.uni-icons {
				margin-right: 5rpx;
			}
			
			/* 已点赞状态 */
			&.liked {
				color: #ff6b6b;
				
				.uni-icons {
					color: #ff6b6b;
				}
			}
			
			/* 已收藏状态 */
			&.collected {
				color: #ffbb00;
				
				.uni-icons {
					color: #ffbb00;
				}
			}
		}
	}
	/* #endif */
</style>