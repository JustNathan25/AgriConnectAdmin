# 🔒 Firestore Security Rules Review & Fixes

## 🚨 Critical Security Issues Found

### 1. **CHATS Collection - MAJOR VULNERABILITY** ⚠️

**Current Rules (INSECURE):**
```javascript
match /chats/{chatId} {
  allow create: if isSignedIn() 
                || (request.resource.data.isAdminChat == true 
                    && request.resource.data.adminId == "ADMIN_SYSTEM")
                || (request.resource.data.sellerId == "AGRICONNECT_SYSTEM");
}
```

**Problem:** Any user can create admin/system chats by simply setting `adminId: "ADMIN_SYSTEM"` or `sellerId: "AGRICONNECT_SYSTEM"` as strings. These are not authenticated identifiers.

**Fixed Rules:**
```javascript
match /chats/{chatId} {
  allow read: if isSignedIn() 
              && (request.auth.uid in resource.data.participants || isAdmin());
  
  // Only admins can create system/admin chats
  // Regular users can create their own chats
  allow create: if isSignedIn() && (
    // Admin can create any chat (system or regular)
    isAdmin() ||
    // Non-admin can only create non-system chats where they are a participant
    (
      request.resource.data.isAdminChat != true &&
      request.auth.uid in request.resource.data.participants
    )
  );
  
  allow update: if isSignedIn() && (
    // Admin can update any chat
    isAdmin() ||
    // Non-admin can only update non-system chats where they are a participant
    (
      resource.data.isAdminChat != true &&
      request.auth.uid in resource.data.participants
    )
  );
  
  allow delete: if isAdmin();
  
  match /messages/{messageId} {
    allow read: if isSignedIn() 
                && (request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants || isAdmin());
    
    // CRITICAL: Only admins can create system messages
    allow create: if request.auth != null && (
      (
        request.resource.data.system == true &&
        isAdmin()
      ) ||
      (
        request.resource.data.system != true &&
        request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants
      )
    );
    
    // Only users can update their own non-system messages
    allow update: if request.auth != null && (
      resource.data.system != true &&
      request.auth.uid == resource.data.senderId
    );
    
    allow delete: if isAdmin();
  }
}
```

---

### 2. **Collection Name Mismatch** ⚠️

**Problem:** Rules use `payment_transactions` (snake_case) but your code uses `paymentTransactions` (camelCase).

**Current Rule:**
```javascript
match /payment_transactions/{transactionId} {
  // ...
}
```

**Fix:** Change to match your code:
```javascript
match /paymentTransactions/{transactionId} {
  // Users can read their own transactions
  // Admins can read all transactions
  allow read: if isSignedIn() 
              && (isOwner(resource.data.userId) || isAdmin());
  
  // Users can create their own payment transactions
  allow create: if isSignedIn() && isOwner(request.resource.data.userId);
  
  // Only admins can update transactions (verify, approve, reject)
  allow update: if isAdmin();
  
  // Only admins can delete transactions
  allow delete: if isAdmin();
}
```

---

### 3. **Products Update Rule - Potential Issue** ⚠️

**Current Rule:**
```javascript
allow update: if isSignedIn() 
              && (request.auth.uid == resource.data.sellerId 
                  || isAdmin()
                  || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['warningCount', 'lastWarningDate', 'warningLevel']));
```

**Problem:** The `diff().affectedKeys()` check allows ANY signed-in user to update warning fields, not just admins.

**Fixed Rule:**
```javascript
allow update: if isSignedIn() && (
  // Owner can update their product
  request.auth.uid == resource.data.sellerId ||
  // Admin can update anything
  isAdmin() ||
  // System can update warning fields only (when admin sends warning via server/cloud function)
  (
    isAdmin() &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['warningCount', 'lastWarningDate', 'warningLevel'])
  )
);
```

**Better Approach:** Since admins already have full access, simplify:
```javascript
allow update: if isSignedIn() && (
  request.auth.uid == resource.data.sellerId || isAdmin()
);
```

---

### 4. **Users Update Rule - Nested Field Issue** ⚠️

**Current Rule:**
```javascript
allow update: if isOwner(userId) 
              || isAdmin()
              || (isSignedIn() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['warnings']));
```

