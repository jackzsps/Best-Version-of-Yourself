# React Native Migration Guide

This project is currently set up for Web (React + Vite). To migrate to React Native and publish to the App Store, follow these steps and guidelines.

## 1. Project Setup
- Initialize a new React Native project (using CLI or Expo):
  ```bash
  npx react-native init BestVersionOfYourself
  # OR
  npx create-expo-app BestVersionOfYourself
  ```
- Install required native dependencies:
  ```bash
  npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage
  npm install @react-native-google-signin/google-signin
  npm install moti react-native-reanimated react-native-skeleton-placeholder
  ```

## 2. Code Migration
We have prepared specific files for the React Native implementation to address performance and offline risks.

### **State Management & Offline Data (Risk A)**
- **File:** `src/store/AppContext.native.tsx`
- **Action:** Replace your web `AppContext` with this file in the RN project.
- **Key Feature:** Uses `firestore().onSnapshot()` with `includeMetadataChanges: true`. This delegates offline persistence to the native SDK (SQLite), preventing data loss and eliminating the need for manual "optimistic updates".

### **List Performance**
- **File:** `src/components/dashboard/EntryList.native.tsx`
- **Action:** Use this component instead of the `.map()` based web list.
- **Key Feature:** Uses `<FlatList />` with `initialNumToRender` and `removeClippedSubviews` to handle large lists (1000+ items) without lagging.

## 3. UX/UI Guidelines for App Store

### **Permissions (iOS Info.plist)**
**Important:** When requesting camera or photo library access, you must provide a specific usage description in `Info.plist`. Generic descriptions like "We need access" will be rejected.

**Required Keys:**
- `NSCameraUsageDescription`: "The app needs access to the camera to take photos of your food for AI calorie analysis and expense tracking."
- `NSPhotoLibraryUsageDescription`: "The app needs access to your photo library to select food photos for AI calorie analysis and expense tracking."

### **SafeArea (Crucial for iOS)**
Wrap your main screen content in `SafeAreaView` to avoid overlapping with the notch or Dynamic Island.

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

return (
  <SafeAreaView style={{ flex: 1 }}>
    <YourContent />
  </SafeAreaView>
);
```

### **Loading States (Skeleton)**
Avoid full-screen spinners. Use Skeleton Placeholders for a premium feel.

```tsx
import SkeletonPlaceholder from "react-native-skeleton-placeholder";

// Example
<SkeletonPlaceholder>
  <SkeletonPlaceholder.Item flexDirection="row" alignItems="center">
    <SkeletonPlaceholder.Item width={60} height={60} borderRadius={50} />
    <SkeletonPlaceholder.Item marginLeft={20}>
      <SkeletonPlaceholder.Item width={120} height={20} borderRadius={4} />
      <SkeletonPlaceholder.Item marginTop={6} width={80} height={20} borderRadius={4} />
    </SkeletonPlaceholder.Item>
  </SkeletonPlaceholder.Item>
</SkeletonPlaceholder>
```

### **Alerts & destructive Actions**
iOS requires destructive actions (like Delete) to be red.

```tsx
import { Alert } from 'react-native';

const confirmDelete = () => {
  Alert.alert(
    "Delete Entry?",
    "This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", // Shows as RED on iOS
        onPress: () => deleteEntry(id) 
      }
    ]
  );
};
```

## 4. Backend Optimization (Risk B)
The Cloud Function in `functions/src/index.ts` has already been updated to use **Chunking (Batching)**. This prevents "Batch too large" errors when archiving old data.

## 5. Next Steps
1. Copy the logic from `src/store/AppContext.native.tsx` to your new RN project.
2. Copy `src/components/dashboard/EntryList.native.tsx`.
3. Ensure you follow the UI guidelines above for the App Store review process.
