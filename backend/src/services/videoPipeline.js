import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { env } from '../config/env.js';
import { generateScriptAndTitle, estimateTextCost } from './providers/openaiText.js';
import { generateImages, estimateImageCost } from './providers/geminiImages.js';
import { generateVoiceover, estimateTtsCost } from './providers/openaiTts.js';
import { log } from '../utils/logger.js';

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) =>
      code === 0
        ? resolve(out.trim())
        : reject(new Error(`${cmd} exited ${code}: ${err.slice(-3000)}`))
    );
  });

export function escapeDrawtext(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%')
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function captionFilters(script, duration) {
  const words = script.replace(/\s+/g, ' ').trim().split(' ');
  const groups = [];
  for (let i = 0; i < words.length; i += 4) groups.push(words.slice(i, i + 4).join(' '));
  return groups.map((g, i) => {
    const start = Math.max(0, (duration * i) / groups.length);
    const end = Math.min(duration, (duration * (i + 1)) / groups.length);
    return `drawtext=text='${escapeDrawtext(
      g
    )}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.55:boxborderw=16:x=(w-text_w)/2:y=h-text_h-190:enable='between(t,${start.toFixed(
      2
    )},${end.toFixed(2)})'`;
  });
}

export async function generateVideo({ videoDoc, channel, preferences }) {
  await fs.mkdir(env.VIDEO_TMP_DIR, { recursive: true });
  const work = await fs.mkdtemp(path.join(env.VIDEO_TMP_DIR, `${videoDoc._id}-`));

  try {
    const content = await generateScriptAndTitle({
      niche: preferences.niche,
      style: preferences.videoStyle,
      language: preferences.language,
      avoidTopics: preferences.avoidTopics,
      exampleChannel: preferences.exampleChannel,
      channelSeed: channel.channelId,
    });

    const images = await generateImages({
      script: content.script,
      style: preferences.videoStyle,
      count: 4,
    });

    const imagePaths = [];
    for (let i = 0; i < images.length; i++) {
      const p = path.join(work, `scene-${i}.png`);
      await fs.writeFile(p, images[i].buffer);
      imagePaths.push(p);
    }

    const voiceKey = `${preferences.voiceGender}_${preferences.voiceTone}`;
    const voice =
      {
        male_calm: 'onyx',
        male_energetic: 'echo',
        female_calm: 'nova',
        female_energetic: 'shimmer',
      }[voiceKey] || 'nova';

    const audio = await generateVoiceover({ script: content.script, voice, speed: 1.05 });
    const audioPath = path.join(work, 'voice.mp3');
    await fs.writeFile(audioPath, audio);

    // Uses global ffprobe installed by Docker
    const duration = Number(
      await run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        audioPath,
      ])
    );

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Unable to determine voiceover duration with ffprobe');
    }

    const per = duration / images.length;
    const args = [];
    for (const p of imagePaths) args.push('-loop', '1', '-t', per.toFixed(3), '-i', p);
    args.push('-i', audioPath);

    const filters = [];
    imagePaths.forEach((_, i) =>
      filters.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0005,1.08)':d=${Math.ceil(
          per * 30
        )}:s=1080x1920:fps=30,setsar=1,trim=duration=${per.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`
      )
    );
    filters.push(
      `${imagePaths.map((_, i) => `[v${i}]`).join('')}concat=n=${
        imagePaths.length
      }:v=1:a=0[base]`
    );

    const captions = captionFilters(content.script, duration);
    let current = 'base';
    captions.forEach((f, i) => {
      const next = `cap${i}`;
      filters.push(`[${current}]${f}[${next}]`);
      current = next;
    });

    args.push(
      '-filter_complex',
      filters.join(';'),
      '-map',
      `[${current}]`,
      '-map',
      `${imagePaths.length}:a`,
      '-t',
      duration.toFixed(3),
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '23',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      '-shortest',
      '-y',
      path.join(work, 'render.mp4')
    );

    // Uses global ffmpeg installed by Docker
    await run('ffmpeg', args);

    const outputDir = path.resolve(env.VIDEO_OUTPUT_DIR);
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `${videoDoc._id}.mp4`);
    await fs.copyFile(path.join(work, 'render.mp4'), filePath);

    const cost = {
      text: estimateTextCost(),
      images: estimateImageCost(images.length),
      tts: estimateTtsCost(content.script.length),
    };
    cost.total = Number((cost.text + cost.images + cost.tts).toFixed(4));

    return { ...content, filePath, durationSec: duration, cost };
  } finally {
    await fs
      .rm(work, { recursive: true, force: true })
      .catch((err) => log.warn('Temporary directory cleanup failed', err.message));
  }
}