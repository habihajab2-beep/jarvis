const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const commands = [
  new SlashCommandBuilder()
    .setName("jarvis")
    .setDescription("Talk to J.A.R.V.I.S.")
    .addStringOption((opt) =>
      opt.setName("question").setDescription("What do you want to ask?").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("jarvis-join")
    .setDescription("Summon J.A.R.V.I.S. to your voice channel"),
  new SlashCommandBuilder()
    .setName("jarvis-leave")
    .setDescription("Dismiss J.A.R.V.I.S. from voice"),
].map((cmd) => cmd.toJSON());

async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  console.log("[JARVIS] Deploying slash commands...");
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log("[JARVIS] Commands deployed.");
}

module.exports = { deployCommands };