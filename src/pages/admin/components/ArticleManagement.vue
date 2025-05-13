<template>
  <view class="article-management fade-in">
    <!-- 搜索和过滤区域 -->
    <view class="filter-container">
      <view class="search-box">
        <uni-search-bar
          placeholder="搜索文章标题或作者"
          v-model="searchKeyword"
          @confirm="searchArticles"
          @cancel="resetSearch"
          @clear="resetSearch"
        ></uni-search-bar>
      </view>
      <view class="filter-box">
        <picker 
          @change="onStatusChange" 
          :value="statusFilterIndex" 
          :range="statusOptions"
        >
          <view class="picker-box">
            <text>状态：{{ statusOptions[statusFilterIndex] }}</text>
            <uni-icons type="arrow-down" size="14" color="#666"></uni-icons>
          </view>
        </picker>
      </view>
    </view>

    <!-- 文章表格 -->
    <view class="table-container">
      <view class="table-header">
        <view class="th" style="width: 50px;">ID</view>
        <view class="th" style="flex: 1; min-width: 150px;">标题</view>
        <view class="th" style="width: 100px;">作者</view>
        <view class="th" style="width: 150px;">发布时间</view>
        <view class="th" style="width: 60px;">浏览量</view>
        <view class="th" style="width: 60px;">点赞数</view>
        <view class="th" style="width: 60px;">评论数</view>
        <view class="th" style="width: 80px;">状态</view>
        <view class="th" style="width: 180px;">操作</view>
      </view>
      
      <view class="table-body">
        <view v-if="loading" class="loading-container">
          <uni-load-more status="loading" :contentText="loadingText"></uni-load-more>
        </view>
        
        <view v-else-if="articles.length === 0" class="no-data">
          <view class="no-data-icon">🔍</view>
          <text>暂无文章数据</text>
        </view>
        
        <view v-else class="table-row" v-for="(article, index) in articles" :key="article.id">
          <view class="td" style="width: 50px;">{{ article.id }}</view>
          <view class="td title-cell" style="flex: 1; min-width: 150px;">
            <text class="article-title">{{ article.title }}</text>
          </view>
          <view class="td" style="width: 100px;">{{ article.author || article.userName }}</view>
          <view class="td" style="width: 150px;">{{ formatDate(article.createTime) }}</view>
          <view class="td" style="width: 60px;">{{ article.viewCount || 0 }}</view>
          <view class="td" style="width: 60px;">{{ article.likeCount || 0 }}</view>
          <view class="td" style="width: 60px;">{{ article.commentCount || 0 }}</view>
          <view class="td" style="width: 80px;">
            <text :class="['status-badge', getStatusClass(article.status)]">
              {{ getStatusText(article.status) }}
            </text>
          </view>
          <view class="td actions" style="width: 180px;">
            <button class="btn btn-sm" @click="viewArticle(article)">查看</button>
            
            <!-- 待审核状态可审核通过 -->
            <button 
              v-if="article.status === '2'"
              class="btn btn-sm btn-primary" 
              @click="approveArticle(article)"
            >通过</button>
            
            <!-- 待审核状态可拒绝/驳回 -->
            <button 
              v-if="article.status === '2'"
              class="btn btn-sm btn-warning" 
              @click="rejectArticle(article)"
            >审核不通过</button>
            
            <!-- 草稿状态可发布 -->
            <button 
              v-if="article.status === '0'"
              class="btn btn-sm btn-primary" 
              @click="approveArticle(article)"
            >发布</button>
            
            <!-- 已发布状态可设为下架 -->
            <button 
              v-if="article.status === '1'"
              class="btn btn-sm btn-warning" 
              @click="unpublishArticle(article)"
            >下架</button>
            
            <button class="btn btn-sm btn-danger" @click="deleteArticle(article)">删除</button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 分页 -->
    <view class="pagination" v-if="articles.length > 0">
      <view class="page-info">
        <text>共 {{ total }} 条记录，当前 {{ currentPage }}/{{ totalPages }} 页</text>
      </view>
      <view class="page-controls">
        <button 
          class="btn btn-sm" 
          :disabled="currentPage <= 1"
          @click="changePage(currentPage - 1)"
        >上一页</button>
        <button 
          class="btn btn-sm" 
          :disabled="currentPage >= totalPages"
          @click="changePage(currentPage + 1)"
        >下一页</button>
      </view>
    </view>
    
    <!-- 文章预览弹窗 -->
    <uni-popup ref="previewPopup" type="dialog">
      <uni-popup-dialog
        :title="currentArticle.title || '文章预览'"
        :mode="'base'"
        :before-close="true"
        confirmText="关闭"
        @confirm="closePreviewDialog"
        @close="closePreviewDialog"
      >
        <view class="article-preview">
          <view class="preview-header">
            <image 
              v-if="currentArticle.coverImage" 
              class="preview-cover" 
              :src="currentArticle.coverImage" 
              mode="aspectFill"
            ></image>
            
            <view class="preview-meta">
              <view class="preview-author">
                <text>作者：{{ currentArticle.author || currentArticle.userName }}</text>
              </view>
              <view class="preview-time">
                <text>发布时间：{{ formatDate(currentArticle.createTime) }}</text>
              </view>
              <view class="preview-stats">
                <text>浏览量：{{ currentArticle.viewCount || 0 }}</text>
                <text>点赞数：{{ currentArticle.likeCount || 0 }}</text>
                <text>评论数：{{ currentArticle.commentCount || 0 }}</text>
              </view>
              <view class="preview-status">
                <text class="status-text">状态：</text>
                <text :class="['status-badge', getStatusClass(currentArticle.status)]">
                  {{ getStatusText(currentArticle.status) }}
                </text>
              </view>
              
              <!-- 新增标签显示 -->
              <view class="preview-tags" v-if="currentArticle.tags && currentArticle.tags.length > 0">
                <text class="tags-text">标签：</text>
                <view class="tags-list">
                  <text 
                    v-for="(tag, index) in currentArticle.tags" 
                    :key="index" 
                    class="tag-item"
                  >{{ tag }}</text>
                </view>
              </view>
            </view>
          </view>
          
          <view class="preview-content">
            <!-- 正文内容 -->
            <view class="content-block">
              <text class="content-title">正文内容：</text>
              <scroll-view class="content-scroll" scroll-y>
                <text class="content-text">{{ formatHtmlContent(currentArticle.content) }}</text>
              </scroll-view>
            </view>
          </view>
          
          <view class="preview-actions">
            <!-- 优化按钮布局 -->
            <view class="action-buttons">
              <!-- 待审核状态可审核通过 -->
              <button 
                v-if="String(currentArticle.status) === '2'"
                class="action-btn btn-primary" 
                @click="approveArticleFromPreview"
              >
                <text class="btn-icon">✓</text>
                <text>审核通过</text>
              </button>
              
              <!-- 待审核状态可驳回 -->
              <button 
                v-if="String(currentArticle.status) === '2'"
                class="action-btn btn-warning" 
                @click="rejectArticleFromPreview"
              >
                <text class="btn-icon">✗</text>
                <text>审核不通过</text>
              </button>
              
              <!-- 草稿状态可发布 -->
              <button 
                v-if="String(currentArticle.status) === '0'"
                class="action-btn btn-primary" 
                @click="approveArticleFromPreview"
              >
                <text class="btn-icon">✓</text>
                <text>发布文章</text>
              </button>
              
              <!-- 已发布状态可下架 -->
              <button 
                v-if="String(currentArticle.status) === '1'"
                class="action-btn btn-warning" 
                @click="unpublishArticleFromPreview"
              >
                <text class="btn-icon">↓</text>
                <text>下架文章</text>
              </button>
              
              <!-- 已下架状态可重新发布 -->
              <button 
                v-if="String(currentArticle.status) === '3'"
                class="action-btn btn-primary" 
                @click="approveArticleFromPreview"
              >
                <text class="btn-icon">↑</text>
                <text>重新发布</text>
              </button>
            </view>
          </view>
        </view>
      </uni-popup-dialog>
    </uni-popup>
    
    <!-- 确认删除弹窗 -->
    <uni-popup ref="confirmPopup" type="dialog">
      <uni-popup-dialog
        title="删除确认"
        content="确定要删除该文章吗？删除后将无法恢复，且相关的评论、点赞等数据也将被删除。"
        :before-close="true"
        @confirm="confirmDelete"
        @close="closeConfirmDialog"
      ></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import uniSearchBar from '@/uni_modules/uni-search-bar/components/uni-search-bar/uni-search-bar.vue';
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue';
import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue';
import uniLoadMore from '@/uni_modules/uni-load-more/components/uni-load-more/uni-load-more.vue';
import uniIcons from '@/uni_modules/uni-icons/components/uni-icons/uni-icons.vue';
import { articleApi } from '@/api/admin';
import { getArticleTags } from '@/api/article';  // 导入获取标签列表的API
import http from '@/utils/request.js';

