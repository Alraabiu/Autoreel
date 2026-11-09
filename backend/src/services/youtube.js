import { google } from 'googleapis';
import { env } from '../config/env.js';
import { encrypt, decrypt } from './crypto.js';
import Channel from '../models/Channel.js';

export function oauthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth is not configured');
  }
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state,
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });
}

export async function exchangeCodeForTokens(code) {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const yt = google.youtube({ version: 'v3', auth: client });
  const response = await yt.channels.list({ part: ['snippet'], mine: true, maxResults: 1 });
  const item = response.data.items?.[0];
  if (!item) throw new Error('No YouTube channel was found for this Google account');
  return {
    tokens,
    channel: {
      channelId: item.id,
      title: item.snippet?.title || 'YouTube channel',
      thumbnail: item.snippet?.thumbnails?.default?.url || '',
    },
  };
}

export async function saveChannelForUser(userId, tokens, channel) {
  if (!tokens.refresh_token) {
    const existing = await Channel.findOne({ user: userId, channelId: channel.channelId });
    if (existing) tokens.refresh_token = decrypt(existing.encryptedRefreshToken);
  }
  if (!tokens.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Revoke AutoReel access in Google settings and reconnect.'
    );
  }
  return Channel.findOneAndUpdate(
    { user: userId, channelId: channel.channelId },
    {
      $set: {
        title: channel.title,
        thumbnail: channel.thumbnail,
        encryptedAccessToken: encrypt(tokens.access_token || ''),
        encryptedRefreshToken: encrypt(tokens.refresh_token),
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        connectedAt: new Date(),
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
}

export async function authedClientForChannel(channelDoc) {
  const client = oauthClient();
  client.setCredentials({
    access_token: decrypt(channelDoc.encryptedAccessToken),
    refresh_token: decrypt(channelDoc.encryptedRefreshToken),
    expiry_date: channelDoc.tokenExpiresAt?.getTime(),
  });

  if (
    !channelDoc.tokenExpiresAt ||
    channelDoc.tokenExpiresAt.getTime() <= Date.now() + 60000
  ) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    if (credentials.access_token) channelDoc.encryptedAccessToken = encrypt(credentials.access_token);
    if (credentials.refresh_token) channelDoc.encryptedRefreshToken = encrypt(credentials.refresh_token);
    if (credentials.expiry_date) channelDoc.tokenExpiresAt = new Date(credentials.expiry_date);
    await channelDoc.save();
  }

  return client;
}

export async function uploadVideo(channelDoc, { filePath, title, description }) {
  const auth = await authedClientForChannel(channelDoc);
  const yt = google.youtube({ version: 'v3', auth });
  const response = await yt.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title: String(title).slice(0, 100), description, categoryId: '22' },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    },
    media: { body: (await import('node:fs')).createReadStream(filePath) },
  });
  if (!response.data.id) throw new Error('YouTube did not return a video ID');
  return response.data.id;
}