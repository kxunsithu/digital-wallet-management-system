
# Digital Wallet Management System Specification & Architecture (မြန်မာ)

## အကျဉ်းချုပ်

ဤစာရွက်စာတမ်းသည် **Digital Wallet Management System** ၏ System Architecture, Workflow, User Roles, Security Rules နှင့် Business Rules များကို နားလည်ရလွယ်ကူစေရန် စနစ်တကျ ပြန်လည်ရေးသားထားသော Documentation ဖြစ်သည်။

ဤ Document ကို Developer များ၊ QA Tester များ၊ Project Manager များနှင့် System Administrator များအတွက် ရည်ရွယ်ထားသည်။

---

# 1. Overall System Architecture

Digital Wallet Management System သည် **Hierarchical Wallet Architecture** ကို အသုံးပြုထားပြီး Role (၄) မျိုးဖြင့် လုပ်ဆောင်သည်။

```text
Admin
   │
   ▼
Agent Manager
   │
   ▼
Agent
   │
   ▼
Customer
```

Float သည် အထက်မှအောက်သို့ ဖြန့်ဝေပြီး၊ Float Return သည် အောက်မှအထက်သို့ ပြန်လည်အပ်နှံသည်။

Customer များသည် Customer အချင်းချင်း P2P Transfer ပြုလုပ်နိုင်သည်။

---

# 2. Core Workflows

## Authentication

- Phone Number ဖြင့် OTP အတည်ပြုရမည်။
- OTP အောင်မြင်ပြီးနောက် PIN သတ်မှတ်ရမည်။
- Authentication အောင်မြင်ပါက Laravel Sanctum Bearer Token ထုတ်ပေးသည်။

## Float Distribution

Admin → Agent Manager → Agent

## Customer Services

Agent မှ

- Cash In
- Cash Out
- QR Payment

တို့ကို ဝန်ဆောင်မှုပေးသည်။

## Customer Transfer

Customer များသည်

- Phone Number
- QR Code

ဖြင့် P2P Money Transfer ပြုလုပ်နိုင်သည်။

## KYC

Customer သည် NRC Front/Back Upload တင်သွင်းနိုင်ပြီး

Pending → Verified / Rejected

အဆင့်များဖြင့် Admin မှ စစ်ဆေးသည်။

---

# 3. User Roles

## Admin

### Responsibilities

- Agent Manager စီမံခန့်ခွဲခြင်း
- Float ဖြန့်ဝေခြင်း
- Customer KYC Approval
- System Transaction History ကြည့်ရှုခြင်း
- State / Township Data စီမံခန့်ခွဲခြင်း

---

## Agent Manager

### Responsibilities

- Agent အသစ်ဖန်တီးခြင်း
- Agent Code ထုတ်ပေးခြင်း
- Float ဖြန့်ဝေခြင်း
- Float Return လက်ခံခြင်း
- Agent Wallet များ စောင့်ကြည့်ခြင်း

---

## Agent

### Responsibilities

- Customer Cash In
- Customer Cash Out
- Float Return
- Agent QR အသုံးပြု၍ ငွေလက်ခံခြင်း
- Balance Notification
- PIN Verification

---

## Customer

### Responsibilities

- Send Money
- Receive Money
- Cash Out
- My QR
- Transaction Receipt
- Profile Management
- PIN Management
- KYC Submission

---

# 4. Money Transfer Rules

| Sender | Receiver | Allowed |
|--------|----------|---------|
| Admin | Agent Manager | ✅ |
| Agent Manager | Agent | ✅ |
| Agent Manager | Admin | ✅ |
| Agent | Customer | ✅ |
| Agent | Agent Manager | ✅ |
| Customer | Customer | ✅ |
| Customer | Agent | ✅ |

## Disallowed

- Admin ↔ Customer
- Admin ↔ Agent
- Agent Manager ↔ Customer

---

# 5. Security Rules

- Sender နှင့် Receiver Account နှစ်ခုလုံး Active ဖြစ်ရမည်။
- Wallet Status သည် Active ဖြစ်ရမည်။
- Transaction တိုင်းတွင် PIN Verification ပြုလုပ်ရမည်။
- PIN ကို Bcrypt Hash ဖြင့် သိမ်းဆည်းထားသည်။
- NRC Number နှင့် User Role ကို Account ဖန်တီးပြီးနောက် ပြောင်းလဲခွင့်မရှိ။
- Profile Image နှင့် NRC Images များကို multipart/form-data ဖြင့် Upload ပြုလုပ်ရမည်။

---

# 6. Notifications

Money Received ဖြစ်သည်နှင့်

- Notification သိမ်းဆည်းခြင်း
- Badge Update
- Sound
- Toast Message

တို့ကို Real-time ပြသသည်။

---

# 7. Transaction Receipt

Transaction တိုင်းတွင်

- Unique Transaction Number
- Receipt
- History Record

တို့ကို အလိုအလျောက် ဖန်တီးသည်။

---

# 8. Summary

System သည်

- Hierarchical Wallet Architecture
- Secure Authentication
- Float Management
- Customer Wallet
- QR Payment
- Cash In / Cash Out
- KYC Verification
- Transaction Receipt
- Notification System

တို့ဖြင့် ဖွဲ့စည်းထားပြီး လုံခြုံရေး၊ စနစ်တကျ စီမံခန့်ခွဲမှုနှင့် အသုံးပြုရလွယ်ကူမှုကို ဦးစားပေး ဒီဇိုင်းရေးဆွဲထားသည်။
