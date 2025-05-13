<template>
	<view class="back-to-top" v-if="visible" @click="scrollToTop">
		<uni-icons :type="icon" :size="iconSize" :color="iconColor"></uni-icons>
		<text v-if="showText" class="text">{{ text }}</text>
	</view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { onPageScroll } from '@dcloudio/uni-app';

// 组件属性定义
const props = defineProps({
	// 显示阈值（滚动多少距离后显示）
	threshold: {
		type: Number,
		default: 300
	},
	// 图标类型
	icon: {
		type: String,
		default: 'top'
	},
	// 图标大小
	iconSize: {
		type: Number,
		default: 24
	},
	// 图标颜色
	iconColor: {
		type: String,
		default: '#ffffff'
	},
	// 是否显示文字
	showText: {
		type: Boolean,
		default: true
	},
	// 文字内容
	text: {
		type: String,
		default: '顶部'
	},
	// 动画持续时间
	duration: {
		type: Number,
		default: 0
	},
	// 样式相关
	right: {
		type: String,
		default: '30rpx'
	},
	bottom: {
		type: String,
		default: '100rpx'
	},
	// 是否使用页面滚动检测
	usePageScroll: {
		type: Boolean,
		default: true
	},
	// 如果页面有多个滚动区域，是否指定某个容器的ID
	containerId: {
		type: String,
		default: ''
	},
	// 点击后是否自动隐藏
	hideAfterClick: {
		type: Boolean,
		default: true
	}
});

// 定义事件
const emit = defineEmits(['click']);

// 状态管理
const scrollTop = ref(0);
const visible = ref(false);
let scrollListener = null;

// 强制隐藏按钮的方法
const hideButton = () => {
	visible.value = false;
};

// 强制显示按钮的方法
const showButton = () => {
	visible.value = true;
};

// 监听页面滚动
const handlePageScroll = (e) => {
	scrollTop.value = e.scrollTop;
	visible.value = scrollTop.value > props.threshold;
};

// 滚动到顶部函数
const scrollToTop = () => {
	console.log('回到顶部组件: 点击滚动到顶部');
	
	// 用户反馈
	uni.showToast({
		title: '返回顶部',
		icon: 'none',
		duration: 300
	});
	
	try {
		// 发出点击事件，让父组件处理具体的滚动逻辑
		emit('click');
		
		// 如果没有父组件处理，则默认使用uni-app API滚动整个页面
		// #ifdef H5
		// 尝试查找包含文章列表的滚动容器
		const articleScrollView = document.getElementById('article-list-scroll-h5');
		if (articleScrollView) {
			console.log('回到顶部组件: H5环境找到文章列表scroll-view');
			articleScrollView.scrollTop = 0;
		} else {
			// 如果找不到指定ID的元素，尝试通过类名查找
			const scrollViews = document.querySelectorAll('.article-scroll');
			if (scrollViews && scrollViews.length > 0) {
				console.log('回到顶部组件: H5环境通过类名找到滚动元素');
				scrollViews.forEach(sv => sv.scrollTop = 0);
			} else {
				// 如果仍然找不到，使用页面滚动
				window.scrollTo({
					top: 0,
					behavior: props.duration > 0 ? 'smooth' : 'auto'
				});
			}
		}
		// #endif
		
		// #ifndef H5
		// 非H5环境，使用uni API
		uni.pageScrollTo({
			scrollTop: 0,
			duration: props.duration
		});
		// #endif
		
		// 点击后隐藏按钮
		if (props.hideAfterClick) {
			visible.value = false;
		}
		
		console.log('回到顶部组件: 执行滚动到顶部, duration:', props.duration);
	} catch (error) {
		console.error('回到顶部组件: 滚动到顶部出错:', error);
		// 出错时尝试使用最基本的方法
		uni.pageScrollTo({
			scrollTop: 0,
			duration: 0
		});
	}
};

// 生命周期钩子
onMounted(() => {
	if (props.usePageScroll) {
		// 使用页面滚动事件
		onPageScroll(handlePageScroll);
	} else if (props.containerId) {
		// 如果指定了容器ID，监听该容器的滚动事件
		setTimeout(() => {
			const container = document.getElementById(props.containerId);
			if (container) {
				scrollListener = (e) => {
					scrollTop.value = e.target.scrollTop;
					visible.value = scrollTop.value > props.threshold;
				};
				container.addEventListener('scroll', scrollListener);
			}
		}, 100);
	}
});

// 清理事件监听
onUnmounted(() => {
	if (!props.usePageScroll && props.containerId && scrollListener) {
		// #ifdef H5
		const container = document.getElementById(props.containerId);
		if (container) {
			container.removeEventListener('scroll', scrollListener);
		}
		// #endif
	}
});

// 导出组件方法
defineExpose({
	scrollToTop,
	hideButton,
	showButton
});
</script>

<style lang="scss">
.back-to-top {
	position: fixed;
	right: v-bind(right);
	bottom: v-bind(bottom);
	width: 90rpx;
	height: 90rpx;
	border-radius: 50%;
	background-color: rgba(67, 97, 238, 0.8);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	z-index: 999;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	transition: all 0.3s ease;
	animation: fadeIn 0.3s ease;
	
	.text {
		font-size: 20rpx;
		color: #ffffff;
		margin-top: -5rpx;
	}
	
	&:active {
		opacity: 0.7;
		transform: scale(0.95);
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(20px) scale(0.9);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style> 