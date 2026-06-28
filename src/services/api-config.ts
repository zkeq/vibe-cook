/**
 * API 配置文件
 *
 * 这里集中管理所有 API 相关配置
 * 方便后续对接后端时统一修改
 */

// API 基础 URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API 端点
export const API_ENDPOINTS = {
  // 菜谱相关
  recipes: {
    list: '/api/recipes',
    detail: (id: string) => `/api/recipes/${id}`,
    search: '/api/recipes/search',
    category: (category: string) => `/api/recipes/category/${category}`,
  },

  // 用户相关（预留）
  user: {
    profile: '/api/user/profile',
    favorites: '/api/user/favorites',
    history: '/api/user/history',
  },

  // 其他功能（预留）
  comments: '/api/comments',
  ratings: '/api/ratings',
} as const;

// API 请求配置
export const API_CONFIG = {
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
};

// 环境标识
export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_PROD = process.env.NODE_ENV === 'production';

// Mock 数据开关（开发时可以切换）
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK === 'true' || !process.env.NEXT_PUBLIC_API_URL;
