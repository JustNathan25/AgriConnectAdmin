# 🗺️ AgriConnect Admin Website - Flowchart

## 📋 Overview

This document provides a comprehensive flowchart of the AgriConnect Admin Website, showing the navigation flow, authentication process, and all available features.

---

## 🔐 Authentication Flow

```mermaid
flowchart TD
    Start([User Opens Admin Website]) --> LoginPage[index.html<br/>Login Page]
    LoginPage --> CheckEmail{Email Pre-filled?}
    CheckEmail -->|Yes| DefaultEmail[Default Admin Email<br/>agriconnect.admin@gmail.com]
    CheckEmail -->|No| SavedEmail[Load Saved Email<br/>from localStorage]
    DefaultEmail --> InputCredentials[Enter Email & Password]
    SavedEmail --> InputCredentials
    InputCredentials --> Validate{Validate Input}
    Validate -->|Invalid| ShowError[Show Error Message]
    ShowError --> InputCredentials
    Validate -->|Valid| AttemptLogin[Attempt Firebase Login]
    AttemptLogin --> LoginSuccess{Login Successful?}
    LoginSuccess -->|No| CheckUserNotFound{User Not Found?}
    CheckUserNotFound -->|Yes| CheckDefaultAdmin{Is Default Admin?}
    CheckDefaultAdmin -->|Yes| CreateAdminUser[Create Admin User<br/>Set role: 'admin']
    CheckDefaultAdmin -->|No| ShowError
    CreateAdminUser --> VerifyRole[Verify Admin Role]
    CheckUserNotFound -->|No| ShowError
    LoginSuccess -->|Yes| VerifyRole
    VerifyRole --> CheckRole{Has Admin Role?}
    CheckRole -->|No| CreateOrUpdateRole[Create/Update User Doc<br/>Set role: 'admin']
    CreateOrUpdateRole --> RedirectDashboard[Redirect to Dashboard]
    CheckRole -->|Yes| RedirectDashboard
    RedirectDashboard --> DashboardPage[dashboard.html<br/>Main Dashboard]
    
    style Start fill:#e1f5ff
    style LoginPage fill:#fff4e6
    style DashboardPage fill:#d4edda
    style ShowError fill:#f8d7da
    style CreateAdminUser fill:#fff3cd
    style RedirectDashboard fill:#d1ecf1
```

---

## 🏠 Main Navigation Flow

```mermaid
flowchart TD
    Dashboard[dashboard.html<br/>Dashboard] --> NavMenu[Navigation Menu]
    
    NavMenu --> Users[users.html<br/>Users Management]
    NavMenu --> Products[products.html<br/>Products Management]
    NavMenu --> Verifications[pending-verifications.html<br/>ID Verifications]
    NavMenu --> Payments[payments.html<br/>Payment Transactions]
    NavMenu --> Reports[report.html<br/>Report Tickets]
    NavMenu --> Support[customer-support.html<br/>Customer Support]
    NavMenu --> Settings[settings.html<br/>Settings]
    
    Users --> UserActions[User Actions]
    Products --> ProductActions[Product Actions]
    Verifications --> VerificationActions[Verification Actions]
    Payments --> PaymentActions[Payment Actions]
    Reports --> ReportActions[Report Actions]
    Support --> SupportActions[Support Actions]
    Settings --> SettingsActions[Settings Actions]
    
    UserActions --> Dashboard
    ProductActions --> Dashboard
    VerificationActions --> Dashboard
    PaymentActions --> Dashboard
    ReportActions --> Dashboard
    SupportActions --> Dashboard
    SettingsActions --> Dashboard
    
    style Dashboard fill:#d4edda
    style NavMenu fill:#e1f5ff
    style Users fill:#fff4e6
    style Products fill:#fff4e6
    style Verifications fill:#fff4e6
    style Payments fill:#fff4e6
    style Reports fill:#fff4e6
    style Support fill:#fff4e6
    style Settings fill:#fff4e6
```

---

## 📊 Dashboard Flow

