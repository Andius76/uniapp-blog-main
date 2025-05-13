<template>
	<view class="container" :style="{ overflow: 'hidden' }" @touchstart="handleTouchStart" @touchend="handleTouchEnd"
		@touchmove="handleTouchMove">
		<!-- 移除scroll-view，使用普通view来盛放内容，让页面自然滚动 -->
		<view class="article-detail" id="article-detail">
			<!-- 添加顶部导航栏 -->
			<!-- #ifdef H5 -->
			<view class="custom-nav-bar">
				<view class="nav-icon home-icon" @click="navigateToHome">
					<uni-icons type="home" size="24" color="#4361ee"></uni-icons>
				</view>
				<view class="nav-title">文章详情</view>
				<view class="nav-icon share-icon" @click="shareArticle">
					<uni-icons type="paperclip" size="24" color="#4361ee"></uni-icons>
				</view>
			</view>
			<!-- #endif -->

			<!-- 刷新成功提示 -->
			<view class="refresh-success" v-if="data.showRefreshSuccess">
				<uni-icons type="checkmarkempty" size="16" color="#09BB07"></uni-icons>
				<text>刷新成功</text>
			</view>

			<!-- #ifdef H5 -->
			<!-- 自定义刷新指示器 -->
			<view class="refresh-indicator" :class="{'visible': data.isScrollingDown}">
				<text>下拉可以刷新</text>
			</view>
			<!-- #endif -->

			<!-- 加载中提示 -->
			<view class="loading-container" v-if="data.loading">
				<uni-icons type="spinner-cycle" size="40" color="#999"></uni-icons>
				<text>加载中...</text>
			</view>

			<!-- 文章内容区域 -->
			<block v-else-if="data.article.id">
				<!-- 文章标题区域 -->
				<view class="article-header">
					<text class="article-title selectable"
						@longpress="copyText(data.article.title)">{{ data.article.title }}</text>
					<view class="meta-info">
						<!-- 添加作者头像 -->
						<image v-if="data.article.author && data.article.author.avatar"
							:src="formatAvatarUrl(data.article.author.avatar)" class="author-avatar"
							@error="handleAuthorAvatarError" @click="navigateToUserProfile(data.article.author.id)" />
						<text class="author"
							@click="navigateToUserProfile(data.article.author.id)">{{ data.article.author.nickname }}</text>
						<text class="publish-time">{{ formatDate(data.article.createTime) }}</text>
					</view>
				</view>

				<!-- 封面图片区域 - 移到正文内容之前 -->
				<view class="cover-section" v-if="data.article.coverImage">
					<text class="cover-label">封面</text>
					<image :src="formatImageUrl(data.article.coverImage)" mode="aspectFill" class="cover-image"
						@click="previewCoverImage" @error="handleCoverImageError" />
				</view>

				<!-- 正文内容区域 -->
				<view class="content-section">
					<!-- 简单文本渲染 -->
					<view v-if="!data.article.htmlContent">
						<text class="article-content selectable"
							@longpress="copyText(data.article.content)">{{ data.article.content }}</text>
					</view>

					<!-- 富文本渲染预留 -->
					<rich-text v-else class="article-rich-content selectable"
						:nodes="formatHtmlContent(data.article.htmlContent)"></rich-text>
				</view>

				<!-- 标签区域 -->
				<view class="tag-section" v-if="data.article.tags && data.article.tags.length">
					<text class="section-title">文章标签</text>
					<view class="tag-list">
						<view v-for="(tag, index) in data.article.tags" :key="index" class="tag-item">
							{{ tag }}
						</view>
					</view>
				</view>

				<!-- 互动操作栏 - 放在标签区域下方 -->
				<view class="action-bar">
					<view class="action-item" @click="handleLike">
						<uni-icons :type="data.article.isLiked ? 'heart-filled' : 'heart'" size="24"
							:color="data.article.isLiked ? '#ff6b6b' : '#666'" />
						<text>{{ data.article.likeCount || 0 }}</text>
					</view>
					<view class="action-item" @click="handleCollect">
						<uni-icons :type="data.article.isCollected ? 'star-filled' : 'star'" size="24"
							:color="data.article.isCollected ? '#ffc107' : '#666'" />
						<text>{{ data.article.collectCount || 0 }}</text>
					</view>
					<view class="action-item" @click="handleComment">
						<uni-icons type="chatbubble" size="24" color="#666" />
						<text>{{ data.article.commentCount || 0 }}</text>
					</view>
				</view>

				<!-- 评论列表 -->
				<view class="comment-section">
					<text class="section-title">评论（{{ data.article.commentCount }}）</text>
					<view class="comment-list">
						<view v-for="(comment, index) in data.comments" :key="comment.id" class="comment-card">
							<view class="comment-item">
								<image :src="formatAvatarUrl(comment.avatar)" class="comment-avatar"
									@error="() => handleAvatarError(index, 'comment')"
									@click="navigateToUserProfile(comment.userId)" />
								<view class="comment-content">
									<view class="comment-header">
										<text class="comment-author"
											@click="navigateToUserProfile(comment.userId)">{{ comment.author }}</text>
										<view class="comment-actions">
											<view class="like-action" @click="handleCommentLike(index)">
												<uni-icons :type="comment.isLiked ? 'heart-filled' : 'heart'" size="16"
													:color="comment.isLiked ? '#ff6b6b' : '#999'" />
												<text
													:class="{'liked-text': comment.isLiked}">{{ comment.likeCount }}</text>
											</view>
										</view>
									</view>
									<text class="comment-text selectable"
										@longpress="copyText(comment.content)">{{ comment.content }}</text>
									<view class="comment-footer">
										<text class="comment-time">{{ formatDate(comment.createTime) }}</text>
										<text class="reply-btn" @click="replyToComment(index)">回复</text>
									</view>
								</view>
							</view>

							<!-- 评论回复区域 -->
							<view class="reply-list" v-if="comment.replies && comment.replies.length > 0">
								<view v-for="(reply, replyIndex) in getVisibleReplies(comment)" :key="reply.id"
									class="reply-item">
									<image :src="formatAvatarUrl(reply.avatar)" class="reply-avatar"
										@error="() => handleAvatarError(index, 'reply', replyIndex)"
										@click="navigateToUserProfile(reply.userId)" />
									<view class="reply-content-wrapper">
										<view class="reply-content">
											<text class="reply-author"
												@click="navigateToUserProfile(reply.userId)">{{ reply.author }}</text>
											<text v-if="reply.replyUser" class="reply-to">回复</text>
											<text v-if="reply.replyUser" class="reply-to-author"
												@click="navigateToUserProfile(reply.replyUserId)">@{{ reply.replyUser }}</text>
											<text class="reply-text selectable"
												@longpress="copyText(reply.content)">：{{ reply.content }}</text>
										</view>
										<view class="reply-footer">
											<text class="reply-time">{{ formatDate(reply.createTime) }}</text>
											<view class="reply-actions">
												<view class="like-action" @click="handleReplyLike(index, replyIndex)">
													<uni-icons :type="reply.isLiked ? 'heart-filled' : 'heart'"
														size="14" :color="reply.isLiked ? '#ff6b6b' : '#999'" />
													<text
														:class="{'liked': reply.isLiked}">{{ reply.likeCount || 0 }}</text>
												</view>
												<text class="reply-btn"
													@click="replyToReply(index, replyIndex)">回复</text>
											</view>
										</view>
									</view>
								</view>

								<!-- 查看更多回复 -->
								<view v-if="comment.replies.length > 2 && !comment.showAllReplies" class="more-replies"
									@click="showAllReplies(index)">
									<text>查看更多{{ comment.replies.length - 2 }}条回复</text>
								</view>
							</view>
						</view>
					</view>

					<!-- 无评论提示 -->
					<view v-if="data.comments.length === 0" class="no-comment">
						<uni-icons type="chat" size="40" color="#ddd"></uni-icons>
						<text>暂无评论，快来发表第一条评论吧</text>
					</view>

					<!-- 加载更多 -->
					<view v-if="data.comments.length > 0" class="load-more">
						<view v-if="data.isLoadingMore" class="loading">
							<uni-icons type="spinner-cycle" size="20" color="#999"></uni-icons>
							<text>加载中...</text>
						</view>
						<view v-else-if="data.hasMoreComments" class="load-more-text" @click="loadMoreComments">
							<text>点击加载更多</text>
						</view>
						<view v-else class="no-more">
							<text>已经到底啦</text>
						</view>
					</view>
				</view>
			</block>

			<!-- 加载失败提示 -->
			<view class="error-container" v-else-if="data.error">
				<uni-icons type="closeempty" size="40" color="#dd6161"></uni-icons>
				<text>{{ data.error }}</text>
				<button class="retry-btn" @click="fetchArticleDetail">重新加载</button>
			</view>
		</view>

		<!-- 评论输入框 -->
		<view class="comment-input-container">
			<input class="comment-input" type="text" v-model="data.commentContent"
				:placeholder="data.replyTarget ? `回复 ${data.replyTarget}` : '说点什么...'" confirm-type="send"
				@confirm="submitComment" @focus="handleInputFocus" @blur="handleInputBlur" />
			<button class="send-btn" :disabled="!data.commentContent.trim()" @click="submitComment">发送</button>

			<!-- #ifdef APP-PLUS || MP-WEIXIN -->
			<!-- 回到顶部按钮，固定在发送按钮右侧 -->
			<view class="fixed-top-btn" v-if="data.lastScrollTop > 300 && !data.isInputFocused" @click="scrollToTop">
				<uni-icons type="top" size="20" color="#ffffff"></uni-icons>
			</view>
			<!-- #endif -->
		</view>

		<!-- 只在H5环境中使用浮动的回到顶部组件 -->
		<!-- #ifdef H5 -->
		<back-to-top ref="backToTopRef" :threshold="300" :hide-after-click="true" :duration="0" @click="scrollToTop" />
		<!-- #endif -->
	</view>
</template>

