"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import productConfig from "../../config/product.config";

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  // Check existing session
  useEffect(() => {
    const savedToken = sessionStorage.getItem("ct_admin_token");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchMetrics(savedToken);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setToken(data.token);
        sessionStorage.setItem("ct_admin_token", data.token);
        fetchMetrics(data.token);
      } else {
        setErrorMsg(data.error || "Incorrect password. Default: chutney2026");
      }
    } catch (err: any) {
      setErrorMsg("Failed to connect to server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?token=${authToken}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem("ct_admin_token");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken("");
    sessionStorage.removeItem("ct_admin_token");
  };

  // If not logged in, render login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 border border-[#E7E5E4] shadow-xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#C2410C] text-white flex items-center justify-center font-black text-xl mx-auto shadow-md">
              📊
            </div>
            <h1 className="text-2xl font-black text-[#1C1917]">
              Demand Test Admin
            </h1>
            <p className="text-xs text-[#57534E]">
              Protected dashboard for {productConfig.brand.name} purchase intent data.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1C1917] mb-1">
                Admin Access Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm px-4 py-3 rounded-xl border border-[#D6D3D1] bg-[#FAF7F2] focus:bg-white focus:border-[#C2410C] transition"
              />
              <span className="text-[10px] text-[#78716C] mt-1 block">
                Configured via ADMIN_PASSWORD (default: chutney2026)
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-black text-sm py-3.5 rounded-xl shadow transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Unlock Dashboard"}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-[#57534E] hover:underline">
              ← Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917]">
      {/* Top Admin Nav */}
      <header className="bg-white border-b border-[#E7E5E4] py-4 px-4 sm:px-8 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#C2410C] flex items-center justify-center text-white font-black text-sm">
              C
            </div>
            <div>
              <span className="font-extrabold text-base text-[#1C1917]">
                {productConfig.brand.name} Analytics
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-full">
                Pre-Launch Live Funnel
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href={`/api/export?token=${token}`}
              download
              className="bg-[#1C1917] hover:bg-[#292524] text-[#FEF3C7] text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center space-x-1.5"
            >
              <span>📥</span>
              <span>Export CSV</span>
            </a>

            <button
              onClick={() => fetchMetrics(token)}
              className="bg-[#FAF7F2] hover:bg-[#E7E5E4] text-[#1C1917] text-xs font-bold px-3 py-2 rounded-xl border border-[#D6D3D1] transition"
              title="Refresh metrics"
            >
              ↻ Refresh
            </button>

            <button
              onClick={handleLogout}
              className="text-xs text-red-600 font-bold hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {loading && !metrics && (
          <div className="text-center py-12 text-sm text-[#57534E]">
            Loading real-time demand metrics...
          </div>
        )}

        {metrics && (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
                <span className="text-xs text-[#57534E] font-medium block">Unique Visitors</span>
                <span className="text-2xl sm:text-3xl font-black text-[#1C1917]">
                  {metrics.overview.totalVisitors}
                </span>
                <span className="text-[10px] text-[#78716C] block mt-1">Landed on page</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
                <span className="text-xs text-[#57534E] font-medium block">Added to Cart</span>
                <span className="text-2xl sm:text-3xl font-black text-[#1C1917]">
                  {metrics.overview.totalAddToCart}
                </span>
                <span className="text-[10px] text-[#78716C] block mt-1">Clicked cart / buy</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
                <span className="text-xs text-[#57534E] font-medium block">Started Checkout</span>
                <span className="text-2xl sm:text-3xl font-black text-[#1C1917]">
                  {metrics.overview.totalCheckout}
                </span>
                <span className="text-[10px] text-[#78716C] block mt-1">Filled delivery info</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border-2 border-[#15803D] shadow-sm bg-[#F0FDF4]">
                <span className="text-xs text-[#15803D] font-bold block">Pay Clicked 🔥</span>
                <span className="text-2xl sm:text-3xl font-black text-[#15803D]">
                  {metrics.overview.totalPayClicked}
                </span>
                <span className="text-[10px] text-[#166534] block mt-1 font-semibold">True purchase intent</span>
              </div>

              <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-5 border border-[#E7E5E4] shadow-sm">
                <span className="text-xs text-[#57534E] font-medium block">Overall Conversion</span>
                <span className="text-2xl sm:text-3xl font-black text-[#C2410C]">
                  {metrics.overview.overallConversionRate}
                </span>
                <span className="text-[10px] text-[#78716C] block mt-1">Visitors → Pay Clicks</span>
              </div>
            </div>

            {/* Funnel Visualization */}
            <div className="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#1C1917]">
                    Demand Test Funnel
                  </h2>
                  <p className="text-xs text-[#57534E]">
                    Real user progression through the fake-door checkout flow.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#57534E]">
                  Total Events Logged: {metrics.overview.totalEvents}
                </span>
              </div>

              <div className="space-y-4">
                {metrics.funnel.map((step: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-extrabold text-[#1C1917]">{step.step}</span>
                      <div className="space-x-3">
                        <span className="font-black text-[#1C1917]">{step.count} users</span>
                        <span className="font-bold text-[#C2410C]">({step.pctOfTotal}%)</span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-4 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E7E5E4]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 3 ? "bg-[#15803D]" : "bg-[#C2410C]"
                        }`}
                        style={{ width: `${Math.max(step.pctOfTotal, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid: Price Variants & Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Price Variant A/B/C Breakdown */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
                <h3 className="font-black text-base text-[#1C1917]">
                  A/B/C Price Variant Breakdown
                </h3>
                <p className="text-xs text-[#57534E]">
                  Compare willingness-to-pay across introductory (₹99), standard (₹149), and premium (₹199) price points.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E7E5E4] text-[#57534E] uppercase font-bold text-[10px]">
                        <th className="py-2.5 px-3">Variant</th>
                        <th className="py-2.5 px-3">Price (Single / 3-Pack)</th>
                        <th className="py-2.5 px-3">Visitors</th>
                        <th className="py-2.5 px-3">Pay Clicks</th>
                        <th className="py-2.5 px-3">Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E5E4]">
                      {metrics.variantsSummary.map((v: any) => (
                        <tr key={v.variant} className="hover:bg-[#FAF7F2]">
                          <td className="py-3 px-3 font-bold text-[#1C1917]">
                            Variant {v.variant}
                          </td>
                          <td className="py-3 px-3 font-medium">
                            ₹{v.singlePrice} / ₹{v.packPrice}
                          </td>
                          <td className="py-3 px-3 text-[#57534E]">{v.visitors}</td>
                          <td className="py-3 px-3 font-bold text-[#15803D]">{v.payClicks}</td>
                          <td className="py-3 px-3 font-extrabold text-[#C2410C]">{v.conversionRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Traffic Source Breakdown */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
                <h3 className="font-black text-base text-[#1C1917]">
                  Traffic Sources (?src=)
                </h3>
                <p className="text-xs text-[#57534E]">
                  Conversion performance by channel (WhatsApp, Instagram, Office Slack, etc.)
                </p>

                <div className="space-y-2.5">
                  {metrics.sourcesSummary.length === 0 ? (
                    <div className="text-xs text-[#78716C] py-4 text-center">No source traffic logged yet.</div>
                  ) : (
                    metrics.sourcesSummary.map((s: any) => (
                      <div key={s.source} className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-xl border border-[#E7E5E4] text-xs">
                        <span className="font-bold text-[#1C1917] capitalize">{s.source}</span>
                        <div className="space-x-3 text-right">
                          <span className="text-[#57534E]">{s.visitors} vis</span>
                          <span className="font-bold text-[#15803D]">{s.payClicks} pays</span>
                          <span className="font-extrabold text-[#C2410C]">({s.conversionRate})</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Flavour & Pack Popularity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Flavours */}
              <div className="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
                <h3 className="font-black text-base text-[#1C1917]">
                  Flavour Selection Popularity
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">🌿 Mint-Coriander (Hari Chutney)</span>
                    <span className="font-black text-[#1C1917]">{metrics.flavourCounts["mint-coriander"]} adds</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">🌶️ Garlic-Chilli (Spicy)</span>
                    <span className="font-black text-[#1C1917]">{metrics.flavourCounts["garlic-chilli"]} adds</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">✨ Tamarind (Imli Sweet &amp; Tangy)</span>
                    <span className="font-black text-[#1C1917]">{metrics.flavourCounts["tamarind"]} adds</span>
                  </div>
                </div>
              </div>

              {/* Pack Preference */}
              <div className="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
                <h3 className="font-black text-base text-[#1C1917]">
                  Pack Option Preference
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">Single Tube (150g)</span>
                    <span className="font-black text-[#1C1917]">{metrics.packCounts.single} adds</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">3-Flavour Variety Pack</span>
                    <span className="font-black text-[#C2410C]">{metrics.packCounts.three_pack} adds</span>
                  </div>
                  <div className="pt-2 border-t border-[#E7E5E4] flex justify-between items-center text-xs text-[#57534E]">
                    <span>Pincode Checks:</span>
                    <span>{metrics.pincodeStats.deliverable} in-area / {metrics.pincodeStats.outOfArea} out-of-area</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Voice of Customer: "What Almost Stopped You From Buying?" */}
            <div className="bg-white rounded-3xl p-6 border border-[#E7E5E4] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-[#1C1917]">
                    Voice of Customer: What Almost Stopped You?
                  </h3>
                  <p className="text-xs text-[#57534E]">
                    Direct qualitative answers from visitors at the honest reveal screen.
                  </p>
                </div>
                <span className="text-xs font-bold bg-[#FEF3C7] text-[#78350F] px-3 py-1 rounded-full">
                  {metrics.surveyResponses.length} Responses
                </span>
              </div>

              {metrics.surveyResponses.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#78716C]">
                  No feedback answers submitted yet.
                </div>
              ) : (
                <div className="divide-y divide-[#E7E5E4] max-h-96 overflow-y-auto">
                  {metrics.surveyResponses.map((res: any, idx: number) => (
                    <div key={idx} className="py-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                        <span>Visitor: {res.visitorId}</span>
                        <span>{new Date(res.timestamp).toLocaleString()}</span>
                      </div>
                      {res.feedback && (
                        <p className="text-xs font-medium text-[#1C1917] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E7E5E4]">
                          &ldquo;{res.feedback}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-[#57534E]">
                        {res.frequency && (
                          <span className="bg-[#E7E5E4] px-2 py-0.5 rounded font-bold">
                            Frequency: {res.frequency}
                          </span>
                        )}
                        {res.optInDiscount && (
                          <span className="bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded font-bold">
                            ✓ Opted-in for 20% discount
                          </span>
                        )}
                        {res.contact && (
                          <span className="text-[#78350F]">Contact: {res.contact}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
