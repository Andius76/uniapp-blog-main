<template>
	<!-- #ifdef H5 -->
	<view class="container">
		<!-- H5环境下的固定宽度布局，与首页文章列表区域宽度一致 -->
		<view class="article-width-container">
			<!-- 固定在顶部的用户信息和标签导航 -->
			<view class="header-fixed">
				<!-- 顶部用户信息区域 -->
				<view class="user-top-container">
					<!-- 原有用户信息区域内容 -->
					<view class="user-header">
						<view class="user-info">
							<image class="avatar" :src="formatAvatarUrl(data.userInfo.avatar)" mode="aspectFill"
								@click="uploadAvatar"></image>
							<view class="user-detail">
								<text class="nickname">{{ data.userInfo.nickname }}</text>
								<text class="email">{{ data.userInfo.email }}</text>
							</view>
						</view>
						<view class="user-actions">
							<view class="action-btn" @click="navigateTo('/pages/creation-center/creation-center')">
								创作中心
							</view>
							<view @click="navigateTo('/pages/settings/settings')">
								<uni-icons type="gear" size="24" color="#333"></uni-icons>
							</view>
						</view>
					</view>

					<!-- 用户数据统计区域 -->
					<view class="user-stats">
						<view class="stat-item" @click="handleFollowsClick">
							<text class="stat-num">{{ data.userInfo.followCount }}</text>
							<text class="stat-label">关注</text>
						</view>
						<view class="stat-divider">|</view>
						<view class="stat-item" @click="navigateTo('/pages/fans/fans')">
							<text class="stat-num">{{ data.userInfo.followerCount }}</text>
							<text class="stat-label">粉丝</text>
						</view>
						<view class="stat-divider">|</view>
						<view class="stat-item" @click="navigateTo('/pages/collection/collection')">
							<text class="stat-num">{{ data.userInfo.collectionCount }}</text>
							<text class="stat-label">收藏</text>
						</view>
					</view>

					<!-- 个人简介区域 -->
					<view class="user-bio">
						<view class="bio-content">
							<uni-icons type="person" size="20" color="#666"></uni-icons>
							<text class="bio-text">个人简介：{{ data.userInfo.bio || DEFAULT_BIO }}</text>
						</view>
						<view class="edit-profile-btn" @click="toggleBioEdit">
							编辑资料
						</view>
					</view>

					<!-- 标签页导航，使用首页的导航样式 -->
					<view class="nav-menu">
						<view v-for="(tab, index) in data.tabs" :key="index" class="nav-item"
							:class="{ active: data.currentTab === index }" @click="switchTab(index)">
							{{ tab.name }}
						</view>
					</view>
				</view>

				<!-- 内容区域 -->
				<view class="content-area">
					<!-- 使用ArticleList组件，添加v-if防止多次初始化 -->
					<ArticleList v-if="data.userInfo.id && !data.preventArticleListRender && !data.showUserSettings"
						ref="articleListRef" :key="data.currentTab"
						:list-type="data.currentTab === 0 ? 'myPosts' : 'like'" :userId="data.userInfo.id"
						:show-manage-options="true" :show-edit-for-all-users="data.currentTab === 0"
						:empty-text="data.currentTab === 0 ? '暂无发表内容' : '暂无点赞内容'" :height="'calc(100vh - 445rpx)'"
						:use-global-scroll="true" @article-click="viewArticleDetail" @like="handleLike"
						@share="handleShare" @comment="handleComment" @edit="handleEditArticle"
						@delete="handleDeleteArticle" />
				</view>
			</view>

			<!-- 使用通用的回到顶部组件 -->
			<back-to-top ref="backToTopRef" :threshold="300" :hide-after-click="true" :duration="0"
				@click="scrollToTop" />
		</view>

		<!-- 用户设置组件 -->
		<view v-if="data.showUserSettings" class="settings-overlay">
			<UserSettings :visible="data.showUserSettings" :userInfo="data.userInfo"
				:initialView="data.settingsInitialView" @update:visible="onSettingsVisibleChange"
				@avatar-change="handleAvatarChange" @nickname-change="handleNicknameChange"
				@bio-change="handleBioChange" @logout="handleLogout" />
		</view>

		<!-- 使用原生方法实现的弹窗 -->
		<view v-if="data.showBioPopup" class="native-popup-container" @click.self="closeBioPopup">
			<view class="native-popup-mask" @click.stop></view>
			<view class="native-popup-body" @click.stop>
				<view class="bio-edit-popup">
					<view class="popup-header">
						<text class="popup-title">编辑个人简介</text>
						<view class="popup-close" @click="closeBioPopup">
							<uni-icons type="close" size="22" color="#666"></uni-icons>
						</view>
					</view>
					<view class="popup-content">
						<textarea class="bio-textarea" v-model="data.editingBio" placeholder="请输入您的个人简介..."
							maxlength="200"></textarea>
						<view class="char-counter">
							<text>{{ data.editingBio.length }}/200</text>
						</view>
					</view>
					<view class="popup-footer">
						<button class="btn-cancel" @click="closeBioPopup">取消</button>
						<button class="btn-save" @click="saveUserBio">保存</button>
					</view>
				</view>
			</view>
		</view>
	</view>
	<!-- #endif -->

	<!-- #ifndef H5 -->
	<!-- 非H5环境下使用header-fixed作为根容器，移除多余的container层 -->
	<view class="header-fixed">
		<!-- 顶部用户信息区域 -->
		<view class="user-top-container">
			<!-- 原有用户信息区域内容 -->
			<view class="user-header">
				<view class="user-info">
					<image class="avatar" :src="formatAvatarUrl(data.userInfo.avatar)" mode="aspectFill"
						@click="uploadAvatar"></image>
					<view class="user-detail">
						<text class="nickname">{{ data.userInfo.nickname }}</text>
						<text class="email">{{ data.userInfo.email }}</text>
					</view>
				</view>
				<view class="user-actions">
					<view class="action-btn" @click="navigateTo('/pages/creation-center/creation-center')">
						创作中心
					</view>
					<view @click="navigateTo('/pages/settings/settings')">
						<uni-icons type="gear" size="24" color="#333"></uni-icons>
					</view>
				</view>
			</view>

			<!-- 用户数据统计区域 -->
			<view class="user-stats">
				<view class="stat-item" @click="handleFollowsClick">
					<text class="stat-num">{{ data.userInfo.followCount }}</text>
					<text class="stat-label">关注</text>
				</view>
				<view class="stat-divider">|</view>
				<view class="stat-item" @click="navigateTo('/pages/fans/fans')">
					<text class="stat-num">{{ data.userInfo.followerCount }}</text>
					<text class="stat-label">粉丝</text>
				</view>
				<view class="stat-divider">|</view>
				<view class="stat-item" @click="navigateTo('/pages/collection/collection')">
					<text class="stat-num">{{ data.userInfo.collectionCount }}</text>
					<text class="stat-label">收藏</text>
				</view>
			</view>

			<!-- 个人简介区域 -->
			<view class="user-bio">
				<view class="bio-content">
					<uni-icons type="person" size="20" color="#666"></uni-icons>
					<text class="bio-text">个人简介：{{ data.userInfo.bio || DEFAULT_BIO }}</text>
				</view>
				<view class="edit-profile-btn" @click="toggleBioEdit">
					编辑资料
				</view>
			</view>

			<!-- 标签页导航，使用首页的导航样式 -->
			<view class="nav-menu">
				<view v-for="(tab, index) in data.tabs" :key="index" class="nav-item"
					:class="{ active: data.currentTab === index }" @click="switchTab(index)">
					{{ tab.name }}
				</view>
			</view>
		</view>

		<!-- 内容区域 -->
		<view class="content-area">
			<!-- 使用ArticleList组件，添加v-if防止多次初始化 -->
			<ArticleList v-if="data.userInfo.id && !data.preventArticleListRender && !data.showUserSettings"
				ref="articleListRef" :key="data.currentTab" :list-type="data.currentTab === 0 ? 'myPosts' : 'like'"
				:userId="data.userInfo.id" :show-manage-options="true" :show-edit-for-all-users="data.currentTab === 0"
				:empty-text="data.currentTab === 0 ? '暂无发表内容' : '暂无点赞内容'" :height="'calc(100vh - 350rpx)'"
				:use-global-scroll="false" @article-click="viewArticleDetail" @like="handleLike" @share="handleShare"
				@comment="handleComment" @edit="handleEditArticle" @delete="handleDeleteArticle" />
		</view>

		<!-- 使用通用的回到顶部组件 -->
		<back-to-top ref="backToTopRef" :threshold="300" :hide-after-click="true" :duration="0" @click="scrollToTop" />

		<!-- 用户设置组件 -->
		<view v-if="data.showUserSettings" class="settings-overlay">
			<UserSettings :visible="data.showUserSettings" :userInfo="data.userInfo"
				:initialView="data.settingsInitialView" @update:visible="onSettingsVisibleChange"
				@avatar-change="handleAvatarChange" @nickname-change="handleNicknameChange"
				@bio-change="handleBioChange" @logout="handleLogout" />
		</view>

		<!-- 使用原生方法实现的弹窗 -->
		<view v-if="data.showBioPopup" class="native-popup-container" @click.self="closeBioPopup">
			<view class="native-popup-mask" @click.stop></view>
			<view class="native-popup-body" @click.stop>
				<view class="bio-edit-popup">
					<view class="popup-header">
						<text class="popup-title">编辑个人简介</text>
						<view class="popup-close" @click="closeBioPopup">
							<uni-icons type="close" size="22" color="#666"></uni-icons>
						</view>
					</view>
					<view class="popup-content">
						<textarea class="bio-textarea" v-model="data.editingBio" placeholder="请输入您的个人简介..."
							maxlength="200"></textarea>
						<view class="char-counter">
							<text>{{ data.editingBio.length }}/200</text>
						</view>
					</view>
					<view class="popup-footer">
						<button class="btn-cancel" @click="closeBioPopup">取消</button>
						<button class="btn-save" @click="saveUserBio">保存</button>
					</view>
				</view>
			</view>
		</view>
	</view>
	<!-- #endif -->
