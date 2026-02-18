#import "AppDelegate.h"
#import <Firebase/Firebase.h>
#import <Foundation/Foundation.h>
#import <React/RCTBundleURLProvider.h>
#import <UIKit/UIKit.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [FIRApp configure];
  self.moduleName = @"BestVersionOfYourself";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application
      didFinishLaunchingWithOptions:launchOptions];
}

// 👇👇👇 [修正] 解決 UIScene lifecycle 警告 👇👇👇
// (已移除) 由於我們移除了 Info.plist 中的 Manifest，這裡也必須移除對應的 Scene
// Session 方法， 以回退到標準的 AppDelegate 生命週期。 👆👆👆 [修正] 結束
// 👆👆👆

// 👇👇👇 [關鍵修正] 強制關閉 Bridgeless 模式 👇👇👇
// 這會解決 "RCTEventEmitter" 找不到模組的崩潰問題
- (BOOL)bridgelessEnabled {
  return NO;
}
// 👆👆👆 [關鍵修正] 結束 👆👆👆

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  NSURL *bundleURL = [self bundleURL];

  NSLog(@"🔍 [AppDelegate] 正在獲取 sourceURLForBridge...");

#if DEBUG
  NSLog(@"🔍 [AppDelegate] 編譯模式: DEBUG");
#else
  NSLog(@"🔍 [AppDelegate] 編譯模式: RELEASE");
#endif

  if (bundleURL == nil) {
    NSLog(@"❌ [AppDelegate] 嚴重錯誤！bundleURL 回傳 nil。React Native "
          @"將無法載入 JS。");
  } else {
    NSLog(@"✅ [AppDelegate] 決定載入 Bundle URL: %@", bundleURL);

    // 如果是檔案路徑，檢查檔案是否存在
    if ([bundleURL isFileURL]) {
      if ([[NSFileManager defaultManager] fileExistsAtPath:bundleURL.path]) {
        NSLog(@"✅ [AppDelegate] 離線 Bundle 檔案確實存在於路徑: %@",
              bundleURL.path);
      } else {
        NSLog(@"❌ [AppDelegate] 嚴重錯誤！雖然 URL "
              @"指向檔案，但該路徑下檔案不存在！路徑: %@",
              bundleURL.path);
        NSLog(@"💡 [提示] 請檢查 Build Phases 中的 'Bundle React Native code "
              @"and images' 是否執行成功。");
      }
    }
  }

  return bundleURL;
}

- (NSURL *)bundleURL {
#if DEBUG
  return
      [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  // 在 Release 模式下，我們明確要求從 Bundle 載入 main.jsbundle
  NSURL *url = [[NSBundle mainBundle] URLForResource:@"main"
                                       withExtension:@"jsbundle"];
  return url;
#endif
}

@end
