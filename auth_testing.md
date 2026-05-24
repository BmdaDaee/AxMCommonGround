# Auth-Gated App Testing Playbook

This app supports email/password auth and Emergent-managed Google OAuth.

## Create a Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  role: 'admin',
  values: ['trust','growth'],
  interests: ['dialogue'],
  goals: ['practice repair'],
  communication_style: 'Reflective',
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Verify Backend
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
curl -X GET "$API_URL/api/matches" -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Browser Cookie Test
Set `session_token` as an httpOnly secure cookie for the preview domain and open `/dashboard`.

## Google OAuth Notes
- Do not store Google passwords.
- Valid Google users are created/updated from `/api/auth/google/session` after the OAuth callback.