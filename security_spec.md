# Security notes

Firebase Authentication is the only login authority. No Firestore password hashes or localStorage-based authentication are used by this version.

Users may read their own profiles and records. Only trusted admin custom claims authorize shared-content writes and application approvals. Public informational collections must never contain private user data. The Realtime Database defaults to deny-all.

Rules must be deployed separately; GitHub uploads cannot change live Firebase access. Before using real records, run emulator tests for unauthenticated access, cross-user reads/writes, role injection, approval tampering and malformed submissions. Validate all application fields for a production deployment. This package does not claim a completed production audit.
