// One-off local-dev helper: sets a Clerk user's privateMetadata.role.
// Needed after MT-105 changed the role model from a single "admin" string
// to "superAdmin" | "theaterAdmin" (+ theaterId for theaterAdmin).
//
// Usage:
//   node scripts/setAdminRole.js --list
//     Lists users with their id/email/current role, so you can find the right userId.
//
//   node scripts/setAdminRole.js --userId=<clerkUserId> --role=superAdmin
//     Sets that user's privateMetadata.role to superAdmin.
//
//   node scripts/setAdminRole.js --userId=<clerkUserId> --role=theaterAdmin --theaterId=<mongoTheaterId>
//     Sets that user's role to theaterAdmin, scoped to the given theater.
import 'dotenv/config';
import { clerkClient } from '@clerk/express';

function parseArgs() {
    const args = {};
    for (const arg of process.argv.slice(2)) {
        if (arg === '--list') {
            args.list = true;
            continue;
        }
        const [key, value] = arg.replace(/^--/, '').split('=');
        args[key] = value;
    }
    return args;
}

async function listUsers() {
    const { data: users } = await clerkClient.users.getUserList({ limit: 50 });
    if (users.length === 0) {
        console.log('No users found.');
        return;
    }
    console.log('Users:');
    for (const user of users) {
        const email = user.emailAddresses[0]?.emailAddress || '(no email)';
        const role = user.privateMetadata?.role || '(none)';
        const theaterId = user.privateMetadata?.theaterId || '';
        console.log(`  ${user.id}  ${email}  role=${role}${theaterId ? ` theaterId=${theaterId}` : ''}`);
    }
}

async function setRole({ userId, role, theaterId }) {
    if (!userId) {
        throw new Error('--userId is required. Run with --list to find it.');
    }
    if (!['superAdmin', 'theaterAdmin'].includes(role)) {
        throw new Error("--role must be 'superAdmin' or 'theaterAdmin'.");
    }
    if (role === 'theaterAdmin' && !theaterId) {
        throw new Error('--theaterId is required when --role=theaterAdmin.');
    }

    const privateMetadata = role === 'theaterAdmin' ? { role, theaterId } : { role };

    const updated = await clerkClient.users.updateUserMetadata(userId, { privateMetadata });

    console.log(`Updated ${userId} -> privateMetadata:`, updated.privateMetadata);
}

async function main() {
    const args = parseArgs();

    if (args.list) {
        await listUsers();
        return;
    }

    await setRole(args);
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
