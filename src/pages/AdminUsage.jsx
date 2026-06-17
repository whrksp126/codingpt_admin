import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartLine, CreditCard } from '@phosphor-icons/react';
import * as billingApi from '../utils/billingApi';

const KRW_PER_USD = 1380;
const fmtUSD = (n) => '$' + (Number(n) || 0).toFixed(2);
const fmtKRW = (n) => '₩' + Math.round(n).toLocaleString('ko-KR');
const fmtN = (n) => Number(n || 0).toLocaleString();

const Card = ({ label, value, sub }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    {sub ? <p className="text-xs text-slate-400">{sub}</p> : null}
  </div>
);

const AdminUsage = () => {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (d) => {
    setLoading(true);
    try {
      setData(await billingApi.getUsageSummary(d));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(days); }, [days]);

  const o = data?.overall;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <Link to="/admin/lessons" className="text-sm text-slate-500 hover:text-slate-900">← 콘텐츠 관리</Link>
        <ChartLine size={20} weight="fill" className="text-cyan-600" />
        <h1 className="text-base font-semibold text-slate-900">사용량 분석 (실측)</h1>
        <div className="ml-auto flex items-center gap-2">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-cyan-500 focus:outline-none">
            <option value={7}>최근 7일</option>
            <option value={14}>최근 14일</option>
            <option value={30}>최근 30일</option>
          </select>
          <Link to="/admin/plans" className="flex items-center gap-1 rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            <CreditCard size={15} weight="bold" /> 플랜 조절
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6">
        <p className="mb-4 text-sm text-slate-500">
          실제 소비 데이터입니다. 여기 "턴당 평균"·"유저별 주간 units"를 보고 <Link to="/admin/plans" className="text-cyan-600 underline">플랜 조절</Link>에서 한도를 보정하세요.
          {data ? <> 차단 적용: <b className={data.enforced ? 'text-emerald-600' : 'text-amber-600'}>{data.enforced ? 'ON' : 'OFF(표시만)'}</b></> : null}
        </p>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-400">불러오는 중…</p>
        ) : error ? (
          <p className="py-12 text-center text-sm text-red-500">{error}</p>
        ) : !o ? null : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card label="총 턴" value={fmtN(o.turns)} sub={`활성 ${fmtN(o.activeUsers)}명`} />
              <Card label="총 원가" value={fmtUSD(o.costUsd)} sub={fmtKRW(o.costUsd * KRW_PER_USD)} />
              <Card label="턴당 평균 원가" value={fmtUSD(o.avgCostPerTurn)} sub={`${fmtN(o.avgUnitsPerTurn)} units`} />
              <Card label="총 units" value={fmtN(o.units)} />
            </div>

            <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">플랜별</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr><th className="px-3 py-2">플랜</th><th className="px-3 py-2">유저</th><th className="px-3 py-2">턴</th><th className="px-3 py-2">units</th><th className="px-3 py-2">원가</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.byPlan.map((r) => (
                    <tr key={r.planCode}>
                      <td className="px-3 py-2 font-mono">{r.planCode}</td>
                      <td className="px-3 py-2">{fmtN(r.users)}</td>
                      <td className="px-3 py-2">{fmtN(r.turns)}</td>
                      <td className="px-3 py-2">{fmtN(r.units)}</td>
                      <td className="px-3 py-2">{fmtUSD(r.costUsd)}</td>
                    </tr>
                  ))}
                  {data.byPlan.length === 0 ? <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">데이터 없음</td></tr> : null}
                </tbody>
              </table>
            </div>

            <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">사용자 상위 (units 순)</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr><th className="px-3 py-2">이메일</th><th className="px-3 py-2">플랜</th><th className="px-3 py-2">턴</th><th className="px-3 py-2">units</th><th className="px-3 py-2">주간 units</th><th className="px-3 py-2">원가</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topUsers.map((r) => (
                    <tr key={r.userId}>
                      <td className="max-w-[200px] truncate px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.planCode}</td>
                      <td className="px-3 py-2">{fmtN(r.turns)}</td>
                      <td className="px-3 py-2">{fmtN(r.units)}</td>
                      <td className="px-3 py-2">{fmtN(r.weeklyUnits)}</td>
                      <td className="px-3 py-2">{fmtUSD(r.costUsd)}</td>
                    </tr>
                  ))}
                  {data.topUsers.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">데이터 없음</td></tr> : null}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminUsage;
