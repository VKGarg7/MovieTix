import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { SparklesIcon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon, FilmIcon } from "lucide-react";

const buildInsights = ({ dashboardData, analytics, currency }) => {
  const insights = [];

  if (dashboardData?.yesterdayRevenue > 0) {
    const change = ((dashboardData.todayRevenue - dashboardData.yesterdayRevenue) / dashboardData.yesterdayRevenue) * 100;
    if (Math.abs(change) >= 5) {
      insights.push({
        icon: change >= 0 ? TrendingUpIcon : TrendingDownIcon,
        tone: change >= 0 ? "cyan" : "primary",
        text: `Revenue is ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(0)}% vs. yesterday (${currency}${dashboardData.todayRevenue.toLocaleString()} today).`,
      });
    }
  }

  if (analytics?.topMovies?.length > 0) {
    const top = analytics.topMovies[0];
    const share = analytics.topMovies.reduce((s, m) => s + m.revenue, 0);
    const pct = share > 0 ? (top.revenue / share) * 100 : 0;
    insights.push({
      icon: FilmIcon,
      tone: "violet",
      text: `"${top.title}" is your top performer, driving ${pct.toFixed(0)}% of tracked revenue (${currency}${top.revenue.toLocaleString()}).`,
    });
  }

  if (analytics?.occupancyByShow?.length > 0) {
    const lowOccupancy = analytics.occupancyByShow.filter((s) => s.occupancyPct < 25);
    if (lowOccupancy.length > 0) {
      insights.push({
        icon: AlertTriangleIcon,
        tone: "primary",
        text: `${lowOccupancy.length} show${lowOccupancy.length === 1 ? "" : "s"} running below 25% occupancy — consider adjusting pricing or promoting these slots.`,
      });
    }
    const nearlySoldOut = analytics.occupancyByShow.filter((s) => s.occupancyPct >= 90);
    if (nearlySoldOut.length > 0) {
      insights.push({
        icon: TrendingUpIcon,
        tone: "cyan",
        text: `${nearlySoldOut.length} show${nearlySoldOut.length === 1 ? "" : "s"} at 90%+ occupancy — strong demand, consider adding another showtime.`,
      });
    }
  }

  if (dashboardData?.yesterdayBookings > 0) {
    const change = ((dashboardData.todayBookings - dashboardData.yesterdayBookings) / dashboardData.yesterdayBookings) * 100;
    if (Math.abs(change) >= 10) {
      insights.push({
        icon: change >= 0 ? TrendingUpIcon : TrendingDownIcon,
        tone: change >= 0 ? "cyan" : "primary",
        text: `Booking volume is ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(0)}% vs. yesterday (${dashboardData.todayBookings} bookings today).`,
      });
    }
  }

  return insights;
};

const TONE_STYLES = {
  primary: "bg-primary/10 border-primary/25 text-primary",
  cyan: "bg-nebula-cyan/10 border-nebula-cyan/25 text-nebula-cyan",
  violet: "bg-nebula-violet/10 border-nebula-violet/25 text-nebula-violet",
};

const AIInsightsPanel = ({ dashboardData, analytics, currency }) => {
  const insights = useMemo(() => buildInsights({ dashboardData, analytics, currency }), [dashboardData, analytics, currency]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative glass-panel p-5 md:p-6 overflow-hidden"
    >
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(109,92,255,0.6), transparent 70%)" }}
      />
      <div className="relative flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-nebula-violet/15 border border-nebula-violet/30">
          <SparklesIcon className="w-4 h-4 text-nebula-violet" />
        </span>
        <p className="text-sm font-medium">Smart Insights</p>
      </div>

      {insights.length === 0 ? (
        <p className="relative text-sm text-gray-400">No notable trends in this period — metrics are steady.</p>
      ) : (
        <div className="relative space-y-2.5">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs leading-relaxed ${TONE_STYLES[insight.tone]}`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="text-gray-200">{insight.text}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default AIInsightsPanel;