<script setup>
	import {
		reactive,
		onMounted,
		onUnmounted,
		ref,
		nextTick,
		computed,
		watch
	} from 'vue';
	import {
		onLoad,
		onPageScroll,
		onReachBottom
	} from '@dcloudio/uni-app';
	import {
		getArticleDetail,
		likeArticle,
		collectArticle,
		getArticleComments,
		commentArticle,
		likeComment
	} from '@/api/article';
	import http from '@/utils/request';
	import {
		getBaseUrl
	} from '@/utils/request'; // 引入统一的getBaseUrl函数
	// 导入回到顶部组件
	import BackToTop from '@/components/back-to-top/back-to-top.vue';

	// 添加组件引用
	const backToTopRef = ref(null);

	const data = reactive({
		loading: true, // 是否正在加载文章
		error: null, // 加载错误信息
		articleId: 0, // 文章ID
		article: {
			id: 0,
			title: '',
			content: '',
			author: {
				nickname: '',
				avatar: ''
			},
			createTime: '',
			tags: [],
			coverImage: '',
			likeCount: 0,
			collectCount: 0,
			commentCount: 0,
			isLiked: false,
			isCollected: false
		},
		comments: [],
		commentContent: '', // 评论输入内容
		replyTarget: '', // 回复的目标用户
		replyToCommentIndex: -1, // 回复的评论索引
		replyToReplyIndex: -1, // 回复的回复索引
		replyUserId: null, // 回复的用户ID
		parentId: null, // 父评论ID
		inputBottom: 0, // 键盘高度调整
		refreshing: false, // 是否正在刷新中
		showRefreshSuccess: false, // 是否显示刷新成功提示

		// 评论加载相关状态
		currentPage: 1, // 当前评论页码
		pageSize: 10, // 每页评论数量
		hasMoreComments: true, // 是否还有更多评论
		isLoadingMore: false, // 是否正在加载更多评论

		// H5滑块优化相关
		showScrollTopBtn: false, // 是否显示滚动到顶部按钮
		isScrollingDown: false, // 是否正在向下滚动
		lastScrollTop: 0, // 上次滚动位置
		scrollTimer: null, // 滚动定时器
		isInputFocused: false // 是否正在输入评论
	});

	// 日期格式化函数
	const formatDate = (dateStr) => {
		if (!dateStr) return '';

		const date = new Date(dateStr);
		const now = new Date();
		const diff = now - date; // 时间差（毫秒）

		// 小于1分钟
		if (diff < 60 * 1000) {
			return '刚刚';
		}

		// 小于1小时
		if (diff < 60 * 60 * 1000) {
			return `${Math.floor(diff / (60 * 1000))}分钟前`;
		}

		// 小于24小时
		if (diff < 24 * 60 * 60 * 1000) {
			return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
		}

		// 小于30天
		if (diff < 30 * 24 * 60 * 60 * 1000) {
			return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
		}

		// 大于30天，显示具体日期
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const hour = date.getHours().toString().padStart(2, '0');
		const minute = date.getMinutes().toString().padStart(2, '0');

		// 如果是今年，不显示年份
		if (year === now.getFullYear()) {
			return `${month}月${day}日 ${hour}:${minute}`;
		}

		return `${year}年${month}月${day}日 ${hour}:${minute}`;
	};

	/**
	 * 获取基础URL
	 */
	// 已引入统一的getBaseUrl，不需要本地定义

	// 处理头像URL格式，与my.vue保持一致
	const formatAvatarUrl = (url) => {
		if (!url) return '/static/images/avatar.png';

		// 移除URL中可能存在的多余空格
		url = url.trim();

		// 确保不是字符串形式的null或undefined
		if (url === 'null' || url === 'undefined' || url === '') {
			return '/static/images/avatar.png';
		}

		// 如果已经是完整的URL（包含http或https），直接返回
		if (url.startsWith('http://') || url.startsWith('https://')) {
			// 检查并修复双斜杠问题
			if (url.includes('//uploads')) {
				url = url.replace('//uploads', '/uploads');
			}
			return url;
		}

		// 如果是静态资源路径，直接返回
		if (url.startsWith('/static/')) {
			return url;
		}

		// 其他情况：添加基础URL前缀
		const baseUrl = getBaseUrl();
		const timestamp = new Date().getTime(); // 添加时间戳防止缓存

		// 处理仅包含文件名的情况（如 user_5_1746725805869.jpg）
		if (url.includes('user_') && !url.includes('/')) {
			return `${baseUrl}/uploads/avatars/${url}?t=${timestamp}`;
		}

		// 处理以/开头的路径
		if (url.startsWith('/')) {
			// 如果包含uploads/avatars路径，直接拼接
			if (url.includes('/uploads/avatars/')) {
				return `${baseUrl}${url}?t=${timestamp}`;
			}
			// 其他路径直接拼接
			return `${baseUrl}${url}?t=${timestamp}`;
		}

		// 默认情况：假设是文件名，添加标准路径
		return `${baseUrl}/uploads/avatars/${url}?t=${timestamp}`;
	};

	// 处理图片URL的函数，确保使用完整URL（保留原函数用于非头像图片）
	const formatImageUrl = (url) => {
		console.log('处理图片URL:', url, '类型:', typeof url);

		// 对于空值或未定义，返回默认头像
		if (!url) {
			console.log('空URL，返回默认头像');
			return '/static/images/avatar.png';
		}

		// 移除URL中可能存在的多余空格
		url = url.trim();

		// 确保不是字符串形式的null或undefined
		if (url === 'null' || url === 'undefined' || url === '') {
			console.log('无效URL值，返回默认头像');
			return '/static/images/avatar.png';
		}

		// 完整URL处理：如果已经是完整URL（包含http）则不处理
		if (url.startsWith('http')) {
			// 检查并修复双斜杠问题
			if (url.includes('//uploads')) {
				url = url.replace('//uploads', '/uploads');
				console.log('修复双斜杠问题，结果:', url);
			}
			console.log('返回完整URL:', url);
			return url;
		}
		// 静态资源处理：如果是静态资源路径则不处理
		else if (url.startsWith('/static')) {
			console.log('返回静态资源路径:', url);
			return url;
		}
		// 其他情况：添加基础URL前缀
		else {
			let fullUrl;
			if (url.startsWith('/')) {
				fullUrl = getBaseUrl() + url;
			} else {
				fullUrl = getBaseUrl() + '/' + url;
			}
			console.log('构建完整URL:', fullUrl);
			return fullUrl;
		}
	};

	// 处理封面图片加载失败
	const handleCoverImageError = () => {
		console.error(`封面图片加载失败:`, data.article.coverImage);

		// 记录原始URL用于调试
		const originalUrl = data.article.coverImage;

		// 如果加载失败，尝试修复一些常见问题
		if (data.article.coverImage && data.article.coverImage.includes('http://localhost:8080')) {
			// 替换localhost可能不可访问的问题
			const fixedUrl = data.article.coverImage.replace('http://localhost:8080', getBaseUrl());
			console.log(`尝试修复localhost URL: ${data.article.coverImage} -> ${fixedUrl}`);
			data.article.coverImage = fixedUrl;
			return; // 给修复的URL一次机会
		}

		// 如果文章有其他图片，尝试使用文章中的图片作为封面
		if (data.article.images && data.article.images.length > 0) {
			console.log(`尝试使用文章的第一张图片作为封面替代:`, data.article.images[0]);
			const imageUrl = data.article.images[0];
			// 如果图片URL不是http开头，添加基础URL
			if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/static')) {
				if (imageUrl.startsWith('/')) {
					data.article.coverImage = getBaseUrl() + imageUrl;
				} else {
					data.article.coverImage = getBaseUrl() + '/' + imageUrl;
				}
			} else {
				data.article.coverImage = imageUrl;
			}
		} else {
			// 如果没有其他图片，使用默认封面
			console.log(`使用默认图片作为封面(原URL:${originalUrl})`);
			data.article.coverImage = '/static/images/img1.png';
		}
	};

	// 处理作者头像加载失败
	const handleAuthorAvatarError = () => {
		console.error(`[头像错误] 作者头像加载失败:`, data.article.author?.avatar);

		// 尝试修复头像URL
		if (data.article.author?.avatar) {
			const originalUrl = data.article.author.avatar;

			// 检查是否需要修复为uploads/avatars路径
			if (originalUrl.includes('user_') && !originalUrl.includes('/uploads/avatars/')) {
				const fileName = originalUrl.split('/').pop();
				const fixedUrl = getBaseUrl() + '/uploads/avatars/' + fileName;
				console.log(`[头像修复] 尝试修复作者头像路径: ${originalUrl} -> ${fixedUrl}`);
				data.article.author.avatar = fixedUrl;
				return;
			}
		}

		// 如果无法修复，使用默认头像
		data.article.author.avatar = '/static/images/avatar.png';
		console.log('[头像错误] 已设置默认头像');
	};

	// 加载文章详情
	const fetchArticleDetail = async () => {
		data.loading = true;
		data.error = null;

		try {
			const response = await getArticleDetail(data.articleId);
			console.log('文章详情响应:', JSON.stringify(response));

			if (response.code === 200 && response.data) {
				// 更新文章信息
				data.article = response.data;

				// 处理封面图片URL
				if (data.article.coverImage) {
					data.article.coverImage = formatImageUrl(data.article.coverImage);
				}

				// 详细记录作者数据，用于调试
				console.log('[作者信息] 原始数据:', data.article.author ? JSON.stringify(data.article.author) : '无作者数据');

				// 确保作者头像URL正确，使用formatAvatarUrl处理
				if (data.article.author && data.article.author.avatar) {
					console.log('[作者头像] 处理前:', data.article.author.avatar);

					// 检查是否为用户头像文件格式：user_[id]_[timestamp].jpg
					const avatarUrl = data.article.author.avatar;
					if (avatarUrl.includes('user_') && !avatarUrl.includes('/uploads/avatars/')) {
						// 提取文件名
						const fileName = avatarUrl.split('/').pop();
						if (fileName.match(/^user_\d+_\d+\.\w+$/)) {
							// 直接构建完整路径
							data.article.author.avatar = getBaseUrl() + '/uploads/avatars/' + fileName;
							console.log('[作者头像] 直接补全头像路径:', data.article.author.avatar);
						} else {
							// 使用通用处理方法
							data.article.author.avatar = formatAvatarUrl(data.article.author.avatar);
						}
					} else {
						// 使用通用处理方法
						data.article.author.avatar = formatAvatarUrl(data.article.author.avatar);
					}

					console.log('[作者头像] 处理后:', data.article.author.avatar);
				} else if (data.article.author) {
					// 如果作者存在但头像为空，设置默认头像
					console.log('[作者头像] 头像为空，设置默认头像');
					data.article.author.avatar = '/static/images/avatar.png';
				}

				// 确保所有计数字段为有效数值
				// 收藏数处理
				if (data.article.collectCount === undefined || data.article.collectCount === null) {
					data.article.collectCount = 0;
				} else {
					// 转换为数字类型
					data.article.collectCount = parseInt(data.article.collectCount) || 0;
				}

				// 点赞数处理
				if (data.article.likeCount === undefined || data.article.likeCount === null) {
					data.article.likeCount = 0;
				} else {
					// 转换为数字类型
					data.article.likeCount = parseInt(data.article.likeCount) || 0;
				}

				// 评论数处理
				if (data.article.commentCount === undefined || data.article.commentCount === null) {
					data.article.commentCount = 0;
				} else {
					// 转换为数字类型
					data.article.commentCount = parseInt(data.article.commentCount) || 0;
				}

				// 明确处理收藏状态，确保布尔值类型
				data.article.isCollected = !!data.article.isCollected;

				// 明确处理点赞状态，确保布尔值类型
				data.article.isLiked = !!data.article.isLiked;

				console.log('处理后的文章数据:', {
					collectCount: data.article.collectCount,
					commentCount: data.article.commentCount,
					likeCount: data.article.likeCount,
					isCollected: data.article.isCollected,
					isLiked: data.article.isLiked
				});

				// 加载评论
				fetchComments();
			} else {
				data.error = response.message || '获取文章详情失败';
			}
		} catch (error) {
			console.error('获取文章详情出错:', error);
			data.error = '网络错误，请稍后重试';
		} finally {
			data.loading = false;
		}
	};

	// 加载评论列表
	const fetchComments = async () => {
		try {
			data.isLoadingMore = true;

			const response = await getArticleComments(data.articleId, {
				page: data.currentPage,
				pageSize: data.pageSize
			});

			console.log('获取评论响应数据:', JSON.stringify(response));

			if (response.code === 200 && response.data) {
				console.log('获取到的评论数据结构:', JSON.stringify(response.data));

				// 提取评论数据，适配后端返回结构
				const {
					records,
					total,
					current,
					size
				} = response.data;

				console.log('评论记录详情:', JSON.stringify(records));

				// 将数据转换为组件需要的格式
				const formattedComments = [];

				// 先创建评论ID到评论对象的映射，方便快速查找
				const commentMap = {};

				// 第一轮：处理所有评论，将它们按ID存储到映射中
				records.forEach(comment => {
					// 跳过处理parentId不为空的记录，这些是回复而不是父评论
					if (comment.parentId) {
						console.log(`[评论处理] 跳过子评论(${comment.id})处理，等待第二轮`);
						return;
					}

					console.log('[评论处理] 开始处理父评论:', comment.id);

					// 确保所有ID为字符串类型
					const commentId = String(comment.id);

					// 处理用户信息（适配后端返回结构）
					let userId, nickname, avatar;

					// 增强用户信息提取逻辑
					if (comment.author && typeof comment.author === 'object') {
						// 新版后端返回格式
						userId = String(comment.author.id || 0);
						nickname = comment.author.nickname || "未知用户";
						avatar = comment.author.avatar || "";
						console.log('[评论处理] 从author对象提取头像:', avatar);
					} else if (comment.user && typeof comment.user === 'object') {
						// 另一种可能的后端返回格式
						userId = String(comment.user.id || 0);
						nickname = comment.user.nickname || "未知用户";
						avatar = comment.user.avatar || "";
						console.log('[评论处理] 从user对象提取头像:', avatar);
					} else if (comment.userId) {
						// 旧版后端返回格式
						userId = String(comment.userId);
						nickname = comment.nickname || "未知用户";
						avatar = comment.avatar || "";
						console.log('[评论处理] 从评论直接字段提取头像:', avatar);
					} else {
						// 默认值
						userId = "0";
						nickname = "未知用户";
						avatar = "";
						console.log('[评论处理] 无法提取头像，使用默认头像');
					}

					// 确保头像URL正确
					avatar = formatAvatarUrl(avatar);
					console.log('[评论处理] 处理后的头像URL:', avatar);

					// 创建格式化的评论对象
					const formattedComment = {
						id: commentId,
						author: nickname,
						avatar: avatar,
						content: comment.content,
						createTime: comment.createTime,
						likeCount: comment.likeCount || 0,
						isLiked: comment.isLiked || false,
						userId: userId,
						showAllReplies: false,
						replies: []
					};

					// 将评论添加到映射中
					commentMap[commentId] = formattedComment;
					// 将评论添加到结果数组
					formattedComments.push(formattedComment);
				});

				// 第二轮：处理所有回复，将它们添加到相应的父评论中
				records.forEach(comment => {
					// 只处理有parentId的评论(即回复)
					if (!comment.parentId) {
						return;
					}

					const parentIdStr = String(comment.parentId);
					console.log(`[回复处理] 处理回复(${comment.id})到父评论(${parentIdStr})`);

					// 查找父评论
					const parentComment = commentMap[parentIdStr];
					if (!parentComment) {
						console.error(`[回复处理] 未找到父评论(${parentIdStr})，可能是数据不完整`);
						return;
					}

					// 处理回复用户信息
					let userId, nickname, avatar;

					// 提取评论用户信息
					if (comment.author && typeof comment.author === 'object') {
						userId = String(comment.author.id || 0);
						nickname = comment.author.nickname || "未知用户";
						avatar = comment.author.avatar || "";
					} else if (comment.user && typeof comment.user === 'object') {
						userId = String(comment.user.id || 0);
						nickname = comment.user.nickname || "未知用户";
						avatar = comment.user.avatar || "";
					} else if (comment.userId) {
						userId = String(comment.userId);
						nickname = comment.nickname || "未知用户";
						avatar = comment.avatar || "";
					} else {
						userId = "0";
						nickname = "未知用户";
						avatar = "";
					}

					// 处理头像URL
					avatar = formatAvatarUrl(avatar);

					// 处理回复目标用户
					let replyToUser = null;
					let replyToUserId = null;

					if (comment.replyUserId) {
						replyToUserId = String(comment.replyUserId);
						replyToUser = comment.replyUser || comment.replyNickname || "未知用户";
					}

					// 创建回复对象
					const replyObj = {
						id: String(comment.id),
						author: nickname,
						avatar: avatar,
						content: comment.content,
						createTime: comment.createTime,
						userId: userId,
						replyUser: replyToUser,
						replyUserId: replyToUserId,
						likeCount: comment.likeCount !== undefined ? parseInt(comment.likeCount) || 0 :
							0,
						isLiked: comment.isLiked || false
					};

					// 将回复添加到父评论的回复列表
					parentComment.replies.push(replyObj);
				});

				// 对每个评论的回复按时间排序，最新的在前面
				formattedComments.forEach(comment => {
					if (comment.replies && comment.replies.length > 0) {
						comment.replies.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
					}
				});

				// 第一页直接替换，其他页追加
				if (data.currentPage === 1) {
					data.comments = formattedComments;
				} else {
					data.comments = [...data.comments, ...formattedComments];
				}

				// 判断是否还有更多评论
				const totalPages = Math.ceil(total / size);
				data.hasMoreComments = current < totalPages;

				console.log('处理后的评论数量:', data.comments.length);
				console.log('父评论数量:', formattedComments.length);
				let replyTotal = 0;
				formattedComments.forEach(c => replyTotal += c.replies.length);
				console.log('子评论总数:', replyTotal);
			} else {
				uni.showToast({
					title: response.message || '获取评论失败',
					icon: 'none'
				});
			}
		} catch (error) {
			console.error('获取评论出错:', error);
			uni.showToast({
				title: '网络错误，请稍后重试',
				icon: 'none'
			});
		} finally {
			data.isLoadingMore = false;
		}
	};

	onLoad((options) => {
		if (options?.id) {
			data.articleId = options.id;

			// 加载页面时，检查本地存储的收藏状态
			try {
				let collectedArticles = uni.getStorageSync('collectedArticles') || {};
				if (collectedArticles[data.articleId]) {
					console.log('从本地存储恢复收藏状态:', data.articleId);
					// 这里暂不设置，等fetchArticleDetail获取后端数据后再确认
				}
			} catch (e) {
				console.error('读取收藏状态错误:', e);
			}

			fetchArticleDetail();
		} else {
			data.error = '未找到文章ID';
			data.loading = false;
		}

		// 显示评论区
		if (options?.showComments) {
			// 可以滚动到评论区
			setTimeout(() => {
				const query = uni.createSelectorQuery();
				query.select('.comment-section').boundingClientRect();
				query.selectViewport().scrollOffset();
				query.exec(res => {
					if (res && res[0]) {
						uni.pageScrollTo({
							scrollTop: res[0].top,
							duration: 300
						});
					}
				});
			}, 500);
		}
	});

	// 处理文章点赞
	const handleLike = async () => {
		// 检查用户是否登录
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}

		try {
			// 确保点赞数是有效数字
			if (isNaN(data.article.likeCount)) {
				data.article.likeCount = 0;
			}

			// 更新界面
			const newIsLiked = !data.article.isLiked;
			data.article.isLiked = newIsLiked;
			data.article.likeCount = parseInt(data.article.likeCount) || 0; // 确保是数字
			data.article.likeCount += newIsLiked ? 1 : -1;

			// 确保点赞数不小于0
			if (data.article.likeCount < 0) {
				data.article.likeCount = 0;
			}

			// 发送请求
			const response = await likeArticle(data.articleId, newIsLiked);

			if (response.code !== 200) {
				// 请求失败，恢复状态
				data.article.isLiked = !newIsLiked;
				data.article.likeCount += newIsLiked ? -1 : 1;

				// 确保点赞数不小于0
				if (data.article.likeCount < 0) {
					data.article.likeCount = 0;
				}

				uni.showToast({
					title: response.message || (newIsLiked ? '点赞失败' : '取消点赞失败'),
					icon: 'none'
				});
			} else {
				// 请求成功，更新点赞数（使用后端返回的数据）
				if (response.data && response.data.likeCount !== undefined) {
					data.article.likeCount = parseInt(response.data.likeCount) || 0;
				}

				// 显示点赞成功提示
				uni.showToast({
					title: newIsLiked ? '点赞成功' : '已取消点赞',
					icon: 'success',
					duration: 1500
				});

				// 点赞成功后添加事件通知
				uni.showToast({
					title: newIsLiked ? '点赞成功' : '已取消点赞',
					icon: 'success',
					duration: 1500
				});

				// 发送全局事件，通知文章列表更新点赞状态
				uni.$emit('article_like_updated', {
					articleId: data.articleId,
					isLiked: data.article.isLiked,
					likeCount: data.article.likeCount
				});
			}
		} catch (error) {
			console.error('点赞操作出错:', error);
			// 发生错误，恢复状态
			const newIsLiked = !data.article.isLiked;
			data.article.isLiked = newIsLiked;
			data.article.likeCount += newIsLiked ? 1 : -1;

			// 确保点赞数不小于0
			if (data.article.likeCount < 0) {
				data.article.likeCount = 0;
			}

			uni.showToast({
				title: '网络错误，请稍后重试',
				icon: 'none'
			});
		}
	};

	// 处理文章收藏
	const handleCollect = async () => {
		// 检查用户是否登录
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}

		try {
			// 更新界面前确保收藏数是有效数字
			const collectCount = parseInt(data.article.collectCount) || 0;

			// 更新界面
			const newIsCollected = !data.article.isCollected;
			data.article.isCollected = newIsCollected;

			// 先更新UI以提高响应速度
			data.article.collectCount = collectCount + (newIsCollected ? 1 : -1);
			if (data.article.collectCount < 0) data.article.collectCount = 0;

			console.log('收藏状态变更:', {
				isCollected: data.article.isCollected,
				collectCount: data.article.collectCount
			});

			// 确保articleId是字符串类型
			const articleIdStr = String(data.articleId);

			// 发送请求
			const response = await collectArticle(articleIdStr, newIsCollected);
			console.log('收藏响应:', JSON.stringify(response));

			// 请求有响应，无论成功失败都使用服务器返回的收藏数
			if (response.data && response.data.collectCount !== undefined) {
				data.article.collectCount = parseInt(response.data.collectCount) || 0;
			}

			if (response.code !== 200) {
				// 请求失败，恢复收藏状态
				data.article.isCollected = !newIsCollected;

				uni.showToast({
					title: response.message || (newIsCollected ? '收藏失败' : '取消收藏失败'),
					icon: 'none'
				});
			} else {
				// 在本地存储中记录文章收藏状态，用于页面刷新后恢复
				try {
					let collectedArticles = uni.getStorageSync('collectedArticles') || {};

					if (newIsCollected) {
						collectedArticles[articleIdStr] = true;
					} else {
						delete collectedArticles[articleIdStr];
					}

					uni.setStorageSync('collectedArticles', collectedArticles);
				} catch (e) {
					console.error('存储收藏状态错误:', e);
				}

				// 显示收藏成功提示
				uni.showToast({
					title: newIsCollected ? '收藏成功' : '已取消收藏',
					icon: 'success',
					duration: 1500
				});

				// 收藏成功后添加事件通知
				uni.showToast({
					title: newIsCollected ? '收藏成功' : '已取消收藏',
					icon: 'success',
					duration: 1500
				});

				// 发送全局事件，通知文章列表更新收藏状态
				uni.$emit('article_collect_updated', {
					articleId: data.articleId,
					isCollected: data.article.isCollected,
					collectCount: data.article.collectCount
				});
			}
		} catch (error) {
			console.error('收藏操作出错:', error);
			// 发生错误，恢复状态
			const collectCount = parseInt(data.article.collectCount) || 0;
			data.article.isCollected = !data.article.isCollected;
			data.article.collectCount = data.article.isCollected ? collectCount + 1 : collectCount - 1;
			if (data.article.collectCount < 0) data.article.collectCount = 0;

			uni.showToast({
				title: '网络错误，请稍后重试',
				icon: 'none'
			});
		}
	};

	// 处理评论
	const handleComment = () => {
		// 检查用户是否登录
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}

		// 聚焦到评论输入框
		const inputEl = document.querySelector('.comment-input');
		if (inputEl) {
			inputEl.focus();
		}
	};

	// 返回上一页
	const goBack = () => {
		uni.navigateBack({
			delta: 1
		});
	};

	// 处理评论点赞
	const handleCommentLike = async (index) => {
		// 检查用户是否登录
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}

		const comment = data.comments[index];
		if (!comment) return;

		try {
			// 确保评论点赞数是有效数字
			if (isNaN(comment.likeCount)) {
				comment.likeCount = 0;
			}

			// 更新界面
			const newIsLiked = !comment.isLiked;
			comment.isLiked = newIsLiked;
			comment.likeCount = parseInt(comment.likeCount) || 0; // 确保是数字
			comment.likeCount += newIsLiked ? 1 : -1;

			// 确保点赞数不小于0
			if (comment.likeCount < 0) {
				comment.likeCount = 0;
			}

			// 发送请求 - 确保commentId参数使用字符串类型
			const commentId = String(comment.id);
			const response = await likeComment(commentId, newIsLiked);

			if (response.code !== 200) {
				// 请求失败，恢复状态
				comment.isLiked = !newIsLiked;
				comment.likeCount += newIsLiked ? -1 : 1;

				// 确保点赞数不小于0
				if (comment.likeCount < 0) {
					comment.likeCount = 0;
				}

				uni.showToast({
					title: response.message || (newIsLiked ? '点赞失败' : '取消点赞失败'),
					icon: 'none'
				});
			} else {
				// 请求成功，更新点赞数（使用后端返回的数据）
				if (response.data && response.data.likeCount !== undefined) {
					comment.likeCount = parseInt(response.data.likeCount) || 0;
				}

				// 显示点赞成功提示
				uni.showToast({
					title: newIsLiked ? '点赞成功' : '已取消点赞',
					icon: 'success',
					duration: 1500
				});
			}
		} catch (error) {
			console.error('评论点赞操作出错:', error);
			// 发生错误，恢复状态
			const newIsLiked = !comment.isLiked;
			comment.isLiked = newIsLiked;
			comment.likeCount += newIsLiked ? 1 : -1;

			// 确保点赞数不小于0
			if (comment.likeCount < 0) {
				comment.likeCount = 0;
			}

			uni.showToast({
				title: '网络错误，请稍后重试',
				icon: 'none'
			});
		}
	};

	// 回复评论
	const replyToComment = (index) => {
		// 检查用户是否登录
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}

		const comment = data.comments[index];
		if (!comment) return;

		data.replyTarget = comment.author;
		data.replyToCommentIndex = index;
		data.replyToReplyIndex = -1;

		// 确保设置为字符串类型，不在提交时再转换
		data.parentId = String(comment.id);
		data.replyUserId = String(comment.userId);

		console.log('设置回复评论:', {
			parentId: data.parentId,
			replyUserId: data.replyUserId,
			replyTarget: data.replyTarget
		});

		// 聚焦到输入框
		const inputEl = document.querySelector('.comment-input');
		if (inputEl) {
			inputEl.focus();
		}
	};

	// 回复回复
	const replyToReply = (commentIndex, replyIndex) => {
		// 检查用户是否登录
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}

		const comment = data.comments[commentIndex];
		if (!comment || !comment.replies || !comment.replies[replyIndex]) return;

		const reply = comment.replies[replyIndex];
		data.replyTarget = reply.author;
		data.replyToCommentIndex = commentIndex;
		data.replyToReplyIndex = replyIndex;

		// 确保设置为字符串类型，不在提交时再转换
		data.parentId = String(comment.id);
		data.replyUserId = String(reply.userId);

		console.log('设置回复回复:', {
			parentId: data.parentId,
			replyUserId: data.replyUserId,
			replyTarget: data.replyTarget
		});

		// 聚焦到输入框
		const inputEl = document.querySelector('.comment-input');
		if (inputEl) {
			inputEl.focus();
		}
	};

	// 提交评论
	const submitComment = async () => {
		// 检查用户是否登录
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}

		if (!data.commentContent.trim()) return;

		try {
			// 显示提交中加载框
			uni.showLoading({
				title: '发送中...',
				mask: true
			});

			// 使用已经是字符串类型的ID，无需再次转换
			const commentData = {
				content: data.commentContent,
				parentId: data.parentId || null,
				replyUserId: data.replyUserId || null,
				articleId: String(data.articleId)
			};

			console.log('发送评论数据:', commentData);

			// 确保 articleId 也作为字符串传递
			const articleIdStr = String(data.articleId);
			const response = await commentArticle(articleIdStr, commentData);

			// 隐藏加载框
			uni.hideLoading();

			console.log('评论提交结果:', response);

			if (response.code === 200) {
				// 显示成功提示
				uni.showToast({
					title: '评论成功',
					icon: 'success',
					duration: 2000
				});

				// 清空输入框和状态
				data.commentContent = '';
				data.replyTarget = '';
				data.replyToCommentIndex = -1;
				data.replyToReplyIndex = -1;
				data.parentId = null;
				data.replyUserId = null;

				// 更新文章评论计数
				data.article.commentCount++;

				// 如果返回了评论数据，直接添加到评论列表（优化体验，避免重新请求）
				if (response.data && response.data.id) {
					try {
						// 判断是新评论还是回复
						if (commentData.parentId) {
							// 这是一条回复，添加到对应的父评论的回复列表中
							const parentIndex = data.comments.findIndex(c => String(c.id) === commentData
								.parentId);

							if (parentIndex !== -1) {
								// 构造回复对象
								const newReply = {
									id: String(response.data.id),

									author: response.data.author || (response.data.user ? response.data.user
										.nickname : '未知用户'),
									avatar: formatAvatarUrl(response.data.avatar || (response.data.user ?
										response.data.user.avatar : '')),
									content: response.data.content,
									createTime: response.data.createTime,
									userId: String(response.data.userId || (response.data.user ? response.data
										.user.id : '')),
									replyUser: data.replyTarget,
									replyUserId: commentData.replyUserId,
									likeCount: 0,
									isLiked: false
								};

								// 将回复添加到父评论的回复列表开头
								data.comments[parentIndex].replies.unshift(newReply);

								// 重要：不要将子评论当作父评论添加到评论列表中
								console.log('已将回复添加到父评论下，跳过添加为新评论');
							} else {
								console.error('未找到对应的父评论:', commentData.parentId);
								// 找不到父评论时，刷新评论列表
								data.currentPage = 1;
								fetchComments();
							}
						} else {
							// 这是一条新评论，添加到评论列表开头
							const newComment = {
								id: String(response.data.id),
								author: response.data.author || (response.data.user ? response.data.user
									.nickname : '未知用户'),
								avatar: formatAvatarUrl(response.data.avatar || (response.data.user ? response
									.data.user.avatar : '')),
								content: response.data.content,
								createTime: response.data.createTime,
								likeCount: 0,
								isLiked: false,
								userId: String(response.data.userId || (response.data.user ? response.data.user
									.id : '')),
								showAllReplies: false,
								replies: []
							};

							data.comments.unshift(newComment);
						}
					} catch (e) {
						console.error('处理新评论数据出错:', e);
						// 出错时，回退到重新请求评论列表
						data.currentPage = 1;
						fetchComments();
					}
				} else {
					// 如果没有返回评论数据，则刷新评论列表
					data.currentPage = 1;
					fetchComments();
				}

				// 评论成功后添加事件通知
				// 发送全局事件，通知文章列表更新评论数
				uni.$emit('article_comment_updated', {
					articleId: data.articleId,
					commentCount: data.article.commentCount
				});
			} else {
				uni.showToast({
					title: response.message || '评论失败',
					icon: 'none',
					duration: 2000
				});
			}
		} catch (error) {
			console.error('提交评论出错:', error);
			uni.hideLoading();
			uni.showToast({
				title: '网络错误，请稍后重试',
				icon: 'none',
				duration: 2000
			});
		}
	};

	// 显示所有回复
	const showAllReplies = (index) => {
		if (data.comments[index]) {
			data.comments[index].showAllReplies = true;
		}
	};

	// 处理输入框获得焦点
	const handleInputFocus = (e) => {
		// 处理键盘弹出
		data.inputBottom = e.detail.height || 0;

		// 设置输入框焦点状态
		data.isInputFocused = true;

		// #ifdef APP-PLUS || MP-WEIXIN
		// APP和小程序环境下，使用固定位置，而不是过高的位置
		if (data.inputBottom > 0) {
			// 使用较小的固定值，确保输入框就在键盘上方
			data.inputBottom = 0;

			// 延迟滚动到评论区，确保视图已更新
			setTimeout(() => {
				uni.pageScrollTo({
					selector: '.comment-section',
					duration: 300
				});
			}, 100);
		}
		// #endif

		// 输入框获得焦点时，隐藏回到顶部按钮
		if (backToTopRef.value) {
			console.log('输入框获得焦点，隐藏回到顶部按钮');
			data.showScrollTopBtn = false;
			// 强制隐藏组件
			backToTopRef.value.hideButton && backToTopRef.value.hideButton();
		}
	}

	// 处理输入框失去焦点
	const handleInputBlur = () => {
		// 重置输入框焦点状态
		data.isInputFocused = false;

		// 延迟重置输入框位置，避免闪烁
		setTimeout(() => {
			data.inputBottom = 0;
		}, 100);

		// 输入框失去焦点后，根据当前滚动位置决定是否显示回到顶部按钮
		setTimeout(() => {
			// #ifdef APP-PLUS || MP-WEIXIN
			if (data.lastScrollTop > 300 && backToTopRef.value) {
				console.log('输入框失去焦点，当前滚动位置:', data.lastScrollTop);
				if (backToTopRef.value.showButton) {
					backToTopRef.value.showButton();
				}
			}
			// #endif
		}, 300);
	}

	// 处理下拉刷新事件
	const onRefresh = () => {
		data.refreshing = true;
		fetchArticleDetail();
	};

	// 刷新文章数据
	const refreshArticleData = async () => {
		try {
			// 显示加载提示
			uni.showLoading({
				title: '刷新中...',
				mask: true
			});

			await fetchArticleDetail();

			// 隐藏加载提示
			uni.hideLoading();

			// 刷新完成后显示成功提示
			data.refreshing = false;
			data.showRefreshSuccess = true;

			// 2秒后隐藏成功提示
			setTimeout(() => {
				data.showRefreshSuccess = false;
			}, 2000);

			// 震动反馈
			// #ifdef APP-PLUS || MP-WEIXIN
			uni.vibrateShort();
			// #endif
		} catch (error) {
			console.error('刷新文章数据出错:', error);
			data.refreshing = false;
			uni.hideLoading();

			uni.showToast({
				title: '刷新失败',
				icon: 'none'
			});
		}
	};

	// 刷新恢复事件
	const onRestore = () => {
		console.log('刷新控件恢复默认状态');
	};

	/**
	 * 加载更多评论
	 */
	const loadMoreComments = () => {
		if (data.isLoadingMore || !data.hasMoreComments) return;

		console.log(`加载更多评论，当前页: ${data.currentPage}，加载下一页: ${data.currentPage + 1}`);

		// 显示加载中的状态
		data.isLoadingMore = true;

		// 递增页码
		data.currentPage++;

		// 调用加载评论函数
		fetchComments();
	};

	// 格式化HTML内容，处理特殊标签
	const formatHtmlContent = (htmlContent) => {
		if (!htmlContent) return '';

		// 增强HTML内容处理
		let content = htmlContent;

		// 处理段落标签样式
		content = content.replace(/<p/g, '<p style="margin-bottom:30rpx;display:block;line-height:1.8;"');

		// 处理图片标签，确保图片响应式
		content = content.replace(/<img/g,
			'<img style="max-width:100%;height:auto;display:block;margin:20rpx 0;border-radius:8rpx;"');

		// 处理标题标签
		content = content.replace(/<h1/g,
			'<h1 style="font-size:36rpx;font-weight:bold;margin:30rpx 0 20rpx;line-height:1.4;"');
		content = content.replace(/<h2/g,
			'<h2 style="font-size:32rpx;font-weight:bold;margin:30rpx 0 20rpx;line-height:1.4;"');
		content = content.replace(/<h3/g,
			'<h3 style="font-size:30rpx;font-weight:bold;margin:30rpx 0 20rpx;line-height:1.4;"');

		// 确保换行标签正确显示
		content = content.replace(/<br>/g,
			'<br style="display:block;margin-bottom:10rpx;content:\'\';height:10rpx;" />');

		// 为空段落添加高度
		content = content.replace(/<p>\s*<\/p>/g, '<p style="height:30rpx;margin-bottom:30rpx;display:block;"></p>');

		// 处理链接样式
		content = content.replace(/<a/g, '<a style="color:#4361ee;text-decoration:none;"');

		// 处理列表样式
		content = content.replace(/<ul/g, '<ul style="padding-left:40rpx;margin-bottom:20rpx;"');
		content = content.replace(/<ol/g, '<ol style="padding-left:40rpx;margin-bottom:20rpx;"');
		content = content.replace(/<li/g, '<li style="margin-bottom:10rpx;display:list-item;"');

		return content;
	};

	// 处理页面滚动事件（改用onPageScroll生命周期）
	onPageScroll(e => {
		// 获取当前滚动位置
		const scrollTop = e.scrollTop;

		// 根据滚动位置决定是否显示回到顶部按钮
		data.showScrollTopBtn = scrollTop > 300;

		// #ifdef APP-PLUS || MP-WEIXIN
		// 同步更新回到顶部按钮的显示状态
		if (backToTopRef.value) {
			if (scrollTop > 300) {
				// 如果没有正在输入评论则显示按钮
				if (!data.isInputFocused) {
					backToTopRef.value.showButton && backToTopRef.value.showButton();
				}
			} else {
				// 隐藏按钮
				backToTopRef.value.hideButton && backToTopRef.value.hideButton();
			}
		}
		// #endif

		// 判断滚动方向
		const isScrollingDown = scrollTop > data.lastScrollTop;
		data.isScrollingDown = isScrollingDown && scrollTop < 100; // 仅在顶部附近显示下拉提示

		// 更新上次滚动位置
		data.lastScrollTop = scrollTop;

		// 防抖处理
		if (data.scrollTimer) {
			clearTimeout(data.scrollTimer);
		}

		data.scrollTimer = setTimeout(() => {
			// 滚动停止后，隐藏下拉提示
			data.isScrollingDown = false;
		}, 200);
	});

	// 滚动到底部时加载更多评论
	onReachBottom(() => {
		console.log('滚动到底部，尝试加载更多评论');

		// 防止频繁触发，加入简单节流
		if (!data.isLoadingMore && data.hasMoreComments) {
			loadMoreComments();
		} else {
			console.log('跳过加载更多评论：已在加载中或没有更多评论');
		}
	});

	// 修改滚动到顶部函数，使用组件方法
	const scrollToTop = () => {
		if (backToTopRef.value) {
			backToTopRef.value.scrollToTop();
		} else {
			// 备用方法 - 立即滚动无缓冲
			uni.pageScrollTo({
				scrollTop: 0,
				duration: 0 // 设置为0实现立即滚动
			});
		}
	};

	// 用于处理下拉刷新的触摸事件
	let touchStartY = 0;
	let touchEndY = 0;

	// 触摸开始事件
	const handleTouchStart = (event) => {
		// 处理touch事件，获取起始Y坐标
		if (event.touches && event.touches.length > 0) {
			touchStartY = event.touches[0].clientY;
		} else if (event.changedTouches && event.changedTouches.length > 0) {
			touchStartY = event.changedTouches[0].clientY;
		}
	};

	// 触摸结束事件
	const handleTouchEnd = (event) => {
		// 处理touch事件，获取结束Y坐标
		if (event.changedTouches && event.changedTouches.length > 0) {
			touchEndY = event.changedTouches[0].clientY;
		}

		const diff = touchEndY - touchStartY;

		// 在页面顶部下拉超过100px时触发刷新
		if (diff > 100 && data.lastScrollTop < 50) {
			onRefresh();
		}
	};

	// 设置页面加载完成后的钩子
	onMounted(() => {
		// 在下一帧执行，确保DOM已经渲染
		setTimeout(() => {
			// #ifdef H5
			// H5环境下不再需要额外添加事件监听
			// 因为模板中已经绑定了事件处理函数
			// #endif
		}, 20);
	});

	// 封面图片预览
	const previewCoverImage = () => {
		if (data.article.coverImage) {
			// 确保预览时使用完整URL
			const imageUrl = formatImageUrl(data.article.coverImage);
			uni.previewImage({
				urls: [imageUrl],
				current: imageUrl,
				indicator: 'number',
				loop: false
			});
		}
	};

	// 长按复制文本功能
	const copyText = (text) => {
		uni.setClipboardData({
			data: text,
			success: () => {
				uni.showToast({
					title: '复制成功',
					icon: 'success',
					duration: 1500
				});
			}
		});
	};

	// 处理回复点赞
	const handleReplyLike = async (commentIndex, replyIndex) => {
		// 检查用户是否登录
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}

		const comment = data.comments[commentIndex];
		if (!comment || !comment.replies || !comment.replies[replyIndex]) return;

		const reply = comment.replies[replyIndex];

		try {
			// 确保点赞数是有效数字
			if (isNaN(reply.likeCount)) {
				reply.likeCount = 0;
			}

			// 更新界面
			const newIsLiked = !reply.isLiked;
			reply.isLiked = newIsLiked;
			reply.likeCount = parseInt(reply.likeCount) || 0; // 确保是数字
			reply.likeCount += newIsLiked ? 1 : -1;

			// 确保点赞数不小于0
			if (reply.likeCount < 0) {
				reply.likeCount = 0;
			}

			// 发送请求 - 确保replyId参数使用字符串类型
			const replyId = String(reply.id);
			const response = await likeComment(replyId, newIsLiked);

			if (response.code !== 200) {
				// 请求失败，恢复状态
				reply.isLiked = !newIsLiked;
				reply.likeCount += newIsLiked ? -1 : 1;

				// 确保点赞数不小于0
				if (reply.likeCount < 0) {
					reply.likeCount = 0;
				}

				uni.showToast({
					title: response.message || (newIsLiked ? '点赞失败' : '取消点赞失败'),
					icon: 'none'
				});
			} else {
				// 请求成功，更新点赞数（使用后端返回的数据）
				if (response.data && response.data.likeCount !== undefined) {
					reply.likeCount = parseInt(response.data.likeCount) || 0;
				}

				// 显示点赞成功提示
				uni.showToast({
					title: newIsLiked ? '点赞成功' : '已取消点赞',
					icon: 'success',
					duration: 1500
				});
			}
		} catch (error) {
			console.error('回复点赞操作出错:', error);
			// 发生错误，恢复状态
			const newIsLiked = !reply.isLiked;
			reply.isLiked = newIsLiked;
			reply.likeCount += newIsLiked ? 1 : -1;

			// 确保点赞数不小于0
			if (reply.likeCount < 0) {
				reply.likeCount = 0;
			}

			uni.showToast({
				title: '网络错误，请稍后重试',
				icon: 'none'
			});
		}
	};

	// 处理头像加载错误
	const handleAvatarError = (commentIndex, type, replyIndex) => {
		if (type === 'comment') {
			// 主评论头像加载失败
			if (data.comments[commentIndex]) {
				const originalUrl = data.comments[commentIndex].avatar;
				console.error(`[头像错误] 评论头像加载失败:`, originalUrl);

				// 尝试检查用户ID获取正确头像
				const userId = data.comments[commentIndex].userId;
				if (userId && userId == 5) {
					// 尝试使用已知的用户5最新头像
					const fixedUrl = getBaseUrl() + '/uploads/avatars/user_5_1746725805869.jpg?t=' + new Date()
						.getTime();
					console.log(`[头像修复] 使用用户5的已知头像: ${fixedUrl}`);
					data.comments[commentIndex].avatar = fixedUrl;
					return;
				}

				// 尝试修复头像URL
				if (originalUrl) {
					// 检查并替换可能的硬编码IP地址
					if (originalUrl.includes('http://10.9.135.132:8080') ||
						originalUrl.includes('http://localhost:8080')) {
						const fileName = originalUrl.split('/uploads/avatars/').pop();
						if (fileName) {
							const fixedUrl = getBaseUrl() + '/uploads/avatars/' + fileName + '?t=' + new Date()
								.getTime();
							console.log(`[头像修复] 尝试修复评论头像路径: ${originalUrl} -> ${fixedUrl}`);
							data.comments[commentIndex].avatar = fixedUrl;
							return;
						}
					}

					// 其他情况使用formatAvatarUrl统一处理
					data.comments[commentIndex].avatar = formatAvatarUrl(originalUrl);
					return;
				}

				// 如果无法修复，使用默认头像
				data.comments[commentIndex].avatar = '/static/images/avatar.png';
				console.log('[头像错误] 已为评论设置默认头像');
			}
		} else if (type === 'reply' && replyIndex !== undefined) {
			// 回复评论头像加载失败
			if (data.comments[commentIndex] &&
				data.comments[commentIndex].replies &&
				data.comments[commentIndex].replies[replyIndex]) {

				const reply = data.comments[commentIndex].replies[replyIndex];
				const originalUrl = reply.avatar;
				console.error(`[头像错误] 回复头像加载失败:`, originalUrl);

				// 尝试检查用户ID获取正确头像
				const userId = reply.userId;
				if (userId && userId == 5) {
					// 尝试使用已知的用户5最新头像
					const fixedUrl = getBaseUrl() + '/uploads/avatars/user_5_1746725805869.jpg?t=' + new Date()
						.getTime();
					console.log(`[头像修复] 使用用户5的已知头像: ${fixedUrl}`);
					reply.avatar = fixedUrl;
					return;
				}

				// 尝试修复头像URL
				if (originalUrl) {
					// 检查并替换可能的硬编码IP地址
					if (originalUrl.includes('http://10.9.135.132:8080') ||
						originalUrl.includes('http://localhost:8080')) {
						const fileName = originalUrl.split('/uploads/avatars/').pop();
						if (fileName) {
							const fixedUrl = getBaseUrl() + '/uploads/avatars/' + fileName + '?t=' + new Date()
								.getTime();
							console.log(`[头像修复] 尝试修复回复头像路径: ${originalUrl} -> ${fixedUrl}`);
							reply.avatar = fixedUrl;
							return;
						}
					}

					// 尝试基于文件名修复
					if (originalUrl.includes('user_') && !originalUrl.includes('/')) {
						const fixedUrl = getBaseUrl() + '/uploads/avatars/' + originalUrl + '?t=' + new Date()
							.getTime();
						console.log(`[头像修复] 基于文件名修复: ${fixedUrl}`);
						reply.avatar = fixedUrl;
						return;
					}

					// 其他情况使用formatAvatarUrl统一处理
					reply.avatar = formatAvatarUrl(originalUrl);
					return;
				}

				// 如果无法修复，使用默认头像
				reply.avatar = '/static/images/avatar.png';
				console.log('[头像错误] 已为回复设置默认头像');
			}
		}
	};

	// 添加触摸移动处理函数
	// 触摸移动事件
	const handleTouchMove = (event) => {
		// 当处于页面顶部时，允许下拉刷新行为
		if (data.lastScrollTop <= 0) {
			// 不阻止默认行为，允许下拉刷新
			return;
		}
	};

	// 导航到用户资料页
	const navigateToUserProfile = (userId) => {
		if (!userId) {
			console.error('用户ID为空，无法跳转到用户资料页');
			return;
		}

		// #ifdef H5
		// H5环境下，新窗口打开用户资料页
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		const profileUrl = `${baseUrl}#/pages/user-profile/user-profile?id=${userId}`;
		window.open(profileUrl, '_blank');
		// #endif

		// #ifndef H5
		// 非H5环境下，正常跳转
		uni.navigateTo({
			url: `/pages/user-profile/user-profile?id=${userId}`
		});
		// #endif
	};

	// 获取可见回复
	const getVisibleReplies = (comment) => {
		if (comment.showAllReplies) {
			return comment.replies;
		} else {
			return comment.replies.slice(0, 2);
		}
	};

	// 在script部分添加导航到首页的方法
	const navigateToHome = () => {
		// H5环境下使用更可靠的方式跳转到首页
		// #ifdef H5
		// 获取当前URL的基础部分，构建新的首页URL
		const currentUrl = window.location.href;
		const baseUrl = currentUrl.split('#')[0];
		// 使用替换方式导航，避免历史堆栈问题
		window.location.replace(`${baseUrl}#/pages/index/index`);
		// #endif
		
		// 非H5环境下使用常规Tab跳转
		// #ifndef H5
		uni.switchTab({
			url: '/pages/index/index'
		});
		// #endif
	};

	// 分享文章功能
	const shareArticle = () => {
		if (!data.article || !data.article.id) return;

		try {
			// 构建分享链接
			let articleUrl = '';

			// #ifdef H5
			// 在浏览器环境中直接获取当前URL
			articleUrl = window.location.href;
			// #endif

			// #ifdef APP-PLUS || MP-WEIXIN
			// 在APP或小程序中构建完整URL
			articleUrl = `${getBaseUrl()}/article/${data.article.id}`;
			// #endif

			// 复制链接
			uni.setClipboardData({
				data: articleUrl,
				success: () => {
					uni.showToast({
						title: '链接已复制',
						icon: 'success',
						duration: 2000
					});
				},
				fail: (err) => {
					console.error('复制失败:', err);
					uni.showToast({
						title: '复制失败，请重试',
						icon: 'none'
					});
				}
			});
		} catch (error) {
			console.error('分享错误:', error);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		}
	};
