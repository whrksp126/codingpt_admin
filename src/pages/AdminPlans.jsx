import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, X, ChartLine } from '@phosphor-icons/react';
import * as billingApi from '../utils/billingApi';

// 한도 ↔ 원가 환산(어드민 직관용). config/billing: unit = 원가$ × USD_TO_UNIT(1e6) × MARKUP(1.75).
const UNIT_PER_USD = 1750000;
const KRW_PER_USD = 1380; // 표시용 환율(대략)
const USD_PER_TURN = 0.08; // 바이브코딩 턴당 원가 가정 — 실측으로 보정
const WEEKS_PER_MONTH = 4.348;
const unitsToUsd = (u) => (Number(u) || 0) / UNIT_PER_USD;
const fmtKRW = (n) => '₩' + Math.round(n).toLocaleString('ko-KR');
const fmtUSD = (n) => '$' + n.toFixed(2);

function weeklyHint(weekly) {
  const wk = unitsToUsd(weekly);
  if (!wk) return '무제한';
  const monthly = wk * WEEKS_PER_MONTH;
  const turns = Math.round(wk / USD_PER_TURN);
  return `≈ 주 ${fmtUSD(wk)} · 월 최대 ${fmtKRW(monthly * KRW_PER_USD)} (${fmtUSD(monthly)}) · 약 ${turns}턴/주`;
}
function windowHint(win) {
  const w = unitsToUsd(win);
  if (!w) return '무제한';
  return `≈ ${fmtUSD(w)}/5시간 · 약 ${Math.round(w / USD_PER_TURN)}턴`;
}

const NumberField = ({ label, value, onChange, hint }) => (
  <label className="block">
    <span className="text-xs text-slate-600">{label}</span>
    <input
      type="number" min="0" value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 font-mono text-sm focus:border-cyan-500 focus:outline-none"
    />
    {hint ? <span className="mt-0.5 block text-[11px] text-slate-400">{hint}</span> : null}
  </label>
);

