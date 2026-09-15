# ANDRI GALERI + MAILTEMP — VERCEL

Upload the files directly to the root of a GitHub repository, then import that repository into Vercel.

Required structure:

- index.html
- style.css
- app.js
- package.json
- vercel.json
- api/mail-create.js
- api/mail-inbox.js
- api/mail-message.js
- api/health.js

The MailTemp backend uses Mail.tm. The mailbox can receive messages while the provider keeps the account active. It cannot be guaranteed permanent forever because the provider controls account lifetime.

No API key is required for Mail.tm.
