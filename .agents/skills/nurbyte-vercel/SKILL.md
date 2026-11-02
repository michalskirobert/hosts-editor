---
name: nurbyte-vercel
description: Prepare and verify NurByte web previews and explicitly approved production changes.
---

Read .nurbyte/settings.json and .nurbyte/REMOTE-SETUP.md. Unfilled fields are blockers for the dependent external action, not invitations to guess. Use isolated Preview data and secrets; do not export local secrets. Inspect existing Vercel settings and preserve crons. Check DocFlow pdfinfo availability, private storage persistence, HTTPS auth/cookies and database compatibility. No migration as an incidental build step. Production deploy, promotion, rollback, environment edits and feed changes require explicit user approval. Deployment Protection controls visitors, not publication authorization. Report exact deployment URL/commit and actual checks.
