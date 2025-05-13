<template>
	<view class="container">
		<!-- 头部导航栏 -->
		<view class="publish-header">
			<!-- 返回按钮 -->
			<view class="back-btn" @click="showExitConfirm">
				<uni-icons type="closeempty" size="24" color="#333"></uni-icons>
			</view>
			
			<!-- 标题 -->
			<view class="header-title">
				<text>写文章</text>
			</view>

			<!-- 发布按钮 -->
			<view class="publish-btn" @click="publishArticle">
				<text>{{ publishBtnText }}</text>
			</view>
		</view>

		<scroll-view scroll-y class="publish-content" v-if="!isPreviewMode" :style="{height: 'calc(100vh - 190rpx)'}">
			<!-- 标题输入 -->
			<view class="title-input">
				<input type="text" v-model="articleData.title" placeholder="请输入标题" class="input-field" maxlength="50" />
				<view class="title-word-count" v-if="articleData.title.length > 0">
					<text>{{ articleData.title.length }}/50</text>
				</view>
			</view>

			<!-- 分割线 -->
			<view class="divider"></view>

			<!-- 正文编辑区域 - 动态高度 -->
			<view class="content-wrapper">
			<!-- 富文本编辑器区域 -->
			<view class="rich-editor-container">
					<!-- 富文本编辑器 -->
					<editor id="editor" class="rich-editor" 
						:placeholder="'请输入正文'" 
						@ready="onEditorReady" 
						@input="onEditorInput" 
						@paste="handlePaste"
						@focus="editorFocus" 
						@blur="editorBlur"
						@statuschange="onStatusChange">
					</editor>
					
					<!-- 字数统计 -->
					<view class="word-count">
						<text>{{ articleData.wordCount }} 字</text>
					</view>
					</view>
				</view>

			<!-- 文章信息区域 - 会被挤压 -->
			<view class="article-info-area">
				<!-- 文章标签区域 -->
				<view class="article-category">
					<text class="category-label">文章标签</text>
					<view class="tag-container">
						<!-- 已添加的标签 -->
						<view v-for="(tag, index) in articleData.tags" :key="index" class="tag-item simple-tag">
							<text>{{ tag }}</text>
						</view>
					</view>
				</view>
				
				<!-- 封面图片区域 -->
				<view class="cover-section">
					<text class="section-label">文章封面</text>
					<view class="cover-container">
						<view v-if="!articleData.coverImage" class="cover-placeholder" @click="selectCoverImage">
							<uni-icons type="image" size="36" color="#999"></uni-icons>
							<text class="add-cover-text">添加封面</text>
						</view>
						<view v-else class="cover-preview">
							<text class="cover-label">封面</text>
							<image :src="articleData.coverImage" mode="aspectFill" class="cover-image"></image>
							<view class="image-delete" @click="removeCoverImage">
								<uni-icons type="close" size="16" color="#fff"></uni-icons>
								</view>
								</view>
							</view>
						</view>
					</view>
		</scroll-view>

		<!-- 底部工具栏 -->
		<view class="editor-toolbar">
			<view class="toolbar-item" @click="togglePreviewMode">
				<view class="toolbar-icon">
					<uni-icons :type="isPreviewMode ? 'compose' : 'eye'" size="24" color="#333"></uni-icons>
				</view>
				<text class="toolbar-text">{{ isPreviewMode ? '编辑模式' : '预览模式' }}</text>
			</view>
			<view class="toolbar-item" @click="showFormattingToolbar" :class="{'disabled': isPreviewMode}">
				<view class="toolbar-icon">
					<text class="icon-text">A</text>
				</view>
				<text class="toolbar-text">文本格式</text>
			</view>
			<view class="toolbar-item" @click="insertImage" :class="{'disabled': isPreviewMode}">
				<view class="toolbar-icon">
					<uni-icons type="image" size="24" color="#333"></uni-icons>
				</view>
				<text class="toolbar-text">上传图片</text>
			</view>
			<view class="toolbar-item" @click="showTagSelector" :class="{'disabled': isPreviewMode}">
				<view class="toolbar-icon">
					<uni-icons type="paperclip" size="24" color="#333"></uni-icons>
				</view>
				<text class="toolbar-text">添加标签</text>
			</view>
		</view>

		<!-- 预览模式的内容区域 -->
		<view class="preview-container" v-if="isPreviewMode">
			<scroll-view scroll-y class="preview-scroll-view">
				<view class="preview-article-wrapper">
					<view class="preview-article">
						<!-- 文章标题 -->
						<view class="preview-title">
							<text>{{ articleData.title || '无标题文章' }}</text>
						</view>
						
						<!-- 文章信息 -->
						<view class="preview-info">
							<text class="preview-date">{{ getCurrentDate() }}</text>
							<text class="preview-word-count">{{ articleData.wordCount }} 字</text>
						</view>
						
						<!-- 文章标签 -->
						<view class="preview-tags" v-if="articleData.tags.length > 0">
							<view v-for="(tag, index) in articleData.tags" :key="index" class="preview-tag">
						<text>{{ tag }}</text>
					</view>
						</view>
						
						<!-- 文章封面 -->
						<view class="preview-cover" v-if="articleData.coverImage">
							<text class="cover-label">封面</text>
							<image :src="articleData.coverImage" mode="widthFix" class="preview-cover-image"></image>
						</view>
						<view class="preview-cover preview-cover-empty" v-else>
							<text class="cover-label">封面</text>
							<view class="empty-cover-placeholder">
								<uni-icons type="image" size="36" color="#ccc"></uni-icons>
								<text>暂无封面</text>
				</view>
			</view>

						<!-- 文章内容 -->
						<view class="preview-content">
							<rich-text :nodes="processedHtmlContent" class="rich-text-content"></rich-text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>

		<!-- 格式工具栏弹出层 -->
		<view class="formatting-toolbar" v-if="showFormattingTools">
			<view class="format-item" @click="applyFormat('bold')">
				<uni-icons type="bold" size="20" color="#333"></uni-icons>
			</view>
			<view class="format-item" @click="applyFormat('italic')">
				<uni-icons type="italic" size="20" color="#333"></uni-icons>
			</view>
			<view class="format-item" @click="applyFormat('underline')">
				<uni-icons type="underline" size="20" color="#333"></uni-icons>
			</view>
			<view class="format-item" @click="applyFormat('link')">
				<uni-icons type="link" size="20" color="#333"></uni-icons>
			</view>
			<view class="format-item" @click="applyFormat('h1')">
				<text class="format-text">H1</text>
			</view>
			<view class="format-item" @click="applyFormat('h2')">
				<text class="format-text">H2</text>
			</view>
		</view>

		<!-- 标签选择弹窗 -->
		<uni-popup ref="tagPopup" type="bottom" background-color="transparent">
			<view class="tag-popup-container">
			<view class="tag-popup-content">
				<view class="tag-popup-header">
					<text class="tag-popup-title">添加标签</text>
					<view class="tag-popup-close" @click="closeTagPopup">
						<uni-icons type="close" size="20" color="#666"></uni-icons>
					</view>
				</view>

				<!-- 自定义标签输入区域 -->
				<view class="custom-tag-input">
					<input type="text" v-model="customTagInput" placeholder="输入自定义标签" class="tag-input-field"
							@confirm="addCustomTag" maxlength="10" />
					<button class="add-tag-btn" @click="addCustomTag">添加</button>
				</view>

				<!-- 已选标签展示 -->
				<view v-if="selectedTags.length > 0" class="selected-tags-section">
						<text class="section-title">已选标签 ({{ selectedTags.length }}/5)</text>
					<view class="tag-list">
						<view v-for="(tag, index) in selectedTags" :key="'selected-'+index"
							class="tag-item tag-selected">
							<text>{{ tag }}</text>
								<view class="tag-delete" @click="removeSelectedTag(tag)">
								<uni-icons type="close" size="12" color="#fff"></uni-icons>
							</view>
						</view>
					</view>
				</view>

				<!-- 推荐标签区域 -->
				<view class="recommended-tags-section">
					<text class="section-title">推荐标签</text>
					<view class="tag-list">
						<view v-for="(tag, index) in availableTags" :key="'recommend-'+index" class="tag-item"
							:class="{ 'tag-selected': selectedTags.includes(tag) }" @click="toggleTag(tag)">
							<text>{{ tag }}</text>
						</view>
					</view>
				</view>

				<view class="tag-popup-footer">
					<button class="tag-confirm-btn" @click="confirmTagSelection">确认</button>
					</view>
					
					<!-- 底部安全区域，防止内容被工具栏遮挡 -->
					<view class="tag-popup-safe-area"></view>
				</view>
			</view>
		</uni-popup>

		<!-- 链接插入弹窗 -->
		<uni-popup ref="linkPopup" type="dialog">
			<uni-popup-dialog title="插入链接" :before-close="true" @confirm="confirmInsertLink" @close="closeLinkPopup"
				confirmText="确认" cancelText="取消">
				<view class="link-input-container">
					<input class="link-input" type="text" v-model="linkUrl" placeholder="请输入链接URL" />
					<input class="link-text-input" type="text" v-model="linkText" placeholder="请输入链接文本" />
				</view>
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script setup>
	import {
		ref,
		reactive,
		onBeforeUnmount,
		onMounted,
		nextTick,
		computed,
		watch
	} from 'vue';
	import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup';
	import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';
	import { publishArticle as publishArticleApi, updateArticle } from '@/api/article'; // 引入文章API并重命名

	// =================== 引用DOM组件 =================== //
	const tagPopup = ref(null);
	const linkPopup = ref(null);

	// =================== 状态变量 =================== //
	// 自定义标签输入
	const customTagInput = ref('');
	// 链接相关
	const linkUrl = ref('');
	const linkText = ref('');
	// 格式工具栏显示状态
	const showFormattingTools = ref(false);
	// 防止重复显示提示
	const showingExitDialog = ref(false);
	// 加载状态
	const isLoading = ref(false);
	// 编辑器实例
	let editorCtx = null;
	// 编辑器状态
	const editorStatus = reactive({
		isBold: false,
		isItalic: false,
		isUnderline: false,
		isStrike: false,
		isH1: false,
		isH2: false
	});
	// 编辑器内容
	const editorContent = ref('');
	// 是否已确认离开
	let isConfirmedExit = false;
	// 预览模式
	const isPreviewMode = ref(false);

	// =================== 文章数据对象 =================== //
	// 文章模式
	const mode = ref('new'); // 'new' 或 'edit'
	// 文章数据
	const articleData = reactive({
		id: null,
		title: '',
		content: '',
		htmlContent: '',
		images: [],
		tags: [],
		coverImage: null,
		originalCoverImage: null, // 保存原始封面地址，编辑时使用
		isCoverDeleted: false, // 标记封面是否被删除
		wordCount: 0 // 字数统计
	});

	// =================== 计算属性 =================== //
	// 发布按钮文本
	const publishBtnText = computed(() => {
		return mode.value === 'edit' ? '更新' : '发布';
	});

	// 推荐标签列表
	const availableTags = ref([
		'技术', '前端开发', '后端开发', '移动开发', '设计',
		'生活', '旅行', '美食', '教育', '学习',
		'健康', '时尚', '科技', '游戏', '娱乐',
		'艺术', '体育', '音乐', '电影', '书籍'
	]);

	// 已选标签
	const selectedTags = ref([]);

	// 添加处理HTML内容的计算属性
	const processedHtmlContent = computed(() => {
		// 获取原始HTML内容
		let html = articleData.htmlContent || '<p>暂无内容</p>';
		
		// 对HTML内容进行处理，确保图片宽度不超过容器
		html = html.replace(/<img/g, '<img style="max-width:100%;height:auto;display:block;margin:20rpx 0;border-radius:8rpx;object-fit:cover;"');
		
		// 增强段落样式，确保段落之间有足够的间距
		html = html.replace(/<p/g, '<p style="margin-bottom:30rpx;width:100%;overflow-wrap:break-word;min-height:30rpx;display:block;"');
		
		// 添加样式到标题
		html = html.replace(/<h1/g, '<h1 style="font-size:36rpx;font-weight:bold;margin:30rpx 0 20rpx;width:100%;overflow-wrap:break-word;"');
		html = html.replace(/<h2/g, '<h2 style="font-size:32rpx;font-weight:bold;margin:30rpx 0 20rpx;width:100%;overflow-wrap:break-word;"');
		html = html.replace(/<h3/g, '<h3 style="font-size:30rpx;font-weight:bold;margin:30rpx 0 20rpx;width:100%;overflow-wrap:break-word;"');
		
		// 添加样式到链接
		html = html.replace(/<a/g, '<a style="color:#4361ee;text-decoration:none;"');
		
		// 添加样式到列表
		html = html.replace(/<ul/g, '<ul style="padding-left:40rpx;margin-bottom:20rpx;width:100%;"');
		html = html.replace(/<ol/g, '<ol style="padding-left:40rpx;margin-bottom:20rpx;width:100%;"');
		html = html.replace(/<li/g, '<li style="margin-bottom:10rpx;"');
		
		// 添加样式到表格
		html = html.replace(/<table/g, '<table style="width:100%;border-collapse:collapse;margin:20rpx 0;overflow-x:auto;display:block;"');
		
		// 处理换行符，确保每个换行都被转换为段落
		html = html.replace(/\n(?!<\/p>|<p>|<div|<\/div>|<br>)/g, '<br>');
		
		return html;
	});

	// =================== 编辑器方法 =================== //
	// 编辑器准备完成
	const onEditorReady = () => {
		// #ifdef MP-WEIXIN || H5 || APP-PLUS
		uni.createSelectorQuery()
			.select('#editor')
			.context(res => {
				editorCtx = res.context;
				console.log('编辑器上下文已初始化', editorCtx ? '成功' : '失败');
				
				// 先显示加载提示
				if (mode.value === 'edit') {
					uni.showLoading({
						title: '加载文章内容...',
						mask: true
					});
				}
				
				// 延迟设置内容，确保编辑器已完全初始化
				setTimeout(() => {
					// 设置初始内容
					if (articleData.htmlContent) {
						console.log('设置编辑器内容', articleData.htmlContent.substring(0, 50) + '...');
						
						// 设置编辑器内容
						setEditorContent(articleData.htmlContent);
					} else if (mode.value === 'edit') {
						// 编辑模式下尝试从临时存储恢复内容
						try {
							const tempArticleData = uni.getStorageSync('temp_edit_article_data');
							if (tempArticleData) {
								const parsedTempData = JSON.parse(tempArticleData);
								if (parsedTempData.htmlContent) {
									console.log('从临时存储恢复编辑内容');
									articleData.htmlContent = parsedTempData.htmlContent;
									setEditorContent(parsedTempData.htmlContent);
									return;
								}
							}
						} catch (error) {
							console.error('恢复临时编辑内容失败', error);
						}
						
						// 如果仍然没有内容，显示提示
						uni.hideLoading();
						uni.showToast({
							title: '文章内容加载失败',
							icon: 'none'
						});
					} else {
						// 如果没有初始内容，也要调整一次高度
						adjustEditorHeight();
						if (mode.value === 'edit') {
							uni.hideLoading();
						}
					}
				}, 300); // 延迟300ms等待编辑器完全初始化
			})
			.exec();
		// #endif
	};
	
	// 设置编辑器内容的辅助函数
	const setEditorContent = (htmlContent, retryCount = 0) => {
		if (!editorCtx) {
			console.error('编辑器上下文未初始化');
			uni.hideLoading();
			return;
		}
		
		editorCtx.setContents({
			html: htmlContent,
			success: () => {
				console.log('编辑器内容设置成功');
				// 再次延迟调整高度，确保内容已渲染
				setTimeout(() => {
					adjustEditorHeight();
					if (mode.value === 'edit') {
						uni.hideLoading();
					}
				}, 300);
			},
			fail: err => {
				console.error('设置内容失败:', err);
				
				// 重试逻辑
				if (retryCount < 3) {
					console.log(`重试设置编辑器内容 (${retryCount + 1}/3)`);
					setTimeout(() => {
						setEditorContent(htmlContent, retryCount + 1);
					}, 500); // 增加延迟时间重试
				} else {
					// 重试失败，显示错误提示
					console.error('设置编辑器内容多次失败');
					uni.hideLoading();
					uni.showToast({
						title: '内容加载失败，请刷新页面',
						icon: 'none',
						duration: 2000
					});
				}
			}
		});
	};

	// 编辑器内容变化
	const onEditorInput = (e) => {
		// 存储编辑器的最新内容
		articleData.htmlContent = e.detail.html || '';
		articleData.content = e.detail.text || '';
		editorContent.value = e.detail.html || '';
		
		// 处理空行问题 - 确保换行符被正确转换为HTML标签
		if (articleData.htmlContent && !articleData.htmlContent.includes('<br>') && articleData.content.includes('\n')) {
			articleData.htmlContent = articleData.htmlContent.replace(/\n/g, '<br>');
		}
		
		// 更新字数统计
		articleData.wordCount = e.detail.text ? e.detail.text.length : 0;
		
		// 自动调整编辑器高度
		nextTick(() => {
			adjustEditorHeight();
		});
	};
	
	// 编辑器状态变化
	const onStatusChange = (e) => {
		const formats = e.detail || {};
		
		// 更新编辑器状态
		editorStatus.isBold = !!formats.bold;
		editorStatus.isItalic = !!formats.italic;
		editorStatus.isUnderline = !!formats.underline;
		editorStatus.isStrike = !!formats.strike;
		editorStatus.isH1 = formats.header === 1;
		editorStatus.isH2 = formats.header === 2;
	};

	// 添加调整编辑器高度的方法
	const adjustEditorHeight = () => {
		// 尝试获取编辑器内容和计算合适的高度
		if (editorCtx) {
			editorCtx.getContents({
				success: (res) => {
					// 获取内容
					const text = res.text || '';
					const html = res.html || '';
					
					// 根据内容计算高度
					// 1. 基础高度为300rpx
					let estimatedHeight = 300;
					
					// 2. 按字符数计算基本高度 (每10个字符约增加3rpx)
					estimatedHeight += Math.floor(text.length / 10) * 3;
					
					// 3. 统计换行符数量，每个换行符增加行高
					const lineCount = (text.match(/\n/g) || []).length;
					estimatedHeight += lineCount * 40; // 假设每行高度约40rpx
					
					// 4. 检测图片数量
					const imgCount = (html.match(/<img/g) || []).length;
					estimatedHeight += imgCount * 300; // 每张图片估算300rpx
					
					// 确保最小高度
					estimatedHeight = Math.max(300, estimatedHeight);
					
					// 为了更好的视觉效果，增加一些缓冲空间
					estimatedHeight += 100;
					
					// 设置编辑器高度
					// 方法1: 直接设置DOM元素样式 (适用于H5和APP)
					// #ifdef H5 || APP-PLUS
					const editorEl = document.querySelector('#editor');
					if (editorEl) {
						editorEl.style.minHeight = `${estimatedHeight}rpx`;
					}
					// #endif
					
					// 方法2: 通过选择器设置样式 (更通用的方法)
					uni.createSelectorQuery()
						.select('#editor')
						.fields({
							size: true,
							rect: true
						}, (data) => {
							if (data) {
								// 获取编辑器元素并设置样式
								uni.createSelectorQuery()
									.select('#editor')
									.node(res => {
										if (res && res.node) {
											res.node.style.minHeight = `${estimatedHeight}rpx`;
										}
									})
									.exec();
							}
						})
						.exec();
					
					// 记录当前内容长度，供下次比较
					articleData.wordCount = text.length;
				}
			});
		}
	};

	// 处理粘贴事件
	const handlePaste = async (e) => {
		// 检查剪贴板是否包含图片
		const items = (e.clipboardData || window.clipboardData).items;
		if (items && items.length) {
			for (let i = 0; i < items.length; i++) {
				if (items[i].type.indexOf('image') !== -1) {
					const blob = items[i].getAsFile();
					
					// 显示加载中
					uni.showLoading({
						title: '处理图片中...'
					});
					
					const reader = new FileReader();
					reader.onload = function(event) {
						const imageUrl = event.target.result;
						
						// 处理粘贴的图片
						if (editorCtx) {
							// 获取图片信息
							const img = new Image();
							img.onload = function() {
								// 计算适当尺寸
								const maxWidth = uni.getSystemInfoSync().windowWidth * 0.8;
								const ratio = img.width / img.height;
								const width = Math.min(maxWidth, img.width);
								const height = width / ratio;
								
								// 插入图片
								editorCtx.insertImage({
									src: imageUrl,
									width: width + 'px',
									height: height + 'px',
									alt: '粘贴的图片',
									extClass: 'article-content-image',
									success: () => {
								// 添加到图片数组
								articleData.images.push(imageUrl);
										uni.hideLoading();
									},
									fail: (err) => {
										console.error('插入图片失败:', err);
										uni.hideLoading();
									}
								});
							};
							img.src = imageUrl;
						} else {
							uni.hideLoading();
						}
					};
					reader.readAsDataURL(blob);
					break;
				}
			}
		}
	};

	// 编辑器获取焦点
	const editorFocus = () => {
		// 隐藏格式工具栏
		showFormattingTools.value = false;
	};

	// 编辑器失去焦点
	const editorBlur = () => {
		// 不做任何处理
	};

	// 显示格式工具栏
	const showFormattingToolbar = () => {
		// 预览模式下禁用
		if (isPreviewMode.value) return;
		
		showFormattingTools.value = !showFormattingTools.value;
	};

	// 应用格式化
	const applyFormat = (format) => {
		if (!editorCtx) {
			uni.showToast({
				title: '编辑器未初始化',
				icon: 'none'
			});
			return;
		}

		switch (format) {
			case 'bold':
				editorCtx.bold();
				break;
			case 'italic':
				editorCtx.italic();
				break;
			case 'underline':
				editorCtx.underline();
				break;
			case 'h1':
				editorCtx.header({ size: 1 });
				break;
			case 'h2':
				editorCtx.header({ size: 2 });
				break;
			case 'link':
				showLinkPopup();
				break;
			default:
				console.warn(`未知的格式化类型: ${format}`);
				break;
		}
	};

	/**
	 * 标签数据统一处理函数 - 优化版本，确保标签数据格式正确
	 */
	const prepareTags = (tags) => {
		if (!Array.isArray(tags) || tags.length === 0) return [];
		
		// 过滤空值并转换为字符串
		const processedTags = tags
			.map(tag => String(tag).trim())
			.filter(tag => tag && tag.length > 0)
			// 过滤掉可能包含HTML标签的字符串，避免后端处理问题
			.filter(tag => !tag.includes('<') && !tag.includes('>'));
		
		// 去重
		return [...new Set(processedTags)];
	};

	// 处理图片并发布文章
	const processImagesAndPublish = () => {
		// 设置加载状态
		isLoading.value = true;
		
		// 显示加载提示
		uni.showLoading({
			title: '正在处理图片...',
			mask: true
		});
		
		// 提取HTML中的所有图片路径
		const imageRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/g;
		let match;
		const extractedImages = [];
		
		// 复制一份HTML内容用于提取图片
		let htmlContent = articleData.htmlContent;
		
		// 提取图片路径
		while ((match = imageRegex.exec(htmlContent)) !== null) {
			// 检查是否为本地路径（需要上传）
			if (match[1] && !match[1].startsWith('http') && !extractedImages.includes(match[1])) {
				extractedImages.push(match[1]);
			}
		}
		
		// 如果封面图片是本地路径且不在已提取的图片中，也添加到上传列表
		if (articleData.coverImage && !articleData.coverImage.startsWith('http') && 
			!extractedImages.includes(articleData.coverImage)) {
			extractedImages.push(articleData.coverImage);
		}
		
		// 更新文章数据中的图片数组
		articleData.images = extractedImages;
		
		// 检查是否有图片需要处理
		if (extractedImages.length === 0) {
			// 没有图片需要处理，直接提交文章
			submitArticle();
			return;
		}
		
		try {
			// 有图片需要处理，使用API中的方法处理并发布
			const requestData = {
				title: articleData.title,
				content: articleData.content,
				htmlContent: ensureCorrectHtmlFormat(articleData.htmlContent), // 使用增强的HTML格式
				// 将 tagNames 修改为 tags
				tags: prepareTags(articleData.tags),
				images: articleData.images,
				wordCount: articleData.wordCount
			};
			
			// 确保tagNames是有效的数组
			if (!Array.isArray(requestData.tags)) {
				requestData.tags = [];
			}
			
			// 日志记录标签数据，帮助调试
			console.log('发送的标签数据:', {
				tags: JSON.stringify(requestData.tags || []),
				tagsCount: (requestData.tags || []).length
			});
			
			// 处理封面图片：如果封面已删除，明确设置为null；如果有新封面，使用新封面；否则保留原封面
			if (articleData.isCoverDeleted) {
				// 如果明确标记了删除封面，则设置为null
				requestData.coverImage = null;
				console.log('封面已标记为删除，提交请求时设置coverImage为null');
			} else if (articleData.coverImage) {
				// 有新封面，使用新封面
				requestData.coverImage = articleData.coverImage;
			} else if (mode.value === 'edit' && articleData.originalCoverImage && !articleData.isCoverDeleted) {
				// 编辑模式下，使用原始封面（如果没有被标记为删除）
				requestData.coverImage = articleData.originalCoverImage;
			}
			
			// 如果是编辑模式，添加文章ID
			if (mode.value === 'edit' && articleData.id) {
				requestData.id = articleData.id;
			}
			
			// 添加请求时间戳，用于后续验证
			const requestTimestamp = Date.now();
			
			// 调用API，内部会处理图片上传和文章发布
			const apiCall = mode.value === 'edit' 
					? updateArticle(requestData) 
					: publishArticleApi(requestData);
					
			apiCall.then(res => {
				// 隐藏加载提示并重置状态
				uni.hideLoading();
				isLoading.value = false;
				
				// 检查响应结构并更全面地处理可能的问题
				if (!res) {
					console.error('发布请求返回数据为空');
					uni.showToast({
						title: '网络异常，请重试',
						icon: 'none'
					});
					return;
				}
				
				// 首先检查是否成功发布文章
				if (res.code === 200) {
					// 保存文章ID（发布成功时服务器会返回）
					const articleId = res.data?.id || articleData.id;
					
					// 显示成功提示
					uni.showToast({
						title: mode.value === 'edit' ? '更新成功' : '发布成功',
						icon: 'success',
						duration: 2000
					});
					
					// 发布成功后清空内容并标记为已确认离开
					clearAndRefresh();
					
					// 触发全局事件，通知文章列表刷新
					if (mode.value === 'new') {
						uni.$emit('article_published', {
							articleId: articleId,
							timestamp: Date.now()
						});
						console.log('发布成功，触发全局刷新事件', articleId);
						
						// 延迟跳转（如果有ID）
						if (articleId) {
							setTimeout(() => {
								uni.redirectTo({
									url: `/pages/article-detail/article-detail?id=${articleId}`
								});
							}, 1500);
						} else {
							// 没有返回ID，返回上一页
							setTimeout(() => {
								uni.navigateBack();
							}, 1500);
						}
					} else {
						// 编辑模式下，刷新当前页面或返回
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					}
				} else {
					// API返回错误情况
					console.error('文章发布/更新失败:', res);
					
					// 检查是否是标签相关的错误，但文章可能已保存
					if (res.message && res.message.includes('标签')) {
						// 这种情况可能文章已发布成功但标签保存失败，尝试第二级策略
						console.log('检测到标签相关错误，尝试第二级策略: 纯编辑模式标签处理');
						tryEditModeTagsStrategy(requestData);
					} else if (res.message === 'null' || !res.message) {
						// 特殊情况：没有明确错误消息，但可能是标签问题导致
						console.warn('接收到空错误消息，可能是标签处理问题，尝试第二级策略');
						tryEditModeTagsStrategy(requestData);
					} else {
						// 其他明确的错误，显示错误消息
						uni.showToast({
							title: res.message || '发布失败，请重试',
							icon: 'none'
						});
					}
				}
			}).catch(err => {
				console.error('请求出错:', err);
				uni.hideLoading();
				isLoading.value = false;
				
				// 检查是否是空错误或null消息，这通常是标签处理问题
				const errorMessage = err?.message || String(err);
				console.error('错误详情:', errorMessage);
				
				if (errorMessage === 'null' || errorMessage.includes('标签')) {
					// 可能是标签问题但文章已保存，尝试第二级策略
					console.log('捕获到标签相关错误，尝试第二级策略');
					tryEditModeTagsStrategy(requestData);
				} else {
					// 检查文章是否可能已发布成功
					checkArticlePublishStatus();
				}
			});
		} catch (error) {
			// 捕获处理过程中的错误
			console.error('处理图片并发布文章出错:', error);
			uni.hideLoading();
			isLoading.value = false;
			uni.showToast({
				title: '处理失败:' + (error.message || '未知错误'),
				icon: 'none'
			});
		}
	};

	/**
	 * 第二级策略：修正后的标签处理方式
	 * 使用JSON序列化确保标签数据正确传输
	 */
	const tryEditModeTagsStrategy = (originalRequestData) => {
		console.log('执行第二级策略: 修正后的标签处理方式');
		
		// 显示加载提示
		uni.showLoading({
			title: '尝试备用方式发布...',
			mask: true
		});
		
		// 创建新的请求数据，标签处理更严格
		const newRequestData = {
			...originalRequestData,
			// 使用更严格的标签处理
			tags: Array.isArray(originalRequestData.tags) 
				? originalRequestData.tags
					.map(t => String(t).trim())
					.filter(t => t && !t.includes('<') && !t.includes('>'))
				: []
		};
		
		// 打印标签数据，帮助调试
		console.log('第二级策略使用的标签数据:', {
			tags: JSON.stringify(newRequestData.tags || []),
			count: (newRequestData.tags || []).length
		});
		
		// 调用API
		const apiCall = mode.value === 'edit' 
			? updateArticle(newRequestData) 
			: publishArticleApi(newRequestData);
			
		apiCall.then(res => {
			uni.hideLoading();
			
			if (res.code === 200) {
				// 成功处理
				const articleId = res.data?.id || articleData.id;
				
				uni.showToast({
					title: '发布成功',
					icon: 'success',
					duration: 2000
				});
				
				clearAndRefresh();
				
				// 跳转或返回
				setTimeout(() => {
					if (mode.value === 'new' && articleId) {
						uni.redirectTo({
							url: `/pages/article-detail/article-detail?id=${articleId}`
						});
					} else {
						uni.navigateBack();
					}
				}, 1500);
			} else {
				// 第二级策略也失败，尝试第三级策略
				console.warn('第二级策略失败，尝试第三级策略: 无标签发布');
				tryNoTagsStrategy(originalRequestData);
			}
		}).catch(err => {
			console.error('第二级策略请求失败:', err);
			uni.hideLoading();
			
			// 尝试第三级策略
			tryNoTagsStrategy(originalRequestData);
		});
	};

	/**
	 * 第三级策略：无标签发布
	 * 完全移除所有标签相关字段
	 */
	const tryNoTagsStrategy = (originalRequestData) => {
		console.log('执行第三级策略: 无标签发布');
		
		// 显示加载提示
		uni.showLoading({
			title: '尝试无标签发布...',
			mask: true
		});
		
		// 创建新的请求数据，移除所有标签相关字段
		const lastAttemptData = {
			...originalRequestData,
			tags: [],
			tagNames: [] // 保留 tagNames 清空，因为原始逻辑有，但主要使用 tags
		};
		
		console.log('第三级策略: 完全移除标签数据');
		
		// 调用API
		const apiCall = mode.value === 'edit' 
			? updateArticle(lastAttemptData) 
			: publishArticleApi(lastAttemptData);
			
		apiCall.then(res => {
			uni.hideLoading();
			
			if (res.code === 200) {
				// 成功处理
				const articleId = res.data?.id || articleData.id;
				
				uni.showToast({
					title: '发布成功(无标签)',
					icon: 'success',
					duration: 2000
				});
				
				clearAndRefresh();
				
				// 提示用户可以稍后添加标签
				uni.showModal({
					title: '文章已发布',
					content: '由于标签处理问题，文章已无标签发布。您可以稍后编辑文章添加标签。',
					showCancel: false,
					success: () => {
						// 跳转或返回
						setTimeout(() => {
							if (mode.value === 'new' && articleId) {
								uni.redirectTo({
									url: `/pages/article-detail/article-detail?id=${articleId}`
								});
							} else {
								uni.navigateBack();
							}
						}, 500);
					}
				});
			} else {
				// 所有策略都失败
				console.error('所有发布策略都失败:', res);
				uni.showToast({
					title: '发布失败，请重试',
					icon: 'none'
				});
				
				// 检查文章是否可能已发布
				checkArticlePublishStatus();
			}
		}).catch(err => {
			console.error('第三级策略请求失败:', err);
			uni.hideLoading();
			uni.showToast({
				title: '发布失败，请重试',
				icon: 'none'
			});
			
			// 最后尝试检查文章发布状态
			checkArticlePublishStatus();
		});
	};

	// 无图片文章提交
	const submitArticle = () => {
		// 更新加载提示
		uni.showLoading({
			title: mode.value === 'edit' ? '更新中...' : '发布中...',
			mask: true
		});
		
		// 构建请求数据
		const requestData = {
			title: articleData.title,
			content: articleData.content,
			htmlContent: ensureCorrectHtmlFormat(articleData.htmlContent), // 使用增强的HTML格式
			// 将 tagNames 修改为 tags
			tags: prepareTags(articleData.tags),
			wordCount: articleData.wordCount
		};
		
		// 确保tagNames是有效的数组
		if (!Array.isArray(requestData.tags)) {
			requestData.tags = [];
		}
		
		// 日志记录标签数据
		console.log('发送的标签数据:', {
			tags: JSON.stringify(requestData.tags || []),
			tagsCount: (requestData.tags || []).length
		});
		
		// 处理封面图片
		if (articleData.isCoverDeleted) {
				requestData.coverImage = null;
				console.log('封面已标记为删除，提交请求时设置coverImage为null');
			} else if (articleData.coverImage) {
				requestData.coverImage = articleData.coverImage;
			} else if (mode.value === 'edit' && articleData.originalCoverImage && !articleData.isCoverDeleted) {
				requestData.coverImage = articleData.originalCoverImage;
			}
			
			// 如果是编辑模式，添加文章ID
			if (mode.value === 'edit' && articleData.id) {
				requestData.id = articleData.id;
			}
			
			// 添加请求时间戳，用于后续验证
			const requestTimestamp = Date.now();
			
			// 第一级策略：标准方式发布（只使用tagNames字段）
			console.log('尝试第一级策略: 标准方式发布文章');
			
			// 调用API
			const apiCall = mode.value === 'edit' 
				? updateArticle(requestData) 
				: publishArticleApi(requestData);
				
			apiCall.then(res => {
				uni.hideLoading();
				isLoading.value = false;
				
				// 检查响应是否有效
				if (!res) {
					console.error('发布请求返回数据为空');
					uni.showToast({
						title: '网络异常，请重试',
						icon: 'none'
					});
					return;
				}
				
				// 首先检查是否成功发布文章
				if (res.code === 200) {
					// 保存文章ID（发布成功时服务器会返回）
					const articleId = res.data?.id || articleData.id;
					
					// 显示成功提示
					uni.showToast({
						title: mode.value === 'edit' ? '更新成功' : '发布成功',
						icon: 'success',
						duration: 2000
					});
					
					// 发布成功后清空内容并标记为已确认离开
					clearAndRefresh();
					
					// 如果是新文章且返回了ID，跳转到文章详情页
					if (mode.value === 'new' && articleId) {
						// 添加全局事件，通知文章列表刷新
						uni.$emit('article_published', {
							articleId: articleId,
							timestamp: Date.now()
						});
						console.log('发布成功，触发全局刷新事件');
						
						setTimeout(() => {
							uni.redirectTo({
								url: `/pages/article-detail/article-detail?id=${articleId}`
							});
						}, 1500);
					} else {
						// 编辑模式或没有返回ID，返回上一页
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					}
				} else {
					// API返回错误情况
					console.error('文章发布/更新失败:', res);
					
					// 检查是否是标签相关的错误
					if (res.message && res.message.includes('标签')) {
						// 尝试第二级策略
						tryEditModeTagsStrategy(requestData);
					} else if (res.message === 'null' || !res.message) {
						// 特殊情况：没有明确错误消息，但可能是标签问题导致
						tryEditModeTagsStrategy(requestData);
					} else {
						// 其他明确的错误，显示错误消息
						uni.showToast({
							title: res.message || '发布失败，请重试',
							icon: 'none'
						});
						// 检查文章是否可能已发布成功
						checkArticlePublishStatus();
					}
				}
			}).catch(err => {
				console.error('发布请求失败', err);
				console.error('错误详情:', JSON.stringify(err));
				
				// 检查是否是标签相关的错误
				const errorMsg = err.message || err.errMsg || String(err);
				const isTagError = errorMsg.includes('tag') || errorMsg.includes('标签');
				
				// 隐藏加载提示
				uni.hideLoading();
				isLoading.value = false;
				
				if (isTagError || errorMsg === 'null') {
					// 尝试第二级策略
					tryEditModeTagsStrategy(requestData);
				} else {
					uni.showToast({
						title: '发布失败: ' + errorMsg,
						icon: 'none'
					});
					// 检查文章是否可能已发布成功
					checkArticlePublishStatus();
				}
			});
		};

	/**
	 * 检查文章是否发布成功的辅助函数
	 * 当标准发布流程返回错误但文章可能已保存时使用
	 */
	const checkArticlePublishStatus = () => {
		// 显示加载提示
		uni.showLoading({
			title: '检查发布状态...'
		});
		
		// 构造请求参数以查找刚才可能发布的文章
		const params = {
			title: articleData.title,
			pageSize: 1, 
			sort: 'new' // 按最新排序，最可能找到刚发布的文章
		};
		
		// 向服务器查询最新文章
		http.get('/api/article', params)
			.then(res => {
				uni.hideLoading();
				
				// 检查是否找到匹配的文章
				if (res.code === 200 && res.data && res.data.list && res.data.list.length > 0) {
					const latestArticle = res.data.list[0];
					
					// 如果标题匹配，很可能是刚发布的文章
					if (latestArticle.title === articleData.title) {
						// 显示成功提示
						uni.showModal({
							title: '文章已发布成功',
							content: '虽然发布过程中出现错误，但文章已成功保存。标签可能需要稍后编辑。',
							showCancel: false,
							success: () => {
								// 清理表单并返回
								clearAndRefresh();
								
								// 延迟跳转到文章详情
								setTimeout(() => {
									uni.redirectTo({
										url: `/pages/article-detail/article-detail?id=${latestArticle.id}`
									});
								}, 500);
							}
						});
					} else {
						// 未找到匹配文章，可能发布失败
						uni.showToast({
							title: '未找到发布的文章，请重试',
							icon: 'none'
						});
					}
				} else {
					// 查询出错，无法确定状态
					uni.showToast({
						title: '无法确认发布状态，请重试',
						icon: 'none'
					});
				}
			})
			.catch(err => {
				uni.hideLoading();
				console.error('检查发布状态出错:', err);
				uni.showToast({
					title: '检查失败，请重试',
					icon: 'none'
				});
			});
	};

	// =================== 预览模式相关方法 =================== //
	// 切换预览模式
	const togglePreviewMode = () => {
		// 切换到预览模式前，确保获取最新内容
		if (!isPreviewMode.value) {
			// 获取当前编辑器内容
					if (editorCtx) {
				editorCtx.getContents({
					success: (res) => {
						// 更新文章数据
						articleData.htmlContent = res.html || '';
						articleData.content = res.text || '';
						articleData.wordCount = res.text ? res.text.length : 0;
						
						// 切换模式
						isPreviewMode.value = true;
						
						// 延迟执行，确保DOM已更新
						setTimeout(() => {
							// 滚动到顶部
							const previewContainer = document.querySelector('.preview-container');
							if (previewContainer) {
								previewContainer.scrollTop = 0;
							}
						}, 100);
					}
				});
			} else {
				isPreviewMode.value = true;
			}
		} else {
			// 从预览模式切换回编辑模式
			isPreviewMode.value = false;
		}
	};
	
	// 获取当前日期
	const getCurrentDate = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = (now.getMonth() + 1).toString().padStart(2, '0');
		const day = now.getDate().toString().padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	// =================== 生命周期方法 =================== //
	// 页面挂载时添加监听
	onMounted(() => {
		// 监听返回按钮和TabBar点击
		listenBackButton();
		listenTabBarClicks();
		
		// 初始化图片删除事件监听
		listenImageDeleteButtons();
		
		// 获取页面参数
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const options = currentPage.$page?.options || currentPage.options || {};
		
		// 检查是否有mode和articleData参数
		if (options.mode === 'edit' && options.articleData) {
			try {
				// 解码并解析文章数据
				const decodedData = decodeURIComponent(options.articleData);
				const parsedData = JSON.parse(decodedData);
				
				// 设置为编辑模式
				mode.value = 'edit';
				
				// 填充文章数据
				articleData.id = parsedData.id;
				articleData.title = parsedData.title || '';
				articleData.content = parsedData.content || '';
				
				// 确保HTML内容是有效的
				if (parsedData.htmlContent && parsedData.htmlContent.trim() !== '') {
					articleData.htmlContent = parsedData.htmlContent;
				} else if (parsedData.content) {
					// 如果没有HTML内容但有普通内容，将普通内容转为HTML
					articleData.htmlContent = `<p>${parsedData.content.replace(/\n/g, '</p><p>')}</p>`;
				} else {
					articleData.htmlContent = '<p></p>'; // 确保至少有一个空段落
				}
				
				articleData.wordCount = parsedData.wordCount || parsedData.content?.length || 0;
				
				// 填充标签
				if (Array.isArray(parsedData.tags)) {
					articleData.tags = [...parsedData.tags];
					selectedTags.value = [...parsedData.tags];
				}
				
				// 填充图片
				if (Array.isArray(parsedData.images)) {
					articleData.images = [...parsedData.images];
				}
				
				// 填充封面图片
				if (parsedData.coverImage) {
					articleData.coverImage = parsedData.coverImage;
				}
				
				console.log('编辑模式：加载文章数据', {
					id: articleData.id,
					title: articleData.title,
					content: articleData.content ? articleData.content.substring(0, 50) + '...' : '无内容',
					htmlContent: articleData.htmlContent ? articleData.htmlContent.substring(0, 50) + '...' : '无HTML内容',
					tags: articleData.tags,
					coverImage: articleData.coverImage ? '有封面' : '无封面'
				});
				
				// 设置全局变量标记编辑模式
				uni.setStorageSync('temp_edit_article_data', JSON.stringify(articleData));
			} catch (error) {
				console.error('解析文章数据失败', error);
				uni.showToast({
					title: '加载文章数据失败',
					icon: 'none'
				});
			}
		}
		
		// 尝试加载草稿
		loadDraft();
		
		// 定时自动保存草稿
		const autoSaveInterval = setInterval(() => {
			if (hasContent() && !isPreviewMode.value) {
				saveDraft();
			}
		}, 60000); // 每分钟自动保存一次
		
		// 组件卸载时清除定时器
		onBeforeUnmount(() => {
			clearInterval(autoSaveInterval);
		});
		
		// #ifdef MP-WEIXIN
		// 监听页面卸载事件
		const currentPages = getCurrentPages();
		const curPage = currentPages[currentPages.length - 1];
		
		// 保存原始的onUnload事件处理函数
		const originalOnUnload = curPage.onUnload;
		
		// 重写onUnload事件
		curPage.onUnload = function() {
			// 只有在确认退出后才执行原始的onUnload
			if (isConfirmedExit) {
				if (originalOnUnload) {
					originalOnUnload.call(this);
				}
			} else if (hasContent()) {
				// 如果有未保存内容，尝试阻止退出
				showExitConfirm();
				return false;
			}
		};
		// #endif
	});

	// 监听页面后退按钮
	const listenBackButton = () => {
		// #ifdef APP-PLUS
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];
		const currentWebview = page.$getAppWebview();

		currentWebview.addEventListener('backpress', (e) => {
			e.preventDefault();
			showExitConfirm();
		});
		// #endif
		
		// #ifdef MP-WEIXIN
		uni.enableAlertBeforeUnload(() => {
			// 如果有内容，拦截并显示确认
			if (hasContent()) {
				showExitConfirm();
				return true; // 拦截退出行为
			}
			return false; // 不拦截
		});
		// #endif
	};

	// 拦截底部TabBar点击事件
	const listenTabBarClicks = () => {
		// #ifdef APP-PLUS || MP-WEIXIN
		uni.addInterceptor('switchTab', {
			invoke(e) {
				// 如果当前是发布页面，且有编辑内容，则拦截跳转
				if (hasContent()) {
					showExitConfirm();
					return false; // 阻止跳转
				}
				return true; // 允许跳转
			}
		});
		
		// 拦截导航API，确保用户无法离开页面
		uni.addInterceptor('navigateTo', {
			invoke(e) {
				if (hasContent()) {
					showExitConfirm();
					return false; // 阻止跳转
				}
				return true; // 允许跳转
			}
		});
		
		uni.addInterceptor('redirectTo', {
			invoke(e) {
				if (hasContent()) {
					showExitConfirm();
					return false; // 阻止跳转
				}
				return true; // 允许跳转
			}
		});
		
		uni.addInterceptor('navigateBack', {
			invoke(e) {
				if (hasContent()) {
					showExitConfirm();
					return false; // 阻止返回
				}
				return true; // 允许返回
			}
		});
		// #endif
	};

	// 拦截页面离开事件
	onBeforeUnmount(() => {
		// 如果已确认离开则不拦截
		if (isConfirmedExit) return;

		// 判断是否有编辑内容
		if (hasContent()) {
			showExitConfirm();
		}
		
		// 移除图片删除事件监听
		document.removeEventListener('click', () => {});
	});

	// 监听编辑器中图片删除按钮的点击事件
	const listenImageDeleteButtons = () => {
		// #ifdef H5
		// 仅在H5环境中使用DOM API
		setTimeout(() => {
			// 确保DOM已加载
			const editorDoc = document.querySelector('.rich-editor');
			if (editorDoc) {
				editorDoc.addEventListener('click', (e) => {
					// 检查点击的元素是否是图片删除按钮
					if (e.target && e.target.classList && e.target.classList.contains('image-delete-btn')) {
						// 获取图片路径
						const imagePath = e.target.getAttribute('data-image-path');
						if (imagePath) {
							// 调用删除方法
							removeImageFromEditor(imagePath);
						}
					}
				});
			}
		}, 500);
		// #endif
	};

	// 保存草稿
	const saveDraft = () => {
		if (!hasContent()) return;
		
		try {
			// 获取当前编辑器内容
			if (editorCtx) {
				editorCtx.getContents({
					success: (res) => {
						// 构建草稿数据
						const draftData = {
							title: articleData.title,
							content: res.text || '',
							htmlContent: res.html || '',
							tags: articleData.tags,
							coverImage: articleData.coverImage,
							timestamp: Date.now()
						};
						
						// 保存到本地存储
						uni.setStorageSync('article_draft', JSON.stringify(draftData));
						console.log('草稿已自动保存');
					}
				});
			} else {
				// 编辑器未初始化，使用当前数据保存
				const draftData = {
					title: articleData.title,
					content: articleData.content,
					htmlContent: articleData.htmlContent,
					tags: articleData.tags,
					coverImage: articleData.coverImage,
					timestamp: Date.now()
				};
				
				// 保存到本地存储
				uni.setStorageSync('article_draft', JSON.stringify(draftData));
				console.log('草稿已自动保存（无编辑器）');
			}
		} catch (error) {
			console.error('保存草稿失败', error);
		}
	};

	// 加载草稿
	const loadDraft = () => {
		// 如果是编辑模式，不加载草稿
		if (mode.value === 'edit') return;
		
		try {
			// 从本地存储获取草稿
			const draftStr = uni.getStorageSync('article_draft');
			if (!draftStr) return;
			
			const draft = JSON.parse(draftStr);
			
			// 检查草稿时间是否在24小时内
			const now = Date.now();
			const draftAge = now - (draft.timestamp || 0);
			const oneDayMs = 24 * 60 * 60 * 1000;
			
			if (draftAge > oneDayMs) {
				// 草稿太旧，删除
				uni.removeStorageSync('article_draft');
				return;
			}
			
			// 询问用户是否加载草稿
			uni.showModal({
				title: '发现未发布的草稿',
				content: '是否恢复之前未完成的文章？',
				success: (res) => {
					if (res.confirm) {
						// 填充草稿数据
						articleData.title = draft.title || '';
						articleData.content = draft.content || '';
						articleData.htmlContent = draft.htmlContent || '';
						
						// 填充标签
						if (Array.isArray(draft.tags)) {
							articleData.tags = [...draft.tags];
							selectedTags.value = [...draft.tags];
						}
						
						// 填充封面图片
						if (draft.coverImage) {
							articleData.coverImage = draft.coverImage;
						}
						
						// 如果编辑器已初始化，设置内容
						if (editorCtx && draft.htmlContent) {
							editorCtx.setContents({
								html: draft.htmlContent,
								fail: err => {
									console.error('设置草稿内容失败:', err);
								},
								complete: () => {
									// 内容加载完成后，调整高度
									adjustEditorHeight();
								}
							});
						}
						
						uni.showToast({
							title: '草稿已恢复',
							icon: 'success'
						});
					} else {
						// 用户不想加载草稿，删除
						uni.removeStorageSync('article_draft');
					}
				}
			});
		} catch (error) {
			console.error('加载草稿失败', error);
		}
	};

	// 清除草稿
	const clearDraft = () => {
		try {
			uni.removeStorageSync('article_draft');
		} catch (error) {
			console.error('清除草稿失败', error);
		}
	};

	/**
	 * 确保HTML格式正确，特别是处理换行
	 */
	const ensureCorrectHtmlFormat = (html) => {
		if (!html) return '';
		
		// 确保段落之间有足够空间
		let processedHtml = html.replace(/<p/g, '<p style="margin-bottom:30rpx;display:block;"');
		
		// 处理文本中的换行符，将它们转换为<br>标签
		processedHtml = processedHtml.replace(/\n(?!<\/p>|<p>|<div|<\/div>|<br>)/g, '<br>');
		
		// 处理空段落
		processedHtml = processedHtml.replace(/<p>\s*<\/p>/g, '<p><br></p>');
		
		return processedHtml;
	};

	// =================== 标签相关方法 =================== //
	// 添加自定义标签
	const addCustomTag = () => {
		const tagValue = customTagInput.value.trim();

		// 验证标签是否为空
		if (!tagValue) {
			uni.showToast({
				title: '标签不能为空',
				icon: 'none'
			});
			return;
		}

		// 验证标签长度
		if (tagValue.length > 10) {
			uni.showToast({
				title: '标签最多10个字符',
				icon: 'none'
			});
			return;
		}

		// 检查标签是否包含HTML标签，避免后端处理问题
		if (tagValue.includes('<') || tagValue.includes('>')) {
			uni.showToast({
				title: '标签不能包含特殊字符',
				icon: 'none'
			});
			return;
		}

		// 检查标签是否已存在
		if (selectedTags.value.includes(tagValue)) {
			uni.showToast({
				title: '该标签已添加',
				icon: 'none'
			});
			return;
		}
		
		// 检查已选标签数量
		if (selectedTags.value.length >= 5) {
			uni.showToast({
				title: '最多只能添加5个标签',
				icon: 'none'
			});
			return;
		}

		// 添加标签到已选列表
		selectedTags.value.push(tagValue);

		// 清空输入框
		customTagInput.value = '';
	};

	// 移除标签
	const removeTag = (tag) => {
		const index = articleData.tags.indexOf(tag);
		if (index > -1) {
			articleData.tags.splice(index, 1);

		uni.showToast({
				title: '标签已移除',
			icon: 'success'
		});
		}
	};

	// 移除选中标签
	const removeSelectedTag = (tag) => {
		const index = selectedTags.value.indexOf(tag);
		if (index > -1) {
			selectedTags.value.splice(index, 1);
		}
	};

	// 显示标签选择器
	const showTagSelector = () => {
		// 预览模式下禁用
		if (isPreviewMode.value) return;
		
		// 如果已经有5个标签，则提示
		if (articleData.tags.length >= 5) {
			uni.showToast({
				title: '最多只能添加5个标签',
				icon: 'none'
			});
			return;
		}
		
		// 打开前，先将已有的标签设置为选中状态
		selectedTags.value = [...articleData.tags];
		customTagInput.value = '';
		
		// 打开弹窗前调整页面滚动位置，确保不被底部工具栏遮挡
		const pageScrollTop = uni.pageScrollTop || 0;
		if (pageScrollTop > 0) {
			uni.pageScrollTo({
				scrollTop: 0,
				duration: 300
			});
		}
		
		// 延迟打开弹窗，确保滚动完成
		setTimeout(() => {
		tagPopup.value.open();
		}, 300);
	};

	// 关闭标签选择器
	const closeTagPopup = () => {
		tagPopup.value.close();
	};

	// 切换标签选中状态
	const toggleTag = (tag) => {
		const index = selectedTags.value.indexOf(tag);
		if (index > -1) {
			// 如果已选中，则取消选中
			selectedTags.value.splice(index, 1);
		} else {
			// 检查是否已满5个标签
			if (selectedTags.value.length >= 5) {
				uni.showToast({
					title: '最多只能添加5个标签',
					icon: 'none'
				});
				return;
			}
			
			// 如果未选中，则添加到选中列表
			selectedTags.value.push(tag);
		}
	};

	// 确认标签选择
	const confirmTagSelection = () => {
		// 优化：过滤空标签和包含HTML标签的字符串，确保格式一致
		articleData.tags = selectedTags.value
			.map(tag => String(tag).trim())
			.filter(tag => tag.length > 0)
			.filter(tag => !tag.includes('<') && !tag.includes('>'));
		
		// 确保没有重复标签
		articleData.tags = [...new Set(articleData.tags)];
		
		closeTagPopup();

		// 查看结果
		console.log('确认的标签数据:', {
			tags: JSON.stringify(articleData.tags),
			count: articleData.tags.length
		});

		uni.showToast({
			title: '标签已添加',
			icon: 'success'
		});
	};

	// =================== 链接相关方法 =================== //
	// 显示链接插入弹窗
	const showLinkPopup = () => {
		linkUrl.value = '';
		linkText.value = '';
		linkPopup.value.open();
	};

	// 关闭链接插入弹窗
	const closeLinkPopup = () => {
		linkPopup.value.close();
	};

	// 确认插入链接
	const confirmInsertLink = () => {
		if (!linkUrl.value.trim()) {
			uni.showToast({
				title: '请输入链接地址',
				icon: 'none'
			});
			return;
		}
		
		// 如果链接不以http://或https://开头，则添加https://
		let url = linkUrl.value.trim();
		if (!/^https?:\/\//i.test(url)) {
			url = 'https://' + url;
		}

		// 如果没有输入链接文本，就使用URL作为文本
		const text = linkText.value.trim() || url;

		if (editorCtx) {
			editorCtx.insertLink({
				text: text,
				url: url
			});
		}

		closeLinkPopup();
	};

	// =================== 图片相关方法 =================== //
	// 插入图片
	const insertImage = () => {
		// 预览模式下禁用
		if (isPreviewMode.value) return;
		
		// 首先确认编辑器上下文是否已初始化
		if (!editorCtx) {
			uni.showToast({
				title: '编辑器未初始化',
				icon: 'none'
			});
			return;
		}

		uni.chooseImage({
			count: 9,
			success: (res) => {
				// 处理选中的图片
				const tempFilePaths = res.tempFilePaths;
				
				// 限制总图片数量
				if ((articleData.images.length + tempFilePaths.length) > 20) {
					uni.showToast({
						title: '图片数量超过限制（最多20张）',
						icon: 'none'
					});
					return;
				}
				
				// 检查图片大小
				const checkImageSize = (path) => {
					return new Promise((resolve, reject) => {
						uni.getFileInfo({
							filePath: path,
							success: (res) => {
								// 检查图片大小是否超过5MB
								if (res.size > 5 * 1024 * 1024) {
									reject(new Error('图片大小不能超过5MB'));
								} else {
									resolve();
								}
							},
							fail: () => {
								// 无法获取文件信息，假设图片大小合适
								resolve();
							}
						});
					});
				};
				
				// 检查所有图片大小
				const sizePromises = tempFilePaths.map(path => checkImageSize(path));
				
				Promise.all(sizePromises)
					.then(() => {
						// 所有图片大小都符合要求
						// 显示加载中提示
						uni.showLoading({
							title: '处理图片中...',
							mask: true
						});
						
						// 逐个插入图片到编辑器
						tempFilePaths.forEach((path, index) => {
							// 为每个图片添加唯一标识
							const imageId = `img_${Date.now()}_${index}`;
							
							// 获取图片信息
							uni.getImageInfo({
								src: path,
								success: (imageInfo) => {
									// 计算适当尺寸
									const maxWidth = uni.getSystemInfoSync().windowWidth * 0.8;
									const ratio = imageInfo.width / imageInfo.height;
									const width = Math.min(maxWidth, imageInfo.width);
									const height = width / ratio;
									
									// 插入图片到编辑器
									editorCtx.insertImage({
										src: path,
										width: '100%', // 确保图片宽度固定为100%
										height: 'auto', // 高度自适应
										alt: `文章图片${index+1}`,
										extClass: 'article-content-image',
										data: {
											imageId: imageId
										},
										success: () => {
											// 如果是最后一张图片，隐藏加载提示
											if (index === tempFilePaths.length - 1) {
												uni.hideLoading();
												uni.showToast({
													title: '图片添加成功',
													icon: 'success'
												});
												
												// 调整编辑器高度
												nextTick(() => {
													adjustEditorHeight();
												});
											}
										},
										fail: (err) => {
											console.error('插入图片失败:', err);
											if (index === tempFilePaths.length - 1) {
												uni.hideLoading();
												uni.showToast({
													title: '部分图片插入失败',
													icon: 'none'
												});
											}
										}
									});
								},
								fail: () => {
									// 获取图片信息失败，使用默认尺寸
									editorCtx.insertImage({
										src: path,
										width: '100%',
										height: 'auto',
										alt: `文章图片${index+1}`,
										extClass: 'article-content-image'
									});
									
									// 如果是最后一张图片，隐藏加载提示
									if (index === tempFilePaths.length - 1) {
										uni.hideLoading();
										uni.showToast({
											title: '图片添加成功',
											icon: 'success'
										});
										
										// 调整编辑器高度
										nextTick(() => {
											adjustEditorHeight();
										});
									}
								}
							});
						});
					})
					.catch(error => {
						uni.showToast({
							title: error.message,
							icon: 'none'
						});
					});
			}
		});
	};

	// 直接从编辑器中删除图片
	const removeImageFromEditor = (imagePath) => {
		// 确认删除对话框
		uni.showModal({
			title: '删除图片',
			content: '确定要删除这张图片吗？',
			success: (res) => {
				if (res.confirm) {
					// 从数组中移除图片
					const index = articleData.images.indexOf(imagePath);
					if (index > -1) {
						articleData.images.splice(index, 1);
					}
					
					// 更新富文本编辑器内容，从HTML中移除对应图片
					if (editorCtx) {
						// 获取当前HTML内容
						editorCtx.getContents({
							success: (res) => {
								let currentHtml = res.html || '';
								// 替换包含该图片路径的img标签及其父容器
								const imgWrapperRegex = new RegExp(`<div[^>]*class="image-delete-wrapper"[^>]*data-image-path="${imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?<\/div>`, 'g');
								currentHtml = currentHtml.replace(imgWrapperRegex, '');
								
								// 替换普通img标签
								const imgRegex = new RegExp(`<img[^>]*src=["']${imagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'g');
								currentHtml = currentHtml.replace(imgRegex, '');
								
								// 设置新的内容
								editorCtx.setContents({
									html: currentHtml
								});
							}
						});
					}
					
					uni.showToast({
						title: '图片已删除',
						icon: 'success'
					});
				}
			}
		});
	};
	
	// =================== 封面图片相关方法 =================== //
	// 选择封面图片
	const selectCoverImage = () => {
		uni.chooseImage({
			count: 1, // 只选择一张图片作为封面
			success: (res) => {
				const tempFilePath = res.tempFilePaths[0];
				
				// 检查图片大小
				uni.getFileInfo({
					filePath: tempFilePath,
					success: (fileInfo) => {
						// 限制图片大小为5MB
						if (fileInfo.size > 5 * 1024 * 1024) {
							uni.showToast({
								title: '封面图片不能超过5MB',
								icon: 'none'
							});
							return;
						}
						
						// 显示加载中提示
						uni.showLoading({
							title: '处理封面图片...',
							mask: true
						});
						
						// 获取图片信息
						uni.getImageInfo({
							src: tempFilePath,
							success: (imageInfo) => {
								// 检查图片比例
								const ratio = imageInfo.width / imageInfo.height;
								
								// 设置封面图片
								articleData.coverImage = tempFilePath;
								// 重置封面删除标记
								articleData.isCoverDeleted = false;
								
								uni.hideLoading();
								
								uni.showToast({
									title: '封面设置成功',
									icon: 'success'
								});
								
								// 如果图片比例不接近16:9，显示提示
								if (Math.abs(ratio - 16/9) > 0.2) {
									setTimeout(() => {
										uni.showToast({
											title: '建议使用16:9比例的图片作为封面',
											icon: 'none',
											duration: 2000
										});
									}, 1500);
								}
							},
							fail: () => {
								// 获取图片信息失败，仍然设置封面
								articleData.coverImage = tempFilePath;
								// 重置封面删除标记
								articleData.isCoverDeleted = false;
								
								uni.hideLoading();
								
								uni.showToast({
									title: '封面设置成功',
									icon: 'success'
								});
							}
						});
					},
					fail: () => {
						// 无法获取文件信息，假设图片大小合适
						// 显示加载中提示
						uni.showLoading({
							title: '处理封面图片...'
						});
						
						// 设置封面图片
						setTimeout(() => {
							uni.hideLoading();
							articleData.coverImage = tempFilePath;
							// 重置封面删除标记
							articleData.isCoverDeleted = false;
							
							uni.showToast({
								title: '封面设置成功',
								icon: 'success'
							});
						}, 500);
					}
				});
			}
		});
	};
	
	// 删除封面图片
	const removeCoverImage = () => {
		// 如果在编辑模式并且有原始封面，提供更多选项
		if (mode.value === 'edit' && articleData.originalCoverImage) {
			uni.showModal({
				title: '删除封面',
				content: '确定要删除封面图片吗？',
				success: (res) => {
					if (res.confirm) {
						// 完全删除封面
						articleData.coverImage = null;
						// 标记封面为已删除状态
						articleData.isCoverDeleted = true;
						console.log('封面已删除，标记删除状态:', articleData.isCoverDeleted);
						uni.showToast({
							title: '封面已删除',
							icon: 'success'
						});
					}
				}
			});
		} else {
			// 常规删除确认
			uni.showModal({
				title: '删除封面',
				content: '确定要删除封面图片吗？',
				success: (res) => {
					if (res.confirm) {
						articleData.coverImage = null;
						// 编辑模式下也标记为已删除
						if (mode.value === 'edit') {
							articleData.isCoverDeleted = true;
						}
						uni.showToast({
							title: '封面已删除',
							icon: 'success'
						});
					}
				}
			});
		}
	};

	// =================== 页面退出与保存相关方法 =================== //
	// 清空内容并刷新页面
	const clearAndRefresh = () => {
		// 清空所有内容
		articleData.title = '';
		articleData.content = '';
		articleData.htmlContent = '';
		editorContent.value = '';
		if (editorCtx) {
			editorCtx.clear();
		}
		articleData.images = [];
		articleData.tags = [];
		articleData.coverImage = null;
		selectedTags.value = [];

		// 清除草稿
		clearDraft();

		// 标记已确认离开
		isConfirmedExit = true;
	};

	// 退出确认弹窗
	const showExitConfirm = () => {
		// 如果已经显示了对话框，则不再重复显示
		if (showingExitDialog.value) return;
		
		// 判断是否有编辑内容，如果没有直接返回
		if (!hasContent()) {
			// 清空内容并标记为已确认离开
			clearAndRefresh();
			// 返回上一页面
			uni.navigateBack();
			return;
		}

		// 标记正在显示对话框
		showingExitDialog.value = true;

		// 显示确认对话框
		uni.showModal({
			title: '确认退出',
			content: '有未保存的内容，确定要退出吗？',
			confirmText: '退出',
			confirmColor: '#FF4D4F',
			cancelText: '继续编辑',
			success: (res) => {
				// 标记对话框已关闭
				showingExitDialog.value = false;
				
				if (res.confirm) {
					// 用户点击确认，清空内容并退出
					clearAndRefresh();
					
					// 确保已标记为可以安全退出
					isConfirmedExit = true;
					
					// 延迟执行返回操作，避免多次触发退出逻辑
					setTimeout(() => {
						// 返回上一页面
						uni.navigateBack();
					}, 100);
				}
			},
			fail: () => {
				// 确保对话框关闭时重置标记
				showingExitDialog.value = false;
			}
		});
	};

	// 检查是否有内容
	const hasContent = () => {
		return articleData.title.trim() ||
			articleData.content.trim() ||
			articleData.images.length > 0 ||
			articleData.tags.length > 0 ||
			articleData.coverImage !== null;
	};
	
	// 发布或更新文章
	const publishArticle = () => {
		// 表单验证
		if (!articleData.title.trim()) {
			uni.showToast({
				title: '请输入文章标题',
				icon: 'none'
			});
			return;
		}
		
		// 验证标题长度
		if (articleData.title.length > 50) {
			uni.showToast({
				title: '标题最多50个字符',
				icon: 'none'
			});
			return;
		}

		if (!articleData.content.trim()) {
			uni.showToast({
				title: '请输入文章内容',
				icon: 'none'
			});
			return;
		}
		
		// 验证内容长度
		if (articleData.content.length < 10) {
			uni.showToast({
				title: '文章内容太短，至少10个字符',
				icon: 'none'
			});
			return;
		}
		
		// 防止重复提交
		if (isLoading.value) {
			return;
		}
		
		// 显示确认对话框
		uni.showModal({
			title: mode.value === 'edit' ? '更新文章' : '发布文章',
			content: mode.value === 'edit' ? '确认更新这篇文章吗？' : '确认发布这篇文章吗？',
			success: (res) => {
				if (res.confirm) {
					// 用户点击确认，开始处理图片和发布文章
					processImagesAndPublish();
				}
			}
		});
	};
</script>

<style lang="scss">
	// 主题颜色变量
	$primary-color: #4361ee;
	$text-color: #333333;
	$text-secondary: #666666;
	$text-light: #999999;
	$border-color: #eeeeee;
	$bg-white: #ffffff;
	$bg-light: #f5f5f5;
	$danger-color: #ff4d4f;
	
	page {
		background-color: $bg-white;
		color: $text-color;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
	}

	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	/* ========== 头部样式 ========== */
	.publish-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 90rpx;
		padding: 0 30rpx;
		border-bottom: 1rpx solid $border-color;
		background-color: $bg-white;
		position: relative;
	}

	.back-btn {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.header-title {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		font-size: 32rpx;
		font-weight: 500;
	}

	.publish-btn {
		background-color: $primary-color;
		color: $bg-white;
		font-size: 28rpx;
		padding: 10rpx 30rpx;
		border-radius: 30rpx;
		
		text {
			color: $bg-white;
		}
	}

	/* ========== 内容区域 ========== */
	.publish-content {
		flex: 1;
		padding: 0 30rpx;
		padding-bottom: 120rpx; /* 增加底部内边距，比工具栏高度多一些 */
		box-sizing: border-box;
		position: relative;
	}
	
	.content-wrapper {
		margin-bottom: 30rpx;
		position: relative;
		flex: 1;
	}
	
	.article-info-area {
		position: relative;
		z-index: 1;
		background-color: $bg-white;
		padding-bottom: 120rpx; /* 添加底部内边距，避免内容被工具栏遮挡 */
	}
	
	/* 标题输入 */
	.title-input {
		padding: 30rpx 0;
		position: relative;
	}

	.input-field {
		font-size: 36rpx;
		font-weight: 500;
		width: 100%;
	}
	
	/* 分割线 */
	.divider {
		height: 1rpx;
		background-color: $border-color;
		width: 100%;
		margin-bottom: 30rpx;
	}
	
	/* 富文本编辑器 */
	.rich-editor-container {
		width: 100%;
		min-height: 300rpx;
		margin-bottom: 30rpx;
		position: relative;
		z-index: 2; /* 确保编辑器在正确的层级 */
		overflow: visible;
		transition: min-height 0.2s; /* 添加平滑过渡 */
	}
	
	.rich-editor {
		width: 100%;
		min-height: 300rpx;
		height: auto;
		font-size: 30rpx;
		line-height: 1.6;
		padding: 20rpx 0;
		box-sizing: border-box;
		transition: min-height 0.2s; /* 添加平滑过渡 */
	}
	
	/* 标签区域 */
	.article-category {
		margin-top: 30rpx;
		margin-bottom: 30rpx;
	}
	
	.category-label, .section-label {
		font-size: 28rpx;
		color: $text-secondary;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.tag-container {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	/* 正文下方的标签样式 */
	.article-category .tag-item {
		display: flex;
		align-items: center;
		padding: 8rpx 16rpx;
		border-radius: 30rpx;
		font-size: 24rpx;
		background-color: $primary-color;
		color: $bg-white;
		
		text {
			color: $bg-white;
		}
		
		&.simple-tag {
			background-color: rgba(67, 97, 238, 0.15);
			border: 1rpx solid rgba(67, 97, 238, 0.3);
			
			text {
				color: $primary-color;
			}
		}
	}
	
	.add-tag {
		width: 60rpx;
		height: 60rpx;
		background-color: rgba(67, 97, 238, 0.05);
		border: 1rpx dashed rgba(67, 97, 238, 0.3);
		border-radius: 30rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	/* 弹窗中的标签样式 */
	.tag-list .tag-item {
		display: flex;
		align-items: center;
		padding: 10rpx 20rpx;
		background-color: $bg-light;
		border-radius: 30rpx;
		font-size: 26rpx;
		color: $text-secondary;
		transition: all 0.2s ease;
		
		&.tag-selected {
			background-color: rgba(67, 97, 238, 0.15);
			border: 1rpx solid rgba(67, 97, 238, 0.3);
			color: $primary-color;
			
			text {
				color: $primary-color;
			}
		}
	}
	
	.tag-delete {
		width: 28rpx;
		height: 28rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-left: 8rpx;
	}
	
	.tag-popup-footer {
		margin-top: 30rpx;
		display: flex;
		justify-content: center;
	}

	.tag-confirm-btn {
		width: 60%;
		height: 80rpx;
		background-color: $primary-color;
		color: $bg-white;
		border-radius: 40rpx;
		font-size: 30rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	/* 封面区域 */
	.cover-section {
		margin-top: 30rpx;
		margin-bottom: 30rpx;
	}
	
	.cover-container {
		width: 100%;
		position: relative;
	}
	
	.cover-placeholder {
		width: 300rpx;
		height: 200rpx;
		background-color: $bg-light;
		border-radius: 10rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		border: 2rpx dashed #ddd;
		
		.add-cover-text {
			font-size: 24rpx;
			color: #999;
			margin-top: 10rpx;
		}
	}
	
	.cover-preview {
		width: 300rpx;
		height: 200rpx;
		position: relative;
		border-radius: 10rpx;
		overflow: hidden;
		border: 2rpx dashed #ddd;
		
		.cover-label {
			position: absolute;
			top: 10rpx;
			left: 10rpx;
			background-color: rgba(255,255,255,0.8);
			padding: 4rpx 10rpx;
			font-size: 24rpx;
		color: #666;
			border-radius: 6rpx;
			z-index: 2;
		}
	}

	.cover-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.image-delete {
		position: absolute;
		top: 10rpx;
		right: 10rpx;
		width: 40rpx;
		height: 40rpx;
		background-color: rgba(0, 0, 0, 0.5);
		border-radius: 20rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
	}
	
	/* ========== 底部工具栏 ========== */
	.editor-toolbar {
		height: 100rpx;
		display: flex;
		justify-content: space-around;
		align-items: center;
		background-color: $bg-white;
		border-top: 1rpx solid $border-color;
		position: fixed; /* 固定定位 */
		bottom: 0; /* 固定在底部 */
		left: 0; /* 左边缘对齐 */
		right: 0; /* 右边缘对齐 */
		width: 100%; /* 宽度100% */
		z-index: 999; /* 确保在最上层 */
		box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05); /* 添加顶部阴影，提升视觉层次 */
	}

	.toolbar-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.toolbar-icon {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.icon-text {
		font-size: 28rpx;
		font-weight: bold;
	}

	.toolbar-text {
		font-size: 24rpx;
		color: $text-secondary;
		margin-top: 6rpx;
	}
	
	/* ========== 格式工具栏 ========== */
	.formatting-toolbar {
		position: fixed;
		bottom: 100rpx;
		left: 0;
		right: 0;
		background-color: $bg-white;
		display: flex;
		padding: 20rpx;
		justify-content: space-around;
		border-top: 1rpx solid $border-color;
		z-index: 100;
		animation: slideUp 0.3s ease;
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	
	.format-item {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 10rpx;
		
		&:active {
			background-color: $bg-light;
		}
	}
	
	.format-text {
		font-size: 28rpx;
		font-weight: bold;
	}
	
	/* ========== 标签弹窗 ========== */
	.tag-popup-container {
		width: 100%;
		position: relative;
		padding-bottom: env(safe-area-inset-bottom); /* 兼容全面屏底部安全区域 */
	}

	.tag-popup-content {
		background-color: $bg-white;
		padding: 30rpx;
		border-top-left-radius: 20rpx;
		border-top-right-radius: 20rpx;
		max-height: 65vh; /* 限制最大高度为视口的65%，确保不会太高 */
		overflow-y: auto;
	}

	.tag-popup-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.tag-popup-title {
		font-size: 32rpx;
		font-weight: bold;
	}

	.tag-popup-close {
		width: 40rpx;
		height: 40rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.custom-tag-input {
		display: flex;
		margin-bottom: 30rpx;
	}

	.tag-input-field {
		flex: 1;
		height: 80rpx;
		background-color: $bg-light;
		border-radius: 40rpx;
		padding: 0 30rpx;
		font-size: 28rpx;
	}

	.add-tag-btn {
		width: 140rpx;
		height: 80rpx;
		background-color: $primary-color;
		color: $bg-white;
		border-radius: 40rpx;
		margin-left: 20rpx;
		font-size: 28rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.section-title {
		font-size: 28rpx;
		color: $text-secondary;
		margin-bottom: 20rpx;
		display: block;
	}

	.selected-tags-section,
	.recommended-tags-section {
		margin-bottom: 30rpx;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	/* ========== 链接弹窗 ========== */
	.link-input-container {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		padding: 20rpx 0;
	}
	
	.link-input,
	.link-text-input {
		height: 80rpx;
		background-color: $bg-light;
		border-radius: 8rpx;
		padding: 0 20rpx;
		margin-bottom: 20rpx;
	}
	
	/* ========== 编辑器内图片样式 ========== */
	.article-content-image {
		max-width: 100%;
		height: auto;
		margin: 20rpx 0;
		border-radius: 10rpx;
		position: relative;
		display: inline-block;
	}
	
	/* 图片删除按钮样式 */
	.image-delete-wrapper {
		position: relative;
		display: inline-block;
		margin: 10rpx 0;
		
		.image-delete-btn {
			position: absolute;
			top: 10rpx;
			right: 10rpx;
			width: 40rpx;
			height: 40rpx;
			background-color: rgba(0, 0, 0, 0.5);
			border-radius: 20rpx;
		display: flex;
		justify-content: center;
		align-items: center;
			color: $bg-white;
			font-size: 28rpx;
		}
	}
	
	/* 字数统计样式 */
	.word-count {
		position: absolute;
		bottom: 0;
		right: 0;
		padding: 6rpx 12rpx;
		font-size: 24rpx;
		color: $text-light;
		background-color: rgba(255, 255, 255, 0.8);
		border-radius: 6rpx;
	}
	
	/* 预览模式样式简化 */
	.preview-container {
		position: fixed;
		top: 90rpx;
		left: 0;
		right: 0;
		bottom: 100rpx;
		background-color: $bg-light;
		z-index: 100;
		padding: 0; /* 移除内边距，避免与scroll-view冲突 */
	}

	.preview-scroll-view {
		height: 100%; /* 充满整个容器高度 */
		width: 100%;
		box-sizing: border-box;
		padding: 30rpx;
	}

	.preview-article-wrapper {
		width: 100%;
		display: flex;
		justify-content: center;
		padding-bottom: 120rpx; /* 确保底部有足够空间 */
	}
	
	.preview-article {
		background-color: $bg-white;
		border-radius: 16rpx;
		padding: 40rpx 30rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
		width: 100%;
		max-width: 720rpx;
		min-width: 680rpx;
		box-sizing: border-box;
		overflow-wrap: break-word;
		margin-bottom: 60rpx;
		display: flex; /* 使用flex布局 */
		flex-direction: column; /* 垂直排列子元素 */
	}
	
	.preview-title {
		font-size: 40rpx;
		font-weight: 700;
		color: $text-color;
		margin-bottom: 20rpx;
		line-height: 1.4;
		width: 100%;
		overflow-wrap: break-word;
		word-break: break-word;
	}

	.preview-info {
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
		font-size: 24rpx;
		color: $text-light;
	}
	
	.preview-date {
		margin-right: 20rpx;
	}
	
	.preview-tags {
		display: flex;
		flex-wrap: wrap;
		margin-bottom: 30rpx;
		gap: 16rpx;
	}
	
	.preview-tag {
		font-size: 24rpx;
		padding: 8rpx 16rpx;
		background-color: rgba(67, 97, 238, 0.1);
		color: $primary-color;
		border-radius: 8rpx;
	}
	
	.preview-cover {
		margin-bottom: 30rpx;
		border-radius: 12rpx;
		overflow: hidden;
		width: 100%;
		position: relative;
		border: 2rpx dashed #ddd;
		padding: 20rpx;
		box-sizing: border-box;
		
		.preview-cover-image {
			width: 100%;
			max-width: 100%;
			height: auto;
			display: block;
			border-radius: 8rpx;
		}
		
		.cover-label {
			position: absolute;
			top: 10rpx;
			left: 10rpx;
			background-color: rgba(255,255,255,0.8);
			padding: 4rpx 10rpx;
			font-size: 24rpx;
		color: #666;
			border-radius: 6rpx;
			z-index: 2;
		}
	}

	.preview-cover-empty {
		height: 200rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #f9f9f9;
		
		.empty-cover-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
			color: #ccc;

			text {
		margin-top: 10rpx;
				font-size: 24rpx;
			}
		}
	}
	
	.preview-content {
		font-size: 28rpx;
		line-height: 1.8;
		color: $text-color;
		word-break: break-word;
		overflow-wrap: break-word;
		width: 100%;
	}

	.rich-text-content {
		width: 100%;
		height: auto !important;
		
		/* 确保rich-text内的内容显示正确 */
	}
	
	/* 修复rich-text内容样式 */
	:deep(.rich-text-content) img {
		max-width: 100% !important;
		height: auto !important;
		margin: 20rpx 0;
	}
	
	:deep(.rich-text-content) p {
		margin-bottom: 30rpx !important; /* 增加段落间距 */
		min-height: 30rpx;
		display: block !important; /* 确保段落是块级元素 */
	}
	
	:deep(.rich-text-content) br {
		display: block !important;
		content: "" !important;
		margin-bottom: 10rpx !important; /* 给br标签添加下边距 */
	}
	
	:deep(.rich-text-content) h1,
	:deep(.rich-text-content) h2,
	:deep(.rich-text-content) h3 {
		margin: 30rpx 0 20rpx;
		line-height: 1.5;
	}

	/* 禁用状态的工具栏项目 */
	.toolbar-item.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	/* 标签弹窗底部安全区域 */
	.tag-popup-safe-area {
		height: 100rpx; /* 与底部工具栏高度一致 */
		width: 100%;
	}

	/* 标题字数统计样式 */
	.title-word-count {
		position: absolute;
		right: 0;
		bottom: 0;
		font-size: 24rpx;
		color: #999;
	}
</style>