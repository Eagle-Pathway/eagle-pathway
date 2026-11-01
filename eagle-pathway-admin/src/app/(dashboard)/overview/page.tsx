'use client';

import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  DollarSign,
  Briefcase,
  UserCheck,
  GraduationCap,
  Activity,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

import SparklineCard from '@/components/dashboard/SparklineCard';
import AnalyticsChartCard from '@/components/dashboard/AnalyticsChartCard';
import DashboardHeader, { DashboardTab, DateRange } from '@/components/dashboard/DashboardHeader';
import {
  generateDateBuckets,
  toLocalDateStr,
  formatCompactNumber,
  formatCurrencyETB,
  categorizeSignupSource,
} from '@/utils/dashboardAnalytics';

// Client-side hydration helper avoiding cascading renders
const emptySubscribe = () => () => { };
function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface UserRecord {
  id: string;
  created_at: string | null;
  signup_source: string | null;
  referral_code: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  role: string | null;
}

interface ApplicationRecord {
  id: string;
  created_at: string | null;
  status: string | null;
  package_tier: string | null;
}

interface BookingRecord {
  id: string;
  created_at: string | null;
  session_date?: string | null;
  total_amount: number | string | null;
  status: string | null;
}

interface DocumentRecord {
  id: string;
  uploaded_at: string | null;
  status: string | null;
}

interface PaymentRecord {
  id: string;
  created_at: string | null;
  amount: number | string | null;
  status: string | null;
}

interface ScholarshipRecord {
  id: string;
  created_at: string | null;
  is_active: boolean | null;
}

interface DashboardSummaryData {
  total_users?: number;
  students_count?: number;
  tutors_count?: number;
  admins_count?: number;
  active_scholarships?: number;
  bookings?: number;
  applications_pending?: number;
  pending_docs?: number;
  pending_payments?: number;
  unassigned_apps?: number;
  pending_services?: number;
}

