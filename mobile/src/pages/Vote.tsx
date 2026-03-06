import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../store/AppContext';
import { TabParamList } from '../types';

export const Vote = ({ setActiveTab }: { setActiveTab?: (tab: keyof TabParamList) => void }) => {
    const { t, theme } = useApp();
    const isVintage = theme === 'vintage';

    const colors = isVintage ? {
        bg: '#F5E6D3', // vintage-bg
        text: '#2C241B', // vintage-ink
        card: '#E6D2B5', // vintage-card
        line: '#8B7355', // vintage-line
        subText: '#5C4033', // vintage-leather/50
    } : {
        bg: '#F9FAFB', // pastel-bg
        text: '#111827',
        card: '#FFFFFF',
        line: '#E5E7EB',
        subText: '#6B7280',
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                    {(t.nav as any)?.vote || '投票'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined }]}>
                    Product Roadmap & Wishlist
                </Text>
            </View>

            <View style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.line,
                    borderWidth: isVintage ? 2 : 1,
                    borderRadius: isVintage ? 4 : 24,
                    shadowColor: isVintage ? '#2C241B' : '#000',
                    shadowOffset: { width: isVintage ? 4 : 0, height: isVintage ? 4 : 4 },
                    shadowOpacity: isVintage ? 1 : 0.05,
                    shadowRadius: isVintage ? 0 : 12,
                    elevation: 5,
                }
            ]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: isVintage ? 'Courier' : undefined }]}>
                    Coming Soon
                </Text>
                <Text style={[styles.cardText, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined }]}>
                    We are building a place for you to vote on upcoming features and suggest new ideas. Stay tuned!
                </Text>
                <Text style={[styles.cardText, { color: colors.subText, fontFamily: isVintage ? 'Courier' : undefined, marginTop: 16 }]}>
                    未來我們將在這裡提供產品的 Road MAP 以及許願池，讓大家能一起投票決定想要優先開發的功能。敬請期待！
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        paddingTop: 60,
        flexGrow: 1,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    card: {
        padding: 24,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 12,
    },
    cardText: {
        fontSize: 15,
        lineHeight: 22,
    },
});
