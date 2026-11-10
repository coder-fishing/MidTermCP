# Quản lý người dùng bằng Firebase - Kế hoạch triển khai

> **Dành cho tác nhân triển khai:** BẮT BUỘC dùng skill qskill-executing-plans để triển khai lần lượt từng task trong kế hoạch này. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ. Kế hoạch chỉ mô tả cấu trúc, giao diện hàm và hành vi; đọc file thật trước khi sửa code.

**Goal:** Thay app Expo mẫu bằng ứng dụng admin quản lý hồ sơ người dùng trên web và mobile, dùng Firebase Auth, Firestore và Cloudinary.

**Architecture:** Expo là client dùng chung cho web và mobile. Firebase Auth chỉ xác thực admin; Firestore lưu hồ sơ user với đúng bốn trường nghiệp vụ và hash mật khẩu; Cloudinary lưu ảnh, Firestore lưu URL ảnh.

**Tech Stack:** Expo SDK 58, React Native, Expo Router, Firebase JavaScript SDK 13.2, Firebase Authentication, Cloud Firestore, Expo ImagePicker, Cloudinary unsigned upload preset, bcryptjs.

**Spec:** `docs/superpowers/specs/2026-11-10-firebase-admin-user-management-design.md`

**Plan slug:** `2026-11-10-firebase-admin-user-management` — tên file kế hoạch không gồm phần mở rộng; mọi commit của work stream này bắt đầu bằng `[2026-11-10-firebase-admin-user-management]`.

## Ràng buộc chung

- Chỉ admin đăng nhập; user được quản lý là bản ghi Firestore, không phải tài khoản Firebase Auth.
- Firestore lưu đúng các trường `email`, `name`, `pass`, `avtUrl`; không thêm trường nghiệp vụ khác.
- `pass` luôn là hash một chiều; không lưu hoặc hiển thị mật khẩu thô.
- Không thêm Express, MongoDB, Firebase Storage hoặc Cloud Functions.
- Cloudinary API secret không được đưa vào client hoặc biến `EXPO_PUBLIC_*`.
- Security Rules chỉ cho admin đã đăng nhập đọc/ghi collection `users`.
- Bảo toàn các thay đổi hiện có của người dùng trong `.gitignore`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.env` và `src/lib/firebase.ts`; chỉ chỉnh file nào cần thiết cho task.
- Không thêm hay chạy bộ automated tests; dùng kiểm tra thủ công, lint và typecheck.
- Trước khi làm UI, hỏi người dùng chọn áp dụng Antislop trong lúc làm hay sau khi xong và xác nhận hướng hình ảnh; không viết UI trước khi có câu trả lời.

## Cấu trúc file dự kiến

- Modify `src/lib/firebase.ts`: khởi tạo Firebase App và Firestore; bỏ khởi tạo Firebase Storage.
- Create `src/lib/firebase.native.ts`: khởi tạo Firebase Auth trên Android/iOS với persistence phù hợp.
- Create `src/lib/firebase.web.ts`: khởi tạo Firebase Auth cho trình duyệt.
- Create `src/lib/admin-auth.ts`: đăng nhập, đăng xuất và theo dõi trạng thái phiên admin.
- Create `src/lib/password.ts`: tạo bcrypt hash cho giá trị nhập mới.
- Create `src/lib/users.ts`: kiểu dữ liệu và thao tác Firestore cho hồ sơ user.
- Create `src/lib/cloudinary.ts`: tải ảnh lên bằng Cloudinary unsigned preset và trả về URL an toàn.
- Create `firestore.rules`: quyền admin và kiểm tra đúng bốn trường.
- Create `.env.example`: tên hai biến public cho Cloudinary; không chứa key thật.
- Modify `app.json`: plugin và nội dung quyền truy cập thư viện ảnh theo Expo SDK 58.
- Modify `src/app/index.tsx`: luồng admin; hiển thị đăng nhập khi chưa có phiên và danh sách khi đã đăng nhập.
- Create `src/components/admin-login.tsx`: biểu mẫu đăng nhập admin.
- Create `src/components/users/user-directory.tsx`: danh sách, tìm kiếm, trạng thái tải/rỗng/lỗi và thao tác CRUD.
- Create `src/components/users/user-form.tsx`: biểu mẫu thêm/sửa email, name, pass mới tùy chọn và ảnh.
- Modify `src/components/app-tabs.tsx` và `src/components/app-tabs.web.tsx`: đổi nhãn điều hướng khỏi nội dung Expo mẫu.
- Remove `src/app/explore.tsx` nếu sau khi điều hướng được cập nhật route này không còn được dùng.

---

### Task 1: Hoàn thiện Firebase client, admin auth và Firestore rules

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/lib/firebase.ts`
- Create: `src/lib/firebase.native.ts`
- Create: `src/lib/firebase.web.ts`
- Create: `src/lib/admin-auth.ts`
- Create: `firestore.rules`

