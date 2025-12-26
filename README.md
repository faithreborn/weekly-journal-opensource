<p align="center">
  <img src="https://img.icons8.com/emoji/96/open-book-emoji.png" alt="Weekly Journal Logo" width="80"/>
</p>

<h1 align="center">Weekly Journal 📔</h1>

<p align="center">
  <strong>A beautiful couples' journal app to share your weekly moments</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Capacitor-Mobile-119EFF?style=flat-square&logo=capacitor" alt="Capacitor"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"/>
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Multiple Entry Types** | Diary, photos, quotes, questions, sad/happy moments, notes |
| 👀 **Partner View** | See your partner's entries on specific days (configurable) |
| 📁 **Weekly Archives** | Automatically archive weeks as beautiful HTML pages |
| 🌙 **Dark Mode** | Eye-friendly dark theme |
| 📱 **Cross-Platform** | Web, iOS, and Android support |
| ☁️ **Cloud Sync** | Real-time sync across all devices with Supabase |
| 🔐 **Simple Auth** | Access key-based authentication for couples |
| 🖼️ **Image Support** | Upload and compress images automatically |
| 🚀 **CI/CD** | Automated builds with GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- [Supabase](https://supabase.com) account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/weekly-journal.git
cd weekly-journal
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)

2. Go to **SQL Editor** and run the migrations:

```sql
-- Run contents of: supabase/migrations/20251225_create_journal_entries.sql
-- Run contents of: supabase/migrations/20251226_add_storage_and_archives.sql
```

3. Create **Storage Buckets**:
   - `journal-images` (public)
   - `journal-archives` (public)

4. Copy your **Project URL** and **Anon Key** from Settings → API

### 3. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Customize Access Keys

Edit `src/components/LoginScreen.tsx`:

```typescript
const ACCESS_KEYS: Record<AuthorType, string> = {
  user1: 'your-secret-key-1',  // First user
  user2: 'your-secret-key-2',  // Second user
};
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📱 Mobile Build

### Local Build

#### Android
```bash
npm run build
npx cap sync android
npx cap open android
```

#### iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
```

### 🤖 Automated Builds with GitHub Actions

This project includes GitHub Actions workflows for automated mobile builds!

#### Setup GitHub Actions

1. **Fork/Clone** this repository

2. **Add GitHub Secrets** (Settings → Secrets → Actions):

   **For Android:**
   | Secret | Description |
   |--------|-------------|
   | `ANDROID_KEYSTORE_BASE64` | Base64 encoded keystore file |
   | `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
   | `ANDROID_KEY_ALIAS` | Key alias name |
   | `ANDROID_KEY_PASSWORD` | Key password |

   **For iOS:**
   | Secret | Description |
   |--------|-------------|
   | `IOS_CERTIFICATE_BASE64` | Base64 encoded .p12 certificate |
   | `IOS_CERTIFICATE_PASSWORD` | Certificate password |
   | `IOS_PROVISION_PROFILE_BASE64` | Base64 encoded provisioning profile |

3. **Generate Android Keystore:**
   ```bash
   # Create keystore
   keytool -genkey -v -keystore release.keystore -alias myapp -keyalg RSA -keysize 2048 -validity 10000
   
   # Convert to base64
   base64 release.keystore > keystore.txt
   # Copy contents of keystore.txt to ANDROID_KEYSTORE_BASE64 secret
   ```

4. **Trigger Build:**
   - Push to `main` branch, or
   - Go to Actions → Select workflow → Run workflow

5. **Download Artifacts:**
   - Go to Actions → Select completed run
   - Download APK/IPA from Artifacts section

#### Workflow Files

```
.github/workflows/
├── build-android.yml  # Android APK build
└── build-ios.yml      # iOS IPA build
```

---

## ⚙️ Configuration

### View Days
By default, partners can view each other's entries on **Tuesday** and **Friday**. 

Edit `src/App.tsx`:
```typescript
const isViewDay = isTuesday(today) || isFriday(today);
// Change to any days you want, e.g.:
// const isViewDay = isSaturday(today) || isSunday(today);
```

### Timezone
```typescript
const TIMEZONE = "Africa/Algiers";  // Change to your timezone
```

### Week Start Day
```typescript
const weekStart = startOfWeek(today, { weekStartsOn: 6 }); // 0=Sun, 6=Sat
```

---

## 🗂️ Project Structure

```
├── .github/workflows/     # GitHub Actions CI/CD
│   ├── build-android.yml
│   └── build-ios.yml
├── src/
│   ├── components/
│   │   ├── LoginScreen.tsx    # Access key authentication
│   │   ├── EntryForm.tsx      # Create/edit entries
│   │   ├── EntryList.tsx      # Display entries
│   │   ├── PartnerView.tsx    # View partner's entries
│   │   ├── ArchiveListNew.tsx # Browse archives
│   │   └── PDFPreview.tsx     # Preview weekly journal
│   ├── supabaseClient.ts      # Supabase connection
│   ├── supabaseDb.ts          # Database operations
│   ├── types.ts               # TypeScript types
│   └── App.tsx                # Main app component
├── supabase/migrations/       # Database schema
├── android/                   # Android native project
└── ios/                       # iOS native project
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS with CSS Variables
- **Backend**: Supabase (PostgreSQL + Storage)
- **Mobile**: Capacitor
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **CI/CD**: GitHub Actions

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 💖 Support

If you find this project useful, consider supporting its development:

| Method | Address |
|--------|---------|
| **Binance ID** | `587991886` |
| **USDT (BEP20/BSC)** | `0xd243484573e3bf6b2b0f21947a4b17b29d86e539` |

---

## 📄 License

MIT License - feel free to use this for your own couple's journal!

---

<p align="center">
  Made with 💕 for couples who want to share their moments
</p>
