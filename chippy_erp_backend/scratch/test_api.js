import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:5000/api/permissions/5', {
    headers: { 'Authorization': 'Bearer ' + 'TOKEN_NOT_NEEDED_IF_I_SKIP_MIDDLEWARE_BUT_I_WILL_USE_DIRECT_PRISMA_INSTEAD' }
  });
  // Actually I'll just use prisma directly to be sure what's in DB
}