```mermaid
flowchart TD
    Dashboard[dashboard.html] --> AuthCheck{Admin Authenticated?}
    AuthCheck -->|No| RedirectLogin[Redirect to index.html]
    AuthCheck -->|Yes| LoadMetrics[Load Real-time Metrics]
    
    LoadMetrics --> Metric1[Total Users]
    LoadMetrics --> Metric2[Total Products]
    LoadMetrics --> Metric3[Verified Sellers]
    LoadMetrics --> Metric4[Disabled Users]
    LoadMetrics --> Metric5[Open Tickets]
    LoadMetrics --> Metric6[Pending Payments]
    LoadMetrics --> Metric7[Active Chats]
    LoadMetrics --> Metric8[Recent Activity]
    
    Metric1 --> Listeners[Setup Real-time Listeners]
    Metric2 --> Listeners
    Metric3 --> Listeners
    Metric4 --> Listeners
    Metric5 --> Listeners
    Metric6 --> Listeners
    Metric7 --> Listeners
    Metric8 --> Listeners
    
    Listeners --> UpdateUI[Update UI with Live Data]
    UpdateUI --> Charts[Display Charts & Graphs]
    Charts --> ActivityFeed[Show Activity Feed]
    
    style Dashboard fill:#d4edda
    style LoadMetrics fill:#e1f5ff
    style Listeners fill:#fff3cd
    style UpdateUI fill:#d1ecf1
```

---

## 👥 Users Management Flow

```mermaid
flowchart TD
    UsersPage[users.html] --> LoadUsers[Load All Users from Firestore]
    LoadUsers --> DisplayUsers[Display User List]
    DisplayUsers --> UserFilters[Filter Options]
    
    UserFilters --> FilterByStatus[Filter by Status]
    UserFilters --> FilterByRole[Filter by Role]
    UserFilters --> FilterByVerification[Filter by Verification]
    UserFilters --> SearchUsers[Search Users]
    
    DisplayUsers --> UserCard[User Card]
    UserCard --> ViewProfile[View Profile]
    UserCard --> EditUser[Edit User]
    UserCard --> DisableUser[Disable/Enable User]
    UserCard --> ViewProducts[View User Products]
    UserCard --> SendWarning[Send Warning]
    UserCard --> DeleteUser[Delete User]
    
    ViewProfile --> ProfileModal[Profile Details Modal]
    EditUser --> EditModal[Edit User Modal]
    DisableUser --> ConfirmDialog[Confirmation Dialog]
    SendWarning --> WarningModal[Warning Modal]
    DeleteUser --> DeleteConfirm[Delete Confirmation]
    
    ConfirmDialog --> UpdateFirestore[Update Firestore]
    WarningModal --> CreateNotification[Create Notification]
    DeleteConfirm --> DeleteFromFirestore[Delete from Firestore]
    
    UpdateFirestore --> RefreshList[Refresh User List]
    CreateNotification --> RefreshList
    DeleteFromFirestore --> RefreshList
    
    style UsersPage fill:#fff4e6
    style UserCard fill:#e1f5ff
    style UpdateFirestore fill:#d1ecf1
    style CreateNotification fill:#fff3cd
```

---

## 🛒 Products Management Flow

```mermaid
flowchart TD
    ProductsPage[products.html] --> LoadProducts[Load Products from Firestore]
    LoadProducts --> DisplayProducts[Display Product Grid]
    DisplayProducts --> ProductFilters[Filter Options]
    
    ProductFilters --> FilterByStatus[Filter by Status]
    ProductFilters --> FilterByCategory[Filter by Category]
    ProductFilters --> FilterByBoost[Filter by Boost Status]
    ProductFilters --> FilterByBlocked[Filter by Blocked Sellers]
    ProductFilters --> SearchProducts[Search Products]
    
    DisplayProducts --> ProductCard[Product Card]
    ProductCard --> ViewDetails[View Product Details]
    ProductCard --> WarnSeller[Warn Seller]
    ProductCard --> DeleteProduct[Delete Product]
    
    ViewDetails --> DetailsModal[Product Details Modal]
    DetailsModal --> ViewImages[View Product Images]
    DetailsModal --> ViewSeller[View Seller Profile]
    DetailsModal --> ViewLocation[View Product Location]
    
    WarnSeller --> WarningModal[Warning Modal]
    WarningModal --> SelectWarningType[Select Warning Type]
    SelectWarningType --> SelectIssues[Select Issues]
    SelectIssues --> WriteMessage[Write Warning Message]
    WriteMessage --> SendWarning[Send Warning]
    SendWarning --> CreateNotification[Create Notification]
    CreateNotification --> UpdateSellerDoc[Update Seller Document]
    
    DeleteProduct --> DeleteModal[Delete Confirmation Modal]
    DeleteModal --> SelectReason[Select Deletion Reason]
    SelectReason --> WriteExplanation[Write Explanation]
    WriteExplanation --> ConfirmDelete[Confirm Delete]
    ConfirmDelete --> DeleteFromFirestore[Delete from Firestore]
    DeleteFromFirestore --> CreateLog[Create Admin Log]
    CreateLog --> NotifySeller{Notify Seller?}
    NotifySeller -->|Yes| CreateNotification
    NotifySeller -->|No| RefreshList[Refresh Product List]
    CreateNotification --> RefreshList
    
    style ProductsPage fill:#fff4e6
    style ProductCard fill:#e1f5ff
    style WarningModal fill:#fff3cd
    style DeleteModal fill:#f8d7da
    style CreateNotification fill:#d1ecf1
```

