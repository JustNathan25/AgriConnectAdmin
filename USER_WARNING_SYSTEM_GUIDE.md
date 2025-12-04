# User Warning System Implementation Guide

> **Complete guide for admin-to-user warning functionality in AgriConnect**  
> **⚠️ ADMIN PANEL ALREADY IMPLEMENTED - Mobile App Integration Instructions Included**

Last Updated: October 30, 2025 | Version: 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Admin Panel Status](#admin-panel-status)
3. [Database Structure](#database-structure)
4. [How It Works](#how-it-works)
5. [Mobile App Integration](#mobile-app-integration)
6. [Security Rules](#security-rules)
7. [Testing Guide](#testing-guide)
8. [Best Practices](#best-practices)

---

## 🎯 Overview

This system allows administrators to send warnings to users for policy violations, inappropriate behavior, or account issues directly from the admin web panel to the mobile app.

### ✅ Features Implemented
- ✅ **Admin Panel Complete** - Send warnings button on each user
- ✅ **Professional Warning Modal** - Beautiful UI with all options
- ✅ **Customized warnings** - Multiple categories and severity levels
- ✅ **Warning history tracking** - Per user warning count and level
- ✅ **Escalation system** - Automatic levels (low → medium → high → critical)
- ✅ **Real-time notifications** - Instantly appear in mobile app
- ✅ **Automatic actions** - Can suspend or disable accounts
- ✅ **Firestore integration** - Following same pattern as reports system

---

## 🟢 Admin Panel Status

### ✅ FULLY IMPLEMENTED

The admin warning system is **ALREADY WORKING** in the admin panel:

**Files Modified:**
- ✅ `src/html_files/users.html` - Warning modal added
- ✅ `src/javascript_files/users.js` - Complete warning functionality
- ✅ `src/css_files/users.css` - Professional modal styling

**What Admins Can Do:**
1. Click "⚠️ Warn" button on any user card
2. Fill warning form with:
   - Category (10 options: inappropriate content, spam, fraud, etc.)
   - Severity (low, medium, high, critical)
   - Title and detailed message
   - Action (warning only, suspend 24h/7d, or disable account)
   - Optional: related product ID and admin notes
3. Send warning - automatically creates:
   - Record in `user_warnings` collection
   - Notification in `notifications` collection (mobile app reads this)
   - Updates user's warning count and level

**Pattern Followed:**
- Same structure as `ADMIN_REPORTS_MANAGEMENT_GUIDE.md`
- Uses `serverTimestamp()` for timestamps
- Creates notifications that mobile app can listen to
- Tracks all data in Firestore for audit trail

### Example: What Mobile App Receives

When admin sends a warning, mobile app will see this in `notifications` collection:

```javascript
// notifications/{notificationId}
{
  "type": "user_warning",
  "userId": "abc123",  // Your user's ID
  "title": "⚠️ Warning: Inappropriate Product Images",
  "message": "Your product listing 'Fresh Tomatoes' contains inappropriate images. Please update your listing to follow our community guidelines.",
  "severity": "medium",  // "low", "medium", "high", or "critical"
  "category": "inappropriate_content",
  "warningId": "xyz789",  // Reference to full warning details
  "timestamp": Timestamp(2025, 10, 30, 14, 30, 0),
  "read": false,  // Update this to true when user reads it
  "actionRequired": true,
  "deepLink": "app://warnings/xyz789"
}
```

**That's it!** Just listen to this collection like you do for other notifications. ✓

---

## 🔄 How It Works

### Data Flow (Admin Panel → Mobile App)

```
┌─────────────────────────┐
│  Admin Panel (Web)      │
│                         │
│  1. Admin clicks "Warn" │
│  2. Fills warning form  │
│  3. Clicks "Send"       │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│  Firestore Database                 │
│                                     │
│  → Creates in user_warnings         │
│  → Creates in notifications ✓       │
│  → Updates users/{userId}/warnings  │
└───────────┬─────────────────────────┘
            │
            ↓ (Real-time listener)
┌─────────────────────────┐
│  Mobile App             │
│                         │
│  → onSnapshot triggers  │
│  → Shows notification   │
│  → User can view/ack    │
└─────────────────────────┘
```

### Collections Created

When admin sends a warning, the system automatically:

1. **`user_warnings/{warningId}`** - Permanent audit record
2. **`notifications/{notificationId}`** - Mobile app reads this ✓
3. **`users/{userId}`** - Updates warning count & level

---

## 📊 Database Structure

### 1. Update `users` Collection Schema

Add warning tracking fields to each user document:

```javascript
// users/{userId}
{
  "email": "user@example.com",
  "displayName": "John Doe",
  "status": "Active", // or "Disabled"
  "role": "user",
  
  // NEW: Warning tracking fields
  "warnings": {
    "count": 0,                    // Total warnings received
    "lastWarningDate": null,       // Firebase Timestamp or null
    "warningLevel": "none",        // "none", "low", "medium", "high", "critical"
    "strikes": 0,                  // Active strikes (resets after good behavior)
    "suspended": false             // Auto-suspend after X warnings
  },
  
  // Existing fields
  "verificationStatus": "verified",
  "totalProducts": 5,
  "createdAt": Timestamp,
  // ... other fields
}
```

### 2. Create `user_warnings` Collection

Store all warning records for audit and history:

```javascript
// user_warnings/{warningId} - Auto-generated ID
{
  // Target User
  "userId": "user_abc123",              // String: target user ID
  "userEmail": "user@example.com",      // String: user email
  "userName": "John Doe",               // String: user display name
  
  // Warning Details
  "category": "inappropriate_content",   // String: warning category
  "severity": "medium",                  // String: low, medium, high, critical
  "title": "Inappropriate Product Listing", // String: warning title
  "message": "Your product listing contains inappropriate images...", // String: detailed message
  
  // Escalation
  "warningNumber": 2,                    // Number: 1st, 2nd, 3rd warning, etc.
  "actionTaken": "warning_sent",         // String: action type
  
  // Admin Info
  "issuedBy": "admin@agriconnect.com",  // String: admin email
  "issuedByName": "Admin Name",         // String: admin display name
  "issuedAt": Timestamp(2025, 10, 30),  // Firebase Timestamp
  
  // Status
  "acknowledged": false,                 // Boolean: user acknowledged
  "acknowledgedAt": null,                // Timestamp or null
  
  // Related Items (optional)
  "relatedProductId": "product_123",     // String: if related to product
  "relatedReportId": "report_456",       // String: if from user report
  
  // Notes
  "adminNotes": "User repeatedly posted prohibited items" // String: internal notes
}
```

**Index Requirements**:
- Composite: `userId` (Asc) + `issuedAt` (Desc)
- Single: `issuedAt` (Desc)
- Single: `severity` (Asc)

### 3. Update `notifications` Collection

Add user warning notification type:

```javascript
// notifications/{notificationId}
{
  "type": "user_warning",                // String: notification type
  "userId": "user_abc123",               // String: target user
  "title": "Warning: Account Policy Violation", // String
  "message": "You have received a warning...", // String
  "severity": "medium",                  // String: low, medium, high, critical
  "warningId": "warning_xyz789",         // String: reference to user_warnings doc
  "timestamp": Timestamp,                // Firebase Timestamp
  "read": false,                         // Boolean
  "actionRequired": true,                // Boolean
  "deepLink": "app://warnings/xyz789"    // String: mobile app deep link
}
```

---

## 🔧 Admin Panel Implementation

### Step 1: Update Users HTML

Add warning button to user actions in `users.html`:

```html
<!-- In the user card actions section -->
<div class="user-card-actions">
  <button class="btn-warn" data-id="${userId}" data-name="${name}" data-email="${email}">
    ⚠️ Send Warning
  </button>
  <button class="${status === "Active" ? "btn-disable" : "btn-enable"}" data-id="${userId}" data-status="${status}">
    ${status === "Active" ? "🚫 Disable" : "✅ Enable"}
  </button>
  <button class="btn-delete" data-id="${userId}">🗑️ Delete</button>
</div>
```

Add warning modal at the end of the body:

```html
<!-- Warning Modal -->
<div id="warningModal" class="modal">
  <div class="modal-content warning-modal">
    <div class="modal-header">
      <h2>⚠️ Send Warning to User</h2>
      <span class="close-modal">&times;</span>
    </div>
    
    <div class="modal-body">
      <div class="user-info-preview">
        <h3 id="warningUserName">User Name</h3>
        <p id="warningUserEmail">user@email.com</p>
        <div class="warning-stats">
          <span class="stat-item">
            <strong>Current Warnings:</strong> 
            <span id="currentWarningCount">0</span>
          </span>
          <span class="stat-item">
            <strong>Warning Level:</strong> 
            <span id="currentWarningLevel">None</span>
          </span>
        </div>
      </div>

      <form id="warningForm">
        <div class="form-group">
          <label>Warning Category *</label>
          <select id="warningCategory" required>
            <option value="">Select Category</option>
            <option value="inappropriate_content">Inappropriate Content</option>
            <option value="spam">Spam or Misleading Posts</option>
            <option value="fraud">Suspected Fraud</option>
            <option value="harassment">Harassment or Abuse</option>
            <option value="policy_violation">Policy Violation</option>
            <option value="payment_issues">Payment Issues</option>
            <option value="fake_products">Fake or Counterfeit Products</option>
            <option value="poor_service">Poor Customer Service</option>
            <option value="multiple_accounts">Multiple Accounts</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="form-group">
          <label>Severity Level *</label>
          <select id="warningSeverity" required>
            <option value="low">Low - Minor Issue</option>
            <option value="medium">Medium - Moderate Concern</option>
            <option value="high">High - Serious Violation</option>
            <option value="critical">Critical - Immediate Action Required</option>
          </select>
        </div>

        <div class="form-group">
          <label>Warning Title *</label>
          <input type="text" id="warningTitle" placeholder="e.g., Inappropriate Product Images" required>
        </div>

        <div class="form-group">
          <label>Warning Message *</label>
          <textarea id="warningMessage" rows="6" placeholder="Detailed explanation of the issue and expected corrective action..." required></textarea>
          <small>Be clear and professional. Explain the issue and what the user should do.</small>
        </div>

        <div class="form-group">
          <label>Action to Take</label>
          <select id="warningAction">
            <option value="warning_only">Send Warning Only</option>
            <option value="warning_suspend_24h">Send Warning + 24h Suspension</option>
            <option value="warning_suspend_7d">Send Warning + 7 Day Suspension</option>
            <option value="warning_disable">Send Warning + Disable Account</option>
          </select>
        </div>

        <div class="form-group">
          <label>Related Product ID (Optional)</label>
          <input type="text" id="relatedProductId" placeholder="Enter product ID if warning is related to a specific product">
        </div>

        <div class="form-group">
          <label>Admin Notes (Internal Only)</label>
          <textarea id="adminNotes" rows="3" placeholder="Internal notes for admin records..."></textarea>
          <small>These notes are not visible to the user.</small>
        </div>

        <div class="warning-preview">
          <h4>⚠️ Warning Preview</h4>
          <p><strong>Category:</strong> <span id="previewCategory">-</span></p>
          <p><strong>Severity:</strong> <span id="previewSeverity">-</span></p>
          <p><strong>This will be warning #<span id="previewWarningNumber">1</span> for this user</strong></p>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel">Cancel</button>
          <button type="submit" class="btn-send-warning">Send Warning</button>
        </div>
      </form>
    </div>
  </div>
</div>
```

### Step 2: Update Users CSS

Add to `users.css`:

```css
/* Warning Button */
.btn-warn {
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-warn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

/* Modal Styles */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.modal.show {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  color: #ff5722;
  font-size: 22px;
}

.close-modal {
  font-size: 28px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.close-modal:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.user-info-preview {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.user-info-preview h3 {
  margin: 0 0 4px 0;
  color: #e65100;
}

.user-info-preview p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.warning-stats {
  display: flex;
  gap: 20px;
  margin-top: 12px;
}

.stat-item {
  font-size: 13px;
  color: #555;
}

.stat-item strong {
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #ff5722;
}

.form-group small {
  display: block;
  margin-top: 6px;
  color: #666;
  font-size: 12px;
}

.warning-preview {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 16px;
  border-radius: 6px;
  margin: 20px 0;
}

.warning-preview h4 {
  margin: 0 0 12px 0;
  color: #e65100;
  font-size: 16px;
}

.warning-preview p {
  margin: 6px 0;
  font-size: 14px;
  color: #555;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  padding: 10px 24px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-send-warning {
  padding: 10px 24px;
  background: linear-gradient(135deg, #ff5722, #f44336);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-send-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Step 3: Update Users JavaScript

Add to `users.js`:

```javascript
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { app } from "./firebase-config.js";

const db = getFirestore(app);
const auth = getAuth(app);

// Add modal elements
const warningModal = document.getElementById("warningModal");
const warningForm = document.getElementById("warningForm");
const closeModalBtn = document.querySelector(".close-modal");
const btnCancel = document.querySelector(".btn-cancel");

// Form fields
const warningCategory = document.getElementById("warningCategory");
const warningSeverity = document.getElementById("warningSeverity");
const warningTitle = document.getElementById("warningTitle");
const warningMessage = document.getElementById("warningMessage");
const warningAction = document.getElementById("warningAction");
const relatedProductId = document.getElementById("relatedProductId");
const adminNotes = document.getElementById("adminNotes");

// Preview elements
const warningUserName = document.getElementById("warningUserName");
const warningUserEmail = document.getElementById("warningUserEmail");
const currentWarningCount = document.getElementById("currentWarningCount");
const currentWarningLevel = document.getElementById("currentWarningLevel");
const previewCategory = document.getElementById("previewCategory");
const previewSeverity = document.getElementById("previewSeverity");
const previewWarningNumber = document.getElementById("previewWarningNumber");

// Store current user being warned
let currentWarningUser = null;

// =============================
// 🔹 ATTACH WARNING ACTIONS
// =============================
function attachUserActions() {
  // Existing disable/delete actions...
  
  // Add warning button listeners
  document.querySelectorAll(".btn-warn").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const userId = e.target.dataset.id;
      const userName = e.target.dataset.name;
      const userEmail = e.target.dataset.email;
      
      await openWarningModal(userId, userName, userEmail);
    })
  );
}

// =============================
// 🔹 OPEN WARNING MODAL
// =============================
async function openWarningModal(userId, userName, userEmail) {
  // Store current user
  currentWarningUser = {
    id: userId,
    name: userName,
    email: userEmail
  };
  
  // Fetch user data to get warning count
  const userDoc = await getDoc(doc(db, "users", userId));
  const userData = userDoc.data();
  const warnings = userData?.warnings || { count: 0, warningLevel: "none" };
  
  // Update modal
  warningUserName.textContent = userName;
  warningUserEmail.textContent = userEmail;
  currentWarningCount.textContent = warnings.count || 0;
  currentWarningLevel.textContent = warnings.warningLevel || "None";
  previewWarningNumber.textContent = (warnings.count || 0) + 1;
  
  // Reset form
  warningForm.reset();
  updatePreview();
  
  // Show modal
  warningModal.classList.add("show");
}

// =============================
// 🔹 CLOSE WARNING MODAL
// =============================
function closeWarningModal() {
  warningModal.classList.remove("show");
  currentWarningUser = null;
}

closeModalBtn.addEventListener("click", closeWarningModal);
btnCancel.addEventListener("click", closeWarningModal);

// Close on outside click
warningModal.addEventListener("click", (e) => {
  if (e.target === warningModal) {
    closeWarningModal();
  }
});

// =============================
// 🔹 UPDATE PREVIEW
// =============================
function updatePreview() {
  previewCategory.textContent = warningCategory.options[warningCategory.selectedIndex]?.text || "-";
  previewSeverity.textContent = warningSeverity.options[warningSeverity.selectedIndex]?.text || "-";
}

warningCategory.addEventListener("change", updatePreview);
warningSeverity.addEventListener("change", updatePreview);

// =============================
// 🔹 SEND WARNING
// =============================
warningForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!currentWarningUser) return;
  
  const submitBtn = e.target.querySelector(".btn-send-warning");
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  
  try {
    const admin = auth.currentUser;
    const userId = currentWarningUser.id;
    
    // Get current user data
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const currentWarnings = userData?.warnings || { count: 0, warningLevel: "none", strikes: 0 };
    
    const newWarningCount = currentWarnings.count + 1;
    const newStrikeCount = currentWarnings.strikes + 1;
    
    // Determine new warning level based on count
    let newWarningLevel = "low";
    if (newWarningCount >= 5) newWarningLevel = "critical";
    else if (newWarningCount >= 3) newWarningLevel = "high";
    else if (newWarningCount >= 2) newWarningLevel = "medium";
    
    // Create warning record
    const warningData = {
      userId: userId,
      userEmail: currentWarningUser.email,
      userName: currentWarningUser.name,
      category: warningCategory.value,
      severity: warningSeverity.value,
      title: warningTitle.value,
      message: warningMessage.value,
      warningNumber: newWarningCount,
      actionTaken: warningAction.value,
      issuedBy: admin.email,
      issuedByName: admin.displayName || admin.email.split('@')[0],
      issuedAt: serverTimestamp(),
      acknowledged: false,
      acknowledgedAt: null,
      relatedProductId: relatedProductId.value || null,
      relatedReportId: null,
      adminNotes: adminNotes.value || ""
    };
    
    // Add to user_warnings collection
    const warningRef = await addDoc(collection(db, "user_warnings"), warningData);
    
    // Create notification for user
    await addDoc(collection(db, "notifications"), {
      type: "user_warning",
      userId: userId,
      title: `⚠️ Warning: ${warningTitle.value}`,
      message: warningMessage.value,
      severity: warningSeverity.value,
      warningId: warningRef.id,
      timestamp: serverTimestamp(),
      read: false,
      actionRequired: true,
      deepLink: `app://warnings/${warningRef.id}`
    });
    
    // Update user document
    const updates = {
      "warnings.count": increment(1),
      "warnings.lastWarningDate": serverTimestamp(),
      "warnings.warningLevel": newWarningLevel,
      "warnings.strikes": increment(1)
    };
    
    // Handle action
    const action = warningAction.value;
    if (action === "warning_suspend_24h" || action === "warning_suspend_7d") {
      updates["warnings.suspended"] = true;
      updates["warnings.suspendedUntil"] = new Date(
        Date.now() + (action === "warning_suspend_24h" ? 86400000 : 604800000)
      );
    } else if (action === "warning_disable") {
      updates.status = "Disabled";
    }
    
    // Auto-suspend after 5 warnings
    if (newWarningCount >= 5) {
      updates.status = "Disabled";
      updates["warnings.suspended"] = true;
    }
    
    await updateDoc(userRef, updates);
    
    // Success message
    alert(`✅ Warning sent successfully!\n\nThis is warning #${newWarningCount} for ${currentWarningUser.name}.`);
    
    closeWarningModal();
    
  } catch (error) {
    console.error("Error sending warning:", error);
    alert("❌ Error sending warning: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Warning";
  }
});
```

### Step 4: Display Warning Count in User Cards

Update the user card to show warning badges:

```javascript
// In the user card generation (inside onSnapshot)
const warnings = user.warnings || { count: 0, warningLevel: "none" };
let warningBadge = "";
if (warnings.count > 0) {
  warningBadge = `
    <div class="user-detail-item">
      <span class="user-detail-label">Warnings</span>
      <span class="user-detail-value">
        <span class="warning-badge warning-${warnings.warningLevel}">
          ⚠️ ${warnings.count} Warning${warnings.count > 1 ? 's' : ''}
        </span>
      </span>
    </div>
  `;
}

// Add to card HTML
card.innerHTML = `
  <div class="user-card-header">...</div>
  <div class="user-card-details">
    <!-- existing details -->
    ${warningBadge}
  </div>
  <div class="user-card-actions">...</div>
`;
```

Add badge styles to CSS:

```css
.warning-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.warning-low {
  background: #fff3e0;
  color: #e65100;
}

.warning-medium {
  background: #ffe0b2;
  color: #ff6f00;
}

.warning-high {
  background: #ffccbc;
  color: #d84315;
}

.warning-critical {
  background: #ffcdd2;
  color: #c62828;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## 📱 Mobile App Integration

> **For Mobile App Developers:** The admin panel is sending warnings. You need to read them from Firestore.

### Key Points

- **Collection to Listen:** `notifications` (where `type === "user_warning"`)
- **Also Available:** `user_warnings` (for full warning history)
- **Pattern:** Same as your existing reports system
- **Real-time:** Use `onSnapshot()` for instant notifications

---

### Step 1: Listen for Warning Notifications

Add this to your notification listener (you likely already have one for other notification types):

```javascript
// In your NotificationService or similar file
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

// Listen for user warnings in notifications collection
function listenToWarningNotifications() {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('type', '==', 'user_warning'),
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const notification = change.doc.data();
        
        // Show notification alert
        showWarningAlert(notification);
      }
    });
  });

  return unsubscribe;
}

function showWarningAlert(notification) {
  // Show push notification or in-app alert
  Alert.alert(
    notification.title,
    notification.message,
    [
      { 
        text: 'View Details', 
        onPress: () => navigation.navigate('Warnings', { 
          warningId: notification.warningId 
        })
      },
      { text: 'OK', style: 'cancel' }
    ]
  );
}
```

---

### Step 2: Create Warnings Screen (React Native)

```javascript
// screens/WarningsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export default function WarningsScreen() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Real-time listener for warnings
    const q = query(
      collection(db, 'user_warnings'),
      where('userId', '==', userId),
      orderBy('issuedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const warningsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWarnings(warningsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const acknowledgeWarning = async (warningId) => {
    try {
      await updateDoc(doc(db, 'user_warnings', warningId), {
        acknowledged: true,
        acknowledgedAt: new Date()
      });
      Alert.alert('Success', 'Warning acknowledged');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderWarning = ({ item }) => (
    <View style={[styles.warningCard, styles[`severity_${item.severity}`]]}>
      <View style={styles.warningHeader}>
        <Text style={styles.warningNumber}>Warning #{item.warningNumber}</Text>
        <Text style={styles.severity}>{item.severity.toUpperCase()}</Text>
      </View>
      
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.category}>{item.category.replace('_', ' ')}</Text>
      <Text style={styles.message}>{item.message}</Text>
      
      <Text style={styles.date}>
        Issued: {item.issuedAt?.toDate().toLocaleDateString()}
      </Text>
      
      {!item.acknowledged && (
        <TouchableOpacity
          style={styles.acknowledgeBtn}
          onPress={() => acknowledgeWarning(item.id)}
        >
          <Text style={styles.acknowledgeBtnText}>Acknowledge Warning</Text>
        </TouchableOpacity>
      )}
      
      {item.acknowledged && (
        <Text style={styles.acknowledgedText}>
          ✓ Acknowledged on {item.acknowledgedAt?.toDate().toLocaleDateString()}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading warnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Account Warnings</Text>
      
      {warnings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>No warnings</Text>
          <Text style={styles.emptySubtext}>Keep up the good work!</Text>
        </View>
      ) : (
        <>
          <View style={styles.warningStats}>
            <Text style={styles.warningStatsText}>
              Total Warnings: {warnings.length}
            </Text>
          </View>
          
          <FlatList
            data={warnings}
            renderItem={renderWarning}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    backgroundColor: 'white',
  },
  warningStats: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ff9800',
  },
  warningStatsText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#e65100',
  },
  list: {
    padding: 16,
  },
  warningCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  severity_low: {
    borderLeftColor: '#ff9800',
  },
  severity_medium: {
    borderLeftColor: '#ff5722',
  },
  severity_high: {
    borderLeftColor: '#f44336',
  },
  severity_critical: {
    borderLeftColor: '#d32f2f',
    backgroundColor: '#ffebee',
  },
  warningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  warningNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  severity: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f44336',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  message: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  acknowledgeBtn: {
    backgroundColor: '#ff5722',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acknowledgeBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  acknowledgedText: {
    fontSize: 12,
    color: '#4caf50',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});
```

### Step 2: Add Notification Handler

```javascript
// In your notification handler file
const handleWarningNotification = async (notification) => {
  if (notification.type === 'user_warning') {
    // Show alert
    Alert.alert(
      '⚠️ Warning Received',
      notification.message,
      [
        { text: 'View Details', onPress: () => navigation.navigate('Warnings') },
        { text: 'OK', style: 'cancel' }
      ]
    );
    
    // Mark notification as read
    await updateDoc(doc(db, 'notifications', notification.id), {
      read: true
    });
  }
};
```

### Step 3: Add Badge to Profile/Settings

```javascript
// Show warning count in profile
const [warningCount, setWarningCount] = useState(0);

useEffect(() => {
  const userId = auth.currentUser?.uid;
  const userRef = doc(db, 'users', userId);
  
  const unsubscribe = onSnapshot(userRef, (doc) => {
    const data = doc.data();
    setWarningCount(data?.warnings?.count || 0);
  });
  
  return () => unsubscribe();
}, []);

// In your UI
{warningCount > 0 && (
  <View style={styles.warningBanner}>
    <Text style={styles.warningBannerText}>
      ⚠️ You have {warningCount} warning{warningCount > 1 ? 's' : ''}
    </Text>
    <TouchableOpacity onPress={() => navigation.navigate('Warnings')}>
      <Text style={styles.viewWarningsBtn}>View Details</Text>
    </TouchableOpacity>
  </View>
)}
```

---

## 🔒 Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // User Warnings - Users can read their own, only admins can write
    match /user_warnings/{warningId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAdmin();
      allow update: if isAdmin() 
                    || (isOwner(resource.data.userId) 
                        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['acknowledged', 'acknowledgedAt']));
      allow delete: if isAdmin();
    }
    
    // Notifications - Users can read/update their own, admins can write
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAdmin();
      allow update: if isOwner(resource.data.userId) 
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }
    
    // Users - Users can read/update their own profile, admins can do anything
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

---

## 🧪 Testing Guide

### Test Case 1: Send First Warning

1. Go to Users page in admin panel
2. Click "Send Warning" on a test user
3. Fill in:
   - Category: Policy Violation
   - Severity: Low
   - Title: "Test Warning"
   - Message: "This is a test warning"
   - Action: Warning Only
4. Submit
5. **Expected**: Warning appears in Firestore, notification sent, user's warning count = 1

### Test Case 2: Escalation

1. Send 3 warnings to same user
2. **Expected**: Warning level increases (low → medium → high)
3. Check user document in Firestore

### Test Case 3: Auto-Suspension

1. Send 5 warnings to same user
2. **Expected**: Account status changes to "Disabled" automatically

### Test Case 4: Mobile App Display

1. Open mobile app as warned user
2. Navigate to Warnings screen
3. **Expected**: All warnings visible, sorted by date

### Test Case 5: Acknowledgment

1. In mobile app, acknowledge a warning
2. **Expected**: Warning shows as acknowledged with timestamp

---

## ✅ Best Practices

### 1. Professional Communication
- Be clear and specific about the issue
- Provide actionable feedback
- Remain professional and respectful
- Include specific policy references

### 2. Documentation
- Keep admin notes detailed
- Track patterns of behavior
- Document related products/reports

### 3. Escalation Guidelines
- **1st Warning**: Friendly reminder, educational
- **2nd Warning**: Formal notice, specific improvements needed
- **3rd Warning**: Serious violation, outline consequences
- **4th+ Warning**: Final notice before suspension
- **5+ Warnings**: Automatic account review/suspension

### 4. Fair Process
- Give users chance to respond
- Review warning history before major actions
- Consider appeals process
- Be consistent across all users

### 5. Data Management
- Archive old warnings after resolution
- Keep audit trail for legal compliance
- Regularly review warning patterns
- Use analytics to identify systemic issues

---

## 🔄 Warning Category Guidelines

| Category | Description | Typical Severity | Example |
|----------|-------------|------------------|---------|
| Inappropriate Content | Offensive images/text | Medium-High | Explicit product images |
| Spam | Repeated posts, fake listings | Low-Medium | Multiple duplicate products |
| Fraud | Suspected scam activity | High-Critical | Fake payment requests |
| Harassment | Abusive behavior | High-Critical | Threatening messages |
| Policy Violation | Breaking platform rules | Medium-High | Prohibited items |
| Payment Issues | Transaction problems | Medium | Refund disputes |
| Fake Products | Counterfeit goods | High | Fake branded items |
| Poor Service | Customer complaints | Low-Medium | Delayed deliveries |
| Multiple Accounts | Account manipulation | High | Creating fake accounts |

---

## 📊 Admin Dashboard Enhancement

Consider adding a warnings dashboard:

```javascript
// Get warning statistics
const getWarningStats = async () => {
  const warningsSnap = await getDocs(collection(db, 'user_warnings'));
  
  const stats = {
    total: warningsSnap.size,
    bySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    byCategory: {},
    thisMonth: 0
  };
  
  warningsSnap.forEach(doc => {
    const data = doc.data();
    stats.bySeverity[data.severity]++;
    stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
    
    const warningDate = data.issuedAt.toDate();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    if (warningDate > monthAgo) stats.thisMonth++;
  });
  
  return stats;
};
```

---

## 🚨 Troubleshooting

### Issue: Warnings not appearing in mobile app
**Solution**: 
- Check Firestore security rules
- Verify userId matches exactly
- Check network connectivity
- Verify onSnapshot listener is active

### Issue: User can't acknowledge warning
**Solution**:
- Verify security rules allow update on acknowledged field
- Check that only acknowledged and acknowledgedAt fields are being updated

### Issue: Warning count not updating
**Solution**:
- Use `increment(1)` instead of manual count
- Ensure update includes `warnings.count` path correctly

### Issue: Notifications not real-time
**Solution**:
- Use `onSnapshot` instead of `getDocs`
- Verify Firebase app is initialized
- Check that listener is not being unsubscribed prematurely

---

## 📚 Additional Features (Optional)

### 1. Warning Appeals System
- Allow users to appeal warnings
- Create `warning_appeals` collection
- Admin review and respond

### 2. Automatic Warning Expiry
- Reduce strike count after good behavior period
- Reset warning level after 90 days of no violations

### 3. Email Notifications
- Send email when warning issued
- Use Firebase Cloud Functions + SendGrid

### 4. Warning Templates
- Pre-defined warning templates for common issues
- Quick select in admin panel

### 5. Bulk Warning System
- Warn multiple users at once
- For system-wide policy changes

---

## 📞 Support

For implementation help or questions about this system:
1. Review the Firestore structure documentation
2. Check console for error messages
3. Verify all Firestore indexes are created
4. Test in Firebase Emulator first
5. Review security rules carefully

---

**Last Updated**: October 30, 2025  
**Version**: 1.0  
**Tested With**: Firebase 12.4.0, React Native 0.72

---

## ✨ Implementation Summary

### ✅ COMPLETED (Admin Panel)

**What's Already Working:**
- ✅ Warning button on every user card (grid & table view)
- ✅ Beautiful warning modal with all form fields
- ✅ 10 warning categories + 4 severity levels
- ✅ Automatic warning count & level tracking
- ✅ Creates `user_warnings` collection documents
- ✅ Creates `notifications` collection documents ← **Mobile app reads this**
- ✅ Updates user's warning data in `users` collection
- ✅ Optional actions (suspend 24h/7d, disable account)
- ✅ Auto-suspend after 5 warnings
- ✅ Professional styling with gradients & animations

**Files Modified:**
```
✅ src/html_files/users.html         - Warning modal HTML
✅ src/javascript_files/users.js    - Warning functionality + Firestore
✅ src/css_files/users.css          - Modal styling
```

**Firestore Collections Used:**
```
✅ user_warnings          - Audit trail (admin only)
✅ notifications          - Mobile app reads this ✓
✅ users/{userId}         - Warning count & level
```

---

### 📱 TODO (Mobile App)

**What Mobile Developers Need to Do:**

1. **Listen to `notifications` collection** (you probably already do this)
   - Filter: `type === "user_warning"`
   - Show alert when new warning arrives

2. **Create Warnings Screen** (optional but recommended)
   - Fetch from `user_warnings` collection
   - Show warning history
   - Allow user to acknowledge warnings

3. **Update Firestore Security Rules** (if not already done)
   - See Security Rules section in this guide

4. **Test** 
   - Send test warning from admin panel
   - Verify notification appears in app

**Estimated Time:** 2-3 hours for basic integration

---

## 🚀 Quick Start for Mobile Developers

### Minimal Integration (30 minutes)

Just add this to your existing notification listener:

```javascript
// Add to your existing notification handling code
if (notification.type === 'user_warning') {
  Alert.alert(
    notification.title,
    notification.message,
    [{ text: 'OK' }]
  );
}
```

That's it! Warnings will now show up as alerts. ✓

### Full Integration (2-3 hours)

- Create dedicated Warnings screen
- Show warning history
- Allow users to acknowledge warnings
- Update UI when user has active warnings

---

## 📞 Support

**For Admin Panel Questions:**
- Check `src/javascript_files/users.js` for implementation
- All Firestore writes use `serverTimestamp()` and `increment()`
- Follows same pattern as reports system

**For Mobile App Questions:**
- Notifications are in `notifications` collection
- Filter by `userId` and `type === "user_warning"`
- Same pattern as other notification types

---

**🎉 Admin Panel is Ready to Use!**  
*Mobile app developers can now integrate warnings using the patterns above.*

---

*This guide provides a complete, production-ready warning system for AgriConnect. Admin panel is fully functional. Mobile app integration uses standard Firestore patterns.*

