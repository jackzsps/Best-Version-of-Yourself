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
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
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

        const updatedEntry: Entry = {
            ...entry,
            itemName: name.trim(),
            cost: cost ? parseFloat(cost) : 0,
            calories: calories ? parseInt(calories, 10) : 0,
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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, isVintage && styles.vintageModalContent]}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.title, isVintage && styles.vintageTitle]}>
                                Edit Entry
                            </Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
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
            </TouchableWithoutFeedback>
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    vintageModalContent: {
        backgroundColor: '#f9f5eb', // vintage-card
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: '#2c241b', // vintage-ink
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
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
        color: '#cd5c5c',
        fontFamily: 'Courier',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    closeBtn: {
        padding: 8,
        marginRight: -8,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
    },
    vintageLabel: {
        fontFamily: 'Courier',
        color: '#2c241b',
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#F3F4F6', // gray-100
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    vintageInput: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#2c241b',
        fontFamily: 'Courier',
        color: '#2c241b',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        gap: 16,
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
        borderWidth: 1,
        borderColor: '#cd5c5c', // stamp red
        borderRadius: 0,
    },
    deleteBtnText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: 16,
    },
    vintageDeleteBtnText: {
        color: '#cd5c5c',
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
        borderRadius: 0,
    },
    saveBtnText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    vintageSaveBtnText: {
        color: '#f9f5eb',
        fontFamily: 'Courier',
        fontWeight: 'bold',
    },
});
