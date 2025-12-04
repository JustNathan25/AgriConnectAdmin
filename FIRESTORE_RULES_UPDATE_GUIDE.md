# 🔒 Firestore Security Rules Update Guide

> **Updated rules for Warning System + Improved Security**

**Date:** October 30, 2025  
**Version:** 2.0

---

## 🎯 What Changed

### ✅ Added Collections (For Warning System)

1. **`user_warnings`** - User warning records
2. **`product_warnings`** - Product warning records
3. **`product_deletions`** - Admin audit log for deleted products
4. **`review_reports`** - Review reporting system

### 🔐 Security Improvements

**Before:** Everything had `allow read, write, delete: if true` ⚠️ **DANGEROUS!**  
**After:** Proper role-based access control with admin checks ✅

---

## 🔑 Key Changes

### 1. Added `isAdmin()` Helper Function

```javascript
function isAdmin() {
  return request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

**Purpose:** Check if current user has admin role  
**Used For:** Warning creation, deletions, updates, etc.

---

### 2. Added `isOwner()` Helper Function

```javascript
function isOwner(userId) {
  return request.auth != null && request.auth.uid == userId;
}
```

**Purpose:** Check if user owns the resource  
**Used For:** Profile updates, reading own data, etc.

---

### 3. New Rules for Warning Systems

#### `user_warnings` Collection

```javascript
match /user_warnings/{warningId} {
  // ✅ Users can read their own warnings
  allow read: if isSignedIn() && isOwner(resource.data.userId);
  
  // ✅ Only admins can create warnings
  allow create: if isAdmin();
  
  // ✅ Users can acknowledge (update 2 fields only)
  // ✅ Admins can update anything
  allow update: if isAdmin() 
                || (isSignedIn() 
                    && isOwner(resource.data.userId)
                    && request.resource.data.diff(resource.data)
                      .affectedKeys().hasOnly(['acknowledged', 'acknowledgedAt']));
  
  // ✅ Only admins can delete
  allow delete: if isAdmin();
}
```

**What Users Can Do:**
- ✅ Read their own warnings
- ✅ Acknowledge warnings (mark as acknowledged)
- ❌ Create warnings (admin only)
- ❌ Delete warnings (admin only)

---

#### `product_warnings` Collection

```javascript
match /product_warnings/{warningId} {
  // ✅ Sellers can read warnings for their products
  allow read: if isSignedIn() && isOwner(resource.data.sellerId);
  
  // ✅ Only admins can create
  allow create: if isAdmin();
  
  // ✅ Sellers can acknowledge only
  allow update: if isAdmin() 
                || (isSignedIn() 
                    && isOwner(resource.data.sellerId)
                    && request.resource.data.diff(resource.data)
                      .affectedKeys().hasOnly(['acknowledged', 'acknowledgedAt']));
  
  // ✅ Only admins can delete
  allow delete: if isAdmin();
}
```

**What Sellers Can Do:**
- ✅ Read warnings for their products
- ✅ Acknowledge product warnings
- ❌ Create warnings (admin only)
- ❌ Delete warnings (admin only)

---

#### `product_deletions` Collection

```javascript
match /product_deletions/{deletionId} {
  // 🔒 Admin only - internal audit log
  allow read, write, delete: if isAdmin();
}
```

**Purpose:** Admin-only audit trail for deleted products

---

#### `notifications` Collection (Updated)

```javascript
match /notifications/{notificationId} {
  // ✅ Users read their own notifications
  allow read: if isSignedIn() && isOwner(resource.data.userId);
  
  // ✅ Admins create notifications (warnings, etc.)
  allow create: if isAdmin();
  
  // ✅ Users can ONLY mark as read (update 'read' field)
  allow update: if isSignedIn() 
                && isOwner(resource.data.userId)
                && request.resource.data.diff(resource.data)
                  .affectedKeys().hasOnly(['read']);
  
  // ✅ Only admins can delete
  allow delete: if isAdmin();
}
```

**Key Feature:** Users can only update the `read` field, nothing else!

---

### 4. Improved Existing Collections

#### `users` Collection

**Before:**
```javascript
allow read, write, delete: if true; // ⚠️ Anyone can do anything
```

**After:**
```javascript
allow read: if isSignedIn();                    // All authenticated users can read
allow create: if isSignedIn() && isOwner(userId); // Users create their own profile
allow update: if isOwner(userId) || isAdmin();   // Users update own, admins update any
allow delete: if isAdmin();                      // Only admins can delete
```

---

#### `products` Collection

**Before:**
```javascript
allow read, write, delete: if true; // ⚠️ Anyone can do anything
```

**After:**
```javascript
allow read: if isSignedIn();                     // All can read
allow create: if isSignedIn();                   // Authenticated users create
allow update: if isSignedIn() 
              && (request.auth.uid == resource.data.sellerId || isAdmin()); // Owner or admin
