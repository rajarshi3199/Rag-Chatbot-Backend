# 🚀 Quick Start Guide - No More Port Conflicts!

## The Problem (Solved!)
Previously, you had to manually kill processes on port 5000 every time. **This is now automated!**

---

## ✅ NEW: Automatic Port Cleanup Script

I've created `start-backend.bat` that automatically:
1. ✅ Finds any process using port 5000
2. ✅ Kills it automatically
3. ✅ Starts the backend server fresh

---

## 🎯 From Now On, Use This Command:

### Option 1: Double-click the file (Easiest)
```
Just double-click: start-backend.bat
```

### Option 2: From PowerShell/CMD
```bash
cd C:\Users\HP\Desktop\Workspace\rag-chatbot\backend
.\start-backend.bat
```

### Option 3: Using npm (shortcut)
```bash
cd backend
npm run dev:safe
```

---

## 📋 What Each Script Does

### `start-backend.bat` (Recommended - Works Everywhere)
- ✅ No permission issues
- ✅ Auto-kills port conflicts
- ✅ Starts server automatically
- ✅ Works on all Windows versions

### `start-backend.ps1` (PowerShell version)
- Requires execution policy change
- More detailed output
- Use if you prefer PowerShell

### `npm run dev` (Original - May Cause Conflicts)
- Doesn't auto-kill old processes
- Can fail with EADDRINUSE error
- Use only if port is guaranteed free

---

## 🔧 How It Works

**Before (Manual Process):**
```bash
# 1. Check what's using port 5000
netstat -ano | findstr :5000

# 2. Kill the process manually
taskkill /PID <process_id> /F

# 3. Start backend
npm run dev
```

**Now (Automatic):**
```bash
# Just run this - it does everything!
.\start-backend.bat
```

---

## 📝 Quick Reference

| Command | When to Use | Auto-Kill Port? |
|---------|-------------|-----------------|
| `.\start-backend.bat` | **Always use this** | ✅ Yes |
| `npm run dev:safe` | Same as above | ✅ Yes |
| `npm run dev` | Only if port is free | ❌ No |

---

## 🛠️ Troubleshooting

### If the script doesn't work:

**1. Permission Error?**
```bash
# Right-click start-backend.bat → Run as Administrator
```

**2. Script not found?**
```bash
# Make sure you're in the backend folder:
cd C:\Users\HP\Desktop\Workspace\rag-chatbot\backend
```

**3. Port still in use?**
```bash
# Manually kill all node processes:
taskkill /F /IM node.exe

# Then run the script again:
.\start-backend.bat
```

---

## 🎯 Best Practice Workflow

### Starting Your Work:
```bash
# 1. Open terminal in backend folder
cd C:\Users\HP\Desktop\Workspace\rag-chatbot\backend

# 2. Run the auto-cleanup script
.\start-backend.bat

# Done! Backend is running on port 5000
```

### Stopping the Backend:
```
Press Ctrl+C in the terminal
```

### Restarting:
```bash
# Just run the script again - it handles everything!
.\start-backend.bat
```

---

## 📦 Files Created

- ✅ `start-backend.bat` - Auto-cleanup batch script (Windows)
- ✅ `start-backend.ps1` - PowerShell version (requires execution policy)
- ✅ Updated `package.json` - Added `dev:safe` command

---

## 🔒 Bonus: These Scripts Are Git-Safe!

The scripts don't contain any API keys, so they're **safe to commit to Git**.

---

## 💡 Pro Tip

**Create a desktop shortcut:**
1. Right-click `start-backend.bat`
2. Send to → Desktop (create shortcut)
3. Now you can start the backend with one click!

---

**No more port conflicts! Your backend will always start cleanly.** 🎉
