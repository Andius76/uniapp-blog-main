<template>
	<view class="article-list-container">
		<!-- H5模式下显示网格布局 -->
		<!-- #ifdef H5 -->
		<template v-if="!props.useGlobalScroll">
			<scroll-view scroll-y class="article-scroll" id="article-list-scroll-h5" @scrolltolower="handleLoadMore"
				:refresher-enabled="true" :refresher-triggered="isRefreshing" @refresherrefresh="handleRefresh"
				:refresher-threshold="100" refresher-background="#f5f5f5" :style="{height: props.height || '100vh'}"
				@scroll="handleScroll" :scroll-top="scrollTop" :show-scrollbar="true" :enable-flex="true" :bounce="true"
				:enhanced="true" :scroll-with-animation="true" @touchstart="handleTouchStart"
				@touchmove="handleTouchMove" @touchend="handleTouchEnd">
				<!-- 网格布局文章列表 -->
				<view class="article-grid">
					<view v-for="(article, index) in articleList" :key="article.id" class="article-grid-item">
						<!-- 文章内容 -->
						<view class="article-content" @click="handleArticleClick(article.id)"
							:class="{'no-cover': !article.coverImage}">
							<!-- 封面图片 - 仅当有封面时才显示 -->
							<view class="article-image" v-if="article.coverImage">
								<image :src="article.coverImage" mode="aspectFill" class="grid-image"
									@error="handleImageError(index)"></image>
							</view>

							<!-- 文章标题和简介 -->
							<view class="article-info">
								<text class="article-title">{{article.title}}</text>

								<!-- 文章简介 -->
								<rich-text class="article-summary" :nodes="formatSummary(article.summary)"></rich-text>

								<!-- 文章标签 -->
								<view class="article-tags" v-if="article.tags && article.tags.length > 0">
									<view v-for="(tag, tagIndex) in article.tags" :key="tagIndex" class="tag-item"
										@click.stop="handleTagClick(tag)">
										#{{tag}}
									</view>
								</view>
							</view>
						</view>

						<!-- 文章操作按钮 -->
						<view class="article-actions">
							<!-- 分享按钮 -->
							<view class="action-item" @click.stop="handleShare(index)">
								<uni-icons type="redo-filled" size="20" color="#000"></uni-icons>
							</view>

							<!-- 评论按钮 -->
							<view class="action-item" @click.stop="handleComment(index)">
								<uni-icons type="chat" size="20" color="#000"></uni-icons>
								<text>{{article.commentCount !== undefined ? article.commentCount : 0}}</text>
							</view>

							<!-- 点赞按钮 -->
							<view class="action-item" @click.stop="handleLike(index)">
								<uni-icons :type="article.isLiked ? 'heart-filled' : 'heart'" size="20"
									:color="article.isLiked ? '#ff6b6b' : '#000'"></uni-icons>
								<text
									:class="{'liked': article.isLiked}">{{article.likeCount !== undefined ? article.likeCount : 0}}</text>
							</view>

							<!-- 编辑按钮（根据权限条件显示） -->
							<view class="action-item manage-btn"
								v-if="showManageOptions && (isCurrentUser(article.author?.id) || props.showEditForAllUsers)"
								@click.stop="handleEdit(index)">
								<uni-icons type="compose" size="20" color="#000"></uni-icons>
							</view>

							<!-- 删除按钮（当显示管理选项且是当前用户的文章时） -->
							<view class="action-item manage-btn"
								v-if="showManageOptions && isCurrentUser(article.author?.id)"
								@click.stop="handleDelete(index)">
								<uni-icons type="trash" size="20" color="#000"></uni-icons>
							</view>
						</view>
					</view>
				</view>

				<!-- 加载状态 -->
				<view class="loading-state">
					<text v-if="isLoading && !isRefreshing">加载中...</text>
					<text v-else-if="noMoreData && articleList.length > 0">没有更多文章了</text>
					<text v-else-if="articleList.length > 0">↓向下滑动加载更多文章↓</text>

					<!-- 无内容提示 -->
					<view v-if="articleList.length === 0 && !isLoading" class="no-content">
						<uni-icons type="info" size="50" color="#ddd"></uni-icons>
						<text>{{ emptyText }}</text>
					</view>
				</view>

				<!-- 回到顶部按钮 -->
				<view v-if="showBackTop" class="back-to-top" @click="scrollToTop">
					<uni-icons type="top" size="20" color="#fff"></uni-icons>
				</view>
			</scroll-view>
		</template>
		<template v-else>
			<!-- 全局滚动模式 -->
			<view class="article-grid global-scroll">
				<!-- 网格布局文章列表 -->
				<view v-for="(article, index) in articleList" :key="article.id" class="article-grid-item">
					<!-- 文章内容 -->
					<view class="article-content" @click="handleArticleClick(article.id)"
						:class="{'no-cover': !article.coverImage}">
						<!-- 封面图片 - 仅当有封面时才显示 -->
						<view class="article-image" v-if="article.coverImage">
							<image :src="article.coverImage" mode="aspectFill" class="grid-image"
								@error="handleImageError(index)"></image>
						</view>

						<!-- 文章标题和简介 -->
						<view class="article-info">
							<text class="article-title">{{article.title}}</text>

							<!-- 文章简介 -->
							<rich-text class="article-summary" :nodes="formatSummary(article.summary)"></rich-text>

							<!-- 文章标签 -->
							<view class="article-tags" v-if="article.tags && article.tags.length > 0">
								<view v-for="(tag, tagIndex) in article.tags" :key="tagIndex" class="tag-item"
									@click.stop="handleTagClick(tag)">
									#{{tag}}
								</view>
							</view>
						</view>
					</view>

					<!-- 文章操作按钮 -->
					<view class="article-actions">
						<!-- 分享按钮 -->
						<view class="action-item" @click.stop="handleShare(index)">
							<uni-icons type="redo-filled" size="20" color="#000"></uni-icons>
						</view>

						<!-- 评论按钮 -->
						<view class="action-item" @click.stop="handleComment(index)">
							<uni-icons type="chat" size="20" color="#000"></uni-icons>
							<text>{{article.commentCount !== undefined ? article.commentCount : 0}}</text>
						</view>

						<!-- 点赞按钮 -->
						<view class="action-item" @click.stop="handleLike(index)">
							<uni-icons :type="article.isLiked ? 'heart-filled' : 'heart'" size="20"
								:color="article.isLiked ? '#ff6b6b' : '#000'"></uni-icons>
							<text
								:class="{'liked': article.isLiked}">{{article.likeCount !== undefined ? article.likeCount : 0}}</text>
						</view>

						<!-- 编辑按钮（根据权限条件显示） -->
						<view class="action-item manage-btn"
							v-if="showManageOptions && (isCurrentUser(article.author?.id) || props.showEditForAllUsers)"
							@click.stop="handleEdit(index)">
							<uni-icons type="compose" size="20" color="#000"></uni-icons>
						</view>

						<!-- 删除按钮（当显示管理选项且是当前用户的文章时） -->
						<view class="action-item manage-btn"
							v-if="showManageOptions && isCurrentUser(article.author?.id)"
							@click.stop="handleDelete(index)">
							<uni-icons type="trash" size="20" color="#000"></uni-icons>
						</view>
					</view>
				</view>
			</view>

			<!-- 加载状态 -->
			<view class="loading-state">
				<text v-if="isLoading && !isRefreshing">加载中...</text>
				<text v-else-if="noMoreData && articleList.length > 0">没有更多文章了</text>
				<text v-else-if="articleList.length > 0">↓向下滑动加载更多文章↓</text>

				<!-- 无内容提示 -->
				<view v-if="articleList.length === 0 && !isLoading" class="no-content">
					<uni-icons type="info" size="50" color="#ddd"></uni-icons>
					<text>{{ emptyText }}</text>
				</view>
			</view>
		</template>
		<!-- #endif -->

		<!-- 小程序和App模式 -->
		<!-- #ifndef H5 -->
		<template v-if="!props.useGlobalScroll">
			<scroll-view scroll-y class="mp-scroll-view" id="article-list-scroll-mp" @scrolltolower="handleLoadMore"
				:refresher-enabled="true" :refresher-triggered="isRefreshing" @refresherrefresh="handleRefresh"
				:refresher-threshold="100" refresher-background="#f5f5f5" :style="{height: props.height || '100vh'}"
				@scroll="handleScroll" :scroll-top="scrollTop" :show-scrollbar="false" :bounce="true" :enhanced="true"
				:scroll-with-animation="true" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
				@touchend="handleTouchEnd">

				<!-- 文章列表容器 -->
				<view class="mp-container">
					<!-- 文章项循环 -->
					<view v-for="(article, index) in articleList" :key="article.id" class="mp-item"
						@click="handleArticleClick(article.id)">
						<!-- 标题 -->
						<text class="mp-title">{{article.title}}</text>

						<!-- 摘要 -->
						<text class="mp-summary">{{formatArticleSummary(article.summary)}}</text>

						<!-- 图片区域 -->
						<view class="mp-image" v-if="article.coverImage">
							<image :src="article.coverImage" mode="aspectFill" @error="handleImageError(index)"></image>
						</view>

						<!-- 底部操作栏 -->
						<view class="mp-actions">
							<!-- 分享按钮 -->
							<view class="mp-action" @click.stop="handleShare(index)">
								<uni-icons type="redo-filled" size="16" color="#666"></uni-icons>
								<text>分享</text>
							</view>

							<!-- 评论按钮 -->
							<view class="mp-action" @click.stop="handleComment(index)">
								<uni-icons type="chat" size="16" color="#666"></uni-icons>
								<text>{{article.commentCount !== undefined ? article.commentCount : 0}}</text>
							</view>

							<!-- 点赞按钮 -->
							<view class="mp-action" @click.stop="handleLike(index)">
								<uni-icons :type="article.isLiked ? 'heart-filled' : 'heart'" size="16"
									:color="article.isLiked ? '#ff6b6b' : '#666'"></uni-icons>
								<text
									:class="{'mp-liked': article.isLiked}">{{article.likeCount !== undefined ? article.likeCount : 0}}</text>
							</view>

							<!-- 编辑按钮（根据权限条件显示） -->
							<view class="mp-action manage-btn"
								v-if="showManageOptions && (isCurrentUser(article.author?.id) || props.showEditForAllUsers)"
								@click.stop="handleEdit(index)">
								<uni-icons type="compose" size="16" color="#666"></uni-icons>
								<text>编辑</text>
							</view>

							<!-- 删除按钮（当显示管理选项且是当前用户的文章时） -->
							<view class="mp-action manage-btn"
								v-if="showManageOptions && isCurrentUser(article.author?.id)"
								@click.stop="handleDelete(index)">
								<uni-icons type="trash" size="16" color="#666"></uni-icons>
								<text>删除</text>
							</view>
						</view>
					</view>

					<!-- 加载状态 -->
					<view class="mp-loading">
						<text v-if="isLoading && !isRefreshing">加载中...</text>
						<text v-else-if="noMoreData && articleList.length > 0">没有更多文章了</text>
						<!-- 删除底部向下滑动提示，避免固定显示在底部导航栏上方 -->
						<!--<text v-else-if="articleList.length > 0">↓向下滑动加载更多文章↓</text>-->

						<!-- 无内容提示 -->
						<view v-if="articleList.length === 0 && !isLoading" class="mp-no-content">
							<uni-icons type="info" size="50" color="#ddd"></uni-icons>
							<text>{{ emptyText }}</text>
						</view>
					</view>
				</view>

				<!-- 回到顶部按钮 -->
				<view v-if="showBackTop" class="mp-back-top" @click="scrollToTop">
					<uni-icons type="top" size="18" color="#fff"></uni-icons>
				</view>
			</scroll-view>
		</template>
		<template v-else>
			<!-- 修改全局滚动模式实现，添加scroll-view -->
			<scroll-view scroll-y class="mp-scroll-view" id="article-list-scroll-mp-global"
				@scrolltolower="handleLoadMore" :refresher-enabled="true" :refresher-triggered="isRefreshing"
				@refresherrefresh="handleRefresh" :refresher-threshold="100" refresher-background="#f5f5f5"
				:style="{height: props.height || '100vh'}" @scroll="handleScroll" :scroll-top="scrollTop"
				:show-scrollbar="false" :bounce="true" :enhanced="true" :scroll-with-animation="true"
				@touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">

				<view class="mp-container mp-global">
					<!-- 文章项循环 -->
					<view v-for="(article, index) in articleList" :key="article.id" class="mp-item"
						@click="handleArticleClick(article.id)">
						<!-- 标题 -->
						<text class="mp-title">{{article.title}}</text>

						<!-- 摘要 -->
						<text class="mp-summary">{{formatArticleSummary(article.summary)}}</text>

						<!-- 图片区域 -->
						<view class="mp-image" v-if="article.coverImage">
							<image :src="article.coverImage" mode="aspectFill" @error="handleImageError(index)"></image>
						</view>

						<!-- 底部操作栏 -->
						<view class="mp-actions">
							<!-- 分享按钮 -->
							<view class="mp-action" @click.stop="handleShare(index)">
								<uni-icons type="redo-filled" size="16" color="#666"></uni-icons>
								<text>分享</text>
							</view>

							<!-- 评论按钮 -->
							<view class="mp-action" @click.stop="handleComment(index)">
								<uni-icons type="chat" size="16" color="#666"></uni-icons>
								<text>{{article.commentCount !== undefined ? article.commentCount : 0}}</text>
							</view>

							<!-- 点赞按钮 -->
							<view class="mp-action" @click.stop="handleLike(index)">
								<uni-icons :type="article.isLiked ? 'heart-filled' : 'heart'" size="16"
									:color="article.isLiked ? '#ff6b6b' : '#666'"></uni-icons>
								<text
									:class="{'mp-liked': article.isLiked}">{{article.likeCount !== undefined ? article.likeCount : 0}}</text>
							</view>

							<!-- 编辑按钮（根据权限条件显示） -->
							<view class="mp-action manage-btn"
								v-if="showManageOptions && (isCurrentUser(article.author?.id) || props.showEditForAllUsers)"
								@click.stop="handleEdit(index)">
								<uni-icons type="compose" size="16" color="#666"></uni-icons>
								<text>编辑</text>
							</view>

							<!-- 删除按钮（当显示管理选项且是当前用户的文章时） -->
							<view class="mp-action manage-btn"
								v-if="showManageOptions && isCurrentUser(article.author?.id)"
								@click.stop="handleDelete(index)">
								<uni-icons type="trash" size="16" color="#666"></uni-icons>
								<text>删除</text>
							</view>
						</view>
					</view>

					<!-- 加载状态 -->
					<view class="mp-loading">
						<text v-if="isLoading && !isRefreshing">加载中...</text>
						<text v-else-if="noMoreData && articleList.length > 0">没有更多文章了</text>
						<!-- 删除底部向下滑动提示，避免固定显示在底部导航栏上方 -->
						<!--<text v-else-if="articleList.length > 0">↓向下滑动加载更多文章↓</text>-->

						<!-- 无内容提示 -->
						<view v-if="articleList.length === 0 && !isLoading" class="mp-no-content">
							<uni-icons type="info" size="50" color="#ddd"></uni-icons>
							<text>{{ emptyText }}</text>
						</view>
					</view>
				</view>

				<!-- 回到顶部按钮 -->
				<view v-if="showBackTop" class="mp-back-top" @click="scrollToTop">
					<uni-icons type="top" size="18" color="#fff"></uni-icons>
				</view>
			</scroll-view>
		</template>
		<!-- #endif -->
	</view>