// 搜索关键词
const searchKeyword = ref('');

// 状态过滤
const statusOptions = ['全部', '已发布', '待审核', '草稿', '已下架'];
const statusFilterIndex = ref(0);
const statusFilters = ['', '1', '2', '0', '3'];

// 文章列表数据
const articles = ref([]);

// 当前查看的文章
const currentArticle = ref({});

// 待删除的文章ID
const articleToDeleteId = ref(null);

// 加载状态
const loading = ref(false);

// 分页信息
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

// 弹窗引用
const previewPopup = ref(null);
const confirmPopup = ref(null);

// 加载文本
const loadingText = {
  contentdown: '显示更多',
  contentrefresh: '加载中...',
  contentnomore: '没有更多数据了'
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知';
  
  // 简化日期格式
  if (dateStr.includes(' ')) {
    const parts = dateStr.split(' ');
    const date = parts[0];
    const time = parts[1].substring(0, 5); // 只保留小时和分钟
    return `${date} ${time}`;
  }
  
  return dateStr;
};

// 获取状态文本
const getStatusText = (status) => {
  switch (String(status)) {
    case '0': return '草稿/未通过';
    case '1': return '已发布';
    case '2': return '待审核';
    case '3': return '已下架';
    default: return '未知';
  }
};

// 获取状态样式类
const getStatusClass = (status) => {
  switch (String(status)) {
    case '0': return 'status-draft';
    case '1': return 'status-published';
    case '2': return 'status-pending';
    case '3': return 'status-unpublished';
    default: return '';
  }
};

