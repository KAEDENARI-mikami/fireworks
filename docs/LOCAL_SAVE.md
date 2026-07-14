# Local Save and Encrypted Backup

Fireworks stores automatic progress only in the device's local app storage. It does not use an account, cloud save, analytics database, or a game backend.

From the title screen, select `セーブデータ` to create or restore a backup.

- Backups use AES-256-GCM encryption.
- The encryption key is derived from the backup passphrase with PBKDF2-SHA-256 and 600,000 iterations.
- Each backup gets a new random 16-byte salt and 12-byte IV.
- The GCM authentication tag rejects altered files and incorrect passphrases.
- A backup includes permanent progression, the resumable main run, and parallel tower runs.

There is no passphrase recovery. The automatic device-local save remains intentionally separate from the exported encrypted backup so that normal play does not require a passphrase at every launch.