---

## ✓ ID Verification Flow

```mermaid
flowchart TD
    VerificationsPage[pending-verifications.html] --> LoadVerifications[Load Verification Requests]
    LoadVerifications --> DisplayVerifications[Display Verification List]
    DisplayVerifications --> FilterStatus[Filter by Status]
    
    FilterStatus --> FilterPending[Pending Verifications]
    FilterStatus --> FilterApproved[Approved Verifications]
    FilterStatus --> FilterRejected[Rejected Verifications]
    
    DisplayVerifications --> VerificationCard[Verification Card]
    VerificationCard --> ViewDetails[View Verification Details]
    VerificationCard --> ViewDocuments[View ID Documents]
    VerificationCard --> ApproveVerification[Approve Verification]
    VerificationCard --> RejectVerification[Reject Verification]
    
    ViewDetails --> DetailsModal[Verification Details Modal]
    ViewDocuments --> DocumentViewer[Document Viewer]
    
    ApproveVerification --> ConfirmApprove[Confirmation Dialog]
    ConfirmApprove --> UpdateStatus[Update Status: 'approved']
    UpdateStatus --> UpdateUserDoc[Update User Document<br/>Set verified: true]
    UpdateUserDoc --> CreateNotification[Create Notification]
    CreateNotification --> RefreshList[Refresh Verification List]
    
    RejectVerification --> RejectModal[Rejection Modal]
    RejectModal --> EnterReason[Enter Rejection Reason]
    EnterReason --> ConfirmReject[Confirm Rejection]
    ConfirmReject --> UpdateStatusReject[Update Status: 'rejected']
    UpdateStatusReject --> CreateNotificationReject[Create Notification]
    CreateNotificationReject --> RefreshList
    
    style VerificationsPage fill:#fff4e6
    style VerificationCard fill:#e1f5ff
    style ApproveVerification fill:#d4edda
    style RejectVerification fill:#f8d7da
    style CreateNotification fill:#d1ecf1
```

---

## 💰 Payment Management Flow

```mermaid
flowchart TD
    PaymentsPage[payments.html] --> LoadPayments[Load Payment Transactions]
    LoadPayments --> DisplayPayments[Display Payment List]
    DisplayPayments --> FilterPayments[Filter Options]
    
    FilterPayments --> FilterByStatus[Filter by Status]
    FilterPayments --> FilterByType[Filter by Type]
    FilterPayments --> FilterByDate[Filter by Date Range]
    FilterPayments --> SearchPayments[Search Payments]
    
    DisplayPayments --> PaymentCard[Payment Card]
    PaymentCard --> ViewDetails[View Payment Details]
    PaymentCard --> VerifyPayment[Verify Payment]
    PaymentCard --> RejectPayment[Reject Payment]
    PaymentCard --> ViewReceipt[View Receipt]
    
    ViewDetails --> DetailsModal[Payment Details Modal]
    ViewReceipt --> ReceiptViewer[Receipt Viewer]
    
    VerifyPayment --> VerifyModal[Verification Modal]
    VerifyModal --> ConfirmVerify[Confirm Verification]
    ConfirmVerify --> UpdateStatus[Update Status: 'verified']
    UpdateStatus --> UpdateProductBoost[Update Product Boost Status]
    UpdateProductBoost --> CreateNotification[Create Notification]
    CreateNotification --> RefreshList[Refresh Payment List]
    
    RejectPayment --> RejectModal[Rejection Modal]
    RejectModal --> EnterReason[Enter Rejection Reason]
    EnterReason --> ConfirmReject[Confirm Rejection]
    ConfirmReject --> UpdateStatusReject[Update Status: 'rejected']
    UpdateStatusReject --> RefundProcess[Process Refund if Needed]
    RefundProcess --> CreateNotificationReject[Create Notification]
    CreateNotificationReject --> RefreshList
    
    style PaymentsPage fill:#fff4e6
    style PaymentCard fill:#e1f5ff
    style VerifyPayment fill:#d4edda
    style RejectPayment fill:#f8d7da
    style CreateNotification fill:#d1ecf1
```

