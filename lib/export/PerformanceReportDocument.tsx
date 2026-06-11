import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  GoalReportSection,
  PerformanceReportData,
} from "@/lib/export/reportTypes";

const colors = {
  ink: "#111118",
  muted: "#5c5c72",
  accent: "#6C63FF",
  line: "#e4e4ec",
  complete: "#0d9488",
  current: "#6C63FF",
  upcoming: "#9ca3af",
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.ink,
    backgroundColor: "#ffffff",
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 24,
  },
  heroScore: {
    fontSize: 48,
    fontFamily: "Helvetica-Bold",
    color: colors.accent,
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 9,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  statBlock: {
    minWidth: 80,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  colGoal: { width: "34%" },
  colScore: { width: "12%", textAlign: "right" },
  colGap: { width: "12%", textAlign: "right" },
  colTrend: { width: "14%", textAlign: "right" },
  colPeriod: { width: "18%" },
  colDays: { width: "10%", textAlign: "right" },
  headerText: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.ink,
  },
  muted: {
    color: colors.muted,
    fontSize: 9,
  },
  narrative: {
    fontSize: 10,
    lineHeight: 1.55,
    color: colors.ink,
    marginBottom: 20,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 3,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
  },
});

function formatDelta(delta: number | null): string {
  if (delta == null) return "—";
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ReportFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>A-To-C · Investment performance report</Text>
      <Text style={styles.footerText}>Generated {formatDate(generatedAt)}</Text>
    </View>
  );
}

function GoalTable({
  goals,
  emptyLabel,
}: {
  goals: GoalReportSection[];
  emptyLabel: string;
}) {
  if (goals.length === 0) {
    return <Text style={styles.muted}>{emptyLabel}</Text>;
  }

  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.colGoal]}>Goal</Text>
        <Text style={[styles.headerText, styles.colScore]}>Score</Text>
        <Text style={[styles.headerText, styles.colGap]}>Gap</Text>
        <Text style={[styles.headerText, styles.colTrend]}>14d Δ</Text>
        <Text style={[styles.headerText, styles.colPeriod]}>Period</Text>
        <Text style={[styles.headerText, styles.colDays]}>Days</Text>
      </View>
      {goals.map((goal) => (
        <View key={goal.title} style={styles.tableRow}>
          <View style={styles.colGoal}>
            <Text style={styles.bodyText}>{goal.title}</Text>
            {goal.category && (
              <Text style={styles.muted}>{goal.category}</Text>
            )}
          </View>
          <Text style={[styles.bodyText, styles.colScore]}>
            {goal.investmentScore}
          </Text>
          <Text style={[styles.bodyText, styles.colGap]}>
            {goal.gapScore ?? "—"}
          </Text>
          <Text style={[styles.bodyText, styles.colTrend]}>
            {formatDelta(goal.trendDelta14)}
          </Text>
          <Text style={[styles.muted, styles.colPeriod]}>
            {goal.currentMilestone ?? "—"}
          </Text>
          <Text style={[styles.bodyText, styles.colDays]}>
            {goal.daysRemaining}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DashboardReport({ data }: { data: Extract<PerformanceReportData, { type: "dashboard" }> }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.eyebrow}>Performance report</Text>
      <Text style={styles.title}>Investment Score summary</Text>
      <Text style={styles.subtitle}>Prepared for {data.displayName}</Text>

      <Text style={styles.heroLabel}>Overall investment score</Text>
      <Text style={styles.heroScore}>{data.overallScore}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{formatDelta(data.trend30Delta)}</Text>
          <Text style={styles.statLabel}>30-day change</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{data.streak}</Text>
          <Text style={styles.statLabel}>Current streak</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{data.longestStreak}</Text>
          <Text style={styles.statLabel}>Longest streak</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{data.activeGoals.length}</Text>
          <Text style={styles.statLabel}>Active goals</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Active goals</Text>
      <GoalTable goals={data.activeGoals} emptyLabel="No active goals." />

      {data.completedGoals.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Completed goals</Text>
          <GoalTable
            goals={data.completedGoals}
            emptyLabel="No completed goals."
          />
        </>
      )}

      <ReportFooter generatedAt={data.generatedAt} />
    </Page>
  );
}

