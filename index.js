const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ================= IDS =================
const CANAL_FICHAJE_ID = "1464800605892640769";
const CANAL_LOGS_ID = "1465075808128209168";
const GUILD_ID = "1464776222344220694";

// ================= DATA =================
const DATA_FILE = "./data.json";

let data = fs.existsSync(DATA_FILE)
  ? JSON.parse(fs.readFileSync(DATA_FILE))
  : { turnos: {}, horas: {} };

function guardarData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ================= HORA GUATEMALA =================
function horaLocal() {
  return new Date().toLocaleString("es-GT", {
    timeZone: "America/Guatemala",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

// ================= FORMATO HORAS =================
function horasYMinutos(decimal) {
  const horas = Math.floor(decimal);
  const minutos = Math.round((decimal - horas) * 60);
  return `${horas} horas ${minutos} minutos`;
}

// ================= READY =================
client.once(Events.ClientReady, async () => {
  console.log(`☕🎀 UWU Time está online como ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("horas")
      .setDescription("Ver horas acumuladas de un empleado")
      .addUserOption(opt =>
        opt.setName("usuario").setDescription("Empleado").setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("reiniciar_horas")
      .setDescription("Reiniciar horas semanales (manual)")
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, GUILD_ID),
    { body: commands }
  );

  const canalFichaje = await client.channels.fetch(CANAL_FICHAJE_ID);
  const mensajes = await canalFichaje.messages.fetch({ limit: 10 });

  if (!mensajes.some(m => m.author.id === client.user.id)) {
    const embed = new EmbedBuilder()
      .setTitle("Uwu Café ☕🎀")
      .setColor(0xF6A5C0)
      .setDescription("Usa los botones para registrar tu turno 💖");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_shift")
        .setLabel("🧁 Iniciar su turno")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("end_shift")
        .setLabel("🍰 Finalizar su jornada")
        .setStyle(ButtonStyle.Danger)
    );

    await canalFichaje.send({ embeds: [embed], components: [row] });
  }
});

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async interaction => {

  // ================= BOTONES =================
  if (interaction.isButton()) {

    await interaction.deferReply({ flags: 64 });

    const canalLogs = await client.channels.fetch(CANAL_LOGS_ID);
    const ahora = Date.now();

    if (interaction.customId === "start_shift") {

      if (data.turnos[interaction.user.id]) {
        return interaction.editReply("🧸 Ya tienes un turno activo 🍬");
      }

      data.turnos[interaction.user.id] = ahora;
      guardarData();

      await canalLogs.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🧁 Inicio de turno")
            .setColor(0xF6A5C0)
            .setDescription(
              `👤 **Empleado:** ${interaction.user.username}\n` +
              `🕒 **Hora:** ${horaLocal()}\n\n☕🎀`
            )
        ]
      });

      return interaction.editReply("🧁 Tu turno ha sido registrado correctamente 💖");
    }

    if (interaction.customId === "end_shift") {

      const inicio = data.turnos[interaction.user.id];

      if (!inicio) {
        return interaction.editReply("🍰 No tienes un turno activo 🧸");
      }

      const duracion = (ahora - inicio) / 3600000;
      delete data.turnos[interaction.user.id];

      data.horas[interaction.user.id] =
        (data.horas[interaction.user.id] || 0) + duracion;

      guardarData();

      await canalLogs.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🍰 Fin de jornada")
            .setColor(0xF6A5C0)
            .setDescription(
              `👤 **Empleado:** ${interaction.user.username}\n` +
              `🕒 **Hora:** ${horaLocal()}\n` +
              `⏱️ **Duración:** ${horasYMinutos(duracion)}\n\n☕🎀`
            )
        ]
      });

      return interaction.editReply("🍰 Tu jornada ha sido cerrada con éxito 🌸");
    }
  }

  // ================= SLASH COMMANDS =================
  if (interaction.isChatInputCommand()) {

    await interaction.deferReply();

    if (interaction.commandName === "horas") {

      const user = interaction.options.getUser("usuario");
      const total = data.horas[user.id] || 0;

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xF6A5C0)
            .setTitle("⏱️ Horas semanales")
            .setDescription(
              `👤 **${user.username}**\n` +
              `🕒 **Total:** ${horasYMinutos(total)}\n\n☕🎀`
            )
        ]
      });
    }

    if (interaction.commandName === "reiniciar_horas") {
      data.horas = {};
      guardarData();
      return interaction.editReply("🔄 Horas semanales reiniciadas correctamente ☕🎀");
    }
  }

});

// ================= MINI SERVER =================

client.login(process.env.TIME_TOKEN);
