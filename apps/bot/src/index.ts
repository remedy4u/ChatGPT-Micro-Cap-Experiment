import 'dotenv/config';
import { Bot, InlineKeyboard, InputFile } from 'grammy';
import axios from 'axios';
import pino from 'pino';

const log = pino();
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || '');
const apiBase = `http://api:${process.env.API_PORT || 3001}`;

const session = new Map<number, { sourceImageKey?: string; pack?: string; params?: Record<string, unknown> }>();

bot.command('start', async (ctx) => {
  const kb = new InlineKeyboard().text('Try free set', 'try_free').text('Buy credits', 'buy_menu');
  await ctx.reply('Welcome to CarTune MVP. Send a clear 3/4 front car photo, then pick a tuning pack.', { reply_markup: kb });
});

bot.on(':photo', async (ctx) => {
  const message = ctx.message;
  const from = ctx.from;
  if (!message || !from) return;
  const photo = message.photo.at(-1);
  if (!photo) return;
  const tgId = from.id;
  const file = await ctx.api.getFile(photo.file_id);
  const sourceImageKey = `telegram/${tgId}/${Date.now()}-${photo.file_id}.jpg`;
  session.set(tgId, { ...(session.get(tgId) || {}), sourceImageKey });
  await ctx.reply('Photo received. Choose a pack:', {
    reply_markup: new InlineKeyboard()
      .text('Wrap', 'pack_wrap')
      .text('Wheels', 'pack_wheels')
      .row()
      .text('Stance', 'pack_stance')
      .text('Lights/Tint', 'pack_lights_tint')
  });
  await ctx.reply(`Tip: Best results with good lighting and visible full car angle. file_path=${file.file_path}`);
});

bot.callbackQuery(/pack_(.+)/, async (ctx) => {
  const pack = ctx.match[1];
  const tgId = ctx.from.id;
  const state = session.get(tgId) || {};
  state.pack = pack;
  state.params = defaultParams(pack);
  session.set(tgId, state);
  await ctx.reply(`Selected ${pack}. Generate 6 variants?`, { reply_markup: new InlineKeyboard().text('Generate 6 variants', 'generate').row().text('Refine', 'refine') });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery('try_free', async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Send a photo to use your free trial set.' });
});

bot.callbackQuery('buy_menu', async (ctx) => {
  await ctx.reply('Top-up options:', { reply_markup: new InlineKeyboard().text('1 set', 'buy_sku_1').text('5 sets', 'buy_sku_5').text('20 sets', 'buy_sku_20') });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/buy_(.+)/, async (ctx) => {
  const sku = ctx.match[1];
  await axios.post(`${apiBase}/users/${ctx.from.id}/topup`, { sku });
  await ctx.reply(`Purchased ${sku} via manual top-up stub.`);
  await ctx.answerCallbackQuery();
});

bot.callbackQuery('refine', async (ctx) => {
  await ctx.reply('Send refine text like: same, but 20% lower, wheels +1 size.');
  await ctx.answerCallbackQuery();
});

bot.on('message:text', async (ctx) => {
  const tgId = ctx.from.id;
  const state = session.get(tgId);
  if (state?.pack && state.params && !ctx.message.text.startsWith('/')) {
    state.params.refineText = ctx.message.text;
    session.set(tgId, state);
    await ctx.reply('Refinement noted. Press Generate.');
  }
});

bot.callbackQuery('generate', async (ctx) => {
  const tgId = ctx.from.id;
  const state = session.get(tgId);
  if (!state?.pack || !state.sourceImageKey) {
    await ctx.reply('Please upload a photo and select a pack first.');
    return;
  }
  const idempotencyKey = `${tgId}-${Date.now()}`;
  const response = await axios.post(`${apiBase}/jobs`, {
    telegramId: tgId,
    packType: state.pack,
    params: state.params,
    sourceImageKey: state.sourceImageKey,
    idempotencyKey,
    variants: 6,
    hd: false
  });
  const jobId = response.data.jobId;
  await ctx.reply(`Job queued (#${jobId}). I will send results when ready.`);
  await ctx.answerCallbackQuery();

  const timer = setInterval(async () => {
    const status = await axios.get(`${apiBase}/jobs/${jobId}`).then((r) => r.data);
    if (status.status === 'succeeded') {
      clearInterval(timer);
      const images = status.result_keys.map((k: string) => `http://minio:9000/${process.env.S3_BUCKET}/${k}`);
      for (const image of images) {
        await ctx.replyWithPhoto(new InputFile(await axios.get(image, { responseType: 'arraybuffer' }).then((r) => Buffer.from(r.data))));
      }
      if (status.collage_key) {
        const collage = `http://minio:9000/${process.env.S3_BUCKET}/${status.collage_key}`;
        await ctx.replyWithPhoto(new InputFile(await axios.get(collage, { responseType: 'arraybuffer' }).then((r) => Buffer.from(r.data))));
      }
      await ctx.reply('Done. Options:', { reply_markup: new InlineKeyboard().text('Refine', 'refine').text('New set', 'generate').row().text('Buy credits', 'buy_menu').text('Export HD', 'export_hd') });
    }
    if (status.status === 'failed') {
      clearInterval(timer);
      await ctx.reply('Generation failed. Please try again.');
    }
  }, 3000);
});

bot.callbackQuery('export_hd', async (ctx) => {
  await ctx.reply('HD export: resubmit generation with hd=true (UI stub in MVP).');
  await ctx.answerCallbackQuery();
});

bot.catch((e) => log.error(e.error));
bot.start();
log.info('Bot started');

function defaultParams(pack: string) {
  if (pack === 'wrap') return { preset: 'nardo gray', finish: 'gloss' };
  if (pack === 'wheels') return { preset: 'mesh', sizeDelta: 1 };
  if (pack === 'stance') return { preset: 'street', stanceMm: -20 };
  return { preset: 'blackout trim', tintPercent: 35 };
}