function statusColor(status: "complete" | "current" | "upcoming"): string {
  if (status === "complete") return colors.complete;
  if (status === "current") return colors.current;
  return colors.upcoming;
}

function RoadmapReport({ data }: { data: Extract<PerformanceReportData, { type: "roadmap" }> }) {
  const gapExcerpt = data.gapAnalysis
    ? data.gapAnalysis.slice(0, 600) +
      (data.gapAnalysis.length > 600 ? "…" : "")
    : null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.eyebrow}>Goal performance report</Text>
      <Text style={styles.title}>{data.aspirationTitle}</Text>
      <Text style={styles.subtitle}>
        {data.category ? `${data.category} · ` : ""}
        Prepared for {data.displayName}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{data.investmentScore}</Text>
          <Text style={styles.statLabel}>Investment score</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{data.gapScore ?? "—"}</Text>
          <Text style={styles.statLabel}>Starting gap</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>
            {formatDelta(
              data.trend30Start != null && data.trend30End != null
                ? data.trend30End - data.trend30Start
                : null
            )}
          </Text>
          <Text style={styles.statLabel}>30-day change</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{data.checkIns.length}</Text>
          <Text style={styles.statLabel}>Weigh-ins logged</Text>
        </View>
      </View>

      {(data.baselineDate || data.endDate) && (
        <Text style={[styles.muted, { marginBottom: 16 }]}>
          {data.baselineDate
            ? `Baseline: ${formatDate(`${data.baselineDate}T00:00:00`)}`
            : ""}
          {data.baselineDate && data.endDate ? " · " : ""}
          {data.endDate
            ? `Target: ${formatDate(`${data.endDate}T00:00:00`)}`
            : ""}
          {data.interval ? ` · Weigh-in: ${data.interval}` : ""}
        </Text>
      )}

      {gapExcerpt && (
        <>
          <Text style={styles.sectionTitle}>Gap analysis</Text>
          <Text style={styles.narrative}>{gapExcerpt}</Text>
        </>
      )}

      <Text style={styles.sectionTitle}>Milestone progress</Text>
      {data.milestones.length === 0 ? (
        <Text style={styles.muted}>No milestones on record.</Text>
      ) : (
        data.milestones.map((m) => (
          <View key={m.label} style={styles.milestoneRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor(m.status) },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.bodyText}>
                {m.label} — {m.title}
              </Text>
              <Text style={styles.muted}>
                {m.status === "complete"
                  ? "Complete"
                  : m.status === "current"
                    ? "In progress"
                    : "Upcoming"}
              </Text>
            </View>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Weigh-in log</Text>
      {data.checkIns.length === 0 ? (
        <Text style={styles.muted}>No weigh-ins recorded yet.</Text>
      ) : (
        data.checkIns.map((row) => (
          <View key={row.date} style={styles.tableRow}>
            <Text style={[styles.muted, { width: "40%" }]}>{row.date}</Text>
            <Text style={[styles.bodyText, { width: "30%", textAlign: "right" }]}>
              {row.scoreAfter ?? "—"}
            </Text>
            <Text style={[styles.bodyText, { width: "30%", textAlign: "right" }]}>
              {formatDelta(row.delta)}
            </Text>
          </View>
        ))
      )}

      <ReportFooter generatedAt={data.generatedAt} />
    </Page>
  );
}

export function PerformanceReportDocument({
  data,
}: {
  data: PerformanceReportData;
}) {
  return (
    <Document
      title={
        data.type === "dashboard"
          ? "A-To-C Investment Score Report"
          : `A-To-C — ${data.aspirationTitle}`
      }
      author="A-To-C"
    >
      {data.type === "dashboard" ? (
        <DashboardReport data={data} />
      ) : (
        <RoadmapReport data={data} />
      )}
    </Document>
  );
}
