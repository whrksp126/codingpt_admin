import { backendUrl } from './common.js';

// 구독 플랜 조절판 + 사용량 실측 API. 백엔드 무인증 admin 엔드포인트(본인 전용 서비스).

const headers = { 'Content-Type': 'application/json' };

const handle = async (res) => {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const j = (method, path, body) => fetch(`${backendUrl}${path}`, {
  method,
  headers,
  ...(body !== undefined && { body: JSON.stringify(body) }),
}).then(handle);

export const getPlans = () => j('GET', '/api/subscription/plans');
export const updatePlan = (id, data) => j('PUT', `/api/subscription/plans/${id}`, data);
export const getUsageSummary = (days = 14) => j('GET', `/api/admin/usage/summary?days=${days}`);
