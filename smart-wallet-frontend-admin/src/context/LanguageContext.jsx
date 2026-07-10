import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LanguageContext = createContext();

const dictionaries = {
  en: {
    appTitle: 'Smart Wallet Admin',
    loginTitle: 'Admin Access',
    loginSubtitle: 'Manage users, agents, policies and compliance from one place.',
    phoneNumber: 'Phone number',
    otpCode: 'OTP code',
    pin: 'PIN',
    continue: 'Continue',
    requestOtp: 'Request OTP',
    verifyOtp: 'Verify OTP',
    verifyPin: 'Verify PIN',
    logout: 'Logout',
    dashboard: 'Dashboard',
    users: 'Users',
    agents: 'Agents',
    configs: 'Level Configs',
    nrc: 'NRC Review',
    audit: 'Audit Logs',
    overview: 'Overview',
    totalUsers: 'Total users',
    pendingAgents: 'Pending agents',
    pendingNrc: 'Pending NRC',
    recentActions: 'Recent actions',
    liveBackend: 'Live backend',
    activeUsers: 'Active users',
    suspendedUsers: 'Suspended users',
    accountStatus: 'Account status',
    search: 'Search',
    status: 'Status',
    approve: 'Approve',
    reject: 'Reject',
    save: 'Save',
    noRecords: 'No records found.',
    selectLanguage: 'Language',
    changeLanguage: 'Burmese',
    backendNote: 'Connected to the Render deployment for admin operations.',
  },
  my: {
    appTitle: 'Smart Wallet Admin',
    loginTitle: 'Admin ဝင်ရန်',
    loginSubtitle: 'အသုံးပြုသူ၊ agent များ၊ policy များနှင့် compliance ကို တစ်နေရာတည်းမှာ စီမံပါ။',
    phoneNumber: 'ဖုန်းနံပါတ်',
    otpCode: 'OTP ကုဒ်',
    pin: 'PIN',
    continue: 'ဆက်လုပ်မယ်',
    requestOtp: 'OTP တောင်းမယ်',
    verifyOtp: 'OTP အတည်ပြုမယ်',
    verifyPin: 'PIN အတည်ပြုမယ်',
    logout: 'အကောင့်ထွက်မယ်',
    dashboard: 'Dashboard',
    users: 'အသုံးပြုသူများ',
    agents: 'Agent များ',
    configs: 'Level Configs',
    nrc: 'NRC စစ်ဆေးမှု',
    audit: 'Audit Log',
    overview: 'အနှစ်ချုပ်',
    totalUsers: 'စုစုပေါင်း အသုံးပြုသူ',
    pendingAgents: 'ခဏကြာဆိုင်းဆဲ Agent',
    pendingNrc: 'ဆိုင်းဆဲ NRC',
    recentActions: 'မကြာသေးမီလုပ်ဆောင်မှု',
    liveBackend: 'Live backend',
    activeUsers: 'အလုပ်လုပ်နေသော အသုံးပြုသူ',
    suspendedUsers: 'ဆိုင်းငံ့ထားသော အသုံးပြုသူ',
    accountStatus: 'အကောင့်အခြေအနေ',
    search: 'ရှာဖွေမယ်',
    status: 'အခြေအနေ',
    approve: 'အတည်ပြုမယ်',
    reject: 'ငြင်းပယ်မယ်',
    save: 'သိမ်းမယ်',
    noRecords: 'ဒေတာမရှိပါ။',
    selectLanguage: 'ဘာသာစကား',
    changeLanguage: 'English',
    backendNote: 'Admin လုပ်ဆောင်ချက်များအတွက် Render deployment ကို အသုံးပြုနေပါသည်။',
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('admin_language') || 'en');

  useEffect(() => {
    localStorage.setItem('admin_language', language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key) => dictionaries[language][key] || key,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
