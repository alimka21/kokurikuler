const fetch = require('node-fetch');

async function check() {
  try {
    const res = await fetch('https://ndawqyzvvyzqtqyxchjl.supabase.co');
    console.log(res.status);
  } catch (e) {
    console.log(e.message);
  }
}

check();
