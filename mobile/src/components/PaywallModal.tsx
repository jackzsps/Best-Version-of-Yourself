import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useApp } from '../store/AppContext';
import { Icon } from './Icons';
import * as RNIap from 'react-native-iap';
import firestore from '@react-native-firebase/firestore';
import { SubscriptionStatus, UserSubscription } from '../types';

const ITEM_SKUS = Platform.select({
  ios: ['com.bestversion.monthly'], // 替換為實際的 Product ID
  android: ['com.bestversion.monthly'],
});

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal = ({ visible, onClose }: PaywallModalProps) => {
  const { t, theme, setSubscription, subscription, isPro } = useApp();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const isVintage = theme === 'vintage';
  
  // Test Button for Simulator only (since IAP doesn't work on Simulator)
  const isSimulator = Platform.OS === 'ios' && !Platform.isTV && !Platform.isPad; // Rough check, better to use DeviceInfo.isEmulator()

  useEffect(() => {
    if (visible) {
      initIAP();
    }
    
    return () => {
        RNIap.endConnection();
    }
  }, [visible]);

  const initIAP = async () => {
    try {
      setLoading(true);
      await RNIap.initConnection();
      if (ITEM_SKUS) {
          const products = await RNIap.getProducts({ skus: ITEM_SKUS });
          setProducts(products);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (products.length === 0) {
        Alert.alert('Error', 'No products available');
        return;
    }
    
    setLoading(true);
    try {
      const purchase = await RNIap.requestPurchase({ sku: products[0].productId });
      
      if (purchase) {
         // Verify receipt here if you have a backend
         console.log('Purchase Successful', purchase);
         
         // Update global state with status='pro'
         const newExpiry = new Date();
         newExpiry.setMonth(newExpiry.getMonth() + 1); // Add 1 month
         
         const newSub: UserSubscription = {
             status: 'pro',
             expiryDate: firestore.Timestamp.fromDate(newExpiry) as any,
             productId: purchase.productId,
             transactionId: purchase.transactionId,
             purchaseDate: purchase.transactionDate,
         }
         
         setSubscription(newSub);

         Alert.alert('Success', 'Subscription Successful!');
         onClose();
      }
    } catch (err: any) {
      if (err.code === 'E_USER_CANCELLED') {
          // User cancelled
      } else {
        console.warn(err);
        Alert.alert('Purchase Failed', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
      setLoading(true);
      try {
          const purchases = await RNIap.getAvailablePurchases();
          // Check if user has valid subscription
          const hasPro = purchases.find(p => ITEM_SKUS?.includes(p.productId));
          
          if (hasPro) {
              const newExpiry = new Date();
              newExpiry.setMonth(newExpiry.getMonth() + 1); // Mock logic for restore

              const newSub: UserSubscription = {
                  status: 'pro',
                  expiryDate: firestore.Timestamp.fromDate(newExpiry) as any,
                  productId: hasPro.productId,
                  transactionId: hasPro.transactionId,
                  purchaseDate: hasPro.transactionDate,
                  originalTransactionId: hasPro.originalTransactionIdIOS
              };
              
              setSubscription(newSub);
              Alert.alert('Restore Successful', 'Your Pro subscription has been restored.');
              onClose();
          } else {
              Alert.alert('Restore Failed', 'No valid subscription found.');
          }
      } catch(err: any) {
          console.warn(err);
          Alert.alert('Restore Failed', err.message);
      } finally {
          setLoading(false);
      }
  }
  
  const handleTestUpgrade = () => {
      const isExpired = !isPro && subscription.status === 'pro'; // Was pro but expired
      
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 14); // Extend 14 days
      
      // If currently trial, upgrade to Pro (Test)
      // If currently Pro (expired), renew Pro
      
      const newSub: UserSubscription = {
          status: 'pro',
          expiryDate: firestore.Timestamp.fromDate(newExpiry) as any,
      };
      
      setSubscription(newSub);
      Alert.alert("Success", "Extended Pro (Test) by 14 days!");
      onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, isVintage && styles.vintageContainer]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="x" size={24} color={isVintage ? '#2d2a26' : '#000'} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
               <Icon name="star" size={48} color="#FFD700" />
            </View>
            
            <Text style={[styles.title, isVintage && styles.vintageTitle]}>
              Unlock Pro Features
            </Text>
            
            <Text style={[styles.subtitle, isVintage && styles.vintageText]}>
              Get detailed AI reports and more!
            </Text>

             <View style={styles.sandboxBadge}>
                <Text style={styles.sandboxText}>Test Environment</Text>
             </View>

            <View style={[styles.priceContainer, isVintage && styles.vintagePriceContainer]}>
                <Text style={[styles.price, isVintage && styles.vintageText]}>
                    NT$ 120 / Month
                </Text>
            </View>

            <TouchableOpacity
              style={[styles.subscribeBtn, isVintage && styles.vintageSubscribeBtn]}
              onPress={handleTestUpgrade} // Changed to Test Upgrade for now as per instructions
              disabled={loading}
            >
              {loading ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <Text style={[styles.subscribeText, isVintage && styles.vintageSubscribeText]}>
                    Upgrade to Pro (Test) - 14 Days
                  </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
                <Text style={[styles.restoreText, isVintage && styles.vintageText]}>Restore Purchase</Text>
            </TouchableOpacity>
            
             <Text style={[styles.disclaimer, isVintage && styles.vintageText]}>
                 * This button simulates purchase for testing.
             </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 450,
  },
  vintageContainer: {
    backgroundColor: '#fdfbf7',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#d1d5db',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  content: {
    alignItems: 'center',
    paddingTop: 10,
  },
  iconContainer: {
      marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',    marginBottom: 8,
    color: '#000',
  },
  vintageTitle: {
      fontFamily: 'Courier',
      color: '#2d2a26',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  vintageText: {
      fontFamily: 'Courier',
      color: '#2d2a26',
  },
  sandboxBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#F59E0B'
  },
  sandboxText: {
      color: '#B45309',
      fontSize: 12,
      fontWeight: '600'
  },
  priceContainer: {
      marginBottom: 32,
  },
  vintagePriceContainer: {
      borderBottomWidth: 1,
      borderColor: '#d1d5db',
      paddingBottom: 8,
      borderStyle: 'dashed'
  },
  price: {
      fontSize: 24,
      fontWeight: '600',
      color: '#000',
  },
  subscribeBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  vintageSubscribeBtn: {
      backgroundColor: '#2d2a26',
      borderRadius: 4,
  },
  subscribeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  vintageSubscribeText: {
      fontFamily: 'Courier',
  },
  restoreBtn: {
      padding: 12,
  },
  restoreText: {
      color: '#666',
      fontSize: 14,
      textDecorationLine: 'underline',
  },
  disclaimer: {
      marginTop: 20,
      fontSize: 12,
      color: '#999',
      textAlign: 'center'
  }
});
