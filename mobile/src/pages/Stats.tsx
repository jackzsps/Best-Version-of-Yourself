import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useApp } from '../store/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { TabParamList } from '../types';
import { format, isToday, differenceInDays, isThisMonth, isThisQuarter, startOfQuarter, isThisYear } from 'date-fns';

type TimeRangeType = 'today' | 'week' | 'month' | 'quarter' | 'year';

const { width } = Dimensions.get('window');

interface StatsProps {
    setActiveTab: (tab: keyof TabParamList) => void;
}

export const Stats: React.FC<StatsProps> = ({ setActiveTab }) => {
    const { entries, theme, t } = useApp();
    const insets = useSafeAreaInsets();
    const isVintage = theme === 'vintage';
    const [timeRange, setTimeRange] = useState<TimeRangeType>('week');

    const ranges: { id: TimeRangeType, label: string }[] = [
        { id: 'today', label: t.dashboard?.timeRange?.today || 'Today' },
        { id: 'week', label: t.dashboard?.timeRange?.week || '7 Days' },
        { id: 'month', label: t.dashboard?.timeRange?.month || 'Month' },
        { id: 'quarter', label: t.dashboard?.timeRange?.quarter || 'Quarter' },
        { id: 'year', label: t.dashboard?.timeRange?.year || 'Year' },
    ];

    const colors = isVintage ? {
        background: '#FDFBF7',
        text: '#2C241B',
        secondaryText: '#72675d',
        card: '#f4f1ea',
        line: '#e8e3d9',
        chartBackground: '#fdfbf7',
        want: '#ef4444',
        need: '#f59e0b',
        must: '#3b82f6',
        protein: '#cd5c5c', // Vintage Red
        carbs: '#4682b4',   // Vintage Steel Blue
        fat: '#daa520'      // Vintage Goldenrod
    } : {
        background: '#F9FAFB',
        text: '#111827',
        secondaryText: '#6B7280',
        card: '#FFFFFF',
        chartBackground: '#ffffff',
        want: '#F87171',
        need: '#FBBF24',
        must: '#60A5FA',
        protein: '#EF4444', // Red-ish for Protein
        carbs: '#3B82F6',   // Blue-ish for Carbs
        fat: '#F59E0B'      // Yellow-ish for Fat
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
        const now = new Date();
        const filteredEntries = entries.filter(e => {
            if (!e.date) return false;
            const d = e.date.toDate ? e.date.toDate() : new Date((e.date as any).seconds ? (e.date as any).seconds * 1000 : (e.date as any));
            switch (timeRange) {
                case 'today': return isToday(d);
                case 'week': return differenceInDays(now, d) <= 7 && differenceInDays(now, d) >= 0;
                case 'month': return isThisMonth(d);
                case 'quarter': return isThisQuarter(d);
                case 'year': return isThisYear(d);
            }
            return false;
        });

        let totalCost = 0;
        let wantCost = 0;
        let needCost = 0;
        let mustCost = 0;
        let totalCals = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;

        filteredEntries.forEach(entry => {
            totalCost += entry.cost || 0;
            totalCals += entry.calories || 0;
            totalProtein += entry.protein || 0;
            totalCarbs += entry.carbs || 0;
            totalFat += entry.fat || 0;

            if (entry.usage === 'want') wantCost += entry.cost || 0;
            else if (entry.usage === 'need') needCost += entry.cost || 0;
            else if (entry.usage === 'must') mustCost += entry.cost || 0;
        });

        let labels: string[] = [];
        let costsLine: number[] = [];
        let calsLine: number[] = [];

        if (timeRange === 'today') {
            const hourMap: Record<number, { cost: number, cals: number }> = { 0: { cost: 0, cals: 0 }, 6: { cost: 0, cals: 0 }, 12: { cost: 0, cals: 0 }, 18: { cost: 0, cals: 0 } };
            filteredEntries.forEach(e => {
                const d = e.date.toDate ? e.date.toDate() : new Date((e.date as any).seconds ? (e.date as any).seconds * 1000 : (e.date as any));
                const h = d.getHours();
                const bucket = Math.floor(h / 6) * 6;
                if (hourMap[bucket]) {
                    hourMap[bucket].cost += (e.cost || 0);
                    hourMap[bucket].cals += (e.calories || 0);
                }
            });
            labels = ['12AM', '6AM', '12PM', '6PM'];
            costsLine = [hourMap[0].cost, hourMap[6].cost, hourMap[12].cost, hourMap[18].cost];
            calsLine = [hourMap[0].cals, hourMap[6].cals, hourMap[12].cals, hourMap[18].cals];
        } else if (timeRange === 'week') {
            const dailyCost: Record<string, number> = {};
            const dailyCals: Record<string, number> = {};
            filteredEntries.forEach(e => {
                const d = e.date.toDate ? e.date.toDate() : new Date((e.date as any).seconds ? (e.date as any).seconds * 1000 : (e.date as any));
                const dayStr = format(d, 'EEE');
                dailyCost[dayStr] = (dailyCost[dayStr] || 0) + (e.cost || 0);
                dailyCals[dayStr] = (dailyCals[dayStr] || 0) + (e.calories || 0);
            });
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            costsLine = labels.map(d => dailyCost[d] || 0);
            calsLine = labels.map(d => dailyCals[d] || 0);
        } else if (timeRange === 'month') {
            const weekMap: Record<string, { cost: number, cals: number }> = { '1-7': { cost: 0, cals: 0 }, '8-14': { cost: 0, cals: 0 }, '15-21': { cost: 0, cals: 0 }, '22+': { cost: 0, cals: 0 } };
            filteredEntries.forEach(e => {
                const d = e.date.toDate ? e.date.toDate() : new Date((e.date as any).seconds ? (e.date as any).seconds * 1000 : (e.date as any));
                const dVal = d.getDate();
                const w = dVal <= 7 ? '1-7' : dVal <= 14 ? '8-14' : dVal <= 21 ? '15-21' : '22+';
                weekMap[w].cost += (e.cost || 0);
                weekMap[w].cals += (e.calories || 0);
            });
            labels = ['1-7', '8-14', '15-21', '22+'];
            costsLine = labels.map(w => weekMap[w].cost);
            calsLine = labels.map(w => weekMap[w].cals);
        } else if (timeRange === 'quarter') {
            const qStart = startOfQuarter(now);
            const m1 = format(qStart, 'MMM');
            const d2 = new Date(qStart); d2.setMonth(qStart.getMonth() + 1);
            const m2 = format(d2, 'MMM');
            const d3 = new Date(qStart); d3.setMonth(qStart.getMonth() + 2);
            const m3 = format(d3, 'MMM');
            labels = [m1, m2, m3];
            const monthMap: Record<string, { cost: number, cals: number }> = {};
            labels.forEach(m => monthMap[m] = { cost: 0, cals: 0 });
            filteredEntries.forEach(e => {
                const d = e.date.toDate ? e.date.toDate() : new Date((e.date as any).seconds ? (e.date as any).seconds * 1000 : (e.date as any));
                const mStr = format(d, 'MMM');
                if (monthMap[mStr]) {
                    monthMap[mStr].cost += (e.cost || 0);
                    monthMap[mStr].cals += (e.calories || 0);
                }
            });
            costsLine = labels.map(m => monthMap[m].cost);
            calsLine = labels.map(m => monthMap[m].cals);
        } else if (timeRange === 'year') {
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthMap: Record<string, { cost: number, cals: number }> = {};
            labels.forEach(m => monthMap[m] = { cost: 0, cals: 0 });
            filteredEntries.forEach(e => {
                const d = e.date.toDate ? e.date.toDate() : new Date((e.date as any).seconds ? (e.date as any).seconds * 1000 : (e.date as any));
                const mStr = format(d, 'MMM');
                if (monthMap[mStr]) {
                    monthMap[mStr].cost += (e.cost || 0);
                    monthMap[mStr].cals += (e.calories || 0);
                }
            });
            costsLine = labels.map(m => monthMap[m].cost);
            calsLine = labels.map(m => monthMap[m].cals);
            // Hide some labels if it looks cluttered
            labels = labels.map((l, i) => i % 2 === 0 ? l : '');
        }

        return { totalCost, totalCals, totalProtein, totalCarbs, totalFat, wantCost, needCost, mustCost, labels, costsLine, calsLine };
    }, [entries, timeRange]);

    const totalUsageCost = stats.mustCost + stats.needCost + stats.wantCost;
    const pieDataUsage = [
        { name: t.usage.must, cost: totalUsageCost > 0 ? Math.round((stats.mustCost / totalUsageCost) * 100) : 0, color: colors.must, legendFontColor: colors.text },
        { name: t.usage.need, cost: totalUsageCost > 0 ? Math.round((stats.needCost / totalUsageCost) * 100) : 0, color: colors.need, legendFontColor: colors.text },
        { name: t.usage.want, cost: totalUsageCost > 0 ? Math.round((stats.wantCost / totalUsageCost) * 100) : 0, color: colors.want, legendFontColor: colors.text },
    ].filter(d => d.cost > 0).map(d => ({ ...d, name: `${d.name} ${d.cost}%` })); // react-native-chart-kit uses accessor value directly, so we append % to name to show it, or we can just leave value as number but accessor displays it. Usually it appends nothing, so we manipulate name if we want % symbol, or let absolute do its thing.

    const hasMacroData = stats.totalProtein > 0 || stats.totalCarbs > 0 || stats.totalFat > 0;
    const totalMacros = stats.totalProtein + stats.totalCarbs + stats.totalFat;
    const pieDataMacros = [
        { name: 'Protein', value: totalMacros > 0 ? Math.round((stats.totalProtein / totalMacros) * 100) : 0, color: colors.protein, legendFontColor: colors.text },
        { name: 'Carbs', value: totalMacros > 0 ? Math.round((stats.totalCarbs / totalMacros) * 100) : 0, color: colors.carbs, legendFontColor: colors.text },
        { name: 'Fat', value: totalMacros > 0 ? Math.round((stats.totalFat / totalMacros) * 100) : 0, color: colors.fat, legendFontColor: colors.text },
    ].filter(d => d.value > 0).map(d => ({ ...d, name: `${d.name} ${d.value}%` }));

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                    {t.nav?.stats || 'Stats & Insights'}
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRangeContainer}>
                    {ranges.map(range => {
                        const isActive = timeRange === range.id;
                        return (
                            <TouchableOpacity
                                key={range.id}
                                style={[
                                    styles.timeRangeTab,
                                    isActive && { backgroundColor: isVintage ? '#2C241B' : '#111827' },
                                    isVintage && { borderRadius: 0, borderWidth: 1, borderColor: isActive ? '#2C241B' : 'transparent' }
                                ]}
                                onPress={() => setTimeRange(range.id)}
                            >
                                <Text style={[
                                    styles.timeRangeText,
                                    { color: isActive ? '#FFFFFF' : colors.text },
                                    isVintage && { fontFamily: 'Courier', fontWeight: isActive ? 'bold' : 'normal' }
                                ]}>
                                    {range.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.content}>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderStyle: isVintage ? 'solid' : 'solid', borderWidth: isVintage ? 1 : 0 }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                        {t.dashboard.spent} ({t.dashboard.unitCurrency}{stats.totalCost.toLocaleString()})
                    </Text>
                    {stats.totalCost > 0 ? (
                        <LineChart
                            data={{
                                labels: stats.labels,
                                datasets: [{ data: stats.costsLine.length ? stats.costsLine : [0] }]
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
                    {pieDataUsage.length > 0 ? (
                        <PieChart
                            data={pieDataUsage}
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
                                labels: stats.labels,
                                datasets: [{ data: stats.calsLine.length ? stats.calsLine : [0] }]
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

                {/* Macronutrients Section */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, borderStyle: isVintage ? 'solid' : 'solid', borderWidth: isVintage ? 1 : 0 }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                        {t.dashboard?.reports?.macroDist || 'Macros Distribution'}
                    </Text>
                    {hasMacroData ? (
                        <PieChart
                            data={pieDataMacros}
                            width={width - 64}
                            height={200}
                            chartConfig={chartConfig}
                            accessor={"value"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
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
    timeRangeContainer: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    timeRangeTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    timeRangeText: {
        fontSize: 14,
        fontWeight: '600',
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
