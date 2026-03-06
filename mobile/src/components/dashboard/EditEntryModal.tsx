import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Alert,
    Pressable,
} from 'react-native';
import { Entry, Theme } from '@shared/types';
import { TRANSLATIONS } from '@shared/translations';
import { Icon } from '../Icons';

interface EditEntryModalProps {
    visible: boolean;
    onClose: () => void;
    entry: Entry | null;
    onSave: (updatedEntry: Entry) => void;
    onDelete: (entry: Entry) => void;
    theme: Theme;
    language: keyof typeof TRANSLATIONS;
}

export const EditEntryModal: React.FC<EditEntryModalProps> = ({
    visible,
    onClose,
    entry,
    onSave,
    onDelete,
    theme,
    language,
}) => {
    const t = TRANSLATIONS[language];
    const isVintage = theme === 'vintage';

    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [calories, setCalories] = useState('');

    // Populate data when modal opens
    useEffect(() => {
        if (entry && visible) {
            setName(entry.itemName || '');
            setCost(entry.cost ? entry.cost.toString() : '');
            setCalories(entry.calories ? entry.calories.toString() : '');
        }
    }, [entry, visible]);

    if (!entry) return null;

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Item name cannot be empty');
            return;
        }

        const parsedCost = parseFloat(cost as string);
        const validCost = !isNaN(parsedCost) ? parsedCost : 0;

        const parsedCal = parseInt(calories as string, 10);
        const validCal = !isNaN(parsedCal) ? parsedCal : 0;

        const updatedEntry: Entry = {
            ...entry,
            itemName: name.trim(),
            cost: cost ? validCost : 0,
            calories: calories ? validCal : 0,
        };
        onSave(updatedEntry);
        onClose();
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Entry',
            'Are you sure you want to delete this entry? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        onDelete(entry);
                        onClose();
                    }
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                {/* Touch overlay to dismiss keyboard and close modal */}
                <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); onClose(); }} />

                {/* onStartShouldSetResponder intercepts inner touches from hitting the overlay */}
                <View style={[styles.modalContent, isVintage && styles.vintageModalContent]} onStartShouldSetResponder={() => true}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.title, isVintage && styles.vintageTitle]}>
                            Edit Entry
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} activeOpacity={0.7}>
                            <Icon name="x" size={24} color={isVintage ? '#2c241b' : '#6B7280'} />
                        </TouchableOpacity>
                    </View>

                    {/* Inputs */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isVintage && styles.vintageLabel]}>Item Name</Text>
                        <TextInput
                            style={[styles.input, isVintage && styles.vintageInput]}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Morning Coffee"
                            placeholderTextColor={isVintage ? '#8b4513' : '#9CA3AF'}
                        />
                    </View>

                    {(entry.type === 'expense' || entry.type === 'combined') && (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isVintage && styles.vintageLabel]}>Cost ({t.dashboard.unitCurrency})</Text>
                            <TextInput
                                style={[styles.input, isVintage && styles.vintageInput]}
                                value={cost}
                                onChangeText={setCost}
                                placeholder="0.00"
                                keyboardType="numeric"
                                placeholderTextColor={isVintage ? '#8b4513' : '#9CA3AF'}
                            />
                        </View>
                    )}

                    {(entry.type === 'diet' || entry.type === 'combined') && (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isVintage && styles.vintageLabel]}>Calories ({t.dashboard.unitCal})</Text>
                            <TextInput
                                style={[styles.input, isVintage && styles.vintageInput]}
                                value={calories}
                                onChangeText={setCalories}
                                placeholder="0"
                                keyboardType="numeric"
                                placeholderTextColor={isVintage ? '#8b4513' : '#9CA3AF'}
                            />
                        </View>
                    )}

                    {/* Actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.deleteBtn, isVintage && styles.vintageDeleteBtn]}
                            onPress={handleDelete}
                        >
                            <Icon name="trash-2" size={20} color={isVintage ? '#cd5c5c' : '#EF4444'} />
                            <Text style={[styles.deleteBtnText, isVintage && styles.vintageDeleteBtnText]}>
                                Delete
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveBtn, isVintage && styles.vintageSaveBtn]}
                            onPress={handleSave}
                        >
                            <Text style={[styles.saveBtnText, isVintage && styles.vintageSaveBtnText]}>
                                Save Changes
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    vintageModalContent: {
        backgroundColor: '#F5E6D3', // vintage-bg
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: '#2c241b', // vintage-ink
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        shadowColor: '#2c241b',
        shadowOffset: { width: 4, height: -4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    vintageTitle: {
        color: '#2c241b',
        fontFamily: 'Courier',
        fontWeight: 'bold',
        fontSize: 24,
    },
    closeBtn: {
        padding: 8,
        marginRight: -8,
        zIndex: 10,
        elevation: 10,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    vintageLabel: {
        fontFamily: 'Courier',
        color: 'rgba(44, 36, 27, 0.7)',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111827',
    },
    vintageInput: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderBottomWidth: 2,
        borderColor: 'rgba(44, 36, 27, 0.2)', // vintage-ink/20
        paddingVertical: 8,
        paddingHorizontal: 0,
        fontSize: 18,
        fontFamily: 'Courier',
        color: '#2c241b',
        borderRadius: 0,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        gap: 16,
        zIndex: 10,
        elevation: 10,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FEE2E2', // red-100
        flex: 1,
        gap: 8,
    },
    vintageDeleteBtn: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#2c241b',
        borderRadius: 2,
    },
    deleteBtnText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 16,
    },
    vintageDeleteBtnText: {
        color: '#2c241b',
        fontFamily: 'Courier',
        fontWeight: 'bold',
    },
    saveBtn: {
        backgroundColor: '#111827', // gray-900
        padding: 16,
        borderRadius: 16,
        flex: 1.5,
        alignItems: 'center',
    },
    vintageSaveBtn: {
        backgroundColor: '#2c241b',
        borderRadius: 2,
    },
    saveBtnText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    vintageSaveBtnText: {
        color: '#F5E6D3',
        fontFamily: 'Courier',
        fontWeight: 'bold',
    },
});