</template>

<script setup>
	import {
		ref,
		reactive,
		computed,
		watch,
		onMounted,
		onBeforeUnmount,
		nextTick,
		inject
	} from 'vue';
	import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
	import {
		deleteArticle,
		getArticleDetail,
		collectArticle,
		likeArticle
	} from '@/api/article';
	import http from '@/utils/request';
	import { getBaseUrl } from '@/utils/request'; // 引入统一的getBaseUrl函数

	// 定义组件属性
	const props = defineProps({
		// 列表类型: recommend(推荐)、follow(关注)、hot(热门)、new(最新)、tag(标签)、collection(收藏)、search(搜索)
		listType: {
			type: String,
			default: 'recommend'
		},
		// 标签名称，当listType为tag时使用
		tagName: {
			type: String,
			default: ''
		},
		// 用户ID，当获取指定用户的文章时使用
		userId: {
			type: [Number, String],
			default: null
		},
		// 是否显示管理选项（编辑、删除）
		showManageOptions: {
			type: Boolean,
			default: false
		},
		// 是否允许所有已登录用户编辑文章
		showEditForAllUsers: {
			type: Boolean,
			default: false
		},
		// 空列表提示文本
		emptyText: {
			type: String,
			default: '暂无内容'
		},
		// 是否自动加载（组件挂载后是否自动请求数据）
		autoLoad: {
			type: Boolean,
			default: true
		},
		// 列表高度
		height: {
			type: String,
			default: 'calc(100vh - 165rpx)'
		},
		// 是否使用全局滚动
		useGlobalScroll: {
			type: Boolean,
			default: false
		},
		// 搜索关键词，当listType为search时使用
		keyword: {
			type: String,
			default: ''
		}
	});

	// 定义事件
	const emit = defineEmits([
		'refresh',
		'loadMore',
		'articleClick',
		'authorClick',
		'tagClick',
		'share',
		'comment',
		'collect',
		'like',
		'edit',
		'delete',
		'follow',
		'search-results',
		'loaded' // 添加loaded事件
	]);

	// 响应式数据
	const articleList = ref([]);
	const isLoading = ref(false);
	const isRefreshing = ref(false);
	const noMoreData = ref(false);
	const currentPage = ref(1);
	const pageSize = ref(10);

	// 滚动相关
	const scrollTop = ref(0);
	const showBackTop = ref(false);
	const oldScrollTop = ref(0);

	// 处理滚动事件
	const handleScroll = (e) => {
		// 获取滚动条位置
		const scrollTop = e.detail.scrollTop;

		// 当滚动超过500rpx时显示回到顶部按钮
		showBackTop.value = scrollTop > 500;

		// 保存旧的滚动位置用于后续比较
		oldScrollTop.value = scrollTop;
	};

	// 回到顶部
	const scrollToTop = () => {
		console.log('文章列表: 执行滚动到顶部方法');

		// 直接操作scroll-view的滚动
		// #ifdef H5
		try {
			// 使用ID更精确地定位元素
			const scrollView = document.getElementById('article-list-scroll-h5');
			if (scrollView) {
				console.log('文章列表: H5环境找到scroll-view元素，设置scrollTop为0');
				scrollView.scrollTop = 0;

				// 同时更新Vue响应式数据
				scrollTop.value = 0;

				// 隐藏回到顶部按钮
				showBackTop.value = false;

				// 显示成功反馈
				uni.showToast({
					title: '已返回顶部',
					icon: 'none',
					duration: 300
				});

				return; // 操作成功，退出函数
			}
			console.warn('文章列表: H5环境未找到scroll-view元素');
			// 尝试通过类名查找
			const scrollViewByClass = document.querySelector('.article-scroll');
			if (scrollViewByClass) {
				scrollViewByClass.scrollTop = 0;
				scrollTop.value = 0;
				showBackTop.value = false;
				return; // 操作成功，退出函数
			}
		} catch (error) {
			console.error('文章列表: 回到顶部出错:', error);
		}
		// #endif

		// 在非H5环境或H5操作失败时，使用uni的API
		// #ifndef H5
		try {
			const query = uni.createSelectorQuery();

			// 根据是否使用全局滚动选择正确的选择器
			const scrollId = props.useGlobalScroll ? '#article-list-scroll-mp-global' : '#article-list-scroll-mp';
			console.log('文章列表: 使用选择器', scrollId);

			// 使用ID更精确地定位元素
			query.select(scrollId).boundingClientRect(data => {
				if (data) {
					console.log('文章列表: 非H5环境找到scroll-view元素');
					// 尝试使用选择器设置scrollTop
					setTimeout(() => {
						uni.pageScrollTo({
							scrollTop: 0,
							duration: 0,
							selector: scrollId // 使用选择器
						});

						// 同时更新Vue响应式数据
						scrollTop.value = 0;

						// 隐藏回到顶部按钮
						showBackTop.value = false;

						// 显示成功反馈
						uni.showToast({
							title: '已返回顶部',
							icon: 'none',
							duration: 300
						});
					}, 50);
				} else {
					console.warn('文章列表: 非H5环境未找到指定ID的scroll-view元素');
					// 退回到使用类选择器

					query.select('.mp-scroll-view').boundingClientRect(data => {
						if (data) {
							setTimeout(() => {
								uni.pageScrollTo({
									scrollTop: 0,
									duration: 0
								});

								// 更新状态
								scrollTop.value = 0;
								showBackTop.value = false;
							}, 50);
						}
					}).exec();
				}
			}).exec();
		} catch (error) {
			console.error('文章列表: 非H5环境回到顶部出错:', error);
			// 最后尝试使用通用方法
			uni.pageScrollTo({
				scrollTop: 0,
				duration: 0
			});

			// 更新状态
			scrollTop.value = 0;
			showBackTop.value = false;
		}
		// #endif
	};

	// 获取当前登录用户信息
	const getCurrentUserId = () => {
		const userInfo = uni.getStorageSync('userInfo');
		return userInfo ? userInfo.id : null;
	};

	// 判断是否为当前用户的文章
	const isCurrentUser = (authorId) => {
		const currentUserId = getCurrentUserId();
		return currentUserId && currentUserId === authorId;
	};

	// 监听listType、tagName、userId的变化，重置并重新加载数据
	watch([() => props.listType, () => props.tagName, () => props.userId], () => {
		resetList();
		if (props.autoLoad) {
			loadArticles();
		}
	});

	// 组件初始化时加载数据
	onMounted(() => {
		if (props.autoLoad) {
			loadArticles();
		}

		// 监听全局文章发布/更新事件
		uni.$on('article_published', (data) => {
			console.log('接收到文章发布事件:', data);
			// 如果列表类型是推荐、最新或热门，刷新列表
			if (['recommend', 'new', 'hot'].includes(props.listType)) {
				resetList();
				loadArticles();
			}
		});

		uni.$on('article_updated', (data) => {
			console.log('接收到文章更新事件:', data);
			// 重新加载列表数据
			resetList();
			loadArticles();
		});

		// 监听文章点赞/收藏/评论事件
		uni.$on('article_like_updated', (data) => {
			console.log('接收到文章点赞更新事件:', data);
			if (data.articleId && (data.likeCount !== undefined || data.isLiked !== undefined)) {
				refreshArticleById(data.articleId, data);
			}
		});

		uni.$on('article_collect_updated', (data) => {
			console.log('接收到文章收藏更新事件:', data);
			if (data.articleId && (data.collectCount !== undefined || data.isCollected !== undefined)) {
				refreshArticleById(data.articleId, data);
			}
		});

		uni.$on('article_comment_updated', (data) => {
			console.log('接收到文章评论更新事件:', data);
			if (data.articleId && data.commentCount !== undefined) {
				refreshArticleById(data.articleId, data);
			}
		});

		// 监听用户信息更新事件
		uni.$on('user_info_updated', () => {
			console.log('接收到用户信息更新事件，重新处理文章列表中的用户信息');
			// 重新处理当前列表中的用户信息
			if (articleList.value.length > 0) {
				articleList.value = processArticleData([...articleList.value]);
			}
		});

		// 如果是搜索模式且有关键词，立即加载搜索结果
		if (props.listType === 'search' && props.keyword) {
			// 计算是否静默加载
			const silent = currentPage.value > 1;
			
			// 设置加载状态
			isLoading.value = true;
			
			// 请求API获取搜索结果
			http.get('/api/article/search', {
				page: currentPage.value,
				pageSize: pageSize.value,
				keyword: props.keyword
			})
			.then(res => {
				if (isLoading.value) {
					isLoading.value = false;
				}
				
				if (isRefreshing.value) {
					isRefreshing.value = false;
				}
				
				if (res.code === 200 && res.data) {
					const searchResults = res.data.list || [];
					
					// 通知父组件搜索结果数量
					handleSearchResults(res.data);
					
					// 添加调试日志
					console.log(`搜索[${props.keyword}]返回结果:`, searchResults.length, '条');
					
					// 如果是第一页且没有结果，设置为空列表
					if (currentPage.value === 1 && searchResults.length === 0) {
						articleList.value = [];
						noMoreData.value = true;
						
						if (!silent) {
							uni.showToast({
								title: '没有找到相关文章',
								icon: 'none'
							});
						}
						return;
					}
					
					// 处理搜索结果
					const processedArticles = processArticleData(searchResults);
					
					// 更新文章列表
					if (currentPage.value === 1) {
						// 第一页，替换列表
						articleList.value = processedArticles;
					} else {
						// 追加到现有列表
						articleList.value = [...articleList.value, ...processedArticles];
					}
					
					// 更新页码和加载状态
					currentPage.value++;
					
					// 判断是否还有更多数据
					if (searchResults.length < pageSize.value) {
						noMoreData.value = true;
					} else {
						noMoreData.value = false;
					}
				} else {
					// 搜索请求出错
					uni.showToast({
						title: res.message || '搜索文章失败',
						icon: 'none'
					});
					
					// 设置为没有更多数据
					noMoreData.value = true;
					
					// 通知父组件搜索结果为空
					handleSearchResults({ list: [], total: 0 });
				}
			})
			.catch(err => {
				console.error('搜索文章异常:', err);
				
				if (isLoading.value) {
					isLoading.value = false;
				}
				
				if (isRefreshing.value) {
					isRefreshing.value = false;
				}
				
				// 出错时也要通知父组件
				handleSearchResults({ list: [], total: 0 });
				
				if (!silent) {
					uni.showToast({
						title: '网络异常，请稍后再试',
						icon: 'none'
					});
				}
			});
		}
	});

	// 组件卸载时移除事件监听
	onBeforeUnmount(() => {
		uni.$off('article_published');
		uni.$off('article_updated');
		uni.$off('article_like_updated');
		uni.$off('article_collect_updated');
		uni.$off('article_comment_updated');
		uni.$off('user_info_updated');
	});

	// 重置列表数据
	const resetList = () => {
		articleList.value = [];
		currentPage.value = 1;
		noMoreData.value = false;
		isLoading.value = false;
		// 注意：不重置isRefreshing状态，由刷新逻辑自行控制
	};

	// 加载文章列表
	const loadArticles = async (force = false) => {
		// 如果已经没有更多数据或正在加载中，则不处理
		if (noMoreData.value || isLoading.value) {
			if (force) {
				// 强制刷新时重置状态
				currentPage.value = 1;
				noMoreData.value = false;
				articleList.value = [];
			} else {
				return;
			}
		}
		
		// 计算静默加载标志，用于控制是否显示UI反馈
		const silent = currentPage.value > 1;
		
		// 设置加载状态
		isLoading.value = true;
		
		// 添加调试日志
		console.log(`文章列表: 开始加载文章 [类型=${props.listType}] [页码=${currentPage.value}] [全局滚动=${props.useGlobalScroll}]`);
		
		// 请求API路径
		let apiPath = '/api/article';
		
		// 准备请求参数
		const params = {
			page: currentPage.value,
			
			pageSize: pageSize.value
		};
		
		// 定义请求后的回调函数
		let afterRequest = null;
		
		// 根据列表类型确定API路径和参数
		try {
			if (props.userId) {
				// 获取指定用户的文章
				apiPath = `/api/article/user/${props.userId}/articles`;
				
				if (props.listType === 'likes') {
					// 获取用户点赞的文章
					params.type = 'likes';
					console.log(`加载用户(${props.userId})的点赞文章`);
				} else {
					// 获取用户发布的文章
					params.type = 'posts';
					console.log(`加载用户(${props.userId})的发布文章`);
				}
			} else {
				// 根据不同的列表类型设置参数
				if (props.listType === 'follow') {
					// 获取关注作者的文章
					params.type = 'follow';
					console.log('加载关注的作者文章');
				} else if (props.listType === 'hot') {
					// 获取热门文章 - 根据浏览量降序排序
					params.sort = 'view_count';
					console.log('加载热门文章 - 按浏览量排序');
				} else if (props.listType === 'recommend') {
					// 获取推荐文章 - 根据点赞和评论总数降序排序
					params.sort = 'popularity';
					console.log('加载推荐文章 - 按点赞和评论数排序');
				} else if (props.listType === 'latest') {
					// 获取最新文章
					params.sort = 'new';
					console.log('加载最新文章');
				} else if (props.listType === 'tag' && props.tagName) {
					// 获取指定标签的文章
					params.tag = props.tagName;
					console.log(`加载标签(${props.tagName})的文章`);
				} else if (props.listType === 'search' && props.keyword) {
					// 获取搜索结果
					apiPath = '/api/article/search';
					params.keyword = props.keyword;
					console.log(`搜索关键词(${props.keyword})的文章`);
					
					// 创建处理搜索结果的回调函数
					afterRequest = (res) => {
						if (res.code === 200 && res.data) {
							// 通知父组件搜索结果数量
							handleSearchResults(res.data);
						} else {
							// 搜索失败时也要通知父组件
							handleSearchResults({ list: [], total: 0 });
						}
					};
				} else if (props.listType === 'collection') {
					// 获取收藏的文章
					apiPath = '/api/article/collections';
					console.log('加载收藏的文章');
				} else {
					console.log('加载推荐文章');
				}
			}
			
			// 发送请求获取文章列表
			const res = await http.get(apiPath, params);
			
			// 添加调试日志
			console.log(`文章列表: 请求成功 [类型=${props.listType}] [状态码=${res.code}] [数据量=${res.data?.list?.length || 0}]`);
			
			// 如果定义了请求后回调，执行它
			if (afterRequest) {
				afterRequest(res);
			}
			
			// 重置加载状态
			isLoading.value = false;
			if (isRefreshing.value) {
				isRefreshing.value = false;
			}
			
			// 处理响应结果
			if (res.code === 200 && res.data) {
				const newArticles = res.data.list || [];
				
				// 如果是第一页且没有数据，设置为没有更多数据
				if (currentPage.value === 1 && newArticles.length === 0) {
					articleList.value = [];
					noMoreData.value = true;
					
					console.log(`文章列表: 第一页没有数据 [类型=${props.listType}]`);
					
					if (!silent) {
						uni.showToast({
							title: '暂无文章',
							icon: 'none'
						});
					}
					return;
				}
				
				// 处理文章数据
				const processedArticles = processArticleData(newArticles);
				
				// 更新文章列表
				if (currentPage.value === 1) {
					// 第一页，替换列表
					articleList.value = processedArticles;
				} else {
					// 追加到现有列表
					articleList.value = [...articleList.value, ...processedArticles];
				}
				
				// 更新页码和加载状态
				currentPage.value++;
				
				// 判断是否还有更多数据
				if (newArticles.length < pageSize.value) {
					noMoreData.value = true;
				} else {
					noMoreData.value = false;
				}
				
				console.log(`文章列表: 数据加载完成 [类型=${props.listType}] [文章数量=${articleList.value.length}]`);
				
				// 发出加载成功事件
				emit('loaded', {
					total: res.data.total || articleList.value.length,
					page: currentPage.value - 1,
					pageSize: pageSize.value
				});
			} else {
				console.error(`文章列表: API响应错误 [类型=${props.listType}] [错误=${res.message}]`);
				
				if (!silent) {
					uni.showToast({
						title: res.message || '加载失败',
						icon: 'none'
					});
				}
			}
		} catch (error) {
			console.error(`文章列表: 请求异常 [类型=${props.listType}]`, error);
			
			isLoading.value = false;
			if (isRefreshing.value) {
				isRefreshing.value = false;
			}
			
			if (!silent) {
				uni.showToast({
					title: '网络异常，请稍后再试',
					icon: 'none'
				});
			}
		}
	};

	// 处理文章数据
	const processArticleData = (articles) => {
		// 获取当前登录用户信息，用于同步头像
		const currentUserInfo = uni.getStorageSync('userInfo') || {};

		return articles.map(article => {
			// 记录原始数据，方便调试
			const original = JSON.parse(JSON.stringify(article));
			console.log('原始文章数据:', original);

			// 统一字段命名 - 确保所有字段都使用驼峰命名风格
			
			// 统一点赞数字段
			if (article.like_count !== undefined && article.likeCount === undefined) {
				article.likeCount = article.like_count;
			}

			// 统一评论数字段
			if (article.comment_count !== undefined && article.commentCount === undefined) {
				article.commentCount = article.comment_count;
			}
			
			// 统一收藏数字段
			if (article.collect_count !== undefined && article.collectCount === undefined) {
				article.collectCount = article.collect_count;
			}

			// 修正为0的计数字段
			article.likeCount = article.likeCount !== undefined ? article.likeCount : 0;
			article.commentCount = article.commentCount !== undefined ? article.commentCount : 0;
			article.collectCount = article.collectCount !== undefined ? article.collectCount : 0;

			// 检查点赞状态字段 - 确保统一使用isLiked
			if (article.is_liked !== undefined) {
				article.isLiked = !!article.is_liked; // 使用!!确保转换为布尔值
			} else if (article.liked !== undefined) {
				article.isLiked = !!article.liked;
			} else if (article.isLiked === undefined) {
				article.isLiked = false; // 默认值
			} else {
				article.isLiked = !!article.isLiked; // 确保是布尔值
			}

			// 检查收藏状态字段 - 确保统一使用isCollected
			if (article.is_collected !== undefined) {
				article.isCollected = !!article.is_collected;
			} else if (article.collected !== undefined) {
				article.isCollected = !!article.collected;
			} else if (article.isCollected === undefined) {
				article.isCollected = false; // 默认值
			} else {
				article.isCollected = !!article.isCollected; // 确保是布尔值
			}
			
			// 处理作者关注状态字段映射
			if (article.author) {
				// 检查后端返回的is_followed字段
				if (article.author.is_followed !== undefined) {
					article.author.isFollowed = !!article.author.is_followed;
				} else if (article.author.followed !== undefined) {
					article.author.isFollowed = !!article.author.followed;
				} else if (article.author.isFollowed === undefined) {
					// 如果没有isFollowed字段，初始化为false
					article.author.isFollowed = false;
				}
				
				// 确保isFollowed为布尔值
				article.author.isFollowed = !!article.author.isFollowed;
				
				// 如果后端返回了嵌套的对象，如{following: true}，处理这种情况
				if (typeof article.author.isFollowed === 'object' && article.author.isFollowed !== null) {
					if (article.author.isFollowed.following !== undefined) {
						article.author.isFollowed = !!article.author.isFollowed.following;
					}
				}
				
				console.log(`作者[${article.author.id}]关注状态: ${article.author.isFollowed}`);
			}

			// 检查数据库字段映射 - 后端用cover_image，前端用coverImage
			if (article.cover_image && !article.coverImage) {
				console.log(`检测到cover_image字段映射问题[${article.id}], 进行修正`);
				article.coverImage = article.cover_image;
			}

			// 为所有文章添加默认封面或使用文章中的图片
			// 先检查是否有封面图片字段
			if (!article.coverImage) {
				// 如果没有coverImage，尝试从images数组中获取第一张
				if (article.images && article.images.length > 0) {
					article.coverImage = article.images[0];
					console.log(`使用第一张图片作为封面:`, article.coverImage);
				}
			}

			// 调试信息 - 记录原始封面URL
			console.log(`处理文章封面[${article.id}][${article.title}], 原始封面URL:`, article.coverImage);

			// 处理封面URL格式
			if (article.coverImage) {
				// 移除URL中可能存在的多余空格
				article.coverImage = article.coverImage.trim();

				// 确保不是null或undefined
				if (article.coverImage === 'null' || article.coverImage === 'undefined') {
					console.log(`检测到无效封面URL[${article.id}], 将使用默认封面`);
					article.coverImage = null;
					return article;
				}

				// 完整URL处理：如果已经是完整URL（包含http）则不处理
				if (article.coverImage.startsWith('http')) {
					// 已经是完整URL，不需要修改
					console.log(`保留完整URL[${article.id}]:`, article.coverImage);
				}
				// 静态资源处理：如果是静态资源路径则不处理
				else if (article.coverImage.startsWith('/static')) {
					// 静态资源路径，不需要修改
					console.log(`保留静态资源路径[${article.id}]:`, article.coverImage);
				}
				// 其他情况：添加基础URL前缀
				else {
					let oldUrl = article.coverImage;
					if (article.coverImage.startsWith('/')) {
						article.coverImage = getBaseUrl() + article.coverImage;
					} else {
						article.coverImage = getBaseUrl() + '/' + article.coverImage;
					}
					console.log(`封面URL更新[${article.id}]: ${oldUrl} -> ${article.coverImage}`);
				}

				// 检查常见的双斜杠问题
				if (article.coverImage.includes('//uploads')) {
					article.coverImage = article.coverImage.replace('//uploads', '/uploads');
					console.log(`修复双斜杠问题:`, article.coverImage);
				}
			}

			// 处理作者信息，确保有默认值
			if (!article.author) {
				article.author = {
					id: article.userId,
					nickname: article.nickname || '未知用户',
					avatar: article.avatar || '/static/images/avatar.png',
					isFollowed: false
				};
			}

			// 同步当前登录用户的头像和昵称
			if (currentUserInfo.id && article.author.id === currentUserInfo.id) {
				article.author.avatar = currentUserInfo.avatar || article.author.avatar;
				article.author.nickname = currentUserInfo.nickname || article.author.nickname;
			}

			// 处理文章摘要中可能存在的HTML标签
			if (article.summary) {
				// 保留原始摘要，以便将来可能的富文本渲染
				article.originalSummary = article.summary;
				// 不在这里处理，而是在显示时使用stripHtmlTags函数处理
			}

			// 确保头像地址是完整URL
			if (article.author && article.author.avatar) {
				// 移除URL中可能存在的多余空格
				article.author.avatar = article.author.avatar.trim();

				// 确保不是null或undefined
				if (article.author.avatar === 'null' || article.author.avatar === 'undefined') {
					article.author.avatar = '/static/images/avatar.png';
				}
				// 完整URL处理：如果已经是完整URL（包含http）则不处理
				else if (article.author.avatar.startsWith('http')) {
					// 检查并修复双斜杠问题
					if (article.author.avatar.includes('//uploads')) {
						article.author.avatar = article.author.avatar.replace('//uploads', '/uploads');
					}
				}
				// 静态资源处理：如果是静态资源路径则不处理
				else if (article.author.avatar.startsWith('/static')) {
					// 静态资源路径，不需要修改
					console.log('保留作者头像静态资源路径:', article.author.avatar);
				}
				// 其他情况：添加基础URL前缀
				else {
					let oldUrl = article.author.avatar;
					if (article.author.avatar.startsWith('/')) {
						article.author.avatar = getBaseUrl() + article.author.avatar;
					} else {
						article.author.avatar = getBaseUrl() + '/' + article.author.avatar;
					}
					console.log(`作者头像URL更新: ${oldUrl} -> ${article.author.avatar}`);
				}
			} else if (article.author) {
				// 设置默认头像
				article.author.avatar = '/static/images/avatar.png';
			}

			// 添加UI动画状态属性
			article.isAnimating = false;
			article.animationType = '';

			// 最终封面URL
			console.log(`最终封面URL[${article.id}]:`, article.coverImage);
			console.log(`最终作者头像URL[${article.id}]:`, article.author?.avatar);
			console.log(`点赞状态[${article.id}]:`, article.isLiked);
			console.log(`收藏状态[${article.id}]:`, article.isCollected);

			return article;
		});
	};

	// 添加图片加载错误处理函数
	const handleImageError = (index) => {
		const article = articleList.value[index];
		console.error(`封面图片加载失败[${article.id}][${article.title}]:`, article.coverImage);

		// 记录原始URL用于调试
		const originalUrl = article.coverImage;

		// 输出所有可能的图片相关属性以排查问题
		console.log('文章对象包含的图片相关属性:', {
			id: article.id,
			title: article.title,
			coverImage: article.coverImage,
			cover_image: article.cover_image,
			images: article.images,
			hasImages: article.images && article.images.length > 0
		});

		// 如果加载失败，可能是URL问题，尝试修复一些常见问题
		if (article.coverImage && article.coverImage.includes('http://localhost:8080')) {
			// 替换localhost可能不可访问的问题
			const fixedUrl = article.coverImage.replace('http://localhost:8080', getBaseUrl());
			console.log(`尝试修复localhost URL: ${article.coverImage} -> ${fixedUrl}`);
			article.coverImage = fixedUrl;
			return; // 不立即使用备选图，给修复的URL一次机会
		}

		// 设置一个默认图片作为替代
		if (article.images && article.images.length > 0) {
			// 如果文章有其他图片，尝试使用第一张图片作为封面
			console.log(`尝试使用文章的第一张图片作为封面替代:`, article.images[0]);
			const imageUrl = article.images[0];
			// 如果图片URL不是http开头，添加基础URL
			if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/static')) {
				if (imageUrl.startsWith('/')) {
					article.coverImage = getBaseUrl() + imageUrl;
				} else {
					article.coverImage = getBaseUrl() + '/' + imageUrl;
				}
			} else {
				article.coverImage = imageUrl;
			}
		} else {
			// 如果没有其他图片，使用现有的静态图片作为默认封面
			console.log(`使用默认图片作为封面(原URL:${originalUrl})`);
			article.coverImage = '/static/images/img1.png';
		}
	};

	// 网络请求封装
	const request = async (url, params = {}, force = false) => {
		try {
			// 获取基础URL
			const baseUrl = getBaseUrl();

			// 获取token
			const token = uni.getStorageSync('token');

			// 构建请求URL（添加查询参数）
			let requestUrl = baseUrl + url;
			if (Object.keys(params).length > 0) {
				const queryString = Object.keys(params)
					.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
					.join('&');
				requestUrl += `?${queryString}`;
			}

			console.log('发起API请求:', requestUrl);

			// 返回Promise
			return new Promise((resolve, reject) => {
				// 请求计时器，用于监控请求时间
				const startTime = Date.now();

				// 设置请求超时
				let timeoutId = setTimeout(() => {
					console.error('请求超时:', requestUrl);
					reject(new Error('请求超时，请检查网络连接'));
				}, 15000); // 15秒超时

				// 请求头
				const headers = {
					'Authorization': token ? `Bearer ${token}` : '',
					'Content-Type': 'application/json',
					// 添加CORS相关请求头
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
				};

				// 如果是强制刷新，添加防缓存头
				if (force) {
					headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
					headers['Pragma'] = 'no-cache';
					headers['Expires'] = '0';
					headers['If-Modified-Since'] = '0';
				}

				uni.request({
					url: requestUrl,
					method: 'GET',
					timeout: 15000, // 15秒超时设置
					header: headers,
					success: (res) => {
						clearTimeout(timeoutId); // 清除超时计时器

						// 计算请求耗时
						const requestTime = Date.now() - startTime;
						console.log(`API响应状态: ${res.statusCode}, 耗时: ${requestTime}ms`);

						// 处理API响应
						if (res.statusCode === 200) {
							// 验证返回数据结构
							if (!res.data) {
								console.warn('API返回空数据');
								resolve({
									code: 200,
									message: "success",
									data: {
										total: 0,
										list: []
									}
								});
								return;
							}

							// 检查data字段
							if (!res.data.data && res.data.code === 200) {
								console.warn('API返回的data字段为空');
								res.data.data = {
									total: 0,
									list: []
								};
							}

							console.log('API请求成功，数据条数:', res.data?.data?.list?.length || 0);
							resolve(res.data);
						} else if (res.statusCode === 401) {
							// 未授权，可能是token过期
							console.log('API请求未授权(401)');
							uni.showToast({
								title: '请先登录',
								icon: 'none'
							});

							// 可以在这里添加重定向到登录页的逻辑
							// uni.navigateTo({url: '/pages/login/login'});

							resolve({
								code: 401,
								message: "需要登录",
								data: null
							});
						} else {
							// 其他错误
							console.log('API请求失败，状态码:', res.statusCode);
							resolve({
								code: res.statusCode,
								message: res.data?.message || "请求失败",
								data: null
							});
						}
					},
					fail: (err) => {
						clearTimeout(timeoutId); // 清除超时计时器

						console.error('API请求网络错误:', err);
						// 网络错误时明确拒绝Promise
						reject(err);
					},
					complete: () => {
						// 可以在这里添加全局的请求完成逻辑
					}
				});
			});
		} catch (error) {
			console.error('请求异常:', error);
			return Promise.reject(error);
		}
	};

	/**
	 * 获取基础URL
	 */
	// 已引入统一的getBaseUrl，不需要本地定义

	/**
	 * 处理头像URL格式，确保显示正确的头像
	 * @param {String} url - 头像URL
	 * @return {String} 处理后的头像URL
	 */
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
	 * 去除HTML标签，只保留纯文本内容，并限制文本长度
	 * 用于处理可能包含HTML标签的文章摘要
	 * @param {String} html - 可能包含HTML标签的文本
	 * @param {Number} maxLength - 最大文本长度，默认为25个字符
	 * @return {String} 去除HTML标签后的纯文本，并限制长度
	 */
	const stripHtmlTags = (html, maxLength = 25) => {
		if (!html) return '';
		// 替换所有HTML标签为空字符串
		const plainText = html.replace(/<\/?[^>]+(>|$)/g, '');
		// 限制文本长度
		return plainText.length > maxLength ? plainText.substring(0, maxLength) : plainText;
	};

	// 处理带有展开提示的文章摘要 - 删除，使用底部定义的函数
	/* 原formatSummary函数定义已删除，使用底部新定义的函数 */

	// 处理下拉刷新
	const handleRefresh = () => {
		if (isRefreshing.value) return; // 避免重复触发

		console.log('开始完全重置刷新...');
		isRefreshing.value = true;

		// 完全重置组件状态
		articleList.value = [];
		currentPage.value = 1;
		noMoreData.value = false;

		// 通知用户正在刷新
		uni.showToast({
			title: '正在刷新...',
			icon: 'loading',
			duration: 1000
		});

		// 模拟浏览器刷新效果 - 短暂延迟后完全重新加载
		setTimeout(() => {
			// 发起带有缓存破坏参数的全新请求
			const randomParam = Math.random().toString(36).substring(2, 15);

			// 构建请求参数和API路径
			let apiPath = '/api/article';
			const requestParams = {
				page: 1,
				pageSize: pageSize.value,
				_nocache: randomParam,
				_t: Date.now()
			};

			// 根据列表类型设置正确的参数
			if (props.listType === 'myPosts') {
				const currentUserId = getCurrentUserId();
				if (!currentUserId) {
					console.error('用户未登录，无法刷新');
					isRefreshing.value = false;
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					});
					return;
				}
				apiPath = `/api/article/user/${currentUserId}/articles`;
				requestParams.type = 'posts';
			} else if (props.listType === 'like' && props.userId) {
				apiPath = `/api/article/user/${props.userId}/articles`;
				requestParams.type = 'likes';
			} else if (props.userId) {
				apiPath = `/api/article/user/${props.userId}/articles`;
				requestParams.type = 'posts';
			} else if (props.listType === 'collection') {
				apiPath = '/api/article/collections';
			} else if (props.listType === 'follow') {
				apiPath = '/api/article/follow';
			} else if (props.listType === 'hot') {
				requestParams.sort = 'hot';
			} else if (props.listType === 'new') {
				requestParams.sort = 'new';
			} else if (props.listType === 'tag' && props.tagName) {
				requestParams.tag = props.tagName;
			}

			console.log('刷新请求路径:', apiPath);
			console.log('刷新请求参数:', requestParams);

			// 直接发起完全的新请求
			request(apiPath, requestParams, true)
				.then(response => {
					// 处理响应数据
					if (response.code === 200 && response.data && response.data.list) {
						// 使用全新数据替换列表
						articleList.value = processArticleData(response.data.list || []);

						// 更新分页信息
						currentPage.value = 2; // 已加载第1页，下次加载第2页

						// 检查是否还有更多数据
						const backendPageSize = response.data.pageSize || pageSize.value;
						if (!response.data.list || response.data.list.length < backendPageSize) {
							noMoreData.value = true;
						}

						// 显示成功提示
						uni.showToast({
							title: '刷新成功',
							icon: 'success',
							duration: 1500
						});
					} else {
						// 处理错误情况
						throw new Error(response.message || '刷新失败');
					}
				})
				.catch(error => {
					console.error('刷新失败:', error);
					uni.showToast({
						title: '刷新失败，请重试',
						icon: 'none',
						duration: 2000
					});
				})
				.finally(() => {
					// 无论成功或失败，重置刷新状态
					isRefreshing.value = false;
					isLoading.value = false;
					emit('refresh'); // 通知父组件刷新已完成
				});
		}, 300);
	};

	// 处理加载更多
	const handleLoadMore = () => {
		loadArticles();
		emit('loadMore');
	};

	// 处理文章点击
	const handleArticleClick = (articleId) => {
		if (!articleId) {
			console.error('文章ID为空，无法跳转到详情页');
			return;
		}
		
		console.log('点击文章，准备跳转到详情页:', articleId);
		
		// #ifdef H5
		// H5环境下，在新窗口打开文章详情页
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		const detailUrl = `${baseUrl}#/pages/article-detail/article-detail?id=${articleId}`;
		window.open(detailUrl, '_blank');
		// #endif
		
		// #ifndef H5
		// 非H5环境下，使用uni.navigateTo跳转到文章详情页
		uni.navigateTo({
			url: `/pages/article-detail/article-detail?id=${articleId}`,
			fail: (err) => {
				console.error('跳转文章详情页失败:', err);
				uni.showToast({
					title: '页面跳转失败',
					icon: 'none'
				});
			}
		});
		// #endif
		
		// 触发文章点击事件
		emit('articleClick', articleId);
	};

	// 处理作者点击
	const handleAuthorClick = (authorId) => {
		emit('authorClick', authorId);
	};

	// 处理标签点击
	const handleTagClick = (tag) => {
		console.log('点击标签:', tag);
		// 发出标签点击事件
		emit('tagClick', tag);

		// 导航到分类页面并选择该标签
		uni.navigateTo({
			url: `/pages/classification/classification?tag=${encodeURIComponent(tag)}`
		});
	};

	// 处理分享
	const handleShare = (index) => {
		emit('share', articleList.value[index]);
	};

	// 处理评论
	const handleComment = (index) => {
		const article = articleList.value[index];

		// 首先触发评论事件，让父组件决定如何处理
		emit('comment', article);

		// 获取当前页面路径
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const currentPath = currentPage?.route || '';

		// 排除首页和其他专门处理了评论事件的页面
		// 只有在非index、非my页面中才执行默认导航
		if (!currentPath.includes('pages/index/') && !currentPath.includes('pages/my/')) {
			// #ifdef H5
			// H5环境下，在新窗口打开文章评论页面
			const currentUrl = window.location.href;
			const baseUrl = currentUrl.split('#')[0];
			const detailUrl = `${baseUrl}#/pages/article-detail/article-detail?id=${article.id}&scrollToComments=true`;
			window.open(detailUrl, '_blank');
			// #endif

			// #ifndef H5
			// 非H5环境下，跳转到文章详情页并显示评论区
			uni.navigateTo({
				url: `/pages/article-detail/article-detail?id=${article.id}&scrollToComments=true`
			});
			// #endif
		}
	};

	// 处理收藏操作
	const handleCollect = async (index) => {
		// 在收藏之前，保存当前的收藏状态
		const article = articleList.value[index];
		
		// 检查文章ID是否存在
		if (!article || !article.id) {
			console.error('收藏失败：无效的文章ID', article);
			uni.showToast({
				title: '操作失败，文章信息不完整',
				icon: 'none'
			});
			return;
		}
		
		const currentIsCollected = article.isCollected;
		const currentCollectCount = article.collectCount || 0;
		
		try {
			// 先更新UI，优化体验
			article.isCollected = !currentIsCollected;
			article.collectCount = currentIsCollected ? Math.max(0, currentCollectCount - 1) : currentCollectCount + 1;
			
			// 添加动画效果
			article.isAnimating = true;
			article.animationType = 'collect';
			
			// 输出调试信息
			console.log('收藏文章:', article.id, !currentIsCollected);
			
			// 延迟后移除动画效果
			setTimeout(() => {
				if (articleList.value[index]) {
					articleList.value[index].isAnimating = false;
				}
			}, 800);
			
			// 调用API
			const res = await collectArticle(article.id, !currentIsCollected);
			
			// 检查API响应
			if (res.code !== 200) {
				// 恢复原始状态
				article.isCollected = currentIsCollected;
				article.collectCount = currentCollectCount;
				
				// 打印错误
				console.error('收藏操作失败:', res.message);
				
				// 提示错误
				uni.showToast({
					title: res.message || '操作失败',
					icon: 'none'
				});
			} else {
				// API返回了新的收藏数，使用返回的数据
				if (res.data && res.data.collectCount !== undefined) {
					article.collectCount = res.data.collectCount;
				}
				
				// 触发事件
				emit('collect', {
					articleId: article.id,
					isCollected: article.isCollected,
					collectCount: article.collectCount
				});
				
				// 广播收藏状态变更
				uni.$emit('article_collect_updated', {
					articleId: article.id,
					isCollected: article.isCollected,
					collectCount: article.collectCount
				});
				
				console.log(`文章[${article.id}]收藏状态更新成功: ${article.isCollected}, 收藏数: ${article.collectCount}`);
			}
		} catch (error) {
			console.error('收藏操作异常:', error);
		}
	};

	// 处理点赞
	const handleLike = async (index) => {
		// 在点赞之前，保存当前的点赞状态
		const article = articleList.value[index];
		
		// 检查文章ID是否存在 - 只保留基本检查，合并多个检查为一个
		if (!article || !article.id) {
			console.error('点赞失败：无效的文章ID', article);
			// 不显示toast，避免干扰用户体验
			return;
		}
		
		// 记录调试信息但不显示给用户
		console.log('准备点赞文章，ID:', article.id, '类型:', typeof article.id);
		
		const currentIsLiked = article.isLiked;
		const currentLikeCount = article.likeCount || 0;
		
		try {
			// 先更新UI，优化体验
			article.isLiked = !currentIsLiked;
			article.likeCount = currentIsLiked ? Math.max(0, currentLikeCount - 1) : currentLikeCount + 1;
			
			// 添加动画效果
			article.isAnimating = true;
			article.animationType = 'like';
			
			// 延迟后移除动画效果
			setTimeout(() => {
				if (articleList.value[index]) {
					articleList.value[index].isAnimating = false;
				}
			}, 800);
			
			// 调用API
			const res = await likeArticle(article.id, !currentIsLiked);
			
			// 检查API响应
			if (res.code !== 200) {
				// 恢复原始状态
				article.isLiked = currentIsLiked;
				article.likeCount = currentLikeCount;
				
				// 记录错误但不显示给用户
				console.error('点赞操作失败:', res.message);
			} else {
				// API返回了新的点赞数，使用返回的数据
				if (res.data && res.data.likeCount !== undefined) {
					article.likeCount = res.data.likeCount;
				}
				
				// 触发事件
				emit('like', {
					articleId: article.id,
					isLiked: article.isLiked,
					likeCount: article.likeCount
				});
				
				// 广播点赞状态变更
				uni.$emit('article_like_updated', {
					articleId: article.id,
					isLiked: article.isLiked,
					likeCount: article.likeCount
				});
				
				console.log(`文章[${article.id}]点赞状态更新成功: ${article.isLiked}, 点赞数: ${article.likeCount}`);
			}
		} catch (error) {
			// 恢复原始状态
			article.isLiked = currentIsLiked;
			article.likeCount = currentLikeCount;
			
			console.error('点赞操作异常:', error);
			
			// 只在真正的网络错误时显示提示
			if (error.errMsg && error.errMsg.includes('request:fail')) {
				uni.showToast({
					title: '网络异常，请稍后再试',
					icon: 'none'
				});
			}
		}
	};

	// 处理编辑文章
	const handleEdit = async (index) => {
		const article = articleList.value[index];
		const articleId = article.id;

		// 触发父组件的edit事件，实际的文章详情获取逻辑将在父组件中处理
		// 这样可以避免在两个地方重复请求文章详情
		console.log('触发编辑事件:', article.id);
		emit('edit', article);
	};

	// 处理删除文章
	const handleDelete = (index) => {
		const article = articleList.value[index];

		// 确认是否为当前用户的文章
		if (!isCurrentUser(article.author?.id)) {
			uni.showToast({
				title: '只能删除自己的文章',
				icon: 'none'
			});
			return;
		}

		// 显示确认对话框
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这篇文章吗？该操作无法撤销。',
			confirmText: '删除',
			confirmColor: '#FF5A5F',
			success: (res) => {
				if (res.confirm) {
					// 显示加载中
					uni.showLoading({
						title: '正在删除...',
						mask: true
					});

					// 调用删除API
					deleteArticle(article.id)
						.then(res => {
							// 无论结果如何，先从前端列表中移除该文章
							// 如果后端返回200或文章不存在都认为是删除成功
							if (res.code === 200 || res.message === '文章不存在') {
								// 从列表中移除该文章
								articleList.value.splice(index, 1);

								// 显示成功提示
								uni.showToast({
									title: '删除成功',
									icon: 'success',
									duration: 2000
								});

								// 发出删除事件
								emit('delete', article);
							} else {
								console.error('删除失败:', res);
								uni.showToast({
									title: res.message || '删除失败，请重试',
									icon: 'none',
									duration: 2000
								});
							}
						})
						.catch(err => {
							console.error('删除文章失败:', err);
							const errorMsg = err.data?.message || err.message || '网络异常，请稍后再试';

							// 如果返回的错误是"文章不存在"，说明文章已经被删除
							if (errorMsg.includes('不存在')) {
								// 从列表移除文章
								articleList.value.splice(index, 1);
								uni.showToast({
									title: '删除成功',
									icon: 'success'
								});
								emit('delete', article);
							} else {
								uni.showToast({
									title: errorMsg,
									icon: 'none',
									duration: 2000
								});
							}
						})
						.finally(() => {
							uni.hideLoading();
						});
				}
			}
		});
	};

	// 处理关注
	const handleFollow = (index) => {
		const article = articleList.value[index];
		const author = article.author;
		// 切换关注状态
		author.isFollowed = !author.isFollowed;

		emit('follow', author);
	};

	// 对外暴露的方法
	defineExpose({
		loadArticles,
		resetList,
		refresh: handleRefresh,
		getArticleList: () => articleList.value
	});

	// 触摸相关状态
	const touchStartY = ref(0);
	const lastTouchY = ref(0);
	const isScrolling = ref(false);

	// 处理触摸开始事件
	const handleTouchStart = (e) => {
		touchStartY.value = e.touches[0].clientY;
		lastTouchY.value = e.touches[0].clientY;
		isScrolling.value = false;
	};

	// 处理触摸移动事件
	const handleTouchMove = (e) => {
		const currentY = e.touches[0].clientY;
		const deltaY = currentY - lastTouchY.value;

		// 当滚动到顶部且继续下拉时，阻止外部容器滚动
		if (scrollTop.value <= 0 && deltaY > 0) {
			// 允许组件自己的下拉刷新行为
			isScrolling.value = true;
		}
		// 当滚动到底部且继续上拉时
		else if (noMoreData.value && deltaY < 0) {
			// 标记为正在滚动中
			isScrolling.value = true;
		}

		lastTouchY.value = currentY;
	};

	// 处理触摸结束事件
	const handleTouchEnd = () => {
		// 重置触摸状态
		isScrolling.value = false;
	};

	// 刷新特定文章的数据
	const refreshArticleById = (articleId, updatedData) => {
		if (!articleId || !updatedData) return;

		// 查找文章在列表中的索引
		const index = articleList.value.findIndex(article => article.id == articleId);
		if (index === -1) return;

		console.log(`刷新文章[${articleId}]数据:`, updatedData);

		// 更新文章数据
		if (updatedData.likeCount !== undefined) {
			articleList.value[index].likeCount = updatedData.likeCount;
		}

		if (updatedData.isLiked !== undefined) {
			articleList.value[index].isLiked = updatedData.isLiked;
		}

		if (updatedData.commentCount !== undefined) {
			articleList.value[index].commentCount = updatedData.commentCount;
		}

		if (updatedData.collectCount !== undefined) {
			articleList.value[index].collectCount = updatedData.collectCount;
		}

		if (updatedData.isCollected !== undefined) {
			articleList.value[index].isCollected = updatedData.isCollected;
		}
	};

	// 添加文章摘要格式化方法
	const formatArticleSummary = (summary) => {
		if (!summary) return '暂无摘要';

		// 去除HTML标签
		let plainText = summary.replace(/<\/?[^>]+(>|$)/g, '');

		// 统一所有平台的摘要字数限制，使用H5的标准
		const maxLength = 80; // 减少字数限制，防止溢出
		if (plainText.length > maxLength) {
			plainText = plainText.substring(0, maxLength) + '...';
		}

		return plainText;
	};

	// 添加HTML格式化方法，用于H5富文本摘要显示
	const formatSummary = (summary) => {
		if (!summary) return '<p style="color:#666;font-size:28rpx;">暂无摘要</p>';
		
		// 去除HTML标签以获取纯文本
		let plainText = summary.replace(/<\/?[^>]+(>|$)/g, '');
		
		// 统一所有平台的摘要字数限制
		const maxLength = 80; // 减少字数限制，与formatArticleSummary保持一致
		if (plainText.length > maxLength) {
			plainText = plainText.substring(0, maxLength) + '...';
		}
		
		// 返回带样式的HTML，确保溢出时正确处理
		return `<p style="color:#666;font-size:28rpx;line-height:1.5;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;word-break:break-all;max-height:140rpx;">${plainText}</p>`;
	};

	// 在搜索加载完成处理结果数量
	const handleSearchResults = (results) => {
		// 通知父组件搜索结果数量
		if (results && results.list) {
			emit('search-results', {
				list: results.list,
				total: results.total || results.list.length
			});
		} else if (Array.isArray(results)) {
			emit('search-results', {
				list: results,
				total: results.length
			});
		} else {
			emit('search-results', {
				list: [],
				total: 0
			});
		}
	};
