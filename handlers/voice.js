const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require("@discordjs/voice");
const googleTTS = require("google-tts-api");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

let activeConnections = new Map();

async function joinVC(channel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });

  const player = createAudioPlayer();
  connection.subscribe(player);
  await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
  activeConnections.set(channel.guild.id, { connection, player });
  return { connection, player };
}

async function speakInVC(guildId, text) {
  const entry = activeConnections.get(guildId);
  if (!entry) return false;

  const { player } = entry;

  const url = googleTTS.getAudioUrl(text, {
    lang: "en",
    slow: false,
    host: "https://translate.google.com",
  });

  const tmpFile = path.join(__dirname, `../tmp_${guildId}.mp3`);

  const audioResponse = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(tmpFile);
    audioResponse.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  const resource = createAudioResource(tmpFile);
  player.play(resource);

  await new Promise((resolve) => {
    player.once(AudioPlayerStatus.Idle, () => {
      fs.unlink(tmpFile, () => {});
      resolve();
    });
  });

  return true;
}

function leaveVC(guildId) {
  const entry = activeConnections.get(guildId);
  if (!entry) return false;
  entry.connection.destroy();
  activeConnections.delete(guildId);
  return true;
}

function isInVC(guildId) {
  return activeConnections.has(guildId);
}

module.exports = { joinVC, speakInVC, leaveVC, isInVC };