---

## 🎫 Report Tickets Flow

```mermaid
flowchart TD
    ReportsPage[report.html] --> LoadTickets[Load Tickets from Firestore]
    LoadTickets --> DisplayTickets[Display Ticket List]
    DisplayTickets --> FilterTickets[Filter Options]
    
    FilterTickets --> FilterByStatus[Filter by Status]
    FilterTickets --> FilterByPriority[Filter by Priority]
    FilterTickets --> FilterByType[Filter by Report Type]
    FilterTickets --> SearchTickets[Search Tickets]
    
    DisplayTickets --> TicketCard[Ticket Card]
    TicketCard --> ViewDetails[View Ticket Details]
    TicketCard --> AssignToMe[Assign to Me]
    TicketCard --> MarkInProgress[Mark In Progress]
    TicketCard --> ResolveTicket[Resolve Ticket]
    TicketCard --> ReopenTicket[Reopen Ticket]
    TicketCard --> DeleteTicket[Delete Ticket]
    
    ViewDetails --> DetailsModal[Ticket Details Modal]
    DetailsModal --> ViewReporter[View Reporter Info]
    DetailsModal --> ViewTarget[View Reported Item]
    
    AssignToMe --> UpdateAssignee[Update Assigned To]
    MarkInProgress --> UpdateStatus[Update Status: 'in_progress']
    ResolveTicket --> ResolveModal[Resolve Modal]
    ResolveModal --> EnterNotes[Enter Resolution Notes]
    EnterNotes --> ConfirmResolve[Confirm Resolution]
    ConfirmResolve --> UpdateStatusResolve[Update Status: 'resolved']
    ReopenTicket --> UpdateStatusReopen[Update Status: 'open']
    DeleteTicket --> ConfirmDelete[Confirm Deletion]
    ConfirmDelete --> DeleteFromFirestore[Delete from Firestore]
    
    UpdateAssignee --> CreateNotification[Create Notification]
    UpdateStatus --> CreateNotification
    UpdateStatusResolve --> CreateNotification
    UpdateStatusReopen --> CreateNotification
    CreateNotification --> RefreshList[Refresh Ticket List]
    DeleteFromFirestore --> RefreshList
    
    style ReportsPage fill:#fff4e6
    style TicketCard fill:#e1f5ff
    style ResolveModal fill:#d4edda
    style DeleteTicket fill:#f8d7da
    style CreateNotification fill:#d1ecf1
```

---

## 💬 Customer Support Flow

```mermaid
flowchart TD
    SupportPage[customer-support.html] --> LoadChats[Load Support Chats]
    LoadChats --> DisplayChats[Display Chat List]
    DisplayChats --> FilterChats[Filter Options]
    
    FilterChats --> FilterByStatus[Filter by Status]
    FilterChats --> FilterByUser[Filter by User]
    FilterChats --> SearchChats[Search Chats]
    
    DisplayChats --> ChatCard[Chat Card]
    ChatCard --> OpenChat[Open Chat]
    ChatCard --> ViewUser[View User Profile]
    ChatCard --> CloseChat[Close Chat]
    
    OpenChat --> ChatInterface[Chat Interface]
    ChatInterface --> ViewMessages[View Messages]
    ChatInterface --> SendMessage[Send Admin Message]
    ChatInterface --> ViewUserInfo[View User Info]
    
    SendMessage --> CreateMessage[Create Message in Firestore]
    CreateMessage --> UpdateChat[Update Chat Document]
    UpdateChat --> CreateNotification[Create Notification]
    CreateNotification --> RefreshChat[Refresh Chat View]
    
    CloseChat --> ConfirmClose[Confirm Close]
    ConfirmClose --> UpdateChatStatus[Update Chat Status]
    UpdateChatStatus --> RefreshList[Refresh Chat List]
    
    style SupportPage fill:#fff4e6
    style ChatCard fill:#e1f5ff
    style ChatInterface fill:#d1ecf1
    style CreateNotification fill:#fff3cd
```

---

## ⚙️ Settings Flow

