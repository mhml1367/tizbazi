# ساخت اپ اندروید (TWA) برای کافه‌بازار

اپ اندروید فقط یک «پوستهٔ» روی همین وب‌اپ است. خود بازی‌ها روی سرور می‌مانند و هر بار که سایت به‌روز شود، اپ هم به‌روز می‌شود.

## پیش‌نیازها

1. **سایت باید روی HTTPS باشد** (مثلاً `https://tizbazi.example.ir`). TWA روی `http` کار نمی‌کند.
2. در `.env` سرور دو مقدار بگذارید و سرور را دوباره بالا بیاورید (مقدار دوم در مرحلهٔ ۶ به‌دست می‌آید):
   ```
   TWA_PACKAGE=ir.tizbazi.app
   TWA_SHA256=AA:BB:...
   ```
   این‌ها از `https://دامنه/.well-known/assetlinks.json` سرو می‌شوند.
3. بعد از انتشار، `https://دامنه/manifest.webmanifest` و `/sw.js` باید باز شوند. در Chrome DevTools ← Application ← Manifest هم بدون خطا باشد.

## مراحل در Android Studio

### ۱. پروژهٔ جدید
- File ← New ← New Project ← **No Activity** ← Next
- Name: `تیزبازی` یا `Tizbazi`
- Package name: `ir.tizbazi.app` (همان مقدار `TWA_PACKAGE`)
- Language: Kotlin، Minimum SDK: API 23

### ۲. وابستگی
در `app/build.gradle.kts` داخل `dependencies`:
```kotlin
implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
```
سپس Sync Now.

در `app/build.gradle.kts` (بخش `android { defaultConfig { … } }`) این‌ها را هم تنظیم کنید:
```kotlin
manifestPlaceholders["hostName"] = "tizbazi.example.ir"   // دامنهٔ خودتان
manifestPlaceholders["defaultUrl"] = "https://tizbazi.example.ir/"
manifestPlaceholders["launcherName"] = "تیزبازی"
```

### ۳. AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="${launcherName}"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.NoActionBar">

        <meta-data android:name="asset_statements" android:resource="@string/asset_statements" />

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true">
            <meta-data android:name="android.support.customtabs.trusted.DEFAULT_URL" android:value="${defaultUrl}" />
            <meta-data android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR" android:resource="@color/tiz_green" />
            <meta-data android:name="android.support.customtabs.trusted.NAVIGATION_BAR_COLOR" android:resource="@color/tiz_bg" />
            <meta-data android:name="android.support.customtabs.trusted.SPLASH_IMAGE_DRAWABLE" android:resource="@drawable/splash" />
            <meta-data android:name="android.support.customtabs.trusted.SPLASH_SCREEN_BACKGROUND_COLOR" android:resource="@color/tiz_bg" />
            <meta-data android:name="android.support.customtabs.trusted.SPLASH_SCREEN_FADE_OUT_DURATION" android:value="300" />
            <meta-data android:name="android.support.customtabs.trusted.FILE_PROVIDER_AUTHORITY" android:value="${applicationId}.fileprovider" />

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${hostName}" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/filepaths" />
        </provider>
    </application>
</manifest>
```

فایل‌های منبعی که بالا به آن‌ها اشاره شده:

- `res/values/colors.xml`
  ```xml
  <resources>
      <color name="tiz_green">#0A7F66</color>
      <color name="tiz_bg">#050B14</color>
  </resources>
  ```
- `res/values/strings.xml`
  ```xml
  <resources>
      <string name="app_name">تیزبازی</string>
      <string name="asset_statements" translatable="false">
          [{ \"relation\": [\"delegate_permission/common.handle_all_urls\"],
             \"target\": {\"namespace\": \"web\", \"site\": \"https://tizbazi.example.ir\"}}]
      </string>
  </resources>
  ```
- `res/xml/filepaths.xml`
  ```xml
  <paths>
      <files-path path="twa_splash/" name="twa_splash" />
  </paths>
  ```
- `res/drawable/splash.png`: همان `public/icons/icon-512.png` (فایل را در پوشهٔ drawable کپی کنید و اسمش را `splash.png` بگذارید).

### ۴. آیکون اپ
Right-click روی `res` ← New ← **Image Asset** ← Icon Type: Launcher Icons (Adaptive and Legacy).
- Foreground Layer: Source Asset = Image ← `public/icons/maskable-512.png`، Resize حدود ۸۰٪
- Background Layer: Color = `0A7F66`

### ۵. امضا و خروجی
Build ← Generate Signed App Bundle / APK ← **APK** (یا AAB، هر کدام بازار بخواهد) ← Create new keystore.
- فایل keystore و رمزش را حتماً چند جا نگه دارید؛ برای هر به‌روزرسانی همین کلید لازم است.
- نوع build: release

### ۶. اثرانگشت کلید (SHA-256)
در ترمینال:
```
keytool -list -v -keystore tizbazi.jks -alias key0
```
مقدار `SHA256:` را کپی کنید و در `.env` سرور به‌عنوان `TWA_SHA256` بگذارید و سرور را دوباره راه بیندازید. بعد این آدرس باید همان بسته و اثرانگشت را نشان دهد:
`https://دامنه/.well-known/assetlinks.json`

### ۷. امتحان
اپ را روی گوشی نصب کنید. اگر **نوار آدرس بالای صفحه دیده می‌شود**، یعنی تأیید دامنه نشده است: بسته، اثرانگشت یا HTTPS را بررسی کنید.
با adb هم می‌شود دید:
```
adb shell pm get-app-links ir.tizbazi.app
```

### ۸. بارگذاری در کافه‌بازار
APK را در پنل توسعه‌دهنده آپلود کنید. معمولاً لازم است: آیکون ۵۱۲، چند اسکرین‌شات از داخل بازی، توضیحات فارسی و لینک سیاست حریم خصوصی. (موارد دقیق را از راهنمای خود بازار هم بررسی کنید.)

## راه سریع‌تر بدون Android Studio
`npx @bubblewrap/cli init --manifest https://دامنه/manifest.webmanifest` و بعد `npx @bubblewrap/cli build` همین پروژه را خودکار می‌سازد و فایل امضا و اثرانگشت را هم چاپ می‌کند.