</template>

<script setup>
	import {
		reactive,
		onMounted,
		ref,
		onUnmounted,
		nextTick,
		watch,
		onBeforeMount
	} from 'vue';
	// 导入uni-icons组件
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	// 导入用户设置组件
	import UserSettings from '@/components/user-settings/user-settings.vue';
	// 导入API接口
	import {
		getUserInfo,
		updateUserProfile,
		uploadUserAvatar
	} from '@/api/user';
	import {
		deleteArticle,
		getArticleDetail
	} from '@/api/article';
	import {
		onLoad,
		onShow,
		onHide,
		onBackPress,
		onPageShow
	} from '@dcloudio/uni-app';
	// 导入ArticleList组件
	import ArticleList from '@/components/article-list/article-list.vue';
	// 导入回到顶部组件
	import BackToTop from '@/components/back-to-top/back-to-top.vue';
	import http from '@/utils/request';
	import { getBaseUrl } from '@/utils/request'; // 引入统一的getBaseUrl函数

	// 默认个人简介
	const DEFAULT_BIO = "这个人很懒，什么都没写";

	// 添加返回拦截状态控制
	const isBackGestureLocked = ref(false);
	// 存储当前页面的webview对象
	let currentWebview = null;
	// 保存原始的手势配置
	let originalGestureConfig = null;
	// 存储定时器ID
	let lockTimeoutId = null;
	// 存储刷新定时器ID
	let refreshTimeoutId = null;
	// 添加首次加载标志
	const isFirstLoad = ref(true);
	// 添加全局防抖标记，使用闭包确保跨页面刷新时重置
	const globalLoadingLock = (() => {
		let isLocked = false;
		let lockTimer = null;

		// 设置锁定方法
		const lock = (duration = 3000) => {
			if (lockTimer) clearTimeout(lockTimer);
			isLocked = true;
			lockTimer = setTimeout(() => {
				isLocked = false;
				lockTimer = null;
			}, duration);
			return true;
		};

		// 检查是否锁定
		const isActive = () => isLocked;

		// 解除锁定
		const unlock = () => {
			isLocked = false;
			if (lockTimer) {
				clearTimeout(lockTimer);
				lockTimer = null;
			}
		};

		// 重置
		const reset = () => {
			unlock();
		};

		return {
			lock,
			isActive,
			unlock,
			reset
		};
	})();

	// 使用reactive统一管理数据
	const data = reactive({
		// 用户信息
		userInfo: {
			nickname: '',
			avatar: '/static/images/avatar.png',
			followCount: 0,
			followerCount: 0,
			collectionCount: 0,
			bio: '',
			email: ''
		},

		// 标签页数据
		tabs: [{
				name: '我的发表',
				type: 'myPosts'
			},
			{
				name: '我的点赞',
				type: 'likes'
			}
		],
		currentTab: 0, // 默认选中"我的发表"选项卡

		// 用户设置面板显示状态
		showUserSettings: false,
		settingsInitialView: 'main', // 设置面板初始视图

		// 修改为使用原生弹窗的状态控制
		showBioPopup: false,
		editingBio: '',

		// 添加一个标志，用于防止重复刷新
		isRefreshing: false,

		// 添加最近请求时间戳，用于限制频率
		lastRequestTime: 0,

		// 添加控制ArticleList渲染的标志
		preventArticleListRender: true,
	});

	// 添加articleListRef引用
	const articleListRef = ref(null);
	// 添加backToTopRef引用
	const backToTopRef = ref(null);

	/**
	 * 获取基础URL
	 */
	// 已引入统一的getBaseUrl，不需要本地定义

	// 处理图片URL格式
	const formatAvatarUrl = (url) => {
		if (!url) return '/static/images/avatar.png';

		// 移除URL中可能存在的多余空格
		url = url.trim();

		// 确保不是null或undefined
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

	/**
	 * 加载用户数据和文章列表
	 * 统一的数据加载入口，确保只调用一次
	 */
	const loadUserDataAndArticles = async () => {
		// 如果已经在加载中，跳过
		if (globalLoadingLock.isActive()) {
			console.log('全局加载锁激活中，跳过加载');
			return;
		}

		// 设置加载锁，防止重复加载
		globalLoadingLock.lock(3000);

		// 设置首次加载标志
		isFirstLoad.value = true;

		// 设置刷新状态
		data.isRefreshing = true;

		// 记录请求时间
		data.lastRequestTime = Date.now();

		// 防止ArticleList渲染
		data.preventArticleListRender = true;

		console.log('=== 开始统一加载用户数据和文章 ===');

		try {
			// 显示加载提示
			uni.showLoading({
				title: '加载中...'
			});

			// 1. 获取用户信息
			const userResponse = await getUserInfo();
			if (userResponse.code === 200) {
				const processedUserInfo = processUserInfo(userResponse.data);
				data.userInfo = {
					...processedUserInfo,
					followerCount: processedUserInfo.fansCount || processedUserInfo.followerCount || 0,
					collectionCount: processedUserInfo.collectionCount || 0,
				};

				// 更新本地存储
				uni.setStorageSync('userInfo', {
					id: data.userInfo.id,
					nickname: data.userInfo.nickname,
					avatar: data.userInfo.avatar,
					email: data.userInfo.email
				});
			}

			// 2. 等待DOM更新，确保引用有效
			await nextTick();

			// 3. 延迟加载文章列表，确保组件已经完全挂载
			setTimeout(() => {
				// 允许ArticleList渲染
				data.preventArticleListRender = false;

				// 4. 等待下一个DOM更新周期，文章列表组件会自动加载
				nextTick(() => {
					console.log('文章列表组件已渲染，将自动加载数据');

					// 隐藏加载提示
					uni.hideLoading();

					// 延迟重置刷新状态
					setTimeout(() => {
						data.isRefreshing = false;
						isFirstLoad.value = false;
						console.log('重置刷新状态和首次加载标志');
					}, 2000);
				});
			}, 300);
		} catch (error) {
			console.error('统一加载失败:', error);
			uni.showToast({
				title: '加载失败，请重试',
				icon: 'none'
			});
			uni.hideLoading();

			// 出错时也要重置状态
			data.isRefreshing = false;
			isFirstLoad.value = false;
			data.preventArticleListRender = false;
			globalLoadingLock.unlock();
		}
	};

	// 在onBeforeMount阶段拦截，避免多个生命周期重复加载
	onBeforeMount(() => {
		console.log('页面开始挂载前');
		// 重置全局加载锁
		globalLoadingLock.reset();
	});

	// 页面初始化
	onMounted(async () => {
		// 使用统一的数据加载入口
		await loadUserDataAndArticles();

		// 初始化webview (只保留与数据加载无关的操作)
		// #ifdef APP-PLUS
		setTimeout(() => {
			currentWebview = plus.webview.currentWebview();
			if (currentWebview) {
				originalGestureConfig = currentWebview.getStyle().popGesture;
				console.log('初始化webview完成，原始手势配置:', originalGestureConfig);
			}
		}, 200);
		// #endif
	});

	onLoad((options) => {
		// 检查登录状态
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});

			setTimeout(() => {
				uni.redirectTo({
					url: `/pages/login/login?redirect=${encodeURIComponent('/pages/my/my')}`
				});
			}, 1500);

			return false;
		}

		// onLoad中不再重复加载数据
		console.log('页面onLoad，不重复加载数据');
	});

	// 页面显示时
	onShow(() => {
		// 如果是首次加载或者全局锁定中，跳过刷新
		if (isFirstLoad.value || globalLoadingLock.isActive()) {
			console.log('首次加载或全局锁定中，onShow跳过文章列表刷新');
			return;
		}

		// 检查请求频率限制 - 如果距离上次请求不足1秒，则跳过刷新
		const now = Date.now();
		if (now - data.lastRequestTime < 1000) {
			console.log('请求过于频繁，跳过本次刷新');
			return;
		}

		// 如果从设置页面返回，确保临时锁定手势
		if (data.showUserSettings === false && isBackGestureLocked.value) {
			console.log('页面显示，保持手势锁定');
		}

		// 打印当前用户信息，用于调试
		console.log('===== 页面显示 =====');
		console.log('当前用户ID:', data.userInfo.id);
		console.log('当前选项卡:', data.currentTab, data.tabs[data.currentTab]?.name);
		console.log('文章列表组件是否初始化:', !!articleListRef.value);

		// 每次页面显示时刷新用户信息，确保关注数量等数据最新
		refreshUserInfo();

		// 防止重复刷新文章列表 - 使用频率限制而不是标志位
		if (articleListRef.value) {
			// 记录本次请求时间
			data.lastRequestTime = now;

			// 检查组件上的加载状态 - 如果组件有自己的加载状态属性，可以进一步阻止重复加载
			// 这里需要根据实际的ArticleList组件实现来调整
			const isComponentLoading = articleListRef.value.isLoading || articleListRef.value.loading || false;

			if (!isComponentLoading && !data.isRefreshing) {
				// 设置刷新状态为true，防止短时间内重复刷新
				data.isRefreshing = true;

				console.log('检测到页面显示，刷新文章列表');
				// 设置一个小延迟，避免可能的竞态条件
				setTimeout(() => {
					articleListRef.value.resetList();
					// 添加延迟再加载文章，避免可能的并发请求
					setTimeout(() => {
						articleListRef.value.loadArticles();
					}, 50);
				}, 50);

				// 2秒后重置刷新状态，允许下次刷新
				setTimeout(() => {
					data.isRefreshing = false;
				}, 2000);
			} else if (isComponentLoading) {
				console.log('组件正在加载中，跳过本次刷新');
			} else {
				console.log('已在刷新中，跳过本次刷新');
			}
		} else {
			console.warn('文章列表组件未初始化，无法刷新');
		}
	});

	/**
	 * 刷新用户信息
	 * 用于从其他页面返回时更新关注数量等数据
	 * 使用节流控制，避免短时间内多次刷新
	 */
	const refreshUserInfo = async () => {
		// 如果已经有刷新请求在进行中，取消该请求
		if (refreshTimeoutId) {
			clearTimeout(refreshTimeoutId);
		}

		// 设置300ms的节流延迟，确保不会在页面切换时频繁请求
		refreshTimeoutId = setTimeout(async () => {
			try {
				// 无需显示loading，静默刷新
				const response = await getUserInfo();

				if (response.code === 200) {
					// 处理空的个人简介，使用默认值
					if (!response.data.bio) {
						response.data.bio = DEFAULT_BIO;
					}

					// 处理头像URL
					const processedUserInfo = processUserInfo(response.data);

					// 适配后端返回的字段名称
					const userData = {
						...processedUserInfo,
						// 后端返回fansCount，前端使用followerCount
						followerCount: processedUserInfo.fansCount || processedUserInfo
							.followerCount || 0,
						// 后端没有收藏数，默认为0
						collectionCount: processedUserInfo.collectionCount || 0,
					};

					// 检查关注数是否发生变化，有变化再更新UI
					const hasFollowCountChanged = data.userInfo.followCount !== userData.followCount;

					// 更新用户完整信息
					data.userInfo = userData;

					// 更新本地存储
					uni.setStorageSync('userInfo', {
						id: userData.id,
						nickname: userData.nickname,
						avatar: userData.avatar,
						email: userData.email
					});

					// 如果关注数量变化，在控制台输出日志方便调试
					if (hasFollowCountChanged) {
						console.log('关注数量已更新:', userData.followCount);
					}
				}
			} catch (error) {
				console.error('刷新用户信息失败:', error);
				// 静默失败，不影响用户体验
			} finally {
				refreshTimeoutId = null;
			}
		}, 300);
	};

	// 页面隐藏时(切换选项卡)
	onHide(() => {
		// 页面隐藏时，如果设置面板是打开状态，关闭它
		if (data.showUserSettings) {
			console.log('页面切换，自动关闭设置面板');
			data.showUserSettings = false;
		}
	});

	/**
	 * 处理获取到的用户信息，处理头像URL
	 * @param {Object} userInfo - 用户信息对象
	 */
	const processUserInfo = (userInfo) => {
		// 深拷贝，避免直接修改原对象
		const processedInfo = {
			...userInfo
		};

		// 处理头像URL
		if (processedInfo.avatar) {
			// 如果已经是完整的URL，直接使用
			if (processedInfo.avatar.startsWith('http')) {
				return processedInfo;
			}

			// 如果是相对路径，需要拼接基础URL
			if (processedInfo.avatar.startsWith('/')) {
				processedInfo.avatar = formatAvatarUrl(processedInfo.avatar);
			} else {
				// 如果既不是http开头也不是/开头，添加/
				processedInfo.avatar = formatAvatarUrl(processedInfo.avatar);
			}
		} else {
			// 使用默认头像
			// #ifdef APP-PLUS
			processedInfo.avatar = '/static/images/avatar.png';
			// #endif

			// #ifdef H5 || MP-WEIXIN
			processedInfo.avatar = '/static/images/avatar.png';
			// #endif
		}

		return processedInfo;
	};

	/**
	 * 修改用户头像
	 * @param {String} newAvatar - 新头像地址 
	 * @param {Function} callback - 可选的回调函数
	 */
	const handleAvatarChange = async (newAvatar, callback) => {
		try {
			uni.showLoading({
				title: '更新中...'
			});

			// 调用上传头像API
			const response = await uploadUserAvatar(newAvatar);

			if (response.code === 200) {
				// 更新本地用户信息
				data.userInfo.avatar = response.data.avatarUrl;

				uni.showToast({
					title: '头像更新成功',
					icon: 'success'
				});
				
				// 如果传入了回调函数，调用并传递成功状态
				if (typeof callback === 'function') {
					callback(true);
				}
			} else {
				throw new Error(response.message || '头像更新失败');
			}
		} catch (error) {
			console.error('头像更新失败:', error);
			
			// 获取错误信息
			const errorMessage = error.message || '头像更新失败，请重试';
			
			// 处理特定的错误
			if (errorMessage.includes('创建上传目录失败')) {
				uni.showModal({
					title: '服务器错误',
					content: '系统暂时无法保存头像，请联系管理员解决存储权限问题。',
					showCancel: false
				});
			} else {
				uni.showToast({
					title: errorMessage,
					icon: 'none'
				});
			}
			
			// 如果传入了回调函数，调用并传递失败状态和错误信息
			if (typeof callback === 'function') {
				callback(false, { 
					message: errorMessage,
					code: error.code || 500
				});
			}
		} finally {
			uni.hideLoading();
		}
	};

	/**
	 * 修改用户昵称
	 * @param {String} newNickname - 新昵称
	 */
	const handleNicknameChange = async (newNickname) => {
		try {
			uni.showLoading({
				title: '更新中...'
			});

			// 调用更新用户资料API
			const response = await updateUserProfile({
				nickname: newNickname
			});

			if (response.code === 200) {
				// 更新本地用户信息
				data.userInfo.nickname = newNickname;

				uni.showToast({
					title: '昵称更新成功',
					icon: 'success'
				});
			} else {
				throw new Error(response.message || '昵称更新失败');
			}
		} catch (error) {
			console.error('昵称更新失败:', error);
			uni.showToast({
				title: '昵称更新失败，请重试',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};

	/**
	 * 修改用户个人简介
	 * @param {String} newBio - 新个人简介
	 */
	const handleBioChange = async (newBio) => {
		try {
			uni.showLoading({
				title: '更新中...'
			});

			// 如果用户提交空简介，则使用默认值
			const bioToSubmit = newBio.trim() ? newBio : DEFAULT_BIO;

			// 调用更新用户资料API
			const response = await updateUserProfile({
				bio: bioToSubmit
			});

			if (response.code === 200) {
				// 更新本地用户信息
				data.userInfo.bio = bioToSubmit;

				uni.showToast({
					title: '个人简介更新成功',
					icon: 'success'
				});
			} else {
				throw new Error(response.message || '个人简介更新失败');
			}
		} catch (error) {
			console.error('个人简介更新失败:', error);
			uni.showToast({
				title: '个人简介更新失败，请重试',
				icon: 'none'
			});
		} finally {
			uni.hideLoading();
		}
	};

	/**
	 * 处理退出登录
	 */
	const handleLogout = () => {
		// 清除用户数据和本地缓存
		uni.removeStorageSync('token');
		uni.removeStorageSync('userInfo');

		// 跳转到登录页
		uni.reLaunch({
			url: '/pages/login/login'
		});
	};

	// 页面导航
	const navigateTo = (url) => {
		// 检查页面是否存在，这里只是模拟
		if (url.includes('creation-center')) {
			// 修改为跳转到发布页面
			uni.navigateTo({
				url: '/pages/publish/publish'
			});
			return;
		} else if (url.includes('settings')) {
			// 显示自定义设置面板
			data.showUserSettings = true;
			return;
		} else if (url.includes('follows')) {
			// 实际导航到关注列表页面
			uni.navigateTo({
				url
			});
			return;
		} else if (url.includes('fans')) {
			// #ifdef H5
			// 获取当前页面的完整URL
			const currentUrl = window.location.href;
			// 提取基础URL（去除路径部分）
			const baseUrl = currentUrl.split('#')[0];
			// 在H5环境下，使用window.open在新窗口打开粉丝列表页面
			window.open(`${baseUrl}#/pages/fans/fans`, '_blank');
			return;
			// #endif

			// 其他平台使用普通跳转
			uni.navigateTo({
				url
			});
			return;
		} else if (url.includes('collection')) {
			// #ifdef H5
			// H5环境下新开窗口跳转到收藏列表
			const currentUrl = window.location.href;
			const baseUrl = currentUrl.split('#')[0];
			const collectionUrl = `${baseUrl}#/pages/collection/collection`;
			window.open(collectionUrl, '_blank');
			return;
			// #endif
			// #ifndef H5
			// 非H5环境下正常跳转
			uni.navigateTo({
				url
			});
			return;
			// #endif
		} else if (url.includes('edit-profile')) {
			uni.showToast({
				title: '编辑个人资料',
				icon: 'none'
			});
			return;
		} else if (url.includes('article-detail')) {
			// 直接导航到文章详情页面
			uni.navigateTo({
				url
			});
			return;
		}

		// 实际跳转，当后端连接后使用
		// uni.navigateTo({ url });
	};

	/**
	 * 手动刷新文章列表，模拟浏览器刷新行为
	 */
	const refreshArticleList = () => {
		// 使用统一的加载入口进行刷新
		loadUserDataAndArticles();
	};

	/**
	 * 切换选项卡
	 * @param {Number} index - 选项卡索引
	 */
	const switchTab = (index) => {
		if (data.currentTab === index) {
			// 如果点击当前选中的选项卡，则视为刷新操作
			refreshArticleList();
			return;
		}

		data.currentTab = index;

		// 显示加载提示
		uni.showLoading({
			title: '加载中...'
		});

		// 由于添加了key属性，组件会重新创建，不需要手动调用重置和加载方法
		setTimeout(() => {
			uni.hideLoading();
		}, 500);
	};

	/**
	 * 查看文章详情
	 * @param {Number} articleId - 文章ID
	 */
	const viewArticleDetail = (articleId) => {
		// #ifdef H5
		// H5环境下，新窗口打开文章详情页
		// 获取正确的基础路径
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		const detailUrl = `${baseUrl}#/pages/article-detail/article-detail?id=${articleId}`;
		window.open(detailUrl, '_blank');
		// #endif

		// #ifndef H5
		// 非H5环境下，正常跳转
		navigateTo(`/pages/article-detail/article-detail?id=${articleId}`);
		// #endif
	};

	/**
	 * 处理收藏
	 * @param {Object} article - 文章对象
	 */
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

	/**
	 * 处理评论
	 * @param {Object} article - 文章对象
	 */
	const handleComment = (article) => {
		// 跳转到文章详情页并显示评论部分
		uni.navigateTo({
			url: `/pages/article-detail/article-detail?id=${article.id}&showComments=true`
		});
	};

	/**
	 * 处理点赞
	 * @param {Object} article - 文章对象
	 */
	const handleLike = (article) => {
		uni.showToast({
			title: article.isLiked ? '点赞成功' : '已取消点赞',
			icon: article.isLiked ? 'success' : 'none'
		});

		// TODO: 实际点赞API调用
	};

	/**
	 * 处理分享
	 * @param {Object} article - 文章对象
	 */
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
							summary: article.summary || '来自我的博客',
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

	/**
	 * 处理编辑文章
	 * @param {Object} article - 文章对象
	 */
	const handleEditArticle = (article) => {
		console.log('编辑文章', article);

		// 确保用户已登录
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			return;
		}

		// 移除作者限制检查，允许任何已登录用户编辑文章
		/* 
		// 确保是当前用户的文章
		if (article.author?.id !== data.userInfo.id) {
			uni.showToast({
				title: '只能编辑自己的文章',
				icon: 'none'
			});
			return;
		}
		*/

		// 显示编辑中的加载提示
		uni.showLoading({
			title: '准备编辑...',
			mask: true
		});

		// 获取完整的文章内容（如果需要）
		getArticleDetail(article.id)
			.then(res => {
				uni.hideLoading();

				if (res.code === 200) {
					// 准备文章数据 - 确保所有必要的字段都存在
					const articleData = {
						id: article.id,
						title: article.title || '',
						content: res.data.content || article.content || '',
						htmlContent: res.data.htmlContent || article.content || '',
						tags: article.tags || [],
						// 优先使用API响应中的coverImage，确保获取完整路径
						coverImage: res.data.coverImage || article.coverImage || '',
						// 添加额外的元数据，帮助编辑页判断
						authorId: article.author?.id,
						authorName: article.author?.nickname,
						mode: 'edit', // 显式标记为编辑模式
						originalData: JSON.stringify(res.data) // 保存原始数据用于比较变更
					};

					// 处理封面图片URL
					if (articleData.coverImage && !articleData.coverImage.startsWith('http')) {
						// 获取基础URL
						const baseUrl = (() => {
							// #ifdef APP-PLUS
							return 'http://10.9.57.7:8080'; // 安卓模拟器访问本机服务器的地址
							// #endif

							// #ifdef H5
							return 'http://localhost:8080';
							// #endif

							// #ifdef MP-WEIXIN
							return 'http://localhost:8080';
							// #endif
						})();

						if (articleData.coverImage.startsWith('/')) {
							articleData.coverImage = baseUrl + articleData.coverImage;
						} else {
							articleData.coverImage = baseUrl + '/' + articleData.coverImage;
						}
					}

					// 记录日志用于调试
					console.log('准备编辑文章数据:', articleData);

					// 使用encodeURIComponent包装数据
					const encodedData = encodeURIComponent(JSON.stringify(articleData));

					// 跳转到编辑页面
					uni.navigateTo({
						url: `/pages/publish/publish?mode=edit&articleData=${encodedData}`,
						success: () => {
							console.log('成功跳转到编辑页面');
						},
						fail: (err) => {
							console.error('跳转编辑页面失败:', err);
							uni.showToast({
								title: '打开编辑页面失败',
								icon: 'none'
							});
						}
					});
				} else {
					throw new Error(res.message || '获取文章详情失败');
				}
			})
			.catch(err => {
				console.error('准备编辑文章失败:', err);
				uni.hideLoading();

				// 使用可用的数据尝试编辑
				const fallbackData = {
					id: article.id,
					title: article.title || '',
					content: article.content || '',
					htmlContent: article.htmlContent || article.content || '',
					tags: article.tags || [],
					coverImage: article.coverImage || '',
					mode: 'edit',
					isSimpleData: true // 标记为简化数据
				};

				const encodedData = encodeURIComponent(JSON.stringify(fallbackData));

				uni.showToast({
					title: '获取完整内容失败，使用简略内容',
					icon: 'none',
					duration: 2000
				});

				setTimeout(() => {
					uni.navigateTo({
						url: `/pages/publish/publish?mode=edit&articleData=${encodedData}`,
						fail: (err) => {
							console.error('跳转编辑页面失败:', err);
							uni.showToast({
								title: '打开编辑页面失败',
								icon: 'none'
							});
						}
					});
				}, 1000);
			});
	};

	/**
	 * 处理删除文章
	 * @param {Object} article - 文章对象
	 */
	const handleDeleteArticle = async (article) => {
		console.log('删除文章', article);
		// 显示加载状态
		uni.showLoading({
			title: '正在删除...',
			mask: true
		});

		// 调用删除API
		try {
			const response = await deleteArticle(article.id);

			if (response.code === 200) {
				// 显示成功提示
				uni.showToast({
					title: '文章已删除',
					icon: 'success'
				});

				// 不立即重新加载，而是先直接从列表中移除该文章
				if (articleListRef.value) {
					// 获取内部文章列表并移除当前文章
					const articleList = articleListRef.value.getArticleList();
					const index = articleList.findIndex(item => item.id === article.id);
					if (index !== -1) {
						articleList.splice(index, 1);
					}

					// 延迟刷新整个列表
					setTimeout(() => {
						articleListRef.value.resetList();
						articleListRef.value.loadArticles();
					}, 500);
				}
			} else {
				console.error('删除失败:', response);
				uni.showToast({
					title: response.message || '删除失败，请重试',
					icon: 'none',
					duration: 2000
				});
			}
		} catch (apiError) {
			console.error('删除文章失败:', apiError);
			// 检查错误响应中是否有message
			const errorMsg = apiError.data?.message || apiError.message || '删除失败，请重试';
			uni.showToast({
				title: errorMsg,
				icon: 'none',
				duration: 2000
			});
		} finally {
			uni.hideLoading();
		}
	};

	/**
	 * 切换个人简介编辑弹窗
	 */
	const toggleBioEdit = () => {
		// 初始值为当前简介
		data.editingBio = data.userInfo.bio || DEFAULT_BIO;
		// 显示个人简介编辑弹窗
		data.showBioPopup = true;
	};

	/**
	 * 关闭个人简介编辑弹窗
	 */
	const closeBioPopup = () => {
		data.showBioPopup = false;
	};

	/**
	 * 保存用户个人简介
	 */
	const saveUserBio = async () => {
		// 如果是空字符串，则使用默认个人简介
		const bioValue = data.editingBio.trim() || DEFAULT_BIO;

		// 调用API保存个人简介
		await handleBioChange(bioValue);

		// 关闭弹窗
		closeBioPopup();
	};

	/**
	 * 禁用系统返回手势
	 */
	const disableBackGesture = () => {
		// #ifdef APP-PLUS
		try {
			// 确保获取到当前webview
			if (!currentWebview) {
				currentWebview = plus.webview.currentWebview();
			}

			// 保存原始配置（如果还没保存）
			if (!originalGestureConfig && currentWebview) {
				originalGestureConfig = currentWebview.getStyle().popGesture;
			}

			// 设置返回手势为none（禁用）
			if (currentWebview) {
				currentWebview.setStyle({
					popGesture: "none"
				});
				console.log('已禁用返回手势');
				return true;
			}
		} catch (e) {
			console.error('禁用返回手势失败:', e);
		}
		// #endif
		return false;
	};

	/**
	 * 恢复系统返回手势
	 */
	const restoreBackGesture = () => {
		// #ifdef APP-PLUS
		try {
			if (currentWebview) {
				currentWebview.setStyle({
					popGesture: originalGestureConfig || "close"
				});
				console.log('已恢复返回手势');
				return true;
			}
		} catch (e) {
			console.error('恢复返回手势失败:', e);
		}
		// #endif
		return false;
	};

	/**
	 * 临时锁定返回手势
	 * @param {Number} duration - 锁定时长（毫秒）
	 */
	const temporaryLockBackGesture = (duration = 800) => {
		isBackGestureLocked.value = true;
		disableBackGesture();

		// 清除之前的定时器
		if (lockTimeoutId) {
			clearTimeout(lockTimeoutId);
		}

		// 设置新的定时器
		lockTimeoutId = setTimeout(() => {
			isBackGestureLocked.value = false;
			restoreBackGesture();
		}, duration);
	};

	/**
	 * 监听用户设置面板显示状态变化
	 */
	watch(() => data.showUserSettings, (newVal) => {
		if (newVal) {
			// 设置面板显示，禁用返回手势
			disableBackGesture();
		} else {
			// 设置面板隐藏，临时锁定返回手势
			temporaryLockBackGesture(800);
		}
	});

	/**
	 * 拦截物理返回键
	 */
	onBackPress((e) => {
		// 如果返回手势被锁定，则拦截物理返回键
		if (isBackGestureLocked.value) {
			return true; // 拦截返回
		}

		// 如果设置面板正在显示，则关闭它而不是退出页面
		if (data.showUserSettings) {
			data.showUserSettings = false;
			return true; // 拦截返回
		}

		// 默认不拦截
		return false;
	});

	/**
	 * 处理关注列表点击
	 */
	const handleFollowsClick = () => {
		// #ifdef H5
		// 获取当前页面的完整URL
		const currentUrl = window.location.href;
		// 提取基础URL（去除路径部分）
		const baseUrl = currentUrl.split('#')[0];
		// 在H5环境下，使用window.open在新窗口打开关注列表页面
		window.open(`${baseUrl}#/pages/follows/follows`, '_blank');
		return;
		// #endif

		// 其他平台使用普通跳转
		navigateTo('/pages/follows/follows');
	};

	// 添加清理操作
	onUnmounted(() => {
		// 清理定时器
		if (lockTimeoutId) {
			clearTimeout(lockTimeoutId);
			lockTimeoutId = null;
		}

		// 清理刷新定时器
		if (refreshTimeoutId) {
			clearTimeout(refreshTimeoutId);
			refreshTimeoutId = null;
		}

		// 重置全局加载锁
		globalLoadingLock.reset();

		// 恢复原始手势设置
		restoreBackGesture();
	});

	/**
	 * 滚动到顶部
	 */
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

	/**
	 * 处理设置组件可见性变化
	 */
	const onSettingsVisibleChange = (visible) => {
		// 加入延迟设置，确保动画完成后再真正隐藏组件
		if (!visible) {
			setTimeout(() => {
				data.showUserSettings = visible;
			}, 300);
		} else {
			data.showUserSettings = visible;
		}
	};
</script>

<style lang="scss">
	/* 整体容器背景色 */
	.container {
		background-color: #f5f5f5;
		/* 与首页背景一致 */
		min-height: 100vh;
		/* 确保背景色填满整个视口高度 */
		min-width: 1000px;
		/* 与首页容器一致 */
	}

	/* 文章列表底部功能栏样式定制 */
	/* #ifdef H5 */
	.article-width-container :deep(.article-actions) {
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
				/* 移除背景颜色变化 */
				/* background-color: #f0f4ff; */

				/* 文本和图标变蓝色 */
				color: #4361ee !important;

				/* 图标变蓝色 */
				.uni-icons {
					color: #4361ee !important;
				}
			}

			/* 点赞按钮悬停特殊样式 - 使用nth-child(3)定位点赞按钮 */
			&:nth-child(3):hover {
				/* 移除背景颜色变化 */
				/* background-color: #fff0f0 !important; */

				/* 文本和图标变红色 */
				color: #ff6b6b !important;

				/* 图标变红色 */
				.uni-icons {
					color: #ff6b6b !important;
				}
			}

			/* 删除按钮悬停特殊样式 */
			&:nth-last-child(1):hover {
				/* 移除背景颜色变化 */
				/* background-color: #fff0f0 !important; */

				/* 文本和图标变红色 */
				color: #ff4d4f !important;

				/* 图标变红色 */
				.uni-icons {
					color: #ff4d4f !important;
				}
			}

			/* 编辑按钮悬停特殊样式 */
			&:nth-last-child(2):hover {
				/* 移除背景颜色变化 */
				/* background-color: #f0f4ff !important; */

				/* 文本和图标变蓝色 */
				color: #4361ee !important;

				/* 图标变蓝色 */
				.uni-icons {
					color: #4361ee !important;
				}
			}

			/* 已点赞状态 */
			.liked {
				color: #ff6b6b !important;
			}

			/* 图标和文本的间距 */
			.uni-icons+text {
				margin-left: 5px;
			}
		}
	}

	/* #endif */

	/* H5环境下的容器，宽度与首页文章列表区域一致 */
	/* #ifdef H5 */
	.article-width-container {
		min-width: 600px;
		/* 首页文章列表最小宽度 */
		width: 100%;
		max-width: 700px;
		/* 首页文章列表最大宽度 */
		margin: 0 auto;
		/* 居中显示 */
		padding: 10px 20px 20px; /* 减少顶部内边距 */
		/* 与首页main-content一致 */
		box-sizing: border-box;
		background-color: #fff;
		/* 与首页main-content一致 */
		border-radius: 4px;
		/* 与首页main-content一致 */
		min-height: 200px;
		/* 与首页main-content一致 */
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		/* 与首页相同的阴影效果 */
		margin-top: 0; /* 修改为0，防止顶部溢出 */
		/* 顶部间距 */
	}

	/* H5环境下调整header样式 */
	.article-width-container .header-fixed {
		position: relative;
		left: unset;
		right: unset;
		top: unset;
		width: 100%;
		box-shadow: none;
		background-color: transparent;
	}

	/* H5环境下调整用户信息区域 */
	.article-width-container .user-top-container {
		position: relative;
		top: unset;
		z-index: 1;
		box-shadow: none;
		background-color: transparent;
		margin-bottom: 15px;
		margin-top: 5px; /* 添加一点顶部间距 */
	}

	/* H5环境下调整内容区域 */
	.article-width-container .content-area {
		padding: 0;
		width: 100%;
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

	/* #endif */

	.user-top-container {
		position: sticky;
		top: 0;
		z-index: 100;
		background: #f5f5f5;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

		.user-header,
		.user-stats,
		.user-bio,
		.nav-menu {
			background: #fff;
			margin-top: 2rpx;
			padding: 0 30rpx;
		}
	}

	// header-fixed样式
	.header-fixed {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background-color: #f5f5f5;
		z-index: 100;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}

	// 内容区域样式
	.content-area {
		padding: 0 10rpx;
		width: 100%;
		box-sizing: border-box;
	}

	// 用户头部信息
	.user-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		background-color: #fff;

		.user-info {
			display: flex;
			align-items: center;

			.avatar {
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				margin-right: 20rpx;
				background-color: #eee;
			}

			.nickname {
				font-size: 34rpx;
				font-weight: bold;
				color: #333;
			}
		}

		.user-actions {
			display: flex;
			align-items: center;

			.action-btn {
				display: flex;
				align-items: center;
				margin-right: 50rpx;
			}
		}
	}

	// 用户统计数据
	.user-stats {
		display: flex;
		justify-content: space-around;
		padding: 20rpx 0;
		background-color: #fff;
		border-top: 1rpx solid #f0f0f0;

		.stat-item {
			display: flex;
			flex-direction: column;
			align-items: center;

			.stat-num {
				font-size: 32rpx;
				color: #333;
				font-weight: 500;
			}

			.stat-label {
				font-size: 24rpx;
				color: #666;
				margin-top: 6rpx;
			}
		}

		.stat-divider {
			color: #ddd;
			font-size: 24rpx;
			align-self: center;
		}
	}

	// 个人简介
	.user-bio {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #fff;
		margin-top: 2rpx;
		height: 100rpx;

		.bio-content {
			display: flex;
			align-items: center;
			flex: 1;
			margin-right: 20rpx;
			overflow: hidden;

			.bio-text {
				font-size: 26rpx;
				color: #666;
				margin-left: 10rpx;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				max-width: 500rpx;
			}
		}

		.edit-profile-btn {
			background-color: #f8f8f8;
			color: #666;
			font-size: 24rpx;
			padding: 10rpx 30rpx;
			border-radius: 30rpx;
			border: 1rpx solid #eee;
			flex-shrink: 0;
		}
	}

	// 导航菜单，使用首页的样式
	.nav-menu {
		display: flex;
		padding: 10rpx 30rpx 5rpx;
		background-color: #fff;
		margin-top: 2rpx;

		.nav-item {
			padding: 10rpx 24rpx;
			margin: 0 15rpx;
			font-size: 30rpx;
			color: #666;
			position: relative;

			&.active {
				color: #4361ee;
				font-weight: bold;

				&::after {
					content: '';
					position: absolute;
					bottom: -6rpx;
					left: 50%;
					transform: translateX(-50%);
					width: 30rpx;
					height: 6rpx;
					background-color: #4361ee;
					border-radius: 3rpx;
				}
			}
		}
	}

	// 全局样式覆盖
	.uni-scroll-view-refresh {
		background-color: #f5f5f5 !important;

		&-inner {
			color: #fff;
			height: 80rpx !important; // 调整刷新区域高度
		}
	}

	// 响应式样式
	@media screen and (max-width: 375px) {
		.header-fixed {
			.user-header {
				.user-info {
					.avatar {
						width: 100rpx;
						height: 100rpx;
					}

					.nickname {
						font-size: 30rpx;
					}
				}
			}

			.user-stats {
				.stat-item {
					.stat-num {
						font-size: 28rpx;
					}

					.stat-label {
						font-size: 22rpx;
					}
				}
			}
		}
	}

	/* 原生弹窗样式 */
	.native-popup-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 9999;

		.native-popup-mask {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.5);
			animation: fadeIn 0.3s ease;
		}

		.native-popup-body {
			position: relative;
			z-index: 10000;
			animation: scaleIn 0.3s ease;
		}
	}

	/* 弹窗动画 */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@keyframes scaleIn {
		from {
			transform: scale(0.8);
			opacity: 0;
		}

		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* 编辑个人简介弹窗样式 */
	.bio-edit-popup {
		width: 650rpx;
		background-color: #fff;
		border-radius: 16rpx;
		overflow: hidden;

		.popup-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 30rpx;
			border-bottom: 1rpx solid #eee;

			.popup-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
			}

			.popup-close {
				padding: 10rpx;
			}
		}

		.popup-content {
			padding: 30rpx;

			.bio-textarea {
				width: 100%;
				height: 240rpx;
				background-color: #f8f8f8;
				border: 1rpx solid #eee;
				border-radius: 10rpx;
				padding: 20rpx;
				font-size: 28rpx;
				color: #333;
			}

			.char-counter {
				text-align: right;
				font-size: 24rpx;
				color: #999;
				margin-top: 10rpx;
			}
		}

		.popup-footer {
			display: flex;
			border-top: 1rpx solid #eee;

			button {
				flex: 1;
				margin: 0;
				height: 90rpx;
				line-height: 90rpx;
				font-size: 32rpx;
				border-radius: 0;

				&.btn-cancel {
					background-color: #f5f5f5;
					color: #666;
				}

				&.btn-save {
					background-color: #4361ee;
					color: #fff;
				}
			}
		}
	}

	.settings-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: transparent;
		z-index: 9995;
	}

	/* #ifdef APP-PLUS || MP-WEIXIN */
	/* 确保在APP和小程序中用户设置组件能正确显示 */
	:deep(.user-settings-wrapper) {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		right: 0 !important;
		bottom: 0 !important;
		z-index: 9999 !important;
	}
	/* #endif */

	/* H5环境下重置基础样式，修复顶部溢出问题 */
	/* #ifdef H5 */
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
</style>