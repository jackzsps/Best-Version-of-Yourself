#import "SceneDelegate.h"
#import "AppDelegate.h"

@implementation SceneDelegate

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions {
  AppDelegate *appDelegate =
      (AppDelegate *)[[UIApplication sharedApplication] delegate];
  if ([appDelegate respondsToSelector:@selector
                   (application:
                       configurationForConnectingSceneSession:options:)]) {
    // 讓 RCTAppDelegate 處理 UIWindow 的建立
    // 自 React Native 0.74+ 開始，RCTAppDelegate 已經內建了對 SceneDelegate
    // 的支援， 但專案結構上通常需要我們將 window property 暴露出來。
    self.window = appDelegate.window;
  }

  if ([scene isKindOfClass:[UIWindowScene class]]) {
    self.window.windowScene = (UIWindowScene *)scene;
  }
}

@end