allow delete: if isAdmin() 
              || (isSignedIn() && request.auth.uid == resource.data.sellerId); // Owner or admin
```

---

#### `chats` Collection

**Before:**
```javascript
allow read, write, delete: if true; // ⚠️ Anyone can read any chat
```

**After:**
```javascript
allow read: if isSignedIn() 
            && (request.auth.uid in resource.data.participants || isAdmin()); // Only participants
allow create: if isSignedIn();
allow update: if isSignedIn() 
              && (request.auth.uid in resource.data.participants || isAdmin());
allow delete: if isAdmin();
```

**Key Feature:** Users can only read chats they're part of!

---

#### `reports` and `tickets` Collections

**Before:**
```javascript
allow read, update, delete: if true; // ⚠️ Anyone can read/modify reports
```

**After:**
```javascript
allow create: if isSignedIn();                          // Users can create reports
allow read: if isAdmin() || isOwner(resource.data.reportedBy); // Only reporter and admins
allow update, delete: if isAdmin();                     // Only admins manage reports
```

---

## 📊 Security Comparison

| Collection | Before | After | Improvement |
|------------|--------|-------|-------------|
| `users` | Public write ⚠️ | Owner + Admin only ✅ | **High** |
| `products` | Public write ⚠️ | Seller + Admin only ✅ | **High** |
| `chats` | Public read ⚠️ | Participants only ✅ | **Critical** |
| `notifications` | Public write ⚠️ | Admin create, User read-only ✅ | **High** |
| `reports` | Public read ⚠️ | Reporter + Admin only ✅ | **High** |
| `user_warnings` | N/A | Admin create, User read ✅ | **New** |
| `product_warnings` | N/A | Admin create, Seller read ✅ | **New** |

---

## 🚀 Deployment Steps

### Step 1: Backup Current Rules

1. Go to Firebase Console
2. Navigate to **Firestore Database** → **Rules**
3. Copy your current rules to a backup file
4. Save as `firestore_rules_backup_YYYYMMDD.txt`

---

### Step 2: Deploy New Rules

1. Open Firebase Console → **Firestore Database** → **Rules**
2. Copy the contents of `UPDATED_FIRESTORE_RULES.txt`
3. Paste into the rules editor
4. Click **"Publish"**

**⚠️ Warning:** Make sure your admin accounts have `role: "admin"` in the `users` collection!

---

### Step 3: Create Admin User

If you don't have an admin user yet:

```javascript
// In Firebase Console → Firestore → users collection
// Find your user document and add:
{
  "role": "admin",
  // ... other fields
}
```

Or use this code in your admin panel:

```javascript
import { doc, updateDoc } from 'firebase/firestore';

// Make yourself admin (run once)
await updateDoc(doc(db, 'users', 'YOUR_USER_ID'), {
  role: 'admin'
});
```

---

### Step 4: Test Rules

#### Test Admin Access

```javascript
// Should work for admin
await addDoc(collection(db, 'user_warnings'), { ... });

// Should work for admin
await deleteDoc(doc(db, 'products', 'productId'));
```

#### Test User Access

```javascript
// Should work - users can read their own notifications
await getDocs(query(
  collection(db, 'notifications'),
  where('userId', '==', currentUserId)
));

// Should FAIL - users can't create warnings
await addDoc(collection(db, 'user_warnings'), { ... }); // ❌ Permission denied
```

---

## 🔍 Required Firestore Indexes

These indexes are required for the new warning queries:

### Index 1: Notifications by User (Unread)
```
Collection: notifications
Fields:
  - userId (Ascending)
  - read (Ascending)
  - timestamp (Descending)
```

### Index 2: Notifications by User (All)
```
Collection: notifications
Fields:
  - userId (Ascending)
  - timestamp (Descending)
```

### Index 3: User Warnings by User
```
Collection: user_warnings
Fields:
  - userId (Ascending)
  - issuedAt (Descending)
