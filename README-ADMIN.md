# Admin Dashboard

Admin pages are protected - only users with admin role can access them.

## Making someone an admin

Easiest way is to run the script:

```bash
npx tsx scripts/make-admin.ts your-email@example.com
```

Then log out and back in to refresh the session.

You can also update it directly in the database:

```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

## Accessing the dashboard

Once you're an admin, go to `/admin` route. There you can:
- View all users and articles
- Delete users (except yourself)
- Delete articles
- See basic stats

## Features

The admin panel has protections both on the frontend and API level. Non-admins get redirected if they try to access admin routes.

## Notes

Make sure to keep your MongoDB connection secure since admin access is powerful. Also you can't delete your own admin account from the panel (safety feature).



