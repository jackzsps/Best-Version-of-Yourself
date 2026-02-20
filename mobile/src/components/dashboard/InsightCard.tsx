import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../Icons';
import { Theme } from '../../types';

interface InsightCardProps {
    t: any;
    theme: Theme;
    insightText: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ t, theme, insightText }) => {
    const isVintage = theme === 'vintage';

    if (isVintage) {
        return (
            <View style={styles.vintageContainer}>
                {/* Tape Effect Representation */}
                <View style={styles.vintageTape} />

                <View style={styles.vintageHeaderRow}>
                    <View style={styles.vintageIconContainer}>
                        <Icon name="sparkles" size={16} color="#cd5c5c" />
                    </View>
                    <Text style={styles.vintageTitle}>
                        {t.dashboard.insights?.title || 'INSIGHTS'}
                    </Text>
                </View>

                <Text style={styles.vintageText}>
                    {insightText}
                </Text>

                <View style={styles.vintageDisclaimerLine}>
                    <Text style={styles.vintageDisclaimerText}>
                        {t.addEntry.disclaimer || 'Values are approximations based on input.'}
                    </Text>
                </View>
            </View>
        );
    }

    // Modern / Pastel Theme
    return (
        <View style={styles.modernContainer}>
            <View style={styles.modernRow}>
                <View style={styles.modernIconContainer}>
                    <Icon name="sparkles" size={20} color="#0284c7" />
                </View>
                <View style={styles.modernTextContainer}>
                    <Text style={styles.modernTitle}>
                        {t.dashboard.insights?.title || 'Daily Insights'}
                    </Text>
                    <Text style={styles.modernText}>
                        {insightText}
                    </Text>
                </View>
            </View>
            <View style={styles.modernDisclaimerWrapper}>
                <Text style={styles.modernDisclaimerText}>
                    {t.addEntry.disclaimer || 'Values are approximations based on input.'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // --- Modern ---
    modernContainer: {
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: '#ffffff', // Web: bg-gradient fallback
        padding: 20,
        borderRadius: 24,
        borderColor: '#e0f2fe', // border-brand-100
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginHorizontal: 16,
    },
    modernRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    modernIconContainer: {
        padding: 10,
        backgroundColor: '#e0f2fe', // brand-100
        borderRadius: 12,
    },
    modernTextContainer: {
        flex: 1,
    },
    modernTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827', // text-gray-900
        marginBottom: 4,
    },
    modernText: {
        fontSize: 15,
        color: '#4B5563', // text-gray-600
        lineHeight: 22,
        fontWeight: '500',
    },
    modernDisclaimerWrapper: {
        paddingLeft: 60, // equivalent to pl-[3.25rem] (52px + 8px spacing)
        marginTop: 8,
    },
    modernDisclaimerText: {
        fontSize: 11,
        color: '#9CA3AF', // text-gray-400
    },

    // --- Vintage ---
    vintageContainer: {
        marginTop: 16,
        marginBottom: 16,
        padding: 24,
        backgroundColor: '#ffffff',
        borderColor: '#d4c5b0', // vintage-line/50
        borderWidth: 1,
        transform: [{ rotate: '-1deg' }], // subtle rotation
        shadowColor: '#2c241b',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
        elevation: 3,
        marginHorizontal: 16,
    },
    vintageTape: {
        position: 'absolute',
        top: -12,
        alignSelf: 'center',
        width: 120,
        height: 24,
        backgroundColor: 'rgba(254, 240, 138, 0.8)', // yellow-100/80
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        transform: [{ rotate: '1deg' }],
        zIndex: 10,
    },
    vintageHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    vintageIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#cd5c5c', // stamp
        alignItems: 'center',
        justifyContent: 'center',
    },
    vintageTitle: {
        color: '#cd5c5c', // stamp
        fontFamily: 'Courier',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    vintageText: {
        fontFamily: 'Courier', // Placeholder for Caveat
        fontSize: 18,
        color: '#2c241b', // ink
        lineHeight: 28,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: 'rgba(212, 197, 176, 0.5)', // vintage-line/30
    },
    vintageDisclaimerLine: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(212, 197, 176, 0.4)', // vintage-line/20
    },
    vintageDisclaimerText: {
        fontSize: 11,
        color: 'rgba(44, 36, 27, 0.6)', // ink/50
        fontFamily: 'Courier',
    },
});
