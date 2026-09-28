require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { askJarvis } = require("./handlers/ai");
const { joinVC, speakInVC, leaveVC, isInVC } = require("./handlers/voice");
const { deployCommands } = require("./commands/jarvis");

const PREFIX = "jarvis,";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once(Events.ClientReady, async (c) => {
  console.log(`[JARVIS] Online as ${c.user.tag}`);
  await deployCommands();
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  const content = message.content.toLowerCase().trim();
  if (!content.startsWith(PREFIX)) return;

  const query = message.content.slice(PREFIX.length).trim();
  if (!query) return;

  await message.channel.sendTyping();

  try {
    const reply = await askJarvis(query, message.author.username);
    await message.reply(`🤖 **J.A.R.V.I.S.:** ${reply}`);
    if (isInVC(message.guild.id)) await speakInVC(message.guild.id, reply);
  } catch (err) {
    console.error("[JARVIS] Error:", err);
    await message.reply("⚠️ *Systems momentarily offline, sir.*");
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === "jarvis") {
    const query = interaction.options.getString("question");
    await interaction.deferReply();
    try {
      const reply = await askJarvis(query, interaction.user.username);
      await interaction.editReply(`🤖 **J.A.R.V.I.S.:** ${reply}`);
      if (isInVC(interaction.guild.id)) await speakInVC(interaction.guild.id, reply);
    } catch (err) {
      console.error("[JARVIS] Slash error:", err);
      await interaction.editReply("⚠️ *Neural link disrupted.*");
    }
  }

  if (commandName === "jarvis-join") {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) return interaction.reply({ content: "❌ Join a voice channel first, sir.", ephemeral: true });
    await interaction.deferReply();
    try {
      await joinVC(voiceChannel);
      await interaction.editReply(`✅ **J.A.R.V.I.S.** joined **${voiceChannel.name}**`);
      await speakInVC(interaction.guild.id, "J.A.R.V.I.S. online. Good to see you again, sir.");
    } catch (err) {
      console.error("[JARVIS] VC error:", err);
      await interaction.editReply("⚠️ *Failed to establish voice link.*");
    }
  }

  if (commandName === "jarvis-leave") {
    await interaction.deferReply();
    const left = leaveVC(interaction.guild.id);
    await interaction.editReply(left ? "👋 *J.A.R.V.I.S. standing down.*" : "❓ *I wasn't in a voice channel, sir.*");
  }
});

client.login(process.env.DISCORD_TOKEN);