const PlanEditModal = ({ plan, onSave, onClose }) => {
  const [f, setF] = useState({
    name: plan.name || '',
    price_krw: plan.price_krw ?? 0,
    window_seconds: plan.window_seconds ?? 18000,
    window_unit_limit: plan.window_unit_limit ?? 0,
    weekly_unit_limit: plan.weekly_unit_limit ?? '',
    sort_order: plan.sort_order ?? 0,
    tagline: plan.tagline || '',
    features: (plan.features || []).join('\n'),
    badge: plan.badge || '',
    highlight: !!plan.highlight,
    display_multiplier: plan.display_multiplier || '',
    is_active: plan.is_active !== false,
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onSave({
        name: f.name.trim(),
        price_krw: Number(f.price_krw) || 0,
        window_seconds: Number(f.window_seconds) || 18000,
        window_unit_limit: Number(f.window_unit_limit) || 0,
        weekly_unit_limit: f.weekly_unit_limit === '' ? null : Number(f.weekly_unit_limit),
        sort_order: Number(f.sort_order) || 0,
        tagline: f.tagline.trim(),
        features: f.features.split('\n').map((s) => s.trim()).filter(Boolean),
        badge: f.badge.trim() || null,
        highlight: !!f.highlight,
        display_multiplier: f.display_multiplier.trim() || null,
        is_active: !!f.is_active,
      });
      onClose();
    } catch (e) {
      alert(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CreditCard size={20} weight="fill" className="text-cyan-600" />
            {plan.name} <span className="font-mono text-xs text-slate-400">({plan.code})</span>
          </h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={18} weight="bold" /></button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-600">이름</span>
              <input type="text" value={f.name} onChange={(e) => set('name')(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" />
            </label>
            <NumberField label="월 구독료(원)" value={f.price_krw} onChange={set('price_krw')}
              hint={Number(f.price_krw) > 0 ? '⚠ PG 등록가 — 변경 시 재등록 필요' : '무료'} />
          </div>

          <NumberField label="주간 한도(units)" value={f.weekly_unit_limit} onChange={set('weekly_unit_limit')}
            hint={weeklyHint(f.weekly_unit_limit)} />
          <NumberField label="5시간 창 한도(units, 0=무제한)" value={f.window_unit_limit} onChange={set('window_unit_limit')}
            hint={windowHint(f.window_unit_limit)} />
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="창 길이(초)" value={f.window_seconds} onChange={set('window_seconds')} hint={`${Math.round((Number(f.window_seconds) || 0) / 3600)}시간`} />
            <NumberField label="정렬 순서" value={f.sort_order} onChange={set('sort_order')} />
          </div>

          <hr className="border-slate-100" />
          <label className="block">
            <span className="text-xs text-slate-600">한 줄 설명(tagline)</span>
            <input type="text" value={f.tagline} onChange={(e) => set('tagline')(e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-600">기능 불릿 <span className="text-slate-400">(줄당 1개)</span></span>
            <textarea value={f.features} onChange={(e) => set('features')(e.target.value)} rows={4}
              className="mt-1 w-full resize-y rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-600">배지(예: 가장 인기)</span>
              <input type="text" value={f.badge} onChange={(e) => set('badge')(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" />
            </label>
            <label className="block">
              <span className="text-xs text-slate-600">배수 라벨(예: 5x)</span>
              <input type="text" value={f.display_multiplier} onChange={(e) => set('display_multiplier')(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none" />
            </label>
          </div>
          <div className="flex gap-5">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={f.highlight} onChange={(e) => set('highlight')(e.target.checked)} /> 강조 카드
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={f.is_active} onChange={(e) => set('is_active')(e.target.checked)} /> 활성
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded border border-slate-200 bg-white px-4 py-1.5 text-sm">취소</button>
          <button type="button" onClick={submit} disabled={busy}
            className="rounded bg-cyan-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-cyan-600 disabled:opacity-50">
            {busy ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await billingApi.getPlans();
      setPlans(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <Link to="/admin/lessons" className="text-sm text-slate-500 hover:text-slate-900">← 콘텐츠 관리</Link>
        <CreditCard size={20} weight="fill" className="text-cyan-600" />
        <h1 className="text-base font-semibold text-slate-900">구독 플랜 관리</h1>
        <Link to="/admin/usage" className="ml-auto flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
          <ChartLine size={15} weight="bold" /> 사용량 분석
        </Link>
      </header>

      <main className="mx-auto max-w-3xl p-6">
        <p className="mb-4 text-sm text-slate-500">
          한도·가격·설명을 실시간 편집합니다(재배포 불필요). 저장 즉시 웹/앱에 반영돼요. 한도 옆 환산값은 Sonnet 원가 기준 추정이며,
          정확한 보정은 <Link to="/admin/usage" className="text-cyan-600 underline">사용량 분석</Link>의 실측 데이터를 보세요.
        </p>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-400">불러오는 중…</p>
        ) : error ? (
          <p className="py-12 text-center text-sm text-red-500">{error}</p>
        ) : (
          <ul className="space-y-3">
            {plans.map((p) => (
              <li key={p.id} className={`rounded-lg border bg-white p-4 ${p.highlight ? 'border-cyan-300 ring-1 ring-cyan-100' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-slate-900">
                      {p.name}
                      <span className="font-mono text-xs text-slate-400">{p.code}</span>
                      {p.badge ? <span className="rounded bg-cyan-50 px-2 py-0.5 text-[11px] text-cyan-700">{p.badge}</span> : null}
                      {p.display_multiplier ? <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{p.display_multiplier}</span> : null}
                      {p.is_active === false ? <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] text-red-600">비활성</span> : null}
                    </p>
                    <p className="text-xs text-slate-500">{p.tagline}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm font-semibold text-slate-900">{p.price_krw > 0 ? fmtKRW(p.price_krw) + ' / 월' : '무료'}</p>
                    <button type="button" onClick={() => setEditing(p)}
                      className="mt-1 rounded border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50">편집</button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <span>주간: <b className="text-slate-700">{Number(p.weekly_unit_limit || 0).toLocaleString()}</b> · {weeklyHint(p.weekly_unit_limit)}</span>
                  <span>5h창: <b className="text-slate-700">{Number(p.window_unit_limit || 0).toLocaleString()}</b> · {windowHint(p.window_unit_limit)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {editing && (
        <PlanEditModal
          plan={editing}
          onSave={async (data) => { await billingApi.updatePlan(editing.id, data); await load(); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default AdminPlans;
