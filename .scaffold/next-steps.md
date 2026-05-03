# Next Steps

- App local URL: `http://127.0.0.1:4429`
- Frontend local URL: `http://127.0.0.1:3429`
- Local database: `postgres://postgres@127.0.0.1:6429/trackam`
- Rerun local validation from the scaffolder repo with `npm run scaffold -- continue --project <slug>`.
- Branch pushes deploy to the mapped Railway environments.
- Bootstrap admin email: `admin@example.com`.
- Bootstrap admin credentials are stored in `.scaffold/runtime/secret-context.json` and sync into GitHub Actions secrets during provisioning.
- External GitHub Actions secrets such as `RAILWAY_API_TOKEN` still need to be available in the scaffolder root `.env` before GitHub provisioning.
- Ensure `RAILWAY_API_TOKEN` is available before GitHub provisioning.
- `BOOTSTRAP_ADMIN_EMAIL` is scaffold-managed for this app.
- `BOOTSTRAP_ADMIN_PASSWORD` is scaffold-managed for this app.
- Review the generated Railway project, environment mapping, and backend variables before the first deploy.
- Fresh Railway installs require `/install?token=3e6ebef7248c9bf7854a0b741506f73c36b1956a5abde8a1` until `APP_INSTALLED=true` is set.