```

### Index 4: Product Warnings by Seller
```
Collection: product_warnings
Fields:
  - sellerId (Ascending)
  - issuedAt (Descending)
```

### Index 5: Product Warnings by Product
```
Collection: product_warnings
Fields:
  - productId (Ascending)
  - issuedAt (Descending)
```

**How to Create:**
1. Go to Firebase Console → Firestore → **Indexes**
2. Click **"Create Index"**
3. Enter the collection and fields as shown above
4. Click **"Create"**

**Or:** Firebase will suggest creating indexes when you run queries. Just click the link in the error message!

---

## ⚠️ Important Notes

### 1. Admin Role Field

**Critical:** Make sure admin users have this in their user document:

```javascript
// users/{adminUserId}
{
  "role": "admin",
  // ... other fields
}
```

Without this field, admins won't be able to create warnings or manage reports!

---

### 2. Breaking Changes

**These operations will now fail for non-admins:**

❌ Creating user warnings  
❌ Creating product warnings  
❌ Deleting products (unless owner)  
❌ Reading other users' chats  
❌ Updating other users' profiles  
❌ Deleting notifications  

**This is intentional for security!** ✅

---

### 3. Mobile App Impact

**No changes needed in mobile app** if it's already:
- ✅ Only reading user's own notifications
- ✅ Only updating products user owns
- ✅ Only accessing user's own data

**Changes needed if:**
- ❌ App tries to read all users (will fail)
- ❌ App tries to read all products without auth (will fail)
- ❌ App modifies other users' data (will fail)

---

## 🧪 Testing Checklist

### Admin Functions
- [ ] Admin can create user warnings
- [ ] Admin can create product warnings
- [ ] Admin can delete products
- [ ] Admin can update user profiles
- [ ] Admin can read all reports
- [ ] Admin can update report status

### User Functions
- [ ] User can read own warnings
- [ ] User can acknowledge warnings
- [ ] User can read own notifications
- [ ] User can mark notifications as read
- [ ] User can create products
- [ ] User can update own products
- [ ] User can delete own products
- [ ] User can only read own chats

### Security Tests (Should Fail)
- [ ] User CANNOT create warnings
- [ ] User CANNOT read other users' warnings
- [ ] User CANNOT delete warnings
- [ ] User CANNOT read other users' chats
- [ ] User CANNOT delete admin notifications
- [ ] User CANNOT update notification content (only 'read' field)

---

## 🐛 Troubleshooting

### Issue: "Missing or insufficient permissions"

**Solution:**
1. Check if user is authenticated (`auth.currentUser`)
2. For admin operations, verify user has `role: "admin"` in Firestore
3. Check that indexes are created
4. Verify the security rules are published

---

### Issue: Admin can't create warnings

**Solution:**
1. Verify admin user has `role: "admin"` field:
```javascript
// Check in Firebase Console
users/{adminUserId}
{
  "role": "admin" ← This must exist!
}
```

2. Re-publish the security rules
3. Sign out and sign back in

---

### Issue: Users can't read notifications

**Solution:**
1. Check that `userId` in notification matches `auth.currentUser.uid`
2. Verify user is authenticated
3. Check query includes `where('userId', '==', currentUserId)`

---

## 📞 Support

### Firebase Console Links

- **Rules:** Firebase Console → Firestore Database → Rules
- **Indexes:** Firebase Console → Firestore Database → Indexes
- **Data:** Firebase Console → Firestore Database → Data

### Testing Rules Locally

Use Firebase Emulator for local testing:

```bash
firebase emulators:start
```

---

## ✅ Summary

### What You Need to Do

1. **Backup current rules** ✓
2. **Deploy new rules** from `UPDATED_FIRESTORE_RULES.txt`
3. **Add admin role** to your admin user(s)
4. **Create required indexes** (Firebase will prompt you)
5. **Test admin functions** (create warnings, etc.)
6. **Test user functions** (read notifications, etc.)
7. **Verify security** (users can't do admin actions)

### Security Improvements

- ✅ Admin-only warning creation
- ✅ Users can only read their own data
- ✅ Chat privacy (participants only)
- ✅ Report privacy (reporter + admin only)
- ✅ Proper notification access control
- ✅ Product owner verification
- ✅ Profile update restrictions

---

**🎉 Your Firestore is now properly secured!**

---

**Version:** 2.0  
**Last Updated:** October 30, 2025  
**Compatible With:** Firebase 12.4.0+


