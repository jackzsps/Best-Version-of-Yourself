import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useApp } from '../store/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { TabParamList } from '../types';
import { format, isThisWeek } from 'date-fns';

const { width } = Dimensions.get('window');

interface StatsProps {
    setActiveTab: (tab: keyof TabParamList) => void;
}

export const Stats: React.FC<StatsProps> = ({ setActiveTab }) => {
    const { entries, theme, t } = useApp();
    const insets = useSafeAreaInsets();
    const isVintage = theme === 'vintage';

    const colors = isVintage ? {
        background: '#FDFBF7',
        text: '#2C241B',
        secondaryText: '#72675d',
        card: '#f4f1ea',
        line: '#e8e3d9',
        chartBackground: '#fdfbf7',
        want: '#ef4444',
        need: '#f59e0b',
        must: '#3b82f6'
    } : {
        background: '#F9FAFB',
        text: '#111827',
        secondaryText: '#6B7280',
        card: '#FFFFFF',
        line: '#F3F4F6',
        chartBackground: '#ffffff',
        want: '#F87171',
        need: '#FBBF24',
        must: '#60A5FA'
    };

    const chartConfig = {
        backgroundGradientFrom: colors.chartBackground,
        backgroundGradientFromOpacity: 1,
        backgroundGradientTo: colors.chartBackground,
        backgroundGradientToOpacity: 1,
        color: (opacity = 1) => isVintage ? `rgba(44, 36, 27, ${opacity})` : `rgba(17, 24, 39, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        propsForLabels: {
            fontFamily: isVintage ? 'Courier' : undefined,
        }
    };

    const stats = useMemo(() => {
        // Filter for this week
        const thisWeekEntries = entries.filter(e => {
            if (!e.date) return false;
            const d = e.date.toDate ? e.date.toDate() : new Date((e.date as any).seconds ? (e.date as any).seconds * 1000 : (e.date as any));
            return isThisWeek(d);
        });

        let totalCost = 0;
        let wantCost = 0;
        let needCost = 0;
        let mustCost = 0;
        let totalCals = 0;

        // Daily buckets for line chart
        const dailyCost: Record<string, number> = {};
        const dailyCals: Record<string, number> = {};

        thisWeekEntries.forEach(entry => {
            totalCost += entry.cost || 0;
            totalCals += entry.calories || 0;

            if (entry.usage === 'want') wantCost += entry.cost || 0;
            else if (entry.usage === 'need') needCost += entry.cost || 0;
            else if (entry.usage === 'must') mustCost += entry.cost || 0;

            const d = entry.date.toDate ? entry.date.toDate() : new Date((entry.date as any).seconds ? (entry.date as any).seconds * 1000 : (entry.date as any));
            const dayStr = format(d, 'EEE');

            dailyCost[dayStr] = (dailyCost[dayStr] || 0) + (entry.cost || 0);
            dailyCals[dayStr] = (dailyCals[dayStr] || 0) + (entry.calories || 0);
        });

        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const costsLine = daysOfWeek.map(d => dailyCost[d] || 0);
        const calsLine = daysOfWeek.map(d => dailyCals[d] || 0);

        return { totalCost, totalCals, wantCost, needCost, mustCost, daysOfWeek, costsLine, calsLine };
    }, [entries]);

    const pieData = [
        { name: t.usage.must, cost: stats.mustCost, color: colors.must, legendFontColor: colors.text },
        { name: t.usage.need, cost: stats.needCost, color: colors.need, legendFontColor: colors.text },
        { name: t.usage.want, cost: stats.wantCost, color: colors.want, legendFontColor: colors.text },
    ].filter(d => d.cost > 0);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                    {t.nav?.stats || 'Stats & Insights'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.secondaryText, fontFamily: isVintage ? 'Courier' : undefined }]}>
                    {t.dashboard.timeRange.week}
                </Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderStyle: isVintage ? 'solid' : 'solid', borderWidth: isVintage ? 1 : 0 }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                        {t.dashboard.spent} ({t.dashboard.unitCurrency}{stats.totalCost.toLocaleString()})
                    </Text>
                    {stats.totalCost > 0 ? (
                        <LineChart
                            data={{
                                labels: stats.daysOfWeek,
                                datasets: [{ data: stats.costsLine }]
                            }}
                            width={width - 64} // padding
                            height={220}
                            yAxisLabel="$"
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                        />
                    ) : (
                        <Text style={{ color: colors.secondaryText, marginTop: 20 }}>{t.dashboard.noEntries}</Text>
                    )}

                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderStyle: isVintage ? 'solid' : 'solid', borderWidth: isVintage ? 1 : 0 }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                        {t.dashboard.reports.usageDist}
                    </Text>
                    {pieData.length > 0 ? (
                        <PieChart
                            data={pieData}
                            width={width - 64}
                            height={200}
                            chartConfig={chartConfig}
                            accessor={"cost"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    ) : (
                        <Text style={{ color: colors.secondaryText, marginTop: 20 }}>{t.dashboard.noEntries}</Text>
                    )}
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderStyle: isVintage ? 'solid' : 'solid', borderWidth: isVintage ? 1 : 0 }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                        {t.dashboard.calories} ({stats.totalCals.toLocaleString()} {t.dashboard.unitCal})
                    </Text>
                    {stats.totalCals > 0 ? (
                        <LineChart
                            data={{
                                labels: stats.daysOfWeek,
                                datasets: [{ data: stats.calsLine }]
                            }}
                            width={width - 64}
                            height={220}
                            chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // Orange for calories
                            }}
                            bezier
                            style={styles.chart}
                        />
                    ) : (
                        <Text style={{ color: colors.secondaryText, marginTop: 20 }}>{t.dashboard.noEntries}</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    content: {
        paddingHorizontal: 16,
        gap: 16,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    }
});
