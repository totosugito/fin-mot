## A. DB PREPARATION
Create postgres user and create the database *sicerdas*
```
psql -U postgres
CREATE USER sicerdas WITH PASSWORD 'a';
ALTER USER sicerdas WITH CREATEDB LOGIN;
ALTER USER sicerdas WITH SUPERUSER;
```

## B. Backend Setup
### 1. Clone this repo & install dependencies
`npm install`

### 2. Create Table schema
`npm run db:generate`

### 3. create the database and push schema to database
`npm run db:push`

### 4. create default data
```
npm run db:init_user
```

### 4. Start the Fastify server as development mode
```
npm run dev
```

### 5. Building
```
npm run build
```

## C. BETTER-AUTH API Documentation
better-auth api documentation
1. */auth/sign-in* – [POST] - Sign in via email, password, social providers, or passkey (WebAuthn)
2. */auth/sign-up* – [POST] - New account registration, with additional fields supported
3. */auth/request-password-reset* – [POST] (email, redirectTo) - Trigger password reset email
4. */auth/reset-password* – [POST] (newPassword, token) - Allow users to reset forgotten passwords
5. */auth/sign-out* – [POST] - Log out action
6. */auth/get-session* – [GET] - Get current session information (authentication required)

note:
- *sign-in* and *sign-up* : add ...api_path/*email* when the user try to call api from emailAndPassword login method.

Reset password flow
1. send request to /request-password-reset endpoint.
2. get token from email link.
3. call /reset-password endpoint with new password and token.