**Interfaces:**
- `firebase.ts` cung cấp Firebase App và Firestore dùng chung.
- `firebase.native.ts` và `firebase.web.ts` mỗi file cung cấp một Firebase Auth instance phù hợp nền tảng.
- `signInAdmin(email: string, password: string): Promise<User>` đăng nhập admin.
- `signOutAdmin(): Promise<void>` đăng xuất admin.
- `subscribeToAdminAuth(onChange: (user: User | null) => void): Unsubscribe` theo dõi phiên đăng nhập.

- [ ] **Bước 1: Cài thư viện phù hợp Expo SDK 58**

Chạy `npx expo install @react-native-async-storage/async-storage`. Không cài Firebase CLI; Firestore rules sẽ được dán và publish trong Firebase Console.

- [ ] **Bước 2: Tách khởi tạo Firebase dùng chung và Auth theo nền tảng**

Sửa `src/lib/firebase.ts` để giữ config hiện có, khởi tạo một Firebase App duy nhất, xuất `app` và `db`, đồng thời bỏ `getStorage`. Tạo `src/lib/firebase.native.ts` dùng AsyncStorage cho phiên Auth trên Android/iOS; tạo `src/lib/firebase.web.ts` dùng persistence trình duyệt.

- [ ] **Bước 3: Thêm dịch vụ đăng nhập admin**

Tạo `src/lib/admin-auth.ts` với ba hàm trong Interfaces. Đăng nhập chỉ dùng tài khoản đã tạo trong Firebase Console; app không có đăng ký admin hoặc đăng ký user. Sai thông tin đăng nhập trả lỗi có thể hiển thị được, không làm app treo.

- [ ] **Bước 4: Tạo và publish Firestore rules**

Tạo `firestore.rules` để chỉ UID admin được đọc/ghi `users`. Quy tắc ghi phải từ chối document thiếu hoặc thừa field so với `email`, `name`, `pass`, `avtUrl`. Dán nội dung rules vào Firebase Console, thay UID bằng UID admin trong Authentication → Users, rồi publish.

- [ ] **Bước 5: Kiểm tra thủ công**

- Admin đúng email/mật khẩu đăng nhập được trên web -> trạng thái auth chuyển sang đã đăng nhập.
- Sai mật khẩu -> hiển thị lỗi và vẫn ở màn hình đăng nhập.
- Đăng xuất -> trạng thái auth trở về chưa đăng nhập.
- Firestore rules chỉ cho UID admin đọc/ghi `users` -> truy cập bằng session không đăng nhập bị từ chối.

- [ ] **Bước 6: Commit task**

```bash
git add package.json pnpm-lock.yaml src/lib/firebase.ts src/lib/firebase.native.ts src/lib/firebase.web.ts src/lib/admin-auth.ts firestore.rules
git commit -m "[2026-11-10-firebase-admin-user-management] Configure Firebase admin authentication

Plan: docs/superpowers/plans/2026-11-10-firebase-admin-user-management.md
Task: 1"
```