</script>

<style lang="scss">
	.container {
		padding: 20rpx;
		background-color: #fff;
		position: relative;
		min-height: 100vh;

		// #ifdef H5
		// H5环境下特定样式：居中、最大宽度限制
		max-width: 800px;
		margin: 0 auto;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
		padding: 0;
		// #endif
	}

	.article-detail {
		// 修改为使用整个页面的滚动，而非内部scroll-view
		padding-bottom: 150rpx !important; // 增加底部填充，确保内容不被评论框遮挡

		// #ifdef H5
		// H5环境增加阅读舒适度
		padding: 0 40px 150rpx !important;
		// H5平台保留顶部填充适应导航栏
		padding-top: 120rpx !important;
		// #endif

		// #ifdef APP-PLUS || MP-WEIXIN
		// APP和微信小程序减小顶部空间
		padding-top: 30rpx !important;
		// #endif
	}

	// 全局滚动条样式 (H5环境)
	// #ifdef H5
	::-webkit-scrollbar {
		width: 6px;
	}

	::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}

	::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 3px;
		transition: all 0.3s ease;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}

	// 添加平滑滚动到整个页面
	html,
	body {
		scroll-behavior: smooth;
		overscroll-behavior-y: contain; // 防止滚动穿透
		-webkit-overflow-scrolling: touch; // 添加滑动阻尼效果
	}

	// #endif

	.back-button {
		position: fixed;
		top: 40rpx;
		left: 30rpx;
		z-index: 10;
		width: 70rpx;
		height: 70rpx;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

		// #ifdef H5
		// 浏览器版本改进返回按钮样式
		cursor: pointer;
		width: 40px;
		height: 40px;
		top: 20px;
		left: 20px;
		background-color: #f8f8f8;
		transition: all 0.2s ease;

		&:hover {
			background-color: #eaeaea;
			transform: scale(1.05);
		}

		// #endif
	}

	.article-header {
		padding: 30rpx;
		// #ifdef H5
		padding: 60px 0 10px;
		// #endif
		// #ifndef H5
		padding-top: 30rpx;
		// #endif
		border-bottom: 1rpx solid #f0f0f0;

		.article-title {
			font-size: 40rpx;
			font-weight: bold;
			color: #333;
			line-height: 1.4;
			word-wrap: break-word;
			overflow-wrap: break-word;
			user-select: text;

			// #ifdef H5
			font-size: 36px;
			margin-bottom: 15px;
			// #endif
		}

		.meta-info {
			display: flex;
			align-items: center;
			margin-top: 15rpx;
		}

		.author-avatar {
			width: 80rpx;
			height: 80rpx;
			border-radius: 50%;
			margin-right: 16rpx;
			flex-shrink: 0;
			background-color: #f0f0f0;
			/* 添加背景色防止头像加载时的空白 */
			object-fit: cover;
			/* 确保头像适当裁剪填充 */
			border: 1rpx solid #eee;
			/* 添加边框使头像更清晰 */
			cursor: pointer;
			/* 添加鼠标指针样式 */
			transition: all 0.2s ease;
			/* 添加过渡效果 */

			// #ifdef H5
			width: 48px;
			height: 48px;
			// #endif
		}

		.author-avatar:hover {
			opacity: 0.85;
			/* 鼠标悬停时透明度变化 */
			border-color: #3170f9;
			/* 鼠标悬停时边框变色 */
			transform: scale(1.05);
			/* 鼠标悬停时轻微放大 */
			box-shadow: 0 2rpx 8rpx rgba(49, 112, 249, 0.3);
			/* 添加阴影效果 */
		}

		.author {
			font-size: 32rpx;
			color: #666;
			margin-right: 30rpx;
			font-weight: 500;
			cursor: pointer;
			/* 添加鼠标指针样式 */

			// #ifdef H5
			font-size: 20px;
			// #endif
		}

		.author:hover,
		.comment-author:hover,
		.reply-author:hover,
		.reply-to-author:hover {
			color: #3170f9;
			/* 鼠标悬停时变色 */
		}

		.author-avatar:hover,
		.comment-avatar:hover,
		.reply-avatar:hover {
			opacity: 0.8;
			/* 鼠标悬停时轻微透明效果 */
			border-color: #3170f9;
			/* 鼠标悬停时边框变色 */
		}

		.publish-time {
			font-size: 24rpx;
			color: #999;

			// #ifdef H5
			font-size: 14px;
			// #endif
		}
	}

	/* 封面图片区域样式 */
	.cover-section {
		margin: 20rpx 30rpx 30rpx;
		border-radius: 12rpx;
		overflow: hidden;
		width: calc(100% - 60rpx);
		position: relative;
		border: 2rpx dashed #eee;
		padding: 20rpx;
		box-sizing: border-box;

		// #ifdef H5
		margin: 30px 0;
		width: 100%;
		border: none;
		padding: 0;
		// #endif

		.cover-image {
			width: 100%;
			height: 400rpx;
			border-radius: 8rpx;
			object-fit: cover;
			position: relative;
			box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.15); // 增强阴影效果
			background-color: #f5f5f5; // 图片加载前显示的背景色

			// #ifdef H5
			height: 400px;
			border-radius: 8px;
			cursor: pointer; // 鼠标变为手指形状，提示可点击
			transition: all 0.3s ease;

			&:hover {
				transform: scale(1.01);
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

				&::after {
					content: '点击查看大图';
					position: absolute;
					bottom: 10px;
					right: 10px;
					background: rgba(0, 0, 0, 0.5);
					color: white;
					padding: 5px 10px;
					border-radius: 4px;
					font-size: 12px;
				}
			}

			// #endif
		}

		.cover-label {
			position: absolute;
			top: 20rpx;
			left: 20rpx;
			background-color: rgba(0, 0, 0, 0.5);
			color: #fff;
			font-size: 24rpx;
			padding: 6rpx 16rpx;
			border-radius: 6rpx;
			z-index: 1;

			// #ifdef H5
			font-size: 14px;
			padding: 4px 12px;
			border-radius: 4px;
			// #endif
		}
	}

	.content-section {
		padding: 30rpx;

		// #ifdef H5
		padding: 20px 0;
		// #endif

		.article-content {
			font-size: 32rpx;
			color: #333;
			line-height: 1.8;
			// 添加文本换行属性，解决溢出问题
			white-space: normal;

			// #ifdef H5
			font-size: 18px;
			line-height: 1.8;
			// #endif
		}
	}

	.tag-section {
		padding: 30rpx;
		border-top: 16rpx solid #f5f5f5;

		.section-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 30rpx;
		}

		.tag-list {
			display: flex;
			flex-wrap: wrap;
		}

		.tag-item {
			padding: 12rpx 24rpx;
			background-color: #f0f2f5;
			border-radius: 40rpx;
			margin-right: 20rpx;
			margin-bottom: 20rpx;
			font-size: 26rpx;
			color: #666;
			max-width: 100%;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.action-bar {
		// 修改样式，从固定定位改为正常布局流
		position: relative; // 从fixed改为relative
		display: flex;
		justify-content: space-around;
		padding: 30rpx 0;
		margin: 20rpxs 0;
		background-color: #fff;
		border-top: 1rpx solid #eee;
		border-bottom: 1rpx solid #eee;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		z-index: 10;

		.action-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 10rpx 20rpx;

			text {
				margin-top: 8rpx;
				font-size: 28rpx;
				color: #666;
			}

			// #ifdef H5
			transition: transform 0.2s ease;

			&:hover {
				transform: scale(1.05);
			}

			// #endif
		}

		// #ifdef H5
		// 增强H5下的视觉效果
		padding: 20px 0;
		border-radius: 8px;
		margin: 20px 0;
		// #endif
	}

	.comment-section {
		margin-top: 20rpx; // 减小与action-bar的距离
		padding: 20rpx 0;

		// #ifdef H5
		margin-top: 10px;
		// #endif
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
		display: block;
	}

	.comment-list {
		margin-bottom: 30rpx;
	}

	.comment-card {
		background-color: #f9f9f9;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.comment-item {
		display: flex;
		margin-bottom: 16rpx;
	}

	.comment-avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		margin-right: 20rpx;
		flex-shrink: 0;
		background-color: #f0f0f0;
		/* 添加背景色防止头像加载时的空白 */
		object-fit: cover;
		/* 确保头像适当裁剪填充 */
		border: 1rpx solid #eee;
		/* 添加边框使头像更清晰 */
		cursor: pointer;
		/* 添加鼠标指针样式 */
		transition: all 0.2s ease;
		/* 添加过渡效果 */
	}

	.comment-avatar:hover {
		opacity: 0.85;
		/* 鼠标悬停时透明度变化 */
		border-color: #3170f9;
		/* 鼠标悬停时边框变色 */
		transform: scale(1.05);
		/* 鼠标悬停时轻微放大 */
		box-shadow: 0 2rpx 8rpx rgba(49, 112, 249, 0.3);
		/* 添加阴影效果 */
	}

	.comment-content {
		flex: 1;
		width: 0; // 确保弹性布局中的元素不会超出容器
		overflow: hidden;
	}

	.comment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10rpx;
	}

	.comment-author {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		cursor: pointer;
		/* 添加鼠标指针样式 */
		transition: color 0.2s ease;
		/* 添加过渡效果 */
	}

	.comment-author:hover {
		color: #3170f9;
		/* 鼠标悬停时文字变色 */
		text-decoration: underline;
		/* 添加下划线 */
	}

	.comment-actions {
		display: flex;
	}

	.like-action {
		display: flex;
		align-items: center;
	}

	.like-action text {
		font-size: 24rpx;
		color: #999;
		margin-left: 4rpx;
	}

	.like-action .liked {
		color: #ff6b6b;
	}

	.comment-text {
		font-size: 28rpx;
		color: #333;
		line-height: 1.5;
		word-break: break-all;
		word-wrap: break-word;
		white-space: normal;
		overflow-wrap: break-word;

		// #ifdef H5
		padding: 6px 0;

		&.selectable {
			position: relative;

			&:hover {
				background-color: rgba(0, 0, 0, 0.02);
				border-radius: 4px;
			}

			&::after {
				content: '';
				position: absolute;
				right: -16px;
				top: 50%;
				transform: translateY(-50%);
				width: 0;
				height: 0;
				opacity: 0;
				transition: opacity 0.2s;
			}

			&:hover::after {
				content: '长按复制';
				opacity: 1;
				width: auto;
				height: auto;
				background: rgba(0, 0, 0, 0.6);
				color: white;
				font-size: 12px;
				padding: 2px 6px;
				border-radius: 4px;
			}
		}

		// #endif
	}

	.comment-footer {
		display: flex;
		justify-content: space-between;
		margin-top: 10rpx;
	}

	.comment-time {
		font-size: 24rpx;
		color: #999;
	}

	.reply-btn {
		font-size: 24rpx;
		color: #666;
	}

	.reply-list {
		margin-left: 100rpx;
		background-color: #f0f0f0;
		border-radius: 12rpx;
		padding: 16rpx;
		margin-top: 10rpx;
	}

	.reply-item {
		margin-bottom: 16rpx;
		padding-bottom: 16rpx;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: flex-start;
	}

	.reply-avatar {
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		margin-right: 16rpx;
		flex-shrink: 0;
		background-color: #f0f0f0;
		/* 添加背景色防止头像加载时的空白 */
		object-fit: cover;
		/* 确保头像适当裁剪填充 */
		border: 1rpx solid #eee;
		/* 添加边框使头像更清晰 */
		cursor: pointer;
		/* 添加鼠标指针样式 */
		transition: all 0.2s ease;
		/* 添加过渡效果 */
	}

	.reply-avatar:hover {
		opacity: 0.85;
		/* 鼠标悬停时透明度变化 */
		border-color: #3170f9;
		/* 鼠标悬停时边框变色 */
		transform: scale(1.05);
		/* 鼠标悬停时轻微放大 */
		box-shadow: 0 2rpx 6rpx rgba(49, 112, 249, 0.3);
		/* 添加阴影效果 */
	}

	.reply-content-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.reply-item:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.reply-content {
		display: flex;
		flex-wrap: wrap;
		font-size: 26rpx;
		line-height: 1.5;
	}

	.reply-author {
		color: #6495ED;
		font-weight: bold;
		cursor: pointer;
		/* 添加鼠标指针样式 */
		transition: color 0.2s ease;
		/* 添加过渡效果 */
	}

	.reply-author:hover {
		color: #3170f9;
		/* 鼠标悬停时文字变色 */
		text-decoration: underline;
		/* 添加下划线 */
	}

	.reply-to {
		color: #666;
		margin: 0 4rpx;
	}

	.reply-to-author {
		color: #6495ED;
		cursor: pointer;
		/* 添加鼠标指针样式 */
		transition: color 0.2s ease;
		/* 添加过渡效果 */
	}

	.reply-to-author:hover {
		color: #3170f9;
		/* 鼠标悬停时文字变色 */
		text-decoration: underline;
		/* 添加下划线 */
	}

	.reply-text {
		color: #333;
		word-break: break-all;
	}

	.reply-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 24rpx;

		.reply-time {
			color: #999;
		}

		.reply-btn {
			color: #666;
			padding: 8rpx 0;
		}

		.reply-actions {
			display: flex;
			align-items: center;
			gap: 20rpx;

			.like-action {
				display: flex;
				align-items: center;
				gap: 4rpx;

				text {
					font-size: 24rpx;
					color: #999;

					&.liked {
						color: #ff6b6b;
					}
				}
			}
		}
	}

	.more-replies {
		text-align: center;
		margin-top: 10rpx;
		padding-top: 10rpx;
	}

	.more-replies text {
		font-size: 24rpx;
		color: #6495ED;
	}

	.no-comment {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40rpx 0;
		color: #999;
	}

	.no-comment text {
		margin-top: 20rpx;
		font-size: 28rpx;
	}

	// 评论输入框
	.comment-input-container {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		padding: 20rpx 30rpx;
		background-color: #fff;
		border-top: 1rpx solid #eee;
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
		z-index: 100;

		// #ifdef H5
		max-width: 800px;
		left: 50%;
		transform: translateX(-50%);
		border-radius: 12px 12px 0 0;
		padding: 15px 25px;
		bottom: 0 !important; // 确保在H5中固定在底部
		// #endif

		// #ifdef APP-PLUS || MP-WEIXIN
		// APP和小程序环境优化键盘弹出体验
		transition: none; // 取消过渡效果
		bottom: 0 !important; // 强制固定在底部
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); // 增加安全区域
		// #endif

		.comment-input {
			flex: 1;
			height: 70rpx;
			background-color: #f5f5f5;
			border-radius: 35rpx;
			padding: 0 30rpx;
			font-size: 28rpx;

			// #ifdef H5
			height: 40px;
			font-size: 16px;
			border-radius: 20px;
			// #endif
		}

		.send-btn {
			margin-left: 20rpx;
			background-color: #4361ee;
			color: #fff;
			height: 70rpx;
			font-size: 28rpx;
			padding: 0 30rpx;
			border-radius: 35rpx;
			display: flex;
			align-items: center;
			justify-content: center;

			// #ifdef H5
			height: 40px;
			font-size: 16px;
			border-radius: 20px;
			cursor: pointer;
			transition: background-color 0.2s;

			&:hover:not([disabled]) {
				background-color: #3651d3;
			}

			// #endif

			&[disabled] {
				background-color: #cccccc;
				color: #ffffff;
			}
		}

		// APP和小程序环境中的固定顶部按钮样式
		// #ifdef APP-PLUS || MP-WEIXIN
		.fixed-top-btn {
			width: 70rpx;
			height: 70rpx;
			border-radius: 35rpx;
			background-color: #4361ee;
			display: flex;
			justify-content: center;
			align-items: center;
			margin-left: 20rpx;
			box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
			transition: all 0.2s ease;

			&:active {
				transform: scale(0.9);
				background-color: #3651d4;
			}
		}

		// #endif
	}

	// 刷新成功提示
	.refresh-success {
		position: fixed;
		top: 100rpx;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(0, 0, 0, 0.6);
		color: #fff;
		font-size: 26rpx;
		padding: 12rpx 30rpx;
		border-radius: 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;

		text {
			margin-left: 10rpx;
		}
	}

	// 加载更多区域样式
	.load-more {
		text-align: center;
		padding: 30rpx 0;
		margin-bottom: 30rpx;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;

		text {
			margin-left: 10rpx;
			font-size: 26rpx;
			color: #999;
		}
	}

	.load-more-text {
		padding: 20rpx;
		font-size: 26rpx;
		color: #666;
	}

	.no-more {
		font-size: 26rpx;
		color: #999;
	}

	// 加载和错误状态样式
	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 0;
		height: 300px;

		text {
			margin-top: 20px;
			font-size: 28rpx;
			color: #999;
		}
	}

	.error-container text {
		color: #dd6161;
	}

	.retry-btn {
		margin-top: 30rpx;
		background-color: #4361ee;
		color: #fff;
		font-size: 28rpx;
		padding: 12rpx 40rpx;
		border-radius: 40rpx;
	}

	.article-rich-content {
		font-size: 32rpx;
		color: #333;
		line-height: 1.8;
		white-space: normal;
		word-wrap: break-word;
		word-break: break-word;
		overflow-wrap: break-word;
		text-align: justify;
		width: 100%;
		box-sizing: border-box;

		// 富文本内部元素样式
		:deep(p) {
			margin-bottom: 24rpx;
		}
	}

	// #ifdef H5
	// 优化富文本内容样式
	.article-rich-content {
		font-size: 18px !important;
		line-height: 1.8 !important;

		:deep(p) {
			margin-bottom: 16px;
		}

		:deep(img) {
			max-width: 100%;
			height: auto;
			border-radius: 8px;
			margin: 16px 0;
		}

		:deep(h1),
		:deep(h2),
		:deep(h3),
		:deep(h4),
		:deep(h5),
		:deep(h6) {
			margin-top: 32px;
			margin-bottom: 16px;
			font-weight: 600;
			line-height: 1.4;
		}

		:deep(h1) {
			font-size: 32px;
		}

		:deep(h2) {
			font-size: 28px;
		}

		:deep(h3) {
			font-size: 24px;
		}

		:deep(h4) {
			font-size: 20px;
		}

		:deep(a) {
			color: #4361ee;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}

		:deep(pre) {
			background-color: #f8f8f8;
			padding: 16px;
			border-radius: 8px;
			overflow-x: auto;
			margin: 20px 0;
			font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
		}

		:deep(code) {
			font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
			background-color: rgba(0, 0, 0, 0.05);
			padding: 2px 6px;
			border-radius: 3px;
			font-size: 16px;
		}

		:deep(ul),
		:deep(ol) {
			padding-left: 24px;
			margin: 16px 0;
		}

		:deep(li) {
			margin-bottom: 8px;
		}

		:deep(blockquote) {
			border-left: 4px solid #e0e0e0;
			padding-left: 16px;
			margin: 16px 0;
			color: #666;
			font-style: italic;
		}
	}

	// 评论区样式优化
	.comment-section {
		// #ifdef H5
		margin-top: 30px;
		border-top: 1px solid #eee;
		padding-top: 40px;
		// #endif

		// #ifdef APP-PLUS || MP-WEIXIN
		padding-bottom: 120rpx; // 确保底部有足够空间，不被输入框遮挡
		// #endif
	}

	.section-title {
		// #ifdef H5
		font-size: 24px;
		margin-bottom: 24px;
		// #endif
	}

	.comment-card {
		// #ifdef H5
		border-radius: 12px;
		margin-bottom: 24px;
		// #endif
	}

	// 响应式适配，针对较大屏幕
	@media screen and (min-width: 1200px) {
		.container {
			margin-top: 30px;
			margin-bottom: 30px;
			min-height: calc(100vh - 60px);
			border-radius: 12px;
		}

		.article-detail {
			border-radius: 12px;
		}

		.comment-input-container {
			bottom: 30px;
		}
	}

	// 滑动反馈优化
	.article-detail {
		// 添加滑动阻尼效果
		-webkit-overflow-scrolling: touch;
		overscroll-behavior-y: contain; // 防止滚动穿透

		// 滑动时的交互反馈
		.refresh-indicator {
			transition: all 0.3s ease;
			opacity: 0;
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			background-color: rgba(0, 0, 0, 0.7);
			color: white;
			padding: 8px 16px;
			border-radius: 20px;
			font-size: 14px;
			pointer-events: none;
			z-index: 100;

			&.visible {
				opacity: 1;
			}
		}
	}

	// 过渡动画优化
	.scroll-top-btn-fixed {
		// 改进动画
		will-change: opacity, transform;
		animation-fill-mode: both;
	}

	// 滚动过程中的视觉提示
	.scrolling-indicator {
		position: fixed;
		right: 10px;
		top: 50%;
		width: 3px;
		height: 100px;
		background: rgba(200, 200, 200, 0.3);
		border-radius: 3px;
		transform: translateY(-50%);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s;

		&.visible {
			opacity: 1;
		}

		&::after {
			content: '';
			position: absolute;
			width: 100%;
			height: 30px;
			background: #4361ee;
			border-radius: 3px;
			top: 0;
			transform-origin: center top;
			transition: transform 0.2s;
		}
	}

	/* 可选择文本样式 */
	.selectable {
		-webkit-user-select: text;
		user-select: text;
		cursor: text;

		// #ifdef APP-PLUS || MP-WEIXIN
		position: relative;
		z-index: 1; // 确保文本在最上层，可以被选择
		// #endif
	}

	// #endif

	// APP和小程序环境中的固定顶部按钮样式
	// #ifdef APP-PLUS || MP-WEIXIN
	.fixed-top-btn {
		width: 70rpx;
		height: 70rpx;
		border-radius: 35rpx;
		background-color: #4361ee;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-left: 20rpx;
		box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;

		&:active {
			transform: scale(0.9);
			background-color: #3651d4;
		}
	}

	// #endif

	// 调整评论输入框右侧间距
	.comment-input-container {
		// ... existing code ...
		// #ifdef H5
		width: 780px;
		// #endif
		// #ifdef APP-PLUS || MP-WEIXIN
		// 调整元素对齐方式，确保三个元素在一行
		display: flex;
		align-items: center;
		padding-right: 30rpx; // 增加右侧内边距
		// #endif

		// ... existing code ...
	}

	// 添加样式部分
	.custom-nav-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 90rpx;
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 30rpx;
		z-index: 999;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.08);

		// #ifdef H5
		width: 780px;
		left: 50%;
		transform: translateX(-50%);
		border-radius: 0 0 12px 12px;
		// #endif

		// #ifdef APP-PLUS || MP-WEIXIN
		padding-top: calc(var(--status-bar-height) + 10rpx);
		height: calc(var(--status-bar-height) + 90rpx);
		// #endif
	}

	.nav-icon {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		background-color: rgba(67, 97, 238, 0.1);
		transition: all 0.2s ease;

		&:active {
			transform: scale(0.9);
			background-color: rgba(67, 97, 238, 0.2);
		}
	}

	.nav-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
</style>