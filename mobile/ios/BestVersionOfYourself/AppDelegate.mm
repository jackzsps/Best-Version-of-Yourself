#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"BestVersionOfYourself";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// 👇👇👇 [關鍵修正] 強制關閉 Bridgeless 模式 👇👇👇
// 這會解決 "RCTEventEmitter" 找不到模組的崩潰問題
- (BOOL)bridgelessEnabled
{
    return NO;
}
// 👆👆👆 [關鍵修正] 結束 👆👆👆

// 👇 你的偵探日誌 (保留)
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  NSURL *bundleURL = [self bundleURL];
  
  // 🕵️‍♂️ [偵探報告] 這兩行會把真實的運作狀況印在 Xcode 控制台
  if (bundleURL == nil) {
      NSLog(@"🔍 [偵探報告] 嚴重錯誤！bundleURL 是 nil。React Native 不知道去哪裡找 Metro。");
  } else {
      NSLog(@"🔍 [偵探報告] App 正在嘗試連線到: %@", bundleURL);
  }
  
  return bundleURL;
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end