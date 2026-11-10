"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import storeConfig from "../../config/store";

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState("admin@chutneytubes.in");
  const [passwordInput, setPasswordInput] = useState("");
  const [token, setToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [includeInternal, setIncludeInternal] = useState(false);

  // Search state for feedback
  const [feedbackSearch, setFeedbackSearch] = useState("");

  // Data
  const [metrics, setMetrics] = useState<any>(null);

  // Check stored session
  useEffect(() => {
    const saved = sessionStorage.getItem("ct_admin_auth");
    if (saved) {
      setToken(saved);
      setIsAuthenticated(true);
      fetchMetrics(saved);
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
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setToken(data.token);
        sessionStorage.setItem("ct_admin_auth", data.token);
        fetchMetrics(data.token);
      } else {
        setErrorMsg(data.error || "Invalid credentials. Default: chutney2026");
      }
    } catch (err: any) {
      setErrorMsg("Connection error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async (authToken = token) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("token", authToken);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (selectedCampaign) params.set("campaign", selectedCampaign);
      if (includeInternal) params.set("includeInternal", "true");

      const res = await fetch(`/api/admin/metrics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      } else {
        setIsAuthenticated(false);
        sessionStorage.removeItem("ct_admin_auth");
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
    sessionStorage.removeItem("ct_admin_auth");
  };

  // Re-fetch when filters change
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchMetrics(token);
    }
  }, [startDate, endDate, selectedCampaign, includeInternal]);

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f4f3ec] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 border border-[#d8dcd4] shadow-2xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#134a28] text-[#f2b81d] flex items-center justify-center font-heading font-black text-2xl mx-auto shadow-md">
              📊
            </div>
            <h1 className="font-heading font-black text-2xl text-[#18241b]">
              Demand Test Admin
            </h1>
            <p className="text-xs text-[#57534e]">
              Sign in to access real-time purchase intent metrics for {storeConfig.brand.name}.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#18241b] mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#18241b] mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#d8dcd4] bg-[#f4f3ec] focus:bg-white font-mono"
              />
              <span className="text-[10px] text-[#57534e] mt-1 block">Default: chutney2026</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#134a28] hover:bg-[#18241b] text-white font-heading font-black text-sm py-3 rounded-xl shadow transition disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Unlock Dashboard"}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-[#57534e] hover:underline">
              ← Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered feedback
  const filteredFeedback = metrics?.stoppedAnswers?.filter((a: any) =>
    a.text.toLowerCase().includes(feedbackSearch.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-[#f4f3ec] text-[#18241b]">
      {/* Top Navbar */}
      <header className="bg-[#134a28] text-white py-4 px-4 sm:px-8 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-heading font-black text-xl text-[#f2b81d]">
              {storeConfig.brand.name}
            </span>
            <span className="text-[10px] uppercase font-bold bg-[#f2b81d] text-[#18241b] px-2.5 py-0.5 rounded-full font-heading">
              Live Demand Dashboard
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Export Events CSV */}
            <a
              href={`/api/export?token=${token}`}
              download
              className="bg-[#18241b] hover:bg-black text-[#f2b81d] font-heading font-bold px-3.5 py-2 rounded-xl transition"
            >
              📥 Export Events CSV
            </a>

            {/* Export Signups CSV */}
            <a
              href={`/api/export?token=${token}&type=signups`}
              download
              className="bg-[#f2b81d] hover:bg-[#e2a80d] text-[#18241b] font-heading font-bold px-3.5 py-2 rounded-xl transition"
            >
              ✉️ Export Sign-ups CSV
            </a>

            <button
              onClick={() => fetchMetrics(token)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 rounded-xl transition"
            >
              ↻ Refresh
            </button>

            <button onClick={handleLogout} className="text-xs text-red-300 font-bold hover:underline ml-2">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* FILTER BAR: Date Range, Campaign, Internal Visits Toggle */}
      <section className="bg-white border-b border-[#d8dcd4] py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4 text-xs font-bold text-[#18241b]">
          <div className="flex items-center space-x-2">
            <span className="text-[#57534e]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#d8dcd4] bg-[#f4f3ec] text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[#57534e]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#d8dcd4] bg-[#f4f3ec] text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[#57534e]">Campaign:</span>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#d8dcd4] bg-[#f4f3ec] text-xs"
            >
              <option value="all">All Campaigns &amp; Sources</option>
              {metrics?.campaignTable?.map((c: any) => (
                <option key={c.campaign} value={c.campaign}>
                  {c.campaign}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            <label className="flex items-center space-x-2 cursor-pointer bg-[#f4f3ec] px-3 py-1.5 rounded-lg border border-[#d8dcd4]">
              <input
                type="checkbox"
                checked={includeInternal}
                onChange={(e) => setIncludeInternal(e.target.checked)}
                className="rounded text-[#1d6b3a]"
              />
              <span className="text-xs font-bold">Include internal visits (/?admin=1)</span>
            </label>
          </div>
        </div>
      </section>

      {/* DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {loading && !metrics && (
          <div className="text-center py-16 text-sm text-[#57534e]">
            Loading real-time demand metrics...
          </div>
        )}

        {metrics && (
          <>
            {/* 1. KPI TILES */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm">
                <span className="text-xs font-bold text-[#57534e] block">Total Visitors</span>
                <span className="font-heading font-black text-3xl text-[#18241b]">
                  {metrics.kpis.visitors}
                </span>
                <span className="text-[10px] text-[#57534e] block mt-1">Unique visitor IDs</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm">
                <span className="text-xs font-bold text-[#57534e] block">Added to Cart %</span>
                <span className="font-heading font-black text-3xl text-[#1d6b3a]">
                  {metrics.kpis.addedToCartPct}
                </span>
                <span className="text-[10px] text-[#57534e] block mt-1">Explored products &amp; packs</span>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm">
                <span className="text-xs font-bold text-[#57534e] block">Started Checkout %</span>
                <span className="font-heading font-black text-3xl text-[#18241b]">
                  {metrics.kpis.startedCheckoutPct}
                </span>
                <span className="text-[10px] text-[#57534e] block mt-1">Entered delivery info</span>
              </div>

              <div className="bg-[#134a28] text-white rounded-2xl p-5 border-2 border-[#f2b81d] shadow-md">
                <span className="text-xs font-bold text-[#f2b81d] block">Pressed Pay % 🔥</span>
                <span className="font-heading font-black text-3xl text-white">
                  {metrics.kpis.pressedPayPct}
                </span>
                <span className="text-[10px] text-white/70 block mt-1">True purchase intent confirmed</span>
              </div>

              <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-5 border border-[#d8dcd4] shadow-sm">
                <span className="text-xs font-bold text-[#57534e] block">Launch Sign-ups</span>
                <span className="font-heading font-black text-3xl text-[#c8361f]">
                  {metrics.kpis.launchSignups}
                </span>
                <span className="text-[10px] text-[#57534e] block mt-1">Discount opt-in leads</span>
              </div>
            </div>

            {/* 2. FUNNEL CHART WITH DROP-OFF % */}
            <div className="bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-heading font-black text-lg text-[#18241b]">
                    Demand Test Funnel Progression
                  </h2>
                  <p className="text-xs text-[#57534e]">Drop-off percentages between each simulated step.</p>
                </div>
                <span className="text-xs font-bold text-[#57534e]">
                  Events Processed: {metrics.totalEventsCount}
                </span>
              </div>

              <div className="space-y-4">
                {metrics.funnel.map((step: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-heading font-bold text-[#18241b]">
                        {idx + 1}. {step.step}
                      </span>
                      <div className="space-x-3">
                        <span className="font-heading font-black text-[#18241b]">{step.count} users</span>
                        <span className="font-bold text-[#1d6b3a]">({step.pctOfTotal}%)</span>
                        {idx > 0 && (
                          <span className="text-xs text-[#c8361f] font-semibold">
                            Drop: {step.dropoffPct}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-4 bg-[#f4f3ec] rounded-full overflow-hidden border border-[#d8dcd4]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 4 ? "bg-[#f2b81d]" : "bg-[#1d6b3a]"
                        }`}
                        style={{ width: `${Math.max(step.pctOfTotal, 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. TABLE BY PRICE VARIANT & CAMPAIGN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Variant Table */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-black text-base text-[#18241b]">
                    Price Variant Performance (A/B/C)
                  </h3>
                  {metrics.bestVariant && (
                    <span className="bg-[#f2b81d] text-[#18241b] text-[10px] font-heading font-black px-2.5 py-0.5 rounded-full">
                      Best Pay Rate: Variant {metrics.bestVariant}
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#d8dcd4] text-[#57534e] uppercase text-[10px] font-heading font-bold">
                        <th className="py-2.5 px-3">Variant</th>
                        <th className="py-2.5 px-3">Prices</th>
                        <th className="py-2.5 px-3">Visitors</th>
                        <th className="py-2.5 px-3">Added</th>
                        <th className="py-2.5 px-3">Pay Clicked</th>
                        <th className="py-2.5 px-3">Pay Rate</th>
                        <th className="py-2.5 px-3">AOV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d8dcd4]">
                      {metrics.variantTable.map((v: any) => {
                        const isBest = v.variant === metrics.bestVariant;
                        return (
                          <tr key={v.variant} className={isBest ? "bg-[#f2b81d]/15 font-bold" : "hover:bg-[#f4f3ec]"}>
                            <td className="py-3 px-3 font-heading font-bold">
                              Variant {v.variant} {isBest && "⭐"}
                            </td>
                            <td className="py-3 px-3 text-[#57534e]">{v.priceInfo}</td>
                            <td className="py-3 px-3">{v.visitors}</td>
                            <td className="py-3 px-3">{v.added}</td>
                            <td className="py-3 px-3 font-bold text-[#1d6b3a]">{v.pay}</td>
                            <td className="py-3 px-3 font-heading font-black text-[#134a28]">
                              {v.payRate}
                            </td>
                            <td className="py-3 px-3">{v.aov}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Campaign Table */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
                <h3 className="font-heading font-black text-base text-[#18241b]">
                  Campaign &amp; Traffic Channels
                </h3>
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {metrics.campaignTable.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#57534e]">No campaign traffic logged.</div>
                  ) : (
                    metrics.campaignTable.map((c: any) => (
                      <div key={c.campaign} className="p-3 bg-[#f4f3ec] rounded-xl border border-[#d8dcd4] flex justify-between items-center text-xs">
                        <div>
                          <strong className="block text-[#18241b] capitalize font-heading">{c.campaign}</strong>
                          <span className="text-[10px] text-[#57534e]">{c.visitors} visitors · AOV {c.aov}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-heading font-black text-sm text-[#1d6b3a]">{c.payRate}</span>
                          <span className="text-[10px] text-[#57534e] block">{c.pay} pay clicks</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 4. "HOW PEOPLE FEEL ABOUT CHUTNEY IN A TUBE" (Pay-Pressers vs Everyone) */}
            <div className="bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
              <h3 className="font-heading font-black text-base text-[#18241b]">
                How People Feel About Chutney in a Tube
              </h3>
              <p className="text-xs text-[#57534e]">
                Comparing reactions from visitors who clicked Pay vs all respondents.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {Object.keys(metrics.tubeFeelings.everyone).map((feeling) => {
                  const evCount = metrics.tubeFeelings.everyone[feeling] || 0;
                  const payCount = metrics.tubeFeelings.payPressers[feeling] || 0;
                  return (
                    <div key={feeling} className="p-3 bg-[#f4f3ec] rounded-xl border border-[#d8dcd4] space-y-1">
                      <div className="flex justify-between text-xs font-bold text-[#18241b]">
                        <span>{feeling}</span>
                        <span>Total: {evCount}</span>
                      </div>
                      <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-[#d8dcd4]">
                        <div
                          className="h-full bg-[#1d6b3a]"
                          style={{ width: `${Math.min(evCount * 20, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#134a28] font-semibold block">
                        Of which {payCount} committed to Pay
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. FLAVOUR DEMAND & PACK MIX */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Flavour Demand Table */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
                <h3 className="font-heading font-black text-base text-[#18241b]">
                  Flavour Demand (Tubes in Orders Where Pay Was Pressed)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#d8dcd4] text-[#57534e] uppercase text-[10px] font-heading font-bold">
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Flavour</th>
                        <th className="py-2.5 px-3 font-black text-[#1d6b3a]">Ordered Tubes</th>
                        <th className="py-2.5 px-3">Cart Adds</th>
                        <th className="py-2.5 px-3">Views</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d8dcd4]">
                      {metrics.sortedFlavours.map((f: any, idx: number) => (
                        <tr key={f.id} className="hover:bg-[#f4f3ec]">
                          <td className="py-2.5 px-3 font-bold text-[#57534e]">#{idx + 1}</td>
                          <td className="py-2.5 px-3 font-heading font-bold">
                            {f.name} <span className="text-[10px] text-[#57534e]">({f.local})</span>
                          </td>
                          <td className="py-2.5 px-3 font-heading font-black text-sm text-[#1d6b3a]">
                            {f.orderedTubes}
                          </td>
                          <td className="py-2.5 px-3">{f.cartAdds}</td>
                          <td className="py-2.5 px-3 text-[#57534e]">{f.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pack Mix */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
                <h3 className="font-heading font-black text-base text-[#18241b]">Pack Mix Preference</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#f4f3ec] rounded-xl flex justify-between items-center">
                    <span className="font-bold">Single Tube</span>
                    <span className="font-heading font-black text-base text-[#18241b]">{metrics.packMix.single}</span>
                  </div>
                  <div className="p-3 bg-[#f4f3ec] rounded-xl flex justify-between items-center">
                    <span className="font-bold">Chaat Combo</span>
                    <span className="font-heading font-black text-base text-[#18241b]">{metrics.packMix.combo}</span>
                  </div>
                  <div className="p-3 bg-[#f2b81d]/20 rounded-xl flex justify-between items-center border border-[#f2b81d]">
                    <span className="font-bold">Pick Any 3 (Bundle)</span>
                    <span className="font-heading font-black text-base text-[#134a28]">{metrics.packMix.pick3}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#d8dcd4]">
                  <h4 className="font-heading font-bold text-xs uppercase text-[#57534e] mb-2">Usage Frequency</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {Object.keys(metrics.frequencyCounts).map((freq) => (
                      <div key={freq} className="bg-[#f4f3ec] p-2 rounded-lg">
                        <span className="text-[#57534e] block">{freq}</span>
                        <strong className="text-sm font-heading">{metrics.frequencyCounts[freq]}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. ORDERS BY POSTAL ZONE */}
            <div className="bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
              <h3 className="font-heading font-black text-base text-[#18241b]">
                Orders by Indian Postal Zone
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.keys(metrics.zoneCounts).map((zName) => (
                  <div key={zName} className="p-3 bg-[#f4f3ec] rounded-xl border border-[#d8dcd4]">
                    <span className="text-xs font-bold text-[#18241b] block line-clamp-1">{zName}</span>
                    <span className="font-heading font-black text-xl text-[#1d6b3a]">
                      {metrics.zoneCounts[zName]} orders
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. "WHAT ALMOST STOPPED YOU" SEARCHABLE LIST & REQUESTED CHUTNEYS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Feedback */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-heading font-black text-base text-[#18241b]">
                    What Almost Stopped You? ({metrics.stoppedAnswers.length})
                  </h3>
                  <input
                    type="text"
                    placeholder="Search answers..."
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[#d8dcd4] bg-[#f4f3ec]"
                  />
                </div>

                <div className="divide-y divide-[#d8dcd4] max-h-80 overflow-y-auto pr-1">
                  {filteredFeedback.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#57534e]">No feedback found.</div>
                  ) : (
                    filteredFeedback.map((item: any, idx: number) => (
                      <div key={idx} className="py-2.5 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-[#57534e]">
                          <span>{item.visitorId} · Variant {item.variant.toUpperCase()}</span>
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-medium text-[#18241b] bg-[#f4f3ec] p-2.5 rounded-xl border border-[#d8dcd4]">
                          &ldquo;{item.text}&rdquo;
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Requested Chutneys */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
                <h3 className="font-heading font-black text-base text-[#18241b]">
                  Chutneys Customers Want Most
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {metrics.rankedRequests.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#57534e]">No custom chutney requests yet.</div>
                  ) : (
                    metrics.rankedRequests.map((r: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#f4f3ec] rounded-xl border border-[#d8dcd4] flex justify-between items-center text-xs">
                        <div>
                          <strong className="block text-[#18241b] font-heading">{r.name}</strong>
                          {r.region && <span className="text-[10px] text-[#57534e]">Region: {r.region}</span>}
                        </div>
                        <span className="font-heading font-black text-sm bg-[#134a28] text-white px-2.5 py-1 rounded-full">
                          {r.count} votes
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 8. LAUNCH SIGN-UPS LIST */}
            <div className="bg-white rounded-3xl p-6 border border-[#d8dcd4] shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-black text-base text-[#18241b]">
                  Launch Sign-up Emails ({metrics.signupsList.length})
                </h3>
                <a
                  href={`/api/export?token=${token}&type=signups`}
                  download
                  className="text-xs font-heading font-bold text-[#1d6b3a] underline"
                >
                  Download CSV
                </a>
              </div>

              <div className="divide-y divide-[#d8dcd4] max-h-60 overflow-y-auto text-xs">
                {metrics.signupsList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#57534e]">No email opt-ins recorded yet.</div>
                ) : (
                  metrics.signupsList.map((s: any, idx: number) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <span className="font-bold text-[#18241b]">{s.email}</span>
                      <div className="space-x-3 text-[11px] text-[#57534e]">
                        <span>Campaign: {s.utm_campaign}</span>
                        <span>Variant {s.variant.toUpperCase()}</span>
                        <span>{new Date(s.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
