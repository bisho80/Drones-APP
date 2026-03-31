import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext({
  language: "en",
  toggleLanguage: () => {},
  t: (key) => key
});

const translations = {
  en: {
    appTitle: "Drone Command Center",
    dashboard: "Dashboard",
    drones: "Drones",
    flightRequest: "Flight Request",
    adminRequests: "Admin Requests",
    airForceOps: "Air Force Ops",
    masterData: "Master Data",
    notifications: "Notifications",
    logout: "Logout",
    loginTitle: "Drone System Login",
    username: "Username",
    password: "Password",
    signingIn: "Signing in...",
    login: "Login",
    permitRequestForm: "Permit Request Form",
    permitTracking: "Permit Tracking",
    adminReadonlyPermitInfo: "Admins and super admins can monitor permits here. New requests are submitted by users only.",
    submitPermit: "Submit Permit",
    submitCash: "Submit Cash Payment",
    waitingAdmin: "Waiting admin / license"
  },
  ar: {
    appTitle: "مركز قيادة الطائرات المسيّرة",
    dashboard: "لوحة التحكم",
    drones: "الطائرات",
    flightRequest: "طلب الطيران",
    adminRequests: "طلبات الإدارة",
    airForceOps: "عمليات القوات الجوية",
    masterData: "البيانات الأساسية",
    notifications: "الإشعارات",
    logout: "تسجيل الخروج",
    loginTitle: "تسجيل الدخول للنظام",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    signingIn: "جاري تسجيل الدخول...",
    login: "دخول",
    permitRequestForm: "نموذج طلب التصريح",
    permitTracking: "متابعة التصاريح",
    adminReadonlyPermitInfo: "يمكن للإدمن والسوبر إدمن المتابعة هنا فقط. إنشاء الطلبات متاح للمستخدمين فقط.",
    submitPermit: "إرسال الطلب",
    submitCash: "تقديم دفع نقدي",
    waitingAdmin: "بانتظار الإدارة / الترخيص"
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("app_language") || "en");

  useEffect(() => {
    localStorage.setItem("app_language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      toggleLanguage: () => setLanguage((prev) => (prev === "en" ? "ar" : "en")),
      t: (key) => translations[language]?.[key] ?? key
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}

