---
'@liqui-design/glass': patch
---

Add `author` and `bugs` to the package manifest, so npm links back to the
issue tracker now that the repository is public.

This release also exercises the automated publish path for the first time.
0.2.0 was pushed by hand before trusted publishing could be configured — npm
requires a package to exist before you can name a trusted publisher for it — so
this is the first version whose provenance is attested.
