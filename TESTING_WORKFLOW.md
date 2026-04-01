# Drone Management Testing Workflow

## Test Setup

1. Apply database migrations.
   `cd C:\Developement\Drones-APP\DroneManagement.Api`
   `dotnet ef database update`

2. Start the API.
   `dotnet run`

3. Start the frontend in a second terminal.
   `cd C:\Developement\Drones-APP\DroneManagement.Frontend`
   `npm run dev`

4. Open the SPA and confirm the left sidebar shows the modules:
   `Dashboard`, `Drones`, `Permits`, `Admin Requests`, `Air Force Ops`, `Users`, `Units`, `Categories`, `Licenses`, `No-Fly Zones`

## Accounts To Use

- Super admin:
  `super.admin / Super@123`
- Seeded admin:
  `ali.ops / pass123`
- Seeded user:
  `maya.recon / pass123`
- Pending user:
  `pending.user / pass123`

## A To Z Functional Flow

### 1. Security And Login

1. Login with `super.admin / Super@123`.
2. Confirm login succeeds.
3. Copy the stored hash from the database for any user and try to use that hash as the password in the login form.
4. Confirm login fails.
   Expected result: hashed value itself must not work as a password anymore.
5. Try a wrong plain password.
6. Confirm login fails with invalid credentials.

### 2. Core Master Data

1. Open `Units`.
2. Add a new unit from the modal.
3. Edit the unit from the edit modal.
4. Open `Categories`.
5. Add a new category from the modal.
6. Edit the category from the edit modal.
7. Open `No-Fly Zones`.
8. Add a new restricted zone from the modal.
9. Edit the zone from the edit modal.

### 3. User Registration Workflow

1. Open `Users`.
2. Add a brand-new user from the add-user modal.
3. Confirm the new user appears as not approved.
4. Logout.
5. Try logging in with that new user.
6. Confirm login is rejected because approval is pending.
7. Login again as `super.admin`.
8. Approve the user.
9. Logout and login again using the approved user.
10. Confirm login now succeeds.

### 4. Drone Assignment Workflow

1. Login as `super.admin` or `ali.ops`.
2. Open `Drones`.
3. Select a username and load the user drones.
4. Add a drone from the add-drone modal.
5. Confirm the drone appears in the table under that user.
6. Logout and login as that same user.
7. Confirm the user can see only their own drones.

### 5. License Workflow

1. Login as admin-like user.
2. Open `Licenses`.
3. Add a license from the modal for the drone created in the previous step.
4. Edit the license status or expiry date from the edit modal.
5. Confirm the license table updates correctly.

### 6. Permit Request Workflow

1. Login as the approved regular user.
2. Open `Permits`.
3. Submit a permit request from the modal using one of the user drones.
4. Confirm the request appears in the permits list.
5. If needed, click `Submit Cash` when the permit reaches payment stage later.

### 7. Admin Permit Processing Workflow

1. Login as `ali.ops` or `super.admin`.
2. Open `Admin Requests`.
3. Find the submitted permit.
4. Click `Internal Approve`.
5. Confirm permit status becomes payment-related.
6. Logout and login as the regular user.
7. Open `Permits` and click `Submit Cash`.
8. Logout and login again as admin-like user.
9. Open `Admin Requests`.
10. Click `Confirm Cash`.
11. Click `Issue License`.
12. Confirm status becomes `Approved`.
13. Click `Receipt`.
14. Confirm the receipt dialog opens and shows permit details and QR data.

### 8. Air Force Operations Workflow

1. Login as admin-like user.
2. Open `Air Force Ops`.
3. Confirm the approved permit appears in operations.
4. Confirm countdown / monitoring status is visible.
5. If permit start time is within 30 minutes, confirm the alert surfaces in the app alert dialog.

### 9. Incident And Refund Workflow

1. Open `Admin Requests`.
2. Enter an incident note and pickup details.
3. Click `Incident` for an approved permit.
4. Confirm permit moves into refund-related handling.
5. If logged in as `super.admin`, use `Send Refund`.
6. If logged in as `Admin`, use `Receive Refund`.
7. Then use `Pay Refund`.
8. Confirm the refund status progresses through the full chain.
9. Open notifications and confirm related in-app messages are present.

## UI Checks

1. Visit each module in the left sidebar.
2. Confirm add/edit actions open modals rather than inline forms.
3. Confirm cards, dialogs, buttons, inputs, and tables use `5px` radius consistently.
4. Confirm layout still works on both desktop and smaller widths.

## Regression Checklist

- Login with real password works.
- Login with stored hash fails.
- Sidebar routes navigate correctly.
- Add/edit modal opens correctly in each module.
- No seeded route is broken by the move away from `master-data`.
- Receipt dialog still opens.
- Notifications still mark as read.
- User-scoped data still respects role restrictions.