// 格式化HTML内容，移除HTML标签
const formatHtmlContent = (html) => {
  if (!html) return '';
  // 使用正则表达式移除所有HTML标签
  return html.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
};

// 获取文章列表
const fetchArticles = async (page = 1) => {
  loading.value = true;
  currentPage.value = page;
  
  console.log('开始请求文章列表，页码:', page);
  
  try {
    // 构造查询参数
    const params = {
      page: page,
      size: pageSize.value,
      status: statusFilters[statusFilterIndex.value],
      keyword: searchKeyword.value
    };
    
    console.log('发送请求参数:', JSON.stringify(params));
    
    const res = await articleApi.getArticleList(params);
    
    console.log('获取文章列表成功:', JSON.stringify(res));
    
    // 确保返回的数据格式正确
    if (res && res.data) {
      // 解析后端返回的数据结构：{total: number, data: array}
      // 后端返回的数据字段使用驼峰命名法：
      // - id: 文章ID
      // - title: 文章标题
      // - summary: 文章摘要
      // - coverImage: 封面图片
      // - author/userName: 作者名称
      // - createTime: 创建时间
      // - viewCount: 浏览量
      // - likeCount: 点赞数
      // - commentCount: 评论数
      // - status: 状态 (0-草稿，1-已发布，2-已下架)
      
      // 处理返回的数据，确保计数字段都有值
      let articleData = Array.isArray(res.data.data) ? res.data.data : [];
      
      // 修正数据，确保浏览量、点赞数和评论数字段有值
      articleData = articleData.map(article => {
        // 检查并转换可能的字符串类型数值为数字
        const viewCount = article.viewCount !== undefined ? 
          (isNaN(Number(article.viewCount)) ? 0 : Number(article.viewCount)) : 0;
        
        const likeCount = article.likeCount !== undefined ? 
          (isNaN(Number(article.likeCount)) ? 0 : Number(article.likeCount)) : 0;
        
        const commentCount = article.commentCount !== undefined ? 
          (isNaN(Number(article.commentCount)) ? 0 : Number(article.commentCount)) : 0;
        
        // 检查可能的下划线命名方式
        const view_count = article.view_count !== undefined ? 
          (isNaN(Number(article.view_count)) ? 0 : Number(article.view_count)) : 0;
        
        const like_count = article.like_count !== undefined ? 
          (isNaN(Number(article.like_count)) ? 0 : Number(article.like_count)) : 0;
        
        const comment_count = article.comment_count !== undefined ? 
          (isNaN(Number(article.comment_count)) ? 0 : Number(article.comment_count)) : 0;
        
        // 合并处理后的值
        return {
          ...article,
          viewCount: viewCount || view_count,
          likeCount: likeCount || like_count,
          commentCount: commentCount || comment_count
        };
      });
      
      articles.value = articleData;
      total.value = res.data.total || 0;
      
      console.log('处理后的文章数据:', articles.value);
    } else {
      console.error('返回数据格式错误:', res);
      articles.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取文章列表失败:', error);
    uni.showToast({
      title: '获取文章列表失败',
      icon: 'none'
    });
    articles.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 切换页码
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  fetchArticles(page);
};

// 搜索文章
const searchArticles = () => {
  console.log('搜索文章:', searchKeyword.value);
  fetchArticles(1); // 重置到第一页
};

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = '';
  fetchArticles(1);
};

// 状态筛选变更
const onStatusChange = (e) => {
  statusFilterIndex.value = e.detail.value;
  console.log('状态筛选变更为:', statusOptions[statusFilterIndex.value]);
  fetchArticles(1);
};

// 查看文章详情
const viewArticle = async (article) => {
  console.log('查看文章详情:', article);
  
  // 先设置初始数据，确保状态为字符串类型
  currentArticle.value = { 
    ...article,
    status: String(article.status) // 确保状态为字符串
  };
  
  try {
    // 获取完整的文章详情
    const res = await articleApi.getArticleDetail(article.id);
    if (res && res.data) {
      // 确保保留原始作者信息和状态格式
      const authorName = article.author || article.userName || '';
      const statusValue = res.data.status !== undefined ? String(res.data.status) : String(article.status);
      
      currentArticle.value = {
        ...res.data,
        author: res.data.author || authorName,
        userName: res.data.userName || authorName,
        status: statusValue // 确保状态为字符串
      };
      
      console.log('设置预览文章数据:', currentArticle.value);
      console.log('当前文章状态:', currentArticle.value.status, '类型:', typeof currentArticle.value.status);
    }
  } catch (error) {
    console.error('获取文章详情失败:', error);
  }
  
  setTimeout(() => {
    // 延迟打开，确保数据已设置完成
    previewPopup.value.open();
  }, 100);
};

// 关闭文章预览弹窗
const closePreviewDialog = () => {
  previewPopup.value.close();
};

// 发布文章
const approveArticle = async (article) => {
  console.log('审核通过/发布文章:', article);
  updateArticleStatus(article.id, '1');
};

// 从预览框发布文章
const approveArticleFromPreview = () => {
  updateArticleStatus(currentArticle.value.id, '1');
  closePreviewDialog();
};

// 驳回文章
const rejectArticle = async (article) => {
  console.log('驳回文章:', article);
  updateArticleStatus(article.id, '0');
};

// 从预览框驳回文章
const rejectArticleFromPreview = () => {
  updateArticleStatus(currentArticle.value.id, '0');
  closePreviewDialog();
};

// 下架文章
const unpublishArticle = async (article) => {
  console.log('下架文章:', article);
  updateArticleStatus(article.id, '3');
};

// 从预览框下架文章
const unpublishArticleFromPreview = () => {
  updateArticleStatus(currentArticle.value.id, '3');
  closePreviewDialog();
};

// 从预览框删除文章
const deleteArticleFromPreview = () => {
  articleToDeleteId.value = currentArticle.value.id;
  closePreviewDialog();
  confirmPopup.value.open();
};

// 获取当前文章状态对应的操作提示
const getActionTip = (status) => {
  switch (String(status)) {
    case '0': 
      return '当前为草稿状态，可以发布文章';
    case '1': 
      return '当前已发布，可以下架文章';
    case '2': 
      return '当前待审核，可以通过或驳回';
    case '3': 
      return '当前已下架，可以重新发布';
    default: 
      return '';
  }
};

// 更新文章状态
const updateArticleStatus = async (id, status) => {
  console.log('更新文章状态, ID:', id, '状态:', status);
  
  try {
    loading.value = true;
    
    // 验证状态参数 - 修复状态检查逻辑
    if (![0, 1, 2, 3, '0', '1', '2', '3'].includes(status)) {
      uni.showToast({
        title: "无效的状态值",
        icon: 'none'
      });
      return;
    }
    
    // 添加更多调试日志
    console.log('准备发送更新请求', {
      id,
      status,
      url: `/api/admin/articles/${id}/status?status=${status}`,
      method: 'PUT'
    });
    
    // 直接使用http请求而不是通过API接口，确保使用PUT方法
    const res = await http.put(`/api/admin/articles/${id}/status?status=${status}`);
    
    console.log('更新文章状态成功:', res);
    
    let statusText = '';
    switch (status) {
      case '0': 
      case 0: 
        statusText = '驳回成功，审核未通过'; 
        break;
      case '1': 
      case 1: 
        statusText = '已发布'; 
        break;
      case '2': 
      case 2: 
        statusText = '已标记为待审核'; 
        break;
      case '3': 
      case 3: 
        statusText = '已下架'; 
        break;
      default: 
        statusText = '已更新状态';
    }
    
    uni.showToast({
      title: statusText,
      icon: 'success'
    });
    
    // 更新本地数据
    const index = articles.value.findIndex(a => a.id === id);
    if (index !== -1) {
      articles.value[index].status = String(status);
    }
    
    // 刷新文章列表
    fetchArticles(currentPage.value);
  } catch (error) {
    console.error('更新文章状态失败:', error);
    console.error('错误详情:', JSON.stringify(error));
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 删除文章
const deleteArticle = (article) => {
  console.log('准备删除文章:', article);
  articleToDeleteId.value = article.id;
  confirmPopup.value.open();
};

// 确认删除
const confirmDelete = async () => {
  if (!articleToDeleteId.value) return;
  
  console.log('确认删除文章ID:', articleToDeleteId.value);
  loading.value = true;
  
  try {
    const res = await articleApi.deleteArticle(articleToDeleteId.value);
    console.log('删除文章成功:', res);
    
    uni.showToast({
      title: '删除成功',
      icon: 'success'
    });
    
    // 刷新文章列表
    if (articles.value.length === 1 && currentPage.value > 1) {
      fetchArticles(currentPage.value - 1);
    } else {
      fetchArticles(currentPage.value);
    }
  } catch (error) {
    console.error('删除文章失败:', error);
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
    closeConfirmDialog();
  }
};

// 关闭确认删除弹窗
const closeConfirmDialog = () => {
  confirmPopup.value.close();
  articleToDeleteId.value = null;
};

// 初始化
onMounted(() => {
  console.log('ArticleManagement组件已挂载，开始获取文章列表');
  setTimeout(() => {
    // 延迟100ms执行，确保组件完全渲染
    fetchArticles();
  }, 100);
});
</script>

<style>
.article-management {
  width: 100%;
}

.filter-container {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.search-box {
  flex: 1;
}

.filter-box {
  margin-left: 10px;
}

.picker-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f7f7f7;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  min-width: 100px;
  width: auto;
}

.picker-box text {
  margin-right: 5px;
}

.table-container {
  width: 100%;
  border: 1px solid #eee;
  border-radius: 6px;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 15px;
}

.table-header {
  display: flex;
  background-color: #f7f9fc;
  font-weight: 500;
  border-bottom: 1px solid #eee;
  min-width: 800px;
}

.th {
  padding: 12px 8px;
  text-align: left;
  font-size: 13px;
  color: #333;
}

.table-body {
  background-color: #fff;
  min-width: 800px;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.table-row:hover {
  background-color: #f9fafc;
}

.table-row:last-child {
  border-bottom: none;
}

.td {
  padding: 12px 8px;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666;
  display: flex;
  align-items: center;
}

.title-cell {
  display: flex;
  align-items: center;
}

.article-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 8px;
  object-fit: cover;
}

.article-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.status-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.status-published {
  background-color: #e6f7e6;
  color: #52c41a;
}

.status-draft {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-pending {
  background-color: #fff7e6;
  color: #fa8c16;
}

.status-unpublished {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.actions {
  display: flex;
  gap: 6px;
}

.btn {
  margin-right: 8px;
  padding: 6px 12px;
  min-width: 60px;
}

.btn:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.btn:active::after {
  animation: ripple 0.4s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0) translate(-50%, -50%);
    opacity: 1;
  }
  70% {
    transform: scale(40) translate(-50%, -50%);
    opacity: 0.5;
  }
  100% {
    transform: scale(60) translate(-50%, -50%);
    opacity: 0;
  }
}

.btn-sm {
  padding: 3px 8px;
  font-size: 12px;
}

.btn-primary {
  background-color: #4361ee;
  color: #fff;
  border-color: #4361ee;
  box-shadow: 0 2px 4px rgba(67, 97, 238, 0.2);
}

.btn-primary:hover {
  background-color: #3b56d9;
  border-color: #3b56d9;
}

.btn-success {
  background-color: #52c41a;
  color: #fff;
  border-color: #52c41a;
  box-shadow: 0 2px 4px rgba(82, 196, 26, 0.2);
}

.btn-success:hover {
  background-color: #49af17;
  border-color: #49af17;
}

.btn-warning {
  background-color: #faad14;
  color: #fff;
  border-color: #faad14;
  box-shadow: 0 2px 4px rgba(250, 173, 20, 0.2);
}

.btn-warning:hover {
  background-color: #e8a012;
  border-color: #e8a012;
}

.btn-danger {
  background-color: #ff4d4f;
  color: #fff;
  border-color: #ff4d4f;
  box-shadow: 0 2px 4px rgba(255, 77, 79, 0.2);
}

.btn-danger:hover {
  background-color: #f5222d;
  border-color: #f5222d;
}

.loading-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.no-data {
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.no-data-icon {
  font-size: 36px;
  margin-bottom: 8px;
  color: #ccc;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-info {
  font-size: 13px;
  color: #666;
}

.page-controls {
  display: flex;
  gap: 8px;
}

/* 文章预览弹窗样式 */
.article-preview {
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 10px;
}

.preview-header {
  margin-bottom: 15px;
}

.preview-cover {
  width: 100%;
  height: 160px;
  border-radius: 6px;
  object-fit: cover;
  margin-bottom: 10px;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.preview-author, .preview-time, .preview-stats {
  font-size: 13px;
  color: #666;
}

.preview-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-status {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.status-text {
  font-size: 13px;
  color: #666;
  margin-right: 5px;
}

/* 标签样式 */
.preview-tags {
  margin-top: 8px;
  display: flex;
  align-items: flex-start;
}

.tags-text {
  font-size: 13px;
  color: #666;
  margin-right: 5px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-item {
  font-size: 12px;
  padding: 2px 6px;
  background-color: #f0f2f5;
  color: #5c6b77;
  border-radius: 10px;
}

.preview-content {
  margin-bottom: 20px;
}

.content-block {
  margin-bottom: 15px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 15px;
  background-color: #fafafa;
}

.content-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.content-summary {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  display: block;
}

.content-scroll {
  max-height: 300px;
  margin-top: 5px;
  width: 100%;
  overflow-y: auto;
}

.content-text {
  font-size: 13px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  width: 100%;
  display: block;
  text-align: left;
}

.preview-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: flex-end;
}

/* 优化后的按钮样式 */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
  justify-content: flex-end;
}

.action-btn {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f0f0f0;
  color: #999;
  border-color: #ddd;
  box-shadow: none;
}

.btn-disabled:hover {
  background-color: #f0f0f0;
  border-color: #ddd;
  transform: none;
}

.btn-icon {
  margin-right: 4px;
  font-size: 14px;
}

.action-tips {
  width: 100%;
  text-align: center;
  margin-top: 10px;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.debug-info {
  margin-top: 10px;
  padding: 5px;
  background-color: #f0f8ff;
  border: 1px dashed #ccc;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  text-align: center;
  width: 100%;
}
</style> 