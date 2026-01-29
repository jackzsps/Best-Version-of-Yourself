import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useApp } from '../store/AppContext';
import { Icon } from './Icons';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

const initialState = {
  isLogin: true,
  email: '',
  password: '',
  name: '',
  error: '',
  isLoading: false,
};

export const AuthModal = ({ visible, onClose }: AuthModalProps) => {
  const { loginEmail, registerEmail, loginGoogle, loginApple, theme, t } = useApp();
  const [state, setState] = useState(initialState);
  const { isLogin, email, password, name, error, isLoading } = state;
  const isVintage = theme === 'vintage';

  useEffect(() => {
    if (visible) {
      setState(initialState);
    }
  }, [visible]);

  const updateState = (key: string, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const getErrorMessage = (err: any) => {
    if (err.code === 'auth/invalid-email') return t.auth.errorEmail;
    if (err.code === 'auth/invalid-credential') return t.auth.errorCredential;
    if (err.code === 'auth/email-already-in-use') return t.auth.errorInUse;
    if (err.code === 'auth/weak-password') return t.auth.errorWeak;
    if (err.code === 'auth/network-request-failed') return t.auth.errorNetwork;
    if (err.code === 'auth/operation-not-allowed')
      return t.auth.errorOperationNotAllowed;
    return err.message || t.common.error;
  };

  const handleEmailAuth = async () => {
    updateState('error', '');
    updateState('isLoading', true);
    try {
      if (isLogin) {
        await loginEmail(email, password);
      } else {
        await registerEmail(email, password, name);
      }
      onClose();
    } catch (err: any) {
      updateState('error', getErrorMessage(err));
    } finally {
      updateState('isLoading', false);
    }
  };

  const handleGoogleAuth = async () => {
    updateState('error', '');
    updateState('isLoading', true);
    try {
      await loginGoogle();
      onClose();
    } catch (err: any) {
      updateState('error', getErrorMessage(err));
    } finally {
      updateState('isLoading', false);
    }
  };

  const handleAppleAuth = async () => {
    updateState('error', '');
    updateState('isLoading', true);
    try {
      await loginApple();
      onClose();
    } catch (err: any) {
      updateState('error', getErrorMessage(err));
    } finally {
      updateState('isLoading', false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, isVintage && styles.vintageContainer]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="x" size={24} color={isVintage ? '#2d2a26' : '#9CA3AF'} />
          </TouchableOpacity>

          <Text style={[styles.title, isVintage && styles.vintageTitle]}>
            {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Social Auth */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[styles.socialBtn, isVintage && styles.vintageSocialBtn]}
              onPress={handleGoogleAuth}
              disabled={isLoading}
            >
              <Icon
                name="google"
                size={20}
                color={isVintage ? '#2d2a26' : '#000'}
              />
              <Text
                style={[styles.socialBtnText, isVintage && styles.vintageBtnText]}
              >
                {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialBtn, styles.appleBtn]} // Removed vintage style
                onPress={handleAppleAuth}
                disabled={isLoading}
              >
                <Icon name="apple" size={20} color="#fff" /> // Forced white color
                <Text style={[styles.socialBtnText, styles.appleBtnText]}> // Removed vintage style
                  {isLogin ? 'Sign in with Apple' : 'Sign up with Apple'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dividerContainer}>
            <View
              style={[
                styles.dividerLine,
                isVintage && styles.vintageDividerLine,
              ]}
            />
            <Text
              style={[
                styles.dividerText,
                isVintage && styles.vintageDividerText,
              ]}
            >
              {t.common.or || 'OR'}
            </Text>
          </View>

          {/* Email Auth Form */}
          <View style={styles.form}>
            {!isLogin && (
              <TextInput
                style={[styles.input, isVintage && styles.vintageInput]}
                placeholder={t.auth.namePlaceholder}
                placeholderTextColor={isVintage ? 'rgba(45, 42, 38, 0.5)' : '#9CA3AF'}
                value={name}
                onChangeText={(text) => updateState('name', text)}
                autoCapitalize="words"
              />
            )}
            <TextInput
              style={[styles.input, isVintage && styles.vintageInput]}
              placeholder={t.auth.emailPlaceholder}
              placeholderTextColor={isVintage ? 'rgba(45, 42, 38, 0.5)' : '#9CA3AF'}
              value={email}
              onChangeText={(text) => updateState('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, isVintage && styles.vintageInput]}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor={isVintage ? 'rgba(45, 42, 38, 0.5)' : '#9CA3AF'}
              value={password}
              onChangeText={(text) => updateState('password', text)}
              secureTextEntry
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                isVintage && styles.vintageSubmitBtn,
                isLoading && styles.disabledBtn,
              ]}
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={isVintage ? '#fdfbf7' : '#fff'} />
              ) : (
                <Text
                  style={[
                    styles.submitBtnText,
                    isVintage && styles.vintageSubmitBtnText,
                  ]}
                >
                  {isLogin ? t.auth.loginBtn : t.auth.registerBtn}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={() => updateState('isLogin', !isLogin)}
          >
            <Text
              style={[
                styles.switchModeText,
                isVintage && styles.vintageSwitchModeText,
              ]}
            >
              {isLogin ? t.auth.toRegister : t.auth.toLogin}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  vintageContainer: {
    backgroundColor: '#fdfbf7',
    borderWidth: 2,
    borderColor: '#2d2a26',
    borderRadius: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  vintageTitle: {
    fontFamily: 'Courier',
    color: '#2d2a26',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  socialContainer: {
    gap: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 10,
  },
  vintageSocialBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2d2a26',
    borderRadius: 0,
  },
  appleBtn: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  socialBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  vintageBtnText: {
    fontFamily: 'Courier',
    color: '#2d2a26',
    fontWeight: 'bold',
  },
  appleBtnText: {
    color: '#fff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  vintageDividerLine: {
    backgroundColor: 'rgba(45, 42, 38, 0.3)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  vintageDividerText: {
    fontFamily: 'Courier',
    color: '#2d2a26',
    backgroundColor: '#fdfbf7',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  vintageInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: 'rgba(45, 42, 38, 0.5)',
    borderRadius: 0,
    fontFamily: 'Courier',
    color: '#2d2a26',
  },
  submitBtn: {
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  vintageSubmitBtn: {
    backgroundColor: '#2d2a26',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#2d2a26',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  vintageSubmitBtnText: {
    fontFamily: 'Courier',
    fontWeight: 'bold',
    color: '#fdfbf7',
  },
  switchModeBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
  vintageSwitchModeText: {
    fontFamily: 'Courier',
    color: '#92400e',
    textDecorationLine: 'underline',
  },
});
