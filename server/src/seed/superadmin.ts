/**
 * Seeds (or updates) the single platform Super Admin from env vars.
 * Run once after configuring SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD:
 *   npm run seed:superadmin
 */
import { connectDatabase, disconnectDatabase } from '../config/db';
import { env } from '../config/env';
import { User } from '../models/User';
import { fullPermissions, fullModules } from '../utils/permissions';
import { logger } from '../utils/logger';

async function seed() {
  await connectDatabase();

  const email = env.superAdmin.email.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = 'superadmin';
    existing.status = 'active';
    existing.level = 10;
    existing.permissions = fullPermissions();
    existing.modules = fullModules();
    existing.organization = null;
    // Reset the password to the configured one so it's always known.
    existing.password = env.superAdmin.password;
    await existing.save();
    logger.info(`Super admin updated: ${email}`);
  } else {
    await User.create({
      name: env.superAdmin.name,
      email,
      password: env.superAdmin.password,
      role: 'superadmin',
      status: 'active',
      level: 10,
      permissions: fullPermissions(),
      modules: fullModules(),
      organization: null,
    });
    logger.info(`Super admin created: ${email}`);
  }

  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Failed to seed super admin', err);
  process.exit(1);
});
