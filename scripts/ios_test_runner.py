import sys
import json
import subprocess
import os
import shutil
import uuid

# --- 配置區 ---
PROJECT_WORKSPACE = "mobile/ios/BestVersionOfYourself.xcworkspace" 
PROJECT_SCHEME = "BestVersionOfYourself" # 本專案的 iOS Scheme
MAX_RETRIES = 3
STATE_FILE = ".agent_retry_state.json"

def get_retry_count():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f: return json.load(f).get("count", 0)
    return 0

def update_retry_count(count):
    with open(STATE_FILE, "w") as f: json.dump({"count": count}, f)

def run_ios_tests():
    """執行測試並過濾海量日誌，極致節省 Token"""
    # 執行 xcodebuild (React Native iOS 需要指定 workspace)
    cmd = f"xcodebuild test -workspace {PROJECT_WORKSPACE} -scheme {PROJECT_SCHEME} -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -quiet"
    print(f"正在執行測試指令: {cmd}", file=sys.stderr)
    process = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if process.returncode == 0:
        return True, "✅ 測試全數通過！"
    
    # 【省 Token 關鍵】提煉錯誤訊息，捨棄幾萬行的編譯廢話
    logs = process.stdout + process.stderr
    error_lines = [line.strip() for line in logs.split('\n') if "error:" in line.lower() or "failed" in line.lower() or "exception" in line.lower()]
    compact_error = "\n".join(error_lines[:15]) # 略微增加行數以包含更多 JS/Native 潛在報錯
    
    if not compact_error.strip():
        compact_error = logs[-2000:] # 如果沒抓到關鍵字，回傳最後 2000 個字元
        
    return False, compact_error

def main():
    try:
        # 接收 Antigravity 傳來的 JSON 參數
        input_data = json.loads(sys.stdin.read())
        file_path = input_data["file_path"]
        new_code = input_data["new_code"]

        current_retries = get_retry_count()

        # 1. 斷路器 (Circuit Breaker)：防止 AI 無限迴圈除錯燒光 API 預算
        if current_retries >= MAX_RETRIES:
            print(json.dumps({
                "status": "HALT",
                "message": f"🚨 警告：已達最大重試次數 ({MAX_RETRIES}次)。系統已強制中斷。請停止盲目嘗試，並呼叫人類工程師協助。"
            }))
            return

        # 2. 備份原始檔案 (用於失敗時自動還原)
        backup_path = file_path + ".bak"
        if os.path.exists(file_path): 
            shutil.copy2(file_path, backup_path)
        else:
            # 如果是新檔案，標記為建立
            backup_path = file_path + ".new"
            with open(backup_path, "w") as f: f.write("new")

        try:
            # 3. 寫入 AI 提供的新程式碼
            os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f: f.write(new_code)

            # 4. 強制在背景執行測試
            success, test_output = run_ios_tests()

            if success:
                update_retry_count(0) # 成功則重置計數器
                if os.path.exists(backup_path): os.remove(backup_path)
                
                # 核發通關密碼 (Verification Token)
                pass_token = f"PASS_{uuid.uuid4().hex[:8].upper()}"
                print(json.dumps({
                    "status": "SUCCESS",
                    "verification_token": pass_token,
                    "message": f"程式碼已寫入且測試通過！請使用此通關密碼 '{pass_token}' 來宣告任務完成。"
                }))
            else:
                update_retry_count(current_retries + 1)
                # 失敗：自動還原程式碼 (防止錯誤越改越多，導致架構崩壞)
                if backup_path.endswith(".bak") and os.path.exists(backup_path): 
                    shutil.move(backup_path, file_path)
                elif backup_path.endswith(".new"):
                    if os.path.exists(file_path): os.remove(file_path)
                    os.remove(backup_path)
                
                print(json.dumps({
                    "status": "FAILED",
                    "message": f"❌ 測試未通過，檔案已自動還原。(已重試 {current_retries + 1}/{MAX_RETRIES} 次)\n請分析以下精簡報錯並重新嘗試：\n{test_output}"
                }))

        except Exception as e:
            if backup_path.endswith(".bak") and os.path.exists(backup_path): 
                shutil.move(backup_path, file_path)
            print(json.dumps({"status": "ERROR", "message": f"寫入或測試執行時發生錯誤: {str(e)}"}))

    except Exception as e:
        print(json.dumps({"status": "ERROR", "message": f"腳本讀取參數解析失敗: {str(e)}"}))

if __name__ == "__main__":
    main()
