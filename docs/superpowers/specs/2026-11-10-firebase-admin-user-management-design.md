# Firebase Admin User Management Design

## Goal

Replace the Expo starter screens with a cross-platform admin user-management app that runs on web and mobile and meets the midterm brief.

## Confirmed scope

- Only the admin signs in. Managed users are records, not Firebase Authentication accounts.
- The admin can list, search, create, edit, and delete user records.
- The mobile app can display user details and select a profile image.
- Firebase is the application backend. Do not add Express or MongoDB.
- Cloudinary stores uploaded images because Firebase Storage requires the Blaze billing plan for new buckets.
- Firestore stores each user document with exactly four application fields: `email`, `name`, `pass`, and `avtUrl`.
- `pass` must contain a one-way hash, never a plaintext password. The app must not display or recover an existing password; editing a record can set a new password.

## Architecture

### Client

The existing Expo application remains the single web and mobile client. It uses the Firebase JavaScript SDK for Firebase Authentication and Cloud Firestore. The admin account is provisioned in Firebase Authentication Console; the app has no public sign-up flow.

### Authentication and data access

Firebase Authentication signs in the admin. Firestore Security Rules restrict the `users` collection to the approved admin identity. The users collection contains only `email`, `name`, `pass`, and `avtUrl`; generated document IDs are Firestore metadata, not additional user fields.

The `pass` field is a one-way hash for the assignment's required export schema. Managed users do not authenticate with this field. The admin session is handled only by Firebase Authentication.

### Image upload

The client selects an image with the platform-appropriate Expo image picker, uploads it directly to Cloudinary using an unsigned upload preset, and stores the returned `secure_url` in `avtUrl`.

Only the Cloudinary cloud name and unsigned upload preset may be used by the client. The Cloudinary API secret must not be imported into or bundled with the Expo app. Restrict the upload preset to image formats and a dedicated folder.

## User flows

### Admin login

1. Admin enters email and password.
2. Firebase Authentication signs in the pre-created admin account.
3. The admin reaches the user directory.
4. Admin can sign out.

### User directory and CRUD

1. Load and display user records from Firestore.
2. Search locally by email or name.
3. Create a record after validating required fields and hashing the newly entered password.
4. Edit email/name/avatar; only replace the password when the admin explicitly enters a new one.
5. Confirm before deleting a record.
6. Show loading, empty, success, and error states.

### Mobile image flow

1. Admin selects a user record.
2. The app opens the device image picker.
3. The app uploads the selected image to Cloudinary.
4. The app updates `avtUrl` in Firestore and displays the returned image URL.

## Interface direction

Keep the user directory as the primary screen. On wider web layouts, use a compact management table with a clear create action and an edit form. On narrow mobile layouts, use a scrollable list and a focused record form with touch-sized controls. Preserve the starter app's light/dark system support unless implementation reveals a concrete compatibility issue. Avoid inventing extra user fields or unrelated dashboard metrics.

## Validation and failure behavior

- Email must be present and syntactically valid.
- Name must be present.
- Password is required for create and optional for edit; it is never rendered back to the screen.
- Image upload errors must leave the existing Firestore record unchanged.
- Firestore permission errors must direct the admin to check the signed-in account and rules.
- Duplicate email handling must be explicit and non-destructive.
- A delete action requires confirmation.

## Security and cost constraints

- Never store plaintext passwords.
- Never expose the Cloudinary API secret in client code or `EXPO_PUBLIC_*` variables.
- Keep Firestore in Production mode and restrict reads/writes to the admin identity.
- Do not enable Firebase Storage or upgrade the project to Blaze as part of this design.
- The unsigned Cloudinary preset is client-visible; restrict accepted formats and upload behavior, and rotate/disable it if abused.

## Out of scope

- Separate user sign-up or user login.
- User roles beyond the single admin.
- Firebase Storage, Express, MongoDB, or Cloud Functions.
- Additional profile fields, such as timestamps or roles.
- A report document or video recording.

## Acceptance criteria

- Admin can sign in and sign out on web and mobile.
- Admin can list, search, create, edit, and delete Firestore user records.
- Firestore records have exactly the four application fields specified above.
- Password values are stored as hashes and never shown in plaintext.
- A selected image uploads to Cloudinary and the returned `secure_url` is stored in `avtUrl`.
- Mobile displays user details and supports choosing and updating an image.
- Empty, loading, and error states are visible and actionable.
- Existing user changes in the worktree remain untouched unless directly required by the implementation.