```mermaid
flowchart TD
    SettingsPage[settings.html] --> LoadSettings[Load Admin Settings]
    LoadSettings --> DisplaySettings[Display Settings Options]
    
    DisplaySettings --> ProfileSettings[Profile Settings]
    DisplaySettings --> SecuritySettings[Security Settings]
    DisplaySettings --> NotificationSettings[Notification Settings]
    DisplaySettings --> SystemSettings[System Settings]
    
    ProfileSettings --> EditProfile[Edit Profile]
    EditProfile --> UpdateName[Update Display Name]
    EditProfile --> UpdateEmail[Update Email]
    EditProfile --> UpdateAvatar[Update Avatar]
    
    SecuritySettings --> ChangePassword[Change Password]
    ChangePassword --> VerifyCurrent[Verify Current Password]
    VerifyCurrent --> SetNewPassword[Set New Password]
    SetNewPassword --> UpdatePassword[Update in Firebase]
    
    NotificationSettings --> ToggleNotifications[Toggle Notifications]
    ToggleNotifications --> UpdatePreferences[Update Preferences]
    
    SystemSettings --> ViewLogs[View System Logs]
    SystemSettings --> ExportData[Export Data]
    SystemSettings --> ClearCache[Clear Cache]
    
    UpdateName --> SaveSettings[Save Settings]
    UpdateEmail --> SaveSettings
    UpdateAvatar --> SaveSettings
    UpdatePassword --> SaveSettings
    UpdatePreferences --> SaveSettings
    
    SaveSettings --> UpdateFirestore[Update Firestore]
    UpdateFirestore --> ShowSuccess[Show Success Message]
    ShowSuccess --> RefreshPage[Refresh Page]
    
    style SettingsPage fill:#fff4e6
    style ProfileSettings fill:#e1f5ff
    style SecuritySettings fill:#fff3cd
    style SaveSettings fill:#d4edda
```

---

## 🔄 Logout Flow

```mermaid
flowchart TD
    AnyPage[Any Admin Page] --> ClickLogout[Click Logout Button]
    ClickLogout --> ConfirmLogout{Confirm Logout?}
    ConfirmLogout -->|Cancel| StayOnPage[Stay on Current Page]
    ConfirmLogout -->|Confirm| SignOut[Sign Out from Firebase]
    SignOut --> ClearSession[Clear Session Data]
    ClearSession --> ClearLocalStorage[Clear Local Storage<br/>Optional: Keep Remembered Email]
    ClearLocalStorage --> RedirectLogin[Redirect to index.html]
    RedirectLogin --> LoginPage[index.html<br/>Login Page]
    
    style AnyPage fill:#fff4e6
    style SignOut fill:#f8d7da
    style RedirectLogin fill:#d1ecf1
    style LoginPage fill:#e1f5ff
```

---

## 📱 Real-time Updates Flow

```mermaid
flowchart TD
    PageLoad[Page Loads] --> SetupListeners[Setup Firestore Listeners]
    SetupListeners --> ListenUsers[Listen to Users Collection]
    SetupListeners --> ListenProducts[Listen to Products Collection]
    SetupListeners --> ListenTickets[Listen to Tickets Collection]
    SetupListeners --> ListenPayments[Listen to Payments Collection]
    SetupListeners --> ListenVerifications[Listen to Verifications Collection]
    
    ListenUsers --> OnUserChange[On User Document Change]
    ListenProducts --> OnProductChange[On Product Document Change]
    ListenTickets --> OnTicketChange[On Ticket Document Change]
    ListenPayments --> OnPaymentChange[On Payment Document Change]
    ListenVerifications --> OnVerificationChange[On Verification Document Change]
    
    OnUserChange --> UpdateUserUI[Update User UI]
    OnProductChange --> UpdateProductUI[Update Product UI]
    OnTicketChange --> UpdateTicketUI[Update Ticket UI]
    OnPaymentChange --> UpdatePaymentUI[Update Payment UI]
    OnVerificationChange --> UpdateVerificationUI[Update Verification UI]
    
    UpdateUserUI --> RefreshBadges[Refresh Badge Counts]
    UpdateProductUI --> RefreshBadges
    UpdateTicketUI --> RefreshBadges
    UpdatePaymentUI --> RefreshBadges
    UpdateVerificationUI --> RefreshBadges
    
    RefreshBadges --> UpdateSidebar[Update Sidebar Badges]
    UpdateSidebar --> ShowNotification[Show Toast Notification<br/>Optional]
    
    style PageLoad fill:#e1f5ff
    style SetupListeners fill:#fff3cd
    style UpdateUserUI fill:#d1ecf1
    style RefreshBadges fill:#d4edda
```

---

## 🔐 Security & Authentication Checks

