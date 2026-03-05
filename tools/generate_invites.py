import json
import random
import string
import os

def generate_invites(count=200):
    invites = {}
    for i in range(1, count + 1):
        # Generate format: JOBOS-XXXX-XXXX
        part1 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        code = f"JOBOS-{part1}-{part2}"
        
        # Account mapping: account_001, account_002...
        account_name = f"account_{i:03d}"
        invites[code] = account_name
        
    # Also add a master backdoor for testing
    invites["ADMIN-TEST-CODE"] = "test_admin"
        
    out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "invites.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(invites, f, indent=4)
        
    print(f"✅ 成功生成 {count} 个内测码，已保存至 {out_path}")
    print("示例内测码：")
    sample_keys = list(invites.keys())[:5]
    for k in sample_keys:
        print(f"  {k} -> {invites[k]}")

if __name__ == "__main__":
    generate_invites()