### Task 2: Tạo dịch vụ hồ sơ user và hash mật khẩu

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/lib/password.ts`
- Create: `src/lib/users.ts`
- Modify: `firestore.rules`

**Interfaces:**
- `UserDocument`: `{ email: string; name: string; pass: string; avtUrl: string }`.
- `UserListItem`: `UserDocument` cộng `id: string` chỉ dùng trong app; `id` không được ghi thành field Firestore.
- `UserInput`: email, name, mật khẩu nhập mới và `avtUrl`.
- `UserUpdateInput`: email, name, `avtUrl`, mật khẩu mới tùy chọn.
- `UserFormValues`: `{ email: string; name: string; newPassword: string; selectedImage: ImagePickerAsset | null }`.
- `hashPassword(password: string): Promise<string>` trả bcrypt hash.
- `listUsers(): Promise<UserListItem[]>` trả danh sách sắp xếp theo email.
- `createUser(input: UserInput): Promise<string>` tạo một document đúng bốn field.
- `updateUser(id: string, input: UserUpdateInput): Promise<void>` cập nhật hồ sơ và chỉ thay hash nếu có mật khẩu mới.
- `deleteUser(id: string): Promise<void>` xóa document tương ứng.

- [ ] **Bước 1: Cài bcryptjs**

Chạy `npx expo install bcryptjs` để chọn gói dùng được với cấu hình Expo hiện tại.

- [ ] **Bước 2: Tạo hàm hash mật khẩu**

Tạo `src/lib/password.ts`. Hash mật khẩu mới bằng bcrypt với salt được tạo ngẫu nhiên; hàm không ghi log mật khẩu. Giá trị lưu trong field `pass` là hash tự chứa salt.

- [ ] **Bước 3: Tạo thao tác Firestore**

Tạo `src/lib/users.ts`. Chuẩn hóa email thành chữ thường trước khi ghi; kiểm tra email trùng trước khi tạo hoặc đổi email. Khi sửa mà mật khẩu mới để trống, giữ nguyên hash cũ. Khi xóa, chỉ xóa document được chỉ định. Chỉ xuất `id` riêng cho UI, không ghi vào document.

- [ ] **Bước 4: Cập nhật rules để xác thực schema**

Trong `firestore.rules`, yêu cầu email, name, pass và avtUrl đều là string; chỉ chấp nhận đúng bốn keys. Giữ nguyên điều kiện UID admin từ Task 1.

- [ ] **Bước 5: Kiểm tra thủ công**

- Ghi một user -> Firestore có đúng bốn keys và `pass` khác mật khẩu nhập ban đầu.
- Email đã tồn tại -> thao tác tạo hoặc đổi email bị từ chối với lỗi trùng email.
- Sửa chỉ name/avatar -> hash cũ không bị ghi đè.
- Xóa user -> document đó biến mất khỏi danh sách, document khác còn nguyên.

- [ ] **Bước 6: Commit task**

```bash
git add package.json pnpm-lock.yaml src/lib/password.ts src/lib/users.ts firestore.rules
git commit -m "[2026-11-10-firebase-admin-user-management] Add hashed user record operations

Plan: docs/superpowers/plans/2026-11-10-firebase-admin-user-management.md
Task: 2"
```

### Task 3: Tích hợp chọn ảnh và Cloudinary upload

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `app.json`
- Create: `.env.example`
- Create: `src/lib/cloudinary.ts`

**Interfaces:**
- `uploadAvatar(asset: ImagePickerAsset): Promise<string>` tải ảnh lên Cloudinary và trả `secure_url`.

- [ ] **Bước 1: Cài Expo ImagePicker SDK 58 và bật cấu hình quyền ảnh**

Chạy `npx expo install expo-image-picker`. Thêm plugin vào `app.json` với thông báo quyền truy cập thư viện ảnh phù hợp và tắt quyền microphone vì app không ghi âm.

- [ ] **Bước 2: Khai báo biến public cần thiết**

Tạo `.env.example` chỉ có `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` và `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`. Cập nhật `.env` cục bộ bằng cloud name và tên unsigned preset của người dùng. Không đọc, hiển thị hoặc dùng `CLOUDINARY_API_SECRET` trong client; không ghi giá trị thật vào `.env.example`.

- [ ] **Bước 3: Tạo hàm upload ảnh dùng chung web/mobile**

Tạo `src/lib/cloudinary.ts`. Chấp nhận ảnh do ImagePicker trả về; gửi ảnh đến endpoint image upload của Cloudinary bằng unsigned preset. Trên web dùng file từ asset; trên native dùng URI. Trả `secure_url` khi thành công; nếu biến cấu hình thiếu hoặc Cloudinary trả lỗi, trả thông báo rõ và không cập nhật Firestore.

- [ ] **Bước 4: Kiểm tra thủ công**

- Chọn ảnh PNG/JPG trên web -> Cloudinary trả secure URL.
- Chọn ảnh trong thư viện điện thoại -> Cloudinary trả secure URL.
- Thiếu upload preset hoặc mạng lỗi -> hiển thị lỗi, không lưu URL rỗng vào Firestore.
- Kiểm tra bundle/config -> không có API secret.

- [ ] **Bước 5: Commit task**

```bash
git add package.json pnpm-lock.yaml app.json .env.example src/lib/cloudinary.ts
git commit -m "[2026-11-10-firebase-admin-user-management] Upload profile images through Cloudinary

