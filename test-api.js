const fetch = require('node-fetch');

const baseUrl = 'https://confluence.example.com/wiki';
const spaceKey = 'MRR';
const email = process.env.CONFLUENCE_EMAIL;
const apiToken = process.env.CONFLUENCE_API_TOKEN;

console.log('Testing Confluence API...');
console.log('Base URL:', baseUrl);
console.log('Email:', email);
console.log('API Token:', apiToken ? '***' : 'MISSING');

const url = `${baseUrl}/rest/api/content?spaceKey=${spaceKey}&limit=1`;
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${apiToken}`,
  'X-Atlassian-Token': 'nocheck',
};

console.log('\nRequest URL:', url);
console.log('Headers:', { ...headers, Authorization: '***' });

fetch(url, { method: 'GET', headers })
  .then(res => {
    console.log('\nResponse Status:', res.status);
    console.log('Response Headers:', Object.fromEntries(res.headers));
    return res.text();
  })
  .then(text => {
    console.log('\nResponse Body (first 500 chars):');
    console.log(text.substring(0, 500));
    if (text.startsWith('<')) {
      console.log('\n⚠️  HTML response received - authentication may have failed');
    }
  })
  .catch(err => console.error('Error:', err.message));