**Problem:** `diff()` doesn't work well with nested fields like `warnings.count`, `warnings.lastWarningDate`, etc. Also allows any signed-in user to update warnings.

**Fixed Rule:**
```javascript
allow update: if isOwner(userId) || isAdmin();
```

Since admins need to update warnings, they already have access. The `warnings` field should only be updated by admins anyway.

---

## ✅ Complete Fixed Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // =============================
    // 🔹 HELPER FUNCTIONS
    // =============================
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    function isParticipant(chatData) {
      return request.auth != null && 
             request.auth.uid in chatData.participants;
    }

    /* ===========================
       👤 USERS COLLECTION
    =========================== */
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
      
      // Subcollections...
      match /notifications/{notificationId} {
        allow read: if isOwner(userId);
        allow write: if isSignedIn();
        allow delete: if isOwner(userId) || isAdmin();
      }
      
      // ... (keep other subcollections as is)
    }

    /* ===========================
       🛒 PRODUCTS COLLECTION
    =========================== */
    match /products/{productId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        request.auth.uid == resource.data.sellerId || isAdmin()
      );
      allow delete: if isAdmin() 
                    || (isSignedIn() && request.auth.uid == resource.data.sellerId);

      match /reviews/{reviewId} {
        allow read: if isSignedIn();
        allow write: if isSignedIn();
        allow delete: if isSignedIn() || isAdmin();
      }
    }

    /* ===========================
       💬 CHATS COLLECTION (FIXED)
    =========================== */
    match /chats/{chatId} {
      // Read: Users can read chats they participate in, or admins can read all
      allow read: if isSignedIn() 
                  && (isParticipant(resource.data) || isAdmin());
      
      // Create: Admins can create system chats, users can create regular chats
      allow create: if isSignedIn() && (
        isAdmin() ||
        (
          request.resource.data.isAdminChat != true &&
          request.auth.uid in request.resource.data.participants
        )
      );
      
      // Update: Same as create
      allow update: if isSignedIn() && (
        isAdmin() ||
        (
          resource.data.isAdminChat != true &&
          request.auth.uid in resource.data.participants
        )
      );
      
      allow delete: if isAdmin();
      
      match /messages/{messageId} {
        // Read: Users can read messages in chats they participate in
        allow read: if isSignedIn() 
                    && (isParticipant(get(/databases/$(database)/documents/chats/$(chatId)).data) || isAdmin());
        
        // Create: CRITICAL - Only admins can create system messages
        allow create: if request.auth != null && (
          (
            request.resource.data.system == true &&
            isAdmin()
          ) ||
          (
            request.resource.data.system != true &&
            request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants
          )
        );
        
        // Update: Only users can update their own non-system messages
        allow update: if request.auth != null && (
          resource.data.system != true &&
          request.auth.uid == resource.data.senderId
        );
        
        allow delete: if isAdmin();
      }
    }

    /* ===========================
       💰 PAYMENT TRANSACTIONS (FIXED COLLECTION NAME)
    =========================== */
    match /paymentTransactions/{transactionId} {
      allow read: if isSignedIn() 
                  && (isOwner(resource.data.userId) || isAdmin());
      allow create: if isSignedIn() && isOwner(request.resource.data.userId);
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    /* ===========================
       🚨 REPORTS COLLECTION
    =========================== */
    match /reports/{reportId} {
      allow create: if isSignedIn();
      allow read: if isAdmin() || isOwner(resource.data.reportedBy);
      allow update, delete: if isAdmin();
    }

    /* ===========================
       🎫 TICKETS COLLECTION
    =========================== */
    match /tickets/{ticketId} {
      allow create: if isSignedIn();
      allow read: if isAdmin() || isOwner(resource.data.reportedBy);
      allow update, delete: if isAdmin();
    }

    /* ===========================
       ⭐ REVIEWS COLLECTION
    =========================== */
    match /reviews/{reviewId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() 
                    && request.auth.uid == resource.data.reviewerUserId;
      allow delete: if isAdmin() 
                    || (isSignedIn() && request.auth.uid == resource.data.reviewerUserId);
    }
    
    match /review_reports/{reportId} {
      allow create: if isSignedIn();
      allow read: if isAdmin() || isOwner(resource.data.reportedBy);
      allow update, delete: if isAdmin();
    }

    /* ===========================
       🔔 NOTIFICATIONS COLLECTION
    =========================== */
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isSignedIn();
      allow update: if isSignedIn() 
                    && isOwner(resource.data.userId)
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'seen']);
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }

    match /admin_notifications/{notificationId} {
      allow read: if isAdmin();
      allow create: if isSignedIn();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    /* ===========================
       ⚠️ WARNINGS COLLECTIONS
    =========================== */
    match /user_warnings/{warningId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isAdmin();
      allow update: if isAdmin() 
                    || (isSignedIn() 
                        && isOwner(resource.data.userId)
                        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['acknowledged', 'acknowledgedAt']));
      allow delete: if isAdmin();
    }

    match /product_warnings/{warningId} {
      allow read: if isSignedIn() && isOwner(resource.data.sellerId);
      allow create: if isAdmin();
      allow update: if isAdmin() 
                    || (isSignedIn() 
                        && isOwner(resource.data.sellerId)
                        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['acknowledged', 'acknowledgedAt']));
      allow delete: if isAdmin();
    }

    match /product_deletions/{deletionId} {
      allow read, write, delete: if isAdmin();
    }

    /* ===========================
       📋 VERIFICATIONS COLLECTION
    =========================== */
    match /verifications/{userId} {
      allow create: if isSignedIn() && isOwner(userId);
      allow read: if isAdmin() || isOwner(userId);
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    /* ===========================
       🐛 APP REPORTS COLLECTION
    =========================== */
    match /app_reports/{reportId} {
      allow create: if isSignedIn();
      allow read: if isAdmin() || (isSignedIn() && isOwner(resource.data.userId));
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    /* ===========================
       🚀 BOOST HISTORY COLLECTION
    =========================== */
    match /boost_history/{historyId} {
      allow read: if isSignedIn() 
                  && (isOwner(resource.data.userId) || isAdmin());
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    /* ===========================
       💳 PAYMENTS COLLECTION
    =========================== */
    match /payments/{paymentId} {
      allow read: if isSignedIn() 
                  && (isOwner(resource.data.userId) || isAdmin());
      allow create: if isSignedIn();
      allow update, delete: if isAdmin();
    }
  }
}
```

---

## 📋 Summary of Issues

### Critical 🔴
1. **CHATS Collection:** Allows any user to create system chats by spoofing string values
2. **CHATS Messages:** Doesn't properly verify admin privilege for system messages
3. **Collection Name Mismatch:** `payment_transactions` vs `paymentTransactions`

### High Priority 🟠
4. **Products Update:** Allows any user to update warning fields
5. **Users Update:** `diff()` doesn't work with nested fields properly

### Medium Priority 🟡
6. **Performance:** `isAdmin()` does a `get()` read on every check (consider caching or custom claims)

---

## 🔧 Recommended Additional Improvements

### 1. Use Custom Claims for Admin (Performance)
Instead of checking Firestore on every request:

```javascript
function isAdmin() {
  return request.auth != null && request.auth.token.admin == true;
}
```

Then set custom claims via Firebase Admin SDK:
```javascript
await admin.auth().setCustomUserClaims(uid, { admin: true });
```

### 2. Add Field Validation
```javascript
// Ensure participants array exists and is not empty
allow create: if isSignedIn() && (
  request.resource.data.participants is list &&
  request.resource.data.participants.size() > 0 &&
  request.auth.uid in request.resource.data.participants
);
```

### 3. Rate Limiting (Cloud Functions)
Consider adding rate limiting for chat creation to prevent spam.

---

## ✅ Testing Checklist

Before deploying, test in Firebase Console Rules Playground:

- [ ] Regular user cannot create system chat
- [ ] Regular user cannot create system message
- [ ] Admin can create system chat and messages
- [ ] Regular user can create regular chat where they are participant
- [ ] Regular user cannot read other users' chats
- [ ] Payment transactions collection name matches code
- [ ] Only admins can update payment transactions
- [ ] Users can only update their own products

---

## 🚨 Immediate Action Required

1. **Fix CHATS rules immediately** - This is a critical security vulnerability
2. **Fix collection name** - Change `payment_transactions` to `paymentTransactions`
3. **Test thoroughly** before deploying to production
4. **Consider custom claims** for better performance

