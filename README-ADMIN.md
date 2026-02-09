# Admin Dashboard Guide

## 🔐 Security & Access Control

The admin dashboard is **fully protected** and only accessible to users with the `admin` role.

### Protection Features:
- ✅ **Client-side protection**: All admin pages check user role and redirect non-admins
- ✅ **API protection**: All admin API endpoints verify admin role
- ✅ **Automatic redirect**: Non-admin users are sent to homepage
- ✅ **Self-protection**: Admins cannot delete their own account

---

## 👤 Making a User an Admin

### Method 1: Using the Script (Recommended)

1. **Install tsx** (if not already installed):
   ```bash
   npm install -g tsx
   ```

2. **Run the make-admin script**:
   ```bash
   npx tsx scripts/make-admin.ts your-email@example.com
   ```

3. **Log out and log back in** to refresh your session

4. **Navigate to** `/admin` to access the dashboard

### Method 2: Direct Database Update

If you have access to MongoDB Compass or mongosh:

```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

### Method 3: During Registration

When creating a new user, you can manually set their role to `admin` in the database after registration.

---

## 📍 Accessing the Admin Dashboard

1. **Login** with an admin account
2. **Navigate to** `/admin` or click "Admin" in the header (if you add a link)
3. **Use the sidebar** to navigate between sections:
   - **Dashboard** - System overview and statistics
   - **Articles** - Manage all articles
   - **Users** - Manage all users

---

## 🎯 Admin Capabilities

### Article Management (`/admin/articles`)
- ✅ View all articles in the system
- ✅ Search articles by title or content
- ✅ Delete any article
- ✅ Filter by category or status
- ✅ Pagination for large datasets

### User Management (`/admin/users`)
- ✅ View all users
- ✅ Change user roles (reader, author, editor, admin)
- ✅ Delete users (except yourself)
- ✅ Search users by name or email
- ✅ View user statistics

### Dashboard (`/admin`)
- ✅ Total articles, users, views
- ✅ Published vs draft articles
- ✅ User distribution by role
- ✅ Recent articles
- ✅ Top articles by views

---

## 🚨 Important Notes

1. **First Admin**: You must manually make the first admin user using one of the methods above
2. **Cannot Delete Self**: Admins cannot delete their own account for safety
3. **Role Changes**: After changing a user's role, they need to log out and log back in
4. **Permanent Actions**: Deleting articles and users is permanent and cannot be undone

---

## 🔗 Quick Links

- Admin Dashboard: `/admin`
- Article Management: `/admin/articles`
- User Management: `/admin/users`

---

## 🛡️ Security Best Practices

1. **Limit admin accounts** - Only give admin access to trusted users
2. **Use strong passwords** - Admins have full system access
3. **Regular audits** - Periodically review who has admin access
4. **Backup data** - Before bulk deletions, ensure you have backups