</script>

<style lang="scss">
	// 正确设置容器样式，确保适应所有平台
	.article-list-container {
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		position: relative;
		overflow: hidden; // 防止内容溢出
		// 设置最小高度确保容器可见
		min-height: 200px;

		// 优化滚动区域样式
		.article-scroll {
			height: v-bind(height);
			width: 100%;
			max-width: 100%;
			box-sizing: border-box;
			overflow: hidden;
			// 修改滚动条样式
			scrollbar-width: thin;
			-ms-overflow-style: scrollbar;

			&::-webkit-scrollbar {
				width: 6px !important;
				height: 6px !important;
				display: block !important;
				/* 确保显示滚动条 */
			}

			&::-webkit-scrollbar-thumb {
				background: #ccc;
				border-radius: 3px;
			}

			&::-webkit-scrollbar-track {
				background: #f5f5f5;
			}

			// 添加弹性滚动效果
			-webkit-overflow-scrolling: touch;
			overflow-x: hidden;
		}

		// 全局滚动模式样式增强
		.article-grid.global-scroll {
			width: 100%;
			min-height: 200px;
			display: flex;
			flex-direction: column;
			
			// #ifdef H5
			padding: 10px 0;
			// #endif
			
			.article-grid-item {
				width: 100%;
				margin-bottom: 20px;
				
				// #ifdef H5
				box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
				border-radius: 8px;
				overflow: hidden;
				// #endif
			}
		}

		// 回到顶部按钮
		.back-to-top {
			position: fixed;
			bottom: 140rpx;
			right: 30rpx;
			width: 80rpx;
			height: 80rpx;
			background-color: rgba(67, 97, 238, 0.8);
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
			z-index: 100;
			animation: fadeIn 0.3s;
			transition: all 0.3s;

			&:hover {
				background-color: rgba(67, 97, 238, 1);
				transform: translateY(-3rpx);
				box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.3);
			}

			&:active {
				transform: scale(0.95);
			}
		}

		@keyframes fadeIn {
			from {
				opacity: 0;
				transform: translateY(20rpx);
			}

			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

		// 网格布局样式 (H5模式)
		.article-grid {
			width: 100%;
			display: flex;
			flex-wrap: wrap;
			padding: 10rpx;
			padding-bottom: 100rpx; // 添加底部内边距，确保最后一行不被遮挡

			// #ifdef H5
			// 添加顶部的小间距，防止内容太靠近顶部
			padding-top: 20rpx;

			// 添加适当的底部内边距
			padding-bottom: 140rpx;

			// 确保容器足够宽以放置多列
			min-width: 100%;
			box-sizing: border-box;
			// #endif

			// #ifndef H5
			// 添加适当的顶部和底部内边距
			padding-top: 20rpx;
			padding-bottom: 140rpx;
			min-width: 100%;
			box-sizing: border-box;
			// #endif

			.article-grid-item {
				// #ifdef H5
				width: 100%; // 修改为一行一个
				margin-bottom: 60rpx; // 增加文章项之间的间距，从40rpx改为60rpx
				// 添加阴影和边框，使整个文章项成为一个整体
				box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
				border-radius: 12rpx;
				overflow: hidden; // 确保边框圆角生效
				// #endif

				// #ifndef H5
				width: 100%; // 非H5环境也修改为一行一个，以保持统一视觉
				margin-bottom: 30rpx; // 调整非H5环境下的间距
				box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
				border-radius: 12rpx;
				overflow: hidden; // 确保边框圆角生效
				// #endif

				box-sizing: border-box;
				padding: 10rpx;
				height: 380rpx; // 减小总高度，移除了头像昵称部分

				// #ifdef H5
				// 增大H5环境下的高度，使其更加明显
				height: 470rpx; // 从450rpx增加到470rpx，为功能栏留出更多空间
				padding: 0; // 去掉内边距，让内容紧贴边框
				// #endif

				// #ifndef H5
				// 为非H5环境也提供相同的样式处理
				height: 470rpx;
				padding: 0;
				// #endif

				// 文章内容
				.article-content {
					background-color: #fff;
					// #ifndef H5
					border-radius: 12rpx 12rpx 0 0; // 顶部圆角
					box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
					// #endif

					overflow: hidden;
					transition: transform 0.3s, box-shadow 0.3s;
					height: 320rpx; // 减小内容区高度
					display: flex;
					flex-direction: column;

					// #ifdef H5
					height: 390rpx; // H5环境下增大高度
					flex-direction: row; // H5环境下改为横向布局
					box-shadow: none; // 去掉内容区的阴影，让整体阴影生效
					// #endif

					// #ifndef H5
					// 非H5环境下采用与H5相同的布局方式，保持一致
					height: 390rpx;
					flex-direction: row;
					box-shadow: none;
					// #endif

					// 无封面样式
					&.no-cover {
						.article-info {
							width: 100%; // 文字内容占满整个宽度
							padding: 40rpx; // 增大内边距，提升可读性
						}
					}

					// #ifndef H5
					// 无封面样式
					&.no-cover {
						.article-title {
							margin-bottom: 20rpx; // 增大标题与摘要之间的间距
						}

						.article-summary {
							-webkit-line-clamp: 5; // 无图片时允许显示更多文本行
						}
					}

					// #endif

					// #ifndef H5
					&:hover {
						transform: translateY(-5rpx);
						box-shadow: 0 10rpx 25rpx rgba(0, 0, 0, 0.15);
					}

					// #endif

					// #ifdef H5
					&:hover {
						background-color: #f8f9fa; // 悬停时背景色变化
					}

					// #endif

					// 文章信息
					.article-info {
						padding: 15rpx;
						flex: 1;
						display: flex;
						flex-direction: column;
						justify-content: space-between;

						// #ifdef H5
						padding: 30rpx; // H5环境下增大内边距
						// #endif

						.article-title {
							font-size: 28rpx;
							font-weight: bold;
							color: #333;
							margin-bottom: 10rpx;
							overflow: hidden;
							text-overflow: ellipsis;
							display: -webkit-box;
							-webkit-line-clamp: 1;
							-webkit-box-orient: vertical;
							line-height: 1.3;
							word-break: break-all; /* 添加自动换行 */

							// #ifdef H5
							font-size: 36rpx; // H5环境下增大字体
							-webkit-line-clamp: 2;
							margin-bottom: 20rpx;
							// #endif
						}

						.article-summary {
							font-size: 24rpx;
							color: #666;
							overflow: hidden;
							text-overflow: ellipsis;
							display: -webkit-box;
							-webkit-line-clamp: 3;  /* 从单行改为3行显示 */
							-webkit-box-orient: vertical;
							line-height: 1.3;
							flex: 1;
							word-break: break-all;  /* 添加自动换行 */
							white-space: normal;    /* 移除单行显示设置 */
							max-height: 120rpx;     /* 添加最大高度限制 */

							// #ifdef H5
							font-size: 28rpx; // H5环境下增大字体
							max-height: 140rpx; /* H5环境下增加最大高度 */
							// #endif
						}

						// #ifdef H5
						// 文章标签样式
						.article-tags {
							display: flex;
							flex-wrap: wrap;
							margin-top: 20rpx;

							.tag-item {
								font-size: 24rpx;
								color: #4361ee;
								background-color: #f0f4ff;
								padding: 6rpx 16rpx;
								border-radius: 30rpx;
								margin-right: 16rpx;
								margin-bottom: 10rpx;

								&:hover {
									background-color: #4361ee;
									color: #fff;
									cursor: pointer;
								}
							}
						}

						// #endif
					}

					// 封面图片
					.article-image {
						width: 100%;
						height: 180rpx;

						// #ifdef H5
						width: 40%; // H5环境下设置为固定比例
						height: 100%;
						// #endif

						.grid-image {
							width: 100%;
							height: 100%;
							background-color: #f5f5f5;
						}
					}
				}

				// 文章操作按钮
				.article-actions {
					height: 60rpx;
					background-color: #fff;
					display: flex;
					align-items: center;
					justify-content: space-around;
					// #ifndef H5
					box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
					border-radius: 0 0 12rpx 12rpx;
					// #endif

					// #ifdef H5
					height: 100rpx; // H5环境下增大高度，从80rpx增加到100rpx
					border-top: 1px solid #eaeaea; // 添加顶部边框，与内容区分隔
					padding-bottom: 10rpx; // 添加底部内边距
					// #endif

					.action-item {
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 24rpx;
						color: #333;

						// #ifdef H5
						padding: 0 20rpx; // H5环境下增加内边距
						font-size: 28rpx; // H5环境下增大字体
						// #endif

						text {
							margin-left: 6rpx;

							&.liked {
								color: #ff6b6b;
							}

							// #ifdef H5
							margin-left: 10rpx; // H5环境下增大间距
							// #endif
						}

						&.manage-btn {
							margin-left: auto;
						}
					}
				}
			}
		}

		// 加载状态
		.loading-state {
			text-align: center;
			font-size: 24rpx;
			color: #999;
			margin-top: 20rpx;
			padding-top: 20rpx;
			padding-bottom: 120rpx; // 增加底部间距，确保不被底部导航栏遮挡

			// #ifdef H5
			padding-bottom: 160rpx; // H5环境下增加更多的底部间距
			// #endif

			// 无内容提示
			.no-content {
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

	// 添加展开文本的样式
	.expand-text {
		color: #4361ee;
		font-weight: 500;
		display: inline-block;
		transition: all 0.3s ease;
		cursor: pointer;

		// #ifdef H5
		&:hover {
			transform: scale(1.1);
			text-shadow: 0 0 3px rgba(67, 97, 238, 0.3);
		}

		// #endif
	}

	// 小程序和APP的文章列表样式
	// #ifndef H5
	/* 移动端基础容器样式 */
	.mp-scroll-view {
		width: 100%;
		box-sizing: border-box;
		/* 为整个滚动区域添加底部安全距离 */
		padding-bottom: 0;
		/* 移除底部padding */
	}

	.mp-container {
		width: 100%;
		box-sizing: border-box;
		padding: 20rpx;
	}

	.mp-global {
		/* 全局滚动模式下添加更大的底部安全距离 */
		padding-bottom: 140rpx; /* 修改底部间距，确保内容不被底部导航栏遮挡 */
	}

	/* 文章卡片样式 */
	.mp-item {
		background-color: #fff;
		border-radius: 12rpx;
		margin-bottom: 30rpx;
		padding: 20rpx;
		box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
		box-sizing: border-box;
		width: 100%;
		overflow: hidden;
	}

	/* 文章标题样式 */
	.mp-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 16rpx;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		word-break: break-all;
		width: 100%;
		min-height: 90rpx; /* 添加最小高度，确保标题有足够空间 */
	}

	/* 文章摘要样式 */
	.mp-summary {
		font-size: 28rpx; /* 增大字体大小以匹配H5 */
		color: #666;
		line-height: 1.5;
		margin-bottom: 16rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 3; /* 增加行数，从2行改为3行，与H5一致 */
		-webkit-box-orient: vertical;
		word-break: break-all;
		white-space: normal;
		width: 100%;
		min-height: 126rpx; /* 添加最小高度，确保空间足够显示3行 */
		max-height: 126rpx; /* 添加最大高度，防止内容溢出 */
	}

	/* 封面图片样式 */
	.mp-image {
		width: 100%;
		height: 300rpx;
		border-radius: 10rpx;
		overflow: hidden;
		margin-bottom: 20rpx;
		background-color: #f5f5f5;
	}

	.mp-image image {
		width: 100%;
		height: 100%;
		border-radius: 10rpx;
		object-fit: cover;
	}

	/* 底部操作栏样式 */
	.mp-actions {
		display: flex;
		align-items: center;
		padding-top: 15rpx;
		border-top: 1rpx solid #f2f2f2;
		width: 100%;
		box-sizing: border-box;
		flex-wrap: wrap;
	}

	.mp-action {
		display: flex;
		align-items: center;
		margin-right: 20rpx;
	}

	.mp-action text {
		font-size: 24rpx;
		color: #666;
		margin-left: 6rpx;
	}

	.mp-liked {
		color: #ff6b6b !important;
	}

	/* 加载状态样式 */
	.mp-loading {
		text-align: center;
		font-size: 24rpx;
		color: #999;
		/* 减少底部padding，确保在底部导航栏上方完全不可见 */
		padding: 20rpx 0 100rpx; /* 增加底部间距 */
		width: 100%;
	}

	/* 空内容提示样式 */
	.mp-no-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx 0;
		width: 100%;
	}

	.mp-no-content text {
		font-size: 28rpx;
		color: #999;
		margin-top: 20rpx;
	}

	/* 返回顶部按钮样式 */
	.mp-back-top {
		position: fixed;
		bottom: 120rpx;
		right: 20rpx;
		width: 70rpx;
		height: 70rpx;
		background-color: rgba(67, 97, 238, 0.8);
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
		z-index: 100;
	}

	/* 管理按钮样式 */
	.manage-btn {
		margin-left: auto;
	}

	// #endif
</style>