```mermaid
flowchart TD
    PageAccess[User Accesses Any Page] --> CheckAuth{User Authenticated?}
    CheckAuth -->|No| RedirectLogin[Redirect to index.html]
    CheckAuth -->|Yes| CheckRole{Has Admin Role?}
    CheckRole -->|No| CheckUserDoc{User Doc Exists?}
    CheckUserDoc -->|No| CreateUserDoc[Create User Doc<br/>Set role: 'admin']
    CheckUserDoc -->|Yes| UpdateRole[Update Role to 'admin']
    CreateUserDoc --> AllowAccess[Allow Access]
    UpdateRole --> AllowAccess
    CheckRole -->|Yes| AllowAccess
    AllowAccess --> LoadPage[Load Page Content]
    
    LoadPage --> SetupAuthListener[Setup Auth State Listener]
    SetupAuthListener --> OnAuthChange{Auth State Changed?}
    OnAuthChange -->|Signed Out| RedirectLogin
    OnAuthChange -->|Role Changed| RecheckRole[Recheck Admin Role]
    RecheckRole -->|Not Admin| RedirectLogin
    RecheckRole -->|Admin| ContinueSession[Continue Session]
    
    style PageAccess fill:#e1f5ff
    style CheckAuth fill:#fff3cd
    style CheckRole fill:#fff3cd
    style AllowAccess fill:#d4edda
    style RedirectLogin fill:#f8d7da
```

---

## 📊 Data Flow Summary

```mermaid
flowchart LR
    AdminPanel[Admin Panel] --> Firestore[(Firestore Database)]
    Firestore --> Collections[Collections]
    
    Collections --> Users[users]
    Collections --> Products[products]
    Collections --> Tickets[tickets]
    Collections --> Payments[paymentTransactions]
    Collections --> Verifications[verifications]
    Collections --> Chats[chats]
    Collections --> Notifications[notifications]
    
    AdminPanel --> Actions[Admin Actions]
    Actions --> Create[Create]
    Actions --> Read[Read]
    Actions --> Update[Update]
    Actions --> Delete[Delete]
    
    Create --> Notifications
    Update --> Notifications
    Delete --> Notifications
    
    Notifications --> MobileApp[Mobile App]
    MobileApp --> UserNotification[User Receives Notification]
    
    style AdminPanel fill:#e1f5ff
    style Firestore fill:#d4edda
    style Notifications fill:#fff3cd
    style MobileApp fill:#d1ecf1
```

---

## 🎯 Key Features Summary

### Authentication
- ✅ Email/Password login
- ✅ Default admin auto-creation
- ✅ Role-based access control
- ✅ Session management
- ✅ Remember me functionality

### Dashboard
- ✅ Real-time metrics
- ✅ Activity feed
- ✅ Charts and graphs
- ✅ Quick navigation

### User Management
- ✅ View all users
- ✅ Filter and search
- ✅ Enable/Disable users
- ✅ Send warnings
- ✅ View user products

### Product Management
- ✅ View all products
- ✅ Filter by status/category
- ✅ Warn sellers
- ✅ Delete products
- ✅ View product details

### ID Verification
- ✅ View verification requests
- ✅ Approve/Reject verifications
- ✅ View ID documents
- ✅ Update user verification status

### Payment Management
- ✅ View payment transactions
- ✅ Verify payments
- ✅ Reject payments
- ✅ View receipts
- ✅ Update product boost status

### Report Tickets
- ✅ View all tickets
- ✅ Filter by status/priority
- ✅ Assign tickets
- ✅ Resolve tickets
- ✅ Add resolution notes

### Customer Support
- ✅ View support chats
- ✅ Send messages
- ✅ View user profiles
- ✅ Close chats

### Settings
- ✅ Profile management
- ✅ Security settings
- ✅ Notification preferences
- ✅ System settings

---

## 🔄 Navigation Map

```
index.html (Login)
    ↓
dashboard.html (Main Hub)
    ├──→ users.html
    ├──→ products.html
    ├──→ pending-verifications.html
    ├──→ payments.html
    ├──→ report.html
    ├──→ customer-support.html
    └──→ settings.html
```

---

## 📝 Notes

- All pages require admin authentication
- Real-time updates via Firestore listeners
- Notifications sent to mobile app on actions
- All admin actions are logged
- Default admin: `agriconnect.admin@gmail.com` / `Test123!`
- Session persists until logout or expiration
- Badge counts update in real-time

---

**Last Updated:** 2025-01-13  
**Version:** 1.0