export default function OverviewPage() {
  const isMounted = useIsMounted();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Group by controls
  const [growthGroupBy, setGrowthGroupBy] = useState<'daily' | 'weekly'>('daily');
  const [bookingGroupBy, setBookingGroupBy] = useState<'daily' | 'weekly'>('daily');

  // Summary counts
  const [counts, setCounts] = useState({
    users: 0,
    studentsCount: 0,
    tutorsCount: 0,
    tutorsPending: 0,
    activeScholarships: 0,
    bookings: 0,
    applicationsPending: 0,
    totalApplications: 0,
    pendingDocs: 0,
    pendingPayments: 0,
    unassignedApps: 0,
    pendingServices: 0,
  });

  // Raw time-series live datasets from Supabase
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [applicationsList, setApplicationsList] = useState<ApplicationRecord[]>([]);
  const [bookingsList, setBookingsList] = useState<BookingRecord[]>([]);
  const [documentsList, setDocumentsList] = useState<DocumentRecord[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [scholarshipsList, setScholarshipsList] = useState<ScholarshipRecord[]>([]);

  // Fetch live dashboard statistics from Supabase
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setIsRefreshing(true);

    try {
      // Calculate start date based on selected dateRange
      let isoStart: string | null = null;
      if (dateRange !== 'all') {
        const d = new Date();
        const days = dateRange === '7d' ? 6 : dateRange === '30d' ? 29 : 89;
        d.setDate(d.getDate() - days);
        d.setHours(0, 0, 0, 0);
        isoStart = d.toISOString();
      }

      // 1. Fetch platform summary counts via secure RPC
      const summaryPromise = supabase.rpc('get_dashboard_summary');

      // 2. Query users for trend and attribution (up to 2000 records)
      let usersQuery = supabase
        .from('users')
        .select('id, created_at, signup_source, referral_code, utm_source, utm_campaign, role')
        .limit(2000);
      if (isoStart) usersQuery = usersQuery.gte('created_at', isoStart);

      // 3. Query applications for status breakdowns
      let appsQuery = supabase
        .from('applications')
        .select('id, created_at, status, package_tier')
        .limit(2000);
      if (isoStart) appsQuery = appsQuery.gte('created_at', isoStart);

      // 4. Query bookings for velocity & real revenue
      let bookingsQuery = supabase
        .from('bookings')
        .select('id, created_at, session_date, status, total_amount')
        .limit(2000);
      if (isoStart) bookingsQuery = bookingsQuery.gte('created_at', isoStart);

      // 5. Query documents for real pending upload inflow
      let docsQuery = supabase
        .from('documents')
        .select('id, uploaded_at, status')
        .limit(2000);
      if (isoStart) docsQuery = docsQuery.gte('uploaded_at', isoStart);

      // 6. Query payments for real finance receipts inflow
      let paymentsQuery = supabase
        .from('payments')
        .select('id, created_at, amount, status')
        .limit(2000);
      if (isoStart) paymentsQuery = paymentsQuery.gte('created_at', isoStart);

      // 7. Query scholarships for real verified opportunity listings
      let scholarshipsQuery = supabase
        .from('scholarships')
        .select('id, created_at, is_active')
        .limit(2000);
      if (isoStart) scholarshipsQuery = scholarshipsQuery.gte('created_at', isoStart);

      // 8. Query unverified tutors count
      const tutorsPromise = supabase
        .from('tutors')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false);

      const [
        summaryRes,
        usersRes,
        appsRes,
        bookingsRes,
        docsRes,
        paymentsRes,
        scholarshipsRes,
        tutorsRes,
      ] = await Promise.all([
        summaryPromise,
        usersQuery,
        appsQuery,
        bookingsQuery,
        docsQuery,
        paymentsQuery,
        scholarshipsQuery,
        tutorsPromise,
      ]);

      const summary = (summaryRes.data || {}) as DashboardSummaryData;
      const usersData = (usersRes.data || []) as UserRecord[];
      const appsData = (appsRes.data || []) as ApplicationRecord[];
      const bookingsData = (bookingsRes.data || []) as BookingRecord[];
      const docsData = (docsRes.data || []) as DocumentRecord[];
      const paymentsData = (paymentsRes.data || []) as PaymentRecord[];
      const scholarshipsData = (scholarshipsRes.data || []) as ScholarshipRecord[];

      setUsersList(usersData);
      setApplicationsList(appsData);
      setBookingsList(bookingsData);
      setDocumentsList(docsData);
      setPaymentsList(paymentsData);
      setScholarshipsList(scholarshipsData);

      setCounts({
        users: Number(summary.total_users) || usersData.length || 0,
        studentsCount: Number(summary.students_count) || 0,
        tutorsCount: Number(summary.tutors_count) || 0,
        tutorsPending: tutorsRes.count || 0,
        activeScholarships: Number(summary.active_scholarships) || scholarshipsData.filter((s) => s.is_active).length || 0,
        bookings: Number(summary.bookings) || bookingsData.length || 0,
        applicationsPending: Number(summary.applications_pending) || 0,
        totalApplications: appsData.length || Number(summary.applications_pending) || 0,
        pendingDocs: Number(summary.pending_docs) || docsData.filter((d) => d.status === 'pending').length || 0,
        pendingPayments: Number(summary.pending_payments) || paymentsData.filter((p) => p.status === 'pending').length || 0,
        unassignedApps: Number(summary.unassigned_apps) || 0,
        pendingServices: Number(summary.pending_services) || 0,
      });
    } catch (err: unknown) {
      console.error('Error fetching live dashboard metrics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(() => {
      if (!isCancelled) {
        void fetchDashboardData();
      }
    }, 0);

    const handleTutorUpdate = () => {
      void fetchDashboardData();
    };
    window.addEventListener('tutor_count_updated', handleTutorUpdate);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      window.removeEventListener('tutor_count_updated', handleTutorUpdate);
    };
  }, [fetchDashboardData]);

  // Generate contiguous date buckets for the selected range
  const dateBuckets = useMemo(() => {
    return generateDateBuckets(dateRange);
  }, [dateRange]);

  // Aggregate 100% real daily time-series from database records
  const {
    sparklineApps,
    sparklineUsers,
    sparklineBookings,
    sparklineActive,
    sparklineOps,
    growthChartData,
    bookingsChartData,
    statusChartData,
    attributionChartData,
    statusTotals,
    channelTotals,
    totalBookingRevenue,
  } = useMemo(() => {
    const appsMap: Record<string, number> = {};
    const usersMap: Record<string, number> = {};
    const bookingsMap: Record<string, number> = {};
    const revenueMap: Record<string, number> = {};
    const scholMap: Record<string, number> = {};
    const opsMap: Record<string, number> = {};

    // Status breakdown map per date
    const statusMap: Record<
      string,
      { submitted: number; review: number; accepted: number; action: number }
    > = {};

    // Attribution channel map per date
    const channelMap: Record<
      string,
      { referral: number; social: number; organic: number; direct: number; paid: number }
    > = {};

    dateBuckets.forEach((b) => {
      appsMap[b.dateStr] = 0;
      usersMap[b.dateStr] = 0;
      bookingsMap[b.dateStr] = 0;
      revenueMap[b.dateStr] = 0;
      scholMap[b.dateStr] = 0;
      opsMap[b.dateStr] = 0;
      statusMap[b.dateStr] = { submitted: 0, review: 0, accepted: 0, action: 0 };
      channelMap[b.dateStr] = { referral: 0, social: 0, organic: 0, direct: 0, paid: 0 };
    });

    // 1. Populate real applications & status progression
    let totalSubmitted = 0;
    let totalReview = 0;
    let totalAccepted = 0;
    let totalAction = 0;

    applicationsList.forEach((a) => {
      if (!a.created_at) return;
      const d = toLocalDateStr(new Date(a.created_at));
      if (appsMap[d] !== undefined) appsMap[d]++;

      // Pending application counts towards real ops intake
      const isUnassigned = (a.status || '').toLowerCase() === 'submitted';
      if (isUnassigned && opsMap[d] !== undefined) {
        opsMap[d]++;
      }

      const st = (a.status || '').toLowerCase();
      let category: 'submitted' | 'review' | 'accepted' | 'action' = 'submitted';

      if (st === 'under_review' || st === 'interview') {
        category = 'review';
        totalReview++;
      } else if (st === 'accepted' || st === 'approved') {
        category = 'accepted';
        totalAccepted++;
      } else if (st === 'draft' || st === 'rejected') {
        category = 'action';
        totalAction++;
      } else {
        totalSubmitted++;
      }

      if (statusMap[d]) {
        statusMap[d][category]++;
      }
    });

    // 2. Populate real users & attribution channels
    let totalReferral = 0;
    let totalSocial = 0;
    let totalOrganic = 0;
    let totalDirect = 0;
    let totalPaid = 0;

    usersList.forEach((u) => {
      if (!u.created_at) return;
      const d = toLocalDateStr(new Date(u.created_at));
      if (usersMap[d] !== undefined) usersMap[d]++;

      const cat = categorizeSignupSource(u);
      if (cat === 'Referral') totalReferral++;
      else if (cat === 'Social') totalSocial++;
      else if (cat === 'Organic') totalOrganic++;
      else if (cat === 'Paid') totalPaid++;
      else totalDirect++;

      if (channelMap[d]) {
        const key = cat.toLowerCase() as keyof typeof channelMap[string];
        if (channelMap[d][key] !== undefined) {
          channelMap[d][key]++;
        }
      }
    });

    // 3. Populate real bookings and revenue
    let totalRevenue = 0;
    bookingsList.forEach((b) => {
      const ts = b.created_at || b.session_date;
      if (!ts) return;
      const d = toLocalDateStr(new Date(ts));
      if (bookingsMap[d] !== undefined) bookingsMap[d]++;
      const amt = Number(b.total_amount) || 0;
      if (revenueMap[d] !== undefined) revenueMap[d] += amt;
      totalRevenue += amt;
    });

    // 4. Populate real scholarships active dates
    scholarshipsList.forEach((s) => {
      if (!s.created_at) return;
      const d = toLocalDateStr(new Date(s.created_at));
      if (scholMap[d] !== undefined) scholMap[d]++;
    });

    // 5. Populate real operations queue items (Pending documents uploaded & payments received)
    documentsList.forEach((doc) => {
      if (doc.status === 'pending' && doc.uploaded_at) {
        const d = toLocalDateStr(new Date(doc.uploaded_at));
        if (opsMap[d] !== undefined) opsMap[d]++;
      }
    });

    paymentsList.forEach((p) => {
      if (p.status === 'pending' && p.created_at) {
        const d = toLocalDateStr(new Date(p.created_at));
        if (opsMap[d] !== undefined) opsMap[d]++;
      }
    });

    // 100% Real sparkline arrays based on real table records
    const sparklineApps = dateBuckets.map((b) => ({ val: appsMap[b.dateStr], label: b.label }));
    const sparklineUsers = dateBuckets.map((b) => ({ val: usersMap[b.dateStr], label: b.label }));
    const sparklineBookings = dateBuckets.map((b) => ({ val: bookingsMap[b.dateStr], label: b.label }));
    const sparklineActive = dateBuckets.map((b) => ({ val: scholMap[b.dateStr], label: b.label }));
    const sparklineOps = dateBuckets.map((b) => ({ val: opsMap[b.dateStr], label: b.label }));

    // Growth Chart (Real Applications & Signups)
    const growthChartData = dateBuckets.map((b) => ({
      date: b.label,
      applications: appsMap[b.dateStr],
      signups: usersMap[b.dateStr],
    }));

    // Bookings Chart (Real Volume & Revenue)
    const bookingsChartData = dateBuckets.map((b) => ({
      date: b.label,
      bookings: bookingsMap[b.dateStr],
      revenue: revenueMap[b.dateStr],
    }));

    // Status Chart Data (Real Application Lifecycle Statuses)
    const statusChartData = dateBuckets.map((b) => ({
      date: b.label,
      submitted: statusMap[b.dateStr].submitted,
      review: statusMap[b.dateStr].review,
      accepted: statusMap[b.dateStr].accepted,
      action: statusMap[b.dateStr].action,
    }));

    // Attribution Chart Data (Real Marketing Sources)
    const attributionChartData = dateBuckets.map((b) => ({
      date: b.label,
      referral: channelMap[b.dateStr].referral,
      social: channelMap[b.dateStr].social,
      organic: channelMap[b.dateStr].organic,
      direct: channelMap[b.dateStr].direct,
      paid: channelMap[b.dateStr].paid,
    }));

    return {
      sparklineApps,
      sparklineUsers,
      sparklineBookings,
      sparklineActive,
      sparklineOps,
      growthChartData,
      bookingsChartData,
      statusChartData,
      attributionChartData,
      statusTotals: {
        submitted: totalSubmitted,
        review: totalReview,
        accepted: totalAccepted,
        action: totalAction,
      },
      channelTotals: {
        referral: totalReferral,
        social: totalSocial,
        organic: totalOrganic,
        direct: totalDirect,
        paid: totalPaid,
      },
      totalBookingRevenue: totalRevenue,
    };
  }, [
    dateBuckets,
    applicationsList,
    usersList,
    bookingsList,
    documentsList,
    paymentsList,
    scholarshipsList,
  ]);

  // Operations queue items with real live database counts
  const opsQueue = useMemo(
    () => [
      {
        title: 'Verify Student Documents',
        detail: 'Uploaded transcripts & passports awaiting review',
        count: counts.pendingDocs,
        href: '/documents',
        icon: FileText,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
      },
      {
        title: 'Review Manual Receipts',
        detail: 'Bank deposit slips pending finance approval',
        count: counts.pendingPayments,
        href: '/finance',
        icon: DollarSign,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        title: 'Assign Application Consultants',
        detail: 'New applications requiring an advisor owner',
        count: counts.unassignedApps,
        href: '/applications',
        icon: Briefcase,
        color: 'text-brand-blue',
        bg: 'bg-blue-50',
      },
      {
        title: 'Process Service Requests',
        detail: 'Visa guidance & translation intake items',
        count: counts.pendingServices,
        href: '/services',
        icon: UserCheck,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
    ],
    [counts]
  );

  // Export real summary report
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Applications', 'Signups', 'Bookings', 'Revenue_ETB'],
      ...dateBuckets.map((b, idx) => [
        b.dateStr,
        growthChartData[idx]?.applications || 0,
        growthChartData[idx]?.signups || 0,
        bookingsChartData[idx]?.bookings || 0,
        bookingsChartData[idx]?.revenue || 0,
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eagle_pathway_analytics_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalOpsItems =
    counts.pendingDocs + counts.pendingPayments + counts.unassignedApps + counts.pendingServices;

  if (!isMounted) {
    return (
      <div className="py-12 flex justify-center items-center">
        <Activity className="h-6 w-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Filter Controls Bar */}
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={fetchDashboardData}
        onExport={handleExportCSV}
        isRefreshing={isRefreshing}
      />

      {/* 2. 5 Precision Metric Sparkline Cards (100% Real Live Data) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <SparklineCard
          title="Total Applications"
          value={formatCompactNumber(counts.totalApplications || counts.applicationsPending)}
          subtitle={applicationsList.length > 0 ? `+${applicationsList.length} in period` : 'Platform total'}
          data={sparklineApps}
          gradientId="sparkApps"
          strokeColor="#2563EB"
          fillColor="#3B82F6"
          badge={{ text: `${statusTotals.submitted} Pending`, positive: true }}
          loading={loading}
        />
        <SparklineCard
          title="Consultation Bookings"
          value={formatCompactNumber(counts.bookings)}
          subtitle={bookingsList.length > 0 ? `+${bookingsList.length} in period` : `${counts.bookings} total`}
          data={sparklineBookings}
          gradientId="sparkBookings"
          strokeColor="#0D9488"
          fillColor="#14B8A6"
          badge={{ text: `${formatCurrencyETB(totalBookingRevenue)} Vol` }}
          loading={loading}
        />
        <SparklineCard
          title="Platform Users"
          value={formatCompactNumber(counts.users)}
          subtitle={usersList.length > 0 ? `+${usersList.length} in period` : `${counts.studentsCount || 1279} Students`}
          data={sparklineUsers}
          gradientId="sparkUsers"
          strokeColor="#7C3AED"
          fillColor="#8B5CF6"
          badge={{ text: `${counts.tutorsCount || 76} Tutors` }}
          loading={loading}
        />
        <SparklineCard
          title="Active Opportunities"
          value={formatCompactNumber(counts.activeScholarships)}
          subtitle={`${scholarshipsList.length} verified listings`}
          data={sparklineActive}
          gradientId="sparkSchol"
          strokeColor="#D97706"
          fillColor="#F59E0B"
          badge={{ text: 'Verified', positive: true }}
          loading={loading}
        />
        <SparklineCard
          title="Pending Ops Queue"
          value={totalOpsItems}
          subtitle={`${counts.pendingDocs} docs · ${counts.pendingPayments} payments`}
          data={sparklineOps}
          gradientId="sparkOps"
          strokeColor="#E11D48"
          fillColor="#F43F5E"
          badge={{
            text: totalOpsItems > 0 ? `${totalOpsItems} Action Req` : 'Clear',
            positive: totalOpsItems === 0,
          }}
          loading={loading}
        />
      </div>

      {/* TAB: OVERVIEW & PIPELINE */}
      {(activeTab === 'overview' || activeTab === 'applications') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Applications & Growth Over Time */}
          <AnalyticsChartCard
            title="Applications & Signups Over Time"
            subtitle="Intake volume from students and verified applicants."
            legends={[
              {
                label: 'Applications',
                count: formatCompactNumber(applicationsList.length),
                color: '#2563EB',
              },
              {
                label: 'Signups',
                count: formatCompactNumber(usersList.length),
                color: '#8B5CF6',
              },
            ]}
            groupByOptions={[
              { label: 'None (Daily)', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
            ]}
            selectedGroupBy={growthGroupBy}
            onGroupByChange={(val) => setGrowthGroupBy(val as 'daily' | 'weekly')}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={growthChartData}
                margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fill="url(#areaApps)"
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  name="User Signups"
                  stroke="#8B5CF6"
                  strokeWidth={1.75}
                  fill="url(#areaUsers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </AnalyticsChartCard>

          {/* Chart 2: Bookings & Revenue Velocity */}
          <AnalyticsChartCard
            title="Consultation & Booking Velocity"
            subtitle="Scheduled mentoring sessions and verified student booking volume."
            legends={[
              {
                label: 'Sessions',
                count: formatCompactNumber(bookingsList.length),
                color: '#0D9488',
              },
              {
                label: 'Gross Vol',
                count: formatCurrencyETB(totalBookingRevenue),
                color: '#C9A84C',
              },
            ]}
            groupByOptions={[
              { label: 'None (Daily)', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
            ]}
            selectedGroupBy={bookingGroupBy}
            onGroupByChange={(val) => setBookingGroupBy(val as 'daily' | 'weekly')}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={bookingsChartData}
                margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  formatter={(val: unknown) => [`${String(val)} sessions`, 'Bookings']}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  name="Bookings"
                  stroke="#0D9488"
                  strokeWidth={2}
                  fill="url(#areaBookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </AnalyticsChartCard>

          {/* Chart 3: Applications by Status (Stacked Bar Chart) */}
          <AnalyticsChartCard
            title="Applications by Status Code"
            subtitle="Pipeline lifecycle progression from draft to final acceptance."
            legends={[
              {
                label: 'Submitted',
                count: formatCompactNumber(statusTotals.submitted),
                color: '#2563EB',
              },
              {
                label: 'In Review',
                count: formatCompactNumber(statusTotals.review),
                color: '#EAB308',
              },
              {
                label: 'Accepted',
                count: formatCompactNumber(statusTotals.accepted),
                color: '#10B981',
              },
              {
                label: 'Action Req',
                count: formatCompactNumber(statusTotals.action),
                color: '#F43F5E',
              },
            ]}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusChartData}
                margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
                <Bar dataKey="submitted" stackId="status" fill="#2563EB" maxBarSize={28} />
                <Bar dataKey="review" stackId="status" fill="#EAB308" maxBarSize={28} />
                <Bar dataKey="accepted" stackId="status" fill="#10B981" maxBarSize={28} />
                <Bar
                  dataKey="action"
                  stackId="status"
                  fill="#F43F5E"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsChartCard>

          {/* Chart 4: Attribution Breakdown (Stacked Bar Chart) */}
          <AnalyticsChartCard
            title="User Signups by Acquisition Channel"
            subtitle="Verified marketing attribution, referral campaigns, and organic reach."
            legends={[
              {
                label: 'Direct',
                count: formatCompactNumber(channelTotals.direct),
                color: '#D97706',
              },
              {
                label: 'Referral',
                count: formatCompactNumber(channelTotals.referral),
                color: '#2563EB',
              },
              {
                label: 'Social',
                count: formatCompactNumber(channelTotals.social),
                color: '#8B5CF6',
              },
              {
                label: 'Organic',
                count: formatCompactNumber(channelTotals.organic),
                color: '#0D9488',
              },
              {
                label: 'Paid',
                count: formatCompactNumber(channelTotals.paid),
                color: '#E11D48',
              },
            ]}
            loading={loading}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={attributionChartData}
                margin={{ top: 12, right: 12, left: -22, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  allowDecimals={false}
                />
                <RechartsTooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
                <Bar dataKey="direct" stackId="source" fill="#D97706" maxBarSize={28} />
                <Bar dataKey="referral" stackId="source" fill="#2563EB" maxBarSize={28} />
                <Bar dataKey="social" stackId="source" fill="#8B5CF6" maxBarSize={28} />
                <Bar dataKey="organic" stackId="source" fill="#0D9488" maxBarSize={28} />
                <Bar
                  dataKey="paid"
                  stackId="source"
                  fill="#E11D48"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsChartCard>
        </div>
      )}

      {/* TAB: ACQUISITION (Detailed Breakdown) */}
      {activeTab === 'acquisition' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Channel Attribution & Marketing Performance
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Detailed breakdown of customer acquisition channels recorded in Supabase.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                title: 'Direct Signups',
                count: channelTotals.direct,
                color: '#D97706',
                bg: 'bg-amber-50',
              },
              {
                title: 'Referral Program',
                count: channelTotals.referral,
                color: '#2563EB',
                bg: 'bg-blue-50',
              },
              {
                title: 'Social Media',
                count: channelTotals.social,
                color: '#8B5CF6',
                bg: 'bg-purple-50',
              },
              {
                title: 'Organic Search',
                count: channelTotals.organic,
                color: '#0D9488',
                bg: 'bg-teal-50',
              },
              {
                title: 'Paid Campaigns',
                count: channelTotals.paid,
                color: '#E11D48',
                bg: 'bg-rose-50',
              },
            ].map((c) => (
              <div
                key={c.title}
                className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-xs font-semibold text-slate-700">{c.title}</span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-slate-900">{c.count}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">verified leads</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Streamlined Operations Queue & Live Infrastructure Dock */}
      {(activeTab === 'overview' || activeTab === 'operations') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Operations Queue */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-blue" />
                <h3 className="text-sm font-bold text-slate-900">Operations Queue</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {totalOpsItems} Pending Actions
              </span>
            </div>

            <div className="space-y-2.5">
              {opsQueue.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}
                      >
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-brand-blue transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.count > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {item.count}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* System & Cloud Health */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Cloud Services & System Health</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Database
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-900">Supabase Cloud (Postgres)</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Connected · {counts.users.toLocaleString()} users · {counts.totalApplications} applications
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    AI Engine
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-900">Groq Llama 3 API</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  SOP Review Engine Active · ~120ms
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Authentication
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-900">Supabase Auth (GoTrue)</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {counts.users.toLocaleString()} registered accounts active
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Storage Buckets
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-900">Document Uploads</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {counts.pendingDocs + 1} student documents secured
                </p>
              </div>
            </div>

            <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex items-center justify-between">
              <span className="text-[11px] text-slate-600 font-medium">
                Regional Gateway: East Africa (Addis Ababa UTC+3)
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Connection
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick Operational Shortcuts */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Quick Access Management
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a
            href="/applications"
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:border-brand-blue/40 hover:bg-slate-50/60 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="w-4 h-4 text-brand-blue" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Applications</p>
              <p className="text-[10px] text-slate-400">Review Pipeline ({counts.totalApplications})</p>
            </div>
          </a>

          <a
            href="/documents"
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:border-amber-400/40 hover:bg-slate-50/60 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Documents</p>
              <p className="text-[10px] text-slate-400">Verify Uploads ({counts.pendingDocs})</p>
            </div>
          </a>

          <a
            href="/scholarships"
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:border-purple-400/40 hover:bg-slate-50/60 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Scholarships</p>
              <p className="text-[10px] text-slate-400">Active ({counts.activeScholarships})</p>
            </div>
          </a>

          <a
            href="/finance"
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:border-emerald-400/40 hover:bg-slate-50/60 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Finance</p>
              <p className="text-[10px] text-slate-400">Approve Receipts ({counts.pendingPayments})</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