Plan: docs/superpowers/plans/2026-11-10-firebase-admin-user-management.md
Task: 3"
```

### Task 4: Xây màn hình admin và luồng CRUD responsive

**Files:**
- Modify: `src/app/index.tsx`
- Modify: `src/components/app-tabs.tsx`
- Modify: `src/components/app-tabs.web.tsx`
- Create: `src/components/admin-login.tsx`
- Create: `src/components/users/user-directory.tsx`
- Create: `src/components/users/user-form.tsx`
- Remove: `src/app/explore.tsx` nếu không còn route nào dùng.

**Interfaces:**
- `AdminLogin`: nhận email/password, gọi `signInAdmin`, hiển thị lỗi đăng nhập.
- `UserDirectory`: không nhận props; điều phối `listUsers`, CRUD và Cloudinary upload.
- `UserForm`: nhận `initialUser: UserListItem | null`, `onSave(values: UserFormValues): Promise<void>`, `onCancel(): void`.

- [ ] **Bước 1: Thay màn hình index bằng auth gate**

Trước khi viết UI, hỏi người dùng chọn Antislop DURING hoặc AFTER và chốt hướng hình ảnh vì project chưa có `DESIGN.md`. Chỉ tiếp tục phần UI sau khi người dùng trả lời.

Trong `src/app/index.tsx`, theo dõi Auth state. Khi chưa đăng nhập hiển thị `AdminLogin`; khi đã đăng nhập hiển thị `UserDirectory`. Có hành động đăng xuất rõ ràng.

- [ ] **Bước 2: Làm form login admin**

Tạo `src/components/admin-login.tsx` với email, password, nút đăng nhập, trạng thái đang gửi và lỗi xác thực. Không tạo public sign-up.

- [ ] **Bước 3: Làm danh sách và tìm kiếm**

Tạo `src/components/users/user-directory.tsx`. Tải danh sách qua `listUsers`, tìm kiếm theo email/name, hiển thị tên, email và avatar. Không hiển thị `pass` hoặc hash. Có trạng thái loading, empty, error, nút tạo mới và sign out.

- [ ] **Bước 4: Làm form thêm/sửa và xóa**

Tạo `src/components/users/user-form.tsx`. Kiểm tra email hợp lệ và name không rỗng. Khi tạo, yêu cầu mật khẩu mới và có thể chọn ảnh; khi sửa, để trống mật khẩu nghĩa là giữ hash hiện có. Upload ảnh trước khi ghi Firestore; lỗi upload thì giữ hồ sơ cũ. Xác nhận trước khi xóa.

- [ ] **Bước 5: Bỏ điều hướng starter không liên quan**

Đổi tên tab Home thành Users trong native/web tabs; bỏ tab Explore và link Docs của template. Giữ theme light/dark và token khoảng cách hiện có.

- [ ] **Bước 6: Kiểm tra thủ công**

- Admin đăng nhập -> thấy danh sách user.
- Thêm user có ảnh -> đúng bốn Firestore fields; avatar hiển thị.
- Tìm tên/email -> chỉ user khớp được hiển thị.
- Sửa name/email/avatar mà không nhập password -> hash vẫn nguyên.
- Nhập password mới khi sửa -> giá trị hash thay đổi, không hiển thị trên UI.
- Xóa user rồi hủy xác nhận -> user còn; xác nhận xóa -> user biến mất.
- Mobile viewport -> list không tràn ngang, nút/form dùng được bằng chạm và chọn ảnh được.
- Logout -> quay lại login.

- [ ] **Bước 7: Chạy kiểm tra project được yêu cầu**

Chạy `npx expo lint` và `npx tsc --noEmit`. Chạy `npx expo start --web` để mở app web và quét Expo Go trên điện thoại để kiểm tra mobile. Không thêm hoặc chạy automated test suite.

- [ ] **Bước 8: Commit task**

```bash
git add src/app/index.tsx src/app/explore.tsx src/components/app-tabs.tsx src/components/app-tabs.web.tsx src/components/admin-login.tsx src/components/users/user-directory.tsx src/components/users/user-form.tsx
git commit -m "[2026-11-10-firebase-admin-user-management] Build responsive admin user management

Plan: docs/superpowers/plans/2026-11-10-firebase-admin-user-management.md
Task: 4"
```

## Hoàn tất

- Xác nhận lint và typecheck hoàn tất.
- Chạy app trên web và mobile, thực hiện lại các luồng acceptance ở Task 4.
- Kiểm tra Git status; không đưa `.env` hoặc giá trị secret vào commit.
- Khi app sẵn sàng, chuẩn bị riêng báo cáo, ảnh database/export JSON, GitHub link và demo video theo yêu cầu môn học.
