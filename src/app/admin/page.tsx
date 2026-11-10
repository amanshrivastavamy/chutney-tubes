"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { storeConfig } from "../../config/store";

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [includeInternal, setIncludeInternal] = useState(false);

  // Search state for feedback
  const [feedbackSearch, setFeedbackSearch] = useState("");

  // Metrics Data
  const [metrics, setMetrics] = useState<any>(null);

  // Check existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setPasswordInput("");
        fetchMetrics();
      } else {
        setErrorMsg(data.error || "Incorrect admin password");
      }
    } catch (err: any) {
      setErrorMsg("Connection error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (selectedCampaign) params.set("campaign", selectedCampaign);
      if (includeInternal) params.set("includeInternal", "true");

      const res = await fetch(`/api/admin/metrics?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch (e) {}
    setIsAuthenticated(false);
    setMetrics(null);
  };

  // Re-fetch when filters change
  useEffect(() => {
    if (isAuthenticated) {
      fetchMetrics();
    }
  }, [startDate, endDate, selectedCampaign, includeInternal]);

  const filteredFeedback = (metrics?.stoppedAnswers || []).filter((item: any) => {
    if (!feedbackSearch.trim()) return true;
    return (item.text || "").toLowerCase().includes(feedbackSearch.trim().toLowerCase());
  });

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4 text-ink">
        <div className="bg-card rounded-3xl p-8 border border-steel shadow-2xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-deepLeaf text-haldi flex items-center justify-center font-heading font-black text-2xl mx-auto shadow-md">
              <svg aria-hidden="true" className="w-6 h-6 text-haldi" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </div>
            <h1 className="font-heading font-black text-2xl text-ink">
              Demand Test Admin
            </h1>
            <p className="text-xs text-muted">
              Enter your password to access real-time purchase intent metrics for {storeConfig.brand.name}.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter admin password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-steel bg-paper focus:bg-card focus:border-leaf transition-colors font-mono"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-paper-2 border border-mirch rounded-xl text-xs text-mirch font-bold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-deepLeaf hover:bg-ink text-paper font-heading font-black text-sm py-3 rounded-xl shadow transition-colors disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Unlock Dashboard"}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-muted hover:underline">
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* Top Admin Nav */}
      <header className="bg-deepLeaf text-paper px-4 sm:px-8 py-3.5 border-b border-ink sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-heading font-black text-xl text-haldi">
                {storeConfig.brand.name}
              </span>
              <span className="text-xs bg-ink/80 text-haldi font-bold px-2 py-0.5 rounded-full border border-haldi/30">
                Admin Panel
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2.5 text-xs">
            <a
              href="/api/export?type=events"
              download
              className="bg-ink hover:bg-black text-haldi font-heading font-bold px-3.5 py-2 rounded-xl transition-colors inline-flex items-center space-x-1.5"
            >
              <span>Export Events CSV</span>
            </a>

            <a
              href="/api/export?type=signups"
              download
              className="bg-haldi hover:bg-haldi/90 text-ink font-heading font-bold px-3.5 py-2 rounded-xl transition-colors inline-flex items-center space-x-1.5"
            >
              <span>Export Sign-ups CSV</span>
            </a>

            <button
              onClick={fetchMetrics}
              className="bg-card/10 hover:bg-card/20 text-paper font-bold px-3 py-2 rounded-xl transition-colors"
            >
              Refresh
            </button>

            <button onClick={handleLogout} className="text-xs text-mirch font-bold hover:underline ml-2">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* FILTER BAR: Date Range, Campaign, Internal Visits Toggle */}
      <section className="bg-card border-b border-steel py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4 text-xs font-bold text-ink">
          <div className="flex items-center space-x-2">
            <span className="text-muted">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-steel bg-paper text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-muted">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-steel bg-paper text-xs"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-muted">Campaign:</span>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-steel bg-paper text-xs"
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
            <label className="flex items-center space-x-2 cursor-pointer bg-paper px-3 py-1.5 rounded-lg border border-steel">
              <input
                type="checkbox"
                checked={includeInternal}
                onChange={(e) => setIncludeInternal(e.target.checked)}
                className="rounded text-leaf focus:ring-leaf"
              />
              <span className="text-xs font-bold">Include internal visits (/?admin=1)</span>
            </label>
          </div>
        </div>
      </section>

      {/* DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 flex-1 w-full">
        {loading && !metrics && (
          <div className="text-center py-16 text-sm text-muted">
            Loading real-time demand metrics...
          </div>
        )}

        {metrics && (
          <>
            {/* 1. KPI TILES */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-card rounded-2xl p-5 border border-steel shadow-sm">
                <span className="text-xs font-bold text-muted block">Total Visitors</span>
                <span className="font-heading font-black text-3xl text-ink">
                  {metrics.kpis.visitors}
                </span>
                <span className="text-[10px] text-muted block mt-1">Unique visitor IDs</span>
              </div>

              <div className="bg-card rounded-2xl p-5 border border-steel shadow-sm">
                <span className="text-xs font-bold text-muted block">Added to Cart %</span>
                <span className="font-heading font-black text-3xl text-leaf">
                  {metrics.kpis.addedToCartPct}
                </span>
                <span className="text-[10px] text-muted block mt-1">Explored products &amp; packs</span>
              </div>

              <div className="bg-card rounded-2xl p-5 border border-steel shadow-sm">
                <span className="text-xs font-bold text-muted block">Started Checkout %</span>
                <span className="font-heading font-black text-3xl text-ink">
                  {metrics.kpis.startedCheckoutPct}
                </span>
                <span className="text-[10px] text-muted block mt-1">Entered delivery info</span>
              </div>

              <div className="bg-deepLeaf text-paper rounded-2xl p-5 border-2 border-haldi shadow-md">
                <span className="text-xs font-bold text-haldi block">Pressed Pay %</span>
                <span className="font-heading font-black text-3xl text-paper">
                  {metrics.kpis.pressedPayPct}
                </span>
                <span className="text-[10px] text-paper/70 block mt-1">True purchase intent confirmed</span>
              </div>

              <div className="col-span-2 lg:col-span-1 bg-card rounded-2xl p-5 border border-steel shadow-sm">
                <span className="text-xs font-bold text-muted block">Launch Sign-ups</span>
                <span className="font-heading font-black text-3xl text-mirch">
                  {metrics.kpis.launchSignups}
                </span>
                <span className="text-[10px] text-muted block mt-1">Discount opt-in leads</span>
              </div>
            </div>

            {/* 2. FUNNEL CHART WITH DROP-OFF % */}
            <div className="bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-heading font-black text-lg text-ink">
                    Demand Test Funnel Progression
                  </h2>
                  <p className="text-xs text-muted">Drop-off percentages between each simulated step.</p>
                </div>
                <span className="text-xs font-bold text-muted">
                  Events Processed: {metrics.totalEventsCount}
                </span>
              </div>

              <div className="space-y-4">
                {metrics.funnel.map((step: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-heading font-bold text-ink">
                        {idx + 1}. {step.step}
                      </span>
                      <div className="space-x-3">
                        <span className="font-heading font-black text-ink">{step.count} users</span>
                        <span className="font-bold text-leaf">({step.pctOfTotal}%)</span>
                        {idx > 0 && (
                          <span className="text-xs text-mirch font-semibold">
                            Drop: {step.dropoffPct}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-4 bg-paper rounded-full overflow-hidden border border-steel">
                      <div
                        className={`h-full rounded-full transition-colors duration-500 ${
                          idx === 3 ? "bg-haldi" : "bg-leaf"
                        }`}
                        style={{ width: `${Math.max(step.pctOfTotal, 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. TOP TUBES TABLE (Add-to-cart & Pay-click counts sorted high to low) */}
            <div className="bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-lg text-ink">
                    Top Tubes (Flavour Demand)
                  </h3>
                  <p className="text-xs text-muted">
                    Ranked by Pay Clicks (highest confirmed intent), followed by Add-to-Cart clicks.
                  </p>
                </div>
                <span className="bg-leaf/10 text-leaf font-bold text-xs px-3 py-1 rounded-full">
                  All tubes ₹99 · 100g
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-steel text-muted text-[10px] font-heading font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-3">Tube Flavour</th>
                      <th className="py-3 px-3 font-black text-deepLeaf">Pay Clicks</th>
                      <th className="py-3 px-3">Add to Cart Clicks</th>
                      <th className="py-3 px-3">Product Views</th>
                      <th className="py-3 px-3">Pay / Cart Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel">
                    {(metrics.topTubes || []).map((tube: any, idx: number) => {
                      const conversion =
                        tube.cartAdds > 0
                          ? ((tube.payClicks / tube.cartAdds) * 100).toFixed(1) + "%"
                          : "-";
                      return (
                        <tr key={tube.id} className="hover:bg-paper transition-colors">
                          <td className="py-3 px-3 font-heading font-bold text-muted">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-3 font-heading font-bold text-ink">
                            {tube.name}{" "}
                            {tube.hindi && (
                              <span className="text-[11px] text-muted font-normal">
                                ({tube.hindi})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-heading font-black text-sm text-leaf">
                            {tube.payClicks}
                          </td>
                          <td className="py-3 px-3 font-bold text-ink">{tube.cartAdds}</td>
                          <td className="py-3 px-3 text-muted">{tube.views}</td>
                          <td className="py-3 px-3 font-mono font-bold text-deepLeaf">
                            {conversion}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. SURVEY RESULTS: NEXT TUBE WANTED & TUBE FEELINGS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Which would you want in a tube next? */}
              <div className="lg:col-span-6 bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4">
                <h3 className="font-heading font-black text-base text-ink">
                  Which Tube Would Customers Want Next?
                </h3>
                <p className="text-xs text-muted">Post-checkout survey responses.</p>

                <div className="space-y-2.5">
                  {Object.keys(metrics.nextTubeWanted || {}).map((opt) => {
                    const count = metrics.nextTubeWanted[opt] || 0;
                    return (
                      <div key={opt} className="p-3 bg-paper rounded-xl border border-steel space-y-1">
                        <div className="flex justify-between text-xs font-bold text-ink">
                          <span>{opt}</span>
                          <span className="font-heading font-black text-leaf">{count} votes</span>
                        </div>
                        <div className="w-full h-2.5 bg-card rounded-full overflow-hidden border border-steel">
                          <div
                            className="h-full bg-haldi rounded-full"
                            style={{ width: `${Math.min(count * 20, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coming Soon Notify Me Clicks */}
              <div className="lg:col-span-6 bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4">
                <h3 className="font-heading font-black text-base text-ink">
                  Coming Soon &quot;Notify Me&quot; Clicks
                </h3>
                <p className="text-xs text-muted">Votes captured from Coming Soon product cards.</p>

                <div className="space-y-2.5">
                  {[
                    { id: "teekhi-lehsuni", name: "Teekhi Lehsuni Chutney" },
                    { id: "momo-chutney", name: "Momo Chutney" },
                    { id: "sweet-mango", name: "Sweet Mango Chutney" },
                  ].map((item) => {
                    const count = (metrics.notifyClicks && metrics.notifyClicks[item.id]) || 0;
                    return (
                      <div key={item.id} className="p-3.5 bg-paper rounded-xl border border-steel flex justify-between items-center text-xs">
                        <div>
                          <strong className="block text-ink font-heading text-sm">{item.name}</strong>
                          <span className="text-[10px] text-muted font-mono">{item.id}</span>
                        </div>
                        <span className="font-heading font-black text-base bg-deepLeaf text-paper px-3 py-1 rounded-full">
                          {count} alerts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. TRAFFIC CAMPAIGNS & HOW PEOPLE FEEL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4">
                <h3 className="font-heading font-black text-base text-ink">
                  How People Feel About Chutney in a Tube
                </h3>
                <p className="text-xs text-muted">
                  Comparing reactions from visitors who clicked Pay vs all respondents.
                </p>

                <div className="space-y-2.5">
                  {Object.keys(metrics.tubeFeelings.everyone).map((feeling) => {
                    const evCount = metrics.tubeFeelings.everyone[feeling] || 0;
                    const payCount = metrics.tubeFeelings.payPressers[feeling] || 0;
                    return (
                      <div key={feeling} className="p-3 bg-paper rounded-xl border border-steel space-y-1">
                        <div className="flex justify-between text-xs font-bold text-ink">
                          <span>{feeling}</span>
                          <span>Total: {evCount}</span>
                        </div>
                        <div className="w-full h-2.5 bg-card rounded-full overflow-hidden border border-steel">
                          <div
                            className="h-full bg-leaf rounded-full"
                            style={{ width: `${Math.min(evCount * 20, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-deepLeaf font-semibold block">
                          Of which {payCount} committed to Pay
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-6 bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4">
                <h3 className="font-heading font-black text-base text-ink">
                  Traffic Campaigns &amp; Sources
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {metrics.campaignTable.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted">No campaign traffic logged.</div>
                  ) : (
                    metrics.campaignTable.map((c: any) => (
                      <div key={c.campaign} className="p-3 bg-paper rounded-xl border border-steel flex justify-between items-center text-xs">
                        <div>
                          <strong className="block text-ink capitalize font-heading">{c.campaign}</strong>
                          <span className="text-[10px] text-muted">{c.visitors} visitors</span>
                        </div>
                        <div className="text-right">
                          <span className="font-heading font-black text-sm text-leaf">{c.payRate}</span>
                          <span className="text-[10px] text-muted block">{c.pay} pay clicks</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 6. WHAT ALMOST STOPPED YOU & SIGNUPS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-heading font-black text-base text-ink">
                    What Almost Stopped You? ({metrics.stoppedAnswers.length})
                  </h3>
                  <input
                    type="text"
                    placeholder="Search answers..."
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-steel bg-paper"
                  />
                </div>

                <div className="divide-y divide-steel max-h-80 overflow-y-auto pr-1">
                  {filteredFeedback.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted">No feedback found.</div>
                  ) : (
                    filteredFeedback.map((item: any, idx: number) => (
                      <div key={idx} className="py-2.5 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-muted">
                          <span>{item.visitorId}</span>
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-medium text-ink bg-paper p-2.5 rounded-xl border border-steel">
                          &ldquo;{item.text}&rdquo;
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 bg-card rounded-3xl p-6 border border-steel shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-heading font-black text-base text-ink">
                    Launch Sign-ups ({metrics.signupsList.length})
                  </h3>
                  <a
                    href="/api/export?type=signups"
                    download
                    className="text-xs font-heading font-bold text-leaf underline"
                  >
                    CSV
                  </a>
                </div>

                <div className="divide-y divide-steel max-h-80 overflow-y-auto text-xs">
                  {metrics.signupsList.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted">No email opt-ins recorded yet.</div>
                  ) : (
                    metrics.signupsList.map((s: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center">
                        <span className="font-bold text-ink">{s.email}</span>
                        <span className="text-[11px] text-muted">
                          {new Date(s.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
