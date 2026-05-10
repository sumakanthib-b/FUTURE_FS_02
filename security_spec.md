# Security Specification for LeadFlow CRM

## 1. Data Invariants
- **Leads**:
    - `name`: string, max 128 chars.
    - `email`: string, format email, max 128 chars.
    - `status`: one of ['new', 'contacted', 'converted'].
    - `createdAt`, `updatedAt`: server timestamps.
- **Notes**:
    - `authorId`: must match `request.auth.uid`.
    - `text`: string, max 2048 chars.
    - `createdAt`: server timestamp.
- **Admins**:
    - Only existing admins can add other admins (or we assume a manual bootstrap for the first one).

## 2. The "Dirty Dozen" Payloads (Denial Expected)
1. **Unauth Read**: Read any lead without being signed in.
2. **Unauth Update**: Update lead status without being signed in.
3. **Unauth Note**: Create a note for a lead without being signed in.
4. **Lead PII Leak**: Authenticated non-admin user reading lead emails.
5. **Shadow Update**: Updating a lead with a hidden `isVerified: true` field.
6. **Status Hijack**: Changing lead status from 'new' directly to 'converted' without proper auth.
7. **Identity Spoofing**: Admin A creating a note as Admin B (`authorId` mismatch).
8. **Orphaned Note**: Creating a note for a lead that doesn't exist.
9. **Resource Poisoning**: Creating a lead with a name that is 1MB in size.
10. **Timestamp Fraud**: Setting `createdAt` to a future date from the client.
11. **Malicious ID**: Creating a lead with a 1.5KB string as subcollection ID.
12. **Admin Self-Promotion**: A user creating an admin document for themselves.

## 3. Test Runner
I will create `firestore.rules.test.ts` to verify